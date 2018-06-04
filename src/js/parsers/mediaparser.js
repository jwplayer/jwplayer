import { localName, textContent, numChildren } from 'parsers/parsers';
import { xmlAttribute } from 'utils/strings';
import { seconds } from 'utils/strings';

/**
 * Parse a MRSS group into a playlistitem (used in RSS and ATOM)
 * The 'content' and 'group' elements can nest other MediaRSS elements
 */

const mediaparser = function (obj, item) {
    // Prefix for the MRSS namespace
    const PREFIX = 'media';
    const tracks = 'tracks';
    const captions = [];

    function getLabel(code) {
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

    for (let i = 0; i < numChildren(obj); i++) {
        const node = obj.childNodes[i];
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
                        const sources = {
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
                    const entry = {};
                    entry.file = xmlAttribute(node, 'url');
                    entry.kind = 'captions';
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

    if (!item.hasOwnProperty(tracks)) {
        item[tracks] = [];
    }

    for (let i = 0; i < captions.length; i++) {
        item[tracks].push(captions[i]);
    }
    return item;
};

function findMediaTypes (contentNode) {
    const mediaTypes = [];

    for (let i = 0; i < numChildren(contentNode); i++) {
        const node = contentNode.childNodes[i];
        if (node.prefix === 'jwplayer' && localName(node).toLowerCase() === 'mediatypes') {
            mediaTypes.push(textContent(node));
        }
    }

    return mediaTypes;
}

export default mediaparser;
