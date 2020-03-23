import { localName, textContent } from 'parsers/parsers';
import { xmlAttribute } from 'utils/strings';
import { serialize } from 'utils/parser';
import type { PlaylistMRSSItemWithMedia, PlaylistMRSSSource, PlaylistMRSSTrack } from 'parsers/mediaparser';
import type { PageNode } from 'types/generic.type';

/*
* Parse a feed item for JWPlayer content.
*/

export type PlaylistFeedItemWithMedia = Omit<PlaylistMRSSItemWithMedia, 'sources' | 'tracks'> & {
    sources: PlaylistMRSSSource[];
    tracks: PlaylistMRSSTrack[];
};

export type PlaylistFeedSource = Omit<PlaylistMRSSSource, 'default'> & {
    default: boolean;
};

export type PlaylistFeedTrack = Omit<PlaylistMRSSTrack, 'default'> & {
    default: boolean;
};

const parseEntry = function (obj: PageNode, itm: PlaylistMRSSItemWithMedia): PlaylistFeedItemWithMedia {
    const PREFIX = 'jwplayer';
    const def = 'default';
    const label = 'label';
    const file = 'file';
    const type = 'type';
    const sources: PlaylistMRSSSource[] = [];
    const tracks: PlaylistMRSSTrack[] = [];

    for (let i = 0; i < obj.childNodes.length; i++) {
        const node = obj.childNodes[i] as Element;
        if (node.prefix === PREFIX) {
            const _localName = localName(node);
            if (_localName === 'source') {
                delete itm.sources;
                sources.push({
                    file: xmlAttribute(node, file),
                    'default': xmlAttribute(node, def),
                    label: xmlAttribute(node, label),
                    type: xmlAttribute(node, type)
                });
            } else if (_localName === 'track') {
                delete itm.tracks;
                tracks.push({
                    file: xmlAttribute(node, file),
                    'default': xmlAttribute(node, def),
                    kind: xmlAttribute(node, 'kind'),
                    label: xmlAttribute(node, label)
                });
            } else {
                itm[_localName] = serialize(textContent(node));
                if (_localName === 'file' && itm.sources) {
                    // jwplayer namespace file should override existing source
                    // (probably set in MediaParser)
                    delete itm.sources;
                }
            }

        }
        if (!itm[file]) {
            itm[file] = itm.link;
        }
    }


    if (sources.length) {
        itm.sources = [];
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i] as PlaylistFeedSource;
            if (source.file.length > 0) {
                source[def] = (sources[i][def] === 'true');
                if (!source.label) {
                    delete source.label;
                }
                itm.sources.push(source);
            }
        }
    }

    if (tracks.length) {
        itm.tracks = [];
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i] as PlaylistFeedTrack;
            if (track.file && track.file.length > 0) {
                track[def] = (tracks[i][def] === 'true');
                track.kind = (!tracks[i].kind.length) ? 'captions' : tracks[i].kind;
                if (!track.label) {
                    delete track.label;
                }
                itm.tracks.push(track);
            }
        }
    }
    return itm as PlaylistFeedItemWithMedia;
};

export default parseEntry;
