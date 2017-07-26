import trycatch from 'utils/trycatch';

describe('trycatch', () => {

    it('defines', () => {
        assert.equal(typeof trycatch.tryCatch, 'function', 'trycatch function is defined');
        assert.equal(typeof trycatch.Error, 'function', 'Error function is defined');
    });

    it('should not throw Error for valid call', () => {
        var value = trycatch.tryCatch(function() {
            return 1;
        });

        assert.strictEqual(value, 1, 'returns value returned by function argument when no exception is thrown');
    });

    it.skip('should throw custom Error on catch', () => {
        var trycatchThrow = function() {
            trycatch.tryCatch(function() {
                throw new Error('Danger, Danger, Will Robinson!');
            });
        };

        expect(trycatchThrow).to.throw(trycatch.Error);
    });


    it.skip('should throw Error in debug mode', () => {
        var debug = window.jwplayer.debug;
        window.jwplayer.debug = true;

        var trycatchThrow = function() {
            trycatch.tryCatch(function() {
                throw new Error('Error');
            });
        };

        expect(trycatchThrow).to.throw(Error);

        window.jwplayer.debug = debug;
    });

    it('Error', () => {
        var error = new trycatch.Error('error name', 'error message');

        assert.equal(error.name, 'error name', 'error.name is set');
        assert.equal(error.message, 'error message', 'error.message is set');
    });
});
