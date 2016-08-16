define([
    'utils/browser'
], function(browser) {
    var captions = {};

    captions.nativeRenderingSupported = function (providerName) {
        return providerName.indexOf('flash') === -1 &&
            (browser.isChrome() || browser.isIOS() || browser.isSafari() || browser.isEdge());
    };

    return captions;
});