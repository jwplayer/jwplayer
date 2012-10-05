/**
 * Parse a MRSS group into a playlistitem (used in RSS and ATOM).
 *
 * author zach
 * modified pablo
 * version 6.0
 */
(function(parsers) {
	var utils = jwplayer.utils,
		_xmlAttribute = utils.xmlAttribute,
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
		var node, 
			i,
			captions = [];

		function getLabel(code) {
			var LANGS = { 
				"zh": "Chinese",
				"nl": "Dutch",
				"en": "English",
				"fr": "French",
				"de": "German",
				"it": "Italian",
				"ja": "Japanese",
				"pt": "Portuguese",
				"ru": "Russian",
				"es": "Spanish"
			};
			
			if(LANGS[code]) {
				return LANGS[code];
			}
			return code;
		}	

		for (i = 0; i < _numChildren(obj); i++) {
			node = obj.childNodes[i];
			if (node.prefix == PREFIX) {
				if (!_localName(node)){
					continue;
				}
				switch (_localName(node).toLowerCase()) {
					case 'content':
						//itm['file'] = _xmlAttribute(node, 'url');
						if (_xmlAttribute(node, 'duration')) {
							itm['duration'] = utils.seconds(_xmlAttribute(node, 'duration'));
						}
						if (_numChildren(node) > 0) {
							itm = mediaparser.parseGroup(node, itm);
						}
						if (_xmlAttribute(node, 'url')) {
							if (!itm.sources) {
								itm.sources = [];
							}
							itm.sources.push({
								file: _xmlAttribute(node, 'url'),
								type: _xmlAttribute(node, 'type'),
								width: _xmlAttribute(node, 'width'),
								label: _xmlAttribute(node, 'height') ? _xmlAttribute(node, 'height') + "p" : undefined
							});
						}
						break;
					case 'title':
						itm['title'] = _textContent(node);
						break;
					case 'description':
						itm['description'] = _textContent(node);
						break;
					case 'guid':
						itm['mediaid'] = _textContent(node);
						break;
					case 'thumbnail':
						itm['image'] = _xmlAttribute(node, 'url');
						break;
					case 'player':
						var url = node.url;
						break;
					case 'group':
						mediaparser.parseGroup(node, itm);
						break;
					case 'subtitle':
						var entry = {};
						entry.file = _xmlAttribute(node, 'url');
						if (_xmlAttribute(node, 'lang').length > 0) {
							entry.label = getLabel(_xmlAttribute(node, 'lang'));
						}
						captions.push(entry);
				}
			}
		}

		if(captions.length > 0) {
			itm['captions'] = captions;
		}

		return itm;
	}
	
})(jwplayer.html5.parsers);
