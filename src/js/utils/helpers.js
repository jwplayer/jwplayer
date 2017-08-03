/* eslint-disable no-console */

import * as playerutils from 'utils/playerutils';
import * as validator from 'utils/validator';
import * as parser from 'utils/parser';
import Timer from 'api/timer';
import { tryCatch, JwError as Error } from 'utils/trycatch';
import strings from 'utils/strings';
import _ from 'utils/underscore';
import browser from 'utils/browser';
import dom from 'utils/dom';
import css from 'utils/css';
import ajax from 'utils/ajax';

define([], function() {

    const log = (typeof console.log === 'function') ? console.log.bind(console) : function() {};

    const between = function (num, min, max) {
        return Math.max(Math.min(num, max), min);
    };

    /**
     * Iterates over an object and executes a callback function for each property (if it exists)
     * This is a safe way to iterate over objects if another script has modified the object prototype
     */
    const foreach = function (aData, fnEach) {
        for (let key in aData) {
            if (Object.prototype.hasOwnProperty.call(aData, key)) {
                fnEach(key, aData[key]);
            }
        }
    };

    const flashVersion = browser.flashVersion;
    const isIframe = browser.isIframe;
    const indexOf = _.indexOf;
    const seconds = strings.seconds;
    const prefix = strings.prefix;
    const suffix = strings.suffix;

    const noop = function () {};

    return Object.assign({}, parser, validator, ajax, dom, css, playerutils, {
        tryCatch,
        Error,
        Timer,
        log,
        between,
        foreach,
        flashVersion,
        isIframe,
        indexOf,
        seconds,
        prefix,
        suffix,
        noop
    });
});
