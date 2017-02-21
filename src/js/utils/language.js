define([
], function () {

    /**
     * A map of 2-letter language codes (ISO 639-1) to language name in English
     */
    var twoCharMap = {
        zh: 'Chinese',
        nl: 'Dutch',
        en: 'English',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        ja: 'Japanese',
        pt: 'Portuguese',
        ru: 'Russian',
        es: 'Spanish'
    };

    function getLabel(language) {
        return twoCharMap[language] || language;
    }

    return {
        getLabel: getLabel
    };
});

