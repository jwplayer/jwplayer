import { localName, textContent } from 'parsers/parsers';
import { xmlAttribute } from 'utils/strings';
import { serialize } from 'utils/parser';

/**
* Parse a feed item for JWPlayer content.
*/

const parseEntry = function (obj, itm) {
    const PREFIX = 'jwplayer';
    const def = 'default';
    const label = 'label';
    const file = 'file';
    const type = 'type';
    const sources = [];
    const tracks = [];

    for (let i = 0; i < obj.childNodes.length; i++) {
        const node = obj.childNodes[i];
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
            if (sources[i].file.length > 0) {
                sources[i][def] = (sources[i][def] === 'true');
                if (!sources[i].label.length) {
                    delete sources[i].label;
                }
                itm.sources.push(sources[i]);
            }
        }
    }

    if (tracks.length) {
        itm.tracks = [];
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].file.length > 0) {
                tracks[i][def] = (tracks[i][def] === 'true') ? true : false;
                tracks[i].kind = (!tracks[i].kind.length) ? 'captions' : tracks[i].kind;
                if (!tracks[i].label.length) {
                    delete tracks[i].label;
                }
                itm.tracks.push(tracks[i]);
            }
        }
    }
    return itm;
};

export default parseEntry;
