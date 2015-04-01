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
            if (!_playerReady) {
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
        _controller = new Controller();
        actionsInit(this, _controller);
        mutatorsInit(this, _controller);
        legacyInit(this);

        _this.container = document.createElement('div');
        _this.id = _this.container.id = container.id;

        // Intialize QOE timer
        var _qoe = _this._qoe = new Timer();
        _qoe.tick(events.API_INITIALIZED);

        this.setup = function (options) {
            _qoe.tick(events.API_SETUP);
            // Remove any players that may be associated to this DOM element
            // this.remove();

            jwplayer.api.addPlayer(_this);

            _controller.on('all', _this.trigger);
            _controller.on(events.JWPLAYER_PLAYER_STATE, _forwardStateEvent);

            this.config = options;
            this._embedder = new Embed(_this, _controller);
            this._embedder.embed();

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
            if (jwplayer(_this.id).plugins.googima) {
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
            // so players can be removed before loading completes
            _playerReady = true;
            _controller.playerDestroy();
            _playerReady = false;
            _controller = null;
        };
        _this.playAd = function (ad) {
            var plugins = jwplayer(_this.id).plugins;
            if (plugins.vast) {
                plugins.vast.jwPlayAd(ad);
            } else {
                _controller.playAd(ad);
            }
        };
        _this.pauseAd = function () {
            var plugins = jwplayer(_this.id).plugins;
            if (plugins.vast) {
                plugins.vast.jwPauseAd();
            } else {
                _controller.pauseAd();
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

        function _forwardStateEvent(evt) {
            _this.trigger(evt.newstate, evt);
        }

        this.playerReady = function () {
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
        };

        return _this;
    };

    return Api;
});
