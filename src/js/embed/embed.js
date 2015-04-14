define([
    'events/events',
    'utils/backbone.events',
    'utils/scriptloader',
    'playlist/loader',
    'embed/config',
    'plugins/plugins',
    'view/errorscreen',
    'utils/underscore'
], function(events, Events, scriptloader, PlaylistLoader, EmbedConfig, plugins, errorScreen, _) {

    var Embed = function(_api) {

        var _this = _.extend(this, Events),
            _config,
            _pluginLoader,
            _playlistLoader,
            _playlistLoading = false,
            _errorOccurred = false,
            _setupErrorTimer = -1;

        this.embed = function(options) {
            _config = new EmbedConfig(options);
            _config.id = _api.id;

            var _container = _api.getContainer(),
                width = _config.width,
                height = _config.height;

            _container.style.width = width.toString().indexOf('%') > 0 ? width : (width + 'px');
            _container.style.height = height.toString().indexOf('%') > 0 ? height : (height + 'px');

            _pluginLoader = plugins.loadPlugins(_api.id, _config.plugins);
            _pluginLoader.on(events.COMPLETE, _doEmbed);
            _pluginLoader.on(events.ERROR, _pluginError);
            _pluginLoader.load();
        };

        this.destroy = function() {
            if (_pluginLoader) {
                _pluginLoader.destroy();
                _pluginLoader = null;
            }
            if (_playlistLoader) {
                _playlistLoader.resetEventListeners();
                _playlistLoader = null;
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
                _playlistLoader = new PlaylistLoader();
                _playlistLoader.on(events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
                    _config.playlist = evt.playlist;
                    _playlistLoading = false;
                    _doEmbed();
                });
                _playlistLoader.on(events.JWPLAYER_ERROR, function(evt) {
                    _playlistLoading = false;
                    _sourceError(evt);
                });
                _playlistLoading = true;
                _playlistLoader.load(_config.playlist);
                return;
            }

            if (_pluginLoader.getStatus() === scriptloader.loaderstatus.COMPLETE) {

                var pluginConfigCopy = _.extend({}, _config);

                // TODO: flatten flashPlugins and pass to flash provider
                pluginConfigCopy.flashPlugins = _pluginLoader.setupPlugins(_api, pluginConfigCopy, _resizePlugin);

                // Volume option is tricky to remove, since it needs to be in the HTML5 player model.
                var playerConfigCopy = _.extend({}, pluginConfigCopy);
                delete playerConfigCopy.volume;

                _this.trigger(events.JWPLAYER_READY, playerConfigCopy);
            }
        }

        function _resizePlugin(plugin, div, onready) {
            return function() {
                var displayarea = document.querySelector('#' + _api.id + ' .jwmain');
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
            };
        }

        function _pluginError(evt) {
            _api.trigger(events.JWPLAYER_ERROR, {
                message: 'Could not load plugin: ' + evt.message
            });
        }

        function _sourceError(evt) {
            if (evt && evt.message) {
                _errorScreen('Error loading playlist', evt.message);
            } else {
                _errorScreen('Error loading player: ', 'No playable sources found');
            }
        }

        function _dispatchSetupError(message) {
            // Throttle this so that it runs once if called twice in the same callstack
            clearTimeout(_setupErrorTimer);
            _setupErrorTimer = setTimeout(function() {
                _api.trigger(events.JWPLAYER_SETUP_ERROR, {
                    message: message
                });
            }, 0);
        }

        function _errorScreen(message, body) {
            if (_errorOccurred) {
                return;
            }

            // Put new container in page
            // TODO: don't assume element with id is in DOM
            var container = document.getElementById(_api.id);
            var _container = _api.getContainer();
            if (container !== _container) {
                container.parentNode.replaceChild(_container, container);
            }

            _errorOccurred = true;
            errorScreen(_container, message, body);
            _dispatchSetupError(message + body, true);
        }

        return this;
    };

    return Embed;

});
