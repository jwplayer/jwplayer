import { PLAYLIST_LOADED, ERROR } from 'events/events';
import Promise, { resolved } from 'polyfills/promise';
import PlaylistLoader from 'playlist/loader';
import Playlist, { filterPlaylist, validatePlaylist } from 'playlist/playlist';
import ScriptLoader from 'utils/scriptloader';
import { bundleContainsProviders } from 'api/core-loader';

export function loadPlaylist(_model) {
    const playlist = _model.get('playlist');
    if (typeof playlist === 'string') {
        return new Promise((resolve, reject) => {
            const playlistLoader = new PlaylistLoader();
            playlistLoader.on(PLAYLIST_LOADED, function(data) {
                const loadedPlaylist = data.playlist;
                delete data.playlist;
                setPlaylistAttributes(_model, loadedPlaylist, data);
                resolve();
            });
            playlistLoader.on(ERROR, err => {
                setPlaylistAttributes(_model, [], {});
                reject(new Error(`Error loading playlist: ${err.message}`));
            });
            playlistLoader.load(playlist);
        });
    }
    const feedData = _model.get('feedData') || {};
    setPlaylistAttributes(_model, playlist, feedData);
    return resolved;
}

function setPlaylistAttributes(model, playlist, feedData) {
    const attributes = model.attributes;
    attributes.playlist = Playlist(playlist);
    attributes.feedData = feedData;
}

function loadProvider(_model) {
    return loadPlaylist(_model).then(() => {
        if (destroyed(_model)) {
            return;
        }

        // Loads the first provider if not included in the core bundle
        // A provider loaded this way will not be set upon completion
        const playlist = filterPlaylist(_model.get('playlist'), _model);

        // Throw exception if playlist is empty
        validatePlaylist(playlist);

        const providersManager = _model.getProviders();
        const { name } = providersManager.choose(playlist[0].sources[0]);
        // Skip provider loading if included in bundle
        if (bundleContainsProviders.html5 && name === 'html5') {
            return bundleContainsProviders.html5;
        }
        return providersManager.load(name);
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
    const skinUrl = _model.get('skin') ? _model.get('skin').url : undefined;
    if (typeof skinUrl === 'string' && !isSkinLoaded(skinUrl)) {
        const isStylesheet = true;
        const loader = new ScriptLoader(skinUrl, isStylesheet);
        return loader.load().catch(error => {
            return error;
        });
    }
    return resolved;
}

function destroyed(_model) {
    return _model.attributes._destroyed;
}

const startSetup = function(_model) {
    if (destroyed(_model)) {
        return Promise.reject();
    }
    return Promise.all([
        loadProvider(_model),
        loadSkin(_model)
    ]);
};

export default startSetup;
