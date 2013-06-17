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
		_isIPad = utils.isIPad(),
		_isIPod = utils.isIPod(),
		_isAndroid = utils.isAndroid(),
        _isIOS = utils.isIOS(),
		DOCUMENT = document, 
		PLAYER_CLASS = "jwplayer", 
		ASPECT_MODE = "aspectMode",
		FULLSCREEN_SELECTOR = "."+PLAYER_CLASS+".jwfullscreen",
		VIEW_MAIN_CONTAINER_CLASS = "jwmain",
		VIEW_INSTREAM_CONTAINER_CLASS = "jwinstream",
		VIEW_VIDEO_CONTAINER_CLASS = "jwvideo", 
		VIEW_CONTROLS_CONTAINER_CLASS = "jwcontrols",
		VIEW_ASPECT_CONTAINER_CLASS = "jwaspect",
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
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block";
	
	html5.viewmobile = function(api, model) {
		var _api = api,
			_model = model, 
			_playerElement,
			_container,
			_controlsLayer,
			_aspectLayer,
			_playlistLayer,
			_controlsTimeout=0,
			_timeoutDuration = 2000,
			_videoTag,
			_videoLayer,
			// _instreamControlbar,
			// _instreamDisplay,
			_instreamLayer,
			_instreamMode = FALSE,
			_instreamHadControls,
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
			_inCB = FALSE,
			_eventDispatcher = new events.eventdispatcher();
		
		utils.extend(this, _eventDispatcher);

		function _init() {
			_playerElement = _createElement("div", PLAYER_CLASS + " playlist-" + _model.playlistposition);
			_playerElement.id = _api.id;
			
			if (_model.aspectratio) {
				_css('.' + PLAYER_CLASS, {
					display: 'inline-block'
				});
				_playerElement.className = _playerElement.className.replace(PLAYER_CLASS, PLAYER_CLASS + " " + ASPECT_MODE);
			}

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
			_aspectLayer = _createElement("span", VIEW_ASPECT_CONTAINER_CLASS);

			_setupControls();
			
			_container.appendChild(_videoLayer);
			_container.appendChild(_controlsLayer);
			_container.appendChild(_instreamLayer);
			
			_playerElement.appendChild(_container);
			_playerElement.appendChild(_aspectLayer);
			_playerElement.appendChild(_playlistLayer);

			
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_READY, _readyHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_COMPLETE, _playlistCompleteHandler);
			_stateHandler({newstate:states.IDLE});
			

			_css('#' + _playerElement.id + '.' + ASPECT_MODE + " ." + VIEW_ASPECT_CONTAINER_CLASS, {
				"margin-top": _model.aspectratio,
				display: JW_CSS_BLOCK
			});

			var ar = utils.exists (_model.aspectratio) ? parseFloat(_model.aspectratio) : 100,
				size = _model.playlistsize;
			_css('#' + _playerElement.id + '.playlist-right .' + VIEW_ASPECT_CONTAINER_CLASS, {
				"margin-bottom": -1 * size * (ar/100) + "px"
			});

			_css('#' + _playerElement.id + '.playlist-right .' + VIEW_PLAYLIST_CONTAINER_CLASS, {
				width: size + "px",
				right: 0,
				top: 0,
				height: "100%"
			});

			_css('#' + _playerElement.id + '.playlist-bottom .' + VIEW_ASPECT_CONTAINER_CLASS, {
				"padding-bottom": size + "px"
			});

			_css('#' + _playerElement.id + '.playlist-bottom .' + VIEW_PLAYLIST_CONTAINER_CLASS, {
				width: "100%",
				height: size + "px",
				bottom: 0
			});

			_css('#' + _playerElement.id + '.playlist-right .' + VIEW_MAIN_CONTAINER_CLASS, {
				right: size + "px"
			});

			_css('#' + _playerElement.id + '.playlist-bottom .' + VIEW_MAIN_CONTAINER_CLASS, {
				bottom: size + "px"
			});
		}
		
		function _createElement(elem, className) {
			var newElement = DOCUMENT.createElement(elem);
			if (className) newElement.className = className;
			return newElement;
		}
		
		function _startFade() {

		}
		
		function _cancelFade() {
		}
		
		function _resumeFade() {

		}
		
		function _fadeControls(evt) {

		}

		function forward(evt) {
			_eventDispatcher.sendEvent(evt.type, evt);
		}
		
		function _setupControls() {
			var width = _model.width,
				height = _model.height,
				cbSettings = _model.componentConfig('controlbar'),
				displaySettings = _model.componentConfig('display');
			_display = new html5.display(_api, displaySettings);
			_controlsLayer.appendChild(_display.element());
			_logo = new html5.logo(_api, _logoConfig);
			_controlsLayer.appendChild(_logo.element());
			
			_dock = new html5.dock(_api, _model.componentConfig('dock'));
			_controlsLayer.appendChild(_dock.element());
						_controlbar = new html5.controlbar(_api, cbSettings);
			_controlsLayer.appendChild(_controlbar.element());

			_showControls();
				
			setTimeout(function() { 
				_resize(_model.width, _model.height, false);
			}, 0);
		}

		/** 
		 * Switch to fullscreen mode.  If a native fullscreen method is available in the browser, use that.  
		 * Otherwise, use the false fullscreen method using CSS. 
		 **/
		var _fullscreen = this.fullscreen = function(state) {
			
		}
		
		function _redrawComponent(comp) {
			if (comp) comp.redraw();
		}

		/**
		 * Resize the player
		 */
		function _resize(width, height, sendResize) {
			if (utils.exists(width) && utils.exists(height)) {
				_model.width = width;
				_model.height = height;
			}
			
			_playerElement.style.width = isNaN(width) ? width : width + "px"; 
			if (_playerElement.className.indexOf(ASPECT_MODE) == -1) {
				_playerElement.style.height = isNaN(height) ? height : height + "px"; 
			}

			if (_display) _display.redraw();
			if (_controlbar) _controlbar.redraw();
			if (_logo) {
				_logo.offset(_controlbar && _logo.position().indexOf("bottom") >= 0 ? _controlbar.height() + _controlbar.margin() : 0);
				setTimeout(function() {
					if (_dock) _dock.offset(_logo.position() == "top-left" ? _logo.element().clientWidth + _logo.margin() : 0)
				}, 500);
			}
			_resizeMedia();
		}
		
		function _resizeMedia() {
			if (_videoTag && _playerElement.className.indexOf(ASPECT_MODE) == -1) {
				utils.stretch(_model.stretching, 
						_videoTag, 
						_videoLayer.clientWidth, _videoLayer.clientHeight, 
						_videoTag.videoWidth, _videoTag.videoHeight);
			}
		}
		function _checkAudioMode(height) {

		}
		


		this.resize = _resize;
		this.resizeMedia = _resizeMedia;
		var _completeSetup = this.completeSetup = function() {
			_css(_internalSelector(), {opacity: 1});
		}

		/**
		 * If the browser enters or exits fullscreen mode (without the view's knowing about it) update the model.
		 **/
		function _fullscreenChangeHandler(evt) {

			
		}
		
		function _showControlbar() {
			if (_controlbar) _controlbar.show();
		}
		function _hideControlbar() {
			if (_controlbar && !_audioMode) {
				_controlbar.hide();
			}
		}
		
		function _showDock() {
			if (_dock && !_audioMode) _dock.show();
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
				_display.show();
			}
		}
		function _hideDisplay() {
			if (_display) {
				_display.hide();
			}
		}

		function _hideControls() {
			_hideControlbar();
			_hideDock();
			_hideLogo();
		}

		function _showControls() {
			if (_model.controls || _audioMode) {
				_showControlbar();
				_showDock();
			}
			_showLogo();
		}

		function _showVideo(state) {
			state = state && !_audioMode;
			_css(_internalSelector(VIEW_VIDEO_CONTAINER_CLASS), {
				visibility: state ? "visible" : JW_CSS_HIDDEN,
				opacity: state ? 1 : 0
				//display: state ? JW_CSS_BLOCK : JW_CSS_NONE
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
				case states.IDLE:
					_showVideo(FALSE);
					//_hideControls();
					_fadeControls();
					if (!_audioMode) {
						_display.hidePreview(FALSE);
						_showDisplay();
						if (!_logoConfig.hide) _showLogo();	
					}
	//				if (_isIPad) _videoTag.controls = FALSE;
					break;
			}
		}
		
		function _internalSelector(className) {
			return '#' + _api.id + (className ? " ." + className : "");
		}
		
		// this.setupInstream = function(instreamContainer, instreamCb, instreamDisp, instreamVideo) {
		this.setupInstream = function(instreamDisplay, instreamVideo) {
			// Instream not supported in HTML5 mode
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), TRUE);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), FALSE);
			_instreamLayer.appendChild(instreamDisplay);
			// _instreamLayer.appendChild(instreamContainer);
			_instreamVideo = instreamVideo;
			// _instreamDisplay = instreamDisp;
			// _instreamControlbar = instreamCb
			_stateHandler({newstate:states.PLAYING});
			
			_instreamMode = TRUE;
		}
		
		var _destroyInstream = this.destroyInstream = function() {
			// Instream not supported in HTML5 mode
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), FALSE);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), TRUE);
			_instreamLayer.innerHTML = "";
			_instreamVideo = null;
			_instreamMode = FALSE;
			//_resize(_model.width, _model.height);
		}
		
		this.setupError = function(message) {
			_errorState = true;
			jwplayer.embed.errorScreen(_playerElement, message);
			_completeSetup();
		}
		
		function _setVisibility(selector, state) {
			_css(selector, { display: state ? JW_CSS_BLOCK : JW_CSS_NONE });
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
		
		this.forceState = function(state) {
		    _display.forceState(state);
		}
		
		this.releaseState = function() {
		    _display.releaseState(_api.jwGetState());
		}
		
		
		this.getSafeRegion = function() {

		}

		this.destroy = function () {

		}

		_init();

		
	}

	// Container styles
	_css('.' + PLAYER_CLASS, {
		position: "relative",
		display: 'block',
		opacity: 0,
		'min-height': 200,
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
		overflow: JW_CSS_HIDDEN,
		visibility: JW_CSS_HIDDEN,
		opacity: 0,
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
		display: JW_CSS_NONE
	});
	
	_css('.' + VIEW_INSTREAM_CONTAINER_CLASS, {
		position: JW_CSS_ABSOLUTE,
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		display: 'none'
	});

	_css('.' + VIEW_ASPECT_CONTAINER_CLASS, {
		display: 'none'
	});

	_css('.' + PLAYER_CLASS + '.' + ASPECT_MODE , {
		height: 'auto'
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
		display: JW_CSS_NONE
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