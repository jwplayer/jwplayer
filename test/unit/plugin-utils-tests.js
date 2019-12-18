import { mapPluginToCode } from 'plugins/utils';

describe('mapPluginToCode', function () {
    it('assigns 305000 to plugins', function () {
        expect(mapPluginToCode('foo')).to.equal(305000);
    });
});
