(function(playlist) {
    var utils = jwplayer.utils,
        defaults = {
            file: undefined,
            label: undefined,
            kind: 'captions',
            'default': false
        };

    playlist.track = function(config) {
        var _track = utils.extend({}, defaults);
        if (!config) {
            config = {};
        }

        utils.foreach(defaults, function(property) {
            if (utils.exists(config[property])) {
                _track[property] = config[property];
                // Actively move from config to track
                delete config[property];
            }
        });

        return _track;
    };

})(jwplayer.playlist);
