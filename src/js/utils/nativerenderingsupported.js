define([
    'utils/browser'
], function(browser) {
    return function(providerName) {
        return providerName.indexOf('flash') === -1 &&
            (browser.isChrome() || browser.isIOS() || browser.isSafari() || browser.isEdge());
    };
});