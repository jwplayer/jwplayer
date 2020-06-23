import * as Language from 'utils/language';
import * as Browser from 'utils/browser';
import Config from 'api/config';
import en from 'assets/translations/en';
import sinon from 'sinon';

describe('languageUtils', function() {
    const sandbox = sinon.createSandbox();
    const {
        getLabel,
        getCode,
        getLanguage,
        translatedLanguageCodes,
        isTranslationAvailable,
        loadJsonTranslation,
        getCustomLocalization,
        normalizeIntl,
        isLocalizationComplete
    } = Language;

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

    describe('getLanguage', function() {
        function stubHtmlLanguage(doc, value) {
            const htmlTag = doc.querySelector('html');
            sandbox.stub(htmlTag, 'getAttribute').withArgs('lang').returns(value);
        }

        before(function() {
            if (Browser.isIE()) {
                this.skip();
            }
        });

        afterEach(function() {
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

        it('should return the htlm lang attribute', function() {
            const htmlLanguage = 'htmlLanguage';
            stubHtmlLanguage(document, htmlLanguage);
            expect(getLanguage()).to.equal(htmlLanguage);
        });

        it('should return the top htlm lang attribute when iframe has no lang attribute', function() {
            const topHtmlLanguage = 'topHtmlLanguage';
            stubHtmlLanguage(document, null);
            stubHtmlLanguage(window.top.document, topHtmlLanguage);
            sandbox.stub(Browser, 'isIframe').returns(true);
            expect(getLanguage()).to.equal(topHtmlLanguage);
        });

        it('should fallback to navigator.language when html lang attribute is absent', function() {
            const language = 'language';
            stubHtmlLanguage(document, null);
            stubNavigatorProperty('language', language);
            expect(getLanguage()).to.equal(language);
        });

        it('should fallback to en when navigator.language is undefined', function() {
            stubHtmlLanguage(document, null);
            nullifyNavigatorProperty('language');
            expect(getLanguage()).to.equal('en');
        });
    });

    describe('JSON Translations', function() {
        const context = require.context('../../src/assets/translations', true, /\.json$/);
        const languageCodes = context.keys().map(key => key.substring(key.lastIndexOf('/') + 1, key.lastIndexOf('.')));

        it('should match the list of supported translations', function() {
            expect(languageCodes).to.deep.equal(translatedLanguageCodes);
        });


        function compareNestedKeys(originalObj, customObj) {
            expect(customObj).to.have.all.keys(originalObj);
            Object.keys(originalObj).forEach(key => {
                const customProperty = customObj[key];
                const originalProperty = originalObj[key];
                const originalPropertyType = typeof originalProperty;

                expect(customProperty).to.be.a(originalPropertyType);
                if (originalPropertyType === 'object') {
                    compareNestedKeys(originalProperty, customProperty);
                }
            });
        }

        languageCodes.forEach(languageCode => {
            describe(languageCode + '.json', function () {
                it('should have same structure as localization default', function() {
                    const translation = require('../../src/assets/translations/' + languageCode + '.json');
                    compareNestedKeys(en, translation);
                });
            });
        });
    });

    describe('translationAvailable', function() {
        it('should be country code agnostic', function() {
            const regionalLanguageCode = translatedLanguageCodes[0] + '-HT';
            expect(isTranslationAvailable(regionalLanguageCode)).to.be.true;
        });

        it('should be caps agnostic', function() {
            const capitalizedLanguageCode = translatedLanguageCodes[0].toUpperCase();
            expect(isTranslationAvailable(capitalizedLanguageCode)).to.be.true;
        });

        it('should fail for codes that are not in translatedLanguageCodes', function() {
            expect(isTranslationAvailable('zz')).to.be.false;
        });
    });

    describe('Json translation load', function() {
        this.timeout(8000);

        it('should successfully fetch Spanish', function() {
            loadJsonTranslation('/base/test/files/', 'es').then(result => {
                expect(result).to.have.property('responseType').which.equals('json');
                expect(result).to.have.property('status').which.equals(200);
                expect(result).to.have.property('response').which.is.an('object');
                expect(Object.keys(result.response)).to.deep.equal(Object.keys(en));
            });
        });
    });

    describe('Get Custom Localization', function() {
        let intl;
        let localization;
        const frPlay = 'frPlay';
        const frPause = 'frPause';
        const frHtPlay = 'fr-HT-Play';
        const localizationPlay = 'localizationPlay';
        const localizationPause = 'localizationPause';
        const localizationStop = 'localizationStop';

        before(function() {
            localization = {
                play: localizationPlay,
                pause: localizationPause,
                stop: localizationStop
            };
            intl = normalizeIntl({
                fr: {
                    play: frPlay,
                    pause: frPause
                },

                fr_HT: {
                    play: frHtPlay
                }
            });
        });

        after(function () {
            sandbox.restore();
        });

        it('should override the custom localization with the intl block', function() {
            const customLocalization = getCustomLocalization({ localization }, intl, 'fr');
            expect(customLocalization.play).to.equal(frPlay);
            expect(customLocalization.pause).to.equal(frPause);
            expect(customLocalization.stop).to.equal(localizationStop);

        });

        it('should override the language code intl block with the language-Country code intl block', function() {
            const customLocalization = getCustomLocalization({ localization }, intl, 'fr-HT');
            expect(customLocalization.play).to.equal(frHtPlay);
            expect(customLocalization.pause).to.equal(frPause);
            expect(customLocalization.stop).to.equal(localizationStop);
        });

        it('should fallback to the intl block for the matching language code if the country code is different', function() {
            const customLocalization = getCustomLocalization({ localization }, intl, 'fr-CA');
            expect(customLocalization.play).to.equal(frPlay);
            expect(customLocalization.pause).to.equal(frPause);
            expect(customLocalization.stop).to.equal(localizationStop);
        });

        it('should fallback to localization if country code is not defined in intl block', function() {
            const customLocalization = getCustomLocalization({ localization }, intl, 'zz');
            expect(customLocalization.play).to.equal(localizationPlay);
            expect(customLocalization.pause).to.equal(localizationPause);
            expect(customLocalization.stop).to.equal(localizationStop);
        });

        it('should copy custom config values regardless of language (Localization Backwards Support)', function() {
            const config = {
                abouttext: 'Custom about',
                advertising: {
                    admessage: 'admessage',
                    cuetext: 'cuetext',
                    loadingAd: 'loadingAd',
                    podmessage: 'podmessage',
                    skipmessage: 'skipmessage',
                    skiptext: 'skiptext',
                },
                related: {
                    autoplaymessage: 'autoplaymessage'
                },
                sharing: {
                    heading: 'heading',
                    copied: 'copied'
                },
                localization: Object.assign({
                    nextUpClose: 'nextUpClose'
                }, localization)
            };

            const customLocalization = getCustomLocalization(config, intl, 'fr');
            expect(customLocalization.play).to.equal(frPlay);
            expect(customLocalization.abouttext).to.equal('Custom about');
            expect(customLocalization.advertising.admessage).to.equal('admessage');
            expect(customLocalization.advertising.cuetext).to.equal('cuetext');
            expect(customLocalization.advertising.loadingAd).to.equal('loadingAd');
            expect(customLocalization.advertising.podmessage).to.equal('podmessage');
            expect(customLocalization.advertising.skipmessage).to.equal('skipmessage');
            expect(customLocalization.advertising.skiptext).to.equal('skiptext');
            expect(customLocalization.related.autoplaymessage).to.equal('autoplaymessage');
            expect(customLocalization.sharing.heading).to.equal('heading');
            expect(customLocalization.sharing.copied).to.equal('copied');
            expect(customLocalization.close).to.equal('nextUpClose');
        });

        it('should only use custom localization block if "forceLocalizationDefaults" is true', function() {
            sandbox.stub(Language, 'getLanguage').returns('fr');
            const config = new Config({
                forceLocalizationDefaults: true,
                localization,
                intl
            });
            const configLocalization = config.localization;
            expect(config.language).to.equal('en');
            expect(configLocalization.play).to.equal(localizationPlay);
            expect(configLocalization.pause).to.equal(localizationPause);
            expect(configLocalization.stop).to.equal(localizationStop);

            Object.keys(en).forEach(key => {
                if (key === 'play' || key === 'pause' || key === 'stop') {
                    return;
                }
                expect(configLocalization[key]).to.deep.equal(en[key]);
            });
        });
    });

    describe('Is Localization Complete check', function() {
        let customLocalization;
        beforeEach(function() {
            customLocalization = en;
            customLocalization.play = 'customPlay';
            customLocalization.pause = 'customPause';
            customLocalization.stop = 'customStop';
            customLocalization.related.heading = 'customRelatedHeading';
        });

        it('should be true when custom localization has the same keys as default localization', function() {
            expect(isLocalizationComplete(customLocalization)).to.be.true;
        });

        it('should be false when custom localization is smaller than defaut localization', function() {
            customLocalization.play = undefined;
            expect(isLocalizationComplete(customLocalization)).to.be.false;
        });

        it('should be false when custom localization sub-blocks are smaller than defaut localization', function() {
            customLocalization.advertising.admessage = undefined;
            expect(isLocalizationComplete(customLocalization)).to.be.false;
        });

        it('should be false when custom localization has different keys than default localization', function() {
            customLocalization.play = undefined;
            customLocalization.newKey = 'new key';
            expect(isLocalizationComplete(customLocalization)).to.be.false;
        });

        it('should be false when custom localization sub-blocks have different keys than defaut localization', function() {
            customLocalization.sharing.copied = undefined;
            customLocalization.sharing.newKey = 'new key';
            expect(isLocalizationComplete(customLocalization)).to.be.false;
        });
    });

    describe('isRTL', function() {
        afterEach(function() {
            sandbox.restore();
        });

        it('should be true when argument is RTL string', function() {
            expect(Language.isRtl('بإنشاء')).to.be.true; //ar
            expect(Language.isRtl('מסמכים')).to.be.true; //he
            expect(Language.isRtl('עידותא')).to.be.true; //arc
            expect(Language.isRtl('פּאַראַגראַפס')).to.be.true; //yi
            expect(Language.isRtl('ما عربی متن کے حصے کے')).to.be.true; //ur
            expect(Language.isRtl('است که با یک کاراکت')).to.be.true; //fa
            expect(Language.isRtl('عربي متن برخه ګڼي')).to.be.true; //ps
            expect(Language.isRtl('دێ‎ كورد شین‎‎')).to.be.true; //ku
            expect(Language.isRtl('ތާނަ')).to.be.true; //dv
            expect(Language.isRtl('هَرْشَن')).to.be.true; //ha
            expect(Language.isRtl('کهووا')).to.be.true; //khw
            expect(Language.isRtl('می ہاؤس')).to.be.true; //ks

            expect(Language.isRtl('አቅጣጫዎች')).to.be.false; // am (amharic) is left to right
            expect(Language.isRtl('hello')).to.be.false;
        });

        it('should be true when argument contains RTL mark', function() {
            expect(Language.isRtl('\u200fReplay')).to.be.true;
            expect(Language.isRtl('\u200fإرجاع بـ10 ثواني')).to.be.true;
        });
    });
});

