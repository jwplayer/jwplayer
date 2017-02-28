define([
    'utils/underscore'
], function(_) {
    var defaults = {
        kind: 'captions',
        'default': false
    };

    return function Track(config) {
        // File is the only required attr
        if (!config || !config.file) {
            return;
        }

        return _.extend({}, defaults, config);
    };
});
