import { getPreload } from './preload';
import PlaylistItem from 'playlist/item';
import Source from 'playlist/source';
import Providers from 'providers/providers';

const Playlist = function(playlist) {
    // Can be either an array of items or a single item.
    return (Array.isArray(playlist) ? playlist : [playlist]).map(PlaylistItem);
};

/** Go through the playlist and choose a single playable type to play; remove sources of a different type **/
export function filterPlaylist(playlist, model, feedData) {
    const list = [];
    const providers = model.getProviders();
    const preload = model.get('preload');
    const itemFeedData = Object.assign({}, feedData);
    delete itemFeedData.playlist;

    playlist.forEach(function(item) {
        item = Object.assign({}, item);

        item.preload = getPreload(item.preload, preload);

        item.allSources = formatSources(item, model);

        item.sources = filterSources(item.allSources, providers);

        if (!item.sources.length) {
            return;
        }

        // include selected file in item for backwards compatibility
        item.file = item.sources[0].file;

        if (feedData) {
            item.feedData = itemFeedData;
        }

        list.push(item);
    });

    return list;
}

function formatSources(item, model) {
    const sources = item.sources;
    const androidhls = model.get('androidhls');
    const safariHlsjs = model.get('safarihlsjs');
    const itemDrm = item.drm || model.get('drm');
    const withCredentials = fallbackIfUndefined(item.withCredentials, model.get('withCredentials'));
    const hlsjsdefault = model.get('hlsjsdefault') !== false;

    return sources.map(function(originalSource) {
        if (originalSource !== Object(originalSource)) {
            return null;
        }
        if (androidhls !== undefined && androidhls !== null) {
            originalSource.androidhls = androidhls;
        }
        if (safariHlsjs !== undefined && safariHlsjs !== null) {
            originalSource.safarihlsjs = safariHlsjs;
        }

        if (safariHlsjs !== undefined && safariHlsjs !== null) {
            originalSource.safarihlsjs = safariHlsjs;
        }

        if (originalSource.drm || itemDrm) {
            originalSource.drm = originalSource.drm || itemDrm;
        }

        originalSource.preload = getPreload(originalSource.preload, item.preload);

        // withCredentials is assigned in ascending priority order, source > playlist > model
        // a false value that is a higher priority than true must result in a false withCredentials value
        // we don't want undefined if all levels have withCredentials as undefined
        const cascadedWithCredentials = fallbackIfUndefined(originalSource.withCredentials, withCredentials);
        if (cascadedWithCredentials !== undefined) {
            originalSource.withCredentials = cascadedWithCredentials;
        }

        if (hlsjsdefault) {
            originalSource.hlsjsdefault = hlsjsdefault;
        }

        return Source(originalSource);
    }).filter(source => !!source);
}

// A playlist item may have multiple different sources, but we want to stick with one.
function filterSources(sources, providers) {
    if (!providers || !providers.choose) {
        providers = new Providers();
    }

    const chosenProviderAndType = chooseProviderAndType(sources, providers);
    if (!chosenProviderAndType) {
        return [];
    }
    const provider = chosenProviderAndType.provider;
    const bestType = chosenProviderAndType.type;
    return sources.filter(function(source) {
        return source.type === bestType && providers.providerSupports(provider, source);
    });
}

//  Choose from the sources a type which matches our most preferred provider
function chooseProviderAndType(sources, providers) {
    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const chosenProvider = providers.choose(source);
        if (chosenProvider) {
            return { type: source.type, provider: chosenProvider.providerToCheck };
        }
    }

    return null;
}

function fallbackIfUndefined(value, fallback) {
    return (value === undefined) ? fallback : value;
}

export default Playlist;
