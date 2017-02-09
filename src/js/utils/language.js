define([
], function () {

    /**
     * A map of 2-letter language codes (ISO 639-1) to language name in English
     */
    var twoCharMap = {
        'zh': 'Chinese',
        'nl': 'Dutch',
        'en': 'English',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'ja': 'Japanese',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'es': 'Spanish'
    };
    
    // If we decide to support the 3-letter language codes (ISO 639-2), the accepted codes would be
    //     'zho': 'zh',
    //     'chi': 'zh',
    //     'dut': 'nl',
    //     'nld': 'nl',
    //     'eng': 'en',
    //     'fra': 'fr',
    //     'fre': 'fr',
    //     'deu': 'de',
    //     'ger': 'de',
    //     'ita': 'it',
    //     'jpn': 'ja',
    //     'por': 'pt',
    //     'rus': 'ru',
    //     'esp': 'es',
    //     'spa': 'es'

    function getLabel(language) {
        return twoCharMap[language] || language;
    }

    return {
        getLabel: getLabel
    };
});

