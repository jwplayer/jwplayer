import { OS, Browser } from 'environment/environment';

export function isAndroidHls(source) {
    if (source.type === 'hls' && OS.android) {
        if (source.androidhls === false) {
            return false;
        }

        // Allow Android hls playback on versions 4.1 and above, excluding Firefox (which does not support HLS in any version)
        return OS.version.major >= 4 && OS.version.minor >= 1 && !Browser.firefox;
    }
    return null;
}
