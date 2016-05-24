define([
    'utils/helpers',
    'providers/providers',
    'controller/qoe',
    'utils/underscore',
    'utils/backbone.events',
    'utils/simplemodel',
    'events/events',
    'events/states'
], function(utils, Providers, QOE, _, Events, SimpleModel, events, states) {

    // Represents the state of the player
    var Model = function() {
        var _this = this,
            // Video provider
            _providers,
            _provider,
            _currentProvider = utils.noop;

        this.mediaController = _.extend({}, Events);
        this.mediaModel = new MediaModel();

        QOE.model(this);

        this.set('mediaModel', this.mediaModel);

        this.setup = function(config) {

            _.extend(this.attributes, config, {
                // always start on first playlist item
                item : 0,
                // Initial state, upon setup
                state: states.IDLE,
                // Initially we don't assume Flash is needed
                flashBlocked : false,
                fullscreen: false,
                compactUI: false,
                scrubbing : false,
                duration: 0,
                position: 0,
                buffer: 0
            });

            // Mobile doesn't support autostart
            // This check should be replaced with something that detects whether the current system
            // requires a user interaction to start playback
            if (utils.isMobile() && !config.mobileSdk) {
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
            var evt = _.extend({}, data, {type: type});
            switch (type) {
                case 'flashThrottle':
                    var throttled = (data.state !== 'resume');
                    this.set('flashThrottle', throttled);
                    this.set('flashBlocked', throttled);
                    break;

                case 'flashBlocked':
                    this.set('flashBlocked', true);
                    return;
                case 'flashUnblocked':
                    this.set('flashBlocked', false);
                    return;

                case 'volume':
                case 'mute':
                    this.set(type, data[type]);
                    return;

                case events.JWPLAYER_MEDIA_TYPE:
                    if (this.mediaModel.get('mediaType') !== data.mediaType) {
                        this.mediaModel.set('mediaType', data.mediaType);
                        this.mediaController.trigger(type, evt);
                    }
                    return;

                case events.JWPLAYER_PLAYER_STATE:
                    this.mediaModel.set('state', data.newstate);

                    // This "return" is important because
                    //  we are choosing to not propagate this event.
                    //  Instead letting the master controller do so
                    return;

                case events.JWPLAYER_MEDIA_BUFFER:
                    this.set('buffer', data.bufferPercent);

                    /* falls through */
                case events.JWPLAYER_MEDIA_META:
                    var duration = data.duration;
                    if (_.isNumber(duration)) {
                        this.mediaModel.set('duration', duration);
                        this.set('duration', duration);
                    }
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
                    this.set('position', data.position);
                    if (_.isNumber(data.duration)) {
                        this.mediaModel.set('duration', data.duration);
                        this.set('duration', data.duration);
                    }
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
                    this.persistQualityLevel(data.currentQuality, data.levels);
                    break;
                case events.JWPLAYER_AUDIO_TRACKS:
                    this.setCurrentAudioTrack(data.currentTrack, data.tracks);
                    this.mediaModel.set('audioTracks', data.tracks);
                    break;
                case events.JWPLAYER_AUDIO_TRACK_CHANGED:
                    this.setCurrentAudioTrack(data.currentTrack, data.tracks);
                    break;
                case 'subtitlesTrackChanged':
                    this.setVideoSubtitleTrack(data.currentTrack, data.tracks);
                    break;

                case 'visualQuality':
                    var visualQuality = _.extend({}, data);
                    this.mediaModel.set('visualQuality', visualQuality);
                    break;
            }

            this.mediaController.trigger(type, evt);
        }

        this.setQualityLevel = function(quality, levels){
            if (quality > -1 && levels.length > 1 && _provider.getName().name !== 'youtube') {
                this.mediaModel.set('currentLevel', parseInt(quality));

            }
        };

        this.persistQualityLevel = function(quality, levels) {
            var currentLevel = levels[quality] || {};
            var label = currentLevel.label;
            this.set('qualityLabel', label);
        };

        this.setCurrentAudioTrack = function(currentTrack, tracks) {
            if (currentTrack > -1 && tracks.length > 0 && currentTrack < tracks.length) {
                this.mediaModel.set('currentAudioTrack', parseInt(currentTrack));
            }
        };

        this.onMediaContainer = function () {
            var container = this.get('mediaContainer');
            _currentProvider.setContainer(container);
        };

        this.changeVideoProvider = function(Provider) {
            this.off('change:mediaContainer', this.onMediaContainer);

            if (_provider) {
                _provider.off(null, null, this);
                if (_provider.getContainer()) {
                    _provider.remove();
                }
            }

            if (!Provider) {
                _provider = _currentProvider = Provider;
                this.set('provider', undefined);
                return;
            }

            _currentProvider = new Provider(_this.get('id'), _this.getConfiguration());

            var container = this.get('mediaContainer');
            if (container) {
                _currentProvider.setContainer(container);
            } else {
                this.once('change:mediaContainer', this.onMediaContainer);
            }

            this.set('provider', _currentProvider.getName());

            if (_currentProvider.getName().name.indexOf('flash') === -1) {
                this.set('flashThrottle', undefined);
                this.set('flashBlocked', false);
            }

            _provider = _currentProvider;
            _provider.volume(_this.get('volume'));
            _provider.mute(_this.get('mute'));
            _provider.on('all', _videoEventHandler, this);
        };

        this.destroy = function() {
            this.off();
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

        // Give the option for a provider to be forced
        this.chooseProvider = function(source) {
            return _providers.choose(source).provider;
        };


        this.setActiveItem = function(item) {
            // Item is actually changing
            this.mediaModel.off();
            this.mediaModel = new MediaModel();
            this.set('mediaModel', this.mediaModel);
            this.set('position', item.starttime || 0);
            this.set('duration', item.duration || 0);

            this.setProvider(item);
        };

        this.setProvider = function(item) {
            var source = item && item.sources && item.sources[0];
            if (source === undefined) {
                // source is undefined when resetting index with empty playlist
                return;
            }

            var provider = this.chooseProvider(source);
            // If we are changing video providers
            if (!provider || !(_currentProvider instanceof provider)) {
                _this.changeVideoProvider(provider);
            }

            if (!_currentProvider) {
                return;
            }

            // this allows the providers to preload
            if (_currentProvider.init) {
                _currentProvider.init(item);
            }

            // Listening for change:item won't suffice when loading the same index or file
            // We also can't listen for change:mediaModel because it triggers whether or not
            //  an item was actually loaded
            this.trigger('itemReady', item);
        };

        this.getProviders = function() {
            return _providers;
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
            if (!item) {
                var idx = this.get('item');
                item = this.get('playlist')[idx];
            }
            this.set('position', item.starttime || 0);
            this.set('duration', item.duration || 0);
            this.mediaModel.set('playAttempt', true);
            this.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT, {'playReason': this.get('playReason')});

            _provider.load(item);
        };

        this.stopVideo = function() {
            if (_provider) {
                _provider.stop();
            }
        };

        this.playVideo = function() {
            _provider.play();
        };

        this.persistCaptionsTrack = function() {
            var track = this.get('captionsTrack');

            if (track) {
                // update preference if an option was selected
                this.set('captionLabel', track.label);
            } else {
                this.set('captionLabel', 'Off');
            }
        };


        this.setVideoSubtitleTrack = function(trackIndex, tracks) {
            this.set('captionsIndex', trackIndex);
            /*
             * Tracks could have changed even if the index hasn't.
             * Need to ensure track has data for captionsrenderer.
             */
            if(trackIndex && tracks && trackIndex <= tracks.length && tracks[trackIndex-1].data) {
                this.set('captionsTrack', tracks[trackIndex-1]);
            }

            if (_provider && _provider.setSubtitlesTrack) {
                _provider.setSubtitlesTrack(trackIndex);
            }

        };

        this.persistVideoSubtitleTrack = function(trackIndex) {
            this.setVideoSubtitleTrack(trackIndex);
            this.persistCaptionsTrack();
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
