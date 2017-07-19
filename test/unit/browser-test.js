define([
    'utils/browser'
], function (browser) {

    describe('browser', function() {

        it('browser checks', function() {
            assert.equal(typeof browser.isFF(), 'boolean');
            assert.equal(typeof browser.isIETrident(), 'boolean');
            assert.equal(typeof browser.isMSIE(), 'boolean');
            assert.equal(typeof browser.isIE(), 'boolean');
            assert.equal(typeof browser.isEdge(), 'boolean');
            assert.equal(typeof browser.isSafari(), 'boolean');
            assert.equal(typeof browser.isIOS(), 'boolean');
            assert.equal(typeof browser.isAndroidNative(), 'boolean');
            assert.equal(typeof browser.isAndroid(), 'boolean');
            assert.equal(typeof browser.isMobile(), 'boolean');
        });

        it('browser.flashVersion test', function() {
            var flashVersion = browser.flashVersion();

            assert.equal(typeof flashVersion, 'number', 'Flash version is ' + flashVersion);
        });

    });
});
