/**
 * This class is responsible for setting up the player and triggering the PLAYER_READY event, or an JWPLAYER_ERROR event
 *
 * The order of the player setup is as follows:
 *
 * 1. parse config
 * 2. load skin (async)
 * 3. load external playlist (async)
 * 4. initialize components (requires 2)
 * 5. initialize plugins (requires 5)
 * 6. ready
 */
define([
    'plugins/plugins',
    'playlist/loader',
    'playlist/playlist',
    'utils/backbone.events',
    'utils/underscore',
    'events/events'
], function(plugins, PlaylistLoader, Playlist, Events, _, events) {

    var Setup = function(_api, _model, _view, _errorTimeoutSeconds) {
        var _this = this,
            _pluginLoader,
            _playlistLoader,
            _setupFailureTimeout;

        _errorTimeoutSeconds = _errorTimeoutSeconds || 10;

        var LOAD_PLUGINS = {
                method: _loadPlugins,
                depends: []
            },
            LOAD_PLAYLIST = {
                method: _loadPlaylist,
                depends: []
            },
            LOAD_SKIN = {
                method: _loadSkin,
                depends: []
            },
            SETUP_COMPONENTS = {
                method: _setupComponents,
                depends: [
                    // view controls require that a playlist item be set
                    LOAD_PLAYLIST,
                    LOAD_SKIN
                ]
            },
            SEND_READY = {
                method: _sendReady,
                depends: [
                    LOAD_PLUGINS,
                    SETUP_COMPONENTS
                ]
            };

        var _queue = [
            LOAD_PLUGINS,
            LOAD_PLAYLIST,
            LOAD_SKIN,
            SETUP_COMPONENTS,
            SEND_READY
        ];

        this.start = function () {
            _setupFailureTimeout = setTimeout(_setupTimeoutHandler, _errorTimeoutSeconds * 1000);
            _nextTask();
        };

        this.destroy = function() {
            this.off();
            _queue.length = 0;
            clearTimeout(_setupFailureTimeout);
            if (_pluginLoader) {
                _pluginLoader.destroy();
                _pluginLoader = null;
            }
            if (_playlistLoader) {
                _playlistLoader.destroy();
                _playlistLoader = null;
            }
            _api = null;
            _model = null;
            _view = null;
        };

        function _setupTimeoutHandler(){
            _error('Setup Timeout Error', 'Setup took longer than ' + _errorTimeoutSeconds + ' seconds to complete.');
        }

        function _nextTask() {
            for (var i = 0; i < _queue.length; i++) {
                var task = _queue[i];
                if (_allComplete(task.depends)) {
                    _queue.splice(i--, 1);
                    task.method();
                }
            }
        }

        function _allComplete(dependencies) {
            // return true if empty array,
            //  or if each object has an attribute 'complete' which is true
            return _.all(_.map(dependencies, _.property('complete')));
        }

        function _taskComplete(task) {
            task.complete = true;
            _nextTask();
        }

        function _loadPlugins() {
            _pluginLoader = plugins.loadPlugins(_model.config.id, _model.config.plugins);
            _pluginLoader.on(events.COMPLETE, _completePlugins);
            _pluginLoader.on(events.ERROR, _pluginsError);
            _pluginLoader.load();
        }

        function _completePlugins() {
            // TODO: flatten flashPlugins and pass to flash provider
            _model.config.flashPlugins = _pluginLoader.setupPlugins(_api, _model.config, _resizePlugin);

            // Volume option is tricky to remove, since it needs to be in the HTML5 player model.
            delete _model.config.volume;

            _taskComplete(LOAD_PLUGINS);
        }

        function _resizePlugin(plugin, div, onready) {
            var id = _api.id;
            return function() {
                var displayarea = document.querySelector('#' + id + ' .jw-plugins');
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

        function _pluginsError(evt) {
            _error('Could not load plugin', evt.message);
        }

        function _loadPlaylist() {
            var playlist = _model.config.playlist;
            if (_.isString(playlist)) {
                _playlistLoader = new PlaylistLoader();
                _playlistLoader.on(events.JWPLAYER_PLAYLIST_LOADED, _completePlaylist);
                _playlistLoader.on(events.JWPLAYER_ERROR, _playlistError);
                _playlistLoader.load(playlist);
            } else {
                _completePlaylist(_model.config);
            }
        }

        function _completePlaylist(data) {
            var playlist = data.playlist;
            if (_.isArray(playlist)) {
                playlist = Playlist(playlist);
                _model.setPlaylist(playlist);
                if (_model.playlist.length === 0) {
                    _playlistError();
                    return;
                }
                _taskComplete(LOAD_PLAYLIST);
            } else {
                _error('Playlist type not supported', typeof playlist);
            }
        }

        function _playlistError(evt) {
            if (evt && evt.message) {
                _error('Error loading playlist', evt.message);
            } else {
                _error('Error loading player', 'No playable sources found');
            }
        }

        function _loadSkin() {
            // TODO : load CSS file if needed
            _.defer(function() {
                _taskComplete(LOAD_SKIN);
            });
        }

        function _setupComponents() {
            _view.setup();
            _taskComplete(SETUP_COMPONENTS);
        }

        function _sendReady() {
            _this.trigger(events.JWPLAYER_READY);
            _this.destroy();
        }

        function _error(message, reason) {
            _this.trigger(events.JWPLAYER_SETUP_ERROR, {
                message: message + ': ' + reason
            });
            clearTimeout(_setupFailureTimeout);
            _this.destroy();
        }
    };

    Setup.prototype = Events;

    return Setup;
});
