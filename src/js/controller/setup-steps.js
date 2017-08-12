import setPlaylist, { loadProvidersForPlaylist } from 'api/set-playlist';
import { PLAYLIST_LOADED, ERROR } from 'events/events';
import Promise from 'polyfills/promise';
import { registerPlugin, loadPlugins as pluginsLoadPlugins } from 'plugins/plugins';
import PlaylistLoader from 'playlist/loader';
import Playlist from 'playlist/playlist';
import ScriptLoader from 'utils/scriptloader';
import { log } from 'utils/helpers';

const resolved = Promise.resolve();

function loadPlugins(_model, _api) {
    window.jwplayerPluginJsonp = registerPlugin;
    const pluginLoader = pluginsLoadPlugins(_model.get('id'), _model.get('plugins'));
    return pluginLoader.load(_api).then(events => {
        if (events) {
            events.forEach(object => {
                if (object instanceof Error) {
                    log(object.message);
                }
            });
        }
    });
}

function initPlugins(_model, _api, _view) {
    return Promise.all([
        setupView(_model, _view),
        loadPlugins(_model, _api)
    ]).then(() => {
        delete window.jwplayerPluginJsonp;
    });
}

export function loadPlaylist(_model) {
    const playlist = _model.get('playlist');
    if (typeof playlist === 'string') {
        return new Promise(resolve => {
            const playlistLoader = new PlaylistLoader();
            playlistLoader.on(PLAYLIST_LOADED, function(data) {
                const loadedPlaylist = Playlist(data.playlist);
                delete data.playlist;
                _model.attributes.playlist = loadedPlaylist;
                _model.attributes.feedData = data;
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
    _model.attributes.playlist = Playlist(playlist);
    return resolved;
}

function filterPlaylist(_model) {
    return loadPlaylist(_model).then(() => {
        if (destroyed(_model)) {
            return;
        }
        // `setPlaylist` performs filtering
        setPlaylist(_model, _model.get('playlist'), _model.get('feedData'));
        return loadProvidersForPlaylist(_model);
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
    if (typeof skinUrl === 'string' && !isSkinLoaded(skinUrl)) {
        const isStylesheet = true;
        const loader = new ScriptLoader(skinUrl, isStylesheet);
        return loader.load();
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

    return new Promise(resolve => {
        _model.once('itemReady', resolve);
        _model.setItemIndex(_model.get('item'));
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
        filterPlaylist(_model),
        // filterPlaylist -->
        // -- loadPlaylist,
        initPlugins(_model, _api, _view),
        // loadPlugins,
        // setupView -->
        // -- loadSkin
    ]).then(() => {
        if (destroyed(_model)) {
            return;
        }
        // Set the active playlist item after plugins are loaded and the view is setup
        return setPlaylistItem(_model);
    });
};

export default startSetup;
