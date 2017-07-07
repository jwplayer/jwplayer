define([
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/helpers',
    'utils/timer',
    'utils/underscore',
    'controller/controller',
    'api/api-actions',
    'api/api-mutators',
    'api/callbacks-deprecate',
    'version'
], function(events, states,
            Events, utils, Timer, _, Controller, actionsInit, mutatorsInit, legacyInit, version) {

    var Api = function (container, globalRemovePlayer) {
        var _this = this;
        var _controller;

        // Set up event handling
        _.extend(this, Events);

        // Provide module access to plugins from the player instance
        this.utils = utils;
        this._ = _;
        this.Events = Events;
        this.version = version;

        this.trigger = function(type, args) {
            if (_.isObject(args)) {
                args = _.extend({}, args);
            } else {
                args = {};
            }
            args.type = type;
            var jwplayer = window.jwplayer;
            if (jwplayer && jwplayer.debug) {
                return Events.trigger.call(_this, type, args);
            }
            return Events.triggerSafe.call(_this, type, args);
        };

        // Required by vast
        // <deprecate>
        this.dispatchEvent = this.trigger;
        this.removeEventListener = this.off.bind(this);
        // </deprecate>

        var _setupController = function() {
            _controller = new Controller(container);

            // Add a bunch of methods
            actionsInit(_this, _controller);
            mutatorsInit(_this, _controller);
            _controller.on(events.JWPLAYER_MEDIA_META, function (data) {
                var itemMeta = _controller._model.get('itemMeta');
                _.extend(itemMeta, data.metadata);
            });

            // capture the ready event and add setup time to it
            _controller.on(events.JWPLAYER_READY, function(event) {
                _qoe.tick('ready');
                event.setupTime = _qoe.between('setup', 'ready');
            });
            _controller.on('all', _this.trigger);
        };
        _setupController();
        legacyInit(this);

        // These should be read-only model properties
        this.id = container.id;

        // Intialize QOE timer
        var _qoe = this._qoe = new Timer();
        _qoe.tick('init');


        var _reset = function() {
            _this.off();

            if (_controller) {
                _controller.off();
            }

            // so players can be removed before loading completes
            if (_controller && _controller.playerDestroy) {
                _controller.playerDestroy();
            }
        };

        this.getPlugin = function(name) {
            return _this.plugins && _this.plugins[name];
        };

        this.addPlugin = function(name, pluginInstance) {
            this.plugins = this.plugins || {};
            this.plugins[name] = pluginInstance;


            this.onReady(pluginInstance.addToPlayer);

            // A swf plugin may rely on resize events
            if (pluginInstance.resize) {
                this.onResize(pluginInstance.resizeHandler);
            }
        };

        this.setup = function (options) {
            _qoe.tick('setup');

            _reset();
            _setupController();

            // bind event listeners passed in to the config
            utils.foreach(options.events, function(evt, val) {
                var fn = _this[evt];
                if (typeof fn === 'function') {
                    fn.call(_this, val);
                }
            });

            options.id = _this.id;
            _controller.setup(options, this);

            return _this;
        };

        this.qoe = function() {
            var qoeItem = _controller.getItemQoe();

            var setupTime = _qoe.between('setup', 'ready');
            var firstFrame = qoeItem.getFirstFrame();

            return {
                setupTime: setupTime,
                firstFrame: firstFrame,
                player: _qoe.dump(),
                item: qoeItem.dump()
            };
        };

        // Request this from the view/controller
        this.getContainer = function () {
            if (_controller.getContainer) {
                // If the controller has fully set up...
                return _controller.getContainer();
            }
            // If the controller hasn't set up yet, and we need this (due a setup to error), send the container
            return container;
        };

        this.getMeta = this.getItemMeta = function () {
            return _controller._model.get('itemMeta') || {};
        };

        this.getPlaylistItem = function (index) {
            if (!utils.exists(index)) {
                return _controller._model.get('playlistItem');
            }
            var playlist = _this.getPlaylist();
            if (playlist) {
                return playlist[index];
            }
            return null;
        };

        this.getRenderingMode = function () {
            return 'html5';
        };

        this.getMute = function () {
            return _controller._model.getMute();
        };

        this.load = function (toLoad, feedData) {
            _controller.load(toLoad, feedData);
            return _this;
        };

        this.play = function (state, meta) {
            if (_.isObject(state) && state.reason) {
                meta = state;
            }
            if (!meta) {
                meta = { reason: 'external' };
            }
            if (state === true) {
                _controller.play(meta);
                return _this;
            } else if (state === false) {
                _controller.pause(meta);
                return _this;
            }

            state = _this.getState();
            switch (state) {
                case states.PLAYING:
                case states.BUFFERING:
                    _controller.pause(meta);
                    break;
                default:
                    _controller.play(meta);
            }

            return _this;
        };

        this.pause = function (state, meta) {
            if (_.isBoolean(state)) {
                return this.play(!state, meta);
            }

            return this.play(meta);
        };

        this.seek = function(pos, meta = { reason: 'external' }) {
            _controller.seek(pos, meta);
            return _this;
        };

        this.playlistNext = function(meta = { reason: 'external' }) {
            _controller.playlistNext(meta);
            return _this;
        };

        this.playlistPrev = function(meta = { reason: 'external' }) {
            _controller.playlistPrev(meta);
            return _this;
        };

        this.playlistItem = function(index, meta = { reason: 'external' }) {
            _controller.playlistItem(index, meta);
            return _this;
        };

        this.createInstream = function () {
            return _controller.createInstream();
        };

        this.castToggle = function() {
            if (_controller && _controller.castToggle) {
                _controller.castToggle();
            }
        };

        // These may be overridden by ad plugins
        this.playAd = this.pauseAd = utils.noop;

        this.remove = function () {
            // Remove from array of players
            globalRemovePlayer(_this);

            // terminate state
            _this.trigger('remove');

            // Unbind listeners and destroy controller/model/...
            _reset();

            return _this;
        };

        return this;
    };

    return Api;
});
