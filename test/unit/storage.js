define([
    'controller/storage',
    'test/underscore'
], function(storage, _) {
    /* jshint qunit: true */


    module('Storage');

    test('provides persistent storage', function() {

        storage.clear();
        var data = storage.getAllItems();
        strictEqual(_.size(data), 0, 'storage is empty after calling clear');

        storage.setItem('alpha', 'beta');
        data = storage.getAllItems();
        strictEqual(_.size(data), 1, '1 item is added after calling setItem on a new item');

        strictEqual(data.alpha, 'beta', 'value stored and retrieved properly');
        strictEqual(storage.getItem('alpha'), 'beta', 'a single value can be retrieved wit getItem');

        storage.removeItem('alpha');
        data = storage.getAllItems();
        strictEqual(_.size(data), 0, 'storage is empty after removing last item');
    });
});
