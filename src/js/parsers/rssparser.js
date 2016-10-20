/**
 * Parse an RSS feed and translate it to a playlist.
 */
define([
    'utils/strings',
    'parsers/parsers',
    'parsers/jwparser',
    'parsers/mediaparser',
    'playlist/item'
], function(strings, parsers, parseEntry, mediaParser, PlaylistItem) {
    var _textContent = parsers.textContent,
        _getChildNode = parsers.getChildNode,
        _numChildren = parsers.numChildren,
        _localName = parsers.localName;

    var rssparser = {};


    /**
     * Parse an RSS playlist for feed items.
     *
     * @param {XML} dat
     * @return {Array} playlistarray
     */
    rssparser.parse = function (dat) {
        var arr = [];
        for (var i = 0; i < _numChildren(dat); i++) {
            var node = _getChildNode(dat, i),
                localName = _localName(node).toLowerCase();
            if (localName === 'channel') {
                for (var j = 0; j < _numChildren(node); j++) {
                    var subNode = _getChildNode(node, j);
                    if (_localName(subNode).toLowerCase() === 'item') {
                        arr.push(_parseItem(subNode));
                    }
                }
            }
        }
        return arr;
    };


    /**
     * Translate RSS item to playlist item.
     *
     * @param {XML} obj
     * @return {PlaylistItem} PlaylistItem
     */
    function _parseItem(obj) {
        var itm = {};
        for (var i = 0; i < obj.childNodes.length; i++) {
            var node = obj.childNodes[i];
            var localName = _localName(node);
            if (!localName) {
                continue;
            }
            switch (localName.toLowerCase()) {
                case 'enclosure':
                    itm.file = strings.xmlAttribute(node, 'url');
                    break;
                case 'title':
                    itm.title = _textContent(node);
                    break;
                case 'guid':
                    itm.mediaid = _textContent(node);
                    break;
                case 'pubdate':
                    itm.date = _textContent(node);
                    break;
                case 'description':
                    itm.description = _textContent(node);
                    break;
                case 'link':
                    itm.link = _textContent(node);
                    break;
                case 'category':
                    if (itm.tags) {
                        itm.tags += _textContent(node);
                    } else {
                        itm.tags = _textContent(node);
                    }
                    break;
            }
        }
        itm = mediaParser(obj, itm);
        itm = parseEntry(obj, itm);

        return new PlaylistItem(itm);
    }

    return rssparser;

});
