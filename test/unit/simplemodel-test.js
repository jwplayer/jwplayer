define([
    'utils/simplemodel',
    'utils/underscore'
], function (simpleModel, _) {
    /* jshint qunit: true */

    QUnit.module('simpleModel');

    QUnit.test('simplemodel', function(assert) {
        var model = _.extend({}, simpleModel);
        assert.notOk(model.get('noExisting'), 'get with no attributes');

        model.set('attr', 'val');
        assert.equal(model.get('attr'), 'val', 'set attribute with value');

        var clone = model.clone();
        assert.equal(clone.attr, 'val', 'clone gets the same attributes');
    });


});
