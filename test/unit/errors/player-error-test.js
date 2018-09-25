import { PlayerError } from 'api/errors';

describe('PlayerError', function () {
    describe('get logMessage', function () {
        it('returns a string containing the code and a URL with the code appended as a hash', function () {
            const error = new PlayerError('', 123999);
            expect(PlayerError.logMessage(error.code)).to.equal(generateCopy(123999, 123999));
        });

        it('squishes the code hash when parsing a network error', function () {
            const error = new PlayerError('', 123404);
            expect(PlayerError.logMessage(error.code)).to.equal(generateCopy(123404, '123400-123599'));
        });

        it('logs warning if the code is in the 300,000 range', function () {
            expect(PlayerError.logMessage(300000)).to.equal(generateCopy(300000, 300000, true));
            expect(PlayerError.logMessage(399999)).to.equal(generateCopy(399999, 399999, true));
            expect(PlayerError.logMessage(312345)).to.equal(generateCopy(312345, 312345, true));
        });
    });
});

function generateCopy(code, hash, isWarning = false) {
    return `JW Player ${isWarning ? 'Warning' : 'Error'} ${code}. For more information see https://developer.jwplayer.com/jw-player/docs/developer-guide/api/errors-reference#${hash}`;
}