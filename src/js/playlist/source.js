import { isYouTube, isRtmp } from 'utils/validator';
import { trim, extension } from 'utils/strings';

/**
 * A media source variant present in a playlist item
 * @typedef {object} PlaylistItemSource
 * @property {string} file - The media URL.
 * @property {string} type - The type (common file extension) of media.
 * @property {boolean} default - Default sources are prioritized over others.
 * @property {string} label - The quality label to be used with multiple mp4/webm sources.
 */

const Source = function(config) {
    // file is the only hard requirement
    if (!config || !config.file) {
        return;
    }

    const source = Object.assign({}, {
        'default': false
    }, config);

    // normalize for odd strings
    source.file = trim('' + source.file);

    // regex to check if mimetype is given
    const mimetypeRegEx = /^[^/]+\/(?:x-)?([^/]+)$/;

    if (mimetypeRegEx.test(source.type)) {
        // if type is given as a mimetype
        source.mimeType = source.type;
        source.type = source.type.replace(mimetypeRegEx, '$1');
    }

    // check if the source is youtube or rtmp
    if (isYouTube(source.file)) {
        source.type = 'youtube';
    } else if (isRtmp(source.file)) {
        source.type = 'rtmp';
    } else if (!source.type) {
        source.type = extension(source.file);
    }

    if (!source.type) {
        return;
    }

    // normalize types
    switch (source.type) {
        case 'm3u8':
        case 'vnd.apple.mpegurl':
            source.type = 'hls';
            break;
        case 'dash+xml':
            source.type = 'dash';
            break;
        // Although m4a is a container format, it is most often used for aac files
        // http://en.wikipedia.org/w/index.php?title=MPEG-4_Part_14
        case 'm4a':
            source.type = 'aac';
            break;
        case 'smil':
            source.type = 'rtmp';
            break;
        default:
            break;
    }

    // remove empty strings
    Object.keys(source).forEach(function(key) {
        if (source[key] === '') {
            delete source[key];
        }
    });

    return source;
};

export default Source;
