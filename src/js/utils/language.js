import { invert } from 'utils/underscore';
import { isIframe } from 'utils/browser';
import { ajax } from 'utils/ajax';
import { isDeepKeyMatch } from 'utils/validator';
import en from 'assets/translations/en.js';

/**
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
};

const langToCode = invert(codeToLang);

function formatLanguageCode(language) {
    return language.substring(0, 2).toLowerCase();
}

export function getLabel(language) {
    if (!language) {
        return;
    }

    // We do not map ISO 639-2 (3-letter codes)
    if (language.length === 3) {
        return language;
    }

    return codeToLang[formatLanguageCode(language)] || language;
}

export function getCode(language) {
    return langToCode[language] || '';
}

function extractLanguage(doc) {
    const htmlTag = doc.querySelector('html');
    return htmlTag ? htmlTag.getAttribute('lang') : null;
}

export function getLanguage() {
    let language = extractLanguage(document);
    if (!language && isIframe()) {
        try {
            // Exception is thrown if iFrame is on a different domain name.
            language = extractLanguage(window.top.document);
        } catch (e) {/* ignore */}
    }
    return language || navigator.language || 'en';
}

export const translatedLanguageCodes = ['ar', 'da', 'de', 'es', 'fr', 'it', 'ja', 'nb', 'nl', 'pt', 'ro', 'sv', 'tr', 'zh'];

export function isTranslationAvailable(language) {
    return translatedLanguageCodes.indexOf(formatLanguageCode(language)) >= 0;
}

export function getCustomLocalization(localization, intl, languageAndCountryCode) {
    const languageCode = formatLanguageCode(languageAndCountryCode);
    const languageAndCountryCustomization = languageCode === languageAndCountryCode ? {} :
        intl[languageAndCountryCode] || intl[languageAndCountryCode.toLowerCase()] ||
        intl[languageAndCountryCode.replace('-', '_')] || intl[languageAndCountryCode.toLowerCase().replace('-', '_')];
    return Object.assign({}, localization, intl[languageCode], languageAndCountryCustomization);
}

export function isLocalizationComplete(customLocalization) {
    return isDeepKeyMatch(en, customLocalization);
}

export function loadJsonTranslation(base, languageCode) {
    const url = `${base}translations/${formatLanguageCode(languageCode)}.json`;
    return new Promise((resolve, reject) => {
        const oncomplete = (result) => resolve(result);
        const onerror = () => reject();
        ajax({ url, oncomplete, onerror, responseType: 'json' });
    });
}
