define([
    'utils/helpers',
    'utils/stretching',
    'playlist/playlist',
    'providers/providers',
    'controller/qoe',
    'underscore',
    'utils/backbone.events',
    'events/events',
    'events/states'
], function(utils, stretchUtils, Playlist, Providers, QOE, _, Events, events, states) {

    // Defaults
    var _defaults = {
        autostart: false,
        controls: true,
        dragging : false,
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

    var Model = function(config) {
        var _this = this,
            // Video provider
            _providers,
            _provider,
            // Saved settings
            _cookies = utils.getCookies(),
            // Sub-component configurations
            _componentConfigs = {
                controlbar: {},
                display: {}
            },
            _currentProvider = utils.noop;

        function _parseConfig(config) {
            utils.foreach(config, function(i, val) {
                config[i] = utils.serialize(val);
            });
            return config;
        }

        this.config = _parseConfig(_.extend({}, _defaults, _cookies, config));

        _.extend(this, this.config, {
            state: states.IDLE,
            duration: -1,
            position: 0,
            buffer: 0
        }, Events);

        this.mediaController = _.extend({}, Events);
        this.mediaModel = {};

        QOE.model(this);

        // This gets added later
        this.set('playlist', []);

        _providers = new Providers(_this.config.primary);

        function _videoEventHandler(evt) {
            switch (evt.type) {
                case events.JWPLAYER_MEDIA_MUTE:
                    this.set('mute', evt.mute);
                    break;
                case events.JWPLAYER_MEDIA_VOLUME:
                    this.set('volume', evt.volume);
                    break;
                case events.JWPLAYER_PLAYER_STATE:
                    // These two states exist at a provider level, but the player itself expects BUFFERING
                    evt = _.extend({}, evt);
                    if (evt.newstate === states.LOADING) {
                        this.mediaController.trigger(events.JWPLAYER_PROVIDER_LOADING);
                        evt.newstate = states.BUFFERING;
                    } else if (evt.newstate === states.STALLED) {
                        this.mediaController.trigger(events.JWPLAYER_PROVIDER_STALLED);
                        evt.newstate = states.BUFFERING;
                    }
                    evt.type = evt.newstate;

                    this.set('state', evt.newstate);
                    break;
                case events.JWPLAYER_MEDIA_BUFFER:
                    this.set('buffer', evt.bufferPercent); // note value change
                    break;

                case events.JWPLAYER_MEDIA_BUFFER_FULL:
                    // media controller
                    this.playVideo();
                    break;

                case events.JWPLAYER_MEDIA_TIME:
                    this.set('position', evt.position);
                    this.set('duration', evt.duration);
                    break;
                case events.JWPLAYER_PROVIDER_CHANGED:
                    this.set('provider', _provider.getName());
                    break;
                case 'visualQuality':
                    var visualQuality = _.extend({}, evt);
                    delete visualQuality.type;
                    this.mediaModel.visualQuality =  visualQuality;
                    break;
            }

            this.mediaController.trigger(evt.type, evt);
        }

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

        this.seekDrag = function(state) {
            _this.set('dragging', state);
            if (state) {
                _provider.pause();
            } else {
                _provider.play();
            }
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

            this.set('playlist', playlist);

            if (playlist.length === 0) {
                this.mediaController.trigger(events.JWPLAYER_ERROR, {
                    message: 'Error loading playlist: No playable sources found'
                });
                return;
            }

            this.set('item', -1);
            this.setItem(0);
        };

        this.setItem = function(index) {
            var newItem;
            var repeat = false;
            var playlist = _this.get('playlist');
            if (index === playlist.length || index < -1) {
                newItem = 0;
                repeat = true;
            } else if (index === -1 || index > playlist.length) {
                newItem = playlist.length - 1;
            } else {
                newItem = index;
            }

            if (newItem === this.get('item') && !repeat) {
                return;
            }

            // Item is actually changing
            this.mediaModel = {};
            this.set('item', newItem);
            // select provider based on item source (video, youtube...)
            var item = this.get('playlist')[newItem];
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

        this.setVolume = function(newVol) {
            if (_this.mute && newVol > 0) {
                _this.setMute(false);
            }
            newVol = Math.round(newVol);
            if (!_this.mute) {
                utils.saveCookie('volume', newVol);
            }
            _this.volume = newVol;
            if (_provider) {
                _provider.volume(newVol);
            }
        };

        this.setMute = function(state) {
            if (!utils.exists(state)) {
                state = !_this.mute;
            }
            utils.saveCookie('mute', state);
            _this.set('mute', state);

            // pulled in from the control bar
            if (_this.get('mute') && _this.get('volume') === 0) {
                _this.setVolume(20);
            }

            if (_provider) {
                _provider.mute(state);
            }
        };

        this.componentConfig = function(name) {
            return _componentConfigs[name];
        };

        // The model is also the mediaController for now
        this.loadVideo = function() {
            this.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
            var idx = this.get('item');
            this.getVideo().load(this.get('playlist')[idx]);
        };

        this.playVideo = function() {
            this.getVideo().play();
        };
    };

    _.extend(Model.prototype, {
        'get' : function(attr) {
            return this[attr];
        },
        'set' : function(attr, val) {
            if (this[attr] === val) {
                return;
            }
            var oldVal = this[attr];
            this[attr] = val;
            this.trigger('change:' + attr, this, val, oldVal);
        }
    });

    return Model;

});
