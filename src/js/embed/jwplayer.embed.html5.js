/**
 * HTML5 mode embedder for the JW Player
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils, extensionmap = utils.extensionmap, events = jwplayer.events;

	jwplayer.embed.html5 = function(_container, _player, _options, _loader, _api) {
		var _this = this,
			_eventdispatcher = new events.eventdispatcher();
		
		utils.extend(_this, _eventdispatcher);
		
		
		function _resizePlugin (plugin, div, onready) {
			return function(evt) {
				try {
					var displayarea = document.querySelector("#" + _container.id + " .jwmain");
					if (onready) {
						displayarea.appendChild(div);
					}
					if (typeof plugin.resize == "function") {
						plugin.resize(displayarea.clientWidth, displayarea.clientHeight);
						setTimeout(function () {
							plugin.resize(displayarea.clientWidth, displayarea.clientHeight);
						}, 400);
					}
					div.left = displayarea.style.left;
					div.top = displayarea.style.top;
				} catch(e) {}
			}
		}
		
		_this.embed = function() {
			if (jwplayer.html5) {
				_loader.setupPlugins(_api, _options, _resizePlugin);
				_container.innerHTML = "";
				var playerOptions = jwplayer.utils.extend({}, _options);
//				var toDelete = ["plugins", "modes", "events"];
//				
//				for (var i = 0; i < toDelete.length; i++){
//					delete playerOptions[toDelete[i]];
//				}

				var html5player = new jwplayer.html5.player(playerOptions);
				_api.container = document.getElementById(_api.id);
				_api.setPlayer(html5player, "html5");
			} else {
				var scriptLoader = new utils.scriptloader(_player.src);
				scriptLoader.addEventListener(events.ERROR, _loadError);
				scriptLoader.addEventListener(events.COMPLETE, _this.embed);
				scriptLoader.load();
			}
		}
		
		function _loadError(evt) {
			_this.sendEvent(evt.type, {message: "HTML5 player not found"});
		}
		
		/**
		 * Detects whether the html5 player supports this configuration.
		 *
		 * @return {Boolean}
		 */
		_this.supportsConfig = function() {
			if (!!jwplayer.vid.canPlayType) {
				try {
					if (utils.typeOf(_options.playlist) == "string") {
						return true;
					} else {
						var sources = _options.playlist[0].sources;
						for (var i=0; i<sources.length; i++) {
							var file = sources[i].file,
								type = sources[i].type;
							
							if (_html5CanPlay(file, type)) {
								return true;
							}
						}
					}
				} catch(e) {
					return false;
				}
//				if (_options) {
//					var item = jwplayer.utils.getFirstPlaylistItemFromConfig(_options);
//					if (typeof item.file == "undefined" && typeof item.levels == "undefined") {
//						return true;
//					} else if (item.file) {
//						return html5CanPlay(jwplayer.vid, item.file, item.provider, item.playlistfile);
//					} else if (item.levels && item.levels.length) {
//						for (var i = 0; i < item.levels.length; i++) {
//							if (item.levels[i].file && html5CanPlay(jwplayer.vid, item.levels[i].file, item.provider, item.playlistfile)) {
//								return true;
//							}
//						}
//					}
//				} else {
//					return true;
//				}
			}
			
			return false;
		}
		
		/**
		 * Determines if a video element can play a particular file, based on its extension
		 * @param {Object} file
		 * @param {Object} type
		 * @return {Boolean}
		 */
		function _html5CanPlay(file, type) {
			// HTML5 playback is not sufficiently supported on Blackberry devices; should fail over automatically.
			if(navigator.userAgent.match(/BlackBerry/i) !== null) { return false; }

			// Ensure RTMP files are not seen as videos
			if (utils.isRtmp(file,type)) return false;

			var mappedType = extensionmap[type ? type : utils.extension(file)];
			
			// If no type or unrecognized type, don't allow to play
			if (!mappedType) {
				return false;
			}
			
			// Extension is recognized as a format Flash can play, but no HTML5 support is listed  
			if (mappedType.flash && !mappedType.html5) {
				return false;
			}
			
			// Last, but not least, we ask the browser 
			// (But only if it's a video with an extension known to work in HTML5)
			return _browserCanPlay(mappedType.html5);
		};
		
		/**
		 * 
		 * @param {DOMMediaElement} video
		 * @param {String} mimetype
		 * @return {Boolean}
		 */
		function _browserCanPlay(mimetype) {
			var video = jwplayer.vid;

			// OK to use HTML5 with no extension
			if (!mimetype) {
				return true;
			}

			try {
				if (video.canPlayType(mimetype)) {
					return true;
				} else {
					return false;
				}
			} catch(e) {
				return false;
			}
			
		}
	};
	
})(jwplayer);
