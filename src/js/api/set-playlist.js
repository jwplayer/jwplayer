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

export default setPlaylist;
