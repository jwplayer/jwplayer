import { localName, textContent, numChildren } from 'parsers/parsers';
import { xmlAttribute } from 'utils/strings';
import { seconds } from 'utils/strings';
import type { PageNode } from 'types/generic.type';

/*
 * Parse a MRSS group into a playlistitem (used in RSS and ATOM)
 * The 'content' and 'group' elements can nest other MediaRSS elements
 */

export type PlaylistMRSSItem = {
    file?: string;
    title?: string;
    mediaid?: string;
    date?: string;
    description?: string;
    link?: string;
    tags?: string;
};

export type PlaylistMRSSItemWithMedia = PlaylistMRSSItem & {
    duration?: number;
    image?: string;
    sources?: PlaylistMRSSSource[];
    tracks: PlaylistMRSSTrack[];
};

export type PlaylistMRSSSource = {
    default?: string;
    file: string;
    type: string;
    width?: string;
    label: string;
    mediaTypes?: string[];
};

export type PlaylistMRSSTrack = {
    default?: string;
    file?: string;
    kind: string;
    label?: string;
};

const mediaparser = function (obj: PageNode, item: Partial<PlaylistMRSSItemWithMedia>): PlaylistMRSSItemWithMedia {
    // Prefix for the MRSS namespace
    const PREFIX = 'media';
    const captions: PlaylistMRSSTrack[] = [];

    for (let i = 0; i < numChildren(obj); i++) {
        const node = obj.childNodes[i] as Element;
        if (node.prefix === PREFIX) {
            if (!localName(node)) {
                continue;
            }
            switch (localName(node).toLowerCase()) {
                case 'content':
                    if (xmlAttribute(node, 'duration')) {
                        item.duration = seconds(xmlAttribute(node, 'duration'));
                    }
                    if (xmlAttribute(node, 'url')) {
                        if (!item.sources) {
                            item.sources = [];
                        }
                        const sources: PlaylistMRSSSource = {
                            file: xmlAttribute(node, 'url'),
                            type: xmlAttribute(node, 'type'),
                            width: xmlAttribute(node, 'width'),
                            label: xmlAttribute(node, 'label')
                        };

                        const mediaTypes = findMediaTypes(node);
                        if (mediaTypes.length) {
                            sources.mediaTypes = mediaTypes;
                        }

                        item.sources.push(sources);
                    }
                    if (numChildren(node) > 0) {
                        item = mediaparser(node, item);
                    }
                    break;
                case 'title':
                    item.title = textContent(node);
                    break;
                case 'description':
                    item.description = textContent(node);
                    break;
                case 'guid':
                    item.mediaid = textContent(node);
                    break;
                case 'thumbnail':
                    if (!item.image) {
                        item.image = xmlAttribute(node, 'url');
                    }
                    break;
                case 'group':
                    mediaparser(node, item);
                    break;
                case 'subtitle': {
                    const entry: PlaylistMRSSTrack = {
                        file: xmlAttribute(node, 'url'),
                        kind: 'captions'
                    };
                    if (xmlAttribute(node, 'lang').length > 0) {
                        entry.label = getLabel(xmlAttribute(node, 'lang'));
                    }
                    captions.push(entry);
                    break;
                }
                default:
                    break;
            }
        }
    }

    if (!item.tracks) {
        item.tracks = [];
    }

    for (let i = 0; i < captions.length; i++) {
        item.tracks.push(captions[i]);
    }
    return item as PlaylistMRSSItemWithMedia;
};

function getLabel(code: string): string {
    const LANGS = {
        zh: 'Chinese',
        nl: 'Dutch',
        en: 'English',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        ja: 'Japanese',
        pt: 'Portuguese',
        ru: 'Russian',
        es: 'Spanish'
    };
    if (LANGS[code]) {
        return LANGS[code];
    }
    return code;
}

function findMediaTypes (contentNode: Element): string[] {
    const mediaTypes: string[] = [];

    for (let i = 0; i < numChildren(contentNode); i++) {
        const node = contentNode.childNodes[i] as Element;
        if (node.prefix === 'jwplayer' && localName(node).toLowerCase() === 'mediatypes') {
            mediaTypes.push(textContent(node));
        }
    }

    return mediaTypes;
}

export default mediaparser;
