define([
    'utils/helpers',
    'utils/underscore'
], function(utils, _) {

    var defaults = {
        file: undefined,
        label: undefined,
        kind: 'captions',
        'default': false
    };

    var Track = function (config) {
        var _track = _.extend({}, defaults);
        if (!config) {
            config = {};
        }

        utils.foreach(defaults, function (property) {
            if (utils.exists(config[property])) {
                _track[property] = config[property];
                // Actively move from config to track
                delete config[property];
            }
        });

        return _track;
    };

    return Track;
});
