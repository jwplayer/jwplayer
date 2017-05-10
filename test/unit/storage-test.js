define([
    'controller/storage',
    'utils/simplemodel',
    'test/underscore'
], function(Storage, SimpleModel, _) {
    /* jshint qunit: true */


    QUnit.module('Storage');

    function mockModel() {
        _.extend(this, SimpleModel);
    }

    QUnit.test('provides persistent storage', function(assert) {

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
