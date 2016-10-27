define([
    'utils/strings',
    'utils/underscore',
    'utils/browser',
    'utils/dom',
    'utils/css',
    'utils/parser',
    'utils/id3Parser',
    'utils/ajax',
    'utils/validator',
    'utils/playerutils',
    'utils/trycatch',
    'utils/stream-type'
], function(strings, _, browser, dom, css, parser, id3Parser, ajax, validator, playerutils, trycatch, streamType) {

    var utils = {};

    utils.log = function () {
        if (!window.console) {
            return;
        }
        if (typeof console.log === 'object') {
            console.log(Array.prototype.slice.call(arguments, 0));
        } else {
            console.log.apply(console, arguments);
        }
    };

    utils.between = function (num, min, max) {
        return Math.max(Math.min(num, max), min);
    };

    /**
     * Iterates over an object and executes a callback function for each property (if it exists)
     * This is a safe way to iterate over objects if another script has modified the object prototype
     */
    utils.foreach = function (aData, fnEach) {
        var key, val;
        for (key in aData) {
            if (utils.typeOf(aData.hasOwnProperty) === 'function') {
                if (aData.hasOwnProperty(key)) {
                    val = aData[key];
                    fnEach(key, val);
                }
            } else {
                // IE8 has a problem looping through XML nodes
                val = aData[key];
                fnEach(key, val);
            }
        }
    };

    utils.indexOf = _.indexOf;
    utils.noop = function () {
    };

    utils.seconds = strings.seconds;
    utils.prefix = strings.prefix;
    utils.suffix = strings.suffix;

    _.extend(utils, parser, id3Parser, validator, browser, ajax, dom, css, playerutils, trycatch, streamType);

    return utils;
});

