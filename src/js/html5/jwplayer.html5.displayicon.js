/**
 * JW Player display component
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state, 
		_css = utils.css,

		DI_CLASS = ".jwdisplayIcon", 
		UNDEFINED = undefined,
		DOCUMENT = document,

		/** Some CSS constants we should use for minimization * */
		JW_CSS_NONE = "none", 
		JW_CSS_100PCT = "100%",
		JW_CSS_CENTER = "center",
		JW_CSS_ABSOLUTE = "absolute";

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
			_iconElement,
			_iconWidth = 0;

		function _init() {
			_container = _createElement("jwdisplayIcon");
			_container.id = _id;

			
			//_createElement('capLeft', _container);
//			_bg = _createElement('background', _container);
			_createBackground();
			_text = _createElement('jwtext', _container, textStyle, textStyleOver);
			_icon = _createElement('icon', _container);
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

			_styleIcon(name, "."+name, style, overstyle);
			
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
			
			if (_bgSkin.overSrc) {
				style['background-image'] = "url(" + _capLeftSkin.overSrc + "), url(" + _bgSkin.overSrc + "), url(" + _capRightSkin.overSrc + ")"; 
			}

			_css("#"+_api.id+" .jwdisplay:hover " + _internalSelector(), style);
		}
		
		function _styleIcon(name, selector, style, overstyle) {
			var skinElem = _getSkinElement(name); 

			style = utils.extend({}, style);
			if (name.indexOf("Icon") > 0) _iconWidth = skinElem.width;
			if (skinElem.src) {
				style['background-image'] = 'url(' + skinElem.src + ')';
				style['width'] = skinElem.width;// + (name.toLowerCase().indexOf("cap") == 0 ? 1 : 0);
			}
			_css(_internalSelector(selector), style);

			overstyle = utils.extend({}, overstyle);
			if (skinElem.overSrc) {
				overstyle['background-image'] = 'url(' + skinElem.overSrc + ')';
			}
			_iconElement = skinElem;
			_css("#"+_api.id+" .jwdisplay:hover " + (selector ? selector : _internalSelector()), overstyle);
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
			var showText = _hasCaps || (_iconWidth == 0),
				px100pct = "px " + JW_CSS_100PCT,
				contentWidth;
			
			_css(_internalSelector('.jwtext'), {
				display: (_text.innerHTML && showText) ? UNDEFINED : JW_CSS_NONE
			});

			setTimeout(function() {
				 contentWidth = Math.max(_iconElement.width, utils.bounds(_container).width - _capRightSkin.width - _capLeftSkin.width); //Math.ceil(_iconElement.width + (showText ? utils.bounds(_text).width: 0));
				 if (utils.isFF() || utils.isIE()) contentWidth ++;
				 _css(_internalSelector(), {
					//width : contentWidth,
					//'background-position': _capLeftSkin.width + "px 0",
					'background-size': [_capLeftSkin.width + px100pct, contentWidth + px100pct, _capRightSkin.width + px100pct].join(",")
				}, true);
			}, 0);
			

				
			/*
			_css(_internalSelector('.background'), {
				'background-repeat': 'repeat-x',
				'background-size': JW_CSS_100PCT + " " + _bgSkin.height + "px",
				position: "absolute",
				width: UNDEFINED,
				left: _hasCaps ? _capLeftSkin.width : 0,
				right: _hasCaps ? _capRightSkin.width : 0
			});
			*/

		}
		
		this.element = function() {
			return _container;
		}

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
		}
		
		this.setIcon = function(name) {
			var newIcon = _createElement('icon');
			newIcon.id = _container.id + "_" + name;
			_styleIcon(name+"Icon", "#"+newIcon.id)
			_container.replaceChild(newIcon, _icon);
			_icon = newIcon;
		}

		var _bufferInterval, _bufferAngle = 0, _currentAngle;
		
		function startRotation(angle, interval) {
			clearInterval(_bufferInterval);
			_currentAngle = 0
			_bufferAngle = angle;
			if (angle == 0) {
				rotateIcon();
			} else {
				_bufferInterval = setInterval(rotateIcon, interval)
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
			// Needed for IE9 for some reason
			//if (_bg && utils.isIE()) _bg.style.opacity = 0;
		}

		var _show = this.show = function() {
			_container.style.opacity = 1;
			//if (_bg && utils.isIE()) _bg.style.opacity = 1;
		}

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
		'vertical-align': "middle",
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

})(jwplayer.html5);