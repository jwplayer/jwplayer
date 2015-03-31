define([
    'embed/embed',
    'plugins/plugins',
    'api/instream',
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/helpers',
    'utils/css',
    'utils/timer',
    'utils/underscore',
    'api/mutators',
    'api/callbacks-deprecate'
], function(Embed, plugins, Instream, events, states, Events, utils, cssUtils, Timer, _, mutatorsInit, legacyInit) {

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

    var Api = function (container) {
        var _this = this,
            _originalContainer = container,
            _controller = null,
            _playerReady = false,
            _queuedCalls = [],
            _instream,
            _itemMeta = {},
            _eventQueue = [],
            _callbacks = {};

        // Set up event handling
        _.extend(this, Events);


        this.trigger = function(type, args) {
            args.type = args.type || type;
            args = normalizeOutput(args);

            return Events.trigger.call(_this, type, args);
        };

        this.on = function(name, callback, context) {
            if (!_controller || !_playerReady) {
                _eventQueue.push([name, callback, context]);
                return this;
            }

            return Events.on.apply(_this, arguments);
        };

        // Required by vast
        // <deprecate>
        this.dispatchEvent = this.trigger;
        this.removeEventListener = this.off.bind(this);
        // </deprecate>

        // Add a bunch of methods
        mutatorsInit(this);
        legacyInit(this);

        _this.container = document.createElement('div');
        _this.id = _this.container.id = container.id;

        // Intialize QOE timer
        var _qoe = _this._qoe = new Timer();
        _qoe.tick(events.API_INITIALIZED);

        this.setup = function (options) {
                _qoe.tick(events.API_SETUP);
                // Remove any players that may be associated to this DOM element
                _this.remove();

                jwplayer.api.addPlayer(_this);

                _this.config = options;
                _this._embedder = new Embed(_this);
                _this._embedder.embed();
                return _this;
        };

        this.qoe = function() {
            var item = _controller.getItemQoe();

            var firstFrame = item.between(events.JWPLAYER_MEDIA_PLAY_ATTEMPT, events.JWPLAYER_MEDIA_FIRST_FRAME);

            return {
                firstFrame : firstFrame,
                player : _qoe.dump(),
                item : item.dump()
            };
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

        _this.getProvider = function () {
            return _controller.getProvider();
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

        function _forwardStateEvent(evt) {
            _this.trigger(evt.newstate, evt);
        }
        _this.setController = function (player) {
            if (_controller) {
                _controller.off('all', _this.trigger);
                _controller.off(events.JWPLAYER_PLAYER_STATE, _forwardStateEvent);
            }
            _controller = player;
            _controller.on('all', _this.trigger);
            _controller.on(events.JWPLAYER_PLAYER_STATE, _forwardStateEvent);
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
                this.on(val[0], val[1], val[2]);
            }

            this.on(events.JWPLAYER_PLAYLIST_ITEM, function () {
                _itemMeta = {};
            });

            this.on(events.JWPLAYER_MEDIA_META, function (data) {
                _.extend(_itemMeta, data.metadata);
            });

            this.on(events.JWPLAYER_VIEW_TAB_FOCUS, function (data) {
                if (data.hasFocus === true) {
                    addFocusBorder(_this.container);
                } else {
                    removeFocusBorder(_this.container);
                }
            });

            _qoe.tick(events.API_READY);

            _this.trigger(events.API_READY, {
                setupTime : _qoe.between(events.API_SETUP, events.API_READY)
            });

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
