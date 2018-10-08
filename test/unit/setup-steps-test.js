import { loadTranslations } from 'api/setup-steps';
import SimpleModel from 'model/simplemodel';
import * as Language from 'utils/language';
import { ERROR_LOADING_TRANSLATIONS, ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE } from 'api/errors';
import sinon from 'sinon';

describe.only('Load Translations', function () {
    const sandbox = sinon.sandbox.create();
    function MockModel() {}
    Object.assign(MockModel.prototype, SimpleModel);
    const model = new MockModel();
    model.attributes = {
        language: 'es-CL',
        base: 'base',
        setupConfig: {
            localization: {}
        },
        intl: {}
    };

    beforeEach(function() {
        sandbox.stub(Language, 'isTranslationAvailable').returns(true);
        sandbox.stub(Language, 'isLocalizationComplete').returns(false);
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('Triggers the translation load empty response warning when the response is empty', function() {
        sandbox.stub(Language, 'loadJsonTranslation').resolves({ response: null });
        loadTranslations(model).then(error => {
            expect(error.code).to.equal(ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE);
        });
    });

    it('Triggers a warning composed of the translation loading base code and the ajax error code when ajax fails', function() {
        const ajaxErrorCode = 999;
        sandbox.stub(Language, 'loadJsonTranslation').rejects({ code: ajaxErrorCode });
        loadTranslations(model).then(error => {
            expect(error.code).to.equal(ERROR_LOADING_TRANSLATIONS + ajaxErrorCode);
        });

    });
});