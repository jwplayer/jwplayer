/**
 * JW Player playlist item model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(playlist) {
	var _item = playlist.item = function(config) {
		var utils = jwplayer.utils,
			_playlistitem = utils.extend({}, _item.defaults, config);
		_playlistitem.tracks = (config && utils.exists(config.tracks)) ? config.tracks : [];

		if (_playlistitem.sources.length == 0) {
			_playlistitem.sources = [new playlist.source(_playlistitem)];
		}

		/** Each source should be a named object **/
		for (var i=0; i < _playlistitem.sources.length; i++) {
			var def = _playlistitem.sources[i]["default"];
			if (def) {
				_playlistitem.sources[i]["default"] = (def.toString() == "true");
			}
			else {
				_playlistitem.sources[i]["default"] = false;	
			}

			_playlistitem.sources[i] = new playlist.source(_playlistitem.sources[i]);
		}

		if (_playlistitem.captions && !utils.exists(config.tracks)) {
			for (var j = 0; j < _playlistitem.captions.length; j++) {
				_playlistitem.tracks.push(_playlistitem.captions[j]);
			}
			delete _playlistitem.captions;
		}

		for (var i=0; i < _playlistitem.tracks.length; i++) {
			_playlistitem.tracks[i] = new playlist.track(_playlistitem.tracks[i]);
		}
		return _playlistitem;
	};
	
	_item.defaults = {
		description: "",
		image: "",
		mediaid: "",
		title: "",
		sources: [],
		tracks: []
	};
	
})(jwplayer.playlist);