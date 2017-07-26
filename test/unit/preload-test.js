import { getPreload } from 'playlist/preload';

describe('getPreload', function() {

    it('should default to metadata when no preload value is given', function() {
        const preload = getPreload();

        expect(preload).to.equal('metadata');
    });

    it('should return the primary value when it is valid', function() {
        const preload = getPreload('auto');

        expect(preload).to.equal('auto');
    });

    it('should default to metadata when primary value is invalid', function() {
        const preload = getPreload('aut');

        expect(preload).to.equal('metadata');
    });

    it('should default to metadata when primary and fallback values are invalid', function() {
        const preload = getPreload('aut', 'non');

        expect(preload).to.equal('metadata');
    });

    it('should return the fallback value when primary value is invalid', function() {
        const preload = getPreload('aut', 'auto');

        expect(preload).to.equal('auto');
    });

    it('should return auto if it is the primary value and there is a valid fallback', function() {
        const preload = getPreload('auto', 'none');

        expect(preload).to.equal('auto');
    });

    it('should return none if it is the primary value and there is a valid fallback', function() {
        const preload = getPreload('none', 'auto');

        expect(preload).to.equal('none');
    });
});
