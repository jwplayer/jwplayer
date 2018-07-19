import sinon from 'sinon';
import CoreShim from 'api/core-shim';
import { PlayerError } from 'api/errors';
import { SETUP_ERROR, READY } from 'events/events';

describe('CoreShim', function() {
    let core;
    let sandbox = sinon.sandbox.create();
    beforeEach(function() {
        core = new CoreShim(document.createElement('div'));
        console.error = sinon.stub();
    });

    afterEach(function() {
        console.error.reset();
    });

    function expectError(expectedCode) {
        sandbox.stub(core.setup, 'start').callsFake(() => Promise.reject(new PlayerError('', expectedCode)));

        return new Promise((resolve, reject) => {
            core.on(SETUP_ERROR, e => resolve(e));
            core.on(READY, e => reject(e));
            core.init({}, {}).catch(reject);
        }).then(e => {
            expect(e.code).to.equal(expectedCode);
        });
    }

    function getReadOnlyError() {
        // This creates an error object with read-only message and code properties
        // This is to mock DOMException which can occur during setup and must be replaced
        // with a player error
        return Object.create(Error.prototype, {
            code: {
                writable: false,
                configurable: false,
                value: 1
            },
            message: {
                writable: false,
                configurable: false,
                value: 'Read-only Error object'
            },
        });
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

    it('handles DOMExceptions with setupError code 100000', function () {
        sandbox.stub(core.setup, 'start').callsFake(() => Promise.reject(getReadOnlyError()));

        return new Promise((resolve, reject) => {
            core.on(SETUP_ERROR, e => resolve(e));
            core.on(READY, e => reject(e));
            core.init({}, {}).catch(reject);
        }).then(e => {
            expect(() => {
                getReadOnlyError().message = 'New error message.';
            }).to.throw();
            expect(e).instanceof(PlayerError);
            expect(e.code).to.equal(100000);
        });
    });
});
