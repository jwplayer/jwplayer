import { OS, Browser } from 'environment/environment';
import { PlaylistItemSource } from 'types/generic.type';

export function isAndroidHls(source: PlaylistItemSource): boolean | null {
    if (source.type === 'hls' && OS.android) {
        if (source.androidhls === false) {
            return false;
        }

        // Allow Android hls playback on versions 4.1 and above, excluding Firefox (which does not support HLS in any version)
        return !Browser.firefox && parseFloat(OS.version.version) >= 4.4;
    }
    return null;
}
