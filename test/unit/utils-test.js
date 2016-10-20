define([
    'test/underscore',
    'utils/helpers'
], function ( _, utils) {
    /* jshint qunit: true */

    QUnit.module('utils');
    var test = QUnit.test.bind(QUnit);

    test('utils.log', function(assert) {
        assert.expect(2);
        assert.equal(typeof utils.log, 'function', 'is defined');
        assert.strictEqual(utils.log(), undefined, 'utils.log returns undefined');
    });

    test('utils.indexOf', function (assert) {
        assert.expect(1);
        assert.equal(typeof utils.indexOf, 'function', 'is defined');
        // provided by underscore 1.6
    });

});
