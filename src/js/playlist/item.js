define([
    'utils/underscore',
    'playlist/source',
    'playlist/track'
], function(_, Source, Track) {
    var Defaults = {
        sources: [],
        tracks: [],
        minDvrWindow: 120
    };

    /**
     * An item in the playlist
     * @typedef {object} PlaylistItem
     * @property {Array.<PlaylistItemSource>} sources - A list of alternative media sources for the player to choose from.
     * @property {Array.<PlaylistItemTrack>} tracks - A list of tracks associated with this item.
     * @property {string} file - The selected source URL to be played.
     * @property {string} [image] - The poster image.
     * @property {'none'|'metadata'|'auto'} preload - The selected preload setting.
     * @property {number} minDvrWindow - For live streams, the threshold at which the available media should be seekable,
     * and treated as a DVR stream.
     */

    return function Item(config) {
        config = config || {};
        if (!_.isArray(config.tracks)) {
            delete config.tracks;
        }

        var _playlistItem = _.extend({}, Defaults, config);

        if (_.isObject(_playlistItem.sources) && !_.isArray(_playlistItem.sources)) {
            _playlistItem.sources = [Source(_playlistItem.sources)];
        }

        if (!_.isArray(_playlistItem.sources) || _playlistItem.sources.length === 0) {
            if (config.levels) {
                _playlistItem.sources = config.levels;
            } else {
                _playlistItem.sources = [Source(config)];
            }
        }

        /** Each source should be a named object **/
        for (var i = 0; i < _playlistItem.sources.length; i++) {
            var s = _playlistItem.sources[i];
            if (!s) {
                continue;
            }

            var def = s.default;
            if (def) {
                s.default = (def.toString() === 'true');
            } else {
                s.default = false;
            }

            // If the source doesn't have a label, number it
            if (!_playlistItem.sources[i].label) {
                _playlistItem.sources[i].label = i.toString();
            }

            _playlistItem.sources[i] = Source(_playlistItem.sources[i]);
        }

        _playlistItem.sources = _.compact(_playlistItem.sources);


        if (!_.isArray(_playlistItem.tracks)) {
            _playlistItem.tracks = [];
        }

        if (_.isArray(_playlistItem.captions)) {
            _playlistItem.tracks = _playlistItem.tracks.concat(_playlistItem.captions);
            delete _playlistItem.captions;
        }

        _playlistItem.tracks = _.compact(_.map(_playlistItem.tracks, Track));

        return _playlistItem;
    };
});
