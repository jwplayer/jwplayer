import { getPreload } from './preload';
import PlaylistItem from 'playlist/item';
import Source from 'playlist/source';
import Providers from 'providers/providers';
import { PlayerError, MSG_CANT_PLAY_VIDEO } from 'api/errors';

const Playlist = function(playlist) {
    // Can be either an array of items or a single item.
    return (Array.isArray(playlist) ? playlist : [playlist]).map(PlaylistItem);
};

// Go through the playlist and choose a single playable type to play; remove sources of a different type
export function filterPlaylist(playlist, model, feedData) {
    const itemFeedData = Object.assign({}, feedData);
    delete itemFeedData.playlist;

    return playlist.map((item) => normalizePlaylistItem(model, item, feedData)).filter((item) => !!item);

}


export function validatePlaylist(playlist) {
    if (!Array.isArray(playlist) || playlist.length === 0) {
        throw new PlayerError(MSG_CANT_PLAY_VIDEO, 630);
    }
}

export function normalizePlaylistItem(model, item, feedData) {
    const providers = model.getProviders();
    const preload = model.get('preload');
    const playlistItem = Object.assign({}, item);

    item.preload = getPreload(item.preload, preload);

    playlistItem.allSources = formatSources(item, model);

    playlistItem.sources = filterSources(playlistItem.allSources, providers);

    playlistItem.feedData = feedData;

    if (!playlistItem.sources.length) {
        return;
    }

    // include selected file in playlistItem for backwards compatibility
    playlistItem.file = playlistItem.sources[0].file;
    
    playlistItem.feedData = feedData;

    return playlistItem;
}

export const fixSources = (item, model) => filterSources(formatSources(item, model), model.getProviders());

function formatSources(item, model) {
    const { attributes } = model;
    const { sources, allSources, preload, drm } = item;
    const withCredentials = fallbackIfUndefined(item.withCredentials, attributes.withCredentials);

    return (allSources || sources).map(function(originalSource) {
        if (originalSource !== Object(originalSource)) {
            return null;
        }

        copyAttribute(originalSource, attributes, 'androidhls');
        copyAttribute(originalSource, attributes, 'hlsjsdefault');
        copyAttribute(originalSource, attributes, 'safarihlsjs');

        originalSource.preload = getPreload(originalSource.preload, preload);

        const sourceDrm = originalSource.drm || drm || attributes.drm;
        if (sourceDrm) {
            originalSource.drm = sourceDrm;
        }

        // withCredentials is assigned in ascending priority order, source > playlist > model
        // a false value that is a higher priority than true must result in a false withCredentials value
        // we don't want undefined if all levels have withCredentials as undefined
        const cascadedWithCredentials = fallbackIfUndefined(originalSource.withCredentials, withCredentials);
        if (cascadedWithCredentials !== undefined) {
            originalSource.withCredentials = cascadedWithCredentials;
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
        const { providerToCheck } = providers.choose(source);
        if (providerToCheck) {
            return { type: source.type, provider: providerToCheck };
        }
    }

    return null;
}

function fallbackIfUndefined(value, fallback) {
    return (value === undefined) ? fallback : value;
}

function copyAttribute(source, attributes, name) {
    if (name in attributes) {
        source[name] = attributes[name];
    }
}

export default Playlist;
