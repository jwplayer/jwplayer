define([
    'utils/extendable'
], function (extendable) {
    /* jshint qunit: true */

    QUnit.module('extendable');

    QUnit.test('extendable.extend', function(assert) {
        extendable();

        var static = {'test': 'staticTest'};
        var child = extendable.extend(null, static);
        assert.equal(child.test, 'staticTest', 'extend should allow child to inherit');
    });

});