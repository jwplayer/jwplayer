import _ from 'utils/underscore';

export function trim(inputString) {
    return inputString.replace(/^\s+|\s+$/g, '');
}

export function pad(str, length, padder) {
    str = '' + str;
    padder = padder || '0';
    while (str.length < length) {
        str = padder + str;
    }
    return str;
}

// Get the value of a case-insensitive attribute in an XML node
export function xmlAttribute(xml, attribute) {
    for (var attrib = 0; attrib < xml.attributes.length; attrib++) {
        if (xml.attributes[attrib].name && xml.attributes[attrib].name.toLowerCase() === attribute.toLowerCase()) {
            return xml.attributes[attrib].value.toString();
        }
    }
    return '';
}

// This does not return the file extension, instead it returns a media type extension
function getAzureFileFormat(path) {
    if ((/[(,]format=m3u8-/i).test(path)) {
        return 'm3u8';
    } else if ((/[(,]format=mpd-/i).test(path)) {
        return 'mpd';
    }
    return false;
}

export function extension(path) {
    if (!path || path.substr(0, 4) === 'rtmp') {
        return '';
    }

    var azureFormat = getAzureFileFormat(path);
    if (azureFormat) {
        return azureFormat;
    }

    path = path.split('?')[0].split('#')[0];
    if (path.lastIndexOf('.') > -1) {
        return path.substr(path.lastIndexOf('.') + 1, path.length).toLowerCase();
    }
}

// Convert seconds to HH:MN:SS.sss
export function hms(secondsNumber) {
    var h = parseInt(secondsNumber / 3600);
    var m = parseInt(secondsNumber / 60) % 60;
    var s = secondsNumber % 60;
    return pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s.toFixed(3), 6);
}

// Convert a time-representing string to a number
export function seconds(str, frameRate) {
    if (_.isNumber(str)) {
        return str;
    }

    str = str.replace(',', '.');
    var arr = str.split(':');
    var arrLength = arr.length;
    var sec = 0;
    if (str.slice(-1) === 's') {
        sec = parseFloat(str);
    } else if (str.slice(-1) === 'm') {
        sec = parseFloat(str) * 60;
    } else if (str.slice(-1) === 'h') {
        sec = parseFloat(str) * 3600;
    } else if (arrLength > 1) {
        var secIndex = arrLength - 1;
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
        sec = parseFloat(str);
    }
    return sec;
}


export function prefix(arr, add) {
    return _.map(arr, function(val) {
        return add + val;
    });
}

export function suffix(arr, add) {
    return _.map(arr, function(val) {
        return val + add;
    });
}
