/**
 * JW Player playlist item track
 *
 * @author sanil
 * @version 6.3
 */
(function(playlist) {
	var UNDEF = undefined,
		utils = jwplayer.utils,
		defaults = {
			file: UNDEF,
			label: UNDEF,
			kind: "captions",
			"default": false
		};
	
	playlist.track = function(config) {
		var _track = utils.extend({}, defaults);
		if (!config) config = {};
		
		utils.foreach(defaults, function(property, value) {
			if (utils.exists(config[property])) {
				_track[property] = config[property];
				// Actively move from config to track
				delete config[property];
			}
		});
		
		return _track;
	};
	
})(jwplayer.playlist);
