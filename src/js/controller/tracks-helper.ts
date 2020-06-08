import type { TextTrackLike } from 'types/generic.type';
import type { PlaylistItemTrack } from 'playlist/track';

type Track = (TextTrackLike | PlaylistItemTrack) & {
    default?: any;
    defaulttrack?: any;
    file?: any;
};

type TrackLabel = { 
    label: string;
    unknownCount: number; 
};

export function createId(track: Track, tracksCount: number): string {
    let trackId;
    const prefix = track.kind || 'cc';
    if (track.default || track.defaulttrack) {
        trackId = 'default';
    } else {
        trackId = track._id || track.file || (prefix + tracksCount);
    }
    return trackId;
}

export function createLabel(track: Track, unknownCount: number): TrackLabel {
    let label = track.label || track.name || track.language;
    if (!label) {
        label = 'Unknown CC';
        unknownCount += 1;
        if (unknownCount > 1) {
            label += ' [' + unknownCount + ']';
        }
    }
    return { label: label, unknownCount: unknownCount };
}
