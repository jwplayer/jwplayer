define([
    'utils/browser'
], function(browser) {

    return function getIsAndroidHLS(source) {
        if (source.type === 'hls') {
            if (source.androidhls === false && browser.isAndroid()) {
                return false;
            }
            // When androidhls is not set to false, allow HLS playback on Android 4.1 and up
            var isAndroidNative = browser.isAndroidNative;
            if (isAndroidNative(2) || isAndroidNative(3) || isAndroidNative('4.0')) {
                return false;
            } else if (browser.isAndroid() && !browser.isFF()) {
                // skip canPlayType check
                // canPlayType returns '' in native browser even though HLS will play
                return true;
            }
        }
        return null;
    };
});
