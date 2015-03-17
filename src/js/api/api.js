define([
    'embed/embed',
    'plugins/plugins',
    'api/instream',
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/helpers',
    'utils/css',
    'underscore'
], function(Embed, plugins, Instream, events, states, Events, utils, cssUtils, _) {

    function addFocusBorder(container) {
        utils.addClass(container, 'jw-tab-focus');
    }

    function removeFocusBorder(container) {
        utils.removeClass(container, 'jw-tab-focus');
    }

    var normalizeOutput = function() {
        var rounders = ['position', 'duration', 'offset'];

        function round(val) {
            if (this[val]) {
                this[val] = Math.round(this[val] * 1000) / 1000;
            }
        }

        return function (obj) {
            _.each(rounders, round, obj);
            return obj;
        };
    }();


    var _internalFuncsToGenerate = [
        'getBuffer',
        'getCaptionsList',
        'getControls',
        'getCurrentCaptions',
        'getCurrentQuality',
        'getCurrentAudioTrack',
        'getDuration',
        'getFullscreen',
        'getHeight',
        'getLockState',
        'getMute',
        'getPlaylistIndex',
        'getSafeRegion',
        'getPosition',
        'getQualityLevels',
        'getState',
        'getVolume',
        'getWidth',
        'isBeforeComplete',
        'isBeforePlay',
        'releaseState'
    ];

    var _chainableInternalFuncs = [
        'playlistNext',
        'stop',

        // The following pass an argument to function
        'forceState',
        'playlistPrev',
        'seek',
        'setCurrentCaptions',
        'setControls',
        'setCurrentQuality',
        'setVolume',
        'setCurrentAudioTrack'
    ];

    var _eventMapping = {
        onBufferChange: events.JWPLAYER_MEDIA_BUFFER,
        onBufferFull: events.JWPLAYER_MEDIA_BUFFER_FULL,
        onError: events.JWPLAYER_ERROR,
        onSetupError: events.JWPLAYER_SETUP_ERROR,
        onFullscreen: events.JWPLAYER_FULLSCREEN,
        onMeta: events.JWPLAYER_MEDIA_META,
        onMute: events.JWPLAYER_MEDIA_MUTE,
        onPlaylist: events.JWPLAYER_PLAYLIST_LOADED,
        onPlaylistItem: events.JWPLAYER_PLAYLIST_ITEM,
        onPlaylistComplete: events.JWPLAYER_PLAYLIST_COMPLETE,
        onReady: events.API_READY,
        onResize: events.JWPLAYER_RESIZE,
        onComplete: events.JWPLAYER_MEDIA_COMPLETE,
        onSeek: events.JWPLAYER_MEDIA_SEEK,
        onTime: events.JWPLAYER_MEDIA_TIME,
        onVolume: events.JWPLAYER_MEDIA_VOLUME,
        onBeforePlay: events.JWPLAYER_MEDIA_BEFOREPLAY,
        onBeforeComplete: events.JWPLAYER_MEDIA_BEFORECOMPLETE,
        onDisplayClick: events.JWPLAYER_DISPLAY_CLICK,
        onControls: events.JWPLAYER_CONTROLS,
        onQualityLevels: events.JWPLAYER_MEDIA_LEVELS,
        onQualityChange: events.JWPLAYER_MEDIA_LEVEL_CHANGED,
        onCaptionsList: events.JWPLAYER_CAPTIONS_LIST,
        onCaptionsChange: events.JWPLAYER_CAPTIONS_CHANGED,
        onAdError: events.JWPLAYER_AD_ERROR,
        onAdClick: events.JWPLAYER_AD_CLICK,
        onAdImpression: events.JWPLAYER_AD_IMPRESSION,
        onAdTime: events.JWPLAYER_AD_TIME,
        onAdComplete: events.JWPLAYER_AD_COMPLETE,
        onAdCompanions: events.JWPLAYER_AD_COMPANIONS,
        onAdSkipped: events.JWPLAYER_AD_SKIPPED,
        onAdPlay: events.JWPLAYER_AD_PLAY,
        onAdPause: events.JWPLAYER_AD_PAUSE,
        onAdMeta: events.JWPLAYER_AD_META,
        onCast: events.JWPLAYER_CAST_SESSION,
        onAudioTrackChange: events.JWPLAYER_AUDIO_TRACK_CHANGED,
        onAudioTracks: events.JWPLAYER_AUDIO_TRACKS
    };

    var _stateMapping = {
        onBuffer: states.BUFFERING,
        onPause: states.PAUSED,
        onPlay: states.PLAYING,
        onIdle: states.IDLE
    };

    var Api = function (container) {
        var _this = this,
            _originalContainer = container,
            _stateListeners = {},
            _controller = null,
            _playerReady = false,
            _queuedCalls = [],
            _instream,
            _itemMeta = {},
            _eventQueue = [],
            _callbacks = {};

        _.extend(this, Events);

        _this.container = document.createElement('div');
        _this.id = _this.container.id = container.id;

        _this.setup = function (options) {
                // Remove any players that may be associated to this DOM element
                _this.remove();

                jwplayer.api.addPlayer(_this);

                _this.config = options;
                _this._embedder = new Embed(_this);
                _this._embedder.embed();
                return _this;
        };

        _this.getContainer = function () {
            return _this.container;
        };

        _this.addButton = function (icon, label, handler, id) {
            try {
                _callbacks[id] = handler;
                var handlerString = 'jwplayer("' + _this.id + '").callback("' + id + '")';
                _controller.jwDockAddButton(icon, label, handlerString, id);
            } catch (e) {
                utils.log('Could not add dock button' + e.message);
            }
        };
        _this.removeButton = function (id) {
            _callInternal('jwDockRemoveButton', id);
        };

        _this.callback = function (id) {
            if (_callbacks[id]) {
                _callbacks[id]();
            }
        };

        _this.getMeta = function () {
            return _this.getItemMeta();
        };
        _this.getPlaylist = function () {
            return _callInternal('jwGetPlaylist');
        };
        _this.getPlaylistItem = function (item) {
            if (!utils.exists(item)) {
                item = _this.getPlaylistIndex();
            }
            return _this.getPlaylist()[item];
        };
        _this.getRenderingMode = function () {
            return 'html5';
        };

        // Player Public Methods
        _this.setFullscreen = function (fullscreen) {
            if (!utils.exists(fullscreen)) {
                _callInternal('jwSetFullscreen', !_callInternal('jwGetFullscreen'));
            } else {
                _callInternal('jwSetFullscreen', fullscreen);
            }
            return _this;
        };
        _this.setMute = function (mute) {
            if (!utils.exists(mute)) {
                _callInternal('jwSetMute', !_callInternal('jwGetMute'));
            } else {
                _callInternal('jwSetMute', mute);
            }
            return _this;
        };
        _this.lock = function () {
            return _this;
        };
        _this.unlock = function () {
            return _this;
        };
        _this.load = function (toLoad) {
            _callInternal('jwInstreamDestroy');
            if (jwplayer(_this.id).plugins.googima) {
                _callInternal('jwDestroyGoogima');
            }
            _callInternal('jwLoad', toLoad);
            return _this;
        };
        _this.playlistItem = function (item) {
            _callInternal('jwPlaylistItem', parseInt(item, 10));
            return _this;
        };
        _this.resize = function (width, height) {
            _callInternal('jwResize', width, height);
            return _this;
        };
        _this.play = function (state) {
            if (state !== undefined) {
                _callInternal('jwPlay', state);
                return _this;
            }

            state = _this.getState();
            var instreamState = _instream && _instream.getState();

            if (instreamState) {
                if (instreamState === states.IDLE || instreamState === states.PLAYING ||
                    instreamState === states.BUFFERING) {
                    _callInternal('jwInstreamPause');
                } else {
                    _callInternal('jwInstreamPlay');
                }
            }

            if (state === states.PLAYING || state === states.BUFFERING) {
                _callInternal('jwPause');
            } else {
                _callInternal('jwPlay');
            }

            return _this;
        };

        _this.pause = function (state) {
            if (state === undefined) {
                state = _this.getState();
                if (state === states.PLAYING || state === states.BUFFERING) {
                    _callInternal('jwPause');
                } else {
                    _callInternal('jwPlay');
                }
            } else {
                _callInternal('jwPause', state);
            }
            return _this;
        };
        _this.createInstream = function () {
            return new Instream(_controller);
        };
        _this.setInstream = function (instream) {
            _instream = instream;
            return instream;
        };
        _this.loadInstream = function (item, options) {
            _instream = _this.setInstream(_this.createInstream()).init(options);
            _instream.loadItem(item);
            return _instream;
        };
        _this.destroyPlayer = function () {
            // so players can be removed before loading completes
            _playerReady = true;
            _callInternal('jwPlayerDestroy');
            _playerReady = false;
            _controller = null;
        };
        _this.playAd = function (ad) {
            var plugins = jwplayer(_this.id).plugins;
            if (plugins.vast) {
                plugins.vast.jwPlayAd(ad);
            } else {
                _callInternal('jwPlayAd', ad);
            }
        };
        _this.pauseAd = function () {
            var plugins = jwplayer(_this.id).plugins;
            if (plugins.vast) {
                plugins.vast.jwPauseAd();
            } else {
                _callInternal('jwPauseAd');
            }
        };


        // Take a mapping of function names to event names and setup listeners
        function initializeMapping(mapping, listener) {
            utils.foreach(mapping, function (name, value) {
                _this[name] = function (callback) {
                    return listener(value, callback);
                };
            });
        }

        initializeMapping(_stateMapping, _stateListener);
        initializeMapping(_eventMapping, _eventListener);


        // given a name "getBuffer", it adds to jwplayer.api a function which internally triggers jwGetBuffer
        function generateInternalFunction(name) {
            var internalName = 'jw' + name.charAt(0).toUpperCase() + name.slice(1);

            _this[name] = function () {
                var value = _callInternal.apply(this, [internalName].concat(Array.prototype.slice.call(arguments, 0)));

                if (_.has(_chainableInternalFuncs, name)) {
                    return _this;
                }
                return value;
            };
        }

        _.each(_internalFuncsToGenerate.concat(_chainableInternalFuncs), generateInternalFunction);


        _this.remove = function () {

            // Cancel embedding even if it is in progress
            if (_this._embedder && _this._embedder.destroy) {
                _this._embedder.destroy();
            }

            _queuedCalls = [];

            // Is there more than one player using the same DIV on the page?
            var sharedDOM = (_.size(_.where(jwplayer.api._instances, {id: _this.id})) > 1);

            // If sharing the DOM element, don't reset CSS
            if (!sharedDOM) {
                cssUtils.clearCss('#' + _this.id);
            }

            var toDestroy = document.getElementById(_this.id);

            if (toDestroy) {
                // calls jwPlayerDestroy()
                _this.destroyPlayer();

                // If the tag is reused by another player, do not destroy the div
                if (!sharedDOM) {
                    toDestroy.parentNode.replaceChild(_originalContainer, toDestroy);
                }
            }

            // Remove from array of players
            jwplayer.api._instances = _.filter(jwplayer.api._instances, function (p) {
                return (p.uniqueId !== _this.uniqueId);
            });
        };


        _this.registerPlugin = function (id, target, arg1, arg2) {
            plugins.registerPlugin(id, target, arg1, arg2);
        };

        _this.setController = function (player) {
            _controller = player;
        };

        _this.detachMedia = function () {
            return _callInternal('jwDetachMedia');
        };

        _this.attachMedia = function (seekable) {
            return _callInternal('jwAttachMedia', seekable);
        };


        _this.getAudioTracks = function () {
            return _callInternal('jwGetAudioTracks');
        };

        function _stateListener(state, callback) {
            if (!_stateListeners[state]) {
                _stateListeners[state] = [];
                _eventListener(events.JWPLAYER_PLAYER_STATE, _stateCallback(state));
            }
            _stateListeners[state].push(callback);
            return _this;
        }

        function _stateCallback(state) {
            return function (args) {
                var newstate = args.newstate,
                    oldstate = args.oldstate;
                if (newstate === state) {
                    var callbacks = _stateListeners[newstate];
                    if (callbacks) {
                        for (var c = 0; c < callbacks.length; c++) {
                            var fn = callbacks[c];
                            if (typeof fn === 'function') {
                                fn.call(this, {
                                    oldstate: oldstate,
                                    newstate: newstate
                                });
                            }
                        }
                    }
                }
            };
        }

        function _eventListener(type, callback) {
            // If we aren't ready to add the event, store it until playerReady
            if (!_controller || !_playerReady) {
                _eventQueue.push([type, callback]);
                return;
            }

            // Pass along event, but only once
            _controller.off(type);
            _controller.on(type, function(args) {
                _this.trigger(type, args);
            });

            // Now add the callback to API
            _this.on(type, callback);
        }

        _this.removeEventListener = _this.off;

        _this.trigger = function(type, args) {
            args.type = args.type || type;
            args = normalizeOutput(args);

            return Events.trigger.call(_this, type, args);
        };

        // Required by vast, but should be deprecated
        _this.dispatchEvent = _this.trigger;

        _this.dispatchInstreamEvent = function (type) {
            if (_instream) {
                _instream.dispatchEvent(type, arguments);
            }
        };

        function _callInternal() {
            if (_playerReady) {
                var args = Array.prototype.slice.call(arguments, 0),
                    funcName = args.shift();
                if (!_controller || !_.isFunction(_controller[funcName])) {
                    return null;
                }
                return _controller[funcName].apply(_controller, args);
            }
            _queuedCalls.push(arguments);
        }

        _this.callInternal = _callInternal;

        _this.playerReady = function () {
            _playerReady = true;

            while(_eventQueue.length) {
                var val = _eventQueue.shift();
                _eventListener(val[0], val[1]);
            }

            _eventListener(events.JWPLAYER_PLAYLIST_ITEM, function () {
                _itemMeta = {};
            });

            _eventListener(events.JWPLAYER_MEDIA_META, function (data) {
                _.extend(_itemMeta, data.metadata);
            });

            _eventListener(events.JWPLAYER_VIEW_TAB_FOCUS, function (data) {
                if (data.hasFocus === true) {
                    addFocusBorder(_this.container);
                } else {
                    removeFocusBorder(_this.container);
                }
            });

            _this.trigger(events.API_READY, {});

            while (_queuedCalls.length > 0) {
                _callInternal.apply(_this, _queuedCalls.shift());
            }
        };

        _this.getItemMeta = function () {
            return _itemMeta;
        };

        return _this;
    };

    return Api;
});
