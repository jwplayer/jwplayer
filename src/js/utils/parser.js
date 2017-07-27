import { exists } from 'utils/validator';
import _ from 'utils/underscore';

// Gets an absolute file path based on a relative filepath
export function getAbsolutePath(path, base) {
    if (!exists(base)) {
        base = document.location.href;
    }

    if (!exists(path)) {
        return;
    }

    if (isAbsolutePath(path)) {
        return path;
    }

    const protocol = base.substring(0, base.indexOf('://') + 3);
    const domain = base.substring(protocol.length, base.indexOf('/', protocol.length + 1));
    let patharray;

    if (path.indexOf('/') === 0) {
        patharray = path.split('/');
    } else {
        let basepath = base.split('?')[0];
        basepath = basepath.substring(protocol.length + domain.length + 1, basepath.lastIndexOf('/'));
        patharray = basepath.split('/').concat(path.split('/'));
    }
    const result = [];
    for (let i = 0; i < patharray.length; i++) {
        if (patharray[i] && exists(patharray[i]) && patharray[i] !== '.') {
            if (patharray[i] === '..') {
                result.pop();
            } else {
                result.push(patharray[i]);
            }
        }
    }
    return protocol + domain + '/' + result.join('/');
}

export function isAbsolutePath(path) {
    return /^(?:(?:https?|file):)?\/\//.test(path);
}

export const getScriptPath = _.memoize(function(scriptName) {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src;
        if (src) {
            const index = src.indexOf('/' + scriptName);
            if (index >= 0) {
                return src.substr(0, index + 1);
            }
        }
    }
    return '';
});

function containsParserErrors(childNodes) {
    return _.some(childNodes, function(node) {
        return node.nodeName === 'parsererror';
    });
}

/** Takes an XML string and returns an XML object **/
export function parseXML(input) {
    let parsedXML = null;
    try {
        // Parse XML in FF/Chrome/Safari/Opera
        if ('DOMParser' in window) {
            parsedXML = (new window.DOMParser()).parseFromString(input, 'text/xml');
            // In Firefox the XML doc may contain the parsererror, other browsers it's further down
            if (containsParserErrors(parsedXML.childNodes) ||
                (parsedXML.childNodes && containsParserErrors(parsedXML.childNodes[0].childNodes))) {
                parsedXML = null;
            }
        } else {
            // Internet Explorer
            parsedXML = new window.ActiveXObject('Microsoft.XMLDOM');
            parsedXML.async = 'false';
            parsedXML.loadXML(input);
        }
    } catch (e) {/* Expected when content is not XML */}

    return parsedXML;
}

/**
 * String representations of booleans and numbers that are 5 characters in length or less
 * are returned typed
 */
export function serialize(val) {
    if (val === undefined) {
        return null;
    }
    if (typeof val === 'string' && val.length < 6) {
        const lowercaseVal = val.toLowerCase();
        if (lowercaseVal === 'true') {
            return true;
        }
        if (lowercaseVal === 'false') {
            return false;
        }
        if (!isNaN(Number(val)) && !isNaN(parseFloat(val))) {
            return Number(val);
        }
    }
    return val;
}

/**
 * Cleans up a css dimension (e.g. '420px') and returns an integer.
 */
export function parseDimension(dimension) {
    if (typeof dimension === 'string') {
        if (dimension === '') {
            return 0;
        } else if (dimension.lastIndexOf('%') > -1) {
            return dimension;
        }
        return parseInt(dimension.replace('px', ''), 10);
    }
    return dimension;
}

/** Format the elapsed / remaining text. **/
export function timeFormat(sec, allowNegative) {
    if ((sec <= 0 && !allowNegative) || _.isNaN(parseInt(sec))) {
        return '00:00';
    }

    // If negative add a minus sign
    const prefix = (sec < 0) ? '-' : '';
    sec = Math.abs(sec);

    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec - hrs * 3600) / 60);
    const secs = Math.floor(sec % 60);

    return prefix + (hrs ? hrs + ':' : '') + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
}
