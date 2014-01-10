// TODO: blankButton
/**
 * JW Player HTML5 Controlbar component
 * 
 * @author pablo
 * @version 6.0
 * 
 * TODO: Since the volume slider was moved from the controbar skinning component
 * to the tooltip component, we should clean up how it gets created
 */
(function(jwplayer) {
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		events = jwplayer.events,
		states = events.state,
		_css = utils.css,
		_setTransition = utils.transitionStyle,
		_isMobile = utils.isMobile(),
		_nonChromeAndroid = utils.isAndroid(4) && !utils.isChrome(),
		/** Controlbar element types * */
		CB_BUTTON = "button",
		CB_TEXT = "text",
		CB_DIVIDER = "divider",
		CB_SLIDER = "slider",
		
		/** Some CSS constants we should use for minimization * */
		JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block",
		JW_CSS_INLINE = "inline",
		JW_CSS_INLINE_BLOCK = "inline-block",
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_LEFT = "left",
		// JW_CSS_RIGHT = "right",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "opacity .25s, background .25s, visibility .25s",
		JW_VISIBILITY_TIMEOUT = 250,
		
		HIDDEN = { display: JW_CSS_NONE },
		SHOWING = { display: JW_CSS_BLOCK },
		NOT_HIDDEN = { display: UNDEFINED },
		
		CB_CLASS = '.jwcontrolbar',
		TYPEOF_ARRAY = "array",
		
		FALSE = false,
		TRUE = true,
		NULL = null,
		UNDEFINED,
		
		WINDOW = window,
		DOCUMENT = document;
	
	/** HTML5 Controlbar class * */
	html5.controlbar = function(api, config) {
		var _api,
			_skin,
			_dividerElement = _layoutElement("divider", CB_DIVIDER),
			_defaults = {
				margin : 8,
				maxwidth: 800,
				font : "Arial,sans-serif",
				fontsize : 11,
				fontcolor : parseInt("eeeeee", 16),
				fontweight : "bold",
				layout : {
					left: {
						position: "left",
						elements: [ 
						   _layoutElement("play", CB_BUTTON), 
						   _layoutElement("prev", CB_BUTTON), 
						   _layoutElement("next", CB_BUTTON), 
						   _layoutElement("elapsed", CB_TEXT)
						]
					},
					center: {
						position: "center",
						elements: [ 
							_layoutElement("time", CB_SLIDER),
							_layoutElement("alt", CB_TEXT)
						]
					},
					right: {
						position: "right",
						elements: [ 
							_layoutElement("duration", CB_TEXT), 
							_layoutElement("hd", CB_BUTTON), 
							_layoutElement("cc", CB_BUTTON), 
							_layoutElement("mute", CB_BUTTON), 
							_layoutElement("volume", CB_SLIDER), 
							_layoutElement("volumeH", CB_SLIDER), 
							_layoutElement("fullscreen", CB_BUTTON)
						]
					}
				}
			},
		
			_settings, 
			_layout, 
			_elements,
			_bgHeight,
			_controlbar, 
			_id,
			_duration,
			_position,
			_levels,
			_currentQuality,
			_captions,
			_currentCaptions,
			_currentVolume,
			_volumeOverlay,
			_cbBounds,
			_timeRail,
			_railBounds,
			_timeOverlay,
			_timeOverlayContainer,
			_timeOverlayThumb,
			_timeOverlayText,
			_hdTimer,
			_hdTapTimer,
			_hdOverlay,
			_ccTimer,
			_ccTapTimer,
			_ccOverlay,
			_redrawTimeout,
			_hideTimeout = -1,
			_audioMode = FALSE,
			_hideFullscreen = FALSE,
			_dragging = FALSE,		
			_lastSeekTime = 0,
			_lastTooltipPositionTime = 0,
			_cues = [],
			_activeCue,
			_instreamMode = FALSE,
			_eventDispatcher = new events.eventdispatcher(),
			
			_toggles = {
				play: "pause",
				mute: "unmute",
				fullscreen: "normalscreen"
			},
			
			_toggleStates = {
				play: FALSE,
				mute: FALSE,
				fullscreen: FALSE
			},
			
			_buttonMapping = {
				play: _play,
				mute: _mute,
				fullscreen: _fullscreen,
				next: _next,
				prev: _prev,
				hd: _hd,
				cc: _cc
			},
			
			
			_sliderMapping = {
				time: _seek,
				volume: _volume
			},
		
			_overlays = {},
			_this = this;
			utils.extend(_this, _eventDispatcher);

		function _layoutElement(name, type, className) {
			return { name: name, type: type, className: className };
		}
		
		function _init() {
			_elements = {};
			
			_api = api;

			_id = _api.id + "_controlbar";
			_duration = _position = 0;

			_controlbar = _createSpan();
			_controlbar.id = _id;
			_controlbar.className = "jwcontrolbar";

			_skin = _api.skin;
			_layout = _skin.getComponentLayout('controlbar');
			if (!_layout) _layout = _defaults.layout;
			utils.clearCss(_internalSelector());
			_css.block(_id+'build');
			_createStyles();
			_buildControlbar();
			_css.unblock(_id+'build');
			_addEventListeners();
			setTimeout(function() {
				_volumeHandler();
				_muteHandler();
			}, 0);
			_playlistHandler();
			_this.visible = false;
		}
		
		
		function _addEventListeners() {
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_TIME, _timeUpdated);
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_MUTE, _muteHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_VOLUME, _volumeHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_BUFFER, _bufferHandler);
			_api.jwAddEventListener(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_LOADED, _playlistHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVELS, _qualityHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVEL_CHANGED, _qualityLevelChanged);
			_api.jwAddEventListener(events.JWPLAYER_CAPTIONS_LIST, _captionsHandler);
			_api.jwAddEventListener(events.JWPLAYER_CAPTIONS_CHANGED, _captionChanged);
			_api.jwAddEventListener(events.JWPLAYER_RESIZE, _resizeHandler);
			if (!_isMobile) {
				_controlbar.addEventListener('mouseover', function() {
					// Slider listeners
					WINDOW.addEventListener('mousemove', _sliderMouseEvent, FALSE);
					WINDOW.addEventListener('mouseup', _sliderMouseEvent, FALSE);
					WINDOW.addEventListener('mousedown', _killSelect, FALSE);
				}, false);
				_controlbar.addEventListener('mouseout', function(){
					// Slider listeners
					WINDOW.removeEventListener('mousemove', _sliderMouseEvent);
					WINDOW.removeEventListener('mouseup', _sliderMouseEvent);
					WINDOW.removeEventListener('mousedown', _killSelect);
					DOCUMENT.onselectstart = null;
				}, false);
			}
		}
		
		function _resizeHandler() {
			_cbBounds = utils.bounds(_controlbar);
			if (_cbBounds.width > 0) {
				_this.show(TRUE);
			}
		}


		function _timeUpdated(evt) {
			_css.block(_id); //unblock on redraw

			// Positive infinity for live streams on iPad, 0 for live streams on Safari (HTML5)
			if (evt.duration == Number.POSITIVE_INFINITY || (!evt.duration && utils.isSafari() && !_isMobile)) {
				_this.setText(_api.jwGetPlaylist()[_api.jwGetPlaylistIndex()].title || "Live broadcast");
				
			} else {
				var timeString;
				if (_elements.elapsed) {
					timeString = utils.timeFormat(evt.position);
					_elements.elapsed.innerHTML = timeString;
				}
				if (_elements.duration) {
					timeString = utils.timeFormat(evt.duration);
					_elements.duration.innerHTML = timeString;
				}
				if (evt.duration > 0) {
					_setProgress(evt.position / evt.duration);
				} else {
					_setProgress(0);
				}
				_duration = evt.duration;
				_position = evt.position;
				_this.setText();
			}
		}
		
		function _stateHandler(evt) {
			switch (evt.newstate) {
			case states.BUFFERING:
			case states.PLAYING:
				if (_elements.timeSliderThumb) {
					_css.style(_elements.timeSliderThumb, {
						opacity: 1
					});
				}
				_toggleButton("play", TRUE);
				break;
			case states.PAUSED:
				if (!_dragging) {
					_toggleButton("play", FALSE);
				}
				break;
			case states.IDLE:
				_toggleButton("play", FALSE);
				if (_elements.timeSliderThumb) {
					_css.style(_elements.timeSliderThumb, {
						opacity: 0
					});
				}
				if (_elements.timeRail) {
					_elements.timeRail.className = "jwrail";
					setTimeout(function() {
						// Temporarily disable the buffer animation
						_elements.timeRail.className += " jwsmooth";
					}, 100);
				}
				_setBuffer(0);
				_timeUpdated({ position: 0, duration: 0});
				break;
			}
		}
		
		function _itemHandler(evt) {
			if(!_instreamMode) {
				var tracks = _api.jwGetPlaylist()[evt.index].tracks,
					tracksloaded = FALSE,
					cuesloaded = FALSE;
				_removeCues();
				if (utils.typeOf(tracks) == TYPEOF_ARRAY && !_isMobile) {
					for (var i=0; i < tracks.length; i++) {
						if (!tracksloaded && tracks[i].file && tracks[i].kind && tracks[i].kind.toLowerCase() == "thumbnails") {
							_timeOverlayThumb.load(tracks[i].file);
							tracksloaded  = TRUE;
						}
						if (tracks[i].file && tracks[i].kind && tracks[i].kind.toLowerCase() == "chapters") {
							_loadCues(tracks[i].file);
							cuesloaded = TRUE;
						}
					}
				}
				// If we're here, there are no thumbnails to load - we should clear out the thumbs from the previous item
				if (!tracksloaded) _timeOverlayThumb.load();
			}
		}
		
		function _muteHandler() {
			var state = _api.jwGetMute();
			_toggleButton("mute", state);
			_setVolume(state ? 0 : _currentVolume);
		}

		function _volumeHandler() {
			_currentVolume = _api.jwGetVolume() / 100;
			_setVolume(_currentVolume);
		}

		function _bufferHandler(evt) {
			_setBuffer(evt.bufferPercent / 100);
		}
		
		function _fullscreenHandler(evt) {
			_toggleButton("fullscreen", evt.fullscreen);
			_updateNextPrev();
		}
		
		function _playlistHandler() {
			_css(_internalSelector(".jwhd"), HIDDEN);
			_css(_internalSelector(".jwcc"), HIDDEN);
			_updateNextPrev();
			_redraw();
		}
		
		function _hasHD() {
			return (_levels && _levels.length > 1 && _hdOverlay);
		}
		
		function _qualityHandler(evt) {
			_levels = evt.levels;
			if (_hasHD()) {
				_css(_internalSelector(".jwhd"), NOT_HIDDEN);
				_hdOverlay.clearOptions();
				for (var i=0; i<_levels.length; i++) {
					_hdOverlay.addOption(_levels[i].label, i);
				}
				_qualityLevelChanged(evt);
			} else {
				_css(_internalSelector(".jwhd"), HIDDEN);
			}
			_redraw();
		}
		
		function _qualityLevelChanged(evt) {
			_currentQuality = evt.currentQuality|0;
			if (_elements.hd) {
				_elements.hd.querySelector("button").className = (_levels.length === 2 && _currentQuality === 0) ? "off" : "";
			}
			if (_hdOverlay && _currentQuality >= 0) {
				_hdOverlay.setActive(evt.currentQuality);
			}
		}
		
		function _hasCaptions() {
			return (_captions && _captions.length > 1 && _ccOverlay);			
		}
		
		function _captionsHandler(evt) {
			_captions = evt.tracks;
			if (_hasCaptions()) {
				_css(_internalSelector(".jwcc"), NOT_HIDDEN);
				_ccOverlay.clearOptions();
				for (var i=0; i<_captions.length; i++) {
					_ccOverlay.addOption(_captions[i].label, i);
				}
				_captionChanged(evt);
			} else {
				_css(_internalSelector(".jwcc"), HIDDEN );
			}
			_redraw();
		}
		
		function _captionChanged(evt) {
			if (!_captions) return;
			_currentCaptions = evt.track|0;
			if (_elements.cc) {
				_elements.cc.querySelector("button").className = (_captions.length === 2 && _currentCaptions === 0) ? "off" : "";
			}
			if (_ccOverlay && _currentCaptions >= 0) {
				_ccOverlay.setActive(evt.track);
			}
		}

		// Bit of a hacky way to determine if the playlist is available
		function _sidebarShowing() {
			return (!!DOCUMENT.querySelector("#"+_api.id+" .jwplaylist") && !_api.jwGetFullscreen());
		}
		
		/**
		 * Styles specific to this controlbar/skin
		 */
		function _createStyles() {
			_settings = utils.extend({}, _defaults, _skin.getComponentSettings('controlbar'), config);

			_bgHeight = _getSkinElement("background").height;
			
			var margin = _audioMode ? 0 : _settings.margin;
			var styles = {
				height: _bgHeight,
				bottom: margin,
				left: margin,
				right: margin
			};
			if (!_audioMode) {
				styles['max-width'] = _settings.maxWidth;
			}
			_css.style(_controlbar, styles);
			
			_css(_internalSelector(".jwtext"), {
				font: _settings.fontsize + "px/" + _getSkinElement("background").height + "px " + _settings.font,
				color: _settings.fontcolor,
				'font-weight': _settings.fontweight
			});

			_css(_internalSelector(".jwoverlay"), {
				bottom: _bgHeight
			});
		}

		
		function _internalSelector(name) {
			return '#' + _id + (name ? " " + name : "");
		}

		function _createSpan() {
			return _createElement("span");
		}
		
		function _createElement(tagname) {
			return DOCUMENT.createElement(tagname);
		}
		
		function _buildControlbar() {
			var capLeft = _buildImage("capLeft");
			var capRight = _buildImage("capRight");
			var bg = _buildImage("background", {
				position: JW_CSS_ABSOLUTE,
				left: _getSkinElement('capLeft').width,
				right: _getSkinElement('capRight').width,
				'background-repeat': "repeat-x"
			}, TRUE);

			if (bg) _appendChild(_controlbar, bg);
			if (capLeft) _appendChild(_controlbar, capLeft);
			_buildLayout();
			if (capRight) _appendChild(_controlbar, capRight);
		}
		
		function _buildElement(element,pos) {
			switch (element.type) {
			case CB_TEXT:
				return _buildText(element.name);
			case CB_BUTTON:
				if (element.name != "blank") {
					return _buildButton(element.name,pos);
				}
				break;
			case CB_SLIDER:
				return _buildSlider(element.name);
			}
		}
		
		function _buildImage(name, style, stretch, nocenter, vertical) {
			var element = _createSpan(),
				skinElem = _getSkinElement(name),
				center = nocenter ? " left center" : " center",
				size = _elementSize(skinElem),
				newStyle;

			element.className = 'jw'+name;
			element.innerHTML = "&nbsp;";
			
			if (!skinElem || !skinElem.src) {
				return;
			}

			if (stretch) {
				newStyle = {
					background: "url('" + skinElem.src + "') repeat-x " + center,
					'background-size': size,
					height: vertical ? skinElem.height : UNDEFINED 
				};
			} else {
				newStyle = {
					background: "url('" + skinElem.src + "') no-repeat" + center,
					'background-size': size,
					width: skinElem.width,
					height: vertical ? skinElem.height : UNDEFINED 
				};
			}
			element.skin = skinElem;
			_css(_internalSelector((vertical? ".jwvertical " : "") + '.jw'+name), utils.extend(newStyle, style));
			_elements[name] = element;
			return element;
		}

		function _buildButton(name,pos) {
			if (!_getSkinElement(name + "Button").src) {
				return NULL;
			}

			// Don't show volume or mute controls on mobile, since it's not possible to modify audio levels in JS
			if (_isMobile && (name == "mute" || name.indexOf("volume")===0)) return NULL;
			// Having issues with stock (non-chrome) Android browser and showing overlays.  Just remove HD/CC buttons in that case
			if (_nonChromeAndroid && /hd|cc/.test(name)) return NULL;
			
			
			var element = _createSpan();
			var span = _createSpan();
			var divider = _buildDivider(_dividerElement);
			var button = _createElement("button");
			element.style += " display:inline-block";
			element.className = 'jw'+name + ' jwbuttoncontainer';
			if (pos == "left") {
				_appendChild(element, span);
				_appendChild(element,divider);
			} else {
				_appendChild(element, divider);
				_appendChild(element, span);
			}
			
			if (!_isMobile) {
				button.addEventListener("click", _buttonClickHandler(name), FALSE);	
			}
			else if (name != "hd" && name != "cc") {
				var buttonTouch = new utils.touch(button); 
				buttonTouch.addEventListener(utils.touchEvents.TAP, _buttonClickHandler(name));
			}
			button.innerHTML = "&nbsp;";
			_appendChild(span, button);

			var outSkin = _getSkinElement(name + "Button"),
				overSkin = _getSkinElement(name + "ButtonOver"),
				offSkin = _getSkinElement(name + "ButtonOff");
			
			
			_buttonStyle(_internalSelector('.jw'+name+" button"), outSkin, overSkin, offSkin);
			var toggle = _toggles[name];
			if (toggle) {
				_buttonStyle(_internalSelector('.jw'+name+'.jwtoggle button'), _getSkinElement(toggle+"Button"), _getSkinElement(toggle+"ButtonOver"));
			}

			_elements[name] = element;
			
			return element;
		}
		
		function _buttonStyle(selector, out, over, off) {
			if (!out || !out.src) return;
			
			_css(selector, { 
				width: out.width,
				background: 'url('+ out.src +') no-repeat center',
				'background-size': _elementSize(out)
			});
			
			if (over.src && !_isMobile) {
				_css(selector + ':hover,' + selector + '.off:hover', { 
					background: 'url('+ over.src +') no-repeat center',
					'background-size': _elementSize(over)
				});
			}
			
			if (off && off.src) {
				_css(selector + '.off', { 
					background: 'url('+ off.src +') no-repeat center',
					'background-size': _elementSize(off)
				});
			}
		}
		
		function _buttonClickHandler(name) {
			return function(evt) {
				if (_buttonMapping[name]) {
					_buttonMapping[name]();
					if (_isMobile) {
						_eventDispatcher.sendEvent(events.JWPLAYER_USER_ACTION);
					}
				}
				if (evt.preventDefault) {
					evt.preventDefault();
				}
			};
		}
		

		function _play() {
			if (_toggleStates.play) {
				_api.jwPause();
			} else {
				_api.jwPlay();
			}
		}
		
		function _mute() {
			_api.jwSetMute(!_toggleStates.mute);
			_muteHandler({mute:_toggleStates.mute});
		}

		function _hideOverlays(exception) {
			utils.foreach(_overlays, function(i, overlay) {
				if (i != exception) {
					if (i == "cc") {
						_clearCcTapTimeout();
					}
					if (i == "hd") {
						_clearHdTapTimeout();
					}
					overlay.hide();
				}
			});
		}
		
		function _hideTimes() {
			if(_controlbar) {
				var jwalt = _getElementBySelector(".jwalt"),
					jwhidden;
				if (!jwalt) return;
				jwhidden = _controlbar.querySelectorAll(".jwhidden");
				if ((_controlbar.parentNode && _controlbar.parentNode.clientWidth >= 320) && !jwalt.firstChild) {
					_css.style(jwhidden, NOT_HIDDEN);				
				} else {
					_css.style(jwhidden, HIDDEN);				
				}
			}
		}
		function _showVolume() {
			if (_audioMode || _instreamMode) return;
			_volumeOverlay.show();
			_hideOverlays('volume');
		}
		
		function _volume(pct) {
			_setVolume(pct);
			if (pct < 0.1) pct = 0;
			if (pct > 0.9) pct = 1;
			_api.jwSetVolume(pct * 100);
		}
		
		// function _showFullscreen() {
		// 	if (_audioMode) return;
		// 	_fullscreenOverlay.show();
		// 	_hideOverlays('fullscreen');
		// }
		
		function _seek(pct) {
			_api.jwSeek(_activeCue ? _activeCue.position : pct * _duration);
		}
		
		function _fullscreen() {
			_api.jwSetFullscreen();
		}

		function _next() {
			_api.jwPlaylistNext();
		}

		function _prev() {
			_api.jwPlaylistPrev();
		}

		function _toggleButton(name, state) {
			if (!utils.exists(state)) {
				state = !_toggleStates[name];
			}
			if (_elements[name]) {
				_elements[name].className = 'jw' + name + (state ? " jwtoggle jwtoggling" : " jwtoggling");
				// Use the jwtoggling class to temporarily disable the animation
				setTimeout(function() {
					_elements[name].className = _elements[name].className.replace(" jwtoggling", ""); 
				}, 100);
			}
			_toggleStates[name] = state;
		}
		
		function _createElementId(name) {
			return _id + "_" + name;
		}
		
		function _buildText(name) {
			var css = {},
				skinName = (name == "alt") ? "elapsed" : name,
				skinElement = _getSkinElement(skinName+"Background");
			if (skinElement.src) {
				var element = _createSpan();
				element.id = _createElementId(name); 
				if (name == "elapsed" || name == "duration")
					element.className = "jwtext jw" + name + " jwhidden";
				else
					element.className = "jwtext jw" + name;
				css.background = "url(" + skinElement.src + ") repeat-x center";
				css['background-size'] = _elementSize(_getSkinElement("background"));
				_css(_internalSelector('.jw'+name), css);
				element.innerHTML = (name != "alt") ? "00:00" : "";
				
				_elements[name] = element;
				return element;
			}
			return null;
		}
		
		function _elementSize(skinElem) {
			return skinElem ? parseInt(skinElem.width, 10) + "px " + parseInt(skinElem.height, 10) + "px" : "0 0";
		}
		
		function _buildDivider(divider) {
			var element = _buildImage(divider.name);
			if (!element) {
				element = _createSpan();
				element.className = "jwblankDivider";
			}
			if (divider.className) element.className += " " + divider.className;
			return element;
		}
		
		function _showHd() {
			if (_levels && _levels.length > 2) {
				if (_hdTimer) {
					clearTimeout(_hdTimer);
					_hdTimer = UNDEFINED;
				}
				_hdOverlay.show();
				_hideOverlays('hd');
			}
		}
		
		function _showCc() {
			if (_captions && _captions.length > 2) {
				if (_ccTimer) {
					clearTimeout(_ccTimer);
					_ccTimer = UNDEFINED;
				}
				_ccOverlay.show();
				_hideOverlays('cc');
			}
		}

		function _switchLevel(newlevel) {
			if (newlevel >= 0 && newlevel < _levels.length) {
				_api.jwSetCurrentQuality(newlevel);
				_clearHdTapTimeout();
				_hdOverlay.hide();
			}
		}
		
		function _switchCaption(newcaption) {
			if (newcaption >= 0 && newcaption < _captions.length) {
				_api.jwSetCurrentCaptions(newcaption);
				_clearCcTapTimeout();
				_ccOverlay.hide();
			}
		}

		function _cc() {
			if (_captions.length != 2) return;
			_switchCaption((_currentCaptions + 1) % 2); 
		}

		function _hd() {
			if (_levels.length != 2) return;
			_switchLevel((_currentQuality + 1) % 2);
		}
		
		function _buildSlider(name) {
			if (_isMobile && name.indexOf("volume") === 0) return;
			
			var slider = _createSpan(),
				vertical = name == "volume",
				skinPrefix = name + (name=="time"?"Slider":""),
				capPrefix = skinPrefix + "Cap",
				left = vertical ? "Top" : "Left",
				right = vertical ? "Bottom" : "Right",
				capLeft = _buildImage(capPrefix + left, NULL, FALSE, FALSE, vertical),
				capRight = _buildImage(capPrefix + right, NULL, FALSE, FALSE, vertical),
				rail = _buildSliderRail(name, vertical, left, right),
				capLeftSkin = _getSkinElement(capPrefix+left),
				capRightSkin = _getSkinElement(capPrefix+left);
				//railSkin = _getSkinElement(name+"SliderRail");
			
			slider.className = "jwslider jw" + name;
			
			if (capLeft) _appendChild(slider, capLeft);
			_appendChild(slider, rail);
			if (capRight) {
				if (vertical) capRight.className += " jwcapBottom";
				_appendChild(slider, capRight);
			}

			_css(_internalSelector(".jw" + name + " .jwrail"), {
				left: vertical ? UNDEFINED : capLeftSkin.width,
				right: vertical ? UNDEFINED : capRightSkin.width,
				top: vertical ? capLeftSkin.height : UNDEFINED,
				bottom: vertical ? capRightSkin.height : UNDEFINED,
				width: vertical ? JW_CSS_100PCT : UNDEFINED,
				height: vertical ? "auto" : UNDEFINED
			});

			_elements[name] = slider;
			slider.vertical = vertical;

			if (name == "time") {
				_timeOverlay = new html5.overlay(_id+"_timetooltip", _skin);
				_timeOverlayThumb = new html5.thumbs(_id+"_thumb");
				_timeOverlayText = _createElement("div");
				_timeOverlayText.className = "jwoverlaytext";
				_timeOverlayContainer = _createElement("div");
				_appendChild(_timeOverlayContainer, _timeOverlayThumb.element());
				_appendChild(_timeOverlayContainer, _timeOverlayText);
				_timeOverlay.setContents(_timeOverlayContainer);
				//_overlays.time = _timeOverlay;
				_timeRail = rail;
				_setTimeOverlay(0);
				_appendChild(rail, _timeOverlay.element());
				_styleTimeSlider(slider);
				_setProgress(0);
				_setBuffer(0);
			} else if (name.indexOf("volume")===0) {
				_styleVolumeSlider(slider, vertical, left, right);
			}
			
			return slider;
		}
		
		function _buildSliderRail(name, vertical, left, right) {
			var rail = _createSpan(),
				railElements = ['Rail', 'Buffer', 'Progress'],
				progressRail,
				sliderPrefix;
			
			rail.className = "jwrail jwsmooth";

			for (var i=0; i<railElements.length; i++) {
				sliderPrefix = (name=="time"?"Slider":"");
				var prefix = name + sliderPrefix + railElements[i],
					element = _buildImage(prefix, NULL, !vertical, (name.indexOf("volume")===0), vertical),
					capLeft = _buildImage(prefix + "Cap" + left, NULL, FALSE, FALSE, vertical),
					capRight = _buildImage(prefix + "Cap" + right, NULL, FALSE, FALSE, vertical),
					capLeftSkin = _getSkinElement(prefix + "Cap" + left),
					capRightSkin = _getSkinElement(prefix + "Cap" + right);

				if (element) {
					var railElement = _createSpan();
					railElement.className = "jwrailgroup " + railElements[i];
					if (capLeft) _appendChild(railElement, capLeft);
					_appendChild(railElement, element);
					if (capRight) { 
						_appendChild(railElement, capRight);
						capRight.className += " jwcap" + (vertical ? "Bottom" : "Right");
					}
					
					_css(_internalSelector(".jwrailgroup." + railElements[i]), {
						'min-width': (vertical ? UNDEFINED : capLeftSkin.width + capRightSkin.width)
					});
					railElement.capSize = vertical ? capLeftSkin.height + capRightSkin.height : capLeftSkin.width + capRightSkin.width;
					
					_css(_internalSelector("." + element.className), {
						left: vertical ? UNDEFINED : capLeftSkin.width,
						right: vertical ? UNDEFINED : capRightSkin.width,
						top: vertical ? capLeftSkin.height : UNDEFINED,
						bottom: vertical ? capRightSkin.height : UNDEFINED,
						height: vertical ? "auto" : UNDEFINED
					});

					if (i == 2) progressRail = railElement;
					
					if (i == 2 && !vertical) {
						var progressContainer = _createSpan();
						progressContainer.className = "jwprogressOverflow";
						_appendChild(progressContainer, railElement);
						_elements[prefix] = progressContainer;
						_appendChild(rail, progressContainer);
					} else {
						_elements[prefix] = railElement;
						_appendChild(rail, railElement);
					}
				}
			}
			
			var thumb = _buildImage(name + sliderPrefix + "Thumb", NULL, FALSE, FALSE, vertical);
			if (thumb) {
				_css(_internalSelector('.'+thumb.className), {
					opacity: name == "time" ? 0 : 1,
					'margin-top': vertical ? thumb.skin.height / -2 : UNDEFINED
				});
				
				thumb.className += " jwthumb";
				_appendChild(vertical && progressRail ? progressRail : rail, thumb);
			}
			
			if (!_isMobile) {
				var sliderName = name;
				if (sliderName == "volume" && !vertical) sliderName += "H";
				rail.addEventListener('mousedown', _sliderMouseDown(sliderName), FALSE);
			}
			else {
				var railTouch = new utils.touch(rail);
				railTouch.addEventListener(utils.touchEvents.DRAG_START, _sliderDragStart);
				railTouch.addEventListener(utils.touchEvents.DRAG, _sliderDragEvent);
				railTouch.addEventListener(utils.touchEvents.DRAG_END, _sliderDragEvent);
				railTouch.addEventListener(utils.touchEvents.TAP, _sliderTapEvent);
			}
			
			if (name == "time" && !_isMobile) {
				rail.addEventListener('mousemove', _showTimeTooltip, FALSE);
				rail.addEventListener('mouseout', _hideTimeTooltip, FALSE);
			}
			
			_elements[name+'Rail'] = rail;
			
			return rail;
		}
		
		function _idle() {
			var currentState = _api.jwGetState();
			return (currentState == states.IDLE); 
		}

		function _killSelect(evt) {
			evt.preventDefault();
			DOCUMENT.onselectstart = function () { return FALSE; };
		}

		function _sliderDragStart() {
			_elements.timeRail.className = "jwrail";
			if (!_idle()) {
				_api.jwSeekDrag(TRUE);
				_dragging = "time";
				_showTimeTooltip();
				_eventDispatcher.sendEvent(events.JWPLAYER_USER_ACTION);
			}
		}

		function _sliderDragEvent(evt) {
			if (!_dragging) return;

			var currentTime = (new Date()).getTime();

			if (currentTime - _lastTooltipPositionTime > 50) {
				_positionTimeTooltip(evt);
				_lastTooltipPositionTime = currentTime;
			}

			var rail = _elements[_dragging].querySelector('.jwrail'),
				railRect = utils.bounds(rail),
				pct = evt.x / railRect.width;
			if (pct > 100) {
				pct = 100;
			}
			if (evt.type == utils.touchEvents.DRAG_END) {
				_api.jwSeekDrag(FALSE);
				_elements.timeRail.className = "jwrail jwsmooth";
				_dragging = NULL;
				_sliderMapping['time'](pct);
				_hideTimeTooltip();
				_eventDispatcher.sendEvent(events.JWPLAYER_USER_ACTION);
			}
			else {
				_setProgress(pct);
				if (currentTime - _lastSeekTime > 500) {
					_lastSeekTime = currentTime;
					_sliderMapping['time'](pct);
				}
				_eventDispatcher.sendEvent(events.JWPLAYER_USER_ACTION);
			}
		}

		function _sliderTapEvent(evt) {
			var rail = _elements.time.querySelector('.jwrail'),
				railRect = utils.bounds(rail),
				pct = evt.x / railRect.width;		
			if (pct > 100) {
				pct = 100;
			}
			if (!_idle()) {
				_sliderMapping.time(pct);
				_eventDispatcher.sendEvent(events.JWPLAYER_USER_ACTION);
			}
		}

		function _sliderMouseDown(name) {
			return (function(evt) {
				if (evt.button)
					return;
				
				_elements[name+'Rail'].className = "jwrail";
				
				if (name == "time") {
					if (!_idle()) {
						_api.jwSeekDrag(TRUE);
						_dragging = name;
					}
				} else {
					_dragging = name;
				}
				
			});
		}
		
		function _sliderMouseEvent(evt) {
			
			var currentTime = (new Date()).getTime();
			
			if (currentTime - _lastTooltipPositionTime > 50) {
				_positionTimeTooltip(evt);
				_lastTooltipPositionTime = currentTime;
			}
			
			if (!_dragging || evt.button) {
				return;
			}
			
			var rail = _elements[_dragging].querySelector('.jwrail'),
				railRect = utils.bounds(rail),
				name = _dragging,
				pct = _elements[name].vertical ? (railRect.bottom - evt.pageY) / railRect.height : (evt.pageX - railRect.left) / railRect.width;
			
			if (evt.type == 'mouseup') {
				if (name == "time") {
					_api.jwSeekDrag(FALSE);
				}

				_elements[name+'Rail'].className = "jwrail jwsmooth";
				_dragging = NULL;
				_sliderMapping[name.replace("H", "")](pct);
			} else {
				if (_dragging == "time") {
					_setProgress(pct);
				} else {
					_setVolume(pct);
				}
				if (currentTime - _lastSeekTime > 500) {
					_lastSeekTime = currentTime;
					_sliderMapping[_dragging.replace("H", "")](pct);
				}
			}
			return false;
		}

		function _showTimeTooltip() {
			if (_timeOverlay && _duration && !_audioMode && !_isMobile) {
				_positionOverlay(_timeOverlay);
				_timeOverlay.show();
			}
		}
		
		function _hideTimeTooltip() {
			if (_timeOverlay) {
				_timeOverlay.hide();
			}
		}
		
		function _positionTimeTooltip(evt) {
			_railBounds = utils.bounds(_timeRail);
			if (!_railBounds || _railBounds.width === 0) return;
			_cbBounds = utils.bounds(_controlbar);
			var element = _timeOverlay.element(), 
				position = evt.pageX ? ((evt.pageX - _railBounds.left) - WINDOW.pageXOffset) : (evt.x);
			if (position >= 0 && position <= _railBounds.width) {
				_setTimeOverlay(_duration * position / _railBounds.width);
				_css.style(element, {left: Math.round(position)});
			}
		}
		
		function _setTimeOverlay(sec) {
			_timeOverlayText.innerHTML = _activeCue ? _activeCue.text : utils.timeFormat(sec);
			_timeOverlayThumb.updateTimeline(sec); 
			_timeOverlay.setContents(_timeOverlayContainer);
			_positionOverlay(_timeOverlay);
		}
		
		function _styleTimeSlider() {
			if (!_elements.timeSliderRail) {
				_css(_internalSelector(".jwtime"), HIDDEN);
			}

			if (_elements.timeSliderThumb) {
				_css.style(_elements.timeSliderThumb, {
					'margin-left': (_getSkinElement("timeSliderThumb").width/-2)
				});
			}

			var cueClass = "timeSliderCue", 
				cue = _getSkinElement(cueClass),
				cueStyle = {
					'z-index': 1
				};
			
			if (cue && cue.src) {
				_buildImage(cueClass);
			} else {
				cueStyle.display = JW_CSS_NONE;
			}
			_css(_internalSelector(".jw" + cueClass), cueStyle);
			
			_setBuffer(0);
			_setProgress(0);
		}
		
		function _addCue(timePos, text) {
			if (timePos.toString().search(/^[\d\.]+%?$/) >= 0) {
				var cueElem = _buildImage("timeSliderCue"),
					rail = _controlbar.querySelector(".jwtimeSliderRail"),
					cue = {
						position: timePos,
						text: text,
						element: cueElem};
				
				
				if (cueElem && rail) {
					rail.appendChild(cueElem);
					cueElem.addEventListener("mouseover", function() { _activeCue = cue; }, false);
					cueElem.addEventListener("mouseout", function() { _activeCue = NULL; }, false);
				}

				_cues.push(cue);
			}
			_drawCues();
		}
		
		function _drawCues() {
			utils.foreach(_cues, function(idx, cue) {
				if (cue.position.toString().search(/^[\d\.]+%$/) > -1) cue.element.style.left = cue.position;
				else cue.element.style.left = (100 * cue.position / _duration) + "%";
			});
		}
		
		function _removeCues() {
			var rail = _controlbar.querySelector(".jwtimeSliderRail");
			utils.foreach(_cues, function(idx, cue) {
				rail.removeChild(cue.element);
			});
			_cues = [];	
		}
		
		_this.setText = function(text) {
			_css.block(_id); //unblock on redraw
			if (!_elements.timeSliderRail) {
				_css.style(_controlbar.querySelector(".jwtime"), HIDDEN);
			} else {
				_css.style(_controlbar.querySelector(".jwtime"), text ? HIDDEN : SHOWING);
			}
			var jwalt = _getElementBySelector(".jwalt");
			if (jwalt) {
				_css.style(jwalt, text ? SHOWING : HIDDEN);
				jwalt.innerHTML = text || "";
			}
			_redraw();
		};
		
		function _getElementBySelector(selector) {
			return _controlbar.querySelector(selector);
		}
		
		function _styleVolumeSlider(slider, vertical, left, right) {
			var prefix = "volume" + (vertical ? "" : "H"),
				direction = vertical ? "vertical" : "horizontal";
			
			_css(_internalSelector(".jw"+prefix+".jw" + direction), {
				width: _getSkinElement(prefix+"Rail", vertical).width + (vertical ? 0 : 
					(_getSkinElement(prefix+"Cap"+left).width + 
					_getSkinElement(prefix+"RailCap"+left).width +
					_getSkinElement(prefix+"RailCap"+right).width + 
					_getSkinElement(prefix+"Cap"+right).width)
				),
				height: vertical ? (
					_getSkinElement(prefix+"Cap"+left).height + 
					_getSkinElement(prefix+"Rail").height + 
					_getSkinElement(prefix+"RailCap"+left).height + 
					_getSkinElement(prefix+"RailCap"+right).height + 
					_getSkinElement(prefix+"Cap"+right).height
				) : UNDEFINED
			});
			
			slider.className += " jw" + direction;
		}
		
		var _groups = {};
		
		function _buildLayout() {
			_buildGroup("left");
			_buildGroup("center");
			_buildGroup("right");
			_appendChild(_controlbar, _groups.left);
			_appendChild(_controlbar, _groups.center);
			_appendChild(_controlbar, _groups.right);
			_buildOverlays();
			
			_css(_internalSelector(".jwright"), {
				right: _getSkinElement("capRight").width
			});
		}

		function _buildOverlays() {
			if (_elements.hd) {
				_hdOverlay = new html5.menu('hd', _id+"_hd", _skin, _switchLevel);
				if (!_isMobile) {
					_addOverlay(_hdOverlay, _elements.hd, _showHd, _setHdTimer);
				}
				else {
					_addMobileOverlay(_hdOverlay, _elements.hd, _showHd, "hd");
				}
				_overlays.hd = _hdOverlay;
			}
			if (_elements.cc) {
				_ccOverlay = new html5.menu('cc', _id+"_cc", _skin, _switchCaption);
				if (!_isMobile) {
					_addOverlay(_ccOverlay, _elements.cc, _showCc, _setCcTimer);
				}
				else {
					_addMobileOverlay(_ccOverlay, _elements.cc, _showCc, "cc");	
				}
				_overlays.cc = _ccOverlay;
			}
			if (_elements.mute && _elements.volume && _elements.volume.vertical) {
				_volumeOverlay = new html5.overlay(_id+"_volumeoverlay", _skin);
				_volumeOverlay.setContents(_elements.volume);
				_addOverlay(_volumeOverlay, _elements.mute, _showVolume);
				_overlays.volume = _volumeOverlay;
			}
		}
		
		function _setCcTimer() {
			_ccTimer = setTimeout(_ccOverlay.hide, 500);
		}

		function _setHdTimer() {
			_hdTimer = setTimeout(_hdOverlay.hide, 500);
		}

		function _addOverlay(overlay, button, hoverAction, timer) {
			if (_isMobile) return;
			var element = overlay.element();
			_appendChild(button, element);
			button.addEventListener('mousemove', hoverAction, FALSE);
			if (timer) {
				button.addEventListener('mouseout', timer, FALSE);	
			}
			else {
				button.addEventListener('mouseout', overlay.hide, FALSE);
			}
		}

		function _addMobileOverlay(overlay, button, tapAction, name) {
			if (!_isMobile) return;
			var element = overlay.element();
			_appendChild(button, element);
			var buttonTouch = new utils.touch(button); 
			buttonTouch.addEventListener(utils.touchEvents.TAP, function() {
				_overlayTapHandler(overlay, tapAction, name);
			});
		}

		function _overlayTapHandler(overlay, tapAction, name) {
			if (name == "cc") {
				if (_captions.length == 2) tapAction = _cc;
				if (_ccTapTimer) {
					_clearCcTapTimeout();
					overlay.hide();
				}
				else {
					_ccTapTimer = setTimeout(function () {
						overlay.hide(); 
						_ccTapTimer = UNDEFINED;
					}, 4000);
					tapAction();
				}
				_eventDispatcher.sendEvent(events.JWPLAYER_USER_ACTION);
			}
			else if (name == "hd") {
				if (_levels.length == 2) tapAction = _hd;
				if (_hdTapTimer) {
					_clearHdTapTimeout();
					overlay.hide();
				}
				else {
					_hdTapTimer = setTimeout(function () {
						overlay.hide(); 
						_hdTapTimer = UNDEFINED;
					}, 4000);
					tapAction();
				}
				_eventDispatcher.sendEvent(events.JWPLAYER_USER_ACTION);
			}	
		}
		
		function _buildGroup(pos) {
			var elem = _createSpan();
			elem.className = "jwgroup jw" + pos;
			_groups[pos] = elem;
			if (_layout[pos]) {
				_buildElements(_layout[pos], _groups[pos],pos);
			}
		}
		
		function _buildElements(group, container,pos) {
			if (group && group.elements.length > 0) {
				for (var i=0; i<group.elements.length; i++) {
					var element = _buildElement(group.elements[i],pos);
					if (element) {
						if (group.elements[i].name == "volume" && element.vertical) {
							_volumeOverlay = new html5.overlay(_id+"_volumeOverlay", _skin);
							_volumeOverlay.setContents(element);
						} else {
							_appendChild(container, element);
						}
					}
				}
			}
		}

		var _redraw = function() {
			clearTimeout(_redrawTimeout);
			_redrawTimeout = setTimeout(_this.redraw, 0);
		};

		_this.redraw = function(resize) {
			_css.block(_id);

			if (resize && _this.visible) {
				_this.show(TRUE);
			}
			_createStyles();
			var capLeft = _getSkinElement("capLeft"),
				capRight = _getSkinElement("capRight"),
				centerCss = {
					left:  Math.round(utils.parseDimension(_groups.left.offsetWidth) + capLeft.width),
					right: Math.round(utils.parseDimension(_groups.right.offsetWidth) + capRight.width)
				},
				ieIframe = (top !== window.self) && utils.isIE();
			_css.style(_groups.center, centerCss);

			// ie <= IE10 does not allow fullscreen from inside an iframe. Hide the FS button. (TODO: Fix for IE11)
			_css(_internalSelector(".jwfullscreen"), {
				display: (_audioMode || _hideFullscreen || ieIframe) ? JW_CSS_NONE : UNDEFINED
			});
			_css(_internalSelector(".jwvolumeH"), {
				display: _audioMode || _instreamMode ? JW_CSS_BLOCK : JW_CSS_NONE
			});
			_css(_internalSelector(".jwhd"), {
				display: !_audioMode && _hasHD() ? UNDEFINED : JW_CSS_NONE
			});
			_css(_internalSelector(".jwcc"), {
				display: !_audioMode && _hasCaptions() ? UNDEFINED : JW_CSS_NONE
			});

			_drawCues();

			for (var i in _overlays) {
				_positionOverlay(_overlays[i]);
			}

			_css.unblock(_id);
		};
		
		function _updateNextPrev() {
			if (_api.jwGetPlaylist().length > 1 && !_sidebarShowing()) {
				_css(_internalSelector(".jwnext"), NOT_HIDDEN);
				_css(_internalSelector(".jwprev"), NOT_HIDDEN);
			} else {
				_css(_internalSelector(".jwnext"), HIDDEN);
				_css(_internalSelector(".jwprev"), HIDDEN);
			}
		}

		// var _pCount = 0;
		function _positionOverlay(overlay) {
			var id = _id + '_overlay';
			_css.block(id);
			overlay.offsetX(0);
			var overlayBounds = utils.bounds(overlay.element());
			if (!_cbBounds) {
				_cbBounds = utils.bounds(_controlbar);
			}
			if (overlayBounds.right > _cbBounds.right) {
				overlay.offsetX(_cbBounds.right - overlayBounds.right);
			} else if (overlayBounds.left < _cbBounds.left) {
				overlay.offsetX(_cbBounds.left - overlayBounds.left);
			}
			_css.unblock(id);
		}
		

		_this.audioMode = function(mode) {
			if (mode != _audioMode) {
				_audioMode = mode;
				_redraw();
			}
		};
		
	   _this.instreamMode = function(mode) {
			if (mode != _instreamMode) {
				_instreamMode = mode;
			}
		};

		/** Whether or not to show the fullscreen icon - used when an audio file is played **/
		_this.hideFullscreen = function(mode) {
			if (mode != _hideFullscreen) {
				_hideFullscreen = mode;
				_redraw();
			}
		};

		_this.element = function() {
			return _controlbar;
		};

		_this.margin = function() {
			return parseInt(_settings.margin, 10);
		};
		
		_this.height = function() {
			return _bgHeight;
		};
		

		function _setBuffer(pct) {
			pct = Math.min(Math.max(0, pct), 1);
			if (_elements.timeSliderBuffer) {
				_elements.timeSliderBuffer.style.width = pct * 100 + "%";
				_elements.timeSliderBuffer.style.opacity = pct > 0 ? 1 : 0;
			}
		}

		function _sliderPercent(name, pct) {
			if (!_elements[name]) return;
			var vertical = _elements[name].vertical,
				prefix = name + (name=="time"?"Slider":""),
				size = 100 * Math.min(Math.max(0, pct), 1) + "%",
				progress = _elements[prefix+'Progress'],
				thumb = _elements[prefix+'Thumb'];
			
			// Set style directly on the elements; Using the stylesheets results in some flickering in Chrome.
			if (progress) {
				if (vertical) {
					progress.style.height = size;
					progress.style.bottom = 0;
				} else {
					progress.style.width = size;
				}
				progress.style.opacity = (pct > 0 || _dragging) ? 1 : 0;
			}
			
			if (thumb) {
				if (vertical) {
					thumb.style.top = 0;
				} else {
					thumb.style.left = size;
				}
			}
		}
		
		function _setVolume (pct) {
			_sliderPercent('volume', pct);	
			_sliderPercent('volumeH', pct);	
		}

		function _setProgress(pct) {
			_sliderPercent('time', pct);
		}

		function _getSkinElement(name) {
			var component = 'controlbar', elem, newname = name;
			if (name.indexOf("volume") === 0) {
				if (name.indexOf("volumeH") === 0) newname = name.replace("volumeH", "volume");
				else component = "tooltip";
			} 
			elem = _skin.getSkinElement(component, newname);
			if (elem) {
				return elem;
			} else {
				return {
					width: 0,
					height: 0,
					src: "",
					image: UNDEFINED,
					ready: FALSE
				};
			}
		}
		
		function _appendChild(parent, child) {
			parent.appendChild(child);
		}
		
		
		//because of size impacting whether to show duration/elapsed time, optional resize argument overrides the this.visible return clause.
		_this.show = function(resize) {
			if (_this.visible && !resize) return;

			_this.visible = true;
			_css.style(_controlbar, {display: JW_CSS_INLINE_BLOCK});
			_hideTimes();
			_cbBounds = utils.bounds(_controlbar);

			_css.block(_id); //unblock on redraw

			_muteHandler();
			_redraw();

			_clearHideTimeout();
			_hideTimeout = setTimeout(function() {
				_controlbar.style.opacity = 1;
			}, 0);
		};
		
		_this.showTemp = function() {
			if (!this.visible) {
				_controlbar.style.opacity = 0;
				_controlbar.style.display = JW_CSS_INLINE_BLOCK;
			}
		};
		
		_this.hideTemp = function() {
			if (!this.visible) {
				_controlbar.style.display = JW_CSS_NONE;
			}
		};
		
		
		function _clearHideTimeout() {
			clearTimeout(_hideTimeout);
			_hideTimeout = -1;
		}

		function _clearCcTapTimeout() {
			clearTimeout(_ccTapTimer);
			_ccTapTimer = UNDEFINED;
		}

		function _clearHdTapTimeout() {
			clearTimeout(_hdTapTimer);
			_hdTapTimer = UNDEFINED;
		}
		
		function _loadCues(vttFile) {
			if (vttFile) {
				utils.ajax(vttFile, _cueLoaded, _cueFailed);
		   } else {
				_cues = [];
		   }
		}
		
		function _cueLoaded(xmlEvent) {
			var data = new jwplayer.parsers.srt().parse(xmlEvent.responseText,true);
			if (utils.typeOf(data) !== TYPEOF_ARRAY) {
				return _cueFailed("Invalid data");
			}
			_this.addCues(data);
		}

		_this.addCues = function(cues) {
			utils.foreach(cues,function(idx,elem) {
				if (elem.text) _addCue(elem.begin,elem.text);
			});
		}
		
		function _cueFailed(error) {
			utils.log("Cues failed to load: " + error);
		}

		_this.hide = function() {
			if (!_this.visible) return;
			_this.visible = false;
			_controlbar.style.opacity = 0;
			_clearHideTimeout();
			_hideTimeout = setTimeout(function() {
				_controlbar.style.display = JW_CSS_NONE;
			}, JW_VISIBILITY_TIMEOUT);
		};
		
		
		
		// Call constructor
		_init();

	};

	/***************************************************************************
	 * Player stylesheets - done once on script initialization; * These CSS
	 * rules are used for all JW Player instances *
	 **************************************************************************/

	_css(CB_CLASS, {
		position: JW_CSS_ABSOLUTE,
		margin: 'auto',
		opacity: 0,
		display: JW_CSS_NONE
	});
	
	_css(CB_CLASS+' span', {
		height: JW_CSS_100PCT
	});
	utils.dragStyle(CB_CLASS+' span', JW_CSS_NONE);
	
	_css(CB_CLASS+' .jwgroup', {
		display: JW_CSS_INLINE
	});
	
	_css(CB_CLASS+' span, '+CB_CLASS+' .jwgroup button,'+CB_CLASS+' .jwleft', {
		position: JW_CSS_RELATIVE,
		'float': JW_CSS_LEFT
	});
	
	_css(CB_CLASS+' .jwright', {
		position: JW_CSS_ABSOLUTE
	});
	
	_css(CB_CLASS+' .jwcenter', {
		position: JW_CSS_ABSOLUTE
	});
	
	_css(CB_CLASS+' buttoncontainer,'+CB_CLASS+' button', {
		display: JW_CSS_INLINE_BLOCK,
		height: JW_CSS_100PCT,
		border: JW_CSS_NONE,
		cursor: 'pointer'
	});

	_css(CB_CLASS+' .jwcapRight,'+CB_CLASS+' .jwtimeSliderCapRight,'+CB_CLASS+' .jwvolumeCapRight', { 
		right: 0,
		position: JW_CSS_ABSOLUTE
	});

	_css(CB_CLASS+' .jwcapBottom', { 
		bottom: 0,
		position: JW_CSS_ABSOLUTE
	});

	_css(CB_CLASS+' .jwtime', {
		position: JW_CSS_ABSOLUTE,
		height: JW_CSS_100PCT,
		width: JW_CSS_100PCT,
		left: 0
	});
	
	_css(CB_CLASS + ' .jwthumb', {
		position: JW_CSS_ABSOLUTE,
		height: JW_CSS_100PCT,
		cursor: 'pointer'
	});
	
	_css(CB_CLASS + ' .jwrail', {
		position: JW_CSS_ABSOLUTE,
		cursor: 'pointer'
	});

	_css(CB_CLASS + ' .jwrailgroup', {
		position: JW_CSS_ABSOLUTE,
		width: JW_CSS_100PCT
	});

	_css(CB_CLASS + ' .jwrailgroup span', {
		position: JW_CSS_ABSOLUTE
	});

	_css(CB_CLASS + ' .jwdivider+.jwdivider', {
		display: JW_CSS_NONE
	});
	
	_css(CB_CLASS + ' .jwtext', {
		padding: '0 5px',
		'text-align': 'center'
	});

	_css(CB_CLASS + ' .jwalt', {
		display: JW_CSS_NONE,
		overflow: 'hidden'
	});

	// important
	_css(CB_CLASS + ' .jwalt', {
		position: JW_CSS_ABSOLUTE,
		left: 0,
		right: 0,
		'text-align': "left"
	}, TRUE);

	_css(CB_CLASS + ' .jwoverlaytext', {
		padding: 3,
		'text-align': 'center'
	});

	_css(CB_CLASS + ' .jwvertical *', {
		display: JW_CSS_BLOCK
	});

	// important
	_css(CB_CLASS + ' .jwvertical .jwvolumeProgress', {
		height: "auto"
	}, TRUE);

	_css(CB_CLASS + ' .jwprogressOverflow', {
		position: JW_CSS_ABSOLUTE,
		overflow: JW_CSS_HIDDEN
	});

	_setTransition(CB_CLASS, JW_CSS_SMOOTH_EASE);
	_setTransition(CB_CLASS + ' button', JW_CSS_SMOOTH_EASE);
	_setTransition(CB_CLASS + ' .jwtime .jwsmooth span', JW_CSS_SMOOTH_EASE + ", width .25s linear, left .05s linear");
	_setTransition(CB_CLASS + ' .jwtoggling', JW_CSS_NONE);

})(jwplayer);