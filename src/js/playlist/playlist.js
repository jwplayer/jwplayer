define([
        'providers/chooseprovider',
        'utils/helpers',
        'utils/strings',
        'utils/extensionmap',
        'playlist/item',
        'underscore'
], function(chooseProvider, utils, strings, extensionmap, PlaylistItem, _) {

    var Playlist = function (playlist) {
        var _playlist = [];

        // Can be either an array of items or a single item.
        playlist = (_.isArray(playlist) ? playlist : [playlist]);

        _.each(playlist, function (item) {
            _playlist.push(new PlaylistItem(item));
        });

        return _playlist;
    };

    /** Go through the playlist and choose a single playable type to play; remove sources of a different type **/
    Playlist.filterPlaylist = function (playlist, androidhls) {
        var list = [];

        _.each(playlist, function (item) {
            item = utils.extend({}, item);
            item.sources = _filterSources(item.sources, androidhls);

            if (!item.sources.length) {
                return;
            }

            // If the source doesn't have a label, number it
            for (var j = 0; j < item.sources.length; j++) {
                item.sources[j].label = item.sources[j].label || j.toString();
            }

            list.push(item);
        });

        return list;
    };

    function _parseSource(source) {

        // file is the only hard requirement
        if (!source || !source.file) {
            return;
        }

        var file = strings.trim('' + source.file);
        var type = source.type;

        // If type not included, we infer it from extension
        if (!type) {
            var extension = strings.extension(file);
            type = extensionmap.extType(extension);
        }

        return utils.extend({}, source, { file: file, type: type });
    }

    /** Filters the sources by taking the first playable type and eliminating sources of a different type **/
    var _filterSources = Playlist.filterSources = function (sources, androidhls) {
        var selectedType,
            newSources = [];

        if (!sources) {
            return;
        }

        _.each(sources, function (originalSource) {
            var source = _parseSource(originalSource);

            if (!source) {
                return;
            }

            if (androidhls) {
                source.androidhls = true;
            }

            if (chooseProvider(source)) {
                // We want sources of all the same type since they may be of different quality levels
                selectedType = selectedType || source.type;

                if (source.type === selectedType) {
                    newSources.push(source);
                }
            }
        });

        return newSources;
    };

    return Playlist;
});
