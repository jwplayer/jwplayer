import { filterPlaylist } from 'playlist/playlist';

const setPlaylist = function(model, playlist, feedData = {}) {

    model.set('feedData', feedData);
    if (feedData.error instanceof Error) {
        throw feedData.error;
    }

    const filteredPlaylist = filterPlaylist(playlist, model, feedData);

    model.set('playlist', filteredPlaylist);

    if (!Array.isArray(filteredPlaylist) || filteredPlaylist.length === 0) {
        throw new Error('No playable sources found');
    }
};

export function loadProvidersForPlaylist(model) {
    const playlist = model.get('playlist');
    const providersManager = model.getProviders();
    const firstProviderNeeded = providersManager.required([playlist[0]]);

    return providersManager.load(firstProviderNeeded).then(() => {
        if (!model.get('provider')) {
            model.setProvider(model.get('playlistItem'));
        }
    });
}

export default setPlaylist;
