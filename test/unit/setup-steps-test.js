import { loadTranslations } from 'api/setup-steps';
import * as Language from 'utils/language';
import { ERROR_LOADING_TRANSLATIONS, ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE } from 'api/errors';
import sinon from 'sinon';

describe('Load Translations', function () {
    const sandbox = sinon.sandbox.create();
    const model = {
        attributes: {
            language: 'es-CL',
            base: 'base',
            setupConfig: {
                localization: {}
            },
            intl: {}
        }
    };

    beforeEach(function() {
        sandbox.stub(Language, 'isTranslationAvailable').returns(true);
        sandbox.stub(Language, 'isLocalizationComplete').returns(false);
    });

    afterEach(function() {
        sandbox.restore();
    });

    function testLoadTranslations(expectedCode) {
        loadTranslations(model).then(error => {
            expect(error.code).to.equal(expectedCode);
        }).catch(() => {
            assert.isNotOk(true, 'loadTranslations should never be rejected')
        });
    }

    it('Triggers the translation load empty response warning when the response is empty', function() {
        sandbox.stub(Language, 'loadJsonTranslation').resolves({ response: null });
        testLoadTranslations(ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE);
    });

    it('Triggers a warning composed of the translation loading base code and the ajax error code when ajax fails', function() {
        const ERROR_AJAX = 999;
        sandbox.stub(Language, 'loadJsonTranslation').rejects({ code: ERROR_AJAX });
        testLoadTranslations(ERROR_LOADING_TRANSLATIONS + ERROR_AJAX);
    });
});