define([
    'providers/providers',
    'plugins/plugins',
    'playlist/loader',
    'utils/scriptloader',
    'utils/constants',
    'utils/underscore',
    'utils/helpers',
    'events/events'
], function(Providers, plugins, PlaylistLoader, ScriptLoader, Constants, _, utils, events) {

    var _pluginLoader,
        _playlistLoader;


    function getQueue() {

        var Components = {
            LOAD_PROMISE_POLYFILL : {
                method: _loadPromisePolyfill,
                depends: []
            },
            LOAD_BASE64_POLYFILL : {
                method: _loadBase64Polyfill,
                depends: []
            },
            LOADED_POLYFILLS : {
                method: _loadedPolyfills,
                depends: [
                    'LOAD_PROMISE_POLYFILL',
                    'LOAD_BASE64_POLYFILL'
                ]
            },
            LOAD_PLUGINS : {
                method: _loadPlugins,
                depends: ['LOADED_POLYFILLS']
            },
            INIT_PLUGINS : {
                method: _initPlugins,
                depends: [
                    'LOAD_PLUGINS',
                    // Init requires jw-overlays to be in the DOM
                    'SETUP_VIEW'
                ]
            },
            LOAD_PROVIDERS : {
                method: _loadProviders,
                depends: ['FILTER_PLAYLIST']
            },
            LOAD_SKIN : {
                method: _loadSkin,
                depends: ['LOADED_POLYFILLS']
            },
            LOAD_PLAYLIST : {
                method: _loadPlaylist,
                depends: ['LOADED_POLYFILLS']
            },
            FILTER_PLAYLIST: {
                method: _filterPlaylist,
                depends : ['LOAD_PLAYLIST']
            },
            SETUP_VIEW : {
                method: _setupView,
                depends: [
                    'LOAD_SKIN'
                ]
            },
            SEND_READY : {
                method: _sendReady,
                depends: [
                    'INIT_PLUGINS',
                    'LOAD_PROVIDERS',
                    'SETUP_VIEW'
                ]
            }
        };

        return Components;
    }

    function _loadPromisePolyfill(resolve) {
        if (!window.Promise) {
            require.ensure(['polyfills/promise'], function (require) {
                require('polyfills/promise');
                resolve();
            }, 'polyfills.promise');
        } else {
            resolve();
        }
    }

    function _loadBase64Polyfill(resolve) {
        if (!window.btoa || !window.atob) {
            require.ensure(['polyfills/base64'], function(require) {
                require('polyfills/base64');
                resolve();
            }, 'polyfills.base64');
        } else {
            resolve();
        }
    }

    function _loadedPolyfills(resolve){
        resolve();
    }

    function _loadPlugins(resolve, _model) {
        _pluginLoader = plugins.loadPlugins(_model.get('id'), _model.get('plugins'));
        _pluginLoader.on(events.COMPLETE, resolve);
        _pluginLoader.on(events.ERROR, _.partial(_pluginsError, resolve));
        _pluginLoader.load();
    }

    function _initPlugins(resolve, _model, _api) {
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
                _model.set('playlist', data.playlist);
                _model.set('feedid', data.feedid);
                resolve();
            });
            _playlistLoader.on(events.JWPLAYER_ERROR, _.partial(_playlistError, resolve));
            _playlistLoader.load(playlist);
        } else {
            resolve();
        }
    }

    function _filterPlaylist(resolve, _model, _api, _view, _setPlaylist) {
        var playlist = _model.get('playlist');

        // Performs filtering
        var success = _setPlaylist(playlist);

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

    function _loadProviders(resolve, model) {
        var providersManager = model.getProviders();
        var playlist = model.get('playlist');

        var providersNeeded = providersManager.required(playlist);

        Providers.load(providersNeeded)
            .then(resolve);
    }

    function _setupView(resolve, _model, _api, _view) {
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
