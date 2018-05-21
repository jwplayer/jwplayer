import parseNetworkError from 'providers/utils/network-error-parser';

describe.only('network error parser', function () {
    it('appends the status code if the status code is > 0', function () {
        const actual = parseNetworkError(1000, 404).code;
        expect(actual).to.equal(1404);
    });

    it('appends a code of 11 if the status code is 0', function () {
        const actual = parseNetworkError(1000, 0).code;
        expect(actual).to.equal(1011);
    });

    it('appends nothing if the status is below 0', function () {
        const actual = parseNetworkError(1000, -1).code;
        expect(actual).to.equal(1000);
    });
});