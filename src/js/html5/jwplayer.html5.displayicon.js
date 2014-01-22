/**
 * JW Player display component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		_css = utils.css,

		DI_CLASS = ".jwdisplayIcon", 
		UNDEFINED,
		DOCUMENT = document,

		/** Some CSS constants we should use for minimization * */
		JW_CSS_NONE = "none", 
		JW_CSS_100PCT = "100%",
		JW_CSS_CENTER = "center";

	html5.displayicon = function(id, api, textStyle, textStyleOver) {
		var _api = api,
			_skin = _api.skin,
			_id = id,
			_container, 
			_bgSkin,
			_capLeftSkin,
			_capRightSkin,
			_hasCaps,
			_text,
			_icon,
			_iconCache = {},
			_iconElement,
			_iconWidth = 0,
			_widthInterval,
			_repeatCount;

		function _init() {
			_container = _createElement("jwdisplayIcon");
			_container.id = _id;

			
			//_createElement('capLeft', _container);
//			_bg = _createElement('background', _container);
			_createBackground();
			_text = _createElement('jwtext', _container, textStyle, textStyleOver);
			_icon = _createElement('jwicon', _container);
			//_createElement('capRight', _container);
			
			
			_hide();
			_redraw();
		}

		function _internalSelector(selector, hover) {
			return "#" + _id + (hover ? ":hover" : "") + " " + (selector ? selector : "");
		}

		function _createElement(name, parent, style, overstyle) {
			var elem = DOCUMENT.createElement("div");

			elem.className = name;
			if (parent) parent.appendChild(elem);

			if (_container) {
				_styleIcon(elem, name, "."+name, style, overstyle);
			}
			return elem;
		}
		
		function _createBackground() {
			_bgSkin = _getSkinElement('background');
			_capLeftSkin = _getSkinElement('capLeft');
			_capRightSkin = _getSkinElement('capRight');
			_hasCaps = (_capLeftSkin.width * _capRightSkin.width > 0);
			
			var style = {
				'background-image': "url(" + _capLeftSkin.src + "), url(" + _bgSkin.src + "), url(" + _capRightSkin.src + ")",
				'background-position': "left,center,right",
				'background-repeat': 'no-repeat',
				padding: "0 " + _capRightSkin.width + "px 0 " + _capLeftSkin.width + "px",
				height: _bgSkin.height,
				'margin-top': _bgSkin.height / -2
			};
			_css(_internalSelector(), style);
			
			if (!utils.isMobile()) {
				if (_bgSkin.overSrc) {
					style['background-image'] = "url(" + _capLeftSkin.overSrc + "), url(" + _bgSkin.overSrc + "), url(" + _capRightSkin.overSrc + ")"; 
				}
				_css("#"+_api.id+" .jwdisplay:hover " + _internalSelector(), style);
			}
		}
		
		function _styleIcon(element, name, selector, style, overstyle) {
			var skinElem = _getSkinElement(name);
			if (name == "replayIcon" && !skinElem.src) skinElem = _getSkinElement("playIcon"); 

			if (skinElem.src) {
				style = utils.extend({}, style);
				if (name.indexOf("Icon") > 0) _iconWidth = skinElem.width|0;
				style.width = skinElem.width;
				_css(selector, {
					'background-image': 'url(' + skinElem.src + ')',
					'background-size': skinElem.width+'px '+skinElem.height+'px'
				});
				
				overstyle = utils.extend({}, overstyle);
				if (skinElem.overSrc) {
					overstyle['background-image'] = 'url(' + skinElem.overSrc + ')';
				}
				if (!utils.isMobile()) {
					_css("#"+_api.id+" .jwdisplay:hover " + selector, overstyle);
				}
				_css.style(_container, { display: "table" });
			} else {
				_css.style(_container, { display: "none" });
			}
			if (style) {
				_css.style(element, style);
			}
			_iconElement = skinElem;
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('display', name),
				overElem = _skin.getSkinElement('display', name + 'Over');
				
			if (elem) {
				elem.overSrc = (overElem && overElem.src) ? overElem.src : "";
				return elem;
			}
			return { src : "", overSrc : "", width : 0, height : 0 };
		}
		
		function _redraw() {
			var showText = _hasCaps || (_iconWidth === 0),
				px100pct = "px " + JW_CSS_100PCT;
			
			_css.style(_text, {
				display: (_text.innerHTML && showText) ? UNDEFINED : JW_CSS_NONE
			});
			
			_repeatCount = 10;
			setTimeout(function() {
				_setWidth(px100pct);
			}, 0);
			if (showText) {
				_widthInterval = setInterval(function() {
					_setWidth(px100pct);
				}, 100);
			}
		}
		
		function _setWidth(px100pct) {
			if (_repeatCount <= 0) {
				clearInterval(_widthInterval);
			} else {
				_repeatCount--;
				var contentWidth = Math.max(_iconElement.width, utils.bounds(_container).width - _capRightSkin.width - _capLeftSkin.width);
				if (utils.isFF() || utils.isIE()) contentWidth ++;
				// Fix for 1 pixel gap in Chrome. This is a chrome bug that needs to be fixed. 
				// TODO: Remove below once chrome fixes this bug.
				if (utils.isChrome() && _container.parentNode.clientWidth % 2 == 1) contentWidth++;
				_css.style(_container, {
					'background-size': [_capLeftSkin.width + px100pct, contentWidth + px100pct, _capRightSkin.width + px100pct].join(", ")
				}, true);
			}
		}
			
		this.element = function() {
			return _container;
		};

		this.setText = function(text) {
			var style = _text.style;
			_text.innerHTML = text ? text.replace(":", ":<br>") : "";
			style.height = "0";
			style.display = "block";
			if (text) {
				while (numLines(_text) > 2) {
					_text.innerHTML = _text.innerHTML.replace(/(.*) .*$/, "$1...");
				}
			}
			style.height = "";
			style.display = "";
			//setTimeout(_redraw, 100);
			_redraw();
		};
		
		this.setIcon = function(name) {
			var icon = _iconCache[name];
			if (!icon) {
				icon = _createElement('jwicon');
				icon.id = _container.id + "_" + name;
			}
			_styleIcon(icon, name+"Icon", "#"+icon.id);
			if (_container.contains(_icon)) {
				_container.replaceChild(icon, _icon);
			} else {
				_container.appendChild(icon);
			}
			_icon = icon;
		};

		var _bufferInterval,
			_bufferAngle = 0,
			_currentAngle;
		
		function startRotation(angle, interval) {
			clearInterval(_bufferInterval);
			_currentAngle = 0;
			_bufferAngle = angle|0;
			if (_bufferAngle === 0) {
				rotateIcon();
			} else {
				_bufferInterval = setInterval(rotateIcon, interval);
			}
		}

		function rotateIcon() {
			_currentAngle = (_currentAngle + _bufferAngle) % 360;
			utils.rotate(_icon, _currentAngle);
		}

		this.setRotation = startRotation;
						
		function numLines(element) {
			return Math.floor(element.scrollHeight / DOCUMENT.defaultView.getComputedStyle(element, null).lineHeight.replace("px", ""));
		}

		
		var _hide = this.hide = function() {
			_container.style.opacity = 0;
		};

		this.show = function() {
			_container.style.opacity = 1;
		};

		_init();
	};

	_css(DI_CLASS, {
		display : 'table',
		cursor : 'pointer',
		position: "relative",
		'margin-left': "auto",
		'margin-right': "auto",
		top: "50%"
	}, true);

	_css(DI_CLASS + " div", {
		position : "relative",
		display: "table-cell",
		'vertical-align': "middle",
		'background-repeat' : "no-repeat",
		'background-position' : JW_CSS_CENTER
	});

	_css(DI_CLASS + " div", {
		'vertical-align': "middle"
	}, true);

	_css(DI_CLASS + " .jwtext", {
		color : "#fff",
		padding: "0 1px",
		'max-width' : "300px",
		'overflow-y' : "hidden",
		'text-align': JW_CSS_CENTER,
		'-webkit-user-select' : JW_CSS_NONE,
		'-moz-user-select' : JW_CSS_NONE,
		'-ms-user-select' : JW_CSS_NONE,
		'user-select' : JW_CSS_NONE
	});

})(jwplayer);