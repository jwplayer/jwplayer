define([
    'plugins/plugins',
    'playlist/loader',
    'playlist/playlist',
    'utils/scriptloader',
    'utils/helpers',
    'utils/backbone.events',
    'utils/constants',
    'utils/underscore',
    'events/events'
], function(plugins, PlaylistLoader, Playlist, ScriptLoader, utils, Events, Constants, _, events) {

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
            LOAD_PROVIDERS = {
                method: _loadProviders,
                depends : []
            },
            LOAD_SKIN = {
                method: _loadSkin,
                depends: []
            },
            LOAD_PLAYLIST = {
                method: _loadPlaylist,
                depends: [LOAD_PROVIDERS]
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
            LOAD_PROVIDERS,
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

        function _loadProviders() {
            var config = _model.get('config');

            if (config.dash === 'dashjs') {
                require.ensure(['providers/dashjs'], function (require) {
                    var dashjs = require('providers/dashjs');
                    dashjs.register(window.jwplayer);
                    _model.updateProviders();
                    _taskComplete(LOAD_PROVIDERS);
                }, 'provider.dashjs');
            } else if (config.dash) {
                require.ensure(['providers/shaka'], function(require) {
                    var shaka = require('providers/shaka');
                    shaka.register(window.jwplayer);
                    _model.updateProviders();
                    _taskComplete(LOAD_PROVIDERS);
                }, 'provider.shaka');
            } else {
                _taskComplete(LOAD_PROVIDERS);
            }
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
                var displayarea = document.querySelector('#' + id + ' .jw-overlays');
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

        function skinToLoad(skin) {
            if(_.contains(Constants.Skins, skin)) {
                return utils.getSkinUrl(skin);
            } else {
                console.log('The skin parameter does not match any of our skins : ' + skin);
            }
        }

        function isSkinLoaded(skinPath) {
            var ss = document.styleSheets;
            for (var i = 0, max = ss.length; i < max; i++) {
                if (ss[i].href === skinPath) {
                    return true;
                }
            }
            return false;
        }

        function _loadSkin() {
            var skinName = _model.get('skin');
            var skinUrl = _model.get('skinUrl');


            if (skinName && !skinUrl) {
                // if a skin name is defined, but there is no URL, load from CDN
                skinUrl = skinToLoad(skinName);
            }

            // seven is built into the player
            if (skinName !== 'seven' && _.isString(skinUrl) && !isSkinLoaded(skinUrl)) {
                _model.set('skin-loading', true);

                var isStylesheet = true;
                var loader = new ScriptLoader(skinUrl, isStylesheet);

                loader.addEventListener(events.COMPLETE, function() {
                        _model.set('skin-loading', false);
                    })
                    .addEventListener(events.ERROR, function() {
                        console.log('The given skin failed to load : ', skinUrl);
                        _model.set('skin', null);
                        _model.set('skin-loading', false);
                    });

                loader.load();
            }

            // Control elements are hidden by the loading flag until it is ready
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
            clearTimeout(_setupFailureTimeout);
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
