/**
 * jwplayer.html5 namespace
 * 
 * @author pablo
 * @version 6.0
 */
(function(window) {
	var jwplayer = window.jwplayer,
		html5 = jwplayer.html5, 
		utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state,
		_css = utils.css, 
		_bounds = utils.bounds,
		_isMobile = utils.isMobile(),
		_isIPad = utils.isIPad(),
		_isIPod = utils.isIPod(),
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
		FULLSCREEN_EVENTS = [
			'fullscreenchange',
			'webkitfullscreenchange',
			'mozfullscreenchange',
			'MSFullscreenChange'
		],

		/*************************************************************
		 * Player stylesheets - done once on script initialization;  *
		 * These CSS rules are used for all JW Player instances      *
		 *************************************************************/

		TRUE = true,
		FALSE = !TRUE,
		
		JW_CSS_SMOOTH_EASE = "opacity .25s ease",
		JW_CSS_100PCT = "100%",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_IMPORTANT = " !important",
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block";

	html5.view = function(_api, _model) {
		var _playerElement,
			_container,
			_controlsLayer,
			_aspectLayer,
			_playlistLayer,
			_controlsTimeout = -1,
			_timeoutDuration = _isMobile ? 4000 : 2000,
			_videoLayer,
			_lastWidth,
			_lastHeight,
			_instreamLayer,
			_instreamControlbar,
			_instreamDisplay,
			_instreamModel,
			_instreamMode = FALSE,
			_controlbar,
			_display,
			_castDisplay,
			_dock,
			_logo,
			_logoConfig = utils.extend({}, _model.componentConfig("logo")),
			_captions,
			_playlist,
			_audioMode,
			_errorState = FALSE,
			_showing = FALSE,
			_forcedControlsState = null,
			_replayState,
			_readyState,
			_rightClickMenu,
			_resizeMediaTimeout = -1,
			_inCB = FALSE, // in control bar
			_currentState,

			// view fullscreen methods and ability
			_requestFullscreen,
			_exitFullscreen,
			_elementFullscreen = false,

            // Used to differentiate tab focus events from click events, because when
            //  it is a click, the mouseDown event will occur immediately prior
            _focusFromClick = false,

			_this = utils.extend(this, new events.eventdispatcher());

		function _init() {

			_playerElement = _createElement("div", PLAYER_CLASS + " playlist-" + _model.playlistposition);
			_playerElement.id = _api.id;
			_playerElement.tabIndex = 0;
			_playerElement.onmousedown = handleMouseDown;
			_playerElement.onfocusin = handleFocus;
			_playerElement.addEventListener('focus',handleFocus);
			_playerElement.onfocusout = handleBlur;
			_playerElement.addEventListener('blur',handleBlur);
            _playerElement.addEventListener('keydown', handleKeydown);

			_requestFullscreen =
				_playerElement.requestFullscreen ||
				_playerElement.requestFullScreen ||
				_playerElement.webkitRequestFullscreen ||
				_playerElement.webkitRequestFullScreen ||
				_playerElement.webkitEnterFullscreen ||
				_playerElement.webkitEnterFullScreen ||
				_playerElement.mozRequestFullScreen ||
				_playerElement.msRequestFullscreen;
			_exitFullscreen =
				DOCUMENT.exitFullscreen ||
				DOCUMENT.cancelFullScreen ||
				DOCUMENT.webkitExitFullscreen ||
				DOCUMENT.webkitCancelFullScreen ||
				DOCUMENT.mozCancelFullScreen ||
				DOCUMENT.msExitFullscreen;
			_elementFullscreen = _requestFullscreen && _exitFullscreen;

			if (_model.aspectratio) {
				_css.style(_playerElement, {
					display: 'inline-block'
				});
				_playerElement.className = _playerElement.className.replace(PLAYER_CLASS, PLAYER_CLASS + " " + ASPECT_MODE);
			}

			_resize(_model.width, _model.height);
		
			var replace = DOCUMENT.getElementById(_api.id);
			replace.parentNode.replaceChild(_playerElement, replace);
		}

        function adjustSeek (amount) {
            var newSeek = utils.between(_model.position+ amount, 0, this.getDuration());
            this.seek(newSeek);
        }

        function adjustVolume (amount) {
            var newVol = utils.between(this.getVolume() + amount, 0, 100);
            this.setVolume(newVol);
        }

		function allowKeyHandling(evt) {
			// If Meta keys return
			if (evt.ctrlKey || evt.metaKey) {
				return false;
			}

			// Controls may be disabled during share screens, or via API
			if(! _model.controls) {
				return false;
			}
			return true;
		}

        function handleKeydown(evt) {
			if (! allowKeyHandling(evt)) {
				// Let event bubble upwards
				return true;
			}

            // On keypress show the controlbar for a few seconds
            if (!_controlbar.adMode()) {
                _showControlbar();
                _resetTapTimer();
            }

            var jw = jwplayer(_api.id);
            switch(evt.keyCode) {
                case 27: // Esc
                    jw.setFullscreen(FALSE);
                    break;
                case 13: // enter
                case 32: // space
                    jw.play();
                    break;
                case 37: // left-arrow, if not adMode
                    if (!_controlbar.adMode()) {
                        adjustSeek.call(jw, -5);
                    }
                    break;
                case 39: // right-arrow, if not adMode
                    if (!_controlbar.adMode()) {
                        adjustSeek.call(jw, 5);
                    }
                    break;
                case 38: // up-arrow
                    adjustVolume.call(jw, 10);
                    break;
                case 40: // down-arrow
                    adjustVolume.call(jw, -10);
                    break;
                case 77: // m-key
                    jw.setMute();
                    break;
                case 70: // f-key
                    jw.setFullscreen();
                    break;
                default:
                    if (evt.keyCode >= 48 && evt.keyCode <= 59) {
                        // if 0-9 number key, move to n/10 of the percentage of the video
                        var number = evt.keyCode - 48;
                        var newSeek = (number/10) * jw.getDuration();
                        jw.seek(newSeek);
                    }
                    break;
            }

            if (/13|32|37|38|39|40/.test(evt.keyCode)) {
                // Prevent keypresses from scrolling the screen
                evt.preventDefault();
                return false;
            }
        }

		function handleMouseDown() {
            _focusFromClick = true;

            // After a click it no longer has "tab-focus"
            _this.sendEvent(events.JWPLAYER_VIEW_TAB_FOCUS, {
                hasFocus : false
            });
		}

		function handleFocus() {
            var wasTabEvent = ! _focusFromClick;
            _focusFromClick = false;

            if (wasTabEvent) {
                _this.sendEvent(events.JWPLAYER_VIEW_TAB_FOCUS, {
                    hasFocus : true
                });
            }

            // On tab-focus, show the control bar for a few seconds
            if (!_controlbar.adMode()) {
                _showControlbar();
                _resetTapTimer();
             }
		}

		function handleBlur() {
            _focusFromClick = false;
            _this.sendEvent(events.JWPLAYER_VIEW_TAB_FOCUS, {
                hasFocus : false
            });
		}

		this.getCurrentCaptions = function() {
			return _captions.getCurrentCaptions();
		};

		this.setCurrentCaptions = function(caption) {
			_captions.setCurrentCaptions(caption);
		};

		this.getCaptionsList = function() {
			return _captions.getCaptionsList();
		};		
		
		function _responsiveListener() {
			var bounds = _bounds(_playerElement), 
				containerWidth = Math.round(bounds.width),
				containerHeight = Math.round(bounds.height);
			if (!DOCUMENT.body.contains(_playerElement)) {
				window.removeEventListener('resize', _responsiveListener);
				if (_isMobile) {
					window.removeEventListener('orientationchange', _responsiveListener);
				}
			} else if (containerWidth && containerHeight) {
				if (containerWidth !== _lastWidth || containerHeight !== _lastHeight) {
					_lastWidth = containerWidth;
					_lastHeight = containerHeight;
					if (_display) {
						_display.redraw();
					}
					clearTimeout(_resizeMediaTimeout);
					_resizeMediaTimeout = setTimeout(_resizeMedia, 50);
					_this.sendEvent(events.JWPLAYER_RESIZE, {
						width : containerWidth,
						height : containerHeight
					});
				}
			}
			return bounds;
		}

		
		this.setup = function(skin) {
			if (_errorState) return;
			_api.skin = skin;
			
			_container = _createElement("span", VIEW_MAIN_CONTAINER_CLASS);
			_container.id = _api.id + "_view";
			_videoLayer = _createElement("span", VIEW_VIDEO_CONTAINER_CLASS);
			_videoLayer.id = _api.id + "_media";

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

			// adds video tag to video layer
			_model.getVideo().setContainer(_videoLayer);

			// _videoTag.addEventListener('webkitbeginfullscreen', _fullscreenChangeHandler, FALSE);
			// _videoTag.addEventListener('webkitendfullscreen', _fullscreenChangeHandler, FALSE);
			_model.addEventListener('fullscreenchange', _fullscreenChangeHandler);
			for (var i=FULLSCREEN_EVENTS.length; i--;) {
				DOCUMENT.addEventListener(FULLSCREEN_EVENTS[i], _fullscreenChangeHandler, FALSE);
			}

			window.removeEventListener('resize', _responsiveListener);
			window.addEventListener('resize', _responsiveListener, FALSE);
			if (_isMobile) {
				window.removeEventListener('orientationchange', _responsiveListener);
				window.addEventListener('orientationchange', _responsiveListener, FALSE);
			}
            //this for googima, after casting, to get the state right.
            jwplayer(_api.id).onAdPlay(function() {
                _controlbar.adMode(true);
                _updateState(states.PLAYING);
            });
            jwplayer(_api.id).onAdSkipped(function() {
                _controlbar.adMode(false);
            });
            jwplayer(_api.id).onAdComplete(function() {
                _controlbar.adMode(false);
            });
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_READY, _readyHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_ERROR, _errorHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_COMPLETE, _playlistCompleteHandler);
			// _api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _playlistItemHandler);
			_api.jwAddEventListener(events.JWPLAYER_CAST_AVAILABLE, function(evt) {
				if (evt.available) {
					_this.forceControls(TRUE);
				} else {
					_this.releaseControls();
				}
			});
			_api.jwAddEventListener(events.JWPLAYER_CAST_SESSION, function(evt) {
				if (!_castDisplay) {
					_castDisplay = new jwplayer.html5.castDisplay(_api.id);
					_castDisplay.statusDelegate = function(evt) {
						_castDisplay.setState(evt.newstate);
					};
				}
				if (evt.active) {
					_css.style(_captions.element(), {
						display: 'none'
					});
					_this.forceControls(TRUE);
					_castDisplay.setState('connecting').setName(evt.deviceName).show();
					_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _castDisplay.statusDelegate);
					_api.jwAddEventListener(events.JWPLAYER_CAST_AD_CHANGED, _castAdChanged);
				} else {
					_api.jwRemoveEventListener(events.JWPLAYER_PLAYER_STATE, _castDisplay.statusDelegate);
					_api.jwRemoveEventListener(events.JWPLAYER_CAST_AD_CHANGED, _castAdChanged);
					_castDisplay.hide();
					if (_controlbar.adMode()) {
						_castAdsEnded();
					}
					_css.style(_captions.element(), {
						display: null
					});
					// redraw displayicon
					_stateHandler({
						newstate: _api.jwGetState()
					});
					_responsiveListener();
				}
				
			});

			_stateHandler({
				newstate:states.IDLE
			});
			
			if (!_isMobile) {
				_controlsLayer.addEventListener('mouseout', _mouseoutHandler, FALSE);
				
				_controlsLayer.addEventListener('mousemove', _startFade, FALSE);
				if (utils.isMSIE()) {
					// Not sure why this is needed
					_videoLayer.addEventListener('mousemove', _startFade, FALSE);
					_videoLayer.addEventListener('click', _display.clickHandler);
				}
			} 
			_componentFadeListeners(_controlbar);
			_componentFadeListeners(_dock);
			_componentFadeListeners(_logo);

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

			setTimeout(function() { 
				_resize(_model.width, _model.height);
			}, 0);
		};
		
		function _componentFadeListeners(comp) {
			if (comp) {
				comp.element().addEventListener('mousemove', _cancelFade, FALSE);
				comp.element().addEventListener('mouseout', _resumeFade, FALSE);
			}
		}
	
		function _captionsLoadedHandler() {//evt) {
			//ios7captions
			//_model.getVideo().addCaptions(evt.captionData);
			// set current captions evt.captionData[_api.jwGetCurrentCaptions()]
		}
	
	
		function _mouseoutHandler() {
			clearTimeout(_controlsTimeout);
			_controlsTimeout = setTimeout(_hideControls, 10);
		}
		function _createElement(elem, className) {
			var newElement = DOCUMENT.createElement(elem);
			if (className) newElement.className = className;
			return newElement;
		}
		
		function _touchHandler() {
			if (_isMobile) {
				if (_showing) {
					_hideControls();
				} else {
					_showControls();
				}
			} else {
				_stateHandler({
					newstate: _api.jwGetState()
				});
			}
			if (_showing) {
				_resetTapTimer();
			}
		}

		function _resetTapTimer() {
			clearTimeout(_controlsTimeout);
			_controlsTimeout = setTimeout(_hideControls, _timeoutDuration);
		}
		
		function _startFade() {
			clearTimeout(_controlsTimeout);
			if (_api.jwGetState() == states.PAUSED || _api.jwGetState() == states.PLAYING) {
				_showControls();
				if (!_inCB) {
					_controlsTimeout = setTimeout(_hideControls, _timeoutDuration);
				}
			}
		}
		
		function _cancelFade() {
			clearTimeout(_controlsTimeout);
			_inCB = TRUE;
		}
		
		function _resumeFade() {
			_inCB = FALSE;
		}
		
		function forward(evt) {
			_this.sendEvent(evt.type, evt);
		}
		
		function _setupControls() {
			var height = _model.height,
				cbSettings = _model.componentConfig('controlbar'),
				displaySettings = _model.componentConfig('display');

			_checkAudioMode(height);

			_captions = new html5.captions(_api, _model.captions);
			_captions.addEventListener(events.JWPLAYER_CAPTIONS_LIST, forward);
			_captions.addEventListener(events.JWPLAYER_CAPTIONS_CHANGED, forward);
			_captions.addEventListener(events.JWPLAYER_CAPTIONS_LOADED, _captionsLoadedHandler);
			_controlsLayer.appendChild(_captions.element());

			_display = new html5.display(_api, displaySettings);
			_display.addEventListener(events.JWPLAYER_DISPLAY_CLICK, function(evt) {
				forward(evt);
				_touchHandler();
			});
			if (_audioMode) _display.hidePreview(TRUE);
			_controlsLayer.appendChild(_display.element());
			
			_logo = new html5.logo(_api, _logoConfig);
			_controlsLayer.appendChild(_logo.element());
			
			_dock = new html5.dock(_api, _model.componentConfig('dock'));
			_controlsLayer.appendChild(_dock.element());
			
			if (_api.edition && !_isMobile) {
				_rightClickMenu = new html5.rightclick(_api, {abouttext: _model.abouttext, aboutlink: _model.aboutlink});	
			}
			else if (!_isMobile) {
				_rightClickMenu = new html5.rightclick(_api, {});
			}
			
			if (_model.playlistsize && _model.playlistposition && _model.playlistposition != JW_CSS_NONE) {
				_playlist = new html5.playlistcomponent(_api, {});
				_playlistLayer.appendChild(_playlist.element());
			}
			
			_controlbar = new html5.controlbar(_api, cbSettings);
			_controlbar.addEventListener(events.JWPLAYER_USER_ACTION, _resetTapTimer);
			_controlsLayer.appendChild(_controlbar.element());
			
			if (_isIPod) _hideControlbar();
		}

		function _castAdChanged(evt) {
			// end ad mode (ad provider removed)
			if (evt.done) {
				_castAdsEnded();
				return;
			}

			if (!evt.complete) {
				// start ad mode
				if (!_controlbar.adMode()) {
					_castAdsStarted();
				}

				_controlbar.setText(evt.message);

				// clickthrough callback
				var clickAd = evt.onClick;
				if (clickAd !== undefined) {
					_display.setAlternateClickHandler(function() {
						clickAd(evt);
					});
				}
				//skipAd callback
				var skipAd = evt.onSkipAd;
				if (skipAd !== undefined && _castDisplay) {
					_castDisplay.setSkipoffset(evt, evt.onSkipAd);
				}
			}

			// update skip button and companions
			if (_castDisplay) {
				_castDisplay.adChanged(evt);
			}

		}

		function _castAdsStarted() {
			_controlbar.instreamMode(true);
			_controlbar.adMode(true);
			_controlbar.show(true);
		}

		function _castAdsEnded() {
			// controlbar reset
			_controlbar.setText('');
			_controlbar.adMode(false);
			_controlbar.instreamMode(false);
			_controlbar.show(true);
			// cast display reset
			if (_castDisplay) {
				_castDisplay.adsEnded();
			}
			// display click reset
			_display.revertAlternateClickHandler();
		}

		/** 
		 * Switch fullscreen mode.
		 **/
		var _fullscreen = this.fullscreen = function(state) {
			if (!utils.exists(state)) {
				state = !_model.fullscreen;
			}
			_toggleFullscreen(state);
		};
		

		
		function _redrawComponent(comp) {
			if (comp) comp.redraw();
		}

		/**
		 * Resize the player
		 */
		function _resize(width, height, resetAspectMode) {
			var className = _playerElement.className,
				playerStyle,
				playlistStyle,
				containerStyle,
				playlistSize,
				playlistPos,
				id = _api.id + '_view';
			_css.block(id);

			// when jwResize is called remove aspectMode and force layout
			resetAspectMode = !!resetAspectMode;
			if (resetAspectMode) {
				className = className.replace(/\s*aspectMode/, '');
				if (_playerElement.className !== className) {
					_playerElement.className = className;
				}
				_css.style(_playerElement, {
					display: JW_CSS_BLOCK
				}, resetAspectMode);
			}
			
			if (utils.exists(width) && utils.exists(height)) {
				_model.width = width;
				_model.height = height;
			}
			
			playerStyle = { width: width };
			if (className.indexOf(ASPECT_MODE) == -1) {
				playerStyle.height = height;
			}
			_css.style(_playerElement, playerStyle, true);

			if (_display) {
				_display.redraw();
			}
			if (_controlbar) {
				_controlbar.redraw(TRUE);
			}
			if (_logo) {
				_logo.offset(_controlbar && _logo.position().indexOf("bottom") >= 0 ? _controlbar.height() + _controlbar.margin() : 0);
				setTimeout(function() {
					if (_dock) {
						_dock.offset(_logo.position() == "top-left" ? _logo.element().clientWidth + _logo.margin() : 0);
					}
				}, 500);
			}
			
			_checkAudioMode(height);

			playlistSize = _model.playlistsize;
			playlistPos = _model.playlistposition;
			if (_playlist && playlistSize && (playlistPos == "right" || playlistPos == "bottom")) {
				_playlist.redraw();
				
				playlistStyle = {
					display: JW_CSS_BLOCK
				};
				containerStyle = {};

				playlistStyle[playlistPos] = 0;
				containerStyle[playlistPos] = playlistSize;
				
				if (playlistPos == "right") {
					playlistStyle.width = playlistSize;
				} else {
					playlistStyle.height = playlistSize;
				}
				
				_css.style(_playlistLayer, playlistStyle);
				_css.style(_container, containerStyle);
			}

			// pass width, height from jwResize if present 
			_resizeMedia(width, height);

			_css.unblock(id);
		}
		
		function _checkAudioMode(height) {
			_audioMode = _isAudioMode(height);
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
			_playerElement.style.backgroundColor = _audioMode ? 'transparent' : '#000';
		}
		
		function _isAudioMode(height) {
			var bounds = _bounds(_playerElement);
			if (height.toString().indexOf("%") > 0)
				return FALSE;
			else if (bounds.height === 0)
				return FALSE;
			else if (_model.playlistposition == "bottom")
				return bounds.height <= 40 + _model.playlistsize;
			return bounds.height <= 40;
		}
		
		function _resizeMedia(width, height) {
			if (!width || isNaN(Number(width))) {
				if (!_videoLayer) return;
				width  = _videoLayer.clientWidth;
			}
			if (!height || isNaN(Number(height))) {
				if (!_videoLayer) return;
				height = _videoLayer.clientHeight;
			}
			var transformScale = _model.getVideo().resize(width, height, _model.stretching);
			// poll resizing if video is transformed
			if (transformScale) {
				clearTimeout(_resizeMediaTimeout);
				_resizeMediaTimeout = setTimeout(_resizeMedia, 250);
			}
		}
		
		this.resize = function(width, height) {
			var resetAspectMode = TRUE;
			_resize(width, height, resetAspectMode);
			_responsiveListener();
		};
		this.resizeMedia = _resizeMedia;

		var _completeSetup = this.completeSetup = function() {
			_css.style(_playerElement, {
				opacity: 1
			});
			window.onbeforeunload = function() {
				if (!_isCasting()) { // don't call stop while casting
					// prevent video error in display on window close
					_api.jwStop();
				}
			};
		};
		

		/**
		 * False fullscreen mode. This is used for browsers without full support for HTML5 fullscreen.
		 * This method sets the CSS of the container element to a fixed position with 100% width and height.
		 */
		function _toggleFullscreen(state) {
			state = !!state;
			// don't go fullscreen in audio mode
			if (state && _isAudioFile()) {
				return;
			}
			if (state !== _model.fullscreen) {
				// If a native fullscreen method is available in the browser, use that.
				if (state) {
					if (_requestFullscreen) {
						_requestFullscreen.apply(_playerElement);
					}
				} else {
					if (_exitFullscreen) {
						_exitFullscreen.apply(DOCUMENT);
					}
				}
				
				if (_elementFullscreen) {
					_fullscreenChangeHandler({
						type: 'fullscreenrequest',
						target: _playerElement,
						jwstate: state
					});
				} else {
					// use video tag fullscreen if container fullscreen is not available
					_model.getVideo().setFullScreen(state);
				}


			}
		}

		/**
		 * Return whether or not we're in native fullscreen
		 */
		function _isNativeFullscreen() {
			if (_elementFullscreen) {
				var fsElement = DOCUMENT.currentFullScreenElement ||
							DOCUMENT.webkitCurrentFullScreenElement ||
							DOCUMENT.mozFullScreenElement || 
							DOCUMENT.msFullscreenElement;
				return !!(fsElement && fsElement.id === _api.id);
			}
			// if player element view fullscreen not available, return video fullscreen state
			return _model.getVideo().getFullScreen();
		}
		
		/**
		 * If the browser enters or exits fullscreen mode (without the view's knowing about it) update the model.
		 **/
		function _fullscreenChangeHandler(event) {
			// don't respond to fullscreen change handlers for elements outside the player (other players, etc...)
			if (event.target !== _playerElement && !_playerElement.contains(event.target)) {
				return;
			}

			// var element = event.target;
			var fullscreenState = (event.jwstate !== undefined) ? event.jwstate : _isNativeFullscreen();

			// adjust UI based on player container fullscreen state
			var className = _playerElement.className.replace(/\s*jwfullscreen/, '');
			var bodyStyle = {};
			if (fullscreenState) {
				className += ' jwfullscreen';
				bodyStyle['overflow-y'] = JW_CSS_HIDDEN;
			} else {
				bodyStyle['overflow-y'] = '';
			}
			_playerElement.className = className;
			_css.style(DOCUMENT.body, bodyStyle);
			_redrawComponent(_controlbar);
			_redrawComponent(_display);
			_redrawComponent(_dock);
			_resizeMedia();

			// update model
			_model.setFullscreen(fullscreenState);

			//ios7captions
			// var curr = _model.getVideo().fsCaptions(fullscreenState, _api.jwGetCurrentCaptions());
			// if (!fullscreenState) {
				// if (curr) _api.jwSetCurrentCaptions(curr+1);
				// else _api.jwSetCurrentCaptions(0);
			// }

			if (fullscreenState) {
				// Browsers seem to need an extra second to figure out how large they are in fullscreen...
				clearTimeout(_resizeMediaTimeout);
				_resizeMediaTimeout = setTimeout(_resizeMedia, 200);

			} else if (_isIPad && _api.jwGetState() == states.PAUSED) {
				// delay refresh on iPad when exiting fullscreen
				// TODO: cancel this if fullscreen or player state changes
				setTimeout(_showDisplay, 500);
			}
		}
		
		function _showControlbar() {
			if (_isIPod && !_audioMode) return; 
			if (_controlbar && _model.controls ) _controlbar.show();
		}

		function _hideControlbar() {
			if (_forcedControlsState === TRUE) {
				return;
			}
			// TODO: use _forcedControlsState for audio mode so that we don't need these
			if (_controlbar && !_audioMode && !_model.getVideo().audioMode()) {
				_controlbar.hide();
			}
		}
		
		function _showDock() {
			if (_dock && !_audioMode && _model.controls) _dock.show();
		}
		function _hideDock() {
			if (_dock && !_replayState && !_model.getVideo().audioMode()) {
				_dock.hide();
			}
		}

		function _showLogo() {
			if (_logo && !_audioMode) _logo.show();
		}
		function _hideLogo() {
			if (_logo && (!_model.getVideo().audioMode() || _audioMode)) _logo.hide(_audioMode);
		}

		function _showDisplay() {
			if (_display && _model.controls && !_audioMode) {
				if (!_isIPod || _api.jwGetState() == states.IDLE)
					_display.show();
			}

			if (!(_isMobile && _model.fullscreen)) {
				_model.getVideo().setControls(FALSE);
			}
			
		}
		function _hideDisplay() {
			if (_display) {
				_display.hide();
			}
		}

		function _hideControls() {
			clearTimeout(_controlsTimeout);
			if (_forcedControlsState === TRUE) {
				return;
			}
			_showing = FALSE;

			var state = _api.jwGetState();
			
			if (!_model.controls || state != states.PAUSED) {
				_hideControlbar();
			}

			if (!_model.controls) {
				_hideDock();
			}

			if (state != states.IDLE && state != states.PAUSED) {
				_hideDock();
				_hideLogo();
			}
		}

		function _showControls() {
			if (_forcedControlsState === FALSE) {
				return;
			}
			_showing = TRUE;
			if (_model.controls || _audioMode) {
				if (!(_isIPod && _currentState == states.PAUSED)) {
					_showControlbar();
					_showDock();
				}
			}
			if (_logoConfig.hide) _showLogo();

		}

		function _showVideo(state) {
			state = state && !_audioMode;
			_model.getVideo().setVisibility(state);
		}

		function _playlistCompleteHandler() {
			_replayState = TRUE;
			_fullscreen(FALSE);
			if (_model.controls) {
				_showDock();
			}
		}
		
		
		// function _playlistItemHandler() {
			//ios7 captions:
			//_model.getVideo().resetCaptions();
		// }

		function _readyHandler() {
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
		
		function _errorHandler() {
			_hideControlbar();
		}
		
		function _isAudioFile() {
			var model = _instreamMode ? _instreamModel : _model;
			return model.getVideo().audioMode();
		}

		function _isCasting() {
			return _model.getVideo().isCaster;
		}

		function _updateState(state) {
			_currentState = state;
			// cast.display
			if (_isCasting()) {
				if (_display) {
					_display.show();
					_display.hidePreview(FALSE);
				}
				// hide video without audio and android checks
				_css.style(_videoLayer, {
					visibility: JW_CSS_HIDDEN,
					opacity: 0
				});
				// force control bar without audio check
				if (_controlbar) {
					_controlbar.show();
					_controlbar.hideFullscreen(TRUE);
				}
				return;
			}
			// player display
			switch(state) {
			case states.PLAYING:
				if (_model.getVideo().isCaster !== TRUE) {
					_forcedControlsState = null;
				} else {
					_forcedControlsState = TRUE;
				}
				if (_isAudioFile()) {
					_showVideo(FALSE);
					_display.hidePreview(_audioMode);
					_display.setHiding(TRUE);
					if (_controlbar) {
						_showControls();
						_controlbar.hideFullscreen(TRUE);
					} 
					_showDock();
				} else {
					_showVideo(TRUE);
					_resizeMedia();
					_display.hidePreview(TRUE);
					if (_controlbar) {
						_controlbar.hideFullscreen(FALSE);
					}
				}
				break;
			case states.IDLE:
				_showVideo(FALSE);
				if (!_audioMode) {
					_display.hidePreview(FALSE);
					_showDisplay();
					_showDock();
					if (_controlbar) {
						_controlbar.hideFullscreen(FALSE);
					}
				}
				break;
			case states.BUFFERING:
				_showDisplay();
				_hideControls();
				if (_isMobile) {
					_showVideo(TRUE);
				}
				break;
			case states.PAUSED:
				_showDisplay();
				_showControls();
				break;
			}

			_showLogo();
		}
		
		function _internalSelector(className) {
			return '#' + _api.id + (className ? " ." + className : "");
		}
		
		this.setupInstream = function(instreamContainer, instreamControlbar, instreamDisplay, instreamModel) {
			_css.unblock();
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), TRUE);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), FALSE);
			_instreamLayer.appendChild(instreamContainer);
			_instreamControlbar = instreamControlbar;
			_instreamDisplay = instreamDisplay;
			_instreamModel = instreamModel;
			_stateHandler({
				newstate: states.PLAYING
			});
			_instreamMode = TRUE;
		};
		
		this.destroyInstream = function() {
			_css.unblock();
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), FALSE);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), TRUE);
			_instreamLayer.innerHTML = "";
			_instreamMode = FALSE;
		};
		
		this.setupError = function(message) {
			_errorState = TRUE;
			jwplayer.embed.errorScreen(_playerElement, message, _model);
			_completeSetup();
		};
		
		function _setVisibility(selector, state) {
			_css(selector, { display: state ? JW_CSS_BLOCK : JW_CSS_NONE });
		}
		
		this.addButton = function(icon, label, handler, id) {
			if (_dock) {
				_dock.addButton(icon, label, handler, id);
				if (_api.jwGetState() == states.IDLE) _showDock();
			}
		};

		this.removeButton = function(id) {
			if (_dock) _dock.removeButton(id);
		};
		
		this.setControls = function(state) {
			var oldstate = _model.controls,
				newstate = !!state;
			_model.controls = newstate;
			if (newstate != oldstate) {

				if (_instreamMode) {
					_hideInstream(!state);
				} else {
					if (newstate) {
						_stateHandler({
							newstate:
							_api.jwGetState()
						});
					} else {
						_hideControls();
						_hideDisplay();
					}
				}
				_this.sendEvent(events.JWPLAYER_CONTROLS, {
					controls: newstate
				});
			}
		};

		this.forceControls = function(state) {
			_forcedControlsState = !!state;
			if (state) {
				_showControls();
			} else {
				_hideControls();
			}
		};

		this.releaseControls = function() {
			_forcedControlsState = null;
			_updateState(_api.jwGetState());
		};
		
		function _hideInstream(hidden) {
			if (hidden) {
				_instreamControlbar.hide();
				_instreamDisplay.hide();
			} else {
				_instreamControlbar.show();
				_instreamDisplay.show();
			}
		}
		
		this.addCues = function(cues) {
			if (_controlbar) {
				_controlbar.addCues(cues);
			}
		};

		this.forceState = function(state) {
			_display.forceState(state);
		};
		
		this.releaseState = function() {
			_display.releaseState(_api.jwGetState());
		};
		
		this.getSafeRegion = function() {
			var bounds = {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
			if (!_model.controls) {
				return bounds;
			}
			_controlbar.showTemp();
			_dock.showTemp();
			//_responsiveListener();
			var dispBounds = _bounds(_container),
				dispOffset = dispBounds.top,
				cbBounds = _instreamMode ? _bounds(DOCUMENT.getElementById(_api.id + "_instream_controlbar")) : _bounds(_controlbar.element()),
				dockButtons = _instreamMode ? FALSE : (_dock.numButtons() > 0),
				logoTop = (_logo.position().indexOf("top") === 0),
				dockBounds,
				logoBounds = _bounds(_logo.element());
			if (dockButtons) {
				dockBounds = _bounds(_dock.element());
				bounds.y = Math.max(0, dockBounds.bottom - dispOffset);
			}
			if (logoTop) {
				bounds.y = Math.max(bounds.y, logoBounds.bottom - dispOffset);
			}
			bounds.width = dispBounds.width;
			if (cbBounds.height) {
				bounds.height = (logoTop ? cbBounds.top : logoBounds.top) - dispOffset - bounds.y;
			} else {
				bounds.height = dispBounds.height - bounds.y;
			}
			_controlbar.hideTemp();
			_dock.hideTemp();
			return bounds;
		};

		this.destroy = function() {
			window.removeEventListener('resize', _responsiveListener);
			window.removeEventListener('orientationchange', _responsiveListener);
			for (var i=FULLSCREEN_EVENTS.length; i--;) {
				DOCUMENT.removeEventListener(FULLSCREEN_EVENTS[i], _fullscreenChangeHandler, FALSE);
			}
			_model.removeEventListener('fullscreenchange', _fullscreenChangeHandler);
			_playerElement.removeEventListener('keydown', handleKeydown, FALSE);
			if (_rightClickMenu) {
				_rightClickMenu.destroy();
			}
			if (_castDisplay) {
				_api.jwRemoveEventListener(events.JWPLAYER_PLAYER_STATE, _castDisplay.statusDelegate);
				_castDisplay.destroy();
			}
			if (_controlsLayer) {
				_controlsLayer.removeEventListener('mousemove', _startFade);
				_controlsLayer.removeEventListener('mouseout', _mouseoutHandler); 
			}
			if (_videoLayer) {
				_videoLayer.removeEventListener('mousemove', _startFade);
				_videoLayer.removeEventListener('click', _display.clickHandler);
			}
		};

		_init();
	};

	// Container styles
	_css('.' + PLAYER_CLASS, {
		position: 'relative',
		// overflow: 'hidden',
		display: 'block',
		opacity: 0,
		'min-height': 0,
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

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS + ', .'+ VIEW_CONTROLS_CONTAINER_CLASS, {
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
		background : 'transparent',
		height : JW_CSS_100PCT,
		width: JW_CSS_100PCT,
		position: 'absolute',
		margin: 'auto',
		right: 0,
		left: 0,
		top: 0,
		bottom: 0
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
		margin:0,
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

})(window);
