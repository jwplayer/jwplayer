import ApiSettings from 'api/api-settings';
import { tryCatch, JwError } from 'utils/trycatch';

describe('trycatch', function() {

    it('defines', function() {
        expect(typeof tryCatch, 'trycatch function is defined').to.equal('function');
        expect(typeof JwError, 'Error function is defined').to.equal('function');
    });

    it('should not throw Error for valid call', function() {
        const value = tryCatch(function() {
            return 1;
        });

        expect(value, 'returns value returned by function argument when no exception is thrown').to.equal(1);
    });

    it('should throw custom Error on catch', function() {
        const jwError = tryCatch(function() {
            throw new Error('Danger, Danger, Will Robinson!');
        });

        expect(jwError.name).to.equal('');
        expect(jwError.message).to.equal('Danger, Danger, Will Robinson!');
    });


    it('should throw Error in debug mode', function() {
        const error = new Error('Error');
        const debug = ApiSettings.debug;
        ApiSettings.debug = true;

        const trycatchThrow = function() {
            tryCatch(function() {
                throw error;
            });
        };

        expect(trycatchThrow).to.throw(error);

        ApiSettings.debug = debug;
    });

    it('Error', function() {
        const error = new JwError('error name', 'error message');

        expect(error.name, 'error.name is set').to.equal('error name');
        expect(error.message, 'error.message is set').to.equal('error message');
    });
});
