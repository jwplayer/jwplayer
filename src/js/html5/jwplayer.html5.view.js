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
		VIEW_CONTAINER_CLASS = "jwplayer", 
		VIEW_VIDEO_CONTAINER_CLASS = "jwvideocontainer", 
		VIEW_CONTROLS_CONTAINER_CLASS = "jwcontrolscontainer",
		VIEW_PLAYLIST_CONTAINER_CLASS = "jwplaylistcontainer";

	html5.view = function(api, model) {
		var _api = api, 
			_model = model, 
			_controls = {},
			_container,
			_controlsLayer,
			_playlistLayer,
			_controlsTimeout=0,
			_timeoutDuration = 2000,
			_videoLayer;

		this.setup = function(skin) {
			_api.skin = skin;
			
			_container = DOCUMENT.createElement("div");
			_container.className = VIEW_CONTAINER_CLASS;
			_container.id = _api.id;
			
			var replace = document.getElementById(_api.id);
			replace.parentNode.replaceChild(_container, replace);

			_videoLayer = DOCUMENT.createElement("span");
			_videoLayer.className = VIEW_VIDEO_CONTAINER_CLASS;
			_videoLayer.appendChild(_model.getVideo().getTag());

			_controlsLayer = DOCUMENT.createElement("span");
			_controlsLayer.className = VIEW_CONTROLS_CONTAINER_CLASS;

			_playlistLayer = DOCUMENT.createElement("span");
			_playlistLayer.className = VIEW_PLAYLIST_CONTAINER_CLASS;

			_setupControls();
			
			_container.appendChild(_videoLayer);
			_container.appendChild(_controlsLayer);
			_container.appendChild(_playlistLayer);
			
			DOCUMENT.addEventListener('webkitfullscreenchange', _fullscreenChangeHandler, false);
			DOCUMENT.addEventListener('mozfullscreenchange', _fullscreenChangeHandler, false);
			DOCUMENT.addEventListener('keydown', _keyHandler, false);
			
			_api.jwAddEventListener(_events.JWPLAYER_PLAYER_STATE, _stateHandler);

			_stateHandler({newstate:_states.IDLE});
			
			_container.addEventListener('mouseout', _fadeControls, false);
			_container.addEventListener('mousemove', function(evt) {
				_showControls();
				clearTimeout(_controlsTimeout);
				_controlsTimeout = setTimeout(_fadeControls, _timeoutDuration);
			}, false);
			
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
				cbSettings = _api.skin.getComponentSettings('controlbar'),
				displaySettings = _api.skin.getComponentSettings('display')
		
			if (height > 40 || height.indexOf("%")) {
				_controls.display = new html5.display(_api, displaySettings);
				_controlsLayer.appendChild(_controls.display.getDisplayElement());
			} else {
				displaySettings.backgroundcolor = 'transparent';
				cbSettings.margin = 0;
			}
			
			if (_model.playlistsize > 0) {
				_controls.playlist = new html5.playlistcomponent(_api, {});
				_playlistLayer.appendChild(_controls.playlist.getDisplayElement());
			}

			_resize(width, height);
			
			_css('#'+_container.id, {
				'background-color': displaySettings.backgroundcolor ? displaySettings.backgroundcolor : 0
			});

			if (!_utils.isMobile()) {
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
					if (_container.requestFullScreen) {
						_container.requestFullScreen();
					} else if (_container.mozRequestFullScreen) {
						_container.mozRequestFullScreen();
					} else if (_container.webkitRequestFullScreen) {
						_container.webkitRequestFullScreen();
					} else {
						_fakeFullscreen(true);
					}
				}
				_model.setFullscreen(true);
			} else {
		    	_fakeFullscreen(false);
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

		/**
		 * Resize the player
		 */
		function _resize(width, height) {
			if (_utils.exists(width) && _utils.exists(height)) {
				_css('#'+_container.id, {
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
			if (_controls.playlist && _model.playlistsize > 0) {
				_controls.playlist.resize(width, height);
				_css('#'+_container.id+' .' + VIEW_PLAYLIST_CONTAINER_CLASS, {
					right: 0,
					width: _model.playlistsize 
				});
				_css('#'+_container.id + ' .' + VIEW_VIDEO_CONTAINER_CLASS + ',#'+_container.id+' .'+ VIEW_CONTROLS_CONTAINER_CLASS, {
					right: _model.playlistsize
				});
			}

			return;
		}
		
		this.resize = _resize;

		this.completeSetup = function() {
			_css('#'+_container.id, {opacity: 1});
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
				_container.className += " jwfullscreen";
			} else {
				_container.className = _container.className.replace(/\s+jwfullscreen/, "");
			}
		}

		/**
		 * Return whether or not we're in native fullscreen
		 */
		function _isNativeFullscreen() {
			if (DOCUMENT.mozFullScreenElement) return DOCUMENT.mozFullScreenElement.id == _container.id; 
			else if (DOCUMENT.webkitCurrentFullScreenElement) return DOCUMENT.webkitCurrentFullScreenElement.id == _container.id; 
			else return false;
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
		function _stateHandler(evt) {
			var vidstyle = {};
			switch(evt.newstate) {
			case _states.PLAYING:
				if (_utils.isIPod) {
					vidstyle.display = "block";
				}
				vidstyle.opacity = 1;
				_css('#'+_container.id+' .'+VIEW_VIDEO_CONTAINER_CLASS, vidstyle);
				_hideControls();
				break;
			case _states.COMPLETED:
			case _states.IDLE:
				if (_utils.isIPod) {
					vidstyle.display = "none";
				}
				vidstyle.opacity = 0;
				_css('#'+_container.id+' .'+VIEW_VIDEO_CONTAINER_CLASS, vidstyle);
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
	}

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	var JW_CSS_SMOOTH_EASE = "opacity .5s ease";

	
	// Container styles
	_css('.' + VIEW_CONTAINER_CLASS, {
		position : "relative",
		overflow: "hidden",
		opacity: 0,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS + ' ,.'+ VIEW_CONTROLS_CONTAINER_CLASS, {
		position : "absolute",
		left: 0,
		right: 0,
		height : "100%",
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS + " video", {
		background : "transparent",
		width : "100%",
		height : "100%"
	});

	_css('.' + VIEW_PLAYLIST_CONTAINER_CLASS, {
		position: "absolute",
		height : "100%"
	});

	
	// Fullscreen styles
	
	_css('.' + VIEW_CONTAINER_CLASS+':-webkit-full-screen', {
		width: "100% !important",
		height: "100% !important"
	});
	
	_css('.' + VIEW_CONTAINER_CLASS+':-moz-full-screen', {
		width: "100% !important",
		height: "100% !important"
	});
	
	_css('.' + VIEW_CONTAINER_CLASS+'.jwfullscreen', {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		'z-index': 1000,
		position: "fixed !important"
	});

	_css('.' + VIEW_CONTAINER_CLASS+' .jwuniform', {
		'background-size': 'contain !important'
	});

	_css('.' + VIEW_CONTAINER_CLASS+' .jwfill', {
		'background-size': 'cover !important'
	});

	_css('.' + VIEW_CONTAINER_CLASS+' .jwexactfit', {
		'background-size': '100% 100% !important'
	});

	_css('.' + VIEW_CONTAINER_CLASS+' .jwnone', {
		'background-size': null
	});

})(jwplayer.html5);