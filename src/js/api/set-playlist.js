import Playlist, { filterPlaylist } from 'playlist/playlist';

const setPlaylist = function(model, array, feedData) {

    model.set('feedData', feedData);
    if (feedData.error instanceof Error) {
        throw feedData.error;
    }

    let playlist = Playlist(array);
    playlist = filterPlaylist(playlist, model, feedData);

    model.set('playlist', playlist);

    if (!Array.isArray(playlist) || playlist.length === 0) {
        throw new Error('No playable sources found');
    }
};

export function loadProvidersForPlaylist(model) {
    const playlist = model.get('playlist');
    const providersManager = model.getProviders();
    const firstProviderNeeded = providersManager.required([playlist[0]]);
    const allProvidersNeeded = providersManager.required(playlist);

    return providersManager.load(firstProviderNeeded)
        .then(function() {
            if (!model.get('provider')) {
                model.setProvider(model.get('playlistItem'));
                // provider is not available under "itemReady" event
            }
            // load remaining providers after first required
            // TODO: schedule for after play or feedloading
            return providersManager.load(allProvidersNeeded);
        });
}

export default setPlaylist;
