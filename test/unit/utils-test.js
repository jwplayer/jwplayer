define([
    'test/underscore',
    'utils/helpers',
    'sinon',
], function (_, utils, sinon) {
    var log = console.log;

    describe('utils', function() {

        beforeEach(function() {
            console.log = sinon.stub().returns(utils.noop);
        });

        afterEach(function() {
            console.log = log;
        });

        it('utils.log', function() {
            assert.equal(typeof utils.log, 'function', 'is defined');
            assert.strictEqual(utils.log(), undefined, 'utils.log returns undefined');
        });

        it('utils.indexOf', function() {
            assert.equal(typeof utils.indexOf, 'function', 'is defined');
            // provided by underscore 1.6
        });

    });
});
