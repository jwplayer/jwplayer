import {
    isChrome,
    isEdge,
    isFacebook,
    isFF,
    isIE,
    isMSIE,
    isSafari,
    isAndroid,
    isAndroidNative,
    isIOS,
    isMobile,
    isOSX,
    isIPad,
    isIPod,
    isFlashSupported,
    flashVersion,
    isIframe,
} from 'utils/browser';
import { browserVersion } from './browser-version';
import { osVersion } from './os-version';
import _ from 'utils/underscore';

const memoize = _.memoize;
const userAgent = navigator.userAgent;

/**
 * @typedef {object} EnvironmentVersion
 * @property {string} version - The full version string.
 * @property {number} major - The major version.
 * @property {number} minor - The minor version.
 */

/**
 * @typedef {object} BrowserEnvironment
 * @property {boolean} androidNative - Is the browser Android Native?
 * @property {boolean} chrome - Is the browser Chrome?
 * @property {boolean} edge - Is the browser Edge?
 * @property {boolean} facebook - Is the browser a Facebook webview?
 * @property {boolean} firefox - Is the browser Firefox?
 * @property {boolean} ie - Is the browser Internet Explorer?
 * @property {boolean} msie - Is the browser MSIE?
 * @property {boolean} safari - Is the browser Safari?
 * @property {EnvironmentVersion} version - The browser version.
 */
export const Browser = {};

/**
 * @typedef {object} OSEnvironment
 * @property {boolean} android - Is the operating system Android?
 * @property {boolean} iOS - Is the operating system iOS?
 * @property {boolean} mobile - Is the operating system iOS or Android?
 * @property {boolean} osx - Is the operating system Mac OS X?
 * @property {boolean} iPad - Is the device an iPad?
 * @property {boolean} iPhone - Is the device an iPhone?
 * @property {boolean} windows - Is the operating system Windows?
 * @property {EnvironmentVersion} version - The operating system version.
 */
export const OS = {};

/**
 * @typedef {object} FeatureEnvironment
 * @property {boolean} flash - Does the browser environment support Flash?
 * @property {number} flashVersion - The version of Flash.
 * @property {boolean} iframe - Is the session in an iframe?
 */
export const Features = {};

const isWindows = () => {
    return userAgent.indexOf('Windows') > -1;
};

Object.defineProperties(Browser, {
    androidNative: {
        get: memoize(isAndroidNative),
        enumerable: true
    },
    chrome: {
        get: memoize(isChrome),
        enumerable: true
    },
    edge: {
        get: memoize(isEdge),
        enumerable: true
    },
    facebook: {
        get: memoize(isFacebook),
        enumerable: true
    },
    firefox: {
        get: memoize(isFF),
        enumerable: true
    },
    ie: {
        get: memoize(isIE),
        enumerable: true
    },
    msie: {
        get: memoize(isMSIE),
        enumerable: true
    },
    safari: {
        get: memoize(isSafari),
        enumerable: true
    },
    version: {
        get: memoize(browserVersion.bind(this, Browser, userAgent)),
        enumerable: true
    }
});

Object.defineProperties(OS, {
    android: {
        get: memoize(isAndroid),
        enumerable: true
    },
    iOS: {
        get: memoize(isIOS),
        enumerable: true
    },
    mobile: {
        get: memoize(isMobile),
        enumerable: true
    },
    mac: {
        get: memoize(isOSX),
        enumerable: true
    },
    iPad: {
        get: memoize(isIPad),
        enumerable: true
    },
    iPhone: {
        get: memoize(isIPod),
        enumerable: true
    },
    windows: {
        get: memoize(isWindows),
        enumerable: true
    },
    version: {
        get: memoize(osVersion.bind(this, OS, userAgent)),
        enumerable: true
    }
});

Object.defineProperties(Features, {
    flash: {
        get: memoize(isFlashSupported),
        enumerable: true,
    },
    flashVersion: {
        get: memoize(flashVersion),
        enumerable: true
    },
    iframe: {
        get: memoize(isIframe),
        enumerable: true
    },
    backgroundLoading: {
        get: memoize(() => !OS.iOS),
        enumerable: true
    }
});
