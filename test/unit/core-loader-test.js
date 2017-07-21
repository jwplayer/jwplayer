import CoreLoader from 'api/core-loader';

describe('CoreLoader', function() {

    it('is a constructor', function() {
        const core = new CoreLoader();
        expect(core).to.be.an('object');
    });

    it('implements event methods on and off', function() {
        const core = new CoreLoader();
        expect(core).to.have.property('on').which.is.a('function');
        expect(core).to.have.property('off').which.is.a('function');
    });


});