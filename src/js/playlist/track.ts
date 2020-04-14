export interface PlaylistItemTrack {
    _id?: string;
    file?: string;
    kind: 'captions' | 'metadata' | 'thumbnails' | 'chapters';
    data?: (VTTCue | TextTrackCue)[];
    default: boolean;
    name?: string;
    label?: string;
    language?: string;
    source?: 'mpegts'; // Legacy Flash provider attribute
}

const VALID_TRACK_KINDS = ['captions', 'metadata', 'thumbnails', 'chapters'];
function validTrackKind(tk: string): boolean {
    return VALID_TRACK_KINDS.indexOf(tk) !== -1;
}

/**
 * A media source variant present in a playlist item
 * @internal
 * @typedef {object} PlaylistItemTrack
 * @property {'captions'|'subtitles'|'chapters'|'thumbnails'} kind - The kind of track.
 * @property {boolean} default - Enable the track by default.
 */

const Track = function(config?: Partial<PlaylistItemTrack>): PlaylistItemTrack | undefined {
    // File is the only required attr
    if (!config || !config.file) {
        return;
    }

    const trackConfig: PlaylistItemTrack = Object.assign({}, {
        kind: 'captions',
        'default': false
    }, config);

    trackConfig.kind = validTrackKind(trackConfig.kind) ? trackConfig.kind : 'captions';
    // Disable dot notation due to default being a reserved word
    // eslint-disable-next-line dot-notation
    trackConfig['default'] = !!trackConfig['default'];

    return trackConfig;
};

export default Track;
