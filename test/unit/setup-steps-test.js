import { loadTranslations } from 'api/setup-steps';
import * as Language from 'utils/language';
import { ERROR_LOADING_TRANSLATIONS, ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE } from 'api/errors';
import sinon from 'sinon';

describe('Load Translations', function () {
    const sandbox = sinon.createSandbox();
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
        Language.isTranslationAvailable.mock_ = true;
        Language.isLocalizationComplete.mock_ = false;
    });

    afterEach(function() {
        Language.isTranslationAvailable.mock_ = null;
        Language.isLocalizationComplete.mock_ = null;
        Language.loadJsonTranslation.mock_ = null;
    });

    function testLoadTranslations(expectedCode) {
        loadTranslations(model).then(error => {
            expect(error.code).to.equal(expectedCode);
        }).catch(() => {
            assert.isNotOk(true, 'loadTranslations should never be rejected')
        });
    }

    it('Triggers the translation load empty response warning when the response is empty', function() {
        Language.loadJsonTranslation.mock_ = () => Promise.resolve({response: null});
        testLoadTranslations(ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE);
    });

    it('Triggers a warning composed of the translation loading base code and the ajax error code when ajax fails', function() {
        const ERROR_AJAX = 999;
        Language.loadJsonTranslation.mock_ = () => Promise.resolve({code: ERROR_AJAX});
        testLoadTranslations(ERROR_LOADING_TRANSLATIONS + ERROR_AJAX);
    });
});
