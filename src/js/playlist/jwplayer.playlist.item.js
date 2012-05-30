/**
 * JW Player playlist item model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(playlist) {
	var _item = playlist.item = function(config) {
		_playlistitem = jwplayer.utils.extend({}, _item.defaults, config);
		
/*
		if (_playlistitem.type) {
			_playlistitem.provider = _playlistitem.type;
			delete _playlistitem.type;
		}
*/		
		if (_playlistitem.sources.length == 0) {
			_playlistitem.sources[0] = new playlist.source(_playlistitem);
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
	
	_item.defaults = {
		description: "",
		image: "",
		mediaid: "",
		title: "",
		duration: -1,
		sources: []
	};
	
})(jwplayer.playlist);