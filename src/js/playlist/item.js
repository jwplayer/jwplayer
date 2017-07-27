import Source from 'playlist/source';
import Track from 'playlist/track';

const isArray = Array.isArray;
/**
 * An item in the playlist
 * @typedef {object} PlaylistItem
 * @property {Array.<PlaylistItemSource>} sources - A list of alternative media sources for the player to choose from.
 * @property {Array.<PlaylistItemTrack>} tracks - A list of tracks associated with this item.
 * @property {string} file - The selected source URL to be played.
 * @property {string} [image] - The poster image.
 * @property {'none'|'metadata'|'auto'} preload - The selected preload setting.
 * @property {number} minDvrWindow - For live streams, the threshold at which the available media should be seekable,
 * and treated as a DVR stream.
 */

const Item = function(config) {
    config = config || {};
    if (!isArray(config.tracks)) {
        delete config.tracks;
    }

    var playlistItem = Object.assign({}, {
        sources: [],
        tracks: [],
        minDvrWindow: 120
    }, config);


    if ((playlistItem.sources === Object(playlistItem.sources)) && !isArray(playlistItem.sources)) {
        playlistItem.sources = [Source(playlistItem.sources)];
    }

    if (!isArray(playlistItem.sources) || playlistItem.sources.length === 0) {
        if (config.levels) {
            playlistItem.sources = config.levels;
        } else {
            playlistItem.sources = [Source(config)];
        }
    }

    /** Each source should be a named object **/
    for (var i = 0; i < playlistItem.sources.length; i++) {
        var s = playlistItem.sources[i];
        if (!s) {
            continue;
        }

        var def = s.default;
        if (def) {
            s.default = (def.toString() === 'true');
        } else {
            s.default = false;
        }

        // If the source doesn't have a label, number it
        if (!playlistItem.sources[i].label) {
            playlistItem.sources[i].label = i.toString();
        }

        playlistItem.sources[i] = Source(playlistItem.sources[i]);
    }

    playlistItem.sources = playlistItem.sources.filter(source => !!source);


    if (!isArray(playlistItem.tracks)) {
        playlistItem.tracks = [];
    }

    if (isArray(playlistItem.captions)) {
        playlistItem.tracks = playlistItem.tracks.concat(playlistItem.captions);
        delete playlistItem.captions;
    }

    playlistItem.tracks = playlistItem.tracks.map(Track).filter(track => !!track);

    return playlistItem;
};

export default Item;
