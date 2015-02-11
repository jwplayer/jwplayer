(function(jwplayer, undefined) {
    var _players = [],
        utils = jwplayer.utils,
        events = jwplayer.events,
        _ = jwplayer._,
        _uniqueIndex = 0,
        states = events.state;

    function addFocusBorder(container) {
        utils.addClass(container, 'jw-tab-focus');
    }

    function removeFocusBorder(container) {
        utils.removeClass(container, 'jw-tab-focus');
    }

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

    jwplayer.api = function(container) {
        var _this = this,
            _listeners = {},
            _stateListeners = {},
            _player,
            _playerReady = false,
            _queuedCalls = [],
            _instream,
            _itemMeta = {},
            _callbacks = {};

        _this.container = container;
        _this.id = container.id;


        _this.setup = function(options) {
            if (jwplayer.embed) {

                // Remove any players that may be associated to this DOM element
                jwplayer.api.destroyPlayer(_this.id);

                var newApi = (new jwplayer.api(_this.container));
                jwplayer.api.addPlayer(newApi);

                newApi.config = options;
                newApi._embedder = new jwplayer.embed(newApi);
                newApi._embedder.embed();
                return newApi;
            }
            return _this;
        };

        _this.getContainer = function() {
            return _this.container;
        };

        _this.addButton = function(icon, label, handler, id) {
            try {
                _callbacks[id] = handler;
                var handlerString = 'jwplayer("' + _this.id + '").callback("' + id + '")';
                //_player.jwDockAddButton(icon, label, handlerString, id);
                _callInternal('jwDockAddButton', icon, label, handlerString, id);
            } catch (e) {
                utils.log('Could not add dock button' + e.message);
            }
        };
        _this.removeButton = function(id) {
            _callInternal('jwDockRemoveButton', id);
        };

        _this.callback = function(id) {
            if (_callbacks[id]) {
                _callbacks[id]();
            }
        };

        _this.getMeta = function() {
            return _this.getItemMeta();
        };
        _this.getPlaylist = function() {
            var playlist = _callInternal('jwGetPlaylist');
            if (_this.renderingMode === 'flash') {
                utils.deepReplaceKeyName(playlist,
                    ['__dot__', '__spc__', '__dsh__', '__default__'], ['.', ' ', '-', 'default']);
            }
            return playlist;
        };
        _this.getPlaylistItem = function(item) {
            if (!utils.exists(item)) {
                item = _this.getPlaylistIndex();
            }
            return _this.getPlaylist()[item];
        };
        _this.getRenderingMode = function() {
            return _this.renderingMode;
        };

        // Player Public Methods
        _this.setFullscreen = function(fullscreen) {
            if (!utils.exists(fullscreen)) {
                _callInternal('jwSetFullscreen', !_callInternal('jwGetFullscreen'));
            } else {
                _callInternal('jwSetFullscreen', fullscreen);
            }
            return _this;
        };
        _this.setMute = function(mute) {
            if (!utils.exists(mute)) {
                _callInternal('jwSetMute', !_callInternal('jwGetMute'));
            } else {
                _callInternal('jwSetMute', mute);
            }
            return _this;
        };
        _this.lock = function() {
            return _this;
        };
        _this.unlock = function() {
            return _this;
        };
        _this.load = function(toLoad) {
            _callInternal('jwInstreamDestroy');
            if (jwplayer(_this.id).plugins.googima) {
                _callInternal('jwDestroyGoogima');
            }
            _callInternal('jwLoad', toLoad);
            return _this;
        };
        _this.playlistItem = function(item) {
            _callInternal('jwPlaylistItem', parseInt(item, 10));
            return _this;
        };
        _this.resize = function(width, height) {
            if (_this.renderingMode !== 'flash') {
                _callInternal('jwResize', width, height);
            } else {
                var wrapper = document.getElementById(_this.id + '_wrapper'),
                    aspect = document.getElementById(_this.id + '_aspect');
                if (aspect) {
                    aspect.style.display = 'none';
                }
                if (wrapper) {
                    wrapper.style.display = 'block';
                    wrapper.style.width = utils.styleDimension(width);
                    wrapper.style.height = utils.styleDimension(height);
                }
            }
            return _this;
        };
        _this.play = function(state) {
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

        _this.pause = function(state) {
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
        _this.createInstream = function() {
            return new jwplayer.api.instream(this, _player);
        };
        _this.setInstream = function(instream) {
            _instream = instream;
            return instream;
        };
        _this.loadInstream = function(item, options) {
            _instream = _this.setInstream(_this.createInstream()).init(options);
            _instream.loadItem(item);
            return _instream;
        };
        _this.destroyPlayer = function() {
            // so players can be removed before loading completes
            _playerReady = true;
            _callInternal('jwPlayerDestroy');
        };
        _this.playAd = function(ad) {
            var plugins = jwplayer(_this.id).plugins;
            if (plugins.vast) {
                plugins.vast.jwPlayAd(ad);
            } else {
                _callInternal('jwPlayAd', ad);
            }
        };
        _this.pauseAd = function() {
            var plugins = jwplayer(_this.id).plugins;
            if (plugins.vast) {
                plugins.vast.jwPauseAd();
            } else {
                _callInternal('jwPauseAd');
            }
        };


        // Take a mapping of function names to event names and setup listeners
        function initializeMapping(mapping, listener) {
            utils.foreach(mapping, function(name, value) {
                _this[name] = function(callback) {
                    return listener(value, callback);
                };
            });
        }

        initializeMapping(_stateMapping, _stateListener);
        initializeMapping(_eventMapping, _eventListener);


        // given a name "getBuffer", it adds to jwplayer.api a function which internally triggers jwGetBuffer
        function generateInternalFunction(chainable, name) {
            var internalName = 'jw' + name.charAt(0).toUpperCase() + name.slice(1);

            _this[name] = function() {
                var value = _callInternal.apply(this, [internalName].concat(Array.prototype.slice.call(arguments, 0)));
                return (chainable ? _this : value);
            };
        }
        var nonChainingGenerator = function(index, name) {
            generateInternalFunction(false, name);
        };
        var chainingGenerator = function(index, name) {
            generateInternalFunction(true, name);
        };
        utils.foreach(_internalFuncsToGenerate, nonChainingGenerator);
        utils.foreach(_chainableInternalFuncs, chainingGenerator);


        _this.remove = function() {

            // Cancel embedding even if it is in progress
            if (this._embedder && this._embedder.destroy) {
                this._embedder.destroy();
            }

            _queuedCalls = [];

            // Is there more than one player using the same DIV on the page?
            var sharedDOM = (_.size(_.where(_players, {id : _this.id})) > 1);

            // If sharing the DOM element, don't reset CSS
            if (! sharedDOM) {
                utils.clearCss('#' + _this.id);
            }

            var toDestroy = document.getElementById(_this.id + (_this.renderingMode === 'flash' ? '_wrapper' : ''));

            if (toDestroy) {
                if (_this.renderingMode === 'html5') {
                    // calls jwPlayerDestroy()
                    _this.destroyPlayer();
                } else if (utils.isMSIE(8)) {
                    // remove flash object safely, setting flash external interface methods to null for ie8
                    var swf = document.getElementById(_this.id);
                    if (swf && swf.parentNode) {
                        swf.style.display = 'none';
                        for (var i in swf) {
                            if (typeof swf[i] === 'function') {
                                swf[i] = null;
                            }
                        }
                        swf.parentNode.removeChild(swf);
                    }
                }

                // If the tag is reused by another player, do not destroy the div
                if (! sharedDOM) {
                    var replacement = document.createElement('div');
                    replacement.id = _this.id;
                    toDestroy.parentNode.replaceChild(replacement, toDestroy);
                }
            }

            // Remove from array of players
            _players = _.filter(_players, function(p) {
                return (p.uniqueId !== _this.uniqueId);
            });
        };


        _this.registerPlugin = function(id, target, arg1, arg2) {
            jwplayer.plugins.registerPlugin(id, target, arg1, arg2);
        };

        /** Use this function to set the internal low-level player.
         * This is a javascript object which contains the low-level API calls. **/
        _this.setPlayer = function(player, renderingMode) {
            _player = player;
            _this.renderingMode = renderingMode;
        };

        _this.detachMedia = function() {
            if (_this.renderingMode === 'html5') {
                return _callInternal('jwDetachMedia');
            }
        };

        _this.attachMedia = function(seekable) {
            if (_this.renderingMode === 'html5') {
                return _callInternal('jwAttachMedia', seekable);
            }
        };
        
        
        _this.getAudioTracks = function() {
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
            return function(args) {
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

        function _addInternalListener(player, type) {
            try {
                player.jwAddEventListener(type,
                        'function(dat) { jwplayer("' + _this.id + '").dispatchEvent("' + type + '", dat); }');
            } catch (e) {
                if (_this.renderingMode === 'flash') {
                    var anchor = document.createElement('a');
                    anchor.href = _player.data;
                    if (anchor.protocol !== location.protocol) {
                        utils.log('Warning: Your site [' + location.protocol + '] and JWPlayer ['+anchor.protocol +
                            '] are hosted using different protocols');
                    }
                }
                utils.log('Could not add internal listener');
            }
        }

        function _eventListener(type, callback) {
            if (!_listeners[type]) {
                _listeners[type] = [];
                if (_player && _playerReady) {
                    _addInternalListener(_player, type);
                }
            }
            _listeners[type].push(callback);
            return _this;
        }

        _this.removeEventListener = function(type, callback) {
            var listeners = _listeners[type];
            if (listeners) {
                for (var l = listeners.length; l--;) {
                    if (listeners[l] === callback) {
                        listeners.splice(l, 1);
                    }
                }
            }
        };

        _this.dispatchEvent = function(type) {
            var listeners = _listeners[type];
            if (listeners) {
                listeners = listeners.slice(0); //copy array
                var args = utils.translateEventResponse(type, arguments[1]);
                for (var l = 0; l < listeners.length; l++) {
                    var fn = listeners[l];
                    if (typeof fn === 'function') {
                        try {
                            if (type === events.JWPLAYER_PLAYLIST_LOADED) {
                                utils.deepReplaceKeyName(args.playlist,
                                    ['__dot__', '__spc__', '__dsh__', '__default__'], ['.', ' ', '-', 'default']);
                            }
                            fn.call(this, args);
                        } catch (e) {
                            utils.log('There was an error calling back an event handler', e);
                        }
                    }
                }
            }
        };

        _this.dispatchInstreamEvent = function(type) {
            if (_instream) {
                _instream.dispatchEvent(type, arguments);
            }
        };

        function _callInternal() {
            if (_playerReady) {
                if (_player) {
                    var args = Array.prototype.slice.call(arguments, 0),
                        funcName = args.shift();
                    if (typeof _player[funcName] === 'function') {
                        // Can't use apply here -- Flash's externalinterface doesn't like it.
                        //return func.apply(player, args);
                        switch (args.length) {
                            case 6:
                                return _player[funcName](args[0], args[1], args[2], args[3], args[4], args[5]);
                            case 5:
                                return _player[funcName](args[0], args[1], args[2], args[3], args[4]);
                            case 4:
                                return _player[funcName](args[0], args[1], args[2], args[3]);
                            case 3:
                                return _player[funcName](args[0], args[1], args[2]);
                            case 2:
                                return _player[funcName](args[0], args[1]);
                            case 1:
                                return _player[funcName](args[0]);
                        }
                        return _player[funcName]();
                    }
                }
                return null;
            }
            _queuedCalls.push(arguments);
        }

        _this.callInternal = _callInternal;

        _this.playerReady = function(obj) {
            _playerReady = true;

            if (!_player) {
                _this.setPlayer(document.getElementById(obj.id));
            }
            _this.container = document.getElementById(_this.id);

            utils.foreach(_listeners, function(eventType) {
                _addInternalListener(_player, eventType);
            });

            _eventListener(events.JWPLAYER_PLAYLIST_ITEM, function() {
                _itemMeta = {};
            });

            _eventListener(events.JWPLAYER_MEDIA_META, function(data) {
                utils.extend(_itemMeta, data.metadata);
            });

            _eventListener(events.JWPLAYER_VIEW_TAB_FOCUS, function(data) {
                var container = _this.getContainer();
                if (data.hasFocus === true) {
                    addFocusBorder(container);
                } else {
                    removeFocusBorder(container);
                }
            });

            _this.dispatchEvent(events.API_READY);

            while (_queuedCalls.length > 0) {
                _callInternal.apply(_this, _queuedCalls.shift());
            }
        };

        _this.getItemMeta = function() {
            return _itemMeta;
        };

        return _this;
    };


    //
    // API Static methods
    //

    jwplayer.playerReady = function(obj) {
        var api = jwplayer.api.playerById(obj.id);
        if (!api) {
            api = jwplayer.api.selectPlayer(obj.id);
        }

        api.playerReady(obj);
    };

    jwplayer.api.selectPlayer = function(identifier) {
        var _container;

        if (!utils.exists(identifier)) {
            identifier = 0;
        }

        if (identifier.nodeType) {
            // Handle DOM Element
            _container = identifier;
        } else if (typeof identifier === 'string') {
            // Find container by ID
            _container = document.getElementById(identifier);
        }

        if (_container) {
            var foundPlayer = jwplayer.api.playerById(_container.id);
            if (foundPlayer) {
                return foundPlayer;
            } else {
                return (new jwplayer.api(_container));
            }
        } else if (typeof identifier === 'number') {
            return _players[identifier];
        }

        return null;
    };


    jwplayer.api.playerById = function(id) {
        for (var p = 0; p < _players.length; p++) {
            if (_players[p].id === id) {
                return _players[p];
            }
        }

        return null;
    };


    jwplayer.api.addPlayer = function(player) {
        for (var p = 0; p < _players.length; p++) {
            if (_players[p] === player) {
                return player; // Player is already in the list;
            }
        }

        _uniqueIndex++;
        player.uniqueId = _uniqueIndex;
        _players.push(player);
        return player;
    };


    // Destroys all players bound to a specific dom element by ID
    jwplayer.api.destroyPlayer = function(id) {
        // Get all players with matching id
        var players = _.where(_players, {id : id});

        // Call remove on every player in the array
        _.each(players, _.partial(_.result, _, 'remove'));
    };


})(window.jwplayer);
