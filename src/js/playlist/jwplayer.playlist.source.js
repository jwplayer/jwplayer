/**
 * JW Player playlist item source
 *
 * @author pablo
 * @version 6.0
 */
(function(playlist) {
	var UNDEF = undefined,
		utils = jwplayer.utils,
		defaults = {
			file: UNDEF,
			label: UNDEF,
			type: UNDEF,
			"default": UNDEF
		};
	
	playlist.source = function(config) {
		var _source = utils.extend({}, defaults);
		
		utils.foreach(defaults, function(property, value) {
			if (utils.exists(config[property])) {
				_source[property] = config[property];
				// Actively move from config to source
				delete config[property];
			}
		});
		
		if (_source.type && _source.type.indexOf("/") > 0) {
			_source.type = utils.extensionmap.mimeType(_source.type);
		}
		if (_source.type == "m3u8") _source.type = "hls";
		if (_source.type == "smil") _source.type = "rtmp";
		return _source;
	};
	
})(jwplayer.playlist);
