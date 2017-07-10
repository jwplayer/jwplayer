define([
    'plugins/plugins',
    'playlist/loader',
    'utils/scriptloader',
    'utils/embedswf',
    'utils/constants',
    'utils/underscore',
    'utils/helpers',
    'events/events',
    'controller/controls-loader',
    'polyfills/promise',
    'polyfills/base64'
], function(plugins, PlaylistLoader, ScriptLoader, EmbedSwf, Constants, _, utils, events, ControlsLoader) {

    var _pluginLoader;
    var _playlistLoader;

    function getQueue() {
        var Components = {
            LOAD_PLUGINS: {
                method: _loadPlugins,
                // Plugins require JavaScript Promises
                depends: []
            },
            LOAD_XO_POLYFILL: {
                method: _loadIntersectionObserverPolyfill,
                depends: []
            },
            LOAD_SKIN: {
                method: _loadSkin,
                depends: []
            },
            LOAD_PLAYLIST: {
                method: _loadPlaylist,
                depends: []
            },
            LOAD_CONTROLS: {
                method: _loadControls,
                depends: []
            },
            SETUP_VIEW: {
                method: _setupView,
                depends: [
                    'LOAD_SKIN',
                    'LOAD_XO_POLYFILL'
                ]
            },
            INIT_PLUGINS: {
                method: _initPlugins,
                depends: [
                    'LOAD_PLUGINS',
                    // Plugins require jw-overlays to setup
                    'SETUP_VIEW'
                ]
            },
            FILTER_PLAYLIST: {
                method: _filterPlaylist,
                depends: [
                    'LOAD_PLAYLIST'
                ]
            },
            SET_ITEM: {
                method: _setPlaylistItem,
                depends: [
                    'INIT_PLUGINS',
                    'FILTER_PLAYLIST'
                ]
            },
            DEFERRED: {
                method: _deferred,
                depends: []
            },
            SEND_READY: {
                method: _sendReady,
                depends: [
                    'LOAD_CONTROLS',
                    'SET_ITEM',
                    'DEFERRED'
                ]
            }
        };

        return Components;
    }

    function _deferred(resolve) {
        setTimeout(resolve, 0);
    }

    function _loadIntersectionObserverPolyfill(resolve) {
        if ('IntersectionObserver' in window &&
            'IntersectionObserverEntry' in window &&
            'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
            resolve();
        } else {
            require.ensure(['intersection-observer'], function (require) {
                require('intersection-observer');
                resolve();
            }, 'polyfills.intersection-observer');
        }
    }

    function _loadPlugins(resolve, _model) {
        window.jwplayerPluginJsonp = plugins.registerPlugin;
        _pluginLoader = plugins.loadPlugins(_model.get('id'), _model.get('plugins'));
        _pluginLoader.on(events.COMPLETE, resolve);
        _pluginLoader.on(events.ERROR, _.partial(_pluginsError, resolve));
        _pluginLoader.load();
    }

    function _initPlugins(resolve, _model, _api) {
        delete window.jwplayerPluginJsonp;
        _pluginLoader.setupPlugins(_api, _model);
        resolve();
    }

    function _pluginsError(resolve, evt) {
        error(resolve, 'Could not load plugin', evt.message);
    }

    function _loadPlaylist(resolve, _model) {
        var playlist = _model.get('playlist');
        if (_.isString(playlist)) {
            _playlistLoader = new PlaylistLoader();
            _playlistLoader.on(events.JWPLAYER_PLAYLIST_LOADED, function(data) {
                _model.attributes.feedData = data;
                _model.attributes.playlist = data.playlist;
                resolve();
            });
            _playlistLoader.on(events.JWPLAYER_ERROR, _.partial(_playlistError, resolve));
            _playlistLoader.load(playlist);
        } else {
            resolve();
        }
    }

    function _filterPlaylist(resolve, _model, _api, _view, _setPlaylist) {
        // Performs filtering
        var success = _setPlaylist(_model.get('playlist'), _model.get('feedData'));

        if (success) {
            resolve();
        } else {
            _playlistError(resolve);
        }
    }

    function _playlistError(resolve, evt) {
        if (evt && evt.message) {
            error(resolve, 'Error loading playlist', evt.message);
        } else {
            error(resolve, 'Error loading player', 'No playable sources found');
        }
    }

    function skinToLoad(skin, base) {
        var skinPath;

        if (_.contains(Constants.SkinsLoadable, skin)) {
            skinPath = base + 'skins/' + skin + '.css';
        }

        return skinPath;
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
                _model.set('skin', 'seven'); // fall back to seven skin
                _model.set('skin-loading', false);
            });

            loader.load();
        }

        // Control elements are hidden by the loading flag until it is ready
        resolve();
    }


    function _setupView(resolve, _model, _api, _view) {
        _model.setAutoStart();
        _view.setup();
        resolve();
    }

    function _setPlaylistItem(resolve, _model) {
        _model.once('itemReady', resolve);
        _model.setItemIndex(_model.get('item'));
    }

    function _sendReady(resolve) {
        resolve({
            type: 'complete'
        });
    }

    function _loadControls(resolve, _model, _api, _view) {
        if (!_model.get('controls')) {
            resolve();
            return;
        }

        ControlsLoader.load()
            .then(function (Controls) {
                _view.setControlsModule(Controls);
                resolve();
            })
            .catch(function (reason) {
                error(resolve, 'Failed to load controls', reason);
            });
    }

    function error(resolve, msg, reason) {
        resolve({
            type: 'error',
            msg: msg,
            reason: reason
        });
    }

    return {
        getQueue: getQueue,
        error: error
    };
});
