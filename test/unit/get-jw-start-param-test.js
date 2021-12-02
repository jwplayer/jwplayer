import sinon from 'sinon';
import getJwStartQueryParam from 'controller/get-jw-start-param';
import { PlayerError } from 'api/errors';
import { SETUP_ERROR, READY } from 'events/events';

describe('Controller', function() {
    describe('getJwStartQueryParam', function() {
        it('can handle null', function() {
            expect(getJwStartQueryParam(null)).to.be.equal(-1);

        });

        it('can handle empty string', function() {
            expect(getJwStartQueryParam('')).to.be.equal(-1);
        });

        it('no jw_start param', function() {
            expect(getJwStartQueryParam('?foo=bar')).to.be.equal(-1);
        });

        it('invalid jw_start param', function() {
            expect(getJwStartQueryParam('?jw_start=')).to.be.equal(-1);
            expect(getJwStartQueryParam('?jw_start=foo')).to.be.equal(-1);
            expect(getJwStartQueryParam('?jw_start=-10')).to.be.equal(-1);
        });

        it('gets a valid jw_start param', function() {
            expect(getJwStartQueryParam('?jw_start=1')).to.be.equal(1);
            expect(getJwStartQueryParam('?jw_start=5')).to.be.equal(5);
            expect(getJwStartQueryParam('?foo=bar&jw_start=1')).to.be.equal(1);
            expect(getJwStartQueryParam('?foo=bar&jw_start=8&bar=foo')).to.be.equal(8);
        });



    });
});
