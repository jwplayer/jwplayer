define([
    'utils/helpers'
], function (utils) {
    /* jshint qunit: true */

    QUnit.test('defines util functions ', function (assert) {
        assert.expect(55);

        // functions in helpers
        assert.equal(typeof utils.log, 'function', 'log function is defined');
        assert.equal(typeof utils.between, 'function', 'between function is defined');
        assert.equal(typeof utils.foreach , 'function', 'foreach function is defined');

        // inherit from parser
        assert.equal(typeof utils.getAbsolutePath, 'function', 'getAbsolutePath function is defined');
        assert.equal(typeof utils.getScriptPath, 'function', 'getScriptPath function is defined');
        assert.equal(typeof utils.parseXML, 'function', 'parseXML function is defined');
        assert.equal(typeof utils.serialize, 'function', 'serialize function is defined');
        assert.equal(typeof utils.parseDimension, 'function', 'parseDimension function is defined');
        assert.equal(typeof utils.timeFormat, 'function', 'timeFormat function is defined');
        assert.equal(typeof utils.adaptiveType, 'function', 'adaptiveType function is defined');

        // inherit from validator
        assert.equal(typeof utils.exists, 'function', 'exists function is defined');
        assert.equal(typeof utils.isHTTPS, 'function', 'isHTTPS function is defined');
        assert.equal(typeof utils.isRtmp, 'function', 'isRtmp function is defined');
        assert.equal(typeof utils.isYouTube, 'function', 'isYouTube function is defined');
        assert.equal(typeof utils.youTubeID, 'function', 'youTubeID function is defined');
        assert.equal(typeof utils.typeOf, 'function', 'typeOf function is defined');

        // inherit from browser
        assert.equal(typeof utils.isFlashSupported, 'function', 'isFlashSupported function is defined');
        assert.equal(typeof utils.isFF, 'function', 'isFF function is defined');
        assert.equal(typeof utils.isChrome, 'function', 'isChrome function is defined');
        assert.equal(typeof utils.isEdge, 'function', 'isEdge function is defined');
        assert.equal(typeof utils.isIPod, 'function', 'isIPod function is defined');
        assert.equal(typeof utils.isIPad, 'function', 'isIPad function is defined');
        assert.equal(typeof utils.isSafari602, 'function', 'isSafari602 function is defined');
        assert.equal(typeof utils.isIETrident, 'function', 'isIETrident function is defined');
        assert.equal(typeof utils.isMSIE, 'function', 'isMSIE function is defined');
        assert.equal(typeof utils.isIE, 'function', 'isIE function is defined');
        assert.equal(typeof utils.isSafari, 'function', 'isSafari function is defined');
        assert.equal(typeof utils.isIOS, 'function', 'isIOS function is defined');
        assert.equal(typeof utils.isAndroidNative, 'function', 'isAndroidNative function is defined');
        assert.equal(typeof utils.isAndroid, 'function', 'isAndroid function is defined');
        assert.equal(typeof utils.isMobile, 'function', 'isMobile function is defined');
        assert.equal(typeof utils.isIframe, 'function', 'isIframe function is defined');
        assert.equal(typeof utils.flashVersion, 'function', 'flashVersion function is defined');

        // inherit from ajax
        assert.equal(typeof utils.ajax, 'function', 'ajax function is defined');

        // inherit from dom
        assert.equal(typeof utils.createElement, 'function', 'createElement function is defined');
        assert.equal(typeof utils.styleDimension, 'function', 'styleDimension function is defined');
        assert.equal(typeof utils.classList, 'function', 'classList function is defined');
        assert.equal(typeof utils.hasClass, 'function', 'hasClass function is defined');
        assert.equal(typeof utils.addClass, 'function', 'addClass function is defined');
        assert.equal(typeof utils.removeClass, 'function', 'removeClass function is defined');
        assert.equal(typeof utils.toggleClass, 'function', 'toggleClass function is defined');
        assert.equal(typeof utils.emptyElement, 'function', 'emptyElement function is defined');
        assert.equal(typeof utils.addStyleSheet, 'function', 'addStyleSheet function is defined');
        assert.equal(typeof utils.empty, 'function', 'empty function is defined');
        assert.equal(typeof utils.bounds, 'function', 'bounds function is defined');

        // inherit from css
        assert.equal(typeof utils.css, 'function', 'css function is defined');
        assert.equal(typeof utils.style, 'function', 'style function is defined');
        assert.equal(typeof utils.clearCss, 'function', 'clearCss function is defined');
        assert.equal(typeof utils.transform, 'function', 'transform function is defined');
        assert.equal(typeof utils.hexToRgba, 'function', 'hexToRgba function is defined');

        // inherit from playerutils
        assert.equal(typeof utils.repo, 'function', 'repo function is defined');
        assert.equal(typeof utils.versionCheck, 'function', 'versionCheck function is defined');
        assert.equal(typeof utils.loadFrom, 'function', 'loadFrom function is defined');

        // inherit from trycatch
        assert.equal(typeof utils.tryCatch, 'function', 'tryCatch function is defined');
        assert.equal(typeof utils.Error, 'function', 'Error function is defined');
    });
});