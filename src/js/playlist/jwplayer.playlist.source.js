/**
 * JW Player playlist item source
 *
 * @author pablo
 * @version 6.0
 */
(function(playlist) {
	playlist.source = function(config) {
		var _source = {
			file: "",
			width: 0,
			label: undefined,
			type: undefined
		};
		
		for (var property in _source) {
			if (jwplayer.utils.exists(config[property])) {
				_source[property] = config[property];
			}
		}
		return _source;
	};
	
})(jwplayer.playlist);
