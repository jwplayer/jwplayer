/**
 * JW Player HTML5 Controlbar component
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	
	var _utils = jwplayer.utils, 
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
		
		CB_CLASS = '.jwcontrolbar';
	
	/** HTML5 Controlbar class **/
	html5.controlbar = function(api, config) {
		var _api;

		var _defaults = {
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
				"left" : {
					"position" : "left",
					"elements" : [ {
						"name" : "play",
						"type" : CB_BUTTON
					}, {
						"name" : "divider",
						"type" : CB_DIVIDER
					}, {
						"name" : "prev",
						"type" : CB_BUTTON
					}, {
						"name" : "divider",
						"type" : CB_DIVIDER
					}, {
						"name" : "next",
						"type" : CB_BUTTON
					}, {
						"name" : "divider",
						"type" : CB_DIVIDER
					}, {
						"name" : "elapsed",
						"type" : CB_TEXT
					} ]
				},
				"center" : {
					"position" : "center",
					"elements" : [ {
						"name" : "time",
						"type" : CB_SLIDER
					} ]
				},
				"right" : {
					"position" : "right",
					"elements" : [ {
						"name" : "duration",
						"type" : CB_TEXT
					}, {
						"name" : "blank",
						"type" : CB_BUTTON
					}, {
						"name" : "divider",
						"type" : CB_DIVIDER
					}, {
						"name" : "mute",
						"type" : CB_BUTTON
					}, {
						"name" : "volume",
						"type" : CB_SLIDER
					}, {
						"name" : "divider",
						"type" : CB_DIVIDER
					}, {
						"name" : "fullscreen",
						"type" : CB_BUTTON
					} ]
				}
			}
		};
		
		var _settings, _layout, _elements;
		
		var _controlbar, _id;

		function _init() {
			_elements = {};
			
			_api = {
				settings: {
					controlbar: {
						position: "OVER"
					}
				},
				id: "player"
			};
			
			config = _utils.extend({}, config);
			_id = _api.id + "_controlbar";
			
			(new html5.skinloader(config.skin, function(skin) {
				_api.skin = skin;
				_settings = _utils.extend({}, _defaults, _api.skin.controlbar.settings, _api.settings.controlbar);
				_layout = (skin.controlbar.layout.left || skin.controlbar.layout.right || skin.controlbar.layout.center) ? skin.controlbar.layout : _defaults.layout;
				_createStyles();
				_buildControlbar();
			}, function(err) { console.log(err); }));
			
			
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
			
			_style(_internalSelector(".text"), {
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
			_controlbar = _createSpan();
			_controlbar.id = _id;
			_controlbar.className = "jwcontrolbar";

			var capLeft = _buildImage("capLeft");
			var capRight = _buildImage("capRight");
			var bg = _buildImage("background", {
				position: JW_CSS_ABSOLUTE,
				left: _getSkinElement('capLeft').width,
				right: _getSkinElement('capRight').width,
				'backgroundRepeat': "repeat-x"
			}, true);

			_controlbar.style.opacity = 0;
			if (bg) _controlbar.appendChild(bg);
			if (capLeft) _controlbar.appendChild(capLeft);
			_buildLayout();
			if (capRight) _controlbar.appendChild(capRight);

			setTimeout(function() {
				_resize();
				html5.utils.animations.fadeIn(_controlbar, 250);
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
			//element.id = _createElementId(name);
			element.className = name;
			
			var center = nocenter ? "" : "center";

			var skinElem = _getSkinElement(name);
			element.innerHTML = "&nbsp;";
			if (!skinElem || skinElem.src == "") {
				return;
			}
			
			var newStyle;
			
			if (stretch) {
				newStyle = {
					background: "url('" + skinElem.src + "') "+center+" repeat-x"
				};
			} else {
				newStyle = {
					background: "url('" + skinElem.src + "') "+center+" no-repeat",
					width: skinElem.width
				};
			}
			
			_style(_internalSelector('.'+name), _utils.extend(newStyle, style));
			_elements[name] = element;
			return element;
		}

		function _buildButton(name) {
			var element = document.createElement("button");
			//element.id = _createElementId(name);
			element.className = name;

			var outSkin = _getSkinElement(name + "Button");
			var overSkin = _getSkinElement(name + "ButtonOver");
			
			element.innerHTML = "&nbsp;";
			if (!outSkin.src) {
				return element;
			}
			
			_style(_internalSelector('.'+name), { 
				width: outSkin.width,
				background: 'url('+ outSkin.src +') center no-repeat'
			});
			
			if (overSkin.src) {
				_style(_internalSelector('.'+name) + ':hover', { 
					background: 'url('+ overSkin.src +') center no-repeat'
				});
			}

			_elements[name] = element;
			
			return element;
		}

		function _createElementId(name) {
			//return (_id + "_" + name + Math.round(Math.random()*10000000));
			return _id + "_" + name;
		}
		
		function _buildText(name, style) {
			var element = _createSpan();
			element.id = _createElementId(name); 
			element.className = "text " + name;
			
			var css = {};
			
			var skinElement = _getSkinElement(name+"Background");
			if (skinElement.src) {
				css.background = "url(" + skinElement.src + ") no-repeat center";
				css['background-size'] = "100% " + _getSkinElement("background").height + "px";
			}

			_style(_internalSelector('.'+name), css);
			element.innerHTML = "00:00";
			_elements[name] = element;
			return element;
		}
		
		function _buildDivider(divider) {
			if (divider.width) {
				var element = _createSpan();
				element.className = "blankDivider";
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
			//slider.id = _createElementId(name);
			slider.className = "slider " + name;

			var rail = _createSpan();
			rail.className = "rail";

			var railElements = ['Rail', 'Buffer', 'Progress'];

			for (var i=0; i<railElements.length; i++) {
				var element = _buildImage(name + "Slider" + railElements[i], null, true, (name=="volume"));
				if (element) {
					element.className += " stretch";
					rail.appendChild(element);
				}
			}
			
			var thumb = _buildImage(name + "SliderThumb");
			if (thumb) {
				thumb.className += " thumb";
				rail.appendChild(thumb);
			}

			var capLeft = _buildImage(name + "SliderCapLeft");
			var capRight = _buildImage(name + "SliderCapRight");
			if (capRight) capRight.className += " capRight";

			if (capLeft) slider.appendChild(capLeft);
			slider.appendChild(rail);
			if (capLeft) slider.appendChild(capRight);

			_style(_internalSelector("." + name + " .rail"), {
				left: _getSkinElement(name+"SliderCapLeft").width,
				right: _getSkinElement(name+"SliderCapRight").width,
			});

			if (name == "time") {
				_styleTimeSlider(slider);
				_setProgress(0);
				_setBuffer(0);
			} else if (name == "volume") {
				_styleVolumeSlider(slider);
			}

			_elements[name] = slider;
			
		return slider;
		}
	
		function _styleTimeSlider(slider) {
			if (_elements['timeSliderThumb']) {
				_style(_internalSelector(".timeSliderThumb"), {
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
			
			_style(_internalSelector(".volume"), {
				width: (capLeftWidth + railWidth + capRightWidth),
				margin: (capLeftWidth * capRightWidth == 0) ? "0 5px" : 0 
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
			
			_style(_internalSelector(".right"), {
				right: _getSkinElement("capRight").width
			});
		}
		
		
		function _buildGroup(pos) {
			var elem = _createSpan();
			elem.className = "group " + pos;
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
			_style(_internalSelector('.group.center'), {
				left: _utils.parseDimension(_groups.left.offsetWidth) + _getSkinElement("capLeft").width,
				right: _utils.parseDimension(_groups.right.offsetWidth) + _getSkinElement("capRight").width
			});
		}
		
		this.getDisplayElement = function() {
			return _controlbar;
		};
		
		var _setBuffer = this.setBuffer = function(pct) {
			pct = Math.min(Math.max(0, pct), 1);
			_elements['timeSliderBuffer'].style.width = 100 * pct + "%";
		}

		function _sliderPercent(name, pct, fixedWidth) {
			pct = Math.min(Math.max(0, pct), 1);
			
			var progress = _elements[name+'SliderProgress'];
			var thumb = _elements[name+'SliderThumb'];
			
			if (progress) {
				progress.style.width = 100 * pct + "%";
			}
			if (thumb) {
				thumb.style.left = pct * _utils.parseDimension(_elements[name+'SliderRail'].clientWidth) + "px";
				//thumb.style.opacity = 0.5; //(pct <= 0 || pct >= 1) ? 0 : 1;
			}
		}
		
		var _setVolume = this.setVolume = function(pct) {
			_sliderPercent('volume', pct, true);
		}

		var _setProgress = this.setProgress = function(pct) {
			_sliderPercent('time', pct);
		}

		this.getSkin = function() { return _api.skin; }
		
		function _getSkinElement(name) {
			if (_api.skin.controlbar.elements[name]) {
				return _api.skin.controlbar.elements[name];
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

	/**
	 * General JW Player controlbar styles -- should only be executed once
	 **/
	function _generalStyles() {
		_style(CB_CLASS, {
  			position: JW_CSS_ABSOLUTE,
  			overflow: 'hidden'
		})
  		_style(CB_CLASS+' span',{
  			height: JW_CSS_100PCT,
  			'-webkit-user-select': JW_CSS_NONE,
  			'-webkit-user-drag': JW_CSS_NONE,
  			'user-select': JW_CSS_NONE,
  			'user-drag': JW_CSS_NONE
  		});
  	    _style(CB_CLASS+' .group', {
  	    	display: JW_CSS_INLINE
  	    });
  	    _style(CB_CLASS+' span, '+CB_CLASS+' .group button,'+CB_CLASS+' .left', {
  	    	position: JW_CSS_RELATIVE,
  			'float': JW_CSS_LEFT
  	    });
		_style(CB_CLASS+' .right', {
			position: JW_CSS_RELATIVE,
			'float': JW_CSS_RIGHT
		});
  	    _style(CB_CLASS+' .center', {
  	    	position: JW_CSS_ABSOLUTE,
  			'float': JW_CSS_LEFT
 	    });
  	    _style(CB_CLASS+' button', {
  	    	display: JW_CSS_INLINE_BLOCK,
  	    	height: JW_CSS_100PCT,
  	    	border: JW_CSS_NONE,
  	    	cursor: 'pointer',
  	    	'-webkit-transition': 'background .5s',
  	    	'-moz-transition': 'background .5s',
  	    	'-o-transition': 'background 1s'
  	    });
  	    _style(CB_CLASS+' .capRight', { 
			right: 0,
			position: JW_CSS_ABSOLUTE
		});
  	    _style(CB_CLASS+' .time,' + CB_CLASS + ' .group span.stretch', {
  	    	position: JW_CSS_ABSOLUTE,
  	    	height: JW_CSS_100PCT,
  	    	width: JW_CSS_100PCT,
  	    	left: 0
  	    });
  	    _style(CB_CLASS+' .rail,' + CB_CLASS + ' .thumb', {
  	    	position: JW_CSS_ABSOLUTE,
  	    	height: JW_CSS_100PCT
  	    });
  	    _style(CB_CLASS + ' .timeSliderThumb', {
  	    	'-webkit-transition': 'left .5s linear 0s, opacity .5s ease .5s',
  	    	'-moz-transition': 'left .5s linear 0s, opacity .5s ease .5s'
  	    	//OTransition: 'left .5s linear 0s, opacity .5s ease .5s' -- this produces console errors in Opera
  	    });	  	    
  	    _style(CB_CLASS + ' .timeSliderProgress,' + CB_CLASS + ' .timeSliderBuffer', {
  	    	'-webkit-transition': 'width .5s linear',
  	    	'-moz-transition': 'width .5s linear',
  	    	'-o-transition': 'width .5s linear'
  	    });
  	    _style(CB_CLASS + ' .volume', {
  	    	display: JW_CSS_INLINE_BLOCK
  	    });
  	    _style(CB_CLASS + ' .divider+.divider', {
  	    	display: JW_CSS_NONE
  	    });
  	    _style(CB_CLASS + ' .text', {
			padding: '0 5px',
			textAlign: 'center'
		});

	}
	
	_generalStyles();
})(jwplayer.html5);