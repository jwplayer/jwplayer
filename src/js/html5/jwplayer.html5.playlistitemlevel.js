/**
 * JW Player playlist item level model
 *
 * @author zach
 * @version 5.4
 */
(function(jwplayer) {
	jwplayer.html5.playlistitemlevel = function(config) {
		var _playlistitemlevel = {
			file: "",
			streamer: "",
			bitrate: 0,
			width: 0
		};
		
		for (var property in _playlistitemlevel) {
			if (jwplayer.utils.exists(config[property])) {
				_playlistitemlevel[property] = config[property];
			}
		}
		return _playlistitemlevel;
	};
	
})(jwplayer);
