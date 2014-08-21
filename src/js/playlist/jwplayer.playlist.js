/**
 * JW Player playlist model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(jwplayer) {

    var utils = jwplayer.utils;
    var _ = jwplayer._;

    jwplayer.playlist = function(playlist) {
        var _playlist = [];

        // Can be either an array of items or a single item.
        playlist = (_.isArray(playlist) ? playlist : [playlist]);

        _.each(playlist, function(item) {
            _playlist.push(new jwplayer.playlist.item(item));
        });

        return _playlist;
    };


    /** Go through the playlist and choose a single playable type to play; remove sources of a different type **/
    jwplayer.playlist.filterPlaylist = function(playlist, checkFlash, androidhls) {
        var pl = [],
            i, item, j, source;
        for (i = 0; i < playlist.length; i++) {
            item = utils.extend({}, playlist[i]);
            item.sources = jwplayer.playlist.filterSources(item.sources, false, androidhls);
            if (item.sources.length > 0) {
                for (j = 0; j < item.sources.length; j++) {
                    source = item.sources[j];
                    if (!source.label) {
                        source.label = j.toString();
                    }
                }
                pl.push(item);
            }
        }

        // HTML5 filtering failed; try for Flash sources
        if (checkFlash && pl.length === 0) {
            for (i = 0; i < playlist.length; i++) {
                item = utils.extend({}, playlist[i]);
                item.sources = jwplayer.playlist.filterSources(item.sources, true, androidhls);
                if (item.sources.length > 0) {
                    for (j = 0; j < item.sources.length; j++) {
                        source = item.sources[j];
                        if (!source.label) {
                            source.label = j.toString();
                        }
                    }
                    pl.push(item);
                }
            }
        }
        return pl;
    };

    /** Filters the sources by taking the first playable type and eliminating sources of a different type **/
    jwplayer.playlist.filterSources = function(sources, filterFlash, androidhls) {
        var selectedType,
            newSources;

        if (sources) {
            newSources = [];
            for (var i = 0; i < sources.length; i++) {
                var source = utils.extend({}, sources[i]),
                    file = source.file,
                    type = source.type;

                if (file) {
                    source.file = file = utils.trim('' + file);
                } else {
                    // source.file is required
                    continue;
                }

                if (!type) {
                    var extension = utils.extension(file);
                    source.type = type = utils.extensionmap.extType(extension);
                }

                if (filterFlash) {
                    if (jwplayer.embed.flashCanPlay(file, type)) {
                        if (!selectedType) {
                            selectedType = type;
                        }
                        if (type === selectedType) {
                            newSources.push(source);
                        }
                    }
                } else {
                    if (jwplayer.embed.html5CanPlay(file, type, androidhls)) {
                        if (!selectedType) {
                            selectedType = type;
                        }
                        if (type === selectedType) {
                            newSources.push(source);
                        }
                    }
                }
            }
        }
        return newSources;
    };
})(jwplayer);
