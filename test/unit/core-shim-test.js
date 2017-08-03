import CoreShim from 'api/core-shim';

describe('CoreShim', function() {

    it('is a constructor', function() {
        const core = new CoreShim();
        expect(core).to.be.an('object');
    });

    it('implements event methods on and off', function() {
        const core = new CoreShim();
        expect(core).to.have.property('on').which.is.a('function');
        expect(core).to.have.property('off').which.is.a('function');
    });
});
