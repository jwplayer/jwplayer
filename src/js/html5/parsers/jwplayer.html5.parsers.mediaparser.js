/**
 * Parse a MRSS group into a playlistitem (used in RSS and ATOM).
 *
 * author zach
 * modified pablo
 * version 6.0
 */
(function(parsers) {
	var _strings = jwplayer.utils.strings,
		_xmlAttribute = _strings.xmlAttribute,
		_localName = parsers.localName,
		_textContent = parsers.textContent,
		_numChildren = parsers.numChildren;
	
	
	var mediaparser = parsers.mediaparser = function() {};
	
	/** Prefix for the MRSS namespace. **/
	var PREFIX = 'media';
	
	/**
	 * Parse a feeditem for Yahoo MediaRSS extensions.
	 * The 'content' and 'group' elements can nest other MediaRSS elements.
	 * @param	{XML}		obj		The entire MRSS XML object.
	 * @param	{Object}	itm		The playlistentry to amend the object to.
	 * @return	{Object}			The playlistentry, amended with the MRSS info.
	 **/
	mediaparser.parseGroup = function(obj, itm) {
		for (var i = 0; i < _numChildren(obj); i++) {
			var node = obj.childNodes[i];
			if (node.prefix == PREFIX) {
				if (!_localName(node)){
					continue;
				}
				switch (_localName(node).toLowerCase()) {
					case 'content':
						itm['file'] = _xmlAttribute(node, 'url');
						if (_xmlAttribute(node, 'duration')) {
							itm['duration'] = _strings.seconds(_xmlAttribute(node, 'duration'));
						}
						if (_xmlAttribute(node, 'start')) {
							itm['start'] = _strings.seconds(_xmlAttribute(node, 'start'));
						}
						if (_numChildren(node) > 0) {
							itm = mediaparser.parseGroup(node, itm);
						}
						if (_xmlAttribute(node, 'width')
								|| _xmlAttribute(node, 'bitrate')
								|| _xmlAttribute(node, 'url')) {
							if (!itm.levels) {
								itm.levels = [];
							}
							itm.levels.push({
								width: _xmlAttribute(node, 'width'),
								bitrate: _xmlAttribute(node, 'bitrate'),
								file: _xmlAttribute(node, 'url')
							});
						}
						break;
					case 'title':
						itm['title'] = _textContent(node);
						break;
					case 'description':
						itm['description'] = _textContent(node);
						break;
					case 'keywords':
						itm['tags'] = _textContent(node);
						break;
					case 'thumbnail':
						itm['image'] = _xmlAttribute(node, 'url');
						break;
					case 'credit':
						itm['author'] = _textContent(node);
						break;
					case 'player':
						var url = node.url;
						break;
					case 'group':
						mediaparser.parseGroup(node, itm);
						break;
				}
			}
		}
		return itm;
	}
	
})(jwplayer.html5.parsers);
