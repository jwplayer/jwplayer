import _ from 'utils/underscore';

const userAgentMatch = _.memoize(function (regex) {
    var agent = navigator.userAgent.toLowerCase();
    return (agent.match(regex) !== null);
});

function lazyUserAgentMatch(regex) {
    return function () {
        return userAgentMatch(regex);
    };
}

export function isInt(value) {
    return parseFloat(value) % 1 === 0;
}

export function isFlashSupported() {
    const version = flashVersion();
    return !!(version && version >= __FLASH_VERSION__);
}

export const isFF = lazyUserAgentMatch(/gecko\//i);
export const isIETrident = lazyUserAgentMatch(/trident\/.+rv:\s*11/i);
export const isIPod = lazyUserAgentMatch(/iP(hone|od)/i);
export const isIPad = lazyUserAgentMatch(/iPad/i);
export const isOSX = lazyUserAgentMatch(/Macintosh/i);
// Check for Facebook App Version to see if it's Facebook
export const isFacebook = lazyUserAgentMatch(/FBAV/i);

export function isEdge(browserVersion) {
    if (browserVersion) {
        return userAgentMatch(new RegExp('\\sedge\\/' + browserVersion, 'i'));
    }
    return userAgentMatch(/\sEdge\/\d+/i);
}

export function isMSIE(browserVersion) {
    if (browserVersion) {
        browserVersion = parseFloat(browserVersion).toFixed(1);
        return userAgentMatch(new RegExp('msie\\s*' + browserVersion, 'i'));
    }
    return userAgentMatch(/msie/i);
}

export function isChrome() {
    return userAgentMatch(/\s(?:Chrome|CriOS)\//i) && !isEdge();
}

export function isIE(browserVersion) {
    if (browserVersion) {
        browserVersion = parseFloat(browserVersion).toFixed(1);
        if (browserVersion >= 12) {
            return isEdge(browserVersion);
        } else if (browserVersion >= 11) {
            return isIETrident();
        }
        return isMSIE(browserVersion);
    }
    return isEdge() || isIETrident() || isMSIE();
}

export function isSafari() {
    return (userAgentMatch(/safari/i) && !userAgentMatch(/chrome/i) && !userAgentMatch(/crios/i) &&
    !userAgentMatch(/chromium/i) && !userAgentMatch(/android/i));
}

/** Matches iOS devices **/
export function isIOS(osVersion) {
    if (osVersion) {
        return userAgentMatch(
            new RegExp('iP(hone|ad|od).+\\s(OS\\s' + osVersion + '|.*\\sVersion/' + osVersion + ')', 'i')
        );
    }
    return userAgentMatch(/iP(hone|ad|od)/i);
}

/** Matches Android devices **/
export function isAndroidNative(osVersion) {
    return isAndroid(osVersion, true);
}

export function isAndroid(osVersion, excludeChrome) {
    // Android Browser appears to include a user-agent string for Chrome/18
    if (excludeChrome && userAgentMatch(/chrome\/[123456789]/i) && !userAgentMatch(/chrome\/18/)) {
        return false;
    }
    if (osVersion) {
        // make sure whole number version check ends with point '.'
        if (isInt(osVersion) && !/\./.test(osVersion)) {
            osVersion = '' + osVersion + '.';
        }
        return userAgentMatch(new RegExp('Android\\s*' + osVersion, 'i'));
    }
    return userAgentMatch(/Android/i);
}

/** Matches iOS and Android devices **/
export function isMobile() {
    return isIOS() || isAndroid();
}

export function isIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

/**
 * If the browser has flash capabilities, return the flash version
 */
export function flashVersion() {
    if (isAndroid()) {
        return 0;
    }

    var plugins = navigator.plugins;
    var flash;

    if (plugins) {
        flash = plugins['Shockwave Flash'];
        if (flash && flash.description) {
            return parseFloat(flash.description.replace(/\D+(\d+\.?\d*).*/, '$1'));
        }
    }

    if (typeof window.ActiveXObject !== 'undefined') {
        try {
            flash = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash');
            if (flash) {
                return parseFloat(flash.GetVariable('$version').split(' ')[1].replace(/\s*,\s*/, '.'));
            }
        } catch (e) {
            return 0;
        }

        return flash;
    }
    return 0;
}
