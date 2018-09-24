import { getLabel, getCode, getLanguage, translatedLanguageCodes, isTranslationAvailable } from 'utils/language';
import { createElement } from 'utils/dom';
import * as Browser from 'utils/browser';
import sinon from 'sinon';

describe('languageUtils', function() {

    describe('getLabel from unsupported codes', function() {

        it('should not change value if there is no matching language code', function() {
            expect(getLabel()).to.equal(undefined);
            expect(getLabel(null)).to.equal(undefined);
            expect(getLabel('po')).to.equal('po');
            expect(getLabel('pol')).to.equal('pol');
        });

        describe('getLabel from ISO 639-1 codes', function() {

            it('should be English for its codes', function() {
                const expected = 'English';

                expect(getLabel('en')).to.equal(expected);
            });

            it('should be Chinese for its codes', function() {
                const expected = 'Chinese';

                expect(getLabel('zh')).to.equal(expected);
            });

            it('should be Dutch for its codes', function() {
                const expected = 'Dutch';

                expect(getLabel('nl')).to.equal(expected);
            });

            it('should be French for its codes', function() {
                const expected = 'French';

                expect(getLabel('fr')).to.equal(expected);
            });

            it('should be German for its codes', function() {
                const expected = 'German';

                expect(getLabel('de')).to.equal(expected);
            });

            it('should be Japanese for its codes', function() {
                const expected = 'Japanese';

                expect(getLabel('ja')).to.equal(expected);
            });

            it('should be Portuguese for its codes', function() {
                const expected = 'Portuguese';

                expect(getLabel('pt')).to.equal(expected);
            });

            it('should be Italian for its codes', function() {
                const expected = 'Italian';

                expect(getLabel('it')).to.equal(expected);
            });

            it('should be Russian for its codes', function() {
                const expected = 'Russian';

                expect(getLabel('ru')).to.equal(expected);
            });

            it('should be Spanish for its codes', function() {
                const expected = 'Spanish';

                expect(getLabel('es')).to.equal(expected);
            });

            it('should map based only on the first two characters', function() {
                const expected = 'Portuguese';
                expect(getLabel('pt-br')).to.equal(expected);
            });
        });

        describe('getLabel from ISO 639-2 codes', function() {

            it('should not change for its English codes', function() {
                expect(getLabel('eng')).to.equal('eng');
            });

            it('should not change for its Chinese codes', function() {
                expect(getLabel('zho')).to.equal('zho');
                expect(getLabel('chi')).to.equal('chi');
            });

            it('should not change for its Dutch codes', function() {
                expect(getLabel('nld')).to.equal('nld');
                expect(getLabel('dut')).to.equal('dut');
            });

            it('should not change for its French codes', function() {
                expect(getLabel('fra')).to.equal('fra');
                expect(getLabel('fre')).to.equal('fre');
            });

            it('should not change for its Herman codes', function() {
                expect(getLabel('deu')).to.equal('deu');
                expect(getLabel('ger')).to.equal('ger');
            });

            it('should not change for its Japanese codes', function() {
                expect(getLabel('jpn')).to.equal('jpn');
            });

            it('should not change for its Portuguese codes', function() {
                expect(getLabel('por')).to.equal('por');
            });

            it('should not change for its Italian codes', function() {
                expect(getLabel('ita')).to.equal('ita');
            });

            it('should not change for its Russian codes', function() {
                expect(getLabel('rus')).to.equal('rus');
            });

            it('should not change for its Spanish codes', function() {
                expect(getLabel('esp')).to.equal('esp');
                expect(getLabel('spa')).to.equal('spa');
            });
        });

        describe('getCode from ISO 639-1 codes', function() {

            it('should be English for its codes', function() {
                expect(getCode('English')).to.equal('en');
            });

            it('should be Chinese for its codes', function() {
                expect(getCode('Chinese')).to.equal('zh');
            });

            it('should be Dutch for its codes', function() {
                expect(getCode('Dutch')).to.equal('nl');
            });

            it('should be French for its codes', function() {
                expect(getCode('French')).to.equal('fr');
            });

            it('should be German for its codes', function() {
                expect(getCode('German')).to.equal('de');
            });

            it('should be Japanese for its codes', function() {
                expect(getCode('Japanese')).to.equal('ja');
            });

            it('should be Portuguese for its codes', function() {
                expect(getCode('Portuguese')).to.equal('pt');
            });

            it('should be Italian for its codes', function() {
                expect(getCode('Italian')).to.equal('it');
            });

            it('should be Russian for its codes', function() {
                expect(getCode('Russian')).to.equal('ru');
            });

            it('should be Spanish for its codes', function() {
                expect(getCode('Spanish')).to.equal('es');
            });

            it('should be Greek for its codes', function() {
                expect(getCode('Greek')).to.equal('el');
            });
        });
    });

    describe('getLanguage', () => {
        const sandbox = sinon.sandbox.create();

        before(function() {
            if (Browser.isIE()) {
                this.skip();
            }
        });

        afterEach(() => {
            sandbox.restore();
        });

        function nullifyNavigatorProperty(property) {
            if (navigator[property]) {
                sandbox.stub(navigator, property).value(null);
            }
        }

        function stubNavigatorProperty(property, value) {
            if (navigator[property]) {
                sandbox.stub(navigator, property).value(value);
            } else {
                navigator[property] = value;
            }
        }

        function stubHtmlLanguage(doc, value) {
            const htmlTag = doc.querySelector('html');
            sandbox.stub(htmlTag, 'getAttribute').withArgs('lang').returns(value);
        }

        it('should return the htlm lang attribute', () => {
            const htmlLanguage = 'htmlLanguage';
            stubHtmlLanguage(document, htmlLanguage);
            expect(getLanguage()).to.equal(htmlLanguage);
        });

        it('should return the top htlm lang attribute when iframe has no lang attribute', () => {
            const topHtmlLanguage = 'topHtmlLanguage';
            stubHtmlLanguage(document, null);
            stubHtmlLanguage(window.top.document, topHtmlLanguage);
            sandbox.stub(Browser, 'isIframe').returns(true);
            expect(getLanguage()).to.equal(topHtmlLanguage);
        });

        it('should fallback to navigator.language when html lang attribute is absent', () => {
            const language = 'language';
            stubHtmlLanguage(document, null);
            stubNavigatorProperty('language', language);
            expect(getLanguage()).to.equal(language);
        });

        it('should fallback to en when navigator.language is undefined', () => {
            const systemLanguage = 'systemLanguage';
            stubHtmlLanguage(document, null);
            nullifyNavigatorProperty('language');
            expect(getLanguage()).to.equal('en');
        });
    });

    describe('JSON Translations', () => {
        const context = require.context("../../src/assets/translations", true, /\.json$/);
        const languageCodes = context.keys().map(key => key.substring(key.lastIndexOf('/') + 1, key.lastIndexOf('.')));

        it('should match the list of supported translations', () => {
            expect(languageCodes).to.deep.equal(translatedLanguageCodes);
        });

        it('should have same structure as localization default', () => {
            // TODO: add test that compares the structure of all the translation jsons to that of the default localization block to ensure consistency.
            // Limitation: require('../../src/assets/translations/fr.json') returns '264cfd10c44360a54a0772a576aa3dfd.json'
        });
    });

    describe('translationAvailable', () => {
        it('should be country code agnostic', () => {
            const regionalLanguageCode = translatedLanguageCodes[0] + '-HT';
            expect(isTranslationAvailable(regionalLanguageCode)).to.be.true;
        });

        it('should be caps agnostic', () => {
            const capitalizedLanguageCode = translatedLanguageCodes[0].toUpperCase();
            expect(isTranslationAvailable(capitalizedLanguageCode)).to.be.true;
        });

        it('should fail for codes that are not in translatedLanguageCodes', () => {
            expect(isTranslationAvailable('zz')).to.be.false;
        });
    });
});

