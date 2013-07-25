/**
 * JW Player playlist model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(jwplayer) {
	jwplayer.playlist = function(playlist) {
		var _playlist = [];
		if (jwplayer.utils.typeOf(playlist) == "array") {
			for (var i=0; i < playlist.length; i++) {
				_playlist.push(new jwplayer.playlist.item(playlist[i]));
			}
		} else {
			_playlist.push(new jwplayer.playlist.item(playlist));
		}
		return _playlist;
	};
	
})(jwplayer);
