define([
    'utils/browser'
], function(browser) {
    return function(providerName) {
        return (providerName === 'html5' || providerName === 'shaka' || providerName === 'caterpillar') &&
            (browser.isChrome() || browser.isIOS() || browser.isSafari() || browser.isEdge());
    };
});