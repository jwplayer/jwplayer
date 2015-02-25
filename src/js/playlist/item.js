define([
    'utils/helpers',
    'playlist/source',
    'playlist/track'
], function(utils, Source, Track) {

    var PlaylistItem = function (config) {
        var _playlistitem = utils.extend({}, PlaylistItem.defaults, config),
            i, j, def;

        _playlistitem.tracks = (config && utils.exists(config.tracks)) ? config.tracks : [];

        if (_playlistitem.sources.length === 0) {
            _playlistitem.sources = [new Source(_playlistitem)];
        }

        /** Each source should be a named object **/
        for (i = 0; i < _playlistitem.sources.length; i++) {
            def = _playlistitem.sources[i]['default'];
            if (def) {
                _playlistitem.sources[i]['default'] = (def.toString() === 'true');
            } else {
                _playlistitem.sources[i]['default'] = false;
            }

            _playlistitem.sources[i] = new Source(_playlistitem.sources[i]);
        }

        if (_playlistitem.captions && !utils.exists(config.tracks)) {
            for (j = 0; j < _playlistitem.captions.length; j++) {
                _playlistitem.tracks.push(_playlistitem.captions[j]);
            }
            delete _playlistitem.captions;
        }

        for (i = 0; i < _playlistitem.tracks.length; i++) {
            _playlistitem.tracks[i] = new Track(_playlistitem.tracks[i]);
        }
        return _playlistitem;
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
