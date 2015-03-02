/**
 * Parse a feed item for JWPlayer content.
 */
define([
    'parsers/parsers',
    'utils/strings',
    'utils/helpers'
], function(parsers, strings, utils) {

    var PREFIX = 'jwplayer';

    /**
     * Parse a feed entry for JWPlayer content.
     *
     * @param {XML}
     *            obj The XML object to parse.
     * @param {Object}
     *            itm The playlistentry to amend the object to.
     * @return {Object} The playlistentry, amended with the JWPlayer info.
     */
    var parseEntry = function (obj, itm) {
        var sources = [],
            tracks = [],
            _xmlAttribute = strings.xmlAttribute,
            def = 'default',
            label = 'label',
            file = 'file',
            type = 'type';
        for (var i = 0; i < obj.childNodes.length; i++) {
            var node = obj.childNodes[i];
            if (node.prefix === PREFIX) {
                var _localName = parsers.localName(node);
                if (_localName === 'source') {
                    delete itm.sources;
                    sources.push({
                        file: _xmlAttribute(node, file),
                        'default': _xmlAttribute(node, def),
                        label: _xmlAttribute(node, label),
                        type: _xmlAttribute(node, type)
                    });
                } else if (_localName === 'track') {
                    delete itm.tracks;
                    tracks.push({
                        file: _xmlAttribute(node, file),
                        'default': _xmlAttribute(node, def),
                        kind: _xmlAttribute(node, 'kind'),
                        label: _xmlAttribute(node, label)
                    });
                } else {
                    itm[_localName] = utils.serialize(parsers.textContent(node));
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
            for (i = 0; i < sources.length; i++) {
                if (sources[i].file.length > 0) {
                    sources[i][def] = (sources[i][def] === 'true') ? true : false;
                    if (!sources[i].label.length) {
                        delete sources[i].label;
                    }
                    itm.sources.push(sources[i]);
                }
            }
        }

        if (tracks.length) {
            itm.tracks = [];
            for (i = 0; i < tracks.length; i++) {
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

    return parseEntry;
});
