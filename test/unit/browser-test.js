define([
    'utils/browser'
], function (browser) {
    /* jshint qunit: true */

    QUnit.module('browser');
    var test = QUnit.test.bind(QUnit);

    test('browser checks', function(assert) {
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

    test('browser.flashVersion test', function(assert) {
        var flashVersion = browser.flashVersion();

        assert.equal(typeof flashVersion, 'number', 'Flash version is ' + flashVersion);
    });

});
