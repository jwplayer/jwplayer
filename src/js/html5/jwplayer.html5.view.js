/**
 * jwplayer.html5 namespace
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var jw = jwplayer, 
		utils = jw.utils, 
		events = jwplayer.events, 
		states = events.state,
		_css = utils.css, 

		DOCUMENT = document, 
		PLAYER_CLASS = "jwplayer", 
		FULLSCREEN_SELECTOR = "."+PLAYER_CLASS+".jwfullscreen",
		VIEW_MAIN_CONTAINER_CLASS = "jwmain",
		VIEW_INSTREAM_CONTAINER_CLASS = "jwinstream",
		VIEW_VIDEO_CONTAINER_CLASS = "jwvideo", 
		VIEW_CONTROLS_CONTAINER_CLASS = "jwcontrols",
		VIEW_PLAYLIST_CONTAINER_CLASS = "jwplaylistcontainer",
		
		/*************************************************************
		 * Player stylesheets - done once on script initialization;  *
		 * These CSS rules are used for all JW Player instances      *
		 *************************************************************/

		JW_CSS_SMOOTH_EASE = "opacity .5s ease",
		JW_CSS_100PCT = "100%",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_IMPORTANT = " !important",
		JW_CSS_HIDDEN = "hidden";

	html5.view = function(api, model) {
		var _api = api, 
			_model = model, 
			_playerElement,
			_container,
			_controlsLayer,
			_playlistLayer,
			_controlsTimeout=0,
			_timeoutDuration = 2000,
			_videoTag,
			_videoLayer,
			_instreamLayer,
			_controlbar,
			_display,
			_dock,
			_playlist,
			_audioMode,
			_isMobile = utils.isMobile(),
			_isIPad = utils.isIPad(),
			_forcedControls = (_model.mobilecontrols),
			_replayState,
			_eventDispatcher = new events.eventdispatcher();
		
		utils.extend(this, _eventDispatcher);

		function _init() {
			_playerElement = _createElement("div", PLAYER_CLASS);
			_playerElement.id = _api.id;
			
			var replace = document.getElementById(_api.id);
			replace.parentNode.replaceChild(_playerElement, replace);
		}
		
		this.setup = function(skin) {
			_api.skin = skin;
			
			_container = _createElement("span", VIEW_MAIN_CONTAINER_CLASS);
			_videoLayer = _createElement("span", VIEW_VIDEO_CONTAINER_CLASS);
			
			_videoTag = _model.getVideo().getTag();
			_videoLayer.appendChild(_videoTag);
			_controlsLayer = _createElement("span", VIEW_CONTROLS_CONTAINER_CLASS);
			_instreamLayer = _createElement("span", VIEW_INSTREAM_CONTAINER_CLASS);
			_playlistLayer = _createElement("span", VIEW_PLAYLIST_CONTAINER_CLASS);

			_setupControls();
			
			_container.appendChild(_videoLayer);
			_container.appendChild(_controlsLayer);
			_container.appendChild(_instreamLayer);
			
			var newContainer = _createElement("div");
			newContainer.style.position="absolute";
			newContainer.style.width="100%";
			newContainer.style.height="100%";
			newContainer.appendChild(_container);
			newContainer.appendChild(_playlistLayer);
			_playerElement.appendChild(newContainer);
			
			DOCUMENT.addEventListener('webkitfullscreenchange', _fullscreenChangeHandler, false);
			DOCUMENT.addEventListener('mozfullscreenchange', _fullscreenChangeHandler, false);
			DOCUMENT.addEventListener('keydown', _keyHandler, false);
			
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_COMPLETE, _playlistCompleteHandler);

			_stateHandler({newstate:states.IDLE});
			
			_controlsLayer.addEventListener('mouseout', _fadeControls, false);
			_controlsLayer.addEventListener('mousemove', _startFade, false);
			if (_controlbar) {
				_controlbar.getDisplayElement().addEventListener('mousemove', _cancelFade, false);
				_controlbar.getDisplayElement().addEventListener('mouseout', _resumeFade, false);
			}
			
		}
	
		function _createElement(elem, className) {
			var newElement = DOCUMENT.createElement(elem);
			if (className) newElement.className = className;
			return newElement;
		}
		
		function _startFade() {
			clearTimeout(_controlsTimeout);
			if (_api.jwGetState() == states.PLAYING || _api.jwGetState() == states.PAUSED) {
				_showControlbar();
				_showDock();
				if (!_inCB) {
					_controlsTimeout = setTimeout(_fadeControls, _timeoutDuration);
				}
			} else if (_replayState) {
				_showDock();
			}
		}
		
		var _inCB = false;
		
		function _cancelFade() {
			clearTimeout(_controlsTimeout);
			_inCB = true;
		}
		
		function _resumeFade() {
			_inCB = false;
		}
		
		function _fadeControls() {
			if (_api.jwGetState() == states.PLAYING || _api.jwGetState() == states.PAUSED) {
				_hideControlbar();
				_hideDock();
			} else if (_replayState) {
				_hideDock();
			}
			clearTimeout(_controlsTimeout);
			_controlsTimeout = 0;
		}
		
		function _setupControls() {
			var width = _model.width,
				height = _model.height,
				cbSettings = _model.componentConfig('controlbar');
				displaySettings = _model.componentConfig('display');
		
			_display = new html5.display(_api, displaySettings);
			_display.addEventListener(events.JWPLAYER_DISPLAY_CLICK, function(evt) {
				// Forward Display Clicks
				_eventDispatcher.sendEvent(evt.type, evt);
			});
			_controlsLayer.appendChild(_display.getDisplayElement());
			
			_dock = new html5.dock(_api, _model.componentConfig('dock'));
			_controlsLayer.appendChild(_dock.getDisplayElement());
			
			if (_model.playlistsize && _model.playlistposition && _model.playlistposition != "none") {
				_playlist = new html5.playlistcomponent(_api, {});
				_playlistLayer.appendChild(_playlist.getDisplayElement());
			}
			
			if (!_isMobile || _forcedControls) {
				// TODO: allow override for showing HTML controlbar on iPads
				_controlbar = new html5.controlbar(_api, cbSettings);
				_controlsLayer.appendChild(_controlbar.getDisplayElement());
				if (_forcedControls) {
					_showControlbar();
					_showDock();
				}
			} else {
				_videoTag.controls = true;
			}
				
			_resize(width, height);
		}

		/** 
		 * Switch to fullscreen mode.  If a native fullscreen method is available in the browser, use that.  
		 * Otherwise, use the false fullscreen method using CSS. 
		 **/
		var _fullscreen = this.fullscreen = function(state) {
			if (!utils.exists(state)) {
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
			if (_controlbar) _controlbar.redraw();
			_resizeMedia();
		}

		/**
		 * Resize the player
		 */
		function _resize(width, height) {
			if (_model.fullscreen) return;
			
			if (utils.exists(width) && utils.exists(height)) {
				_css(_internalSelector(), {
					width: width,
					height: height
				});
				_model.width = width;
				_model.height = height;
			}

			if (_display) {
				_display.redraw();
			}
			if (_controlbar) {
				_controlbar.redraw();
			}
			var playlistSize = _model.playlistsize,
				playlistPos = _model.playlistposition
			
			if (_playlist && playlistSize && playlistPos) {
				_playlist.redraw();
				
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
			
			_checkAudioMode(height);
			_resizeMedia();

			return;
		}
		
		function _checkAudioMode(height) {
			_audioMode = (!!_controlbar && height <= 40 && height.toString().indexOf("%") < 0);
			if (_controlbar) {
				if (_audioMode) {
					_controlbar.audioMode(true);
					_showControlbar();
					_hideDisplay();
					_showVideo(false);
				} else {
					_controlbar.audioMode(false);
					_updateState(_api.jwGetState());
				}
			}
			_css(_internalSelector(), {
				'background-color': _audioMode ? 'transparent' : _display.getBGColor()
			});
		}
		
		function _resizeMedia() {
			utils.stretch(_model.fullscreen ? utils.stretching.UNIFORM : _model.stretching, 
					_videoTag, 
					_videoLayer.clientWidth, _videoLayer.clientHeight, 
					_videoTag.videoWidth, _videoTag.videoHeight);
		}
		
		this.resize = _resize;
		this.resizeMedia = _resizeMedia;

		var _completeSetup = this.completeSetup = function() {
			_css(_internalSelector(), {opacity: 1});
		}
		
		/**
		 * Listen for keystrokes while in fullscreen mode.  
		 * ESC returns from fullscreen
		 * SPACE toggles playback
		 **/
		function _keyHandler(evt) {
			if (_model.fullscreen) {
				switch (evt.keyCode) {
				// ESC
				case 27:
					_fullscreen(false);
					break;
				// SPACE
//				case 32:
//					if (_model.state == states.PLAYING || _model.state = states.BUFFERING)
//						_api.jwPause();
//					break;
				}
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
		
		function _showControlbar() {
			if (_controlbar && _model.controlbar) _controlbar.show();
		}
		function _hideControlbar() {
			if (_controlbar && !_audioMode && !_forcedControls) {
				_controlbar.hide();
//				_setTimeout(function() { _controlbar.style.display="none")
			}
		}
		
		function _showDock() {
			if (_dock && !_audioMode) _dock.show();
		}
		function _hideDock() {
			if (_dock && !_forcedControls) _dock.hide();
		}

		function _showDisplay() {
			if (_display && !_audioMode) _display.show();
		}
		function _hideDisplay() {
			if (_display) _display.hide();
		}

		function _hideControls() {
			_hideControlbar();
			_hideDisplay();
			_hideDock();
		}

		function _showControls() {
			_showControlbar();
			_showDisplay();
			_showDock();
		}
		
		function _showVideo(state) {
			state = state && !_audioMode;
			_css(_internalSelector(VIEW_VIDEO_CONTAINER_CLASS), {
				visibility: state ? "visible" : "hidden",
				opacity: state ? 1 : 0
			});
		}

		function _playlistCompleteHandler() {
			_replayState = true;
		}
		
		/**
		 * Player state handler
		 */
		var _stateTimeout;
		
		function _stateHandler(evt) {
			_replayState = false;
			clearTimeout(_stateTimeout);
			_stateTimeout = setTimeout(function() {
				_updateState(evt.newstate);
			}, 100);
		}
		
		function _updateState(state) {
			switch(state) {
			case states.PLAYING:
				if (!_model.getVideo().audioMode() || _isMobile) {
					_showVideo(true);
					_resizeMedia();
					_display.hidePreview(true);
					if (_isMobile) {
						if (_isIPad && !_forcedControls) _videoTag.controls = true;
						else _hideDisplay();
					}
				}
				_startFade();
				break;
			case states.IDLE:
				if (!_isMobile) {
					_showVideo(false);
				}
				_hideControlbar();
				_hideDock();
				_display.hidePreview(false);
				_showDisplay();
				if (_isIPad) _videoTag.controls = false;
				break;
			case states.BUFFERING:
				if (_isMobile) _showVideo(true);
				else _showControls();
				break;
			case states.PAUSED:
				if (!_isMobile || _forcedControls) {
					_showControls();
				} else if (_isIPad) {
					_videoTag.controls = false;
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
			_stateHandler({newstate:states.PLAYING});
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
		
		this.setupError = function(message) {
			jwplayer.embed.errorScreen(_playerElement, message);
			_completeSetup();
		}
		
		function _setVisibility(selector, state) {
			_css(selector, { display: state ? "block" : "none" });
		}
		
		this.addButton = function(icon, label, handler, id) {
			if (_dock) _dock.addButton(icon, label, handler, id);
		}

		this.removeButton = function(id) {
			if (_dock) _dock.removeButton(id);
		}

		_init();

		
	}

	// Container styles
	_css('.' + PLAYER_CLASS, {
		position: "relative",
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

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS, {
		visibility: "hidden"
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
		left: 0, 
		right: 0,
		top: 0,
		bottom: 0,
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
		'background-size': 'cover' + JW_CSS_IMPORTANT,
		'background-position': 'center'
	});

	_css('.' + PLAYER_CLASS+' .jwexactfit', {
		'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT + JW_CSS_IMPORTANT
	});

})(jwplayer.html5);