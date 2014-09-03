/**
 * String utilities for the JW Player.
 *
 * @version 6.0
 */
(function(utils) {
    /** Removes whitespace from the beginning and end of a string **/
    utils.trim = function(inputString) {
        return inputString.replace(/^\s+|\s+$/g, '');
    };

    /**
     * Pads a string
     * @param {String} string
     * @param {Number} length
     * @param {String} padder
     */
    utils.pad = function(str, length, padder) {
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
    utils.xmlAttribute = function(xml, attribute) {
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

    utils.extension = function(path) {
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

    /** Convert a string representation of a string to an integer **/
    utils.stringToColor = function(value) {
        value = value.replace(/(#|0x)?([0-9A-F]{3,6})$/gi, '$2');
        if (value.length === 3) {
            value = value.charAt(0) + value.charAt(0) + value.charAt(1) +
                value.charAt(1) + value.charAt(2) + value.charAt(2);
        }
        return parseInt(value, 16);
    };


})(jwplayer.utils);
