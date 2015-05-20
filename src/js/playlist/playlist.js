define([
    'playlist/item',
    'playlist/source',
    'utils/underscore',
    'providers/providers'
], function(PlaylistItem, Source, _, Providers) {

    var Playlist = function (playlist) {
        // Can be either an array of items or a single item.
        playlist = (_.isArray(playlist) ? playlist : [playlist]);

        return _.compact(_.map(playlist, PlaylistItem));
    };

    /** Go through the playlist and choose a single playable type to play; remove sources of a different type **/
    Playlist.filterPlaylist = function(playlist, providers, androidhls, configProtection) {
        var list = [];

        _.each(playlist, function(item) {
            item = _.extend({}, item);
            item.sources = _filterSources(item.sources, providers, androidhls, item.protection || configProtection);

            if (!item.sources.length) {
                return;
            }

            // include selected file in item for backwards compatibility
            item.file = item.sources[0].file;

            list.push(item);
        });

        return list;
    };

    // A playlist item may have multiple different sources, but we want to stick with one.
    var _filterSources = Playlist.filterSources = function(sources, providers, androidhls, itemProtection) {

        // legacy plugin support
        if (!providers || !providers.choose) {
            providers = new Providers({primary : providers ? 'flash' : null});
        }

        sources = _.compact(_.map(sources, function(originalSource) {
            if (! _.isObject(originalSource)) {
                return;
            }
            if (androidhls) {
                originalSource.androidhls =  androidhls;
            }

            if (originalSource.protection || itemProtection) {
                originalSource.protection = originalSource.protection || itemProtection;
            }

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
        if (best.priority > -1) {
            return best.type;
        }
        return null;
    }

    return Playlist;
});
