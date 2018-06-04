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
    });
});

function generateCopy(code, hash) {
    return `JW Player Error ${code}. For more information see https://developer.jwplayer.com/jw-player/docs/developer-guide/api/errors-reference#${hash}`;
}