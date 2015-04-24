define([
    'utils/helpers',
    'utils/stretching',
    'playlist/playlist',
    'providers/providers',
    'controller/storage',
    'controller/qoe',
    'utils/underscore',
    'utils/backbone.events',
    'events/events',
    'events/states'
], function(utils, stretchUtils, Playlist, Providers, storage, QOE, _, Events, events, states) {

    // Defaults
    var _defaults = {
        autostart: false,
        controls: true,
        scrubbing : false,
        // debug: undefined,
        fullscreen: false,
        height: 320,
        mobilecontrols: false,
        mute: false,
        playlist: [],
        repeat: false,
        // skin: undefined,
        stretching: stretchUtils.UNIFORM,
        width: 480,
        volume: 90
    };

    // Represents the state of the player
    var Model = function() {
        var _this = this,
            // Video provider
            _providers,
            _provider,
            // Saved settings
            _cookies = {},
            // Sub-component configurations
            _componentConfigs = {
                controlbar: {},
                display: {}
            },
            _currentProvider = utils.noop;

        this.mediaController = _.extend({}, Events);
        this.mediaModel = new MediaModel();

        QOE.model(this);

        this.setup = function(config) {
            if (config.cookies) {
                storage.model(this);
                _cookies = storage.getAllItems();
            }

            this.config = _.extend({}, _defaults, _cookies, config);

            _.extend(this, this.config, {
                state: states.IDLE,
                duration: -1,
                position: 0,
                buffer: 0
            });

            _providers = new Providers(_this.config);

            return this;
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

        this.setVideoProvider = function(provider) {

            if (_provider) {
                _provider.removeGlobalListener(_videoEventHandler);
                var container = _provider.getContainer();
                if (container) {
                    _provider.remove();
                    provider.setContainer(container);
                }
            }

            this.set('provider', provider.getName());

            _provider = provider;
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

            var playlist = Playlist.filterPlaylist(p, _providers, _this.androidhls);

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

            var Provider = _providers.choose(source);
            if (!Provider) {
                throw new Error('No suitable provider found');
            }

            // If we are changing video providers
            if (!(_currentProvider instanceof Provider)) {
                _currentProvider = new Provider(_this.id, _this.config);

                _this.setVideoProvider(_currentProvider);
            }

            // this allows the Youtube provider to load preview images
            if (_currentProvider.init) {
                _currentProvider.init(item);
            }
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

        this.componentConfig = function(name) {
            if (name === 'logo') {
                return this.config.logo;
            } else {
                return _componentConfigs[name];
            }
        };

        // The model is also the mediaController for now
        this.loadVideo = function() {
            this.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
            var idx = this.get('item');
            _provider.load(this.get('playlist')[idx]);
        };

        this.playVideo = function() {
            _provider.play();
        };
    };

    // Represents the state of the provider/media element
    var MediaModel = Model.MediaModel = function() {
        this.state = states.IDLE;
    };


    var SimpleModel = _.extend({
        'get' : function (attr) {
            return this[attr];
        },
        'set' : function (attr, val) {
            if (this[attr] === val) {
                return;
            }
            var oldVal = this[attr];
            this[attr] = val;
            this.trigger('change:' + attr, this, val, oldVal);
        }
    }, Events);

    _.extend(Model.prototype, SimpleModel);
    _.extend(MediaModel.prototype, SimpleModel);

    return Model;
});
