define([
    'utils/underscore'
], function(_) {
    var validator = {};

    // Returns true if the value of the object is null, undefined or the empty string
    validator.exists = function (item) {
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
    };

    /** Determines if the current page is HTTPS **/
    validator.isHTTPS = function () {
        return (window.location.href.indexOf('https') === 0);
    };

    /**
     * Determines if a URL is an RTMP link
     */
    validator.isRtmp = function (file, type) {
        return (file.indexOf('rtmp') === 0 || type === 'rtmp');
    };

    /**
     * Determines if a URL is a YouTube link
     */
    validator.isYouTube = function (path, type) {
        return (type === 'youtube') || (/^(http|\/\/).*(youtube\.com|youtu\.be)\/.+/).test(path);
    };

    /**
     * Returns a YouTube ID from a number of YouTube URL formats:
     *
     * Matches the following YouTube URL types:
     *  - http://www.youtube.com/watch?v=YE7VzlLtp-4
     *  - http://www.youtube.com/watch?v=YE7VzlLtp-4&extra_param=123
     *  - http://www.youtube.com/watch#!v=YE7VzlLtp-4
     *  - http://www.youtube.com/watch#!v=YE7VzlLtp-4?extra_param=123&another_param=456
     *  - http://www.youtube.com/v/YE7VzlLtp-4
     *  - http://www.youtube.com/v/YE7VzlLtp-4?extra_param=123&another_param=456
     *  - http://youtu.be/YE7VzlLtp-4
     *  - http://youtu.be/YE7VzlLtp-4?extra_param=123&another_param=456
     *  - YE7VzlLtp-4
     **/
    validator.youTubeID = function (path) {
        // Left as a dense regular expression for brevity.
        var matches = (/v[=\/]([^?&]*)|youtu\.be\/([^?]*)|^([\w-]*)$/i).exec(path);
        if (!matches) {
            return '';
        }
        return matches.slice(1).join('').replace('?', '');
    };


    /** Returns the true type of an object * */
    validator.typeOf = function (value) {
        if (value === null) {
            return 'null';
        }
        var typeofString = typeof value;
        if (typeofString === 'object') {
            if (_.isArray(value)) {
                return 'array';
            }
        }
        return typeofString;
    };

    return validator;
});
