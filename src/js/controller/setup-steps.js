define([
    'plugins/plugins',
    'playlist/loader',
    'utils/scriptloader',
    'utils/embedswf',
    'utils/constants',
    'utils/underscore',
    'utils/helpers',
    'events/events'
], function(plugins, PlaylistLoader, ScriptLoader, EmbedSwf, Constants, _, utils, events) {

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
            LOAD_SKIN : {
                method: _loadSkin,
                depends: ['LOADED_POLYFILLS']
            },
            LOAD_PLAYLIST : {
                method: _loadPlaylist,
                depends: ['LOADED_POLYFILLS']
            },
            CHECK_FLASH: {
                method: _checkFlash,
                depends : ['LOADED_POLYFILLS']
            },
            FILTER_PLAYLIST: {
                method: _filterPlaylist,
                depends : ['LOAD_PLAYLIST', 'CHECK_FLASH']
            },
            SETUP_VIEW : {
                method: _setupView,
                depends: [
                    'LOAD_SKIN'
                ]
            },
            SET_ITEM : {
                method: _setPlaylistItem,
                depends: [
                    'INIT_PLUGINS',
                    'FILTER_PLAYLIST'
                ]
            },
            SEND_READY : {
                method: _sendReady,
                depends: [
                    'SETUP_VIEW',
                    'SET_ITEM'
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

    function _checkFlash(resolve, _model, _api) {
        var primaryFlash = _model.get('primary') === 'flash';
        var flashVersion = utils.flashVersion();
        if (primaryFlash && flashVersion) {
            var originalContainer = _api.getContainer();
            var parentElement = originalContainer.parentElement;
            if (!parentElement) {
                // Cannot perform test when player container has no parent
                resolve();
            }
            var testContainer = document.createElement('div');
            testContainer.id = _model.get('id');
            var flashHealthCheckId = '' + testContainer.id + '-' + Math.random().toString(16).substr(2);
            var flashHealthCheckSwf = _model.get('flashloader');
            var width = _model.get('width');
            var height = _model.get('height');
            utils.style(testContainer, {
                position: 'relative',
                width: width.toString().indexOf('%') > 0 ? width : (width+ 'px'),
                height: height.toString().indexOf('%') > 0 ? height : (height + 'px')
            });
            var swf = EmbedSwf.embed(flashHealthCheckSwf, testContainer, flashHealthCheckId, null);
            var done = function() {
                if (embedTimeout === -1) {
                    return;
                }
                clearTimeout(embedTimeout);
                embedTimeout = -1;
                resolve();
            };
            var failed = function() {
                _model.set('primary', undefined);
                _model.updateProviders();
                done();
            };
            Object.defineProperty(swf, 'embedCallback', { get: function() { return done; } });
            if (!swf.on) {
                // Chrome bug where properties are not set on object element
                return failed();
            }
            parentElement.replaceChild(testContainer, originalContainer);
            // If "flash.loader.swf" does not fire embedCallback in time, unset primary "flash" config option
            var embedTimeout = setTimeout(failed, 3000);
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


    function _setupView(resolve, _model, _api, _view) {
        _view.setup();
        resolve();
    }

    function _setPlaylistItem(resolve, _model) {
        _model.once('itemReady', resolve);
        _model.setItemIndex(_model.get('item'));
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
