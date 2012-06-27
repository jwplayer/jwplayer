// TODO: remove backgroundcolor
// TODO: remove buttonColor, blankButton


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
		JW_CSS_SMOOTH_EASE = "opacity .25s, background .25s, visibility .25s",
		
		CB_CLASS = '.jwcontrolbar',
		
		UNDEFINED = undefined,
		WINDOW = window,
		DOCUMENT = document;
	
	/** HTML5 Controlbar class **/
	html5.controlbar = function(api, config) {
		var _api,
			_skin,
			_dividerElement = _layoutElement("divider", CB_DIVIDER),
			_defaults = {
				// backgroundcolor : "",
				margin : 10,
				maxwidth: 0,
				font : "Arial,sans-serif",
				fontsize : 10,
				fontcolor : parseInt("000000", 16),
				fontstyle : "normal",
				fontweight : "bold",
				// buttoncolor : parseInt("ffffff", 16),
				// position : html5.view.positions.BOTTOM,
				// idlehide : false,
				// hideplaylistcontrols : false,
				// forcenextprev : false,
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
			_audioMode = false,
			_dragging = false,
			_lastSeekTime = 0,
			
			_toggles = {
				play: "pause",
				mute: "unmute",
				fullscreen: "normalscreen",
				hdOn: "hdOff",
				ccOn: "ccOff"
			},
			
			_toggleStates = {
				play: false,
				mute: false,
				fullscreen: false,
				hdOn: false,
				ccOn: false
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
			WINDOW.addEventListener('mousemove', _sliderMouseEvent, false);
			WINDOW.addEventListener('mouseup', _sliderMouseEvent, false);

			_skin = _api.skin;
			
			_layout = _skin.getComponentLayout('controlbar');
			if (!_layout) _layout = _defaults.layout;
			utils.clearCss('#'+_id);
			_createStyles();
			_buildControlbar();
			_addEventListeners();
			_volumeHandler();
			_muteHandler();
		}
		
		function _addEventListeners() {
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_TIME, _timeUpdated);
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_MUTE, _muteHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_VOLUME, _volumeHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_BUFFER, _bufferHandler);
			_api.jwAddEventListener(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_LOADED, _playlistHandler);
//			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _qualityHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVELS, _qualityHandler);
		}
		
		function _timeUpdated(evt) {
			var refreshRequired = false,
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
				_toggleButton("play", true);
				break;
			case states.PAUSED:
				if (!_dragging) {
					_toggleButton("play", false);
				}
				break;
			case states.IDLE:
				_toggleButton("play", false);
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
			if (_api.jwGetPlaylist().length < 2 || _sidebarShowing()) {
				_css(_internalSelector(".jwnext"), { display: JW_CSS_NONE });
				_css(_internalSelector(".jwprev"), { display: JW_CSS_NONE });
			} else {
				_css(_internalSelector(".jwnext"), { display: UNDEFINED });
				_css(_internalSelector(".jwprev"), { display: UNDEFINED });
			}
			_redraw();
		}
		
		function _qualityHandler(evt) {
			_levels = evt.levels;
			_currentQuality = evt.currentQuality;
			if (_levels && _levels.length > 1) {
				_css(_internalSelector(".jwhdOn"), { display: UNDEFINED });
				if (_levels.length == 2) {
					_toggleButton("hdOn", _currentQuality == 0);
				}
				_hdOverlay.clearOptions();
				for (var i=0; i<_levels.length; i++) {
					_hdOverlay.addOption(_levels[i].label, i);
				}
				if (evt.currentQuality >= 0) {
					_hdOverlay.setActive(evt.currentQuality);
				}
			} else {
				_css(_internalSelector(".jwhdOn"), { display: "none" });
			}
			_redraw();
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
			}, true);

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
		
		function _buildImage(name, style, stretch, nocenter) {
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
					background: "url('" + skinElem.src + "') repeat-x " + center
				};
			} else {
				newStyle = {
					background: "url('" + skinElem.src + "') no-repeat" + center,
					width: skinElem.width
				};
			}
			
			_css(_internalSelector('.jw'+name), utils.extend(newStyle, style));
			_elements[name] = element;
			return element;
		}

		function _buildButton(name) {
			if (!_getSkinElement(name + "Button").src) {
				return null;
			}
			
			var element = _createSpan();
			element.className = 'jw'+name + ' jwbuttoncontainer';
			var button = _createElement("button");
			button.addEventListener("click", _buttonClickHandler(name), false);
			button.innerHTML = "&nbsp;";
			_appendChild(element, button);

			var outSkin = _getSkinElement(name + "Button");
			var overSkin = _getSkinElement(name + "ButtonOver");
			
			
			_buttonStyle(_internalSelector('.jw'+name+" button"), outSkin, overSkin);
			var toggle = _toggles[name];
			if (toggle) {
				_buttonStyle(_internalSelector('.jw'+name+'.jwtoggle button'), _getSkinElement(toggle+"Button"), _getSkinElement(toggle+"ButtonOver"));
			}

			if (name == "hdOn") {
				_hdOverlay = new html5.menu('hd', _id+"_hd", _skin, _switchLevel);
				var hdElement = _hdOverlay.element()
				_appendChild(element, hdElement);
				_css('#'+hdElement.id, {
					left: "50%"
				});
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
		
		function _volume(pct) {
			if (pct < 0.1) pct = 0;
			if (pct > 0.9) pct = 1;
			_api.jwSetVolume(pct * 100);
			_setVolume(pct);
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
		
		var _hdShowing = false;
		
		function _hd() {
			if (_levels) {
				if (_levels.length == 2) {
					_api.jwSetCurrentQuality(_currentQuality ? 0 : 1);
					_toggleButton("hdOn");
				} else if (_levels.length > 2) {
					if (_hdShowing) _hdOverlay.hide();
					else _hdOverlay.show();
					_hdShowing = !_hdShowing;
				}
			}
		}
		
		function _switchLevel(newlevel) {
			if (newlevel >= 0 && newlevel < _levels.length) {
				_api.jwSetCurrentQuality(newlevel);
				_hdOverlay.hide();
				_hdShowing = false;
			}
		}
		
		function _cc() {
			_toggleButton("ccOn");
		}
		
		function _buildSlider(name) {
			var slider = _createSpan();
			slider.className = "jwslider jw" + name;

			var capLeft = _buildImage(name + "SliderCapLeft");
			var capRight = _buildImage(name + "SliderCapRight");

			var rail = _buildSliderRail(name);
			
			if (capLeft) _appendChild(slider, capLeft);
			_appendChild(slider, rail);
			if (capLeft) _appendChild(slider, capRight);

			_css(_internalSelector(".jw" + name + " .jwrail"), {
				left: _getSkinElement(name+"SliderCapLeft").width,
				right: _getSkinElement(name+"SliderCapRight").width,
			});

			_elements[name] = slider;

			if (name == "time") {
				_timeOverlay = new html5.overlay(_id+"_timetooltip", _skin);
				_timeOverlayText = _createElement("div");
				_setTimeOverlay(0);
				_appendChild(rail, _timeOverlay.element());
				_styleTimeSlider(slider);
				_setProgress(0);
				_setBuffer(0);
			} else if (name == "volume") {
				_styleVolumeSlider(slider);
			}

			return slider;
		}
		
		function _buildSliderRail(name) {
			var rail = _createSpan();
			rail.className = "jwrail jwsmooth";

			var railElements = ['Rail', 'Buffer', 'Progress'];

			for (var i=0; i<railElements.length; i++) {
				var prefix = name + "Slider" + railElements[i],
					element = _buildImage(prefix, null, true, (name=="volume")),
					capLeft = _buildImage(prefix + "CapLeft"),
					capRight = _buildImage(prefix + "CapRight"),
					capLeftSkin = _getSkinElement(prefix + "CapLeft"),
					capRightSkin = _getSkinElement(prefix + "CapRight");
				if (element) {
					var railElement = _createSpan();
					railElement.className = "jwrailgroup " + railElements[i];
					if (capLeft) _appendChild(railElement, capLeft);
					_appendChild(railElement, element);
					if (capRight) { 
						_appendChild(railElement, capRight);
						capRight.className += " jwcapRight";
					}
					
					_css(_internalSelector(".jwrailgroup." + railElements[i]), {
						'min-width': capLeftSkin.width + capRightSkin.width
					});
					
					_css(_internalSelector("." + element.className), {
						left: capLeftSkin.width,
						right: capRightSkin.width
					});

					_elements[prefix] = railElement;
					_appendChild(rail, railElement);
				}
			}
			
			var thumb = _buildImage(name + "SliderThumb");
			if (thumb) {
				_css(_internalSelector('.'+thumb.className), { opacity: 0 });
				thumb.className += " jwthumb";
				_appendChild(rail, thumb);
			}
			
			rail.addEventListener('mousedown', _sliderMouseDown(name), false);
			
			if (name == "time") {
				rail.addEventListener('mousemove', _showTimeTooltip, false);
				rail.addEventListener('mouseout', _hideTimeTooltip, false);
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
						_api.jwSeekDrag(true);
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
				pct = (evt.clientX - railRect.left) / railRect.width;
			
			if (evt.type == 'mouseup') {
				var name = _dragging;
				
				if (name == "time") {
					_api.jwSeekDrag(false);
				}

				_elements[name+'Rail'].className = "jwrail jwsmooth";
				_dragging = null;
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
				position = Math.min(railBox.width, Math.max(0, evt.pageX - railBox.left)) - WINDOW.pageXOffset;
			element.style.left = position + "px";
			_setTimeOverlay(_duration * position / railBox.width);
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
		
		
		function _styleVolumeSlider(slider) {
			var capLeftWidth = _getSkinElement("volumeSliderCapLeft").width,
				capRightWidth = _getSkinElement("volumeSliderCapRight").width,
				railWidth = _getSkinElement("volumeSliderRail").width;
			
			_css(_internalSelector(".jwvolume"), {
				width: (capLeftWidth + railWidth + capRightWidth)
			});
		}
		
		var _groups = {};
		
		function _buildLayout() {
			_buildGroup("left");
			_buildGroup("center");
			_buildGroup("right");
			_appendChild(_controlbar, _groups.left);
			_appendChild(_controlbar, _groups.center);
			_appendChild(_controlbar, _groups.right);
			
			_css(_internalSelector(".jwright"), {
				right: _getSkinElement("capRight").width
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
						_appendChild(container, element);
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
		
		this.getDisplayElement = function() {
			return _controlbar;
		};
		
		function _setBuffer(pct) {
			pct = Math.min(Math.max(0, pct), 1);
			if (_elements.timeSliderBuffer) {
				_elements.timeSliderBuffer.style.width = pct * 100 + "%";
				_elements.timeSliderBuffer.style.opacity = pct > 0 ? 1 : 0;
			}
		}

		function _sliderPercent(name, pct, fixedWidth) {
			var width = 100 * Math.min(Math.max(0, pct), 1) + "%";
			
			// Set style directly on the elements; Using the stylesheets results in some flickering in Chrome.
			if (_elements[name+'SliderProgress']) {
				_elements[name+'SliderProgress'].style.width = width;
				_elements[name+'SliderProgress'].style.opacity = pct > 0 ? 1 : 0;
			}
			
			if (_elements[name+'SliderThumb']) {
				_elements[name+'SliderThumb'].style.left = width;
			}
		}
		
		function _setVolume (pct) {
			_sliderPercent('volume', pct, true);	
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
					ready: false
				}
			}
		}
		
		function _appendChild(parent, child) {
			parent.appendChild(child);
		}
		
		this.show = function() {
			_css(_internalSelector(), { opacity: 1, visibility: "visible" });
		}
		
		this.hide = function() {
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
    

	_setTransition(CB_CLASS, JW_CSS_SMOOTH_EASE);
	_setTransition(CB_CLASS + ' button', JW_CSS_SMOOTH_EASE);
	_setTransition(CB_CLASS + ' .jwtime .jwsmooth span', JW_CSS_SMOOTH_EASE + ", width .25s linear, left .25s linear");
	_setTransition(CB_CLASS + ' .jwtoggling', JW_CSS_NONE);

})(jwplayer);