type PlaylistItemTrack = {
    file?: string;
    kind: 'captions' | 'metadata' | 'thumbnails' | 'chapters';
    default?: boolean;
    name?: string;
    label?: string;
    language?: string;
}

/**
 * A media source variant present in a playlist item
 * @internal
 * @typedef {object} PlaylistItemTrack
 * @property {'captions'|'subtitles'|'chapters'|'thumbnails'} kind - The kind of track.
 * @property {boolean} default - Enable the track by default.
 */

const Track = function(config?: PlaylistItemTrack): PlaylistItemTrack | undefined {
    // File is the only required attr
    if (!config || !config.file) {
        return;
    }

    return Object.assign({}, {
        kind: 'captions',
        'default': false
    }, config);
};

export default Track;
