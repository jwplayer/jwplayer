define([
    'utils/underscore'
], function(_) {

    var defaults = {
        //file: undefined,
        //label: undefined,
        kind: 'captions',
        'default': false
    };

    var Track = function (config) {
        // File is the only required attr
        if (!config || !config.file) {
            return;
        }

        return _.extend({}, defaults, config);
    };

    return Track;
});
