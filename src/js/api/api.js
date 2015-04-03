define([
    'embed/embed',
    'api/instream',
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/helpers',
    'utils/css',
    'utils/timer',
    'utils/underscore',
    'controller/controller',
    'api/api-actions',
    'api/api-mutators',
    'api/callbacks-deprecate'
], function(Embed, Instream, events, states,
            Events, utils, cssUtils, Timer, _, Controller, actionsInit, mutatorsInit, legacyInit) {

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

    var Api = function (container, globalRemovePlayer) {
        var _this = this,
            _instream,
            _originalContainer = container,
            _controller = new Controller(),
            _playerReady = false,
            _itemMeta = {},
            _eventQueue = [],
            _callbacks = {};

        // Set up event handling
        _.extend(this, Events);


        this.trigger = function(type, args) {
            args = (_.isObject(args) ? args : {});

            args.type = args.type || type;
            args = normalizeOutput(args);

            return Events.trigger.call(_this, type, args);
        };

        this.on = function(name, callback) {
            if (!_.isFunction(callback)) {
                throw new Error(callback + ' is not a function');
            }

            return Events.on.apply(_this, arguments);
        };

        // Required by vast
        // <deprecate>
        this.dispatchEvent = this.trigger;
        this.removeEventListener = this.off.bind(this);
        // </deprecate>

        // Add a bunch of methods
        _controller = new Controller();
        actionsInit(this, _controller);
        mutatorsInit(this, _controller);
        legacyInit(this);

        // These should be read-only model properties
        _this.container = document.createElement('div');
        _this.id = _this.container.id = container.id;

        // Intialize QOE timer
        var _qoe = _this._qoe = new Timer();
        _qoe.tick(events.API_INITIALIZED);

        var _reset = function() {
            // Cancel embedding even if it is in progress
            if (_this._embedder && _this._embedder.destroy) {
                _this._embedder.destroy();
            }

            // Reset DOM
            var id = _this.id;
            cssUtils.clearCss('#' + id);
            var toReset = _this.container;
            if (toReset.parentNode) {
                toReset.parentNode.replaceChild(_originalContainer, toReset);
            }
            utils.emptyElement(toReset);
        };

        this.setup = function (options) {
            _qoe.tick(events.API_SETUP);

            _reset();

            _controller.on('all', _this.trigger);
            _controller.on(events.JWPLAYER_PLAYER_STATE, _forwardStateEvent);

            // bind event listeners passed in to the config
            utils.foreach(options.events, function(evt, val) {
                // TODO: normalize event names and call this.on(events)
                var fn = _this[evt];
                if (typeof fn === 'function') {
                    fn.call(_this, val);
                }
            });

            _this._embedder = new Embed(options, _this, _controller);
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

        this.getContainer = function () {
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

        _this.callback = function (id) {
            if (_callbacks[id]) {
                _callbacks[id]();
            }
        };

        this.getMeta = this.getItemMeta = function () {
            return _itemMeta;
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

        _this.lock = function () {
            return _this;
        };
        _this.unlock = function () {
            return _this;
        };
        _this.load = function (toLoad) {
            _controller.instreamDestroy();
            if (_this.plugins.googima) {
                _controller.destroyGoogima();
            }
            _controller.load(toLoad);
            return _this;
        };

        _this.play = function (state) {
            if (state !== undefined) {
                _controller.play(state);
                return _this;
            }

            state = _this.getState();
            var instreamState = _instream && _instream.getState();

            if (instreamState) {
                if (instreamState === states.IDLE || instreamState === states.PLAYING ||
                    instreamState === states.BUFFERING) {
                    _controller.instreamPause();
                } else {
                    _controller.instreamPlay();
                }
            }

            if (state === states.PLAYING || state === states.BUFFERING) {
                _controller.pause();
            } else {
                _controller.play();
            }

            return _this;
        };

        _this.pause = function (state) {
            if (state === undefined) {
                state = _this.getState();
                if (state === states.PLAYING || state === states.BUFFERING) {
                    _controller.pause();
                } else {
                    _controller.play();
                }
            } else {
                _controller.pause(state);
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
            _reset();

            // so players can be removed before loading completes
            _playerReady = true;
            _controller.playerDestroy();

            // terminate state
            _playerReady = false;
            _controller = null;
            _eventQueue = [];
            _itemMeta = {};
            _callbacks = {};
        };

        _this.playAd = function (ad) {
            var plugins = _this.plugins;
            if (plugins.vast) {
                plugins.vast.jwPlayAd(ad);
            }
        };
        _this.pauseAd = function () {
            var plugins = _this.plugins;
            if (plugins.vast) {
                plugins.vast.jwPauseAd();
            }
        };


        _this.remove = function () {
            // Remove from array of players. this calls this.destroyPlayer()
            globalRemovePlayer(_this);
        };

        function _forwardStateEvent(evt) {
            _this.trigger(evt.newstate, evt);
        }

        this.playerReady = function () {
            _playerReady = true;

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
        };

        return _this;
    };

    return Api;
});
