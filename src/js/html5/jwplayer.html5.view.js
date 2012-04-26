/**
 * jwplayer.html5 namespace
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, _utils = _jw.utils,

	DOCUMENT = document, 
	VIEW_CONTAINER_CLASS = "jwplayer", 
	VIEW_VIDEO_CONTAINER_CLASS = "jwvideocontainer", 
	VIEW_CONTROLS_CONTAINER_CLASS = "jwcontrolscontainer";

	html5.view = function(api, model) {
		var _api = api, 
			_model = model, 
			_controls = {}, 
			_container, 
			_videoLayer;

		this.setup = function(skin) {
			_api.skin = skin;
			
			_container = DOCUMENT.getElementById(_api.id);
			_container.className = VIEW_CONTAINER_CLASS;

			_videoLayer = DOCUMENT.createElement("span");
			_videoLayer.className = VIEW_VIDEO_CONTAINER_CLASS;
			_videoLayer.appendChild(_model.getVideo().getTag());

			_controlsLayer = DOCUMENT.createElement("span");
			_controlsLayer.className = VIEW_CONTROLS_CONTAINER_CLASS;
			if (!_utils.isMobile()) {
				_controls.controlbar = new html5.controlbar(_api);
				_controlsLayer.appendChild(_controls.controlbar.getDisplayElement());
			}

			_container.appendChild(_videoLayer);
			_container.appendChild(_controlsLayer);
			
			DOCUMENT.addEventListener('webkitfullscreenchange', _fullscreenChangeHandler, false);
			DOCUMENT.addEventListener('mozfullscreenchange', _fullscreenChangeHandler, false);
			DOCUMENT.addEventListener('keydown', _keyHandler, false);
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
					
					if (_container.requestFullScreen) {
						_container.requestFullScreen();
					} else if (_container.mozRequestFullScreen) {
						_container.mozRequestFullScreen();
					} else if (_container.webkitRequestFullScreenWithKeys) {
						_container.webkitRequestFullScreenWithKeys();
					} else if (_container.webkitRequestFullScreen) {
						_container.webkitRequestFullScreen();
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
		this.resize = function(width, height) {
			// TODO: implement
			return;
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
			return (DOCUMENT.mozFullScreenElement == _container || 
					DOCUMENT.webkitCurrentFullScreenElement == _container);
		}
		
		/**
		 * If the browser enters or exits fullscreen mode (without the view's knowing about it) update the model.
		 **/
		function _fullscreenChangeHandler(evt) {
			_model.setFullscreen(_isNativeFullscreen());
			_fullscreen(_model.fullscreen);
		}

	}

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	// Container styles

	_utils.appendStylesheet('.' + VIEW_VIDEO_CONTAINER_CLASS + ' ,.'+ VIEW_CONTROLS_CONTAINER_CLASS, {
		width : "100%",
		height : "100%",
		display : "inline-block",
		position : "absolute"
	});
	
	_utils.appendStylesheet('.' + VIEW_VIDEO_CONTAINER_CLASS + " video", {
		width : "100%",
		height : "100%",
		background : "#000",
		opacity : 0,
		'-webkit-transition' : 'opacity .15s ease'
	});


	
	// Fullscreen styles
	
	_utils.appendStylesheet('.' + VIEW_CONTAINER_CLASS+':-webkit-full-screen', {
		width: "100% !important",
		height: "100% !important"
	});
	
	_utils.appendStylesheet('.' + VIEW_CONTAINER_CLASS+':-moz-full-screen', {
		width: "100% !important",
		height: "100% !important"
	});
	
	_utils.appendStylesheet('.' + VIEW_CONTAINER_CLASS+'.jwfullscreen', {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		'z-index': 1000,
		position: "fixed !important"
	});
	
})(jwplayer.html5);