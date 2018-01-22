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
                const loadedPlaylist = Playlist(data.playlist);
                delete data.playlist;
                _model.attributes.playlist = loadedPlaylist;
                _model.attributes.feedData = data;
                resolve();
            });
            playlistLoader.on(ERROR, err => {
                _model.attributes.playlist = [];
                _model.attributes.feedData = {};
                reject(new Error(`Error loading playlist: ${err.message}`));
            });
            playlistLoader.load(playlist);
        });
    }
    _model.attributes.playlist = Playlist(playlist);
    return resolved;
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
        const firstProviderNeeded = providersManager.required([playlist[0]]);
        // Skip provider loading if included in bundle
        if (bundleContainsProviders.html5 && firstProviderNeeded && firstProviderNeeded[0].name === 'html5') {
            return;
        }
        return providersManager.load(firstProviderNeeded);
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
