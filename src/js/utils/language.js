import { invert } from 'utils/underscore';
import { isIframe } from 'utils/browser';
import { ajax } from 'utils/ajax';
import { isDeepKeyCompliant } from 'utils/validator';
import en from 'assets/translations/en.js';

const translationPromises = {};

/*
 * A map of 2-letter language codes (ISO 639-1) to language name in English
 */
const codeToLang = {
    zh: 'Chinese',
    nl: 'Dutch',
    en: 'English',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    ja: 'Japanese',
    pt: 'Portuguese',
    ru: 'Russian',
    es: 'Spanish',
    el: 'Greek',
    fi: 'Finnish',
    id: 'Indonesian',
    ko: 'Korean',
    th: 'Thai',
    vi: 'Vietnamese'
};

const langToCode = invert(codeToLang);

function normalizeLanguageCode(language) {
    const languageAndCountryCode = normalizeLanguageAndCountryCode(language);
    const underscoreIndex = languageAndCountryCode.indexOf('_');
    return underscoreIndex === -1 ? languageAndCountryCode : languageAndCountryCode.substring(0, underscoreIndex);
}

function normalizeLanguageAndCountryCode(language) {
    return language.toLowerCase().replace('-', '_');
}

export function normalizeIntl(intl) {
    // Country codes are generally seen in upper case, but we have yet to find documentation confirming that this is the standard.
    if (!intl) {
        return {};
    }
    return Object.keys(intl).reduce((obj, key) => {
        obj[normalizeLanguageAndCountryCode(key)] = intl[key];
        return obj;
    }, {});
}

export function getLabel(language) {
    if (!language) {
        return;
    }

    // We do not map ISO 639-2 (3-letter codes)
    if (language.length === 3) {
        return language;
    }

    return codeToLang[normalizeLanguageCode(language)] || language;
}

export function getCode(language) {
    return langToCode[language] || '';
}

function extractLanguage(doc) {
    const htmlTag = doc.querySelector('html');
    return htmlTag ? htmlTag.getAttribute('lang') : null;
}

export function getLanguage() {
    if (__HEADLESS__) {
        return navigator.language || 'en';
    }
    let language = extractLanguage(document);
    if (!language && isIframe()) {
        try {
            // Exception is thrown if iFrame is on a different domain name.
            language = extractLanguage(window.top.document);
        } catch (e) {/* ignore */}
    }
    return language || navigator.language || 'en';
}

export const translatedLanguageCodes = ['ar', 'da', 'de', 'el', 'es', 'fi', 'fr', 'he', 'id', 'it', 'ja', 'ko', 'nl', 'no', 'oc', 'pt', 'ro', 'ru', 'sl', 'sv', 'th', 'tr', 'vi', 'zh'];

export function isRtl(message) {
    // RTL regex can be improved with ranges from:
    // http://www.unicode.org/Public/UNIDATA/extracted/DerivedBidiClass.txt
    // http://jrgraphix.net/research/unicode.php
    // Recognized RTL Langs: 'ar', 'arc', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ku', 'ps', 'ur', 'yi'.

    const rtlRegex = /^[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    // Char code 8207 is the RTL mark (\u200f)
    return message.charCodeAt(0) === 8207 || rtlRegex.test(message);
}

export function isTranslationAvailable(language) {
    return translatedLanguageCodes.indexOf(normalizeLanguageCode(language)) >= 0;
}

export function getCustomLocalization(config, intl, languageAndCountryCode) {
    return Object.assign({}, getCustom(config), intl[normalizeLanguageCode(languageAndCountryCode)], intl[normalizeLanguageAndCountryCode(languageAndCountryCode)]);
}

function getCustom(config) {
    const { advertising, related, sharing, abouttext } = config;
    const localization = Object.assign({}, config.localization);

    if (advertising) {
        localization.advertising = localization.advertising || {};
        mergeProperty(localization.advertising, advertising, 'admessage');
        mergeProperty(localization.advertising, advertising, 'cuetext');
        mergeProperty(localization.advertising, advertising, 'loadingAd');
        mergeProperty(localization.advertising, advertising, 'podmessage');
        mergeProperty(localization.advertising, advertising, 'skipmessage');
        mergeProperty(localization.advertising, advertising, 'skiptext');
    }

    if (typeof localization.related === 'string') {
        localization.related = {
            heading: localization.related
        };
    } else {
        localization.related = localization.related || {};
    }

    if (related) {
        mergeProperty(localization.related, related, 'autoplaymessage');
    }

    if (sharing) {
        localization.sharing = localization.sharing || {};
        mergeProperty(localization.sharing, sharing, 'heading');
        mergeProperty(localization.sharing, sharing, 'copied');
    }

    if (abouttext) {
        mergeProperty(localization, config, 'abouttext');
    }

    const localizationClose = localization.close || localization.nextUpClose;

    if (localizationClose) {
        localization.close = localizationClose;
    }

    return localization;
}

function mergeProperty(localizationObj, allOptionsObj, prop) {
    const propToCopy = localizationObj[prop] || allOptionsObj[prop];

    if (propToCopy) {
        localizationObj[prop] = propToCopy;
    }
}

export function isLocalizationComplete(customLocalization) {
    return isDeepKeyCompliant(en, customLocalization, (key, obj) => {
        const value = obj[key];
        return typeof value === 'string';
    });
}

export function loadJsonTranslation(base, languageCode) {
    let translationLoad = translationPromises[languageCode];
    if (!translationLoad) {
        const url = `${base}translations/${normalizeLanguageCode(languageCode)}.json`;
        translationPromises[languageCode] = translationLoad = new Promise((oncomplete, reject) => {
            const onerror = (message, file, _url, error) => {
                translationPromises[languageCode] = null;
                reject(error);
            };
            ajax({ url, oncomplete, onerror, responseType: 'json' });
        });
    }
    return translationLoad;
}

export function applyTranslation(baseLocalization, customization) {
    const localization = Object.assign({}, baseLocalization, customization);
    merge(localization, 'errors', baseLocalization, customization);
    merge(localization, 'related', baseLocalization, customization);
    merge(localization, 'sharing', baseLocalization, customization);
    merge(localization, 'advertising', baseLocalization, customization);
    merge(localization, 'shortcuts', baseLocalization, customization);
    merge(localization, 'captionsStyles', baseLocalization, customization);
    return localization;
}

function merge(z, prop, a, b) {
    z[prop] = Object.assign({}, a[prop], b[prop]);
}
