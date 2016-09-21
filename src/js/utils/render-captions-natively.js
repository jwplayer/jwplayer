define([
    'utils/browser'
], function(browser) {
    return function(providerName) {
        // True for providers that use a video tag in browsers that have satisfactory native rendering support
        return (providerName === 'html5' || providerName === 'shaka' || providerName === 'caterpillar') &&
            (browser.isChrome() || browser.isIOS() || browser.isSafari() || browser.isEdge());
    };
});