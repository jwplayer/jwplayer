import utils from 'utils/helpers';

describe('utils', function() {

    it('utils.log', function() {
        expect(typeof utils.log, 'is defined').to.equal('function');
        expect(utils.log(), 'utils.log returns undefined').to.equal(undefined);
    });

    it('utils.indexOf', function() {
        expect(typeof utils.indexOf, 'is defined').to.equal('function');
        // provided by underscore 1.6
    });
});
