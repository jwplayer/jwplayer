/* eslint-disable no-console */

import * as playerutils from 'utils/playerutils';
import * as validator from 'utils/validator';
import * as parser from 'utils/parser';
import Timer from 'api/timer';

// These are AMD modules
import strings from 'utils/strings';
import _ from 'utils/underscore';
import browser from 'utils/browser';
import dom from 'utils/dom';
import css from 'utils/css';
import ajax from 'utils/ajax';
import trycatch from 'utils/trycatch';

define([], function() {
    var utils = {};

    utils.log = (console.log === 'object') ? console.log.bind(console) : function() {};

    utils.between = function (num, min, max) {
        return Math.max(Math.min(num, max), min);
    };

    /**
     * Iterates over an object and executes a callback function for each property (if it exists)
     * This is a safe way to iterate over objects if another script has modified the object prototype
     */
    utils.foreach = function (aData, fnEach) {
        var key;
        var val;

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

    utils.Timer = Timer;

    _.extend(utils, parser, validator, browser, ajax, dom, css, playerutils, trycatch);

    return utils;
});

