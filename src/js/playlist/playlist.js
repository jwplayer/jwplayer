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
    Playlist.filterPlaylist = function(playlist, model, feedData) {
        var list = [];
        var providers = model.getProviders();
        var preload = model.get('preload');
        var itemFeedData = _.extend({}, feedData);
        delete itemFeedData.playlist;

        _.each(playlist, function(item) {
            item = _.extend({}, item);

            item.allSources = _formatSources(item, model);

            item.sources = _filterSources(item.allSources, providers);

            if (!item.sources.length) {
                return;
            }

            // include selected file in item for backwards compatibility
            item.file = item.sources[0].file;

            // set preload for the item, if it is defined
            if (preload) {
                item.preload = item.preload || preload;
            }

            if (feedData) {
                item.feedData = itemFeedData;
            }

            list.push(item);
        });

        return list;
    };

    var _formatSources = function(item, model) {
        var sources = item.sources;
        var androidhls = model.get('androidhls');
        var itemDrm = item.drm || model.get('drm');
        var preload = item.preload || model.get('preload');
        var withCredentials = _fallbackIfUndefined(item.withCredentials, model.get('withCredentials'));
        var hlsjsdefault = model.get('hlsjsdefault');

        return _.compact(_.map(sources, function(originalSource) {
            if (!_.isObject(originalSource)) {
                return null;
            }
            if (androidhls !== undefined && androidhls !== null) {
                originalSource.androidhls = androidhls;
            }

            if (originalSource.drm || itemDrm) {
                originalSource.drm = originalSource.drm || itemDrm;
            }

            if (originalSource.preload || preload) {
                originalSource.preload = originalSource.preload || preload;
            }

            // withCredentials is assigned in ascending priority order, source > playlist > model
            // a false value that is a higher priority than true must result in a false withCredentials value
            // we don't want undefined if all levels have withCredentials as undefined
            var cascadedWithCredentials = _fallbackIfUndefined(originalSource.withCredentials, withCredentials);
            if (!_.isUndefined(cascadedWithCredentials)) {
                originalSource.withCredentials = cascadedWithCredentials;
            }

            if (hlsjsdefault) {
                originalSource.hlsjsdefault = hlsjsdefault;
            }

            return Source(originalSource);
        }));
    };

    // A playlist item may have multiple different sources, but we want to stick with one.
    var _filterSources = function(sources, providers) {
        // legacy plugin support
        if (!providers || !providers.choose) {
            providers = new Providers({ primary: providers ? 'flash' : null });
        }

        var chosenProviderAndType = _chooseProviderAndType(sources, providers);
        if (!chosenProviderAndType) {
            return [];
        }
        var provider = chosenProviderAndType.provider;
        var bestType = chosenProviderAndType.type;
        return _.filter(sources, function(source) {
            return source.type === bestType && providers.providerSupports(provider, source);
        });
    };

    //  Choose from the sources a type which matches our most preferred provider
    function _chooseProviderAndType(sources, providers) {
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];
            var chosenProvider = providers.choose(source);
            if (chosenProvider) {
                return { type: source.type, provider: chosenProvider.providerToCheck };
            }
        }

        return null;
    }

    function _fallbackIfUndefined(value, fallback) {
        return _.isUndefined(value) ? fallback : value;
    }

    return Playlist;
});
