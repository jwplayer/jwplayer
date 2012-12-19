/**
 * Configuration for the JW Player Embedder
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils,
		embed = jwplayer.embed,
		playlistitem = jwplayer.playlist.item,
		UNDEFINED = undefined;

	var config = embed.config = function(config) {
		
		var _defaults = {
				fallback: true,
				height: 270,
				primary: "html5",
				width: 480,
				base: config.base ? config.base : utils.getScriptPath("jwplayer.js")
			},
			_config = utils.extend(_defaults, config),
			_modes = {
			    html5: { type: "html5", src: _config.base + "jwplayer.html5.js" },
				flash: { type: "flash", src: _config.base + "jwplayer.flash.swf" }
			};

		// No longer allowing user-set modes block as of 6.0
		_config.modes = (_config.primary == "flash") ? [_modes.flash, _modes.html5] : [_modes.html5, _modes.flash]; 
		
		if (_config.listbar) {
			_config.playlistsize = _config.listbar.size;
			_config.playlistposition = _config.listbar.position;
		}
		
		_normalizePlaylist(_config);
		
		return _config;
	};

	/** Appends a new configuration onto an old one; used for mode configuration **/
	config.addConfig = function(oldConfig, newConfig) {
		_normalizePlaylist(newConfig);
		return utils.extend(oldConfig, newConfig);
	}
	
	/** Construct a playlist from base-level config elements **/
	function _normalizePlaylist(config) {
		if (!config.playlist) {
			var singleItem = {};
			
			for (var itemProp in playlistitem.defaults) {
				_moveProperty(config, singleItem, itemProp);
			}

			if (!singleItem.sources) {
				if (config.levels) {
					singleItem.sources = config.levels;
					delete config.levels;
				} else {
					var singleSource = {};
					_moveProperty(config, singleSource, "file");
					_moveProperty(config, singleSource, "type");
					singleItem.sources = singleSource.file ? [singleSource] : [];
				}
			}
				
			config.playlist = [new playlistitem(singleItem)];
		} else {
			// Use JW Player playlist items to normalize sources of existing playlist items
			for (var i=0; i<config.playlist.length; i++) {
				config.playlist[i] = new playlistitem(config.playlist[i]);
			}
		}
	}
	
	function _moveProperty(sourceObj, destObj, property) {
		if (utils.exists(sourceObj[property])) {
			destObj[property] = sourceObj[property];
			delete sourceObj[property];
		}
	}
	
})(jwplayer);
