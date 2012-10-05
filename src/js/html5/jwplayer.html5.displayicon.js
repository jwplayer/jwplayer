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
			_bg,
			_text, 
			_icon,
			_iconWidth = 0;

		function _init() {
			_container = _createElement("jwdisplayIcon");
			_container.id = _id;

			_createElement('capLeft', _container);
			_bg = _createElement('background', _container);
			_text = _createElement('jwtext', _container, textStyle, textStyleOver);
			_icon = _createElement('icon', _container);
			_createElement('capRight', _container);

			_css(_internalSelector('div'), {
				height : _getSkinElement('background').height
			});

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
		
		function _styleIcon(name, selector, style, overstyle) {
			var skinElem = _getSkinElement(name), 
				overElem = _getSkinElement(name + "Over");

			style = utils.extend( {}, style);
			if (name.indexOf("Icon") > 0) _iconWidth = skinElem.width;
			if (skinElem.src) {
				style['background-image'] = 'url(' + skinElem.src + ')';
				style['width'] = skinElem.width;
			}
			_css(_internalSelector(selector), style);

			overstyle = utils.extend( {}, overstyle);
			if (overElem.src) {
				overstyle['background-image'] = 'url(' + overElem.src + ')';
			}
			_css("#"+_api.id+" .jwdisplay:hover " + selector, overstyle);
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('display', name);
			if (elem) {
				return elem;
			}
			return { src : "", width : 0, height : 0 };
		}
		
		var _redraw = this.redraw = function() {
			var bgSkin = _getSkinElement('background'),
				capLeftSkin = _getSkinElement('capLeft'),
				capRightSkin = _getSkinElement('capRight'),
				hasCaps = (capLeftSkin.width * capRightSkin.width > 0),
				showText = hasCaps || (_iconWidth == 0);
			
			_css(_internalSelector(), {
				'margin-top': bgSkin.height / -2,
				height: bgSkin.height,
				width : undefined
			});
			_css(_internalSelector('.background'), {
				'background-repeat': 'repeat-x',
				'background-size': JW_CSS_100PCT + " " + bgSkin.height + "px",
				position: "absolute",
				width: UNDEFINED,
				left: hasCaps ? capLeftSkin.width - 1: 0,
				right: hasCaps ? capRightSkin.width - 1 : 0
			});
			_css(_internalSelector(".capLeft"), {
				display: hasCaps ? UNDEFINED : JW_CSS_NONE,
				'float': "left"
			});
			_css(_internalSelector(".capRight"), {
				display: hasCaps ? UNDEFINED : JW_CSS_NONE,
				'float': "right"
			});
			_css(_internalSelector('.text'), {
				display: (_text.innerHTML && showText) ? UNDEFINED : JW_CSS_NONE,
				padding: hasCaps ? 0 : "0 10px"
			});

		}
		
		this.element = function() {
			return _container;
		}

		this.setText = function(text) {
			var style = _text.style;
			_text.innerHTML = text ? text.replace(":", ":<br>") : "";
			_redraw();
			style.height = "0";
			style.display = "block";
			if (text) {
				while (numLines(_text) > 2) {
					_text.innerHTML = _text.innerHTML.replace(/(.*) .*$/, "$1...");
				}
			}
			style.height = "";
			style.display = "";
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
			if (_bg && utils.isIE()) _bg.style.opacity = 0;
		}

		var _show = this.show = function() {
			_container.style.opacity = 1;
			if (_bg && utils.isIE()) _bg.style.opacity = 1;
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
		'max-width' : "300px",
		'overflow-y' : "hidden",
		'text-align': JW_CSS_CENTER,
		'-webkit-user-select' : JW_CSS_NONE,
		'-moz-user-select' : JW_CSS_NONE,
		'-ms-user-select' : JW_CSS_NONE,
		'user-select' : JW_CSS_NONE
	});

})(jwplayer.html5);