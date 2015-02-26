define([
    'utils/underscore',
    'utils/helpers',
    'playlist/source',
    'playlist/track'
], function(_, utils, Source, Track) {

    var PlaylistItem = function (config) {

        var _playlistItem = {};
        _.each(PlaylistItem.defaults, function(val, key) {
            _playlistItem[key] = config[key] || val;
        });

        //utils.extend({}, PlaylistItem.defaults, config),
        _playlistItem.tracks = (config && utils.exists(config.tracks)) ? config.tracks : [];

        if (_playlistItem.sources.length === 0) {
            if (config.levels) {
                _playlistItem.sources = config.levels;
            } else {
                _playlistItem.sources = [new Source(config)];
            }
        }

        /** Each source should be a named object **/
        for (var i = 0; i < _playlistItem.sources.length; i++) {
            var def = _playlistItem.sources[i]['default'];
            if (def) {
                _playlistItem.sources[i]['default'] = (def.toString() === 'true');
            } else {
                _playlistItem.sources[i]['default'] = false;
            }

            // If the source doesn't have a label, number it
            if (! _playlistItem.sources[i].label) {
                _playlistItem.sources[i].label = i.toString();
            }

            _playlistItem.sources[i] = new Source(_playlistItem.sources[i]);
        }

        if (_playlistItem.captions && !utils.exists(config.tracks)) {
            for (var j = 0; j < _playlistItem.captions.length; j++) {
                _playlistItem.tracks.push(_playlistItem.captions[j]);
            }
            delete _playlistItem.captions;
        }

        for (i = 0; i < _playlistItem.tracks.length; i++) {
            _playlistItem.tracks[i] = new Track(_playlistItem.tracks[i]);
        }
        return _playlistItem;
    };

    PlaylistItem.defaults = {
        description: undefined,
        image: undefined,
        mediaid: undefined,
        title: undefined,
        sources: [],
        tracks: []
    };

    return PlaylistItem;
});
