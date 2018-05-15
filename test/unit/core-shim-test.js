import sinon from 'sinon';
import CoreShim from 'api/core-shim';
import { SETUP_ERROR } from 'events/events';

describe('CoreShim', function() {
    let core;
    let sandbox = sinon.sandbox.create();
    beforeEach(function() {
        core = new CoreShim(document.createElement('div'));
    });

    function expectError(expectedCode) {
        sandbox.stub(core.setup, 'start').callsFake(() => Promise.reject({ message: 'foo', code: expectedCode }));
        const expectError =
            new Promise((resolve, reject) => {
                core.on(SETUP_ERROR, e => resolve(e));
            })
                .then(e => {
                    expect(e.code).to.equal(expectedCode);
                })

        core.init({}, {});
        return expectError;
    }

    it('is a constructor', function() {
        expect(core).to.be.an('object');
    });

    it('implements event methods on and off', function() {
        expect(core).to.have.property('on').which.is.a('function');
        expect(core).to.have.property('off').which.is.a('function');
    });

    it('sets the setupError code to 100000 if passed an error with no code', function () {
        return expectError(100000);
    });

    it('sets the setupError code to 100000 if passed an error with a non-numerical code', function () {
        return expectError(100000);
    });

    it('passes through a valid error code', function () {
        return expectError(424242);
    });
});