(function(playlist) {
    var _item = playlist.item = function(config) {
        var utils = jwplayer.utils,
            _playlistitem = utils.extend({}, _item.defaults, config),
            i, j, def;

        _playlistitem.tracks = (config && utils.exists(config.tracks)) ? config.tracks : [];

        if (_playlistitem.sources.length === 0) {
            _playlistitem.sources = [new playlist.source(_playlistitem)];
        }

        /** Each source should be a named object **/
        for (i = 0; i < _playlistitem.sources.length; i++) {
            def = _playlistitem.sources[i]['default'];
            if (def) {
                _playlistitem.sources[i]['default'] = (def.toString() === 'true');
            } else {
                _playlistitem.sources[i]['default'] = false;
            }

            _playlistitem.sources[i] = new playlist.source(_playlistitem.sources[i]);
        }

        if (_playlistitem.captions && !utils.exists(config.tracks)) {
            for (j = 0; j < _playlistitem.captions.length; j++) {
                _playlistitem.tracks.push(_playlistitem.captions[j]);
            }
            delete _playlistitem.captions;
        }

        for (i = 0; i < _playlistitem.tracks.length; i++) {
            _playlistitem.tracks[i] = new playlist.track(_playlistitem.tracks[i]);
        }
        return _playlistitem;
    };

    _item.defaults = {
        description: undefined,
        image: undefined,
        mediaid: undefined,
        title: undefined,
        sources: [],
        tracks: []
    };

})(jwplayer.playlist);
