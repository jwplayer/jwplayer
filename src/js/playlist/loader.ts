import { PLAYLIST_LOADED, ERROR } from 'events/events';
import { localName } from 'parsers/parsers';
import parseRss from 'parsers/rssparser';
import { ajax } from 'utils/ajax';
import Events from 'utils/backbone.events';
import { PlayerError, MSG_CANT_PLAY_VIDEO } from 'api/errors';
import type { PageNode } from 'types/generic.type';

interface PlaylistLoaderInterface extends Events {
    load(playlistfile: string): void;
    destroy(): void;
}

const PlaylistLoader = function(this: PlaylistLoaderInterface): void {
    const _this = Object.assign(this, Events);

    this.load = function(playlistfile: string): void {
        ajax(playlistfile, playlistLoaded, (message, file, url, error) => {
            playlistError(error);
        });
    };

    this.destroy = function(): void {
        this.off();
    };

    // TODO: Type `loadedEvent` ajax oncomplete callback event object
    function playlistLoaded(loadedEvent: { responseXML?: Document | null; responseText: string }): void {
        try {
            const childNodes = loadedEvent.responseXML ? loadedEvent.responseXML.childNodes : null;
            let rss: PageNode | null = null;
            let jsonObj;
            if (childNodes) {
                for (let i = 0; i < childNodes.length; i++) {
                    rss = childNodes[i] as ChildNode;
                    // 8: Node.COMMENT_NODE (IE8 doesn't have the Node.COMMENT_NODE constant)
                    if (rss.nodeType !== 8) {
                        break;
                    }
                }
                if (rss && localName(rss) === 'xml') {
                    rss = rss.nextSibling;
                }
                if (rss && localName(rss) === 'rss') {
                    const rssPlaylist = parseRss(rss);
                    jsonObj = Object.assign({ playlist: rssPlaylist }, rssPlaylist.feedData);
                }
            }

            // If the response is not valid RSS, check if it is JSON
            if (!jsonObj) {
                try {
                    const pl = JSON.parse(loadedEvent.responseText);
                    // If the response is not a JSON array, try to read playlist of the response
                    if (Array.isArray(pl)) {
                        jsonObj = { playlist: pl };
                    } else if (Array.isArray(pl.playlist)) {
                        jsonObj = pl;
                    } else {
                        throw Error('Playlist is not an array');
                    }
                } catch (e) {
                    throw new PlayerError(MSG_CANT_PLAY_VIDEO, 621, e);
                }
            }

            _this.trigger(PLAYLIST_LOADED, jsonObj);
        } catch (error) {
            playlistError(error);
        }
    }

    function playlistError(error: PlayerError | Error): void {
        if (!error.code) {
            error = new PlayerError(MSG_CANT_PLAY_VIDEO, 0);
        }
        _this.trigger(ERROR, error);
    }
};

export default PlaylistLoader;
