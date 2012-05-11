/**
 * Configuration for the JW Player Embedder
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils;

	function _playerDefaults(primary, base, html5player, flashplayer) {
		var modes = {
			html5: {
				type: "html5",
				src: html5player ? html5player: base + "jwplayer.html5.js"
			}, 
			flash: {
				type: "flash",
				src: flashplayer ? flashplayer : base + "jwplayer.flash.swf" 
			}
		}
		if (primary == "html5") {
			return [modes.html5, modes.flash];
		} else {
			return [modes.flash, modes.html5];
		}
	}

	jwplayer.embed.config = function(config) {
		var _defaults = {
				fallback: true,
				height: 300,
				primary: "html5",
				width: 400,
				base: undefined
			},
			parsedConfig = utils.extend(_defaults, config);

		if (!parsedConfig.base) {
			parsedConfig.base = utils.getScriptPath("jwplayer.js");
		}
		
		if (!parsedConfig.modes) {
			parsedConfig.modes = _playerDefaults(
					parsedConfig.primary,
					parsedConfig.base, 
					parsedConfig.html5player, 
					parsedConfig.flashplayer);
		}
		
		return parsedConfig;
	};
	

	
	
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
