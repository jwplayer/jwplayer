/**
 * jwplayer.html5 model
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
    var html5 = jwplayer.html5,
        utils = jwplayer.utils,
        events = jwplayer.events;

    html5.model = function(config, defaultProvider) {
        var _model = this,
            // Video provider
            _video,
            // Saved settings
            _cookies = utils.getCookies(),
            // Sub-component configurations
            _componentConfigs = {
                controlbar: {},
                display: {}
            },
            _currentProvider = utils.noop,
            // Defaults
            _defaults = {
                autostart: false,
                controls: true,
                // debug: undefined,
                fullscreen: false,
                height: 320,
                mobilecontrols: false,
                mute: false,
                playlist: [],
                playlistposition: 'none',
                playlistsize: 180,
                playlistlayout: 'extended',
                repeat: false,
                // skin: undefined,
                stretching: utils.stretching.UNIFORM,
                width: 480,
                volume: 90
            };

        function _parseConfig(config) {
            utils.foreach(config, function(i, val) {
                config[i] = utils.serialize(val);
            });
            return config;
        }

        function _init() {
            utils.extend(_model, new events.eventdispatcher());
            _model.config = _parseConfig(utils.extend({}, _defaults, _cookies, config));
            utils.extend(_model, {
                id: config.id,
                state: events.state.IDLE,
                duration: -1,
                position: 0,
                buffer: 0
            }, _model.config);
            // This gets added later
            _model.playlist = [];
            _model.setItem(0);
        }

        var _eventMap = {};
        _eventMap[events.JWPLAYER_MEDIA_MUTE] = ['mute'];
        _eventMap[events.JWPLAYER_MEDIA_VOLUME] = ['volume'];
        _eventMap[events.JWPLAYER_PLAYER_STATE] = ['newstate->state'];
        _eventMap[events.JWPLAYER_MEDIA_BUFFER] = ['bufferPercent->buffer'];
        _eventMap[events.JWPLAYER_MEDIA_TIME] = ['position', 'duration'];

        function _videoEventHandler(evt) {
            var mappings = _eventMap[evt.type];
            if (mappings && mappings.length) {
                var _sendEvent = false;
                for (var i = 0; i < mappings.length; i++) {
                    var mapping = mappings[i];
                    var split = mapping.split('->');
                    var eventProp = split[0];
                    var stateProp = split[1] || eventProp;

                    if (_model[stateProp] !== evt[eventProp]) {
                        _model[stateProp] = evt[eventProp];
                        _sendEvent = true;
                    }
                }
                if (_sendEvent) {
                    _model.sendEvent(evt.type, evt);
                }
            } else {
                _model.sendEvent(evt.type, evt);
            }
        }


        _model.setVideoProvider = function(provider) {

            if (_video) {
                _video.removeGlobalListener(_videoEventHandler);
                var container = _video.getContainer();
                if (container) {
                    _video.remove();
                    provider.setContainer(container);
                }
            }

            _video = provider;
            _video.volume(_model.volume);
            _video.mute(_model.mute);
            _video.addGlobalListener(_videoEventHandler);
        };

        _model.destroy = function() {
            if (_video) {
                _video.removeGlobalListener(_videoEventHandler);
                _video.destroy();
            }
        };

        _model.getVideo = function() {
            return _video;
        };


        _model.seekDrag = function(state) {
            _video.seekDrag(state);
        };

        _model.setFullscreen = function(state) {
            state = !!state;
            if (state !== _model.fullscreen) {
                _model.fullscreen = state;
                _model.sendEvent(events.JWPLAYER_FULLSCREEN, {
                    fullscreen: state
                });
            }
        };

        // TODO: make this a synchronous action; throw error if playlist is empty
        _model.setPlaylist = function(playlist) {
            _model.playlist = jwplayer.playlist.filterPlaylist(playlist, _model.androidhls);
            if (_model.playlist.length === 0) {
                _model.sendEvent(events.JWPLAYER_ERROR, {
                    message: 'Error loading playlist: No playable sources found'
                });
            } else {
                _model.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
                    playlist: jwplayer(_model.id).getPlaylist()
                });
                _model.item = -1;
                _model.setItem(0);
            }
        };

        _model.setItem = function(index) {
            var newItem;
            var repeat = false;
            if (index === _model.playlist.length || index < -1) {
                newItem = 0;
                repeat = true;
            } else if (index === -1 || index > _model.playlist.length) {
                newItem = _model.playlist.length - 1;
            } else {
                newItem = index;
            }

            if (repeat || newItem !== _model.item) {
                _model.item = newItem;
                _model.sendEvent(events.JWPLAYER_PLAYLIST_ITEM, {
                    index: _model.item
                });

                // select provider based on item source (video, youtube...)
                var item = _model.playlist[newItem];
                var source = item && item.sources && item.sources[0];
                var Provider = html5.chooseProvider(source);

                // If we are changing video providers
                if (! (_currentProvider instanceof Provider)) {
                    _currentProvider = defaultProvider || new Provider(_model.id);

                    _model.setVideoProvider(_currentProvider);
                }

                // this allows the Youtube provider to load preview images
                if (_currentProvider.init) {
                    _currentProvider.init(item);
                }
            }
        };

        _model.setVolume = function(newVol) {
            if (_model.mute && newVol > 0) {
                _model.setMute(false);
            }
            newVol = Math.round(newVol);
            if (!_model.mute) {
                utils.saveCookie('volume', newVol);
            }
            _videoEventHandler({
                type: events.JWPLAYER_MEDIA_VOLUME,
                volume: newVol
            });
            _video.volume(newVol);
        };

        _model.setMute = function(state) {
            if (!utils.exists(state)) {
                state = !_model.mute;
            }
            utils.saveCookie('mute', state);
            _videoEventHandler({
                type: events.JWPLAYER_MEDIA_MUTE,
                mute: state
            });
            _video.mute(state);
        };

        _model.componentConfig = function(name) {
            return _componentConfigs[name];
        };

        _init();
    };

})(jwplayer);
