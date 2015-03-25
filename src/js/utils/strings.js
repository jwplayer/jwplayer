define([], function() {
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

    return {
        trim : trim,
        pad : pad,
        xmlAttribute : xmlAttribute,
        extension : extension
    };
});
