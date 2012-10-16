/**
 * Embedder for the JW Player
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils,
		events = jwplayer.events,
		
		DOCUMENT = document;
	
	var embed = jwplayer.embed = function(playerApi) {
//		var mediaConfig = utils.mediaparser.parseMedia(playerApi.container);
		var _config = new embed.config(playerApi.config),
			_container, _oldContainer,
			_width = _config.width,
			_height = _config.height,
			_errorText = "Error loading player: ",
			_pluginloader = jwplayer.plugins.loadPlugins(playerApi.id, _config.plugins);

		_config.id = playerApi.id;
		_oldContainer = DOCUMENT.getElementById(playerApi.id);
		_container = DOCUMENT.createElement("div");
		_container.id = _oldContainer.id;
		_container.style.width = _width.toString().indexOf("%") > 0 ? _width : (_width + "px");
		_container.style.height = _height.toString().indexOf("%") > 0 ? _height : (_height + "px");
		_oldContainer.parentNode.replaceChild(_container, _oldContainer);
		
		function _setupEvents(api, events) {
			for (var evt in events) {
				if (typeof api[evt] == "function") {
					(api[evt]).call(api, events[evt]);
				}
			}
		}
		
		function _embedPlayer() {
			if (utils.typeOf(_config.playlist) == "array" && _config.playlist.length < 2) {
				if (_config.playlist.length == 0 || !_config.playlist[0].sources || _config.playlist[0].sources.length == 0) {
					_sourceError();
					return;
				}
			}
			
			if (_pluginloader.getStatus() == utils.loaderstatus.COMPLETE) {
				for (var mode = 0; mode < _config.modes.length; mode++) {
					if (_config.modes[mode].type && embed[_config.modes[mode].type]) {
						var modeconfig = _config.modes[mode].config,
							configClone = utils.extend({}, modeconfig ? embed.config.addConfig(_config, modeconfig) : _config),
							embedder = new embed[_config.modes[mode].type](_container, _config.modes[mode], configClone, _pluginloader, playerApi);

						if (embedder.supportsConfig()) {
							embedder.addEventListener(events.ERROR, _embedError);
							embedder.embed();
							_setupEvents(playerApi, configClone.events);
							return playerApi;
						}
					}
				}
				
				if (_config.fallback) {
					utils.log("No suitable players found and fallback enabled");
					new embed.download(_container, _config, _sourceError);
				} else {
					utils.log("No suitable players found and fallback disabled");
					_replaceContainer();
				}
				
			}
		};
		
		function _replaceContainer() {
			_container.parentNode.replaceChild(_oldContainer, _container);
		}
		
		function _embedError(evt) {
			_errorScreen(_container, _errorText + evt.message);
		}
		
		function _pluginError(evt) {
			_errorScreen(_container, "Could not load plugins: " + evt.message);
		}
		
		function _sourceError() {
			_errorScreen(_container, _errorText  + "No playable sources found");
		}
		
		function _errorScreen(container, message) {
			if (!_config.fallback) return;
				
			var style = container.style;
			style.backgroundColor = "#000";
			style.color = "#FFF";
			style.width = utils.styleDimension(_config.width);
			style.height = utils.styleDimension(_config.height);
			style.display = "table";
			style.opacity = 1;
			
			var text = document.createElement("p"),
				textStyle = text.style;	
			textStyle.verticalAlign = "middle";
			textStyle.textAlign = "center";
			textStyle.display = "table-cell";
			textStyle.font = "15px/20px Arial, Helvetica, sans-serif";
			text.innerHTML = message.replace(":", ":<br>");

			container.innerHTML = "";
			container.appendChild(text);
		}

		// Make this publicly accessible so the HTML5 player can error out on setup using the same code
		jwplayer.embed.errorScreen = _errorScreen;
		
		_pluginloader.addEventListener(events.COMPLETE, _embedPlayer);
		_pluginloader.addEventListener(events.ERROR, _pluginError);
		_pluginloader.load();
		
		return playerApi;
	};
	
})(jwplayer);
