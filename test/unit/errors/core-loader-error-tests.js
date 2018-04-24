import sinon from 'sinon';
import { chunkLoadErrorHandler } from 'api/core-loader';

describe('core-loader errors', function () {
    it('exports a chunkLoadErrorHandler function which throws a JWError', function () {
        const handler = chunkLoadErrorHandler(105);
        expect(handler).to.be.a('function');
        // The handler itself is a function, which returns a function which throws
        expect(chunkLoadErrorHandler).to.not.throw();
        expect(handler).to.throw();
    });
});