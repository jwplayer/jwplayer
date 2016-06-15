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
    Playlist.filterPlaylist = function(playlist, providers, androidhls, configDrm, preload, feedid, withCredentials) {
        var list = [];

        _.each(playlist, function(item) {
            item = _.extend({}, item);

            item.allSources = _formatSources(item.sources,
                androidhls,
                item.drm || configDrm,
                item.preload || preload,
                _fallbackIfUndefined(item.withCredentials, withCredentials));

            item.sources = _filterSources(item.allSources, providers);

            if (!item.sources.length) {
                return;
            }

            // include selected file in item for backwards compatibility
            item.file = item.sources[0].file;

            // set preload for the item, if it is defined
            if (item.preload || preload) {
                item.preload = item.preload || preload;
            }

            // set feedid for the item, if it is defined
            if (item.feedid || feedid) {
                item.feedid = item.feedid || feedid;
            }

            list.push(item);
        });

        return list;
    };

    var _formatSources = function(sources, androidhls, itemDrm, preload, withCredentials) {
        return _.compact(_.map(sources, function(originalSource) {
            if (! _.isObject(originalSource)) {
                return;
            }
            if (androidhls !== undefined && androidhls !== null) {
                originalSource.androidhls =  androidhls;
            }

            if (originalSource.drm || itemDrm) {
                originalSource.drm = originalSource.drm || itemDrm;
            }

            if (originalSource.preload || preload) {
                originalSource.preload = originalSource.preload || preload;
            }

            originalSource.withCredentials = _fallbackIfUndefined(originalSource.withCredentials, withCredentials);

            return Source(originalSource);
        }));
    };

    // A playlist item may have multiple different sources, but we want to stick with one.
    var _filterSources = function(sources, providers) {
        // legacy plugin support
        if (!providers || !providers.choose) {
            providers = new Providers({primary : providers ? 'flash' : null});
        }

        var bestType = _chooseType(sources, providers);

        return _.where(sources, {type : bestType});
    };

    //  Choose from the sources a type which matches our most preferred provider
    function _chooseType(sources, providers) {
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];
            var chosenProvider = providers.choose(source);
            if (chosenProvider) {
                return source.type;
            }
        }

        return null;
    }

    function _fallbackIfUndefined(value, fallback) {
        return _.isUndefined(value) ? fallback : value;
    }

    return Playlist;
});
