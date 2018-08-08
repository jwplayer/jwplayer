import parseNetworkError from 'providers/utils/network-error-parser';

describe('network error parser', function () {

    it('appends the status code if the status code is > 0 with default message key', function () {
        const { code, key } = parseNetworkError(900000, 404);
        expect(code).to.equal(901404);
        expect(key).to.equal('cantPlayVideo');
    });

    it('appends the status code if the status code is 403 with protected content message key', function () {
        const { code, key } = parseNetworkError(900000, 403);
        expect(code).to.equal(901403);
        expect(key).to.equal('protectedContent');
    });

    it('appends a code of 11 if the status code is 0 with default message key', function () {
        const { code, key } = parseNetworkError(900000, 0);
        expect(code).to.equal(901011);
        expect(key).to.equal('cantPlayVideo');
    });

    it('checks for access control errors insecure content with default message key', function () {
        const { code, key } = parseNetworkError(900000, 0, 'https:');
        // location.protocol cannot be stubbed so for now only only assert +12 when tests are run over https
        if (document.location.protocol === 'https:') {
            expect(code).to.equal(901012);
        } else {
            expect(code).to.equal(901011);
        }
        expect(key).to.equal('cantPlayVideo');
    });

    it('appends nothing if the status is below 0 with default message key', function () {
        const { code, key } = parseNetworkError(900000, -1);
        expect(code).to.equal(901000);
        expect(key).to.equal('cantPlayVideo');
    });

    it('appends a code of 10 if the status code is < 400 or > 600', function () {
        expect(parseNetworkError(900000, 601).code).to.equal(901006);
        expect(parseNetworkError(900000, 399).code).to.equal(901006);
    });
});
