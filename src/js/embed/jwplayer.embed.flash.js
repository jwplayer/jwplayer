/**
 * Flash mode embedder the JW Player
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils, 
		events = jwplayer.events,
		storedFlashvars = {};

	var _flash = jwplayer.embed.flash = function(_container, _player, _options, _loader, _api) {
		var _eventDispatcher = new jwplayer.events.eventdispatcher(),
			_flashVersion = utils.flashVersion();
		utils.extend(this, _eventDispatcher);
		
		
		function appendAttribute(object, name, value) {
			var param = document.createElement('param');
			param.setAttribute('name', name);
			param.setAttribute('value', value);
			object.appendChild(param);
		};
		
		function _resizePlugin(plugin, div, onready) {
			return function(evt) {
				try {
					if (onready) {
						document.getElementById(_api.id+"_wrapper").appendChild(div);
					}
					var display = document.getElementById(_api.id).getPluginConfig("display");
					if (typeof plugin.resize == "function") {
						plugin.resize(display.width, display.height);
					}
					div.style.left = display.x;
					div.style.top = display.h;
				} catch (e) {}
			}
		}
		
		
		function parseComponents(componentBlock) {
			if (!componentBlock) {
				return {};
			}
			
			var flat = {};
			
			for (var component in componentBlock) {
				var componentConfig = componentBlock[component];
				for (var param in componentConfig) {
					flat[component + '.' + param] = componentConfig[param];
				}
			}
			
			return flat;
		};
		
		function parsePlugins(pluginBlock) {
			if (!pluginBlock) {
				return {};
			}
			
			var flat = {}, pluginKeys = [];
			
			for (var plugin in pluginBlock) {
				var pluginName = utils.getPluginName(plugin);
				var pluginConfig = pluginBlock[plugin];
				pluginKeys.push(plugin);
				for (var param in pluginConfig) {
					flat[pluginName + '.' + param] = pluginConfig[param];
				}
			}
			flat.plugins = pluginKeys.join(',');
			return flat;
		};
		
		/**function jsonToFlashvars(json) {
			var flashvars = [];
			for (var key in json) {
				if (typeof(json[key]) == "object") {
					flashvars += key + '=' + encodeURIComponent("[[JSON]]"+utils.jsonToString(json[key])) + '&';
				} else {
					flashvars += key + '=' + encodeURIComponent(json[key]) + '&';
				}
			}
			return flashvars.substring(0, flashvars.length - 1);
		}**/

		function stringify(json) {
			var flashvars = {};
			for (var key in json) {
				if (typeof(json[key]) == "object") {
					flashvars[key] = "[[JSON]]"+utils.jsonToString(json[key]);
				} else {
					flashvars[key] = json[key];
				}
			}
			return flashvars;
		}

		this.embed = function() {		
			// Make sure we're passing the correct ID into Flash for Linux API support
			_options.id = _api.id;
			
			// If Flash is installed, but the version is too low, display an error.
			if (_flashVersion < 10) {
				_eventDispatcher.sendEvent(events.ERROR, {message:"Flash version must be 10.0 or greater"});
				return false;
			}
			
			var _wrapper;
			
			var params = utils.extend({}, _options);
			
			// Hack for when adding / removing happens too quickly
			if (_container.id + "_wrapper" == _container.parentNode.id) {
				_wrapper = document.getElementById(_container.id + "_wrapper");
			} else {
				_wrapper = document.createElement("div");
				_wrapper.id = _container.id + "_wrapper";
				_wrapper.style.position = "relative";
				_wrapper.style.width = utils.styleDimension(params.width);
				_wrapper.style.height= utils.styleDimension(params.height);
				_container.parentNode.replaceChild(_wrapper, _container);
				_wrapper.appendChild(_container);
			}
			
			var flashPlugins = _loader.setupPlugins(_api, params, _resizePlugin);
			
			if (flashPlugins.length > 0) {
				utils.extend(params, parsePlugins(flashPlugins.plugins));
			} else {
				delete params.plugins;
			}

			// Hack for the dock
			if (typeof params["dock.position"] != "undefined"){
				if (params["dock.position"].toString().toLowerCase() == "false") {
					params["dock"] = params["dock.position"];
					delete params["dock.position"];					
				}
			}
			
			// If we've set any cookies in HTML5 mode, bring them into flash
			var cookies = utils.getCookies();
			for (var cookie in cookies) {
				if (typeof(params[cookie])=="undefined") {
					params[cookie] = cookies[cookie];
				}
			}
			
			var bgcolor = "#000000",
				flashPlayer, //flashvars,
				wmode = params.wmode ? params.wmode : (params.height && params.height <= 40 ? "transparent" : "opaque"),
				toDelete = ["height", "width", "modes", "events", "primary", "base", "fallback"];
			
			for (var i = 0; i < toDelete.length; i++) {
				delete params[toDelete[i]];
			}
			
			var base = window.location.pathname.split("/");
			base.splice(base.length-1, 1);
			base = base.join("/");
			params.base = base + "/";
			
			
			//flashvars = jsonToFlashvars(params);
			// TODO: add ability to pass in JSON directly instead of going to/from a string
			storedFlashvars[_container.id] = stringify(params);

			if (utils.isIE()) {
				var html = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ' +
				'" width="100%" height="100%" ' +
				'id="' +
				_container.id +
				'" name="' +
				_container.id +
				'" tabindex=0"' +
				'">';
				html += '<param name="movie" value="' + _player.src + '">';
				html += '<param name="allowfullscreen" value="true">';
				html += '<param name="allowscriptaccess" value="always">';
				html += '<param name="seamlesstabbing" value="true">';
				html += '<param name="wmode" value="' + wmode + '">';
				html += '<param name="bgcolor" value="' + bgcolor + '">';
				html += '</object>';

				_container.outerHTML = html;
								
				flashPlayer = document.getElementById(_container.id);
			} else {
				var obj = document.createElement('object');
				obj.setAttribute('type', 'application/x-shockwave-flash');
				obj.setAttribute('data', _player.src);
				obj.setAttribute('width', "100%");
				obj.setAttribute('height', "100%");
				obj.setAttribute('bgcolor', bgcolor);
				obj.setAttribute('id', _container.id);
				obj.setAttribute('name', _container.id);
				obj.setAttribute('tabindex', 0);
				appendAttribute(obj, 'allowfullscreen', 'true');
				appendAttribute(obj, 'allowscriptaccess', 'always');
				appendAttribute(obj, 'seamlesstabbing', 'true');
				appendAttribute(obj, 'wmode', wmode);
				
				_container.parentNode.replaceChild(obj, _container);
				flashPlayer = obj;
			}
			
			_api.container = flashPlayer;
			_api.setPlayer(flashPlayer, "flash");
		}
		/**
		 * Detects whether Flash supports this configuration
		 */
		this.supportsConfig = function() {
			if (_flashVersion) {
				if (_options) {
					try {
						var item = _options.playlist[0],
							sources = item.sources;
						
						if (typeof sources == "undefined") {
							return true;
						} else {
							for (var i = 0; i < sources.length; i++) {
								if (sources[i].file && _flashCanPlay(sources[i].file, sources[i].type)) {
									return true;
								}
							}
						}
					} catch (e) {
						return false;
					}
				} else {
					return true;
				}
			}
			return false;
		}
		
		/**
		 * Determines if a Flash can play a particular file, based on its extension
		 */
		function _flashCanPlay(file, type) {
			if (utils.isYouTube(file)) return true;
			if (utils.isRtmp(file,type)) return true;
			if (type == "hls") return true;

			var mappedType = utils.extensionmap[type ? type : utils.extension(file)];
			
			// If no type or unrecognized type, don't allow to play
			if (!mappedType) {
				return false;
			}

			return !!(mappedType.flash);
		}
	}
	
	_flash.getVars = function(id) {
		return storedFlashvars[id];		
	}
	
})(jwplayer);
