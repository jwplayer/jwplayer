import ApiSettings from 'api/api-settings';
import { tryCatch, JwError } from 'utils/trycatch';

describe('trycatch', function() {

    it('defines', function() {
        expect(tryCatch, 'trycatch function is defined').to.be.a('function');
        expect(JwError, 'Error function is defined').to.be.a('function');
    });

    it('should not throw Error for valid call', function() {
        const value = tryCatch(function() {
            return 1;
        });

        expect(value, 'returns value returned by function argument when no exception is thrown').to.equal(1);
    });

    it('should return JwError when there is an exception', function() {
        const error = new Error('Danger, Danger, Will Robinson!');
        let exceptionThrown = false;
        let jwError = null;

        const trycatchThrow = function() {
            jwError = tryCatch(function () {
                exceptionThrown = true;
                throw error;
            });
        };

        expect(trycatchThrow).to.not.throw();
        expect(exceptionThrown).to.be.true;
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
