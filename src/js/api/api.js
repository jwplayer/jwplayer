define([
    'embed/embed',
    'api/instream',
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/helpers',
    'utils/css',
    'utils/timer',
    'underscore',
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

        function _forwardStateEvent(evt) {
            _this.trigger(evt.newstate, evt);
        }

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
        this.container = document.createElement('div');
        this.id = this.container.id = container.id;

        // Intialize QOE timer
        var _qoe = this._qoe = new Timer();
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

            _controller.on('all', this.trigger);
            _controller.on(events.JWPLAYER_PLAYER_STATE, _forwardStateEvent);

            // bind event listeners passed in to the config
            utils.foreach(options.events, function(evt, val) {
                // TODO: normalize event names and call this.on(events)
                var fn = _this[evt];
                if (typeof fn === 'function') {
                    fn.call(_this, val);
                }
            });

            this._embedder = new Embed(options, this, _controller);
            this._embedder.embed();

            return this;
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
            return this.container;
        };

        this.addButton = function (icon, label, handler, id) {
            try {
                _callbacks[id] = handler;
                var handlerString = 'jwplayer("' + _this.id + '").callback("' + id + '")';
                _controller.jwDockAddButton(icon, label, handlerString, id);
            } catch (e) {
                utils.log('Could not add dock button' + e.message);
            }
        };

        this.callback = function (id) {
            if (_callbacks[id]) {
                _callbacks[id]();
            }
        };

        this.getMeta = this.getItemMeta = function () {
            return _itemMeta;
        };


        this.getPlaylistItem = function (item) {
            if (!utils.exists(item)) {
                item = this.getPlaylistIndex();
            }
            return this.getPlaylist()[item];
        };
        this.getRenderingMode = function () {
            return 'html5';
        };

        this.getProvider = function () {
            return _controller.getProvider();
        };

        this.lock = function () {
            return this;
        };
        this.unlock = function () {
            return this;
        };
        this.load = function (toLoad) {
            _controller.instreamDestroy();
            if (this.plugins.googima) {
                _controller.destroyGoogima();
            }
            _controller.load(toLoad);
            return this;
        };

        this.play = function (state) {
            if (state !== undefined) {
                _controller.play(state);
                return this;
            }

            state = this.getState();
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

            return this;
        };

        this.pause = function (state) {
            if (state === undefined) {
                state = this.getState();
                if (state === states.PLAYING || state === states.BUFFERING) {
                    _controller.pause();
                } else {
                    _controller.play();
                }
            } else {
                _controller.pause(state);
            }
            return this;
        };
        this.createInstream = function () {
            return new Instream(_controller);
        };
        this.setInstream = function (instream) {
            _instream = instream;
            return instream;
        };
        this.loadInstream = function (item, options) {
            _instream = this.setInstream(this.createInstream()).init(options);
            _instream.loadItem(item);
            return _instream;
        };

        this.playAd = function (ad) {
            var plugins = this.plugins;
            if (plugins.vast) {
                plugins.vast.jwPlayAd(ad);
            }
        };
        this.pauseAd = function () {
            var plugins = this.plugins;
            if (plugins.vast) {
                plugins.vast.jwPauseAd();
            }
        };


        this.remove = function () {
            // Remove from array of players. this calls this.destroyPlayer()
            globalRemovePlayer(this);

            // so players can be removed before loading completes
            if (_controller.playerDestroy) {
                _controller.playerDestroy();
            }

            // terminate state
            _reset();
            _playerReady = false;
            _controller = null;
            _itemMeta = {};
            _callbacks = {};
        };

        var _onPlayerReady = function () {
            _playerReady = true;

            _qoe.tick(events.API_READY);

            _this.trigger(events.API_READY, {
                setupTime : _qoe.between(events.API_SETUP, events.API_READY)
            });
        };
        _controller.on(events.JWPLAYER_READY, _onPlayerReady);

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

        return this;
    };

    return Api;
});
