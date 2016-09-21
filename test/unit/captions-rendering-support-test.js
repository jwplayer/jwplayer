define([
    'utils/render-captions-natively'
], function (renderCaptionsNatively) {
    var test = QUnit.test.bind(QUnit);

    QUnit.module('renderCaptionsNatively');

    test('Captions should be rendered by the browser', function (assert) {
        var providers = ['html5', 'shaka', 'caterpillar'];

        expect(providers.length);

        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];
            assert.equal(renderCaptionsNatively(provider), true, provider + ' renders captions natively');
        }
    });

    test('Captions should be rendered by the player', function (assert) {
        var providers = ['flash', 'flash_adaptive', 'SDKProvider', 'custom_provider'];

        expect(providers.length);

        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];
            assert.equal(renderCaptionsNatively(provider), false, provider + ' renders captions with captionsrenderer');
        }
    });
});