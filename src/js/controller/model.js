define([
    'utils/helpers',
    'playlist/playlist',
    'providers/providers',
    'controller/storage',
    'controller/qoe',
    'utils/underscore',
    'utils/backbone.events',
    'utils/simplemodel',
    'events/events',
    'events/states'
], function(utils, Playlist, Providers, storage, QOE, _, Events, SimpleModel, events, states) {

    // Represents the state of the player
    var Model = function() {
        var _this = this,
            // Video provider
            _providers,
            _provider,
            // Saved settings
            _cookies = {},
            _currentProvider = utils.noop;

        this.mediaController = _.extend({}, Events);
        this.mediaModel = new MediaModel();
        this.set('mediaModel', this.mediaModel);

        QOE.model(this);

        this.setup = function(config) {
            if (config.cookies) {
                storage.model(this);
                _cookies = storage.getAllItems();
            }

            _.extend(this.attributes, config, _cookies, {
                // Initial state, upon setup
                state: states.IDLE,
                fullscreen: false,
                compactUI: false,
                scrubbing : false,
                duration: 0,
                position: 0,
                buffer: 0
            });

            // Mobile doesn't support autostart
            if (utils.isMobile()) {
                this.set('autostart', false);
            }

            this.updateProviders();

            return this;
        };

        this.getConfiguration = function() {
            return _.omit(this.clone(), ['mediaModel']);
        };

        this.updateProviders = function() {
            _providers = new Providers(this.getConfiguration());
        };

        function _videoEventHandler(type, data) {
            switch (type) {
                case 'volume':
                case 'mute':
                    this.set(type, data[type]);
                    return;

                case events.JWPLAYER_MEDIA_TYPE:
                    this.mediaModel.set('mediaType', data.mediaType);
                    break;

                case events.JWPLAYER_PLAYER_STATE:
                    this.mediaModel.set('state', data.newstate);

                    // This "return" is important because
                    //  we are choosing to not propagate this event.
                    //  Instead letting the master controller do so
                    return;

                case events.JWPLAYER_MEDIA_BUFFER:
                    this.set('buffer', data.bufferPercent); // note value change
                    break;

                case events.JWPLAYER_MEDIA_BUFFER_FULL:
                    // media controller
                    if(this.mediaModel.get('playAttempt')) {
                        this.playVideo();
                    } else {
                       this.mediaModel.on('change:playAttempt', function() {
                           this.playVideo();
                       }, this);
                    }
                    break;

                case events.JWPLAYER_MEDIA_TIME:
                    this.mediaModel.set('position', data.position);
                    this.mediaModel.set('duration', data.duration);
                    this.set('position', data.position);
                    this.set('duration', data.duration);
                    break;
                case events.JWPLAYER_PROVIDER_CHANGED:
                    this.set('provider', _provider.getName());
                    break;

                case events.JWPLAYER_MEDIA_LEVELS:
                    this.setQualityLevel(data.currentQuality, data.levels);
                    this.mediaModel.set('levels', data.levels);
                    break;
                case events.JWPLAYER_MEDIA_LEVEL_CHANGED:
                    this.setQualityLevel(data.currentQuality, data.levels);
                    break;
                case events.JWPLAYER_AUDIO_TRACKS:
                    this.setCurrentAudioTrack(data.currentTrack, data.tracks);
                    this.mediaModel.set('audioTracks', data.tracks);
                    break;
                case events.JWPLAYER_AUDIO_TRACK_CHANGED:
                    this.setCurrentAudioTrack(data.currentTrack, data.tracks);
                    break;

                case 'visualQuality':
                    var visualQuality = _.extend({}, data);
                    this.mediaModel.set('visualQuality', visualQuality);
                    break;
            }

            var evt = _.extend({}, data, {type: type});
            this.mediaController.trigger(type, evt);
        }

        this.setQualityLevel = function(quality, levels){
            if (quality > -1 && levels.length > 1 && _provider.getName().name !== 'youtube') {
                this.mediaModel.set('currentLevel', parseInt(quality));
            }
        };

        this.setCurrentAudioTrack = function(currentTrack, tracks) {
            if (currentTrack > -1 && tracks.length > 1) {
                this.mediaModel.set('currentAudioTrack', parseInt(currentTrack));
            }
        };

        this.changeVideoProvider = function(Provider) {
            var container;

            if (_provider) {
                _provider.off(null, null, this);
                container = _provider.getContainer();
                if (container) {
                    _provider.remove();
                }
            }

            _currentProvider = new Provider(_this.get('id'), _this.getConfiguration());

            if (container) {
                _currentProvider.setContainer(container);
            }

            this.set('provider', _currentProvider.getName());

            _provider = _currentProvider;
            _provider.volume(_this.get('volume'));
            _provider.mute(_this.get('mute'));
            _provider.on('all', _videoEventHandler, this);
        };

        this.destroy = function() {
            if (_provider) {
                _provider.off(null, null, this);
                _provider.destroy();
            }
        };

        this.getVideo = function() {
            return _provider;
        };


        this.setFullscreen = function(state) {
            state = !!state;
            if (state !== _this.get('fullscreen')) {
                _this.set('fullscreen', state);
            }
        };

        this.setPlaylist = function(p) {
            var playlist = Playlist(p);

            playlist = Playlist.filterPlaylist(playlist, _providers, _this.get('androidhls'), this.get('drm'));

            this.set('playlist', playlist);

            if (playlist.length === 0) {
                this.mediaController.trigger(events.JWPLAYER_ERROR, {
                    message: 'Error loading playlist: No playable sources found'
                });
                return;
            }
        };

        // Give the option for a provider to be forced
        this.chooseProvider = function(source) {
            return _providers.choose(source).provider;
        };

        this.setItem = function(index) {
            var playlist = _this.get('playlist');

            // If looping past the end, or before the beginning
            var newItem = (index + playlist.length) % playlist.length;

            // Item is actually changing
            this.mediaModel.off();
            this.mediaModel = new MediaModel();
            this.set('mediaModel', this.mediaModel);

            this.set('item', newItem);
            // select provider based on item source (video, youtube...)
            var item = this.get('playlist')[newItem];
            this.set('playlistItem', item);
            var source = item && item.sources && item.sources[0];
            if (source === undefined) {
                // source is undefined when resetting index with empty playlist
                return;
            }

            var Provider = this.chooseProvider(source);
            if (!Provider) {
                throw new Error('No suitable provider found');
            }

            // If we are changing video providers
            if (!(_currentProvider instanceof Provider)) {
                _this.changeVideoProvider(Provider);
            }

            // this allows the providers to preload
            if (_currentProvider.init) {
                _currentProvider.init(item);
            }

            this.trigger('setItem');
        };

        this.resetProvider = function() {
            _currentProvider = null;
        };

        this.setVolume = function(vol) {
            vol = Math.round(vol);
            _this.set('volume', vol);
            if (_provider) {
                _provider.volume(vol);
            }
            var muted = (vol === 0);
            if (muted !== _this.get('mute')) {
                _this.setMute(muted);
            }
        };

        this.setMute = function(state) {
            if (!utils.exists(state)) {
                state = !_this.get('mute');
            }
            _this.set('mute', state);
            if (_provider) {
                _provider.mute(state);
            }
            if (!state) {
                var volume = Math.max(10, _this.get('volume'));
                this.setVolume(volume);
            }
        };

        // The model is also the mediaController for now
        this.loadVideo = function(item) {
            this.mediaModel.set('playAttempt', true);
            this.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
            if (!item) {
                var idx = this.get('item');
                item = this.get('playlist')[idx];
            }
            this.set('position', item.starttime || 0);
            this.set('duration', item.duration || 0);
            _provider.load(item);
        };

        this.playVideo = function() {
            _provider.play();
        };

        this.setVideoSubtitleTrack = function(trackIndex) {
            this.set('captionsIndex', trackIndex);

            if (_provider.setSubtitlesTrack) {
                _provider.setSubtitlesTrack(trackIndex);
            }
        };
    };

    // Represents the state of the provider/media element
    var MediaModel = Model.MediaModel = function() {
        this.set('state', states.IDLE);
    };



    _.extend(Model.prototype, SimpleModel);
    _.extend(MediaModel.prototype, SimpleModel);

    return Model;
});
