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
        es: 'Spanish',
        el: 'Greek',
    };

    function getLabel(language) {
        if (!language) {
            return '';
        }
        return twoCharMap[language.slice(0, 2)] || language;
    }

    return {
        getLabel: getLabel
    };
});

