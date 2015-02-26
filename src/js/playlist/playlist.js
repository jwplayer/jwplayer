define([
    'providers/chooseprovider',
    'utils/helpers',
    'playlist/item',
    'playlist/source',
    'utils/underscore'
], function(chooseProvider, utils, PlaylistItem, Source,  _) {

    var Playlist = function (playlist) {
        // Can be either an array of items or a single item.
        playlist = (_.isArray(playlist) ? playlist : [playlist]);

        return _.map(playlist, PlaylistItem);
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

            list.push(item);
        });

        return list;
    };

    /** Filters the sources by taking the first playable type and eliminating sources of a different type **/
    var _filterSources = Playlist.filterSources = function (sources, androidhls) {
        var selectedType,
            newSources = [];

        if (!sources) {
            return;
        }

        _.each(sources, function (originalSource) {
            originalSource.androidhls =  androidhls;
            var source = Source(originalSource);

            if (!source) {
                return;
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
