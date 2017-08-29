
// Returns true if the value of the object is null, undefined or the empty string
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

/** Determines if the current page is HTTPS **/
export function isHTTPS() {
    return (window.location.protocol === 'https:');
}

/**
 * Determines if a URL is an RTMP link
 */
export function isRtmp(file, type) {
    return (file.indexOf('rtmp:') === 0 || type === 'rtmp');
}

/**
 * Determines if a URL is a YouTube link
 */
export function isYouTube(path, type) {
    return (type === 'youtube') || (/^(http|\/\/).*(youtube\.com|youtu\.be)\/.+/).test(path);
}

/** Returns the true type of an object * */
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
