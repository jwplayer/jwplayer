/**
 * Embedder for the JW Player
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils,
		events = jwplayer.events,
		
		TRUE = true,
		FALSE = false,
		DOCUMENT = document;
	
	var embed = jwplayer.embed = function(playerApi) {
//		var mediaConfig = utils.mediaparser.parseMedia(playerApi.container);
		var _config = new embed.config(playerApi.config),
			_container, _oldContainer, _fallbackDiv,
			_width = _config.width,
			_height = _config.height,
			_errorText = "Error loading player: ",
			_pluginloader = jwplayer.plugins.loadPlugins(playerApi.id, _config.plugins),
			_playlistLoading = FALSE,
			_errorOccurred = FALSE,
			_setupErrorTimer = null,
			_this = this;

		if (_config.fallbackDiv) {
			_fallbackDiv = _config.fallbackDiv;
			delete _config.fallbackDiv;
		}
		_config.id = playerApi.id;
		_oldContainer = DOCUMENT.getElementById(playerApi.id);
		if (_config.aspectratio) {
			playerApi.config.aspectratio = _config.aspectratio;
		}
		else {
			delete playerApi.config.aspectratio;
		}
		_container = DOCUMENT.createElement("div");
		_container.id = _oldContainer.id;
		_container.style.width = _width.toString().indexOf("%") > 0 ? _width : (_width + "px");
		_container.style.height = _height.toString().indexOf("%") > 0 ? _height : (_height + "px");
		_oldContainer.parentNode.replaceChild(_container, _oldContainer);
		
		function _setupEvents(api, events) {
			utils.foreach(events, function(evt, val) {
				if (typeof api[evt] == "function") {
					(api[evt]).call(api, val);
				}
			});
		}
		
		_this.embed = function() {
			if (_errorOccurred) return;

			_pluginloader.addEventListener(events.COMPLETE, _doEmbed);
			_pluginloader.addEventListener(events.ERROR, _pluginError);
			_pluginloader.load();
		};
		
		function _doEmbed() {
			if (_errorOccurred) return;

			if (utils.typeOf(_config.playlist) == "array" && _config.playlist.length < 2) {
				if (_config.playlist.length === 0 || !_config.playlist[0].sources || _config.playlist[0].sources.length === 0) {
					_sourceError();
					return;
				}
			}
			
			if (_playlistLoading) return;
			
			if (utils.typeOf(_config.playlist) == "string") {
				var loader = new jwplayer.playlist.loader();
				loader.addEventListener(events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
					_config.playlist = evt.playlist;
					_playlistLoading = FALSE;
					_doEmbed();
				});
				loader.addEventListener(events.JWPLAYER_ERROR, function(evt) {
					_playlistLoading = FALSE;
					_sourceError(evt);
				});
				_playlistLoading = TRUE;
				loader.load(_config.playlist);
				return;
			}

			if (_pluginloader.getStatus() == utils.loaderstatus.COMPLETE) {
				for (var mode = 0; mode < _config.modes.length; mode++) {
					if (_config.modes[mode].type && embed[_config.modes[mode].type]) {
						var configClone = utils.extend({}, _config),
							embedder = new embed[_config.modes[mode].type](_container, _config.modes[mode], configClone, _pluginloader, playerApi);

						if (embedder.supportsConfig()) {
							embedder.addEventListener(events.ERROR, _embedError);
							embedder.embed();
							_setupEvents(playerApi, configClone.events);
							return playerApi;
						}
					}
				}
				var message;
				if (_config.fallback) {
					message = "No suitable players found and fallback enabled";
					_setupErrorTimer = setTimeout(function() {
						_dispatchSetupError(message, TRUE);
					}, 10);
					utils.log(message);
					new embed.download(_container, _config, _sourceError);
				} else {
					message = "No suitable players found and fallback disabled";
					_dispatchSetupError(message, FALSE);
					utils.log(message);
					_replaceContainer();
				}
				
			}
		}
		
		function _replaceContainer() {
			_container.parentNode.replaceChild(_fallbackDiv, _container);
		}
		
		function _embedError(evt) {
			_errorScreen(_errorText + evt.message);
		}
		
		function _pluginError(evt) {
			//_errorScreen("Could not load plugins: " + evt.message);
			playerApi.dispatchEvent(events.JWPLAYER_ERROR, {
				message: "Could not load plugin: " + evt.message
			});
		}
		
		function _sourceError(evt) {
			if (evt && evt.message) {
				_errorScreen("Error loading playlist: " + evt.message);
			} else {
				_errorScreen(_errorText  + "No playable sources found");
			}
		}

		function _dispatchSetupError(message, fallback) {
			if (_setupErrorTimer) {
				clearTimeout(_setupErrorTimer);
				_setupErrorTimer = null;
			}
			_setupErrorTimer = setTimeout(function() {
				_setupErrorTimer = null;
				playerApi.dispatchEvent(events.JWPLAYER_SETUP_ERROR, {message: message, fallback: fallback});
			}, 0);
		}	

		function _errorScreen(message) {
			if (_errorOccurred) return;

			if (!_config.fallback) {
				_dispatchSetupError(message, FALSE);
				return;
			}

			_errorOccurred = TRUE;
			_displayError(_container, message, _config);
			_dispatchSetupError(message, TRUE);
		}
		
		_this.errorScreen = _errorScreen;
		
		return _this;
	};

	function _displayError(container, message, config) {
		var style = container.style;
		style.backgroundColor = "#000";
		style.color = "#FFF";
		style.width = utils.styleDimension(config.width);
		style.height = utils.styleDimension(config.height);
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
	jwplayer.embed.errorScreen = _displayError;
	
})(jwplayer);
