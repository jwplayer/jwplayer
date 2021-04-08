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
    isTizen,
    isTizenApp
} from 'utils/browser';
import { browserVersion } from './browser-version';
import { osVersion } from './os-version';
import type { GenericObject } from 'types/generic.type';

const userAgent: string = navigator.userAgent;
const noop: () => void = () => {
    // Do nothing
};

function supportsPassive(): boolean {
    let passiveOptionRead = false;

    if (!__HEADLESS__) {
        try {
            const opts: GenericObject = Object.defineProperty({}, 'passive', {
                get: () => (passiveOptionRead = true)
            });
            window.addEventListener('testPassive', noop, opts);
            window.removeEventListener('testPassive', noop, opts);
        } catch (e) {/* noop */}
    }

    return passiveOptionRead;
}

/**
 * @typedef {object} EnvironmentVersion
 * @property {string} version - The full version string.
 * @property {number} major - The major version.
 * @property {number} minor - The minor version.
 */
export type EnvironmentVersion = {
    version: string | undefined;
    major: number | undefined;
    minor: number | undefined;
 }

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
export type BrowserEnvironment = {
    androidNative: boolean;
    chrome: boolean;
    edge: boolean;
    facebook: boolean;
    firefox: boolean;
    ie: boolean;
    msie: boolean;
    safari: boolean;
    version: EnvironmentVersion;
}
export const Browser: BrowserEnvironment = {
    get androidNative(): boolean {
        return isAndroidNative();
    },
    get chrome(): boolean {
        return isChrome();
    },
    get edge(): boolean {
        return isEdge();
    },
    get facebook(): boolean {
        return isFacebook();
    },
    get firefox(): boolean {
        return isFF();
    },
    get ie(): boolean {
        return isIE();
    },
    get msie(): boolean {
        return isMSIE();
    },
    get safari(): boolean {
        return isSafari();
    },
    get version(): EnvironmentVersion {
        return browserVersion(this, userAgent);
    }
};

/**
 * @typedef {object} OSEnvironment
 * @property {boolean} android - Is the operating system Android?
 * @property {boolean} iOS - Is the operating system iOS?
 * @property {boolean} mobile - Is the operating system iOS or Android?
 * @property {boolean} mac - Is the operating system Mac OS X?
 * @property {boolean} iPad - Is the device an iPad?
 * @property {boolean} iPhone - Is the device an iPhone?
 * @property {boolean} windows - Is the operating system Windows?
 * @property {EnvironmentVersion} version - The operating system version.
 */
export type OSEnvironment = {
    android: boolean;
    iOS: boolean;
    mobile: boolean;
    mac: boolean;
    iPad: boolean;
    iPhone: boolean;
    windows: boolean;
    tizen: boolean;
    tizenApp: boolean;
    version: EnvironmentVersion;
}
export const OS: OSEnvironment = {
    get android(): boolean {
        return isAndroid();
    },
    get iOS(): boolean {
        return isIOS();
    },
    get mobile(): boolean {
        return isMobile();
    },
    get mac(): boolean {
        return isOSX();
    },
    get iPad(): boolean {
        return isIPad();
    },
    get iPhone(): boolean {
        return isIPod();
    },
    get windows(): boolean {
        return userAgent.indexOf('Windows') > -1;
    },
    get tizen(): boolean {
        return isTizen();
    },
    get tizenApp(): boolean {
        return isTizenApp();
    },
    get version(): EnvironmentVersion {
        return osVersion(this, userAgent);
    }
};

/**
 * @typedef {object} FeatureEnvironment
 * @property {boolean} flash - Does the browser environment support Flash?
 * @property {number} flashVersion - The version of Flash.
 * @property {boolean} iframe - Is the session in an iframe?
 */
type FeatureEnvironment = {
    flash: boolean;
    flashVersion: number;
    iframe: boolean;
    passiveEvents: boolean;
    backgroundLoading: boolean;
}
export const Features: FeatureEnvironment = {
    get flash(): boolean {
        return isFlashSupported();
    },
    get flashVersion(): number {
        return flashVersion();
    },
    get iframe(): boolean {
        return isIframe();
    },
    get passiveEvents(): boolean {
        return supportsPassive();
    },
    get backgroundLoading(): boolean {
        return __HEADLESS__ || !(OS.iOS || Browser.safari || OS.tizen);
    }
};
