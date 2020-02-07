import { exists } from 'utils/validator';
import { isNaN, isValidNumber } from 'utils/underscore';

// Returns the absolute file path based on a relative filepath, and optional base path
export function getAbsolutePath(path: string, base?: string): string {
    if (!base || !exists(base)) {
        base = document.location.href;
    }

    if (!exists(path)) {
        return '';
    }

    if (isAbsolutePath(path)) {
        return path;
    }

    const protocol = base.substring(0, base.indexOf('://') + 3);
    const domain = base.substring(protocol.length, base.indexOf('/', protocol.length + 1));
    let patharray: string[];

    if (path.indexOf('/') === 0) {
        patharray = path.split('/');
    } else {
        let basepath = base.split('?')[0];
        basepath = basepath.substring(protocol.length + domain.length + 1, basepath.lastIndexOf('/'));
        patharray = basepath.split('/').concat(path.split('/'));
    }
    const result: string[] = [];
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

export function isAbsolutePath(path: string): boolean {
    return /^(?:(?:https?|file):)?\/\//.test(path);
}

// Returns an XML object for the given XML string, or null if the input cannot be parsed.
export function parseXML(input: string): XMLDocument | null {
    let parsedXML: XMLDocument | null = null;
    try {
        parsedXML = (new window.DOMParser()).parseFromString(input, 'text/xml');
        // In Firefox the XML doc may contain the parsererror, other browsers it's further down
        if (parsedXML.querySelector('parsererror')) {
            parsedXML = null;
        }
    } catch (e) {/* Expected when content is not XML */}

    return parsedXML;
}

// Returns the `val` argument:
// as null if undefined
// as a boolean for string values 'true' and 'false'
// as a number for numeric strings with a character length of 5 or less
export function serialize(val: any): any {
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

// Returns the integer value a of css string (e.g. '420px')
export function parseDimension(dimension: string): number | string {
    if (isValidNumber(dimension)) {
        return dimension;
    }

    if (dimension === '') {
        return 0;
    } if (dimension.lastIndexOf('%') > -1) {
        return dimension;
    }
    return parseInt(dimension.replace('px', ''), 10);
}

// Returns a formatted time string from "mm:ss" to "hh:mm:ss" for the given number of seconds
export function timeFormat(sec: number, allowNegative?: boolean): string {
    if (isNaN(sec)) {
        sec = parseInt(sec.toString());
    }

    if (isNaN(sec) || !isFinite(sec) || (sec <= 0 && !allowNegative)) {
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
