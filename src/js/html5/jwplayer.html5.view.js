/**
 * jwplayer.html5 namespace
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, 
		_utils = _jw.utils, 
		_css = _utils.css, 
		_events = jwplayer.events, 
		_states = _events.state,

		DOCUMENT = document, 
		PLAYER_CLASS = "jwplayer", 
		FULLSCREEN_SELECTOR = "."+PLAYER_CLASS+".jwfullscreen",
		VIEW_MAIN_CONTAINER_CLASS = "jwmain",
		VIEW_INSTREAM_CONTAINER_CLASS = "jwinstream",
		VIEW_VIDEO_CONTAINER_CLASS = "jwvideo", 
		VIEW_CONTROLS_CONTAINER_CLASS = "jwcontrols",
		VIEW_PLAYLIST_CONTAINER_CLASS = "jwplaylist";
		
	html5.view = function(api, model) {
		var _api = api, 
			_model = model, 
			_controls = {},
			_playerElement,
			_container,
			_controlsLayer,
			_playlistLayer,
			_controlsTimeout=0,
			_timeoutDuration = 2000,
			_videoLayer,
			_instreamLayer;

		this.setup = function(skin) {
			_api.skin = skin;
			
			_playerElement = _createElement("div", PLAYER_CLASS);
			_playerElement.id = _api.id;
			
			var replace = document.getElementById(_api.id);
			replace.parentNode.replaceChild(_playerElement, replace);
			
			_container = _createElement("span", VIEW_MAIN_CONTAINER_CLASS);
			_videoLayer = _createElement("span", VIEW_VIDEO_CONTAINER_CLASS);
			_videoLayer.appendChild(_model.getVideo().getTag());
			_controlsLayer = _createElement("span", VIEW_CONTROLS_CONTAINER_CLASS);
			_instreamLayer = _createElement("span", VIEW_INSTREAM_CONTAINER_CLASS);
			_playlistLayer = _createElement("span", VIEW_PLAYLIST_CONTAINER_CLASS);

			_setupControls();
			
			_container.appendChild(_videoLayer);
			_container.appendChild(_controlsLayer);
			_container.appendChild(_instreamLayer);
			_playerElement.appendChild(_container);
			_playerElement.appendChild(_playlistLayer);
			
			DOCUMENT.addEventListener('webkitfullscreenchange', _fullscreenChangeHandler, false);
			DOCUMENT.addEventListener('mozfullscreenchange', _fullscreenChangeHandler, false);
			DOCUMENT.addEventListener('keydown', _keyHandler, false);
			
			_api.jwAddEventListener(_events.JWPLAYER_PLAYER_STATE, _stateHandler);

			_stateHandler({newstate:_states.IDLE});
			
			_playerElement.addEventListener('mouseout', _fadeControls, false);
			_playerElement.addEventListener('mousemove', function(evt) {
				_showControls();
				clearTimeout(_controlsTimeout);
				_controlsTimeout = setTimeout(_fadeControls, _timeoutDuration);
			}, false);
			
		}
	
		function _createElement(elem, className) {
			var newElement = DOCUMENT.createElement(elem);
			if (className) newElement.className = className;
			return newElement;
		}
		
		function _fadeControls() {
			if (_api.jwGetState() == _states.PLAYING) {
				_hideControls();
			}
			clearTimeout(_controlsTimeout);
			_controlsTimeout = 0;
		}
		
		function _setupControls() {
			var width = _model.width,
				height = _model.height,
				cbSettings = _model.componentConfig('controlbar');
				displaySettings = _model.componentConfig('display');
		
			if (height > 40 || height.indexOf("%")) {
				_controls.display = new html5.display(_api, displaySettings);
				_controlsLayer.appendChild(_controls.display.getDisplayElement());
				displaySettings.backgroundcolor = _controls.display.getBGColor();
			} else {
				displaySettings.backgroundcolor = 'transparent';
				cbSettings.margin = 0;
			}
			_css(_internalSelector(), {
				'background-color': displaySettings.backgroundcolor
			});
			
			if (_model.playlistsize > 0 && _model.playlistposition && _model.playlistposition != "none") {
				_controls.playlist = new html5.playlistcomponent(_api, {});
				_playlistLayer.appendChild(_controls.playlist.getDisplayElement());
			}

			_resize(width, height);

			if (!_utils.isMobile()) {
				// TODO: allow override for showing HTML controlbar on iPads
				_controls.controlbar = new html5.controlbar(_api, cbSettings);
				_controlsLayer.appendChild(_controls.controlbar.getDisplayElement());
			}
		}

		/** 
		 * Switch to fullscreen mode.  If a native fullscreen method is available in the browser, use that.  
		 * Otherwise, use the false fullscreen method using CSS. 
		 **/
		var _fullscreen = this.fullscreen = function(state) {
			if (!_utils.exists(state)) {
				state = !_model.fullscreen;
			}

			if (state) {
				if (!_model.fullscreen) {
					_fakeFullscreen(true);
					if (_playerElement.requestFullScreen) {
						_playerElement.requestFullScreen();
					} else if (_playerElement.mozRequestFullScreen) {
						_playerElement.mozRequestFullScreen();
					} else if (_playerElement.webkitRequestFullScreen) {
						_playerElement.webkitRequestFullScreen();
					}
					_model.setFullscreen(true);
				}
			} else {
		    	_fakeFullscreen(false);
				if (_model.fullscreen) {
				    if (DOCUMENT.cancelFullScreen) {  
				    	DOCUMENT.cancelFullScreen();  
				    } else if (DOCUMENT.mozCancelFullScreen) {  
				    	DOCUMENT.mozCancelFullScreen();  
				    } else if (DOCUMENT.webkitCancelFullScreen) {  
				    	DOCUMENT.webkitCancelFullScreen();  
				    }
					_model.setFullscreen(false);
				}
			}
		}

		/**
		 * Resize the player
		 */
		function _resize(width, height) {
			if (_utils.exists(width) && _utils.exists(height)) {
				_css(_internalSelector(), {
					width: width,
					height: height
				});
				_model.width = width;
				_model.height = height;
			}

			if (_controls.display) {
				_controls.display.resize(width, height);
			}
			if (_controls.controlbar) {
				_controls.controlbar.resize(width, height);
			}
			var playlistSize = _model.playlistsize,
				playlistPos = _model.playlistposition
			
			if (_controls.playlist && playlistSize > 0 && playlistPos) {
				_controls.playlist.resize(width, height);
				
				var playlistStyle = { display: "block" }, containerStyle = {};
				playlistStyle[playlistPos] = 0;
				containerStyle[playlistPos] = playlistSize;
				
				if (playlistPos == "left" || playlistPos == "right") {
					playlistStyle.width = playlistSize;
				} else {
					playlistStyle.height = playlistSize;
				}
				
				_css(_internalSelector(VIEW_PLAYLIST_CONTAINER_CLASS), playlistStyle);
				_css(_internalSelector(VIEW_MAIN_CONTAINER_CLASS), containerStyle);
			}

			return;
		}
		
		this.resize = _resize;

		this.completeSetup = function() {
			_css(_internalSelector(), {opacity: 1});
		}
		
		/**
		 * Listen for keystrokes.  Currently only ESC is recognized, to switch out of fullscreen mode.
		 **/
		function _keyHandler(evt) {
			switch (evt.keyCode) {
			// ESC
			case 27:
				if (_model.fullscreen) {
					_fullscreen(false);
				}
				break;
			// SPACE
			case 32:
				_api.jwPlay()
				break;
			}
		}
		
		/**
		 * False fullscreen mode. This is used for browsers without full support for HTML5 fullscreen.
		 * This method sets the CSS of the container element to a fixed position with 100% width and height.
		 */
		function _fakeFullscreen(state) {
			if (state) {
				_playerElement.className += " jwfullscreen";
			} else {
				_playerElement.className = _playerElement.className.replace(/\s+jwfullscreen/, "");
			}
		}

		/**
		 * Return whether or not we're in native fullscreen
		 */
		function _isNativeFullscreen() {
			var fsElements = [DOCUMENT.mozFullScreenElement, DOCUMENT.webkitCurrentFullScreenElement];
			for (var i=0; i<fsElements.length; i++) {
				if (fsElements[i] && fsElements[i].id == _api.id)
					return true;
			}
			return false;
		}
		
		/**
		 * If the browser enters or exits fullscreen mode (without the view's knowing about it) update the model.
		 **/
		function _fullscreenChangeHandler(evt) {
			_model.setFullscreen(_isNativeFullscreen());
			_fullscreen(_model.fullscreen);
		}

		function _hideControls() {
			if (_controls.controlbar) _controls.controlbar.hide();
			if (_controls.display) _controls.display.hide();
		}

		function _showControls() {
			if (_controls.controlbar) _controls.controlbar.show();
			if (_controls.display) _controls.display.show();
		}

		/**
		 * Player state handler
		 */
		var _stateTimeout;
		
		function _stateHandler(evt) {
			clearTimeout(_stateTimeout);
			_stateTimeout = setTimeout(function() {
				_updateState(evt.newstate);
			}, 100);
		}
		
		function _updateState(state) {
			var vidstyle = {};
			switch(state) {
			case _states.PLAYING:
				if (_utils.isIPod()) {
					vidstyle.display = "block";
				}
				vidstyle.opacity = 1;
				_css(_internalSelector(VIEW_VIDEO_CONTAINER_CLASS), vidstyle);
				_hideControls();
				break;
			case _states.COMPLETED:
			case _states.IDLE:
				if (_utils.isIPod()) {
					vidstyle.display = "none";
				}
				vidstyle.opacity = 0;
				_css(_internalSelector(VIEW_VIDEO_CONTAINER_CLASS), vidstyle);
				_showControls();
				break;
			case _states.BUFFERING:
			case _states.PAUSED:
				if (!_utils.isMobile()) {
					_showControls();
				}
				break;
			}
		}
		
		function _internalSelector(className) {
			return '#' + _api.id + (className ? " ." + className : "");
		}
		
		this.setupInstream = function(instreamDisplay, instreamVideo) {
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), true);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), false);
			_instreamLayer.appendChild(instreamDisplay);
			_instreamVideo = instreamVideo;
			_stateHandler({newstate:_states.PLAYING});
			_instreamMode = true;
		}
		
		var _destroyInstream = this.destroyInstream = function() {
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), false);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), true);
			_instreamLayer.innerHTML = "";
			_instreamVideo = null;
			_instreamMode = false;
			_resize(_model.width, _model.height);
		}
		
		function _setVisibility(selector, state) {
			_css(selector, { display: state ? "block" : "none" });
		}

		
	}

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	var JW_CSS_SMOOTH_EASE = "opacity .5s ease",
		JW_CSS_100PCT = "100%",
		//JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_IMPORTANT = " !important";

	
	// Container styles
	_css('.' + PLAYER_CLASS, {
		position: "relative",
		overflow: "hidden",
		opacity: 0,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_MAIN_CONTAINER_CLASS, {
		position : JW_CSS_ABSOLUTE,
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS + ' ,.'+ VIEW_CONTROLS_CONTAINER_CLASS, {
		position : JW_CSS_ABSOLUTE,
		height : JW_CSS_100PCT,
		width: JW_CSS_100PCT,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS + " video", {
		background : "transparent",
		width : JW_CSS_100PCT,
		height : JW_CSS_100PCT
	});

	_css('.' + VIEW_PLAYLIST_CONTAINER_CLASS, {
		position: JW_CSS_ABSOLUTE,
		height : JW_CSS_100PCT,
		width: JW_CSS_100PCT,
		display: "none"
	});
	
	_css('.' + VIEW_INSTREAM_CONTAINER_CLASS, {
		overflow: "hidden",
		position: JW_CSS_ABSOLUTE,
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		display: 'none'
	});

	

	// Fullscreen styles
	
	_css(FULLSCREEN_SELECTOR, {
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		'z-index': 1000,
		position: "fixed"
	}, true);

	_css(FULLSCREEN_SELECTOR + ' .'+ VIEW_MAIN_CONTAINER_CLASS, {
		left: 0, 
		right: 0,
		top: 0,
		bottom: 0
	}, true);

	_css(FULLSCREEN_SELECTOR + ' .'+ VIEW_PLAYLIST_CONTAINER_CLASS, {
		display: "none"
	}, true);
	
	_css('.' + PLAYER_CLASS+' .jwuniform', {
		'background-size': 'contain' + JW_CSS_IMPORTANT
	});

	_css('.' + PLAYER_CLASS+' .jwfill', {
		'background-size': 'cover' + JW_CSS_IMPORTANT
	});

	_css('.' + PLAYER_CLASS+' .jwexactfit', {
		'background-size': JW_CSS_100PCT + JW_CSS_IMPORTANT
	});

	_css('.' + PLAYER_CLASS+' .jwnone', {
		'background-size': null
	});

})(jwplayer.html5);