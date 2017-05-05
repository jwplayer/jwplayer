define([
    'controller/storage',
    'utils/simplemodel',
    'test/underscore'
], function (Storage, SimpleModel, _) {

    describe('Storage', function() {

        function mockModel() {
            _.extend(this, SimpleModel);
        }

        it('provides persistent storage', function() {

            var model = new mockModel();
            var storage = new Storage();
            storage.track(model);

            model.set('volume', 70);
            data = storage.getAllItems();
            assert.strictEqual(data.volume, 70, 'storage listens for changes to model');

            storage.clear();
            var data = storage.getAllItems();
            assert.strictEqual(_.size(data), 0, 'storage is empty after calling clear');

            model.set('mute', true);
            data = storage.getAllItems();
            assert.strictEqual(_.size(data), 1, 'storage has one item after change to model');
            assert.strictEqual(data.mute, true, 'boolean value stored properly');
        });
    });
});
