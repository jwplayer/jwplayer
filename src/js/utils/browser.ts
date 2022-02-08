function userAgentMatch(regex: RegExp): boolean {
    return navigator.userAgent.match(regex) !== null;
}

const isIPadOS13 = () => navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

export const isFF = () => userAgentMatch(/firefox\//i);

export const isIETrident = () => userAgentMatch(/trident\/.+rv:\s*11/i);

export const isIPod = () => userAgentMatch(/iP(hone|od)/i);

export const isIPad = () => userAgentMatch(/iPad/i) || isIPadOS13();

export const isOSX = () => userAgentMatch(/Macintosh/i) && !isIPadOS13();

// Check for Facebook App Version to see if it's Facebook
export const isFacebook = () => userAgentMatch(/FBAV/i);

export const isEdge = () => userAgentMatch(/\sEdge?\/\d+/i);

export const isMSIE = () => userAgentMatch(/msie/i);

export const isTizen = () => userAgentMatch(/SMART-TV/);

export const isTizenApp = () => isTizen() && !userAgentMatch(/SamsungBrowser/);

export const isChrome = () => userAgentMatch(/\s(?:(?:Headless)?Chrome|CriOS)\//i) &&
    !isEdge() &&
    !userAgentMatch(/UCBrowser/i);

// Exclude Chromium Edge ("Edg/") from isIE
export const isIE = () => !userAgentMatch(/\sEdg\/\d+/i) && (isEdge() || isIETrident() || isMSIE());

export const isSafari = () => (userAgentMatch(/safari/i) &&
    !userAgentMatch(/(?:Chrome|CriOS|chromium|android|phantom)/i)) &&
    !isTizen();

export const isIOS = () => userAgentMatch(/iP(hone|ad|od)/i) || isIPadOS13();

export function isAndroidNative(): boolean {
    // Android Browser appears to include a user-agent string for Chrome/18
    if (userAgentMatch(/chrome\/[123456789]/i) && !userAgentMatch(/chrome\/18/i) && !isFF()) {
        return false;
    }
    return isAndroid();
}

export const isAndroid = () => userAgentMatch(/Android/i) && !userAgentMatch(/Windows Phone/i);

export const isMobile = () => isIOS() || isAndroid() || userAgentMatch(/Windows Phone/i);

export const isIframe = function(): boolean {
    if (typeof isIframe.mock_ === 'boolean') {
        return isIframe.mock_;
    }
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
};

isIframe.mock_ = null;

// Always returns false as flash support is discontinued
export const isFlashSupported = () => false;

// Always returns 0 as flash support is discontinued
export const flashVersion = () => 0;
