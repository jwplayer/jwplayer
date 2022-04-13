import { isAndroidHls } from 'providers/html5-android-hls';
import { isRtmp } from 'utils/validator';
import video from 'utils/video';
import type { PlaylistItemSource } from 'playlist/source';

const MimeTypes = {
    aac: 'audio/mp4',
    mp4: 'video/mp4',
    f4v: 'video/mp4',
    m4v: 'video/mp4',
    mov: 'video/mp4',
    mp3: 'audio/mpeg',
    mpeg: 'audio/mpeg',
    ogv: 'video/ogg',
    ogg: 'video/ogg',
    oga: 'video/ogg',
    vorbis: 'video/ogg',
    webm: 'video/webm',
    // The following are not expected to work in Chrome
    f4a: 'video/aac',
    m3u8: 'application/vnd.apple.mpegurl',
    m3u: 'application/vnd.apple.mpegurl',
    hls: 'application/vnd.apple.mpegurl'
};

export const SupportsMatrix = __HEADLESS__ ? [] : [
    {
        name: 'html5',
        supports: supportsType
    }
];

export function supportsType(source: PlaylistItemSource): boolean {
    if (__HEADLESS__ || !video || !video.canPlayType) {
        return false;
    }

    if (isAndroidHls(source) === false) {
        return false;
    }

    const file = source.file;
    const type = source.type;

    // Ensure RTMP files are not seen as videos
    if (isRtmp(file, type)) {
        return false;
    }

    let mimeType = source.mimeType || MimeTypes[type];

    // Not OK to use HTML5 with no extension
    if (!mimeType) {
        return false;
    }

    // source.mediaTypes is an Array of media types that MediaSource must support for the stream to play
    // Ex: ['video/webm; codecs="vp9"', 'audio/webm; codecs="vorbis"']
    const mediaTypes = source.mediaTypes;
    if (mediaTypes && mediaTypes.length) {
        mimeType = [mimeType].concat(mediaTypes.slice()).join('; ');
    }

    // Last, but not least, we ask the browser
    // (But only if it's a video with an extension known to work in HTML5)
    return !!video.canPlayType(mimeType);
}
