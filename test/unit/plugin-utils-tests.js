import { mapPluginToCode } from 'plugins/utils';

describe('mapPluginToCode', function () {
    it('assigns 305000 to unknown plugins', function () {
        expect(mapPluginToCode('foo')).to.equal(305000);
    });

    it('assigns 305001 to jwpsrv.js', function () {
        expect(mapPluginToCode('http://foo.com/jwpsrv.js')).to.equal(305001);
    });

    it('assigns 305002 to googima.js', function () {
        expect(mapPluginToCode('http://foo.com/googima.js')).to.equal(305002);
    });

    it('assigns 305003 to vast.js', function () {
        expect(mapPluginToCode('http://foo.com/vast.js')).to.equal(305003);
    });

    it('assigns 305004 to freewheel.js', function () {
        expect(mapPluginToCode('http://foo.com/freewheel.js')).to.equal(305004);
    });

    it('assigns 305005 to dai.js', function () {
        expect(mapPluginToCode('http://foo.com/dai.js')).to.equal(305005);
    });

    it('assigns 305006 to gapro.js', function () {
        expect(mapPluginToCode('http://foo.com/gapro.js')).to.equal(305006);
    });

    // Our (JW's) plugins do not use query parameters, so it's safe to assume that any which do are not ours
    it('assigns 305000 when the URL contains query parameters', function () {
        expect(mapPluginToCode('http://foo.com/jwpsrv.js?foo=bar')).to.equal(305000);
    });

    it('assigns 305000 when the URL is empty or does not exist', function () {
        expect(mapPluginToCode('')).to.equal(305000);
        expect(mapPluginToCode(null)).to.equal(305000);
        expect(mapPluginToCode(undefined)).to.equal(305000);
    });
});
