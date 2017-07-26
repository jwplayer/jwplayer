import utils from 'utils/helpers';

describe('utils', () => {

    it('utils.log', () => {
        assert.equal(typeof utils.log, 'function', 'is defined');
        assert.strictEqual(utils.log(), undefined, 'utils.log returns undefined');
    });

    it('utils.indexOf', () => {
        assert.equal(typeof utils.indexOf, 'function', 'is defined');
        // provided by underscore 1.6
    });
});
