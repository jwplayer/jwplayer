declare const __FLASH_VERSION__: number;

const userAgent = navigator.userAgent;

function userAgentMatch(regex: RegExp): boolean {
    return userAgent.match(regex) !== null;
}

function lazyUserAgentMatch(regex: RegExp): () => boolean {
    return () => userAgentMatch(regex);
}

export function isFlashSupported(): boolean {
    const version = flashVersion();
    return !!(version && version >= __FLASH_VERSION__);
}

const isIPadOS13 = () => navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
export const isFF = lazyUserAgentMatch(/gecko\//i);
export const isIETrident = lazyUserAgentMatch(/trident\/.+rv:\s*11/i);
export const isIPod = lazyUserAgentMatch(/iP(hone|od)/i);
export const isIPad = () => userAgentMatch(/iPad/i) || isIPadOS13();
export const isOSX = () => userAgentMatch(/Macintosh/i) && !isIPadOS13();
// Check for Facebook App Version to see if it's Facebook
export const isFacebook = lazyUserAgentMatch(/FBAV/i);

export function isEdge(): boolean {
    return userAgentMatch(/\sEdge\/\d+/i);
}

export function isMSIE(): boolean {
    return userAgentMatch(/msie/i);
}

export function isTizen(): boolean {
    return userAgentMatch(/SMART-TV/);
}

export function isChrome(): boolean {
    return userAgentMatch(/\s(?:(?:Headless)?Chrome|CriOS)\//i) && !isEdge() &&
        !userAgentMatch(/UCBrowser/i) &&
        !isTizen();
}

export function isIE(): boolean {
    return isEdge() || isIETrident() || isMSIE();
}

export function isSafari(): boolean {
    return (userAgentMatch(/safari/i) && !userAgentMatch(/(?:Chrome|CriOS|chromium|android|phantom)/i)) ||
        isTizen();
}

export function isIOS(): boolean {
    return userAgentMatch(/iP(hone|ad|od)/i) || isIPadOS13();
}

export function isAndroidNative(): boolean {
    // Android Browser appears to include a user-agent string for Chrome/18
    if (userAgentMatch(/chrome\/[123456789]/i) && !userAgentMatch(/chrome\/18/i) && !isFF()) {
        return false;
    }
    return isAndroid();
}

export function isAndroid(): boolean {
    return userAgentMatch(/Android/i) && !userAgentMatch(/Windows Phone/i);
}

export function isMobile(): boolean {
    return isIOS() || isAndroid() || userAgentMatch(/Windows Phone/i);
}

export function isIframe(): boolean {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

export function flashVersion(): number {
    if (isAndroid()) {
        return 0;
    }

    const plugins = navigator.plugins;
    let flash;

    if (plugins) {
        flash = plugins.namedItem('Shockwave Flash');
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
