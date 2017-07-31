import setPlaylist, { loadProvidersForPlaylist } from 'api/set-playlist';
import { PLAYLIST_LOADED, MEDIA_COMPLETE, ERROR } from 'events/events';
import Promise from 'polyfills/promise';
import plugins from 'plugins/plugins';
import PlaylistLoader from 'playlist/loader';
import Playlist from 'playlist/playlist';
import ScriptLoader from 'utils/scriptloader';
import _ from 'utils/underscore';

const resolved = Promise.resolve();

let pluginLoader;

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
        delete window.jwplayerPluginJsonp;
        if (destroyed(_model)) {
            return;
        }
        pluginLoader.setupPlugins(_api, _model);
    });
}

export function loadPlaylist(_model) {
    const playlist = _model.get('playlist');
    if (_.isString(playlist)) {
        return new Promise(resolve => {
            const playlistLoader = new PlaylistLoader();
            playlistLoader.on(PLAYLIST_LOADED, function(data) {
                const loadedPlaylist = Playlist(data.playlist);
                delete data.playlist;
                _model.set('playlist', loadedPlaylist);
                _model.set('feedData', data);
                resolve();
            });
            playlistLoader.on(ERROR, err => {
                _model.set('feedData', {
                    error: new Error(`Error loading playlist: ${err.message}`)
                });
                resolve();
            });
            playlistLoader.load(playlist);
        });
    }
    const normalizedPlaylist = Playlist(playlist);
    _model.set('playlist', normalizedPlaylist);
    return resolved;
}

function filterPlaylist(_model) {
    return loadPlaylist(_model).then(() => {
        if (destroyed(_model)) {
            return;
        }
        // `setPlaylist` performs filtering
        setPlaylist(_model, _model.get('playlist'), _model.get('feedData'));
        loadProvidersForPlaylist(_model);
    });
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
    return loadSkin(_model).then(() => {
        if (destroyed(_model)) {
            return;
        }
        _model.setAutoStart();
        _view.setup();
    });

}

function setPlaylistItem(_model) {
    return filterPlaylist(_model).then(() => {
        if (destroyed(_model)) {
            return;
        }
        return new Promise(resolve => {
            _model.once('itemReady', resolve);
            _model.setItemIndex(_model.get('item'));
        });
    });
}

function destroyed(_model) {
    return _model.attributes._destroyed;
}

const startSetup = function(_api, _model, _view) {
    if (destroyed(_model)) {
        return Promise.reject();
    }
    return Promise.all([
        setPlaylistItem(_model, _api, _view),
        // filterPlaylist -->
        // -- loadPlaylist,
        initPlugins(_model, _api, _view),
        // loadPlugins,
        // setupView -->
        // -- loadSkin
    ]);
};

export default startSetup;
