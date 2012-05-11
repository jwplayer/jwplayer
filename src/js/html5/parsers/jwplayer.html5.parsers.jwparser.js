/**
 * Parse a feed item for JWPlayer content.
 * 
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(jwplayer) {
	var _parsers = jwplayer.html5.parsers;
	
	var jwparser = _parsers.jwparser = function() {
	};

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
	jwparser.parseEntry = function(obj, itm) {
		for ( var i = 0; i < obj.childNodes.length; i++) {
			var node = obj.childNodes[i];
			if (node.prefix == PREFIX) {
				var _localName = _parsers.localName(node);
				itm[_localName] = jwplayer.utils.serialize(_parsers.textContent(node));
				if (_localName == "file" && itm.sources) {
					// jwplayer namespace file should override existing source
					// (probably set in MediaParser)
					delete itm.sources;
				}
			}
			if (!itm['file']) {
				itm['file'] = itm['link'];
			}
		}
		return itm;
	}
})(jwplayer);