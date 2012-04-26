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
		_style = _utils.appendStylesheet,

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
		JW_CSS_LEFT = "left",
		JW_CSS_RIGHT = "right",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "width .25s linear, left .25s linear, opacity .25s, background .25s"
		
		CB_CLASS = '.jwcontrolbar';
	
	/** HTML5 Controlbar class **/
	_html5.controlbar = function(api, config) {
		var _api,
			_skin,
			_defaults = {
				backgroundcolor : "",
				margin : 10,
				font : "Arial,sans-serif",
				fontsize : 10,
				fontcolor : parseInt("000000", 16),
				fontstyle : "normal",
				fontweight : "bold",
				buttoncolor : parseInt("ffffff", 16),
				// position : html5.view.positions.BOTTOM,
				position: "OVER",
				idlehide : false,
				hideplaylistcontrols : false,
				forcenextprev : false,
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
			_currentVolume,
			
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
			_duration = 0;

			_controlbar = _createSpan();
			_controlbar.id = _id;
			_controlbar.className = "jwcontrolbar";

			// Slider listeners
			window.addEventListener('mousemove', _sliderMouseEvent, false);
			window.addEventListener('mouseup', _sliderMouseEvent, false);

			_skin = _api.skin;
			
			_settings = _utils.extend({}, _defaults, _skin.controlbar.settings, config);
			_layout = (_skin.controlbar.layout.left || _skin.controlbar.layout.right || _skin.controlbar.layout.center) ? _skin.controlbar.layout : _defaults.layout;
			_createStyles();
			_buildControlbar();
			_addEventListeners();
		}
		
		function _addEventListeners() {
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_TIME, _timeUpdated);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_MUTE, _muteHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_VOLUME, _volumeHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_BUFFER, _bufferHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
		}
		
		function _timeUpdated(evt) {
			_duration = evt.duration;
			
			if (_elements.elapsed) {
				_elements.elapsed.innerHTML = _utils.timeFormat(evt.position);
			}
			if (_elements.duration) {
				_elements.duration.innerHTML = _utils.timeFormat(evt.duration);
			}
			if (evt.duration > 0) {
				_setProgress(evt.position / evt.duration);
			} else {
				_setProgress(0);
			}
		}
		
		function _stateHandler(evt) {
			switch (evt.newstate) {
			case jwplayer.events.state.BUFFERING:
			case jwplayer.events.state.PLAYING:
				if (_elements['timeSliderThumb']) {
					_elements['timeSliderThumb'].style.opacity = 1;
				}
				_toggleButton("play", true);
				break;
			case jwplayer.events.state.PAUSED:
				if (!_dragging) {
					_toggleButton("play", false);
				}
				break;
			case jwplayer.events.state.IDLE:
			case jwplayer.events.state.COMPLETED:
				_toggleButton("play", false);
				if (_elements['timeSliderThumb']) {
					_elements['timeSliderThumb'].style.opacity = 0;
				}
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
		
		function _muteHandler(evt) {
			_toggleButton("mute", evt.mute);
			_setVolume(evt.mute ? 0 : _currentVolume)
 		}

		function _volumeHandler(evt) {
			_currentVolume = evt.volume / 100;
			_setVolume(_currentVolume);
		}

		function _bufferHandler(evt) {
			_setBuffer(evt.bufferPercent / 100);
		}
		
		function _fullscreenHandler(evt) {
			_toggleButton("fullscreen", evt.fullscreen);
		}

		/**
		 * Styles specific to this controlbar/skin
		 */
		function _createStyles() {
			_utils.clearCss('#'+_id);
			
			_style('#'+_id, {
		  		height: _getSkinElement("background").height,
	  			bottom: _settings.position == "OVER" ? _settings.margin : 0,
	  			left: _settings.position == "OVER" ? _settings.margin : 0,
	  			right: _settings.position == "OVER" ? _settings.margin : 0
			});
			
			_style(_internalSelector(".jwtext"), {
				font: _settings.fontsize + "px/" + _getSkinElement("background").height + "px " + _settings.font,
				color: _settings.fontcolor,
				'font-weight': _settings.fontweight,
				'font-style': _settings.fontstyle,
				'text-align': 'center',
				padding: '0 5px'
			});
		}

		
		function _internalSelector(name) {
			return '#' + _id + " " + name;
		}

		function _createSpan() {
			return document.createElement("span");
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

			_controlbar.style.opacity = 0;
			if (bg) _controlbar.appendChild(bg);
			if (capLeft) _controlbar.appendChild(capLeft);
			_buildLayout();
			if (capRight) _controlbar.appendChild(capRight);

			setTimeout(function() {
				_resize();
				_controlbar.style.opacity = 1 
			},1000);
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
			
			_style(_internalSelector('.jw'+name), _utils.extend(newStyle, style));
			_elements[name] = element;
			return element;
		}

		function _buildButton(name) {
			if (!_getSkinElement(name + "Button").src) {
				return null;
			}
			
			var element = document.createElement("button");
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
			
			_style(selector, { 
				width: out.width,
				background: 'url('+ out.src +') center no-repeat'
			});
			
			if (over.src) {
				_style(selector + ':hover', { 
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
			if (!_dragging) {
				_api.jwPlay();
			}
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

			_style(_internalSelector('.jw'+name), css);
			element.innerHTML = "00:00";
			_elements[name] = element;
			return element;
		}
		
		function _buildDivider(divider) {
			if (divider.width) {
				var element = _createSpan();
				element.className = "jwblankDivider";
				_style(element, {
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
			if (capRight) capRight.className += " jwcapRight";

			var rail = _buildSliderRail(name);
			
			if (capLeft) slider.appendChild(capLeft);
			slider.appendChild(rail);
			if (capLeft) slider.appendChild(capRight);

			_style(_internalSelector(".jw" + name + " .jwrail"), {
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
				thumb.className += " jwthumb";
				thumb.style.opacity = 0;
				rail.appendChild(thumb);
			}
			
			rail.addEventListener('mousedown', _sliderMouseDown(name), false);
			
			_elements[name+'Rail'] = rail;
			
			return rail;
		}
		
		var _dragging;
		
		function _sliderMouseDown(name) {
			return (function(evt) {
				if (evt.button != 0)
					return;
				
				_elements[name+'Rail'].className = "jwrail";
				
				if (name == "time") {
					if (_api.jwGetState() != jwplayer.events.state.IDLE) {
						_dragging = name;
					}
				} else {
					_dragging = name;
				}
			});
		}
		
		var _lastSeekTime = 0;
		
		function _sliderMouseEvent(evt) {
			if (!_dragging || evt.button != 0) {
				return;
			}
			
			var rail = _elements[_dragging].getElementsByClassName('jwrail')[0],
				railRect = _utils.getBoundingClientRect(rail),
				pct = (evt.clientX - railRect.left) / railRect.width;
			
			if (evt.type == 'mouseup') {
				var name = _dragging;
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
					_api.jwPause();
					_lastSeekTime = currentTime;
					_sliderMapping[_dragging](pct);
				}
			}
		}

	
		function _styleTimeSlider(slider) {
			if (_elements['timeSliderThumb']) {
				_style(_internalSelector(".jwtimeSliderThumb"), {
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
			
			_style(_internalSelector(".jwvolume"), {
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
			
			_style(_internalSelector(".jwright"), {
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

		var _resize = this.resize = function(width, height) {
			_style(_internalSelector('.jwgroup.jwcenter'), {
				left: Math.round(_utils.parseDimension(_groups.left.offsetWidth) + _getSkinElement("capLeft").width),
				right: Math.round(_utils.parseDimension(_groups.right.offsetWidth) + _getSkinElement("capRight").width)
			});
		}
		
		this.getDisplayElement = function() {
			return _controlbar;
		};
		
		function _setBuffer(pct) {
			pct = Math.min(Math.max(0, pct), 1);
			_elements['timeSliderBuffer'].style.width = pct * 100 + "%";
		}

		function _sliderPercent(name, pct, fixedWidth) {
			if (!_elements[name]) return;

			pct = Math.min(Math.max(0, pct), 1);
			
			var progress = _elements[name+'SliderProgress'];
			var thumb = _elements[name+'SliderThumb'];
			var width = 100 * pct + "%";
		
			if (progress) {
				progress.style.width = width; 
			}
			if (thumb) {
				thumb.style.left = width;
			}
		}
		
		function _setVolume (pct) {
			_sliderPercent('volume', pct, true);
		}

		function _setProgress(pct) {
			_sliderPercent('time', pct);
		}

		function _getSkinElement(name) {
			if (_skin.controlbar.elements[name]) {
				return _skin.controlbar.elements[name];
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
		
		// Call constructor
		_init();

	}

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	_style(CB_CLASS, {
		position: JW_CSS_ABSOLUTE,
		overflow: 'hidden',
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	})
	
	_style(CB_CLASS+' span',{
		height: JW_CSS_100PCT,
		'-webkit-user-select': JW_CSS_NONE,
		'-webkit-user-drag': JW_CSS_NONE,
		'user-select': JW_CSS_NONE,
		'user-drag': JW_CSS_NONE
	});
	
    _style(CB_CLASS+' .jwgroup', {
    	display: JW_CSS_INLINE
    });
    
    _style(CB_CLASS+' span, '+CB_CLASS+' .jwgroup button,'+CB_CLASS+' .jwleft', {
    	position: JW_CSS_RELATIVE,
		'float': JW_CSS_LEFT
    });
    
	_style(CB_CLASS+' .jwright', {
		position: JW_CSS_ABSOLUTE
	});
	
    _style(CB_CLASS+' .jwcenter', {
    	position: JW_CSS_ABSOLUTE
    });
    
    _style(CB_CLASS+' button', {
    	display: JW_CSS_INLINE_BLOCK,
    	height: JW_CSS_100PCT,
    	border: JW_CSS_NONE,
    	cursor: 'pointer',
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
    });
    
    _style(CB_CLASS+' .jwcapRight', { 
		right: 0,
		position: JW_CSS_ABSOLUTE
	});
    
    _style(CB_CLASS+' .jwtime,' + CB_CLASS + ' .jwgroup span.jwstretch', {
    	position: JW_CSS_ABSOLUTE,
    	height: JW_CSS_100PCT,
    	width: JW_CSS_100PCT,
    	left: 0
    });
    
   
    
    _style(CB_CLASS+' .jwrail,' + CB_CLASS + ' .jwthumb', {
    	position: JW_CSS_ABSOLUTE,
    	height: JW_CSS_100PCT,
    	cursor: 'pointer'
    });
    
    _style(CB_CLASS + ' .jwtime .jwsmooth span', {
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
    });
    
    _style(CB_CLASS + ' .jwdivider+.jwdivider', {
    	display: JW_CSS_NONE
    });
    
    _style(CB_CLASS + ' .jwtext', {
		padding: '0 5px',
		'text-align': 'center'
	});
    
    _style(CB_CLASS + ' .jwtoggling', {
    	'-webkit-transition': JW_CSS_NONE,
    	'-moz-transition': JW_CSS_NONE,
    	'-o-transition': JW_CSS_NONE
    });
	
})(jwplayer);