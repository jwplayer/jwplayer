/**
 * JW Player playlist item model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(playlist) {
	var _item = playlist.item = function(config) {
		var _playlistitem = jwplayer.utils.extend({}, _item.defaults, config);
		
/*
		if (_playlistitem.type) {
			_playlistitem.provider = _playlistitem.type;
			delete _playlistitem.type;
		}
*/		
		if (_playlistitem.sources.length == 0) {
			_playlistitem.sources = [new playlist.source(_playlistitem)];
		}
		
		/** Each source should be a named object **/
		for (var i=0; i < _playlistitem.sources.length; i++) {
			_playlistitem.sources[i] = new playlist.source(_playlistitem.sources[i]);
		}
/*		
 * 
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
		tags: "",
		duration: -1,
		sources: []
	};
	
})(jwplayer.playlist);