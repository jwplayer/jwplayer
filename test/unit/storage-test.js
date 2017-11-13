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
        expect(data1.volume, 'storage listens for changes to model').to.equal(70);

        storage.clear();
        const data2 = storage.getAllItems();
        expect(_.size(data2), 'storage is empty after calling clear').to.equal(0);

        model.set('mute', true);
        const data3 = storage.getAllItems();
        expect(_.size(data3), 'storage has one item after change to model').to.equal(1);
        expect(data3.mute, 'boolean value stored properly').to.equal(true);
    });
});
