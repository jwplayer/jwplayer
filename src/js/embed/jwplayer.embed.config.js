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
		
		function _setSources(modes, base, players) {
			for (var i=0; i<modes.length; i++) {
				var mode = modes[i].type;
				if (!modes[i].src) {
					modes[i].src = players[mode] ? players[mode] : base + "jwplayer." + mode + (mode == "flash" ? ".swf" : ".js");
				}
			}
		}
		
		var _defaults = {
				fallback: true,
				height: 270,
				primary: "html5",
				width: 480,
				base: UNDEFINED
			},
			_modes = {
			    html5: { type: "html5" },
				flash: { type: "flash" }
			},
			_config = utils.extend(_defaults, config);

		if (!_config.base) {
			_config.base = utils.getScriptPath("jwplayer.js");
		}
		
		if (!_config.modes) {
			_config.modes = (_config.primary == "flash") ? [_modes.flash, _modes.html5] : [_modes.html5, _modes.flash]; 
		}
		
		if (_config.listbar) {
			_config.playlistsize = _config.listbar.size;
			_config.playlistposition = _config.listbar.position;
		}
		
		_setSources(_config.modes, _config.base, { html5: _config.html5player, flash: _config.flashplayer })
		
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
				
			config.playlist = [singleItem];
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
	
	
//	function _isPosition(string) {
//		var lower = string.toLowerCase();
//		var positions = ["left", "right", "top", "bottom"];
//		
//		for (var position = 0; position < positions.length; position++) {
//			if (lower == positions[position]) {
//				return true;
//			}
//		}
//		
//		return false;
//	}
//	
//	function _isPlaylist(property) {
//		var result = false;
//		// JSON Playlist
//		result = (property instanceof Array) ||
//		// Single playlist item as an Object
//		(typeof property == "object" && !property.position && !property.size);
//		return result;
//	}
	
//	function getSize(size) {
//		if (typeof size == "string") {
//			if (parseInt(size).toString() == size || size.toLowerCase().indexOf("px") > -1) {
//				return parseInt(size);
//			} 
//		}
//		return size;
//	}
	
//	var components = ["playlist", "dock", "controlbar", "logo", "display"];
	
//	function getPluginNames(config) {
//		var pluginNames = {};
//		switch(utils.typeOf(config.plugins)){
//			case "object":
//				for (var plugin in config.plugins) {
//					pluginNames[utils.getPluginName(plugin)] = plugin;
//				}
//				break;
//			case "string":
//				var pluginArray = config.plugins.split(",");
//				for (var i=0; i < pluginArray.length; i++) {
//					pluginNames[utils.getPluginName(pluginArray[i])] = pluginArray[i];	
//				}
//				break;
//		}
//		return pluginNames;
//	}
//	
//	function addConfigParameter(config, componentType, componentName, componentParameter){
//		if (utils.typeOf(config[componentType]) != "object"){
//			config[componentType] = {};
//		}
//		var componentConfig = config[componentType][componentName];
//
//		if (utils.typeOf(componentConfig) != "object") {
//			config[componentType][componentName] = componentConfig = {};
//		}
//
//		if (componentParameter) {
//			if (componentType == "plugins") {
//				var pluginName = utils.getPluginName(componentName);
//				componentConfig[componentParameter] = config[pluginName+"."+componentParameter];
//				delete config[pluginName+"."+componentParameter];
//			} else {
//				componentConfig[componentParameter] = config[componentName+"."+componentParameter];
//				delete config[componentName+"."+componentParameter];
//			}
//		}
//	}
	
//	jwplayer.embed.deserialize = function(config){
//		var pluginNames = getPluginNames(config);
//		
//		for (var pluginId in pluginNames) {
//			addConfigParameter(config, "plugins", pluginNames[pluginId]);
//		}
//		
//		for (var parameter in config) {
//			if (parameter.indexOf(".") > -1) {
//				var path = parameter.split(".");
//				var prefix = path[0];
//				var parameter = path[1];
//
//				if (utils.isInArray(components, prefix)) {
//					addConfigParameter(config, "components", prefix, parameter);
//				} else if (pluginNames[prefix]) {
//					addConfigParameter(config, "plugins", pluginNames[prefix], parameter);
//				}
//			}
//		}
//		return config;
//	}
	
})(jwplayer);
