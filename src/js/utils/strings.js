define([
    'utils/underscore'
], function(_) {
    /** Removes whitespace from the beginning and end of a string **/
    var trim = function (inputString) {
        return inputString.replace(/^\s+|\s+$/g, '');
    };

    /**
     * Pads a string
     * @param {String} string
     * @param {Number} length
     * @param {String} padder
     */
    var pad = function (str, length, padder) {
        if (!padder) {
            padder = '0';
        }
        while (str.length < length) {
            str = padder + str;
        }
        return str;
    };

    /**
     * Get the value of a case-insensitive attribute in an XML node
     * @param {XML} xml
     * @param {String} attribute
     * @return {String} Value
     */
    var xmlAttribute = function (xml, attribute) {
        for (var attrib = 0; attrib < xml.attributes.length; attrib++) {
            if (xml.attributes[attrib].name && xml.attributes[attrib].name.toLowerCase() === attribute.toLowerCase()) {
                return xml.attributes[attrib].value.toString();
            }
        }
        return '';
    };

    /**
     * This does not return the file extension, instead it returns a media type extension
     */
    function getAzureFileFormat(path) {
        if (path.indexOf('(format=m3u8-') > -1) {
            return 'm3u8';
        } else {
            return false;
        }
    }

    var extension = function (path) {
        if (!path || path.substr(0, 4) === 'rtmp') {
            return '';
        }

        var azureFormat = getAzureFileFormat(path);
        if (azureFormat) {
            return azureFormat;
        }

        path = path.substring(path.lastIndexOf('/') + 1, path.length).split('?')[0].split('#')[0];
        if (path.lastIndexOf('.') > -1) {
            return path.substr(path.lastIndexOf('.') + 1, path.length).toLowerCase();
        }
    };

    /**
     * Convert a time-representing string to a number.
     *
     * @param {String}    The input string. Supported are 00:03:00.1 / 03:00.1 / 180.1s / 3.2m / 3.2h
     * @return {Number}    The number of seconds.
     */
    var seconds = function (str) {
        if (_.isNumber(str)) {
            return str;
        }

        str = str.replace(',', '.');
        var arr = str.split(':');
        var sec = 0;
        if (str.slice(-1) === 's') {
            sec = parseFloat(str);
        } else if (str.slice(-1) === 'm') {
            sec = parseFloat(str) * 60;
        } else if (str.slice(-1) === 'h') {
            sec = parseFloat(str) * 3600;
        } else if (arr.length > 1) {
            sec = parseFloat(arr[arr.length - 1]);
            sec += parseFloat(arr[arr.length - 2]) * 60;
            if (arr.length === 3) {
                sec += parseFloat(arr[arr.length - 3]) * 3600;
            }
        } else {
            sec = parseFloat(str);
        }
        return sec;
    };


    var prefix = function(arr, add) {
        return _.map(arr, function(val) {
            return add + val;
        });
    };

    var suffix = function(arr, add) {
        return _.map(arr, function(val) {
            return val + add;
        });
    };

    return {
        trim : trim,
        pad : pad,
        xmlAttribute : xmlAttribute,
        extension : extension,
        seconds: seconds,
        suffix: suffix,
        prefix: prefix
    };
});
