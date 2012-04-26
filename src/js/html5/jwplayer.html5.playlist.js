/**
 * JW Player playlist model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(html5) {
	var _utils = jwplayer.utils;
	html5.playlist = function(playlist) {
		var _playlist = [];
		if (playlist && playlist instanceof Array && playlist.length > 0) {
			for (var playlistItem in playlist) {
				if (!isNaN(parseInt(playlistItem))){
					_playlist.push(new html5.playlistitem(playlist[playlistItem]));
				}
			}
		} else {
			_playlist.push(new html5.playlistitem(playlist));
		}
		return _playlist;
	};
	
})(jwplayer.html5);
