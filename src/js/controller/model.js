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

        QOE.model(this);

        this.setup = function(config) {
            if (config.cookies) {
                storage.model(this);
                _cookies = storage.getAllItems();
            }

            this.config = _.extend({}, config, _cookies);

            _.extend(this, this.config, {
                // Initial state, upon setup
                state: states.IDLE,
                fullscreen: false,
                scrubbing : false,
                duration: 0,
                position: 0,
                buffer: 0
            });

            // Mobile doesn't support autostart
            if (utils.isMobile()) {
                this.autostart = false;
            }

            this.updateProviders();

            return this;
        };

        this.updateProviders = function() {
            _providers = new Providers(_this.config);
        };

        function _videoEventHandler(evt) {
            switch (evt.type) {
                case 'volume':
                case 'mute':
                    this.set(evt.type, evt[evt.type]);
                    return;

                case events.JWPLAYER_PLAYER_STATE:
                    this.mediaModel.set('state', evt.newstate);

                    // This "return" is important because
                    //  we are choosing to not propagate this event.
                    //  Instead letting the master controller do so
                    return;

                case events.JWPLAYER_MEDIA_BUFFER:
                    this.set('buffer', evt.bufferPercent); // note value change
                    break;

                case events.JWPLAYER_MEDIA_BUFFER_FULL:
                    // media controller
                    this.playVideo();
                    break;

                case events.JWPLAYER_MEDIA_TIME:
                    this.mediaModel.set('position', evt.position);
                    this.mediaModel.set('duration', evt.duration);
                    this.set('position', evt.position);
                    this.set('duration', evt.duration);
                    break;
                case events.JWPLAYER_PROVIDER_CHANGED:
                    this.set('provider', _provider.getName());
                    break;

                case events.JWPLAYER_MEDIA_LEVELS:
                    this.setQualityLevel(evt.currentQuality, evt.levels);
                    this.mediaModel.set('levels', evt.levels);
                    break;
                case events.JWPLAYER_MEDIA_LEVEL_CHANGED:
                    this.setQualityLevel(evt.currentQuality, evt.levels);
                    break;
                case events.JWPLAYER_AUDIO_TRACKS:
                    this.setCurrentAudioTrack(evt.currentTrack, evt.tracks);
                    this.mediaModel.set('audioTracks', evt.tracks);
                    break;
                case events.JWPLAYER_AUDIO_TRACK_CHANGED:
                    this.setCurrentAudioTrack(evt.currentTrack, evt.tracks);
                    break;

                case 'visualQuality':
                    var visualQuality = _.extend({}, evt);
                    delete visualQuality.type;
                    this.mediaModel.set('visualQuality', visualQuality);
                    break;
            }

            this.mediaController.trigger(evt.type, evt);
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
                _provider.removeGlobalListener(_videoEventHandler);
                container = _provider.getContainer();
                if (container) {
                    _provider.remove();
                }
            }

            _currentProvider = new Provider(_this.id, _this.config);

            if (container) {
                _currentProvider.setContainer(container);
            }

            this.set('provider', _currentProvider.getName());

            _provider = _currentProvider;
            _provider.volume(_this.volume);
            _provider.mute(_this.mute);
            _provider.addGlobalListener(_videoEventHandler.bind(this));
        };

        this.destroy = function() {
            if (_provider) {
                _provider.removeGlobalListener(_videoEventHandler);
                _provider.destroy();
            }
        };

        this.getVideo = function() {
            return _provider;
        };


        this.setFullscreen = function(state) {
            state = !!state;
            if (state !== _this.fullscreen) {
                _this.set('fullscreen', state);
            }
        };

        // TODO: make this a synchronous action; throw error if playlist is empty
        this.setPlaylist = function(p) {
            var playlist = Playlist(p);

            playlist = Playlist.filterPlaylist(playlist, _providers, _this.get('androidhls'), this.get('drm'));

            if (playlist.length === 0) {
                this.playlist = [];
                this.mediaController.trigger(events.JWPLAYER_ERROR, {
                    message: 'Error loading playlist: No playable sources found'
                });
                return;
            }

            this.set('playlist', playlist);
            this.setItem(0);
        };

        // Give the option for a provider to be forced
        this.chooseProvider = function(source) {
            return _providers.choose(source);
        };

        this.setItem = function(index) {
            var playlist = _this.get('playlist');

            // If looping past the end, or before the beginning
            var newItem = (index + playlist.length) % playlist.length;

            // Item is actually changing
            this.mediaModel.off();
            this.set('mediaModel', new MediaModel());

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

            // this allows the Youtube provider to load preview images
            if (_currentProvider.init) {
                _currentProvider.init(item);
            }

            this.trigger('setItem');
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
                state = !_this.mute;
            }
            _this.set('mute', state);
            if (_provider) {
                _provider.mute(state);
            }
            if (!state) {
                var volume = Math.max(20, _this.get('volume'));
                this.setVolume(volume);
            }
        };

        // The model is also the mediaController for now
        this.loadVideo = function(item) {
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
        this.state = states.IDLE;
    };



    _.extend(Model.prototype, SimpleModel);
    _.extend(MediaModel.prototype, SimpleModel);

    return Model;
});
