import parseNetworkError from 'providers/utils/network-error-parser';

describe('network error parser', function () {
    it('appends the status code if the status code is > 0', function () {
        const actual = parseNetworkError(900000, 404).code;
        expect(actual).to.equal(901404);
    });

    it('appends a code of 11 if the status code is 0', function () {
        const actual = parseNetworkError(900000, 0).code;
        expect(actual).to.equal(901011);
    });

    it('appends nothing if the status is below 0', function () {
        const actual = parseNetworkError(900000, -1).code;
        expect(actual).to.equal(901000);
    });

    it('appends a code of 10 if the status code is < 400 or > 600', function () {
        expect(parseNetworkError(900000, 601).code).to.equal(901010);
        expect(parseNetworkError(900000, 399).code).to.equal(901010);
    })
});