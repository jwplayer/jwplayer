/**
 * Parse a MRSS group into a playlistitem (used in RSS and ATOM).
 */
define([
    'parsers/parsers',
    'utils/strings',
    'utils/helpers'
], function(parsers, strings, utils) {

    var _xmlAttribute = strings.xmlAttribute;
    var _localName = parsers.localName;
    var _textContent = parsers.textContent;
    var _numChildren = parsers.numChildren;

    // Prefix for the MRSS namespace
    var PREFIX = 'media';

    // Parse a feeditem for Yahoo MediaRSS extensions
    // The 'content' and 'group' elements can nest other MediaRSS elements.
    var mediaparser = function (obj, itm) {

        var node;
        var i;
        var tracks = 'tracks';
        var captions = [];

        function getLabel(code) {
            var LANGS = {
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
        for (i = 0; i < _numChildren(obj); i++) {
            node = obj.childNodes[i];
            if (node.prefix === PREFIX) {
                if (!_localName(node)) {
                    continue;
                }
                switch (_localName(node).toLowerCase()) {
                    case 'content':
                        if (_xmlAttribute(node, 'duration')) {
                            itm.duration = utils.seconds(_xmlAttribute(node, 'duration'));
                        }
                        if (_xmlAttribute(node, 'url')) {
                            if (!itm.sources) {
                                itm.sources = [];
                            }
                            var sources = {
                                file: _xmlAttribute(node, 'url'),
                                type: _xmlAttribute(node, 'type'),
                                width: _xmlAttribute(node, 'width'),
                                label: _xmlAttribute(node, 'label')
                            };

                            var mediaTypes = findMediaTypes(node);
                            if (mediaTypes.length) {
                                sources.mediaTypes = mediaTypes;
                            }

                            itm.sources.push(sources);
                        }
                        if (_numChildren(node) > 0) {
                            itm = mediaparser(node, itm);
                        }
                        break;
                    case 'title':
                        itm.title = _textContent(node);
                        break;
                    case 'description':
                        itm.description = _textContent(node);
                        break;
                    case 'guid':
                        itm.mediaid = _textContent(node);
                        break;
                    case 'thumbnail':
                        if (!itm.image) {
                            itm.image = _xmlAttribute(node, 'url');
                        }
                        break;
                    case 'group':
                        mediaparser(node, itm);
                        break;
                    case 'subtitle':
                        var entry = {};
                        entry.file = _xmlAttribute(node, 'url');
                        entry.kind = 'captions';
                        if (_xmlAttribute(node, 'lang').length > 0) {
                            entry.label = getLabel(_xmlAttribute(node, 'lang'));
                        }
                        captions.push(entry);
                        break;
                    default:
                        break;
                }
            }
        }

        if (!itm.hasOwnProperty(tracks)) {
            itm[tracks] = [];
        }

        for (i = 0; i < captions.length; i++) {
            itm[tracks].push(captions[i]);
        }
        return itm;
    };

    function findMediaTypes (contentNode) {
        var mediaTypes = [];

        for (var i = 0; i < _numChildren(contentNode); i++) {
            var node = contentNode.childNodes[i];
            if (node.prefix === 'jwplayer' && _localName(node).toLowerCase() === 'mediatypes') {
                mediaTypes.push(_textContent(node));
            }
        }

        return mediaTypes;
    }

    return mediaparser;
});
