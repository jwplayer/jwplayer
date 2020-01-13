import { isValidNumber, isString } from 'utils/underscore';

const parseFloat = window.parseFloat;

export function trim(inputString: string): string {
    return inputString.replace(/^\s+|\s+$/g, '');
}

export function pad(str: string, length: number, padder?: string): string {
    str = '' + str;
    padder = padder || '0';
    while (str.length < length) {
        str = padder + str;
    }
    return str;
}

// Get the value of a case-insensitive attribute in an XML node
export function xmlAttribute(xml: Element, attribute: string): string {
    const attributes = xml.attributes;
    for (let attrib = 0; attrib < attributes.length; attrib++) {
        if (attributes[attrib].name && attributes[attrib].name.toLowerCase() === attribute.toLowerCase()) {
            return attributes[attrib].value.toString();
        }
    }
    return '';
}

export function extension(path: string): string {
    if (!path || path.substr(0, 4) === 'rtmp') {
        return '';
    }

    const azureFormatMatches = (/[(,]format=(m3u8|mpd)-/i).exec(path);
    if (azureFormatMatches) {
        return azureFormatMatches[1];
    }

    path = path.split('?')[0].split('#')[0];
    if (path.lastIndexOf('.') > -1) {
        return path.substr(path.lastIndexOf('.') + 1, path.length).toLowerCase();
    }
    return '';
}

// Convert seconds to HH:MN:SS.sss
export function hms(secondsNumber: number): string {
    const h = (secondsNumber / 3600) | 0;
    const m = ((secondsNumber / 60) | 0) % 60;
    const s = secondsNumber % 60;
    return pad(h.toString(), 2) + ':' + pad(m.toString(), 2) + ':' + pad(s.toFixed(3), 6);
}

// Convert a time-representing string to a number
export function seconds(time?: string | number, frameRate?: number): number {
    if (!time) {
        return 0;
    }
    if (isValidNumber(time)) {
        return time;
    }

    const input = time.replace(',', '.');
    const lastChar = input.slice(-1);
    const arr = input.split(':');
    const arrLength = arr.length;
    let sec = 0;
    if (lastChar === 's') {
        sec = parseFloat(input);
    } else if (lastChar === 'm') {
        sec = parseFloat(input) * 60;
    } else if (lastChar === 'h') {
        sec = parseFloat(input) * 3600;
    } else if (arrLength > 1) {
        let secIndex = arrLength - 1;
        if (arrLength === 4) {
            // if frame is included in the string, calculate seconds by dividing by frameRate
            if (frameRate) {
                sec = parseFloat(arr[secIndex]) / frameRate;
            }
            secIndex -= 1;
        }
        sec += parseFloat(arr[secIndex]);
        sec += parseFloat(arr[secIndex - 1]) * 60;
        if (arrLength >= 3) {
            sec += parseFloat(arr[secIndex - 2]) * 3600;
        }
    } else {
        sec = parseFloat(input);
    }
    if (!isValidNumber(sec)) {
        return 0;
    }
    return sec;
}

// Convert an offset string to a number; supports conversion of percentage offsets
export function offsetToSeconds(offset: string | number, duration?: number, frameRate?: number): number | null {
    if (isString(offset) && offset.slice(-1) === '%') {
        const percent = parseFloat(offset);
        if (!duration || !isValidNumber(duration) || !isValidNumber(percent)) {
            return null;
        }
        return duration * percent / 100;
    }

    return seconds(offset, frameRate);
}

export function prefix(arr: Array<string>, add: string): string[] {
    return arr.map(val => add + val);
}

export function suffix(arr: Array<string>, add: string): string[] {
    return arr.map(val => val + add);
}

export function isPercentage(value: string): boolean {
    return !!value && isString(value) && value.slice(-1) === '%';
}
