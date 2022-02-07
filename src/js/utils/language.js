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
    aa: 'Afar',
    ab: 'Abkhazian',
    ae: 'Avestan',
    af: 'Afrikaans',
    ak: 'Akan',
    am: 'Amharic',
    ar: 'Arabic',
    an: 'Aragonese',
    as: 'Assamese',
    av: 'Avaric',
    ay: 'Aymara',
    az: 'Azerbaijani',
    ba: 'Bashkir',
    be: 'Belarusian',
    bg: 'Bulgarian',
    bh: 'Bihari languages',
    bi: 'Bislama',
    bm: 'Bambara',
    bn: 'Bengali',
    bo: 'Tibetan',
    br: 'Breton',
    bs: 'Bosnian',
    ca: 'Catalan',
    ce: 'Chechen',
    ch: 'Chamorro',
    co: 'Corsican',
    cr: 'Cree',
    cs: 'Czech',
    cu: 'Church Slavic',
    cv: 'Chuvash',
    cy: 'Welsh',
    da: 'Danish',
    de: 'German',
    dv: 'Divehi',
    dz: 'Dzongkha',
    ee: 'Ewe',
    el: 'Greek',
    en: 'English',
    eo: 'Esperanto',
    es: 'Spanish',
    et: 'Estonian',
    eu: 'Basque',
    fa: 'Persian',
    ff: 'Fulah',
    fi: 'Finnish',
    fj: 'Fijian',
    fo: 'Faroese',
    fr: 'French',
    fy: 'Western Frisian',
    ga: 'Irish',
    gd: 'Gaelic',
    gl: 'Galician',
    gn: 'Guarani',
    gu: 'Gujarati',
    gv: 'Manx',
    ha: 'Hausa',
    he: 'Hebrew',
    hi: 'Hindi',
    ho: 'Hiri Motu',
    hr: 'Croatian',
    ht: 'Haitian',
    hu: 'Hungarian',
    hy: 'Armenian',
    hz: 'Herero',
    ia: 'Interlingua',
    id: 'Indonesian',
    ie: 'Interlingue',
    ig: 'Igbo',
    ii: 'Sichuan Yi',
    ik: 'Inupiaq',
    io: 'Ido',
    is: 'Icelandic',
    it: 'Italian',
    iu: 'Inuktitut',
    ja: 'Japanese',
    jv: 'Javanese',
    ka: 'Georgian',
    kg: 'Kongo',
    ki: 'Kikuyu',
    kj: 'Kuanyama',
    kk: 'Kazakh',
    kl: 'Kalaallisut',
    km: 'Central Khmer',
    kn: 'Kannada',
    ko: 'Korean',
    kr: 'Kanuri',
    ks: 'Kashmiri',
    ku: 'Kurdish',
    kv: 'Komi',
    kw: 'Cornish',
    ky: 'Kirghiz',
    la: 'Latin',
    lb: 'Luxembourgish',
    lg: 'Ganda',
    li: 'Limburgan',
    lo: 'Lao',
    ln: 'Lingala',
    lt: 'Lithuanian',
    lu: 'Luba-Katanga',
    lv: 'Latvian',
    mg: 'Malagasy',
    mh: 'Marshallese',
    mi: 'Maori',
    mk: 'Macedonian',
    ml: 'Malayalam',
    mn: 'Mongolian',
    mr: 'Marathi',
    ms: 'Malay',
    mt: 'Maltese',
    my: 'Burmese',
    na: 'Nauru',
    nb: 'Bokmål',
    nd: 'Ndebele',
    ne: 'Nepali',
    ng: 'Ndonga',
    nl: 'Dutch',
    nn: 'Norwegian Nynorsk',
    no: 'Norwegian',
    nr: 'Ndebele',
    nv: 'Navajo',
    ny: 'Chichewa',
    oc: 'Occitan',
    oj: 'Ojibwa',
    om: 'Oromo',
    or: 'Oriya',
    os: 'Ossetian',
    pa: 'Panjabi',
    pi: 'Pali',
    pl: 'Polish',
    pt: 'Portuguese',
    ps: 'Pushto',
    qu: 'Quechua',
    rm: 'Romansh',
    rn: 'Rundi',
    ro: 'Romanian',
    ru: 'Russian',
    rw: 'Kinyarwanda',
    sa: 'Sanskrit',
    sc: 'Sardinian',
    sd: 'Sindhi',
    se: 'Northern Sami',
    sg: 'Sango',
    si: 'Sinhala',
    sk: 'Slovak',
    sl: 'Slovenian',
    sm: 'Samoan',
    sn: 'Shona',
    so: 'Somali',
    sq: 'Albanian',
    sr: 'Serbian',
    ss: 'Swati',
    st: 'Sotho',
    su: 'Sundanese',
    sw: 'Swahili',
    sv: 'Swedish',
    ta: 'Tamil',
    te: 'Telugu',
    tg: 'Tajik',
    th: 'Thai',
    ti: 'Tigrinya',
    tk: 'Turkmen',
    tl: 'Tagalog',
    tn: 'Tswana',
    to: 'Tonga',
    tr: 'Turkish',
    ts: 'Tsonga',
    tt: 'Tatar',
    tw: 'Twi',
    ty: 'Tahitian',
    ug: 'Uighur',
    uk: 'Ukrainian',
    ur: 'Urdu',
    uz: 'Uzbek',
    ve: 'Venda',
    vi: 'Vietnamese',
    vo: 'Volapük',
    wa: 'Walloon',
    wo: 'Wolof',
    xh: 'Xhosa',
    yi: 'Yiddish',
    yo: 'Yoruba',
    za: 'Zhuang',
    zh: 'Chinese',
    zu: 'Zulu'
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

