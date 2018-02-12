
/**
 * @param {any} item - The variable to test.
 * @returns {boolean} Is the value of `item` null, undefined or an empty string?
 */
export function exists(item) {
    switch (typeof (item)) {
        case 'string':
            return (item.length > 0);
        case 'object':
            return (item !== null);
        case 'undefined':
            return false;
        default:
            return true;
    }
}

/**
 * @returns {boolean} Is the current page hosted over HTTPS?
 */
export function isHTTPS() {
    return (window.location.protocol === 'https:');
}

/**
 * @param {string} file - The path or url to a media file
 * @param {string} type - The type of the media parsed from a feed or the file extension.
 * @returns {boolean} Is `file` an RTMP link or does `type` equal 'rtmp'?
 */
export function isRtmp(file, type) {
    return (file.indexOf('rtmp:') === 0 || type === 'rtmp');
}

/**
 * @param {string} path - The path or url to a media file
 * @param {string} type - The type of the media parsed from a feed or the media url.
 * @returns {boolean} Is `path` a YouTube link or does `type` equal 'youtube'?
 */
export function isYouTube(path, type) {
    return (type === 'youtube') || (/^(http|\/\/).*(youtube\.com|youtu\.be)\/.+/).test(path);
}

/**
 * @param {string} value - The variable to test.
 * @returns {string} The typeof object, 'array' or 'null'.
 */
export function typeOf(value) {
    if (value === null) {
        return 'null';
    }
    var typeofString = typeof value;
    if (typeofString === 'object') {
        if (Array.isArray(value)) {
            return 'array';
        }
    }
    return typeofString;
}
