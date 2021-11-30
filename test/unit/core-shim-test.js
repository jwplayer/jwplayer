import sinon from 'sinon';
import CoreShim from 'api/core-shim';
import { PlayerError } from 'api/errors';
import { SETUP_ERROR, READY } from 'events/events';

describe('CoreShim', function() {
    const sandbox = sinon.createSandbox();

    let core;

    beforeEach(function() {
        core = new CoreShim(document.createElement('div'));
        sandbox.spy(console, 'error');
        this.oldurl = window.location.href;
    });

    afterEach(function() {
        sandbox.restore();
        window.history.replaceState({ path: this.oldurl }, '', this.oldurl);
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

    it('uses jw_start when generateSEOMetadata is true', function () {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(window.location.search);

        params.append('jw_start', '5');

        url.search = params.toString();
        const path = url.toString();

        window.history.replaceState({ path }, '', path);

        const options = {file: 'foo.mp4', generateSEOMetadata: true};
        const api = {};
        let event;

        core.on('beforePlay', function(_event) {
            event = _event;
        });

        return core.init(options, api).then(function() {
            expect(core._model.get('autostart')).to.be.equal('viewable');
            expect(core._model.get('playReason')).to.be.equal('unknown');
            expect(event).to.be.eql({
                playReason: 'unknown',
                startTime: 5,
                viewable: 0
            });

        });
    });

    it('does not use jw_start without generateSEOMetadata', function () {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(window.location.search);

        params.append('jw_start', '5');

        url.search = params.toString();
        const path = url.toString();

        window.history.replaceState({ path }, '', path);

        const options = {file: 'foo.mp4'};
        const api = {};
        let event;

        core.on('beforePlay', function(_event) {
            event = _event;
        });

        return core.init(options, api).then(function() {
            expect(core._model.get('autostart')).to.be.false;
            expect(core._model.get('playReason')).to.be.undefined;
            expect(event).to.be.undefined;
        });
    });

    it('does not use jw_start with generateSEOMetadata false', function () {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(window.location.search);

        params.append('jw_start', '5');

        url.search = params.toString();
        const path = url.toString();

        window.history.replaceState({ path }, '', path);

        const options = {file: 'foo.mp4', generateSEOMetadata: false};
        const api = {};
        let event;

        core.on('beforePlay', function(_event) {
            event = _event;
        });

        return core.init(options, api).then(function() {
            expect(core._model.get('autostart')).to.be.false;
            expect(core._model.get('playReason')).to.be.undefined;
            expect(event).to.be.undefined;
        });
    });



});
