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

export const isFF = lazyUserAgentMatch(/gecko\//i);
export const isIETrident = lazyUserAgentMatch(/trident\/.+rv:\s*11/i);
export const isIPod = lazyUserAgentMatch(/iP(hone|od)/i);
export const isIPadOS13 = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isIPad = () => userAgentMatch(/iPad/i) || isIPadOS13;
export const isOSX = () => userAgentMatch(/Macintosh/i) && !isIPadOS13;
// Check for Facebook App Version to see if it's Facebook
export const isFacebook = lazyUserAgentMatch(/FBAV/i);

export function isEdge(): boolean {
    return userAgentMatch(/\sEdge\/\d+/i);
}

export function isMSIE(): boolean {
    return userAgentMatch(/msie/i);
}

export function isChrome(): boolean {
    return userAgentMatch(/\s(?:(?:Headless)?Chrome|CriOS)\//i) && !isEdge() && !userAgentMatch(/UCBrowser/i);
}

export function isIE(): boolean {
    return isEdge() || isIETrident() || isMSIE();
}

export function isSafari(): boolean {
    return userAgentMatch(/safari/i) && !userAgentMatch(/(?:Chrome|CriOS|chromium|android|phantom)/i);
}

export function isIOS(): boolean {
    return userAgentMatch(/iP(hone|ad|od)/i) || isIPadOS13;
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

export function flashVersion(): number | Plugin {
    if (isAndroid()) {
        return 0;
    }

    const plugins = navigator.plugins;
    let flashPlugin: Plugin | null = null;

    if (plugins) {
        flashPlugin = plugins.namedItem('Shockwave Flash');
        if (flashPlugin && flashPlugin.description) {
            return parseFloat(flashPlugin.description.replace(/\D+(\d+\.?\d*).*/, '$1'));
        }
    }

    if (typeof window.ActiveXObject !== 'undefined') {
        try {
<<<<<<< HEAD
<<<<<<< HEAD
            const flashObj = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash') as FlashObject;
            if (flashObj) {
                return parseFloat(flashObj.GetVariable('$version').split(' ')[1].replace(/\s*,\s*/, '.'));
=======
            const flashObj = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash');
            if (flashObj) {
                return parseFloat((flashObj as FlashObject).GetVariable('$version').split(' ')[1].replace(/\s*,\s*/, '.'));
>>>>>>> Activate no-unsafe-any lint rule
=======
            const flashObj = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash') as FlashObject;
            if (flashObj) {
                return parseFloat(flashObj.GetVariable('$version').split(' ')[1].replace(/\s*,\s*/, '.'));
>>>>>>> Return flash plugin in flashVersion and cast when vars are defined
            }
        } catch (e) {
            return 0;
        }
<<<<<<< HEAD
<<<<<<< HEAD
=======

        return 0;
>>>>>>> Activate no-unsafe-any lint rule
=======
>>>>>>> Return flash plugin in flashVersion and cast when vars are defined
    }
    return flashPlugin || 0;
}

<<<<<<< HEAD
<<<<<<< HEAD
interface FlashObject extends ActiveXObject {
=======
interface FlashObject {
>>>>>>> Activate no-unsafe-any lint rule
=======
interface FlashObject extends ActiveXObject {
>>>>>>> Return flash plugin in flashVersion and cast when vars are defined
    GetVariable: (s: string) => string;
}
