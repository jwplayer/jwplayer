define([
    'utils/underscore'
], function(_) {
    var defaults = {
        kind: 'captions',
        'default': false
    };

    /**
     * A media source variant present in a playlist item
     * @internal
     * @typedef {object} PlaylistItemTrack
     * @property {'captions'|'subtitles'|'chapters'|'thumbnails'} kind - The kind of track.
     * @property {boolean} default - Enable the track by default.
     */

    return function Track(config) {
        // File is the only required attr
        if (!config || !config.file) {
            return;
        }

        return _.extend({}, defaults, config);
    };
});
