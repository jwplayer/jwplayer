import Api from 'api/api';
import _ from 'test/underscore';
import $ from 'jquery';
import utils from 'utils/helpers';

const tru = () => true;
const fals = () => false;

var config = {
    file: 'http://playertest.longtailvideo.com/mp4.mp4'
};

function createConfig(mute) {
    return Object.assign(config, { autostart: true, mute: mute });
}

function createApi(id) {
    var container = createContainer(id);
    return new Api(container);
}

function createContainer(id) {
    return $('<div id="' + id + '"></div>')[0];
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
            done();
        })
        .on('setupError', function(err) {
            assert.isOk(false, `Setup Error: ${err.message}`);
            done();
        });
}

describe.skip('api.getMute', function() {

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
