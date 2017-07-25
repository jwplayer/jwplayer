import * as ControlsLoader from 'controller/controls-loader';
import { PLAYLIST_LOADED, MEDIA_COMPLETE, ERROR } from 'events/events';
import Promise from 'polyfills/promise';

// These are AMD modules
import plugins from 'plugins/plugins';
import PlaylistLoader from 'playlist/loader';
import ScriptLoader from 'utils/scriptloader';
import _ from 'utils/underscore';

const resolved = Promise.resolve();

let pluginLoader;

function loadIntersectionObserverPolyfill() {
    if ('IntersectionObserver' in window &&
        'IntersectionObserverEntry' in window &&
        'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
        return resolved;
    }
    return require.ensure(['intersection-observer'], function (require) {
        require('intersection-observer');
    }, 'polyfills.intersection-observer');
}

function loadPlugins(_model) {
    window.jwplayerPluginJsonp = plugins.registerPlugin;
    pluginLoader = plugins.loadPlugins(_model.get('id'), _model.get('plugins'));
    return new Promise((resolve, reject) => {
        pluginLoader.on(MEDIA_COMPLETE, resolve);
        pluginLoader.on(ERROR, (err) => {
            reject({
                message: 'Could not load plugin',
                error: err
            });
        });
        pluginLoader.load();
    });
}

function initPlugins(_model, _api, _view) {
    return Promise.all([
        setupView(_model, _view),
        loadPlugins(_model)
    ]).then(() => {
        // TODO: check destroyed
        delete window.jwplayerPluginJsonp;
        pluginLoader.setupPlugins(_api, _model);
    });
}

function loadPlaylist(_model) {
    const playlist = _model.get('playlist');
    if (_.isString(playlist)) {
        return new Promise((resolve, reject) => {
            const playlistLoader = new PlaylistLoader();
            playlistLoader.on(PLAYLIST_LOADED, function(data) {
                _model.attributes.feedData = data;
                _model.attributes.playlist = data.playlist;
                resolve();
            });
            playlistLoader.on(ERROR, err => {
                reject(playlistError(err));
            });
            playlistLoader.load(playlist);
        });

    }
    return resolved;
}

function filterPlaylist(_model, _setPlaylist) {
    return loadPlaylist(_model).then(() => {
        // TODO: check destroyed
        // `_setPlaylist` performs filtering
        const success = _setPlaylist(_model.get('playlist'), _model.get('feedData'));
        if (!success) {
            throw playlistError();
        }
    });
}

function playlistError(err) {
    if (err && err.message) {
        return new Error(`Error loading playlist: ${err.message}`);
    }
    return new Error('Error loading player: No playable sources found');
}

function isSkinLoaded(skinPath) {
    const ss = document.styleSheets;
    for (let i = 0, max = ss.length; i < max; i++) {
        if (ss[i].href === skinPath) {
            return true;
        }
    }
    return false;
}

function loadSkin(_model) {
    const skinUrl = _model.get('skinUrl');
    if (_.isString(skinUrl) && !isSkinLoaded(skinUrl)) {
        return new Promise(resolve => {
            const isStylesheet = true;
            const loader = new ScriptLoader(skinUrl, isStylesheet);
            loader.addEventListener(MEDIA_COMPLETE, resolve);
            loader.addEventListener(ERROR, resolve);
            loader.load();
        });
    }
    return resolved;
}

function setupView(_model, _view) {
    return Promise.all([
        loadSkin(_model),
        loadIntersectionObserverPolyfill()
    ]).then(() => {
        // TODO: check destroyed
        _model.setAutoStart();
        _view.setup();
    });

}

function setPlaylistItem(_model, _api, _view, _setPlaylist) {
    return filterPlaylist(_model, _setPlaylist).then(() => {
        // TODO: check destroyed
        return new Promise(resolve => {
            _model.once('itemReady', resolve);
            _model.setItemIndex(_model.get('item'));
        });
    });
}

function loadControls(_model, _view) {
    if (_model.get('controls')) {
        return ControlsLoader.load()
            .then(function (Controls) {
                // TODO: check destroyed
                _view.setControlsModule(Controls);
            })
            .catch(function (err) {
                throw new Error(`Failed to load controls: ${err.message}`);
            });
    }
    return resolved;
}

const startSetup = function(_api, _model, _view, _setPlaylist) {
    return Promise.all([
        setPlaylistItem(_model, _api, _view, _setPlaylist),
        // filterPlaylist -->
        // -- loadPlaylist,
        initPlugins(_model, _api, _view),
        // loadPlugins,
        // setupView -->
        // -- loadSkin,
        // -- loadIntersectionObserverPolyfill
        loadControls(_model, _view)
    ]);
};

export default startSetup;
