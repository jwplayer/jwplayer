define([
    'plugins/plugins',
    'playlist/loader',
    'utils/scriptloader',
    'utils/constants',
    'utils/underscore',
    'utils/helpers',
    'events/events'
], function(plugins, PlaylistLoader, ScriptLoader, Constants, _, utils, events) {

    var _pluginLoader,
        _playlistLoader;


    function getQueue() {

        var Components = {
            LOAD_POLYFILLS : {
                method: _loadPolyfills,
                depends: []
            },
            LOAD_PLUGINS : {
                method: _loadPlugins,
                depends: ['LOAD_POLYFILLS']
            },
            LOAD_YOUTUBE : {
                method: _loadYoutube,
                depends: ['LOAD_PLAYLIST']
            },
            LOAD_SKIN : {
                method: _loadSkin,
                depends: []
            },
            LOAD_PLAYLIST : {
                method: _loadPlaylist,
                depends: ['LOAD_PLUGINS']
            },
            SETUP_COMPONENTS : {
                method: _setupComponents,
                depends: [
                    // view controls require that a playlist item be set
                    'LOAD_PLAYLIST',
                    'LOAD_SKIN',
                    'LOAD_YOUTUBE'
                ]
            },
            SEND_READY : {
                method: _sendReady,
                depends: [
                    'LOAD_PLUGINS',
                    'SETUP_COMPONENTS'
                ]
            }
        };

        return Components;
    }


    function _loadPolyfills(resolve) {
        if (!window.btoa || !window.atob) {
            require.ensure(['polyfills/base64'], function(require) {
                require('polyfills/base64');
                resolve();
            });
        } else {
            resolve();
        }
    }

    function _loadPlugins(resolve, _model, _api) {
        _pluginLoader = plugins.loadPlugins(_model.get('id'), _model.get('plugins'));
        _pluginLoader.on(events.COMPLETE, _.partial(_completePlugins, resolve, _model, _api));
        _pluginLoader.on(events.ERROR, _.partial(_pluginsError, resolve));
        _pluginLoader.load();
    }

    function _completePlugins(resolve, _model, _api) {
        _pluginLoader.setupPlugins(_api, _model, _.partial(_resizePlugin, _api));
        
        resolve();
    }

    function _resizePlugin(_api, plugin, div, onready) {
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

            if (displayarea && displayarea.style) {
                div.left = displayarea.style.left;
                div.top = displayarea.style.top;
            }
        };
    }

    function _pluginsError(resolve, evt) {
        error(resolve, 'Could not load plugin', evt.message);
    }

    function _loadPlaylist(resolve, _model) {
        var playlist = _model.get('playlist');
        if (_.isString(playlist)) {
            _playlistLoader = new PlaylistLoader();
            _playlistLoader.on(events.JWPLAYER_PLAYLIST_LOADED, function(data) {
                _completePlaylist(resolve, _model, data.playlist);
            });
            _playlistLoader.on(events.JWPLAYER_ERROR, _.partial(_playlistError, resolve));
            _playlistLoader.load(playlist);
        } else {
            _completePlaylist(resolve, _model, playlist);
        }
    }

    function _completePlaylist(resolve, _model, playlist) {
        _model.setPlaylist(playlist);
        var p = _model.get('playlist');
        if (!_.isArray(p) || p.length === 0) {
            _playlistError(resolve, 'Playlist type not supported');
            return;
        }
        resolve();
    }

    function _playlistError(resolve, evt) {
        if (evt && evt.message) {
            error(resolve, 'Error loading playlist', evt.message);
        } else {
            error(resolve, 'Error loading player', 'No playable sources found');
        }
    }

    function skinToLoad(skin, base) {
        if(_.contains(Constants.SkinsLoadable, skin)) {
            return base + 'skins/' + skin + '.css';
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

    function _loadSkin(resolve, _model) {
        var skinName = _model.get('skin');
        var skinUrl = _model.get('skinUrl');

        // If skin is built into player, there is nothing to load
        if (_.contains(Constants.SkinsIncluded, skinName)) {
            resolve();
            return;
        }

        if (!skinUrl) {
            // if a user doesn't specify a url, we assume it comes from our CDN or config.base
            skinUrl = skinToLoad(skinName, _model.get('base'));
        }

        if (_.isString(skinUrl) && !isSkinLoaded(skinUrl)) {
            _model.set('skin-loading', true);

            var isStylesheet = true;
            var loader = new ScriptLoader(skinUrl, isStylesheet);

            loader.addEventListener(events.COMPLETE, function() {
                _model.set('skin-loading', false);
            });
            loader.addEventListener(events.ERROR, function() {
                console.log('The given skin failed to load : ', skinUrl);
                _model.set('skin', 'seven'); // fall back to seven skin
                _model.set('skin-loading', false);
            });

            loader.load();
        }

        // Control elements are hidden by the loading flag until it is ready
        _.defer(function() {
            resolve();
        });
    }

    function _loadYoutube(resolve, _model) {
        var p = _model.get('playlist');

        var hasYoutube = _.some(p, function(item) {
            return utils.isYouTube(item.file, item.type);
        });

        if (hasYoutube) {
            require.ensure(['providers/youtube'], function(require) {
                var youtube = require('providers/youtube');
                youtube.register(window.jwplayer);
                resolve();
            }, 'provider.youtube');
        } else {
            resolve();
        }
    }

    function _setupComponents(resolve, _model, _api, _view) {
        _model.setItem(0);
        _view.setup();
        resolve();
    }

    function _sendReady(resolve) {
        resolve({
            type : 'complete'
        });
    }

    function error(resolve, msg, reason) {
        resolve({
            type : 'error',
            msg : msg,
            reason : reason
        });
    }

    return {
        getQueue : getQueue,
        error: error
    };
});
