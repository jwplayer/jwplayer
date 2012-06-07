// TODO: remove backgroundcolor
// TODO: remove buttonColor, blankButton


/**
 * JW Player HTML5 Controlbar component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	
	var _html5 = jwplayer.html5,
		_utils = jwplayer.utils,
		_events = jwplayer.events,
		_states = jwplayer.events.state,
		_css = _utils.css,

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
		JW_CSS_SMOOTH_EASE = "width .25s linear, left .25s linear, opacity .25s, background .25s, visibility .25s",
		
		CB_CLASS = '.jwcontrolbar',
		
		DOCUMENT = document;
	
	/** HTML5 Controlbar class **/
	_html5.controlbar = function(api, config) {
		var _api,
			_skin,
			_defaults = {
				// backgroundcolor : "",
				margin : 10,
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
						elements: [ {
							name: "play",
							type: CB_BUTTON
						}, {
							name: "divider",
							type: CB_DIVIDER
						}, {
							name: "prev",
							type: CB_BUTTON
						}, {
							name: "divider",
							type: CB_DIVIDER
						}, {
							name: "next",
							type: CB_BUTTON
						}, {
							name: "divider",
							type: CB_DIVIDER
						}, {
							name: "elapsed",
							type: CB_TEXT
						} ]
					},
					center: {
						position: "center",
						elements: [ {
							name: "time",
							type: CB_SLIDER
						} ]
					},
					right: {
						position: "right",
						elements: [ {
							name: "duration",
							type: CB_TEXT
						}, {
							name: "blank",
							type: CB_BUTTON
						}, {
							name: "divider",
							type: CB_DIVIDER
						}, {
							name: "mute",
							type: CB_BUTTON
						}, {
							name: "volume",
							type: CB_SLIDER
						}, {
							name: "divider",
							type: CB_DIVIDER
						}, {
							name: "fullscreen",
							type: CB_BUTTON
						}]
					}
				}
			},
		
			_settings, 
			_layout, 
			_elements, 
			_controlbar, 
			_id,
			_duration,
			_position,
			_currentVolume,
			_dragging = false,
			_lastSeekTime = 0,
			
			_toggles = {
				play: "pause",
				mute: "unmute",
				fullscreen: "normalscreen"
			},
			
			_toggleStates = {
				play: false,
				mute: false,
				fullscreen: false
			},
			
			_buttonMapping = {
				play: _play,
				mute: _mute,
				fullscreen: _fullscreen,
				next: _next,
				prev: _prev
			},
			
			_sliderMapping = {
				time: _seek,
				volume: _volume
			};

		function _init() {
			_elements = {};
			
			_api = api;

			_id = _api.id + "_controlbar";
			_duration = _position = 0;

			_controlbar = _createSpan();
			_controlbar.id = _id;
			_controlbar.className = "jwcontrolbar";

			// Slider listeners
			window.addEventListener('mousemove', _sliderMouseEvent, false);
			window.addEventListener('mouseup', _sliderMouseEvent, false);

			_skin = _api.skin;
			
			_layout = _skin.getComponentLayout('controlbar');
			if (!_layout) _layout = _defaults.layout;
			_utils.clearCss('#'+_id);
			_createStyles();
			_buildControlbar();
			_addEventListeners();
			_playlistHandler();
			_volumeHandler();
			_muteHandler();
		}
		
		function _addEventListeners() {
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_TIME, _timeUpdated);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_MUTE, _muteHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_VOLUME, _volumeHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_BUFFER, _bufferHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_PLAYLIST_LOADED, _playlistHandler);
		}
		
		function _timeUpdated(evt) {
			var refreshRequired = false,
				timeString;
			
			if (_elements.elapsed) {
				timeString = _utils.timeFormat(evt.position);
				_elements.elapsed.innerHTML = timeString;
				refreshRequired = (timeString.length != _utils.timeFormat(_position).length);
			}
			if (_elements.duration) {
				timeString = _utils.timeFormat(evt.duration);
				_elements.duration.innerHTML = timeString;
				refreshRequired = (refreshRequired || (timeString.length != _utils.timeFormat(_duration).length));
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
			case _states.BUFFERING:
			case _states.PLAYING:
				_css(_internalSelector('.jwtimeSliderThumb'), { opacity: 1 });
				_toggleButton("play", true);
				break;
			case _states.PAUSED:
				if (!_dragging) {
					_toggleButton("play", false);
				}
				break;
			case _states.IDLE:
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
			case _states.COMPLETED:
				_css(_internalSelector(), { opacity: 0 });
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
			if (_api.jwGetPlaylist().length < 2) {
				_css(_internalSelector(".jwnext"), { display: "none" });
				_css(_internalSelector(".jwprev"), { display: "none" });
			} else {
				_css(_internalSelector(".jwnext"), { display: undefined });
				_css(_internalSelector(".jwprev"), { display: undefined });
			}
			_redraw();
		}

		/**
		 * Styles specific to this controlbar/skin
		 */
		function _createStyles() {
			_settings = _utils.extend({}, _defaults, _skin.getComponentSettings('controlbar'), config);

			_css('#'+_id, {
		  		height: _getSkinElement("background").height,
	  			bottom: _settings.margin ? _settings.margin : 0,
	  			left: _settings.margin ? _settings.margin : 0,
	  			right: _settings.margin ? _settings.margin : 0
			});
			
			_css(_internalSelector(".jwtext"), {
				font: _settings.fontsize + "px/" + _getSkinElement("background").height + "px " + _settings.font,
				color: _settings.fontcolor,
				'font-weight': _settings.fontweight,
				'font-style': _settings.fontstyle,
				'text-align': 'center',
				padding: '0 5px'
			});
		}

		
		function _internalSelector(name) {
			return '#' + _id + (name ? " " + name : "");
		}

		function _createSpan() {
			return DOCUMENT.createElement("span");
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

			if (bg) _controlbar.appendChild(bg);
			if (capLeft) _controlbar.appendChild(capLeft);
			_buildLayout();
			if (capRight) _controlbar.appendChild(capRight);
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
			
			_css(_internalSelector('.jw'+name), _utils.extend(newStyle, style));
			_elements[name] = element;
			return element;
		}

		function _buildButton(name) {
			if (!_getSkinElement(name + "Button").src) {
				return null;
			}
			
			var element = DOCUMENT.createElement("button");
			element.className = 'jw'+name;
			element.addEventListener("click", _buttonClickHandler(name), false);

			var outSkin = _getSkinElement(name + "Button");
			var overSkin = _getSkinElement(name + "ButtonOver");
			
			element.innerHTML = "&nbsp;";
			
			_buttonStyle(_internalSelector('.jw'+name), outSkin, overSkin);
			var toggle = _toggles[name];
			if (toggle) {
				_buttonStyle(_internalSelector('.jw'+name+'.jwtoggle'), _getSkinElement(toggle+"Button"), _getSkinElement(toggle+"ButtonOver"));
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
			if (!_utils.exists(state)) {
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
		
		function _buildSlider(name) {
			var slider = _createSpan();
			slider.className = "jwslider jw" + name;


			var capLeft = _buildImage(name + "SliderCapLeft");
			var capRight = _buildImage(name + "SliderCapRight");
			//if (capRight) capRight.className += " jwcapRight";

			var rail = _buildSliderRail(name);
			
			if (capLeft) slider.appendChild(capLeft);
			slider.appendChild(rail);
			if (capLeft) slider.appendChild(capRight);

			_css(_internalSelector(".jw" + name + " .jwrail"), {
				left: _getSkinElement(name+"SliderCapLeft").width,
				right: _getSkinElement(name+"SliderCapRight").width,
			});

			_elements[name] = slider;

			if (name == "time") {
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
				var element = _buildImage(name + "Slider" + railElements[i], null, true, (name=="volume"));
				if (element) {
					element.className += " jwstretch";
					rail.appendChild(element);
				}
			}
			
			var thumb = _buildImage(name + "SliderThumb");
			if (thumb) {
				_css(_internalSelector('.'+thumb.className), { opacity: 0 });
				thumb.className += " jwthumb";
				rail.appendChild(thumb);
			}
			
			rail.addEventListener('mousedown', _sliderMouseDown(name), false);
			
			_elements[name+'Rail'] = rail;
			
			return rail;
		}
		
		function _idle() {
			var currentState = _api.jwGetState();
			return (currentState == _states.IDLE || currentState == _states.COMPLETED); 
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
			if (!_dragging || evt.button != 0) {
				return;
			}
			
			var rail = _elements[_dragging].getElementsByClassName('jwrail')[0],
				railRect = _utils.getBoundingClientRect(rail),
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
			_controlbar.appendChild(_groups.left);
			_controlbar.appendChild(_groups.center);
			_controlbar.appendChild(_groups.right);
			
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
						container.appendChild(element);
					}
				}
			}
		}

		var _redraw = this.redraw = function() {
			_createStyles();
			_css(_internalSelector('.jwgroup.jwcenter'), {
				left: Math.round(_utils.parseDimension(_groups.left.offsetWidth) + _getSkinElement("capLeft").width),
				right: Math.round(_utils.parseDimension(_groups.right.offsetWidth) + _getSkinElement("capRight").width)
			});
		}
		
		this.getDisplayElement = function() {
			return _controlbar;
		};
		
		function _setBuffer(pct) {
			pct = Math.min(Math.max(0, pct), 1);
			//_css(_internalSelector('.jwtimeSliderBuffer'), { width: pct * 100 + "%" });
			if (_elements.timeSliderBuffer) {
				_elements.timeSliderBuffer.style.width = pct * 100 + "%";
			}
		}

		function _sliderPercent(name, pct, fixedWidth) {
			var width = 100 * Math.min(Math.max(0, pct), 1) + "%";
			
			//_css(_internalSelector(prefix+'Progress'), { width: width });
			//_css(_internalSelector(prefix+'Thumb'), { left: width });
			
			// Set style directly on the elements; Using the stylesheets results in some flickering in Chrome.
			if (_elements[name+'SliderProgress']) {
				_elements[name+'SliderProgress'].style.width = width;
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
					image: undefined,
					ready: false
				}
			}
		}
		
		this.show = function() {
//			_css(_internalSelector(), { opacity: 1 });
			_css(_internalSelector(), { opacity: 1, visibility: "visible" });
		}
		
		this.hide = function() {
//			_css(_internalSelector(), { opacity: 0 });
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
		overflow: JW_CSS_HIDDEN,
		visibility: JW_CSS_HIDDEN,
		opacity: 0,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	})
	
	_css(CB_CLASS+' span',{
		height: JW_CSS_100PCT,
		'-webkit-user-select': JW_CSS_NONE,
		'-webkit-user-drag': JW_CSS_NONE,
		'user-select': JW_CSS_NONE,
		'user-drag': JW_CSS_NONE
	});
	
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
    
    _css(CB_CLASS+' button', {
    	display: JW_CSS_INLINE_BLOCK,
    	height: JW_CSS_100PCT,
    	border: JW_CSS_NONE,
    	cursor: 'pointer',
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
    });
    
    _css(CB_CLASS+' .jwcapRight,'+CB_CLASS+' .jwtimeSliderCapRight,'+CB_CLASS+' .jwvolumeSliderCapRight', { 
		right: 0,
		position: JW_CSS_ABSOLUTE
	});
    
    _css(CB_CLASS+' .jwtime,' + CB_CLASS + ' .jwgroup span.jwstretch', {
    	position: JW_CSS_ABSOLUTE,
    	height: JW_CSS_100PCT,
    	width: JW_CSS_100PCT,
    	left: 0
    });
    
    _css(CB_CLASS+' .jwrail,' + CB_CLASS + ' .jwthumb', {
    	position: JW_CSS_ABSOLUTE,
    	height: JW_CSS_100PCT,
    	cursor: 'pointer'
    });
    
    _css(CB_CLASS + ' .jwtime .jwsmooth span', {
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
    });
    
    _css(CB_CLASS + ' .jwdivider+.jwdivider', {
    	display: JW_CSS_NONE
    });
    
    _css(CB_CLASS + ' .jwtext', {
		padding: '0 5px',
		'text-align': 'center'
	});
    
    _css(CB_CLASS + ' .jwtoggling', {
    	'-webkit-transition': JW_CSS_NONE,
    	'-moz-transition': JW_CSS_NONE,
    	'-o-transition': JW_CSS_NONE
    });
	
})(jwplayer);