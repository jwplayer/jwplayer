import { chunkLoadErrorHandler, chunkLoadWarningHandler } from 'api/core-loader';
import { MSG_CANT_LOAD_PLAYER } from 'api/errors';

describe('core-loader errors', function () {
    it('exports a chunkLoadErrorHandler function which throws a JWError', function () {
        const handler = chunkLoadErrorHandler(105);
        expect(handler).to.be.a('function');
        // The handler itself is a function, which returns a function which throws
        expect(chunkLoadErrorHandler).to.not.throw();
        expect(handler).to.throw().with.property('key', MSG_CANT_LOAD_PLAYER);
    });

    it('exports a chunkLoadWarningHandler function which throws a JWError', function () {
        const handler = chunkLoadWarningHandler(105);
        expect(handler).to.be.a('function');
        // The handler itself is a function, which returns a function which throws
        expect(chunkLoadErrorHandler).to.not.throw();
        expect(handler).to.throw().but.not.with.property('key');
    });
});