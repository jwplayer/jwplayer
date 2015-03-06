define([
    'playlist/item',
    'playlist/source',
    'underscore'
], function(PlaylistItem, Source, _) {

    var Playlist = function (playlist) {
        // Can be either an array of items or a single item.
        playlist = (_.isArray(playlist) ? playlist : [playlist]);

        return _.map(playlist, PlaylistItem);
    };

    /** Go through the playlist and choose a single playable type to play; remove sources of a different type **/
    Playlist.filterPlaylist = function(playlist, providers, androidhls) {
        var list = [];

        _.each(playlist, function(item) {
            item = _.extend({}, item);
            item.sources = _filterSources(item.sources, providers, androidhls);

            if (!item.sources.length) {
                return;
            }

            list.push(item);
        });

        return list;
    };

    // A playlist item may have multiple different sources, but we want to stick with one.
    var _filterSources = Playlist.filterSources = function(sources, providers, androidhls) {
        sources = _.compact(_.map(sources, function(originalSource) {
            if (! _.isObject(originalSource)) {
                return;
            }

            originalSource.androidhls =  androidhls;
            return Source(originalSource);
        }));

        var bestType = _chooseType(sources, providers);

        return _.where(sources, {type : bestType});
    };

    //  Choose from the sources a type which matches our most preferred provider
    function _chooseType(sources, providers) {
        var m = _.map(sources, function(s) {
            var provider = providers.choose(s);
            var priority = providers.priority(provider);

            return {
                priority : priority,
                type : s.type
            };
        });

        var best = _.max(m, _.property('priority'));

        return best.type;
    }

    return Playlist;
});
