define([
    'utils/render-captions-natively',
    'utils/browser'
], function (renderCaptionsNatively, browser) {
    var test = QUnit.test.bind(QUnit);

    var isTrue = function() {
        return true;
    };

    var providersWithVideoElement = ['html5', 'shaka', 'caterpillar'];
    var providersWithoutVideoElement = ['flash', 'flash_adaptive', 'SDKProvider', 'custom_provider'];

    var assertionCount = providersWithVideoElement.length + providersWithoutVideoElement.length;

    var renderNatively = function(yes) {
        if (yes) {
            return ' renders captions natively';
        }
        return ' renders captions with captionsrenderer';
    };

    var assertNativeRendering = function(assert, providers, expected) {
        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];
            assert.equal(renderCaptionsNatively(provider), expected, provider + renderNatively(expected));
        }
    };

    QUnit.module('renderCaptionsNatively', {
        beforeEach: function() {
            browser.isChrome = browser.isIOS = browser.isSafari =
                browser.isEdge = browser.isIE = browser.isFF = function() { return false; };
        }
    });

    test('Captions rendering in Chrome', function (assert) {

        browser.isChrome = isTrue;
        expect(assertionCount);

        assertNativeRendering(assert, providersWithVideoElement, true);
        assertNativeRendering(assert, providersWithoutVideoElement, false);
    });

    test('Captions rendering in iOS', function (assert) {
        browser.isIOS = isTrue;
        expect(assertionCount);

        assertNativeRendering(assert, providersWithVideoElement, true);
        assertNativeRendering(assert, providersWithoutVideoElement, false);
    });

    test('Captions rendering in Safari', function (assert) {
        browser.isSafari = isTrue;
        expect(assertionCount);

        assertNativeRendering(assert, providersWithVideoElement, true);
        assertNativeRendering(assert, providersWithoutVideoElement, false);
    });

    test('Captions rendering in Edge', function (assert) {
        browser.isEdge = isTrue;
        expect(assertionCount);

        assertNativeRendering(assert, providersWithVideoElement, true);
        assertNativeRendering(assert, providersWithoutVideoElement, false);
    });

    test('Captions rendering in FF', function (assert) {
        browser.isFF = isTrue;
        expect(assertionCount);

        assertNativeRendering(assert, providersWithVideoElement, false);
        assertNativeRendering(assert, providersWithoutVideoElement, false);
    });

    test('Captions rendering in IE', function (assert) {
        browser.isIE = isTrue;
        expect(assertionCount);

        assertNativeRendering(assert, providersWithVideoElement, false);
        assertNativeRendering(assert, providersWithoutVideoElement, false);
    });
});