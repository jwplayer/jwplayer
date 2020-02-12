import { getPluginErrorCode } from 'plugins/utils';

describe('getPluginErrorCode', function () {
    it('assigns 305000 to plugins', function () {
        expect(getPluginErrorCode('foo')).to.equal(305000);
    });
});
