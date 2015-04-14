define([
    'utils/underscore',
    'playlist/source',
    'playlist/track'
], function(_, Source, Track) {

    var PlaylistItem = function (config) {

        var _playlistItem = {
            description: undefined,
            image: undefined,
            mediaid: undefined,
            title: undefined,
            sources: [],
            tracks: []
        };

        config = config || {};
        if (!_.isArray(config.tracks)) {
            delete config.tracks;
        }

        _.extend(_playlistItem, config);

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
            if (!s) { continue; }
            var def = s['default'];
            if (def) {
                s['default'] = (def.toString() === 'true');
            } else {
                s['default'] = false;
            }

            // If the source doesn't have a label, number it
            if (! _playlistItem.sources[i].label) {
                _playlistItem.sources[i].label = i.toString();
            }

            _playlistItem.sources[i] = Source(_playlistItem.sources[i]);
        }

        _playlistItem.sources = _.compact(_playlistItem.sources);

        if (config.tracks) {
            _playlistItem.tracks = config.tracks;
        } else if (_playlistItem.captions) {
            for (var j = 0; j < _playlistItem.captions.length; j++) {
                _playlistItem.tracks.push(_playlistItem.captions[j]);
            }
            delete _playlistItem.captions;
        }

        for (i = 0; i < _playlistItem.tracks.length; i++) {
            _playlistItem.tracks[i] = Track(_playlistItem.tracks[i]);
        }
        return _playlistItem;
    };

    return PlaylistItem;
});
