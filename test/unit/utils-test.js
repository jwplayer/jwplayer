import utils from 'utils/helpers';

describe('utils', function() {

    it('utils.log', function() {
        assert.equal(typeof utils.log, 'function', 'is defined');
        assert.strictEqual(utils.log(), undefined, 'utils.log returns undefined');
    });

    it('utils.indexOf', function() {
        assert.equal(typeof utils.indexOf, 'function', 'is defined');
        // provided by underscore 1.6
    });
});