export const getLanguage = function() {
    // Used in tests to override the value we return;
    if (typeof getLanguage.mock_ === 'string') {
        return getLanguage.mock_;
    }
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
};

getLanguage.mock_ = null;

// TODO: Deprecate "no", keep "nn" and "nb"
export const translatedLanguageCodes = ['ar', 'da', 'de', 'el', 'es', 'fi', 'fr', 'he', 'id', 'it', 'ja', 'ko', 'nb', 'nl', 'nn', 'no', 'oc', 'pt', 'ro', 'ru', 'sl', 'sv', 'th', 'tr', 'vi', 'zh'];

export function isRtl(message) {
    // RTL regex can be improved with ranges from:
    // http://www.unicode.org/Public/UNIDATA/extracted/DerivedBidiClass.txt
    // http://jrgraphix.net/research/unicode.php
    // Recognized RTL Langs: 'ar', 'arc', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ku', 'ps', 'ur', 'yi'.

    const rtlRegex = /^[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    // Char code 8207 is the RTL mark (\u200f)
    return message.charCodeAt(0) === 8207 || rtlRegex.test(message);
}

export const isTranslationAvailable = function(language) {
    if (typeof isTranslationAvailable.mock_ === 'boolean') {
        return isTranslationAvailable.mock_;
    }
    return translatedLanguageCodes.indexOf(normalizeLanguageCode(language)) >= 0;
};

isTranslationAvailable.mock_ = null;

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

export const isLocalizationComplete = function(customLocalization) {
    if (typeof isLocalizationComplete.mock_ === 'boolean') {
        return isLocalizationComplete.mock_;
    }
    return isDeepKeyCompliant(en, customLocalization, (key, obj) => {
        const value = obj[key];
        return typeof value === 'string';
    });
};

isLocalizationComplete.mock_ = null;

// Used to ensure nb/nn language codes both return 'no'.
// TODO: Deprecate and replace with nn and nb
function normalizeNorwegian(language) {
    return /^n[bn]$/.test(language) ? 'no' : language;
}

export const loadJsonTranslation = function(base, languageCode) {
    if (typeof loadJsonTranslation.mock_ === 'function') {
        return loadJsonTranslation.mock_;
    }
    let translationLoad = translationPromises[languageCode];
    if (!translationLoad) {
        const url = `${base}translations/${normalizeNorwegian(normalizeLanguageCode(languageCode))}.json`;
        translationPromises[languageCode] = translationLoad = new Promise((oncomplete, reject) => {
            const onerror = (message, file, _url, error) => {
                translationPromises[languageCode] = null;
                reject(error);
            };
            ajax({ url, oncomplete, onerror, responseType: 'json' });
        });
    }
    return translationLoad;
};

loadJsonTranslation.mock_ = null;

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
