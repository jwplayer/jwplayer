define([
    'utils/helpers',
    'utils/css',
    'events/events',
    'utils/scriptloader',
    'playlist/loader',
    'embed/config',
    'plugins/plugins',
    'controller/controller',
    'view/errorscreen',
    'underscore'
], function(utils, cssUtils, events, scriptloader, PlaylistLoader, EmbedConfig, plugins, Controller, errorScreen, _) {

    var _css = cssUtils.css;

    var Embed = function(api) {

        var _this = this,
            _config = new EmbedConfig(api.config),
            _width = _config.width,
            _height = _config.height,
            _errorText = 'Error loading player: ',
            _oldContainer = document.getElementById(api.id),
            _pluginloader = plugins.loadPlugins(api.id, _config.plugins),
            _loader,
            _playlistLoading = false,
            _errorOccurred = false,
            _setupErrorTimer = -1;

        _config.id = api.id;
        if (_config.aspectratio) {
            api.config.aspectratio = _config.aspectratio;
        } else {
            delete api.config.aspectratio;
        }

        _setupEvents(api, _config.events);

        var _container = document.createElement('div');
        _container.id = _oldContainer.id;
        _container.style.width = _width.toString().indexOf('%') > 0 ? _width : (_width + 'px');
        _container.style.height = _height.toString().indexOf('%') > 0 ? _height : (_height + 'px');

        _this.embed = function() {
            if (_errorOccurred) {
                return;
            }

            _pluginloader.addEventListener(events.COMPLETE, _doEmbed);
            _pluginloader.addEventListener(events.ERROR, _pluginError);
            _pluginloader.load();
        };

        _this.destroy = function() {
            if (_pluginloader) {
                _pluginloader.destroy();
                _pluginloader = null;
            }
            if (_loader) {
                _loader.resetEventListeners();
                _loader = null;
            }
        };

        function _doEmbed() {
            if (_errorOccurred) {
                return;
            }

            var playlist = _config.playlist;

            // Check for common playlist errors
            if (_.isArray(playlist)) {
                if (playlist.length === 0) {
                    _sourceError();
                    return;
                }

                // If single item playlist and it doesn't have any sources
                if (playlist.length === 1) {
                    if (!playlist[0].sources || playlist[0].sources.length === 0 ||
                            !playlist[0].sources[0].file) {
                        _sourceError();
                        return;
                    }
                }
            }

            if (_playlistLoading) {
                return;
            }

            if (_.isString(playlist)) {
                _loader = new PlaylistLoader();
                _loader.addEventListener(events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
                    _config.playlist = evt.playlist;
                    _playlistLoading = false;
                    _doEmbed();
                });
                _loader.addEventListener(events.JWPLAYER_ERROR, function(evt) {
                    _playlistLoading = false;
                    _sourceError(evt);
                });
                _playlistLoading = true;
                _loader.load(_config.playlist);
                return;
            }

            if (_pluginloader.getStatus() === scriptloader.loaderstatus.COMPLETE) {

                var pluginConfigCopy = _.extend({}, _config);
                _pluginloader.setupPlugins(api, pluginConfigCopy, _resizePlugin);

                utils.emptyElement(_container);

                // Volume option is tricky to remove, since it needs to be in the HTML5 player model.
                var playerConfigCopy = _.extend({}, pluginConfigCopy);
                delete playerConfigCopy.volume;
                var controller = new Controller(playerConfigCopy, api);
                api.setController(controller);

                _insertCSS();
                return api;
            }
        }

        // TODO: view code
        function _resizePlugin(plugin, div, onready) {
            return function() {
                //try {
                var displayarea = document.querySelector('#' + _container.id + ' .jwmain');
                if (displayarea && onready) {
                    displayarea.appendChild(div);
                }
                if (typeof plugin.resize === 'function') {
                    plugin.resize(displayarea.clientWidth, displayarea.clientHeight);
                    setTimeout(function() {
                        plugin.resize(displayarea.clientWidth, displayarea.clientHeight);
                    }, 400);
                }
                div.left = displayarea.style.left;
                div.top = displayarea.style.top;
                //} catch (e) {}
            };
        }

        function _pluginError(evt) {
            api.dispatchEvent(events.JWPLAYER_ERROR, {
                message: 'Could not load plugin: ' + evt.message
            });
        }

        function _sourceError(evt) {
            if (evt && evt.message) {
                _errorScreen('Error loading playlist: ' + evt.message);
            } else {
                _errorScreen(_errorText + 'No playable sources found');
            }
        }

        function _dispatchSetupError(message, fallback) {
            // Throttle this so that it runs once if called twice in the same callstack
            clearTimeout(_setupErrorTimer);
            _setupErrorTimer = setTimeout(function() {
                api.dispatchEvent(events.JWPLAYER_SETUP_ERROR, {
                    message: message,
                    fallback: fallback
                });
            }, 0);
        }

        function _errorScreen(message) {
            if (_errorOccurred) {
                return;
            }

            // Put new container in page
            _oldContainer.parentNode.replaceChild(_container, _oldContainer);

            if (!_config.fallback) {
                _dispatchSetupError(message, false);
                return;
            }

            _errorOccurred = true;
            errorScreen(_container, message, _config);
            _dispatchSetupError(message, true);
        }

        _this.errorScreen = _errorScreen;

        return _this;
    };

    function _setupEvents(api, events) {
        utils.foreach(events, function(evt, val) {
            var fn = api[evt];
            if (typeof fn === 'function') {
                fn.call(api, val);
            }
        });
    }

    function _insertCSS() {
        _css('object.jwswf, .jwplayer:focus', {
            outline: 'none'
        });
        _css('.jw-tab-focus:focus', {
            outline: 'solid 2px #0B7EF4'
        });
    }

    return Embed;

});
