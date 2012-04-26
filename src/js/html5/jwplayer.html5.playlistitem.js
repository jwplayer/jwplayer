/**
 * JW Player playlist item model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(html5) {
	html5.playlistitem = function(config) {
		var _defaults = {
			description: "",
			image: "",
			link: "",
			mediaid: "",
			title: "",
			provider: "",
			
			file: "",
			duration: -1,
			start: 0,
			
			currentLevel: -1,
			levels: []
		};
		
		
		var _playlistitem = jwplayer.utils.extend({}, _defaults, config);
		
/*
		if (_playlistitem.type) {
			_playlistitem.provider = _playlistitem.type;
			delete _playlistitem.type;
		}
*/		
		if (_playlistitem.levels.length === 0) {
			_playlistitem.levels[0] = new html5.playlistitemlevel(_playlistitem);
		}
/*		
		if (!_playlistitem.provider) {
			_playlistitem.provider = _getProvider(_playlistitem.levels[0]);
		} else {
			_playlistitem.provider = _playlistitem.provider.toLowerCase();
		}
*/
		
		return _playlistitem;
	};
})(jwplayer.html5);