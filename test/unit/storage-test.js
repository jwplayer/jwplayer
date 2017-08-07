import Storage from 'model/storage';
import SimpleModel from 'model/simplemodel';
import _ from 'test/underscore';

describe('Storage', function() {

    function MockModel() {}
    Object.assign(MockModel.prototype, SimpleModel);

    it('provides persistent storage', function() {
        const model = new MockModel();
        const storage = new Storage('namespace', [
            'volume',
            'mute',
        ]);

        storage.track(model);

        model.set('volume', 70);
        const data1 = storage.getAllItems();
        assert.strictEqual(data1.volume, 70, 'storage listens for changes to model');

        storage.clear();
        const data2 = storage.getAllItems();
        assert.strictEqual(_.size(data2), 0, 'storage is empty after calling clear');

        model.set('mute', true);
        const data3 = storage.getAllItems();
        assert.strictEqual(_.size(data3), 1, 'storage has one item after change to model');
        assert.strictEqual(data3.mute, true, 'boolean value stored properly');
    });
});
