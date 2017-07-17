import BrowserUtils from 'utils/browser';
import { browserVersion } from './browser-version';
import { osVersion } from './os-version';
const memoize = require('utils/underscore').memoize;

const userAgent = navigator.userAgent;

/**
 * @typedef {object} EnvironmentVersion
 * @property {string} version - The full version string.
 * @property {number} major - The major version.
 * @property {number} minor - The minor version.
 */

/**
 * @typedef {object} BrowserEnvironment
 * @property {boolean} chrome - Is the browser Chrome?
 * @property {boolean} edge - Is the browser Edge?
 * @property {boolean} facebook - Is the browser a Facebook webview?
 * @property {boolean} firefox - Is the browser Firefox?
 * @property {boolean} ie - Is the browser Internet Explorer?
 * @property {boolean} MSIE - Is the browser MSIE?
 * @property {boolean} safari - Is the browser Safari?
 * @property {EnvironmentVersion} version - The browser version.
 */
export const Browser = {};

/**
 * @typedef {object} OSEnvironment
 * @property {boolean} android - Is the operating system Android?
 * @property {boolean} androidNative - Is the operating system Android Native?
 * @property {boolean} iOS - Is the operating system iOS?
 * @property {boolean} mobile - Is the operating system iOS or Android?
 * @property {boolean} OSX - Is the operating system OSX (including MacOS)?
 * @property {boolean} iPad - Is the device an iPad?
 * @property {boolean} iPhone - Is the device an iPhone?
 * @property {boolean} windows - Is the operating system Windows?
 * @property {EnvironmentVersion} version - The operating system version.
 */
export const OS = {};

/**
 * @typedef {object} FeatureEnvironment
 * @property {boolean} flash - Does the session environment support Flash?
 * @property {number} flashVersion - The version of Flash.
 * @property {boolean} iframe - Is the session in an iframe?
 */
export const Features = {};

const isWindows = () => {
    return userAgent.indexOf('Windows') > -1;
};

Object.defineProperties(Browser, {
    chrome: {
        get: memoize(BrowserUtils.isChrome),
        enumerable: true
    },
    edge: {
        get: memoize(BrowserUtils.isEdge),
        enumerable: true
    },
    facebook: {
        get: memoize(BrowserUtils.isFacebook),
        enumerable: true
    },
    firefox: {
        get: memoize(BrowserUtils.isFF),
        enumerable: true
    },
    ie: {
        get: memoize(BrowserUtils.isIE),
        enumerable: true
    },
    msie: {
        get: memoize(BrowserUtils.isMSIE),
        enumerable: true
    },
    safari: {
        get: memoize(BrowserUtils.isSafari),
        enumerable: true
    },
    version: {
        get: memoize(browserVersion.bind(this, Browser, userAgent)),
        enumerable: true
    }
});

Object.defineProperties(OS, {
    android: {
        get: memoize(BrowserUtils.isAndroid),
        enumerable: true
    },
    androidNative: {
        get: memoize(BrowserUtils.isAndroidNative),
        enumerable: true
    },
    iOS: {
        get: memoize(BrowserUtils.isIOS),
        enumerable: true
    },
    mobile: {
        get: memoize(BrowserUtils.isMobile),
        enumerable: true
    },
    OSX: {
        get: memoize(BrowserUtils.isOSX),
        enumerable: true
    },
    iPad: {
        get: memoize(BrowserUtils.isIPad),
        enumerable: true
    },
    iPhone: {
        get: memoize(BrowserUtils.isIPod),
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
        get: memoize(BrowserUtils.isFlashSupported),
        enumerable: true,
    },
    flashVersion: {
        get: memoize(BrowserUtils.flashVersion),
        enumerable: true
    },
    iframe: {
        get: memoize(BrowserUtils.isIframe),
        enumerable: true
    }
});
