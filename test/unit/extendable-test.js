define([
    'utils/extendable'
], function (extendable) {
    /* jshint qunit: true */

    QUnit.module('extendable');

    QUnit.test('extendable.extend', function(assert) {
        extendable();

        var staticTest = {'test': 'staticTest'};
        var child = extendable.extend(null,staticTest);
        assert.equal(child.test, 'staticTest', 'extend should allow child to inherit');
    });

});