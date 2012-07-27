// TODO: blankButton
/**
 * JW Player HTML5 Controlbar component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		events = jwplayer.events,
		states = events.state,
		_css = utils.css,
		_setTransition = utils.transitionStyle,

		/** Controlbar element types **/
		CB_BUTTON = "button",
		CB_TEXT = "text",
		CB_DIVIDER = "divider",
		CB_SLIDER = "slider",
		
		/** Some CSS constants we should use for minimization **/
		JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block",
		JW_CSS_INLINE = "inline",
		JW_CSS_INLINE_BLOCK = "inline-block",
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_LEFT = "left",
		JW_CSS_RIGHT = "right",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "opacity .15s, background .15s, visibility .15s",
		
		CB_CLASS = '.jwcontrolbar',
		
		FALSE = false,
		TRUE = true,
		NULL = null,
		UNDEFINED = undefined,
		
		WINDOW = window,
		DOCUMENT = document;
	
	/** HTML5 Controlbar class **/
	html5.controlbar = function(api, config) {
		var _api,
			_skin,
			_dividerElement = _layoutElement("divider", CB_DIVIDER),
			_defaults = {
				margin : 10,
				maxwidth: 0,
				font : "Arial,sans-serif",
				fontsize : 10,
				fontcolor : parseInt("000000", 16),
				fontstyle : "normal",
				fontweight : "bold",
				layout : {
					left: {
						position: "left",
						elements: [ 
						   _layoutElement("play", CB_BUTTON), 
						   _dividerElement, 
						   _layoutElement("prev", CB_BUTTON), 
						   _layoutElement("next", CB_BUTTON), 
						   _dividerElement, 
						   _layoutElement("elapsed", CB_TEXT)
						]
					},
					center: {
						position: "center",
						elements: [ _layoutElement("time", CB_SLIDER) ]
					},
					right: {
						position: "right",
						elements: [ 
						    _layoutElement("duration", CB_TEXT), 
						    _dividerElement,
						    _layoutElement("hdOn", CB_BUTTON), 
						    //_layoutElement("ccOn", CB_BUTTON), 
						    _layoutElement("mute", CB_BUTTON), 
						    _layoutElement("volume", CB_SLIDER), 
						    _dividerElement,
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
			_currentVolume,
			_volumeOverlay,
			_timeOverlay,
			_timeOverlayText,
			_hdOverlay,
			_ccOverlay,
			_fullscreenOverlay,
			_audioMode = FALSE,
			_dragging = FALSE,
			_lastSeekTime = 0,
			
			_toggles = {
				play: "pause",
				mute: "unmute",
				fullscreen: "normalscreen",
				hdOn: "hdOff",
				ccOn: "ccOff"
			},
			
			_toggleStates = {
				play: FALSE,
				mute: FALSE,
				fullscreen: FALSE,
				hdOn: FALSE,
				ccOn: FALSE
			},
			
			_buttonMapping = {
				play: _play,
				mute: _mute,
				fullscreen: _fullscreen,
				next: _next,
				prev: _prev,
				hdOn: _hd,
				ccOn: _cc
			},
			
			_sliderMapping = {
				time: _seek,
				volume: _volume
			};
		
			_overlays = {};

		function _layoutElement(name, type) {
			return { name: name, type: type };
		}
		
		function _init() {
			_elements = {};
			
			_api = api;

			_id = _api.id + "_controlbar";
			_duration = _position = 0;

			_controlbar = _createSpan();
			_controlbar.id = _id;
			_controlbar.className = "jwcontrolbar";

			// Slider listeners
			WINDOW.addEventListener('mousemove', _sliderMouseEvent, FALSE);
			WINDOW.addEventListener('mouseup', _sliderMouseEvent, FALSE);

			_skin = _api.skin;
			
			_layout = _skin.getComponentLayout('controlbar');
			if (!_layout) _layout = _defaults.layout;
			utils.clearCss('#'+_id);
			_createStyles();
			_buildControlbar();
			_addEventListeners();
			setTimeout(function() {
				_volumeHandler();
				_muteHandler();
			}, 0);
			
			this.visible = false;
		}
		
		function _addEventListeners() {
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_TIME, _timeUpdated);
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_MUTE, _muteHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_VOLUME, _volumeHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_BUFFER, _bufferHandler);
			_api.jwAddEventListener(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_LOADED, _playlistHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVELS, _qualityHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVEL_CHANGED, _qualityLevelChanged);
		}
		
		function _timeUpdated(evt) {
			var refreshRequired = FALSE,
				timeString;
			
			if (_elements.elapsed) {
				timeString = utils.timeFormat(evt.position);
				_elements.elapsed.innerHTML = timeString;
				refreshRequired = (timeString.length != utils.timeFormat(_position).length);
			}
			if (_elements.duration) {
				timeString = utils.timeFormat(evt.duration);
				_elements.duration.innerHTML = timeString;
				refreshRequired = (refreshRequired || (timeString.length != utils.timeFormat(_duration).length));
			}
			if (evt.duration > 0) {
				_setProgress(evt.position / evt.duration);
			} else {
				_setProgress(0);
			}
			_duration = evt.duration;
			_position = evt.position;
			
			if (refreshRequired) _redraw();
		}
		
		function _stateHandler(evt) {
			switch (evt.newstate) {
			case states.BUFFERING:
			case states.PLAYING:
				_css(_internalSelector('.jwtimeSliderThumb'), { opacity: 1 });
				_toggleButton("play", TRUE);
				break;
			case states.PAUSED:
				if (!_dragging) {
					_toggleButton("play", FALSE);
				}
				break;
			case states.IDLE:
				_toggleButton("play", FALSE);
				_css(_internalSelector('.jwtimeSliderThumb'), { opacity: 0 });
				if (_elements["timeRail"]) {
					_elements["timeRail"].className = "jwrail";
					setTimeout(function() {
						// Temporarily disable the buffer animation
						_elements["timeRail"].className += " jwsmooth";
					}, 100);
				}
				_setBuffer(0);
				_timeUpdated({ position: 0, duration: 0});
				break;
			}
		}
		
		function _muteHandler() {
			var state = _api.jwGetMute();
			_toggleButton("mute", state);
			_setVolume(state ? 0 : _currentVolume)
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
		}
		
		function _playlistHandler(evt) {
			var hidden = { display: JW_CSS_NONE },
				not_hidden = { display: UNDEFINED };
			if (_api.jwGetPlaylist().length < 2 || _sidebarShowing()) {
				_css(_internalSelector(".jwnext"), hidden);
				_css(_internalSelector(".jwprev"), hidden);
			} else {
				_css(_internalSelector(".jwnext"), not_hidden);
				_css(_internalSelector(".jwprev"), not_hidden);
			}
			_css(_internalSelector(".jwhdOn"), hidden);
			_css(_internalSelector(".jwhdOff"), hidden);
			_redraw();
		}
		
		function _qualityHandler(evt) {
			_levels = evt.levels;
			_qualityLevelChanged(evt);
			if (_levels && _levels.length > 1 && _hdOverlay) {
				_css(_internalSelector(".jwhdOn"), { display: UNDEFINED });
				_hdOverlay.clearOptions();
				for (var i=0; i<_levels.length; i++) {
					_hdOverlay.addOption(_levels[i].label, i);
				}
				if (_currentQuality >= 0) {
					_hdOverlay.setActive(evt.currentQuality);
				}
			} else {
				_css(_internalSelector(".jwhdOn"), { display: "none" });
			}
			_redraw();
		}
		
		function _qualityLevelChanged(evt) {
			_currentQuality = evt.currentQuality;
			if (_levels.length == 2) {
				_toggleButton("hdOn", _currentQuality == 0);
			}
		}
		
		// Bit of a hacky way to determine if the playlist is available 
		function _sidebarShowing() {
			return (!!DOCUMENT.querySelector("#"+_api.id+" .jwplaylist"));
		}

		/**
		 * Styles specific to this controlbar/skin
		 */
		function _createStyles() {
			_settings = utils.extend({}, _defaults, _skin.getComponentSettings('controlbar'), config);

			_bgHeight = _getSkinElement("background").height;
			
			_css('#'+_id, {
		  		height: _bgHeight,
		  		bottom: _audioMode ? 0 : _settings.margin
			});
			
			_css(_internalSelector(".jwtext"), {
				font: _settings.fontsize + "px/" + _getSkinElement("background").height + "px " + _settings.font,
				color: _settings.fontcolor,
				'font-weight': _settings.fontweight,
				'font-style': _settings.fontstyle,
				'text-align': 'center',
				padding: '0 5px'
			});

			_css(_internalSelector(".jwoverlay"), {
				bottom: _bgHeight
			});

			
			if (_settings.maxwidth > 0) {
				_css(_internalSelector(), {
					'max-width': _settings.maxwidth
				});
			}
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
		
		function _buildElement(element) {
			switch (element.type) {
			case CB_DIVIDER:
				return _buildDivider(element);
				break;
			case CB_TEXT:
				return _buildText(element.name);
				break;
			case CB_BUTTON:
				if (element.name != "blank") {
					return _buildButton(element.name);
				}
				break;
			case CB_SLIDER:
				return _buildSlider(element.name);
				break;
			}
		}
		
		function _buildImage(name, style, stretch, nocenter, vertical) {
			var element = _createSpan();
			element.className = 'jw'+name;
			
			var center = nocenter ? " left center" : " center";

			var skinElem = _getSkinElement(name);
			element.innerHTML = "&nbsp;";
			if (!skinElem || skinElem.src == "") {
				return;
			}
			
			var newStyle;
			
			if (stretch) {
				newStyle = {
					background: "url('" + skinElem.src + "') repeat-x " + center,
					height: vertical ? skinElem.height : UNDEFINED 
				};
			} else {
				newStyle = {
					background: "url('" + skinElem.src + "') no-repeat" + center,
					width: skinElem.width,
					height: vertical ? skinElem.height : UNDEFINED 
				};
			}
			element.skin = skinElem;
			_css(_internalSelector('.jw'+name), utils.extend(newStyle, style));
			_elements[name] = element;
			return element;
		}

		function _buildButton(name) {
			if (!_getSkinElement(name + "Button").src) {
				return NULL;
			}
			
			var element = _createSpan();
			element.className = 'jw'+name + ' jwbuttoncontainer';
			var button = _createElement("button");
			button.addEventListener("click", _buttonClickHandler(name), FALSE);
			button.innerHTML = "&nbsp;";
			_appendChild(element, button);

			var outSkin = _getSkinElement(name + "Button");
			var overSkin = _getSkinElement(name + "ButtonOver");
			
			
			_buttonStyle(_internalSelector('.jw'+name+" button"), outSkin, overSkin);
			var toggle = _toggles[name];
			if (toggle) {
				_buttonStyle(_internalSelector('.jw'+name+'.jwtoggle button'), _getSkinElement(toggle+"Button"), _getSkinElement(toggle+"ButtonOver"));
			}

			_elements[name] = element;
			
			return element;
		}
		
		function _buttonStyle(selector, out, over) {
			if (!out.src) {
				return;
			}
			
			_css(selector, { 
				width: out.width,
				background: 'url('+ out.src +') center no-repeat'
			});
			
			if (over.src) {
				_css(selector + ':hover', { 
					background: 'url('+ over.src +') center no-repeat'
				});
			}
		}
		
		function _buttonClickHandler(name) {
			return function() {
				if (_buttonMapping[name]) {
					_buttonMapping[name]();
				}
			}
		}
		

		function _play() {
			if (_toggleStates.play) {
				_api.jwPause();
			} else {
				_api.jwPlay();
			}
		}
		
		function _mute() {
			_api.jwSetMute();
			_muteHandler({mute:_toggleStates.mute});
		}

		function _hideOverlays(exception) {
			for (var i in _overlays) {
				if (i != exception && _overlays.hasOwnProperty(i)) {
					_overlays[i].hide();
				}
			}
		}
		
		function _showVolume() {
			_volumeOverlay.show();
			_hideOverlays('volume');
		}
		
		function _volume(pct) {
			_setVolume(pct);
			if (pct < 0.1) pct = 0;
			if (pct > 0.9) pct = 1;
			_api.jwSetVolume(pct * 100);
		}
		
		function _showFullscreen() {
			_fullscreenOverlay.show();
			_hideOverlays('fullscreen');
		}
		
		function _seek(pct) {
			_api.jwSeek(pct * _duration);
		}
		
		function _fullscreen() {
			_api.jwSetFullscreen();
		}

		function _next() {
			_api.jwPlaylistNext();
		}

		function _prev() {
			_api.jwPlaylistNext();
		}

		function _toggleButton(name, state) {
			if (!utils.exists(state)) {
				state = !_toggleStates[name];
			}
			if (_elements[name]) {
				_elements[name].className = 'jw' + name + (state ? " jwtoggle jwtoggling" : " jwtoggling");
				// Use the jwtoggling class to temporarily disable the animation;
				setTimeout(function() {
					_elements[name].className = _elements[name].className.replace(" jwtoggling", ""); 
				}, 100);
			}
			_toggleStates[name] = state;
		}
		
		function _createElementId(name) {
			return _id + "_" + name;
		}
		
		function _buildText(name, style) {
			var element = _createSpan();
			element.id = _createElementId(name); 
			element.className = "jwtext jw" + name;
			
			var css = {};
			
			var skinElement = _getSkinElement(name+"Background");
			if (skinElement.src) {
				css.background = "url(" + skinElement.src + ") no-repeat center";
				css['background-size'] = "100% " + _getSkinElement("background").height + "px";
			}

			_css(_internalSelector('.jw'+name), css);
			element.innerHTML = "00:00";
			_elements[name] = element;
			return element;
		}
		
		function _buildDivider(divider) {
			if (divider.width) {
				var element = _createSpan();
				element.className = "jwblankDivider";
				_css(element, {
					width: parseInt(divider.width)
				});
				return element;
			} else if (divider.element) {
				return _buildImage(divider.element);
			} else {
				return _buildImage(divider.name);
			}
		}
		
		function _showHd() {
			if (_levels && _levels.length > 2) {
				_hdOverlay.show();
				_hideOverlays('hd');
			}
		}
		
		function _hd() {
			if (_levels && _levels.length == 2) {
				_api.jwSetCurrentQuality(_currentQuality ? 0 : 1);
			}
		}
		
		function _switchLevel(newlevel) {
			if (newlevel >= 0 && newlevel < _levels.length) {
				_api.jwSetCurrentQuality(newlevel);
				_hdOverlay.hide();
			}
		}
		
		function _cc() {
			_toggleButton("ccOn");
		}
		
		function _buildSlider(name) {
			var slider = _createSpan(),
				prefix = name + "SliderCap",
				vertical = !!_getSkinElement(prefix+"Bottom").src,
				left = vertical ? "Top" : "Left",
				right = vertical ? "Bottom" : "Right",
				capLeft = _buildImage(prefix + left, NULL, FALSE, FALSE, vertical),
				capRight = _buildImage(prefix + right, NULL, FALSE, FALSE, vertical),
				rail = _buildSliderRail(name, vertical, left, right),
				capLeftSkin = _getSkinElement(prefix+left),
				capRightSkin = _getSkinElement(prefix+left),
				railSkin = _getSkinElement(name+"SliderRail");
			
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
				_timeOverlayText = _createElement("div");
				_setTimeOverlay(0);
				_appendChild(rail, _timeOverlay.element());
				_styleTimeSlider(slider);
				_setProgress(0);
				_setBuffer(0);
			} else if (name == "volume") {
				_styleVolumeSlider(slider, vertical, left, right);
			}
			
			return slider;
		}
		
		function _buildSliderRail(name, vertical, left, right) {
			var rail = _createSpan(), 
				railElements = ['Rail', 'Buffer', 'Progress'],
				progressRail;
			
			rail.className = "jwrail jwsmooth";

			for (var i=0; i<railElements.length; i++) {
				var prefix = name + "Slider" + railElements[i],
					element = _buildImage(prefix, NULL, !vertical, (name=="volume")),
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
					
					_elements[prefix] = railElement;
					_appendChild(rail, railElement);
				}
			}
			
			var thumb = _buildImage(name + "SliderThumb", NULL, FALSE, FALSE, vertical);
			if (thumb) {
				_css(_internalSelector('.'+thumb.className), {
					opacity: name == "time" ? 0 : 1,
					'margin-top': vertical ? thumb.skin.height / -2 : UNDEFINED
				});
				
				thumb.className += " jwthumb";
				_appendChild(vertical && progressRail ? progressRail : rail, thumb);
			}
			
			rail.addEventListener('mousedown', _sliderMouseDown(name), FALSE);
			
			if (name == "time") {
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

		function _sliderMouseDown(name) {
			return (function(evt) {
				if (evt.button != 0)
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
			_positionTimeTooltip(evt);
			
			if (!_dragging || evt.button != 0) {
				return;
			}
			
			var rail = _elements[_dragging].getElementsByClassName('jwrail')[0],
				railRect = utils.bounds(rail),
				name = _dragging,
				pct = _elements[name].vertical ? (railRect.bottom - evt.clientY) / railRect.height : (evt.clientX - railRect.left) / railRect.width;
			
			if (evt.type == 'mouseup') {
				if (name == "time") {
					_api.jwSeekDrag(FALSE);
				}

				_elements[name+'Rail'].className = "jwrail jwsmooth";
				_dragging = NULL;
				_sliderMapping[name](pct);
			} else {
				if (_dragging == "time") {
					_setProgress(pct);
				} else {
					_setVolume(pct);
				}
				var currentTime = (new Date()).getTime();
				if (currentTime - _lastSeekTime > 500) {
					_lastSeekTime = currentTime;
					_sliderMapping[_dragging](pct);
				}
			}
		}

		function _showTimeTooltip(evt) {
			if (_timeOverlay && _duration) {
				_timeOverlay.show();
			}
		}
		
		function _hideTimeTooltip(evt) {
			if (_timeOverlay) {
				_timeOverlay.hide();
			}
		}
		
		function _positionTimeTooltip(evt) {
			var element = _timeOverlay.element(), 
				railBox = utils.bounds(element.parentNode),
				position = (evt.pageX - railBox.left) - WINDOW.pageXOffset;
			if (position >= 0 && position <= railBox.width) {
				element.style.left = position + "px";
				_setTimeOverlay(_duration * position / railBox.width);
			}
		}
		
		function _setTimeOverlay(sec) {
			_timeOverlayText.innerHTML = utils.timeFormat(sec);
			_timeOverlay.setContents(_timeOverlayText);
		}
		
		function _styleTimeSlider(slider) {
			if (_elements['timeSliderThumb']) {
				_css(_internalSelector(".jwtimeSliderThumb"), {
					'margin-left': (_getSkinElement("timeSliderThumb").width/-2)
				});
			}

			_setBuffer(0);
			_setProgress(0);
		}
		
		
		function _styleVolumeSlider(slider, vertical, left, right) {
			var prefix = "volumeSlider";
			_css(_internalSelector(".jwvolume"), {
				width: _getSkinElement(prefix+"Rail").width + (vertical ? 0 : _getSkinElement(prefix+"Cap"+left).width + _getSkinElement(prefix+"Cap"+right).width),
				height: vertical ? (
							_getSkinElement(prefix+"Cap"+left).height + 
							_getSkinElement(prefix+"Rail").height + 
							_getSkinElement(prefix+"RailCap"+left).height + 
							_getSkinElement(prefix+"RailCap"+right).height + 
							_getSkinElement(prefix+"Cap"+right).height
						) : UNDEFINED
			});
			if (vertical) slider.className += " jwvertical";
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
			if (_elements.hdOn) {
				_hdOverlay = new html5.menu('hd', _id+"_hd", _skin, _switchLevel);
				_addOverlay(_hdOverlay, _elements.hdOn, _showHd);
				_overlays.hd = _hdOverlay;
			}
			if (_elements.mute && _elements.volume && _elements.volume.vertical) {
				_volumeOverlay = new html5.overlay(_id+"_volumeoverlay", _skin);
				_volumeOverlay.setContents(_elements.volume);
				_addOverlay(_volumeOverlay, _elements.mute, _showVolume);
				_overlays.volume = _volumeOverlay;
			}
			if (_elements.fullscreen) {
				_fullscreenOverlay = new html5.overlay(_id+"_fullscreenoverlay", _skin);
				var text = _createElement("div");
				text.innerHTML = "Fullscreen";
				_fullscreenOverlay.setContents(text);
				_addOverlay(_fullscreenOverlay, _elements.fullscreen, _showFullscreen);
				_overlays.fullscreen = _fullscreenOverlay;
 			}
		}
		
		function _addOverlay(overlay, button, hoverAction) {
			var element = overlay.element();
			_appendChild(button, element);
			button.addEventListener('mousemove', hoverAction, FALSE);
			button.addEventListener('mouseout', overlay.hide, FALSE);
			_css('#'+element.id, {
				left: "50%"
			});
		}
		
		function _buildGroup(pos) {
			var elem = _createSpan();
			elem.className = "jwgroup jw" + pos;
			_groups[pos] = elem;
			if (_layout[pos]) {
				_buildElements(_layout[pos], _groups[pos]);
			}
		}
		
		function _buildElements(group, container) {
			if (group && group.elements.length > 0) {
				for (var i=0; i<group.elements.length; i++) {
					var element = _buildElement(group.elements[i]);
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

		var _redraw = this.redraw = function() {
			_createStyles();
			var capLeft = _getSkinElement("capLeft"), capRight = _getSkinElement("capRight")
			_css(_internalSelector('.jwgroup.jwcenter'), {
				left: Math.round(utils.parseDimension(_groups.left.offsetWidth) + capLeft.width),
				right: Math.round(utils.parseDimension(_groups.right.offsetWidth) + capRight.width)
			});
			
			var max = (_controlbar.parentNode.clientWidth > _settings.maxwidth), 
				margin = _audioMode ? 0 : _settings.margin;
			
			_css(_internalSelector(), {
				left:  max ? "50%" : margin,
				right:  max ? UNDEFINED : margin,
				'margin-left': max ? _controlbar.clientWidth / -2 : UNDEFINED,
				width: max ? JW_CSS_100PCT : UNDEFINED
			});
		
			_positionOverlays();
			
		}
		
		function _positionOverlays() {
			var cbBounds = utils.bounds(_controlbar),
				overlayBounds, i, overlay;
			for (i in _overlays) {
				overlay = _overlays[i];
				overlay.offsetX(0);
				overlayBounds = utils.bounds(overlay.element());
				if (overlayBounds.right > cbBounds.right) {
					overlay.offsetX(cbBounds.right - overlayBounds.right);
				} else if (overlayBounds.left < cbBounds.left) {
					overlay.offsetX(cbBounds.left - overlayBounds.left);
				}
			}
		}

		

		this.audioMode = function(mode) {
			if (mode != _audioMode) {
				_audioMode = mode;
				_css(_internalSelector(".jwfullscreen"), { display: mode ? JW_CSS_NONE : UNDEFINED });
				_css(_internalSelector(".jwhdOn"), { display: mode ? JW_CSS_NONE : UNDEFINED });
				_css(_internalSelector(".jwccOn"), { display: mode ? JW_CSS_NONE : UNDEFINED });
				_redraw();
			}
		}
		
		this.element = function() {
			return _controlbar;
		};

		this.margin = function() {
			return parseInt(_settings.margin);
		};

		function _setBuffer(pct) {
			pct = Math.min(Math.max(0, pct), 1);
			if (_elements.timeSliderBuffer) {
				_elements.timeSliderBuffer.style.width = pct * 100 + "%";
				_elements.timeSliderBuffer.style.opacity = pct > 0 ? 1 : 0;
			}
		}

		function _sliderPercent(name, pct) {
			var vertical = _elements[name].vertical,
				size = 100 * Math.min(Math.max(0, pct), 1) + "%",
				progress = _elements[name+'SliderProgress'],
				thumb = _elements[name+'SliderThumb'],
				hide = FALSE;
			
			// Set style directly on the elements; Using the stylesheets results in some flickering in Chrome.
			if (progress) {
				if (vertical) {
					progress.style.height = size;
					progress.style.bottom = 0;
					if (progress.clientHeight <= progress.capSize) hide = TRUE;
				} else {
					progress.style.width = size;
					if (progress.clientWidth <= progress.capSize) hide = TRUE;
				}
				progress.style.opacity = ((!hide && pct > 0) || _dragging) ? 1 : 0;
				
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
		}

		function _setProgress(pct) {
			_sliderPercent('time', pct);
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('controlbar', name); 
			if (elem) {
				return elem;
			} else {
				return {
					width: 0,
					height: 0,
					src: "",
					image: UNDEFINED,
					ready: FALSE
				}
			}
		}
		
		function _appendChild(parent, child) {
			parent.appendChild(child);
		}
		
		this.show = function() {
			this.visible = true;
			_css(_internalSelector(), { opacity: 1, visibility: "visible" });
		}
		
		this.hide = function() {
			this.visible = false;
			_css(_internalSelector(), { opacity: 0, visibility: JW_CSS_HIDDEN });
		}
		
		// Call constructor
		_init();

	}

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	_css(CB_CLASS, {
		position: JW_CSS_ABSOLUTE,
		visibility: JW_CSS_HIDDEN,
		opacity: 0
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

    _css(CB_CLASS+' .jwcapRight,'+CB_CLASS+' .jwtimeSliderCapRight,'+CB_CLASS+' .jwvolumeSliderCapRight', { 
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
    
    _css(CB_CLASS + ' .jwvertical *', {
    	display: JW_CSS_BLOCK,
    });

	_setTransition(CB_CLASS, JW_CSS_SMOOTH_EASE);
	_setTransition(CB_CLASS + ' button', JW_CSS_SMOOTH_EASE);
	_setTransition(CB_CLASS + ' .jwtime .jwsmooth span', JW_CSS_SMOOTH_EASE + ", width .25s linear, left .25s linear");
	_setTransition(CB_CLASS + ' .jwtoggling', JW_CSS_NONE);

})(jwplayer);