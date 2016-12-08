define([
    'test/underscore',
    'utils/helpers',
    'sinon',
], function ( _, utils, sinon) {
    /* jshint qunit: true */
    var test = QUnit.test.bind(QUnit);
    var log = console.log;

    QUnit.module('utils', {
        beforeEach: beforeEach,
        afterEach: afterEach,
    });

    function beforeEach() {
        console.log = sinon.stub().returns(utils.noop);
    }

    function afterEach() {
        console.log = log;
    }

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
