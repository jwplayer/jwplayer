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
			bitrate: UNDEF,
			width: UNDEF,
			height: UNDEF,
			type: UNDEF
		};
	
	playlist.source = function(config) {
		var _source = utils.extend({}, defaults);
		
		for (var property in defaults) {
			if (utils.exists(config[property])) {
				_source[property] = config[property];
				// Actively move from config to source
				delete config[property];
			}
		}
		if (_source.type && _source.type.indexOf("/") > 0) {
			_source.type = utils.extensionmap.mimeType(_source.type);
		}
		return _source;
	};
	
})(jwplayer.playlist);
