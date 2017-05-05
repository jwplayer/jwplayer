define([
    'test/underscore',
    'jquery',
    'utils/helpers',
    'api/api'
], function (_, $, utils, Api) {

    const tru = () => true;
    const fals = () => false;
    
    var config = {
        file: 'http://playertest.longtailvideo.com/mp4.mp4'
    };

    function createConfig(mute) {
        return _.extend(config, { autostart: true, mute: mute });
    }

    function createApi(id, globalRemoveCallback) {
        var container = createContainer(id);
        return new Api(container, globalRemoveCallback || _.noop);
    }

    function createContainer(id) {
        var container = $('<div id="' + id + '"></div>')[0];
        return container;
    }

    // Test autostart mute behavior in Safari Desktop and iOS
    function assertMuteState(assert, mobile, mute, result, done) {

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
                assert.equal(muted, false, 'after setting volume to 20, api.getMute() = ' + muted);
            })
            .on('setupError', function() {
                assert.isOk(false, 'FAIL');
            });
        done();
    }

    describe('api.getMute', function() {

        it('api.getMute() on mobile when autostart: true & mute: false', function (done) {
            assertMuteState(assert, true, false, true, done);
        });
        it('api.getMute() on mobile when autostart: true & mute: true', function (done) {
            assertMuteState(assert, true, true, true, done);
        });

        it('api.getMute() on desktop when autostart: true & mute: false', function (done) {
            assertMuteState(assert, false, false, false, done);
        });
        it('api.getMute() on desktop when autostart: true & mute: true', function (done) {
            assertMuteState(assert, false, true, true, done);
        });
    });
});
