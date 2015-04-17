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
    'api/callbacks-deprecate',
    'handlebars-loader!templates/player.html'
], function(Embed, Instream, events, states,
            Events, utils, cssUtils, Timer, _, Controller, actionsInit, mutatorsInit, legacyInit, playerTemplate) {

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
            var shallowClone = _.extend({}, obj);
            _.each(rounders, round, shallowClone);
            return shallowClone;
        };
    }();

    var Api = function (container, globalRemovePlayer) {
        var _this = this,
            _instream,
            _originalContainer = container,
            _controller,
            _embedder,
            _playerReady = false,
            _itemMeta = {};

        // Set up event handling
        _.extend(this, Events);


        this.trigger = function(type, args) {
            if (_.isObject(args)) {
                args = normalizeOutput(args);
            } else {
                args = {};
            }
            args.type = type;

            return Events.trigger.call(_this, type, args);
        };

        this.on = function(name, callback) {
            if (_.isString(callback)) {
                throw new TypeError('eval callbacks depricated');
            }

            return Events.on.apply(_this, arguments);
        };

        // Required by vast
        // <deprecate>
        this.dispatchEvent = this.trigger;
        this.removeEventListener = this.off.bind(this);
        // </deprecate>

        // Add a bunch of methods
        var _resetController = function() {
            if (_controller) {
                _controller.off();
            }
            _controller = new Controller();
            actionsInit(_this, _controller);
            mutatorsInit(_this, _controller);
            _controller.on(events.JWPLAYER_PLAYLIST_ITEM, function () {
                _itemMeta = {};
            });
            _controller.on(events.JWPLAYER_MEDIA_META, function (data) {
                _.extend(_itemMeta, data.metadata);
            });
            _controller.on(events.JWPLAYER_VIEW_TAB_FOCUS, function (data) {
                if (data.hasFocus === true) {
                    addFocusBorder(_this.container);
                } else {
                    removeFocusBorder(_this.container);
                }
            });
            // capture the ready event and add setup time to it
            _controller.on(events.JWPLAYER_READY, function(event) {
                _playerReady = true;
                _qoe.tick('ready');
                event.setupTime = _qoe.between('setup', 'ready');
            });
            _controller.on('all', _this.trigger);
        };
        _resetController();
        legacyInit(this);

        // These should be read-only model properties
        this.container = utils.createElement(playerTemplate({}));
        this.container = this.container.parentElement.removeChild(this.container);
        this.id = this.container.id = container.id;

        // Intialize QOE timer
        var _qoe = this._qoe = new Timer();
        _qoe.tick('init');


        var _reset = function() {
            // Cancel embedding even if it is in progress
            if (_embedder && _embedder.destroy) {
                _embedder.destroy();
            }
            _playerReady = false;
            _itemMeta = {};
            // Reset DOM
            _this.off();
            _resetController();
            var id = _this.id;
            cssUtils.clearCss('#' + id);
            var toReset = _this.container;
            if (toReset.parentNode) {
                toReset.parentNode.replaceChild(_originalContainer, toReset);
            }
            utils.emptyElement(toReset);
        };

        var _getPlugin = function(name) {
            // this.plugins is set by plugins.loader `api.plugins = jsplugins.plugins`
            var plugins = _this.plugins;
            return plugins && plugins[name];
        };

        this.setup = function (options) {
            _qoe.tick('setup');

            _reset();

            // bind event listeners passed in to the config
            utils.foreach(options.events, function(evt, val) {
                // TODO: normalize event names and call this.on(events)
                var fn = _this[evt];
                if (typeof fn === 'function') {
                    fn.call(_this, val);
                }
            });

            _embedder = new Embed(_this);
            _embedder.on(events.JWPLAYER_READY, function(config) {
                _controller.setup(config, this);
            }, _this);
            _embedder.embed(options);

            return _this;
        };

        this.qoe = function() {
            var qoeItem = _controller.getItemQoe();

            var setupTime = _qoe.between('setup', 'ready');
            var firstFrame = qoeItem.between(events.JWPLAYER_MEDIA_PLAY_ATTEMPT, events.JWPLAYER_MEDIA_FIRST_FRAME);

            return {
                setupTime : setupTime,
                firstFrame : firstFrame,
                player : _qoe.dump(),
                item : qoeItem.dump()
            };
        };

        this.getContainer = function () {
            return _this.container;
        };

        this.getMeta = this.getItemMeta = function () {
            return _itemMeta;
        };

        this.getPlaylistItem = function (item) {
            if (!utils.exists(item)) {
                item = _this.getPlaylistIndex();
            }
            return _this.getPlaylist()[item];
        };

        this.getRenderingMode = function () {
            return 'html5';
        };

        this.load = function (toLoad) {
            if (_controller._instreamPlayer) {
                _controller.instreamDestroy();
            }
            if (_getPlugin('googima')) {
                _controller.destroyGoogima();
            }
            _controller.load(toLoad);
            return _this;
        };

        this.play = function (state) {
            if (state !== undefined) {
                _controller.play(state);
                return _this;
            }

            state = _this.getState();
            var instreamState = _instream && _instream.getState();

            if (instreamState) {
                switch (instreamState) {
                    case states.IDLE:
                    case states.PLAYING:
                    case states.BUFFERING:
                        _controller.instreamPause();
                        break;
                    default:
                        _controller.instreamPlay();
                }
            }

            switch (state) {
                case states.PLAYING:
                case states.BUFFERING:
                    _controller.pause();
                    break;
                default:
                    _controller.play();
            }

            return _this;
        };

        this.pause = function (state) {
            if (state === undefined) {
                state = _this.getState();
                switch (state) {
                    case states.PLAYING:
                    case states.BUFFERING:
                        _controller.pause();
                        break;
                    default:
                        _controller.play();
                }
            } else {
                _controller.pause(state);
            }
            return _this;
        };
        this.createInstream = function () {
            return new Instream(_controller);
        };
        this.setInstream = function (instream) {
            _instream = instream;
            return instream;
        };
        this.loadInstream = function (item, options) {
            var instream = _this.createInstream();
            _this.setInstream(instream);
            instream.init(options).loadItem(item);
            return instream;
        };

        this.playAd = function (ad) {
            var vast = _getPlugin('vast');
            if (vast) {
                vast.jwPlayAd(ad);
            }
        };
        this.pauseAd = function () {
            var vast = _getPlugin('vast');
            if (vast) {
                vast.jwPauseAd();
            }
        };

        this.remove = function () {
            // Remove from array of players. this calls this.destroyPlayer()
            globalRemovePlayer(_this);

            // so players can be removed before loading completes
            if (_controller.playerDestroy) {
                _controller.playerDestroy();
            }

            // terminate state
            _reset();
            return _this.trigger('remove');
        };

        return this;
    };

    return Api;
});
