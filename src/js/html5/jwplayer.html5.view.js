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
		_bounds = utils.bounds,
		_isMobile = utils.isMobile(),
		_isIPad = utils.isIPad(),
		_isIPod = utils.isIPod(),
		_isAndroid = utils.isAndroid(),

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

		TRUE = true,
		FALSE = false,
		
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
			_logo,
			_logoConfig = utils.extend({}, _model.componentConfig("logo")),
			_captions,
			_playlist,
			_audioMode,
			_forcedControls = (_model.mobilecontrols),
			_errorState = FALSE,
			_replayState,
			_readyState,
			_fullscreenInterval,
			_eventDispatcher = new events.eventdispatcher();
		
		utils.extend(this, _eventDispatcher);

		function _init() {
			_playerElement = _createElement("div", PLAYER_CLASS);
			_playerElement.id = _api.id;
			
//			_css(_internalSelector(), {
//				width: _model.width,
//				height: _model.height
//			});
			_resize(_model.width, _model.height);
			
			var replace = document.getElementById(_api.id);
			replace.parentNode.replaceChild(_playerElement, replace);
		}

		this.getCurrentCaptions = function() {
			return _captions.getCurrentCaptions();
		}

		this.setCurrentCaptions = function(caption) {
			_captions.setCurrentCaptions(caption);
		}

		this.getCaptionsList = function() {
			return _captions.getCaptionsList();
		}
		
		this.setup = function(skin) {
			if (_errorState) return;
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
			
			DOCUMENT.addEventListener('webkitfullscreenchange', _fullscreenChangeHandler, FALSE);
			_videoTag.addEventListener('webkitbeginfullscreen', _fullscreenChangeHandler, FALSE);
			_videoTag.addEventListener('webkitendfullscreen', _fullscreenChangeHandler, FALSE);
			DOCUMENT.addEventListener('mozfullscreenchange', _fullscreenChangeHandler, FALSE);
			DOCUMENT.addEventListener('keydown', _keyHandler, FALSE);
			
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_READY, _readyHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_COMPLETE, _playlistCompleteHandler);

			_stateHandler({newstate:states.IDLE});
			
			_controlsLayer.addEventListener('mouseout', _fadeControls, FALSE);
			_controlsLayer.addEventListener('mousemove', _startFade, FALSE);
			if (utils.isIE()) {
				// Not sure why this is needed
				_videoLayer.addEventListener('mousemove', _startFade, FALSE);
				_videoLayer.addEventListener('click', _display.clickHandler);
			}
			_componentFadeListeners(_controlbar);
			_componentFadeListeners(_dock);
			_componentFadeListeners(_logo);
		}
		
		function _componentFadeListeners(comp) {
			if (comp) {
				comp.element().addEventListener('mousemove', _cancelFade, FALSE);
				comp.element().addEventListener('mouseout', _resumeFade, FALSE);
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
				_showControls();
				if (!_inCB) {
					_controlsTimeout = setTimeout(_fadeControls, _timeoutDuration);
				}
			}
		}
		
		var _inCB = FALSE;
		
		function _cancelFade() {
			clearTimeout(_controlsTimeout);
			_inCB = TRUE;
		}
		
		function _resumeFade() {
			_inCB = FALSE;
		}
		
		function _fadeControls() {
			if (_api.jwGetState() != states.BUFFERING) {
				_hideControlbar();
				_hideDock();
				_hideLogo();
			}
			clearTimeout(_controlsTimeout);
			_controlsTimeout = 0;
		}

		function forward(evt) {
			_eventDispatcher.sendEvent(evt.type, evt);
		}
		
		function _setupControls() {
			var width = _model.width,
				height = _model.height,
				cbSettings = _model.componentConfig('controlbar'),
				displaySettings = _model.componentConfig('display');

			_checkAudioMode(height);

			_captions = new html5.captions(_api, _model.captions);
			_captions.addEventListener(events.JWPLAYER_CAPTIONS_LIST, forward);
			_captions.addEventListener(events.JWPLAYER_CAPTIONS_CHANGED, forward);
			_controlsLayer.appendChild(_captions.element());

			_display = new html5.display(_api, displaySettings);
			_display.addEventListener(events.JWPLAYER_DISPLAY_CLICK, forward);
			if (_audioMode) _display.hidePreview(TRUE);
			_controlsLayer.appendChild(_display.element());
			
			_logo = new html5.logo(_api, _logoConfig);
			_controlsLayer.appendChild(_logo.element());
			
			_dock = new html5.dock(_api, _model.componentConfig('dock'));
			_controlsLayer.appendChild(_dock.element());
			
			if (_api.edition) {
				new html5.rightclick(_api, {abouttext: _model.abouttext, aboutlink: _model.aboutlink});	
			}
			else {
				new html5.rightclick(_api, {});
			}
			
			if (_model.playlistsize && _model.playlistposition && _model.playlistposition != "none") {
				_playlist = new html5.playlistcomponent(_api, {});
				_playlistLayer.appendChild(_playlist.element());
			}
			
			if (!_isMobile || _forcedControls) {
				// TODO: allow override for showing HTML controlbar on iPads
				_controlbar = new html5.controlbar(_api, cbSettings);
				_controlsLayer.appendChild(_controlbar.element());
				if (_forcedControls) {
					_showControls();
				}
			}
				
			setTimeout(function() {
				_resize(width, height);
			}, 0);
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
					_fakeFullscreen(TRUE);
					if (_playerElement.requestFullScreen) {
						_playerElement.requestFullScreen();
					} else if (_playerElement.mozRequestFullScreen) {
						_playerElement.mozRequestFullScreen();
					} else if (_playerElement.webkitRequestFullScreen) {
						_playerElement.webkitRequestFullScreen();
					}
					_model.setFullscreen(TRUE);
				}
			} else {
		    	_fakeFullscreen(FALSE);
				if (_model.fullscreen) {
					_model.setFullscreen(FALSE);
				    if (DOCUMENT.cancelFullScreen) {  
				    	DOCUMENT.cancelFullScreen();  
				    } else if (DOCUMENT.mozCancelFullScreen) {  
				    	DOCUMENT.mozCancelFullScreen();  
				    } else if (DOCUMENT.webkitCancelFullScreen) {  
				    	DOCUMENT.webkitCancelFullScreen();  
				    } else if (_videoTag.webkitExitFullScreen) {
				    	_videoTag.webkitExitFullScreen();
				    }
				}
				if (_isIPad && _api.jwGetState() == states.PAUSED) {
					setTimeout(_showDisplay, 500);
				}
			}

			_redrawComponent(_controlbar);
			_redrawComponent(_display);
			_redrawComponent(_dock);
			_resizeMedia();
			
			if (_model.fullscreen) {
				// Browsers seem to need an extra second to figure out how large they are in fullscreen...
				_fullscreenInterval = setInterval(_resizeMedia, 200);
			} else {
				clearInterval(_fullscreenInterval);
			}
			_eventDispatcher.sendEvent(events.JWPLAYER_RESIZE);
		}
		
		function _redrawComponent(comp) {
			if (comp) comp.redraw();
		}

		/**
		 * Resize the player
		 */
		function _resize(width, height) {
			//if (_model.fullscreen) return;
			
			if (utils.exists(width) && utils.exists(height)) {
//				_css(_internalSelector(), {
//					width: width,
//					height: height
//				});
				_model.width = width;
				_model.height = height;
			}
			
			_playerElement.style.width = isNaN(width) ? width : width + "px"; 
			_playerElement.style.height = isNaN(height) ? height : height + "px"; 

			if (_display) _display.redraw();
			if (_controlbar) _controlbar.redraw();
			if (_logo) {
				setTimeout(function() {
					_logo.offset(_controlbar && _logo.position().indexOf("bottom") >= 0 ? _controlbar.element().clientHeight + _controlbar.margin() : 0);
					if (_dock) _dock.offset(_logo.position() == "top-left" ? _logo.element().clientWidth + _logo.margin() : 0)
				}, 500);
			}

			var playlistSize = _model.playlistsize,
				playlistPos = _model.playlistposition
			
			if (_playlist && playlistSize && (playlistPos == "right" || playlistPos == "bottom")) {
				_playlist.redraw();
				
				var playlistStyle = { display: "block" }, containerStyle = {};
				playlistStyle[playlistPos] = 0;
				containerStyle[playlistPos] = playlistSize;
				
				if (playlistPos == "right") {
					playlistStyle.width = playlistSize;
				} else {
					playlistStyle.height = playlistSize;
				}
				
				_css(_internalSelector(VIEW_PLAYLIST_CONTAINER_CLASS), playlistStyle);
				_css(_internalSelector(VIEW_MAIN_CONTAINER_CLASS), containerStyle);
			}
			
			_checkAudioMode(height);
			_resizeMedia();

			_eventDispatcher.sendEvent(events.JWPLAYER_RESIZE);
			
			return;
		}
		
		function _checkAudioMode(height) {
			_audioMode = ((!_isMobile || _forcedControls) && height <= 40 && height.toString().indexOf("%") < 0);
			if (_controlbar) {
				if (_audioMode) {
					_controlbar.audioMode(TRUE);
					_showControls();
					_display.hidePreview(TRUE);
					_hideDisplay();
					_showVideo(FALSE);
				} else {
					_controlbar.audioMode(FALSE);
					_updateState(_api.jwGetState());
				}
			}
			if (_logo && _audioMode) {
				_hideLogo();
			}
			//_css(_internalSelector(), {
			_playerElement.style.backgroundColor = _audioMode ? 'transparent' : '#000';
			//});
		}
		
		function _resizeMedia() {
			if (_videoTag) {
				utils.stretch(_model.stretching, 
						_videoTag, 
						_videoLayer.clientWidth, _videoLayer.clientHeight, 
						_videoTag.videoWidth, _videoTag.videoHeight);
			}
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
					_fullscreen(FALSE);
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
			var fsElements = [DOCUMENT.mozFullScreenElement, DOCUMENT.webkitCurrentFullScreenElement, _videoTag.webkitDisplayingFullscreen];
			for (var i=0; i<fsElements.length; i++) {
				if (fsElements[i] && (!fsElements[i].id || fsElements[i].id == _api.id))
					return TRUE;
			}
			return FALSE;
		}
		
		/**
		 * If the browser enters or exits fullscreen mode (without the view's knowing about it) update the model.
		 **/
		function _fullscreenChangeHandler(evt) {
			var fsNow = _isNativeFullscreen();
			if (_model.fullscreen != fsNow) {
				_fullscreen(fsNow);
			}
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
			if (_dock && !_audioMode && (!_isMobile || _replayState)) _dock.show();
		}
		function _hideDock() {
			if (_dock && !(_replayState || _forcedControls)) {
				_dock.hide();
			}
		}

		function _showLogo() {
			if (_logo && !_audioMode) _logo.show();
		}
		function _hideLogo() {
			if (_logo && (!_forcedControls || _audioMode)) _logo.hide(_audioMode);
		}

		function _showDisplay() {
			if (_display && _model.controls && !_audioMode) {
				if (!_isIPod || _api.jwGetState() == states.IDLE)
					_display.show();
			}
			if (_isMobile && !_forcedControls) {
				if (_isAndroid) _controlsLayer.style.display = "block";
				if (!(_isMobile && _model.fullscreen)) _videoTag.controls = false;
			}
		}
		function _hideDisplay() {
			if (_display) {
				if (_isMobile && !_forcedControls) {
					if (_isAndroid) _controlsLayer.style.display = "none";
					_videoTag.controls = true;
				}
				_display.hide();
			}
		}

		function _hideControls() {
			_hideControlbar();
			_hideDock();
			_hideLogo();
			_sendControlsEvent();
		}

		function _showControls() {
			if (_model.controls || _audioMode) {
				_showControlbar();
				_showDock();
				_sendControlsEvent();
			}
			_showLogo();
		}

		function _sendControlsEvent() {
			return;
			var height = _bounds(_container).height,
				y = 0;
			if (_controlbar && _controlbar.visible) {
				height -= _bounds(_controlbar.element()).height;
			}
			if (_dock && _dock.visible) {
				y = _bounds(_dock.element()).height;
			}
			if (_dock) {}
			
		}
		
		// Subtracts rect2 rectangle from rect1 rectangle's area
		function _subtractRect(rect1, rect2) {
			if (rect2.right < rect1.left || rect2.left > rect1.right) return rect1;
			if (rect2.bottom < rect1.top || rect2.top > rect1.bottom) return rect1;
			
			var bottomCutout = (rect2.y > rect2.height / 2),  
				newRect = {
					x: rect1.x,
					y: bottomCutout ? rect1.y : rect2.bottom,
					width: rect1.width,
				};
			
		}
		
		function _showVideo(state) {
			state = state && !_audioMode;
			_css(_internalSelector(VIEW_VIDEO_CONTAINER_CLASS), {
				visibility: state ? "visible" : "hidden",
				opacity: state ? 1 : 0
			});
		}

		function _playlistCompleteHandler() {
			_replayState = TRUE;
			_fullscreen(false);
			if (_model.controls) {
				_showDock();
			}
		}

		function _readyHandler(evt) {
			_readyState = TRUE;
		}

		/**
		 * Player state handler
		 */
		var _stateTimeout;
		
		function _stateHandler(evt) {
			_replayState = FALSE;
			clearTimeout(_stateTimeout);
			_stateTimeout = setTimeout(function() {
				_updateState(evt.newstate);
			}, 100);
		}
		
		function _updateState(state) {
			switch(state) {
			case states.PLAYING:
				if (!_model.getVideo().audioMode() || _isMobile) {
					_showVideo(TRUE);
					_resizeMedia();
					_display.hidePreview(TRUE);
					if (_isMobile) {
						if (!(_isIPad && _forcedControls)) {
							_hideDisplay();
						}
					}
				} else {
					_showVideo(FALSE);
					_display.hidePreview(_audioMode);
				}
				_startFade();
				break;
			case states.IDLE:
				if (!_isAndroid) {
					_showVideo(FALSE);
				}
				//_hideControls();
				_fadeControls();
				if (!_audioMode) {
					_display.hidePreview(FALSE);
					_showDisplay();
					if (!_logoConfig.hide) _showLogo();	
				}
//				if (_isIPad) _videoTag.controls = FALSE;
				break;
			case states.BUFFERING:
				_showDisplay();
				if (_isMobile) _showVideo(TRUE);
				else _showControls();
				break;
			case states.PAUSED:
				_showDisplay();
				if (!_isMobile || _forcedControls) {
					_showControls();
//				} else if (_isIPad) {
//					_videoTag.controls = FALSE;
				}
				break;
			}
		}
		
		function _internalSelector(className) {
			return '#' + _api.id + (className ? " ." + className : "");
		}
		
		this.setupInstream = function(instreamDisplay, instreamVideo) {
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), TRUE);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), FALSE);
			_instreamLayer.appendChild(instreamDisplay);
			_instreamVideo = instreamVideo;
			_stateHandler({newstate:states.PLAYING});
			_instreamMode = TRUE;
		}
		
		var _destroyInstream = this.destroyInstream = function() {
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), FALSE);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), TRUE);
			_instreamLayer.innerHTML = "";
			_instreamVideo = null;
			_instreamMode = FALSE;
			_resize(_model.width, _model.height);
		}
		
		this.setupError = function(message) {
			_errorState = true;
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
		
		this.setControls = function(state) {
			var oldstate = _model.controls,
				newstate = state ? TRUE : FALSE;
			_model.controls = newstate;
			if (newstate != oldstate) {
				if (newstate) {
					_showDisplay();
				} else {
					_hideControls();
					_hideDisplay();
				}
				_eventDispatcher.sendEvent(events.JWPLAYER_CONTROLS, { controls: newstate });
			}
		}
		
		this.getSafeRegion = function() {
			var controls = _model.controls,
				dispBounds = utils.bounds(_container),
				dispOffset = dispBounds.top,
				cbBounds = utils.bounds(_controlbar.element()),
				dockButtons = (_dock.numButtons() > 0),
				dockBounds = utils.bounds(_dock.element()),
				logoBounds = utils.bounds(_logo.element()),
				logoTop = (_logo.position().indexOf("top") == 0), 
				bounds = {};
			
			bounds.x = 0;
			bounds.y = Math.max(dockButtons ? (dockBounds.top + dockBounds.height - dispOffset) : 0, logoTop ? (logoBounds.top + logoBounds.height - dispOffset) : 0);
			bounds.width = dispBounds.width;
			bounds.height = (logoTop ? cbBounds.top : logoBounds.top) - bounds.y - dispOffset;
			
			return {
				x: 0,
				y: controls ? bounds.y : 0,
				width: controls ? bounds.width : 0,
				height: controls ? bounds.height : 0
			}
		}

		_init();

		
	}

	// Container styles
	_css('.' + PLAYER_CLASS, {
		position: "relative",
		opacity: 0,
		'min-height': utils.isMobile() ? 200 : 0,
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
		visibility: "hidden",
		overflow: "hidden",
		cursor: "pointer"
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
	}, TRUE);

	_css(FULLSCREEN_SELECTOR + ' .'+ VIEW_MAIN_CONTAINER_CLASS, {
		left: 0, 
		right: 0,
		top: 0,
		bottom: 0
	}, TRUE);

	_css(FULLSCREEN_SELECTOR + ' .'+ VIEW_PLAYLIST_CONTAINER_CLASS, {
		display: "none"
	}, TRUE);
	
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
