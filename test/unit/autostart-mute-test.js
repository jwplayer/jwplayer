define([
    'test/underscore',
    'utils/helpers',
    'api/api'
], function (_, utils, Api) {
    var test = QUnit.test.bind(QUnit);

    var tru = function () { return true; };
    var fals = function () { return false; };

    var config = {
        file: 'http://playertest.longtailvideo.com/mp4.mp4'
    };

    function createConfig(mute) {
        return _.extend(config, {autostart: true, mute: mute});
    }

    // Test autostart mute behavior in Safari Desktop and iOS

    function assertMuteState (assert, mobile, mute, result) {
        var done = assert.async();
        assert.expect(2);

        utils.isIOS = function (version) {
            return mobile && (!version || version > 9);
        };
        utils.isSafari = tru;
        utils.isAndroid = fals;
        utils.isMobile = mobile ? tru : fals;

        var api = createApi('player');
        var c = createConfig(mute);

        api.setup(c)
            .on('ready', function() {
                var muted = api.getMute();
                assert.equal(muted, result, 'api.getMute() = ' + muted);
                api.setVolume(20);
                muted = api.getMute();
                assert.equal(muted, false,  'after setting volume to 20, api.getMute() = ' + muted);
                done();
            });
    }

    QUnit.module('api.getMute');

    test('api.getMute() on mobile when autostart: true & mute: false', function (assert) {
        assertMuteState(assert, true, false, true);
    });
    test('api.getMute() on mobile when autostart: true & mute: true', function (assert) {
        assertMuteState(assert, true, true, true);
    });

    test('api.getMute() on desktop when autostart: true & mute: false', function (assert) {
        assertMuteState(assert, false, false, false);
    });
    test('api.getMute() on desktop when autostart: true & mute: true', function (assert) {
        assertMuteState(assert, false, true, true);
    });

    function createApi(id, globalRemoveCallback) {
        var container = createContainer(id);
        return new Api(container, globalRemoveCallback || _.noop);
    }

    function createContainer(id) {
        var container = $('<div id="' + id + '"></div>')[0];
        $('#qunit-fixture').append(container);
        return container;
    }
});