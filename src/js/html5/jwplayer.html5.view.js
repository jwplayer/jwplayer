/**
 * jwplayer.html5 namespace
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, _utils = _jw.utils,

	DOCUMENT = document, 
	VIEW_CONTAINER_CLASS = "jwcontainer", 
	VIEW_VIDEO_CONTAINER_CLASS = "jwvideocontainer", 
	VIEW_CONTROLS_CONTAINER_CLASS = "jwcontrolscontainer";

	html5.view = function(api, model) {
		var _api = api, 
			_model = model, 
			_controls = {}, 
			_container, 
			_videoLayer;

		
		function _init() {
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
					} else if (_container.webkitRequestFullScreenWithKeys) {
						_container.webkitRequestFullScreenWithKeys();
					} else if (_container.webkitRequestFullScreen) {
						_container.webkitRequestFullScreen();
					} else {
						_fakeFullscreen(true);
					}
				}
				_model.setFullscreen(true);
			} else {
			    if (DOCUMENT.cancelFullScreen) {  
			    	DOCUMENT.cancelFullScreen();  
			    } else if (DOCUMENT.mozCancelFullScreen) {  
			    	DOCUMENT.mozCancelFullScreen();  
			    } else if (DOCUMENT.webkitCancelFullScreen) {  
			    	DOCUMENT.webkitCancelFullScreen();  
			    } else {
			    	_fakeFullscreen(false);
			    }
				
				_model.setFullscreen(false);
			}
		}

		function _keyHandler(evt) {
			switch (evt.keyCode) {
			// ESC key
			case 27:
				if (_model.fullscreen) {
					_fullscreen(false);
				}
				break;
			}
		}
		
		function _fakeFullscreen(state) {
			if (state) {
				_container.className += " jwfullscreen";
			} else {
				_container.className = _container.className.replace(/\s+jwfullscreen/, "");
			}
		}
		
		function _fullscreenChangeHandler(evt) {
			_model.setFullscreen(DOCUMENT.mozFullScreenElement == _container || 
					DOCUMENT.webkitCurrentFullScreenElement == _container);
		}

		_init();
	}

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
		position: "fixed !important"
	});
	
	
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

})(jwplayer.html5);