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
		_bounds = utils.bounds,

		D_CLASS = ".jwdock", 
		UNDEFINED = undefined,
		DOCUMENT = document,

		/** Some CSS constants we should use for minimization * */
		JW_CSS_NONE = "none", 
		JW_CSS_100PCT = "100%",
		JW_CSS_CENTER = "center",
		JW_CSS_ABSOLUTE = "absolute";

	html5.dock = function(api, config) {
		var _api = api,
			_defaults = {
				iconalpha: 0.8,
				iconalphaactive: 0.5,
				iconalphaover: 1,
				margin: 8
			},
			_config = utils.extend({}, _defaults, config), 
			_id = _api.id + "_dock",
			_skin = _api.skin,
			_height,
			_buttonCount = 0,
			_buttons = {},
			_tooltips = {},
			_container,
			_dockBounds,
			_this = this;

		function _init() {
			_this.visible = false;
			
			_container = _createElement("div", "jwdock");
			_container.id = _id;

			_setupElements();
			
			setTimeout(function() {
				_dockBounds = _bounds(_container);
			});
			
			window.addEventListener('mousemove', _moveHandler, false);
			window.addEventListener('click', _clickHandler, false);
		}
		
		function _setupElements() {
			var button = _getSkinElement('button'),
				buttonOver = _getSkinElement('buttonOver'),
				buttonActive = _getSkinElement('buttonActive');
			
			if (!button) return;
			
			_css(_internalSelector(), {
				height: button.height,
				padding: _config.margin
			});

			_css(_internalSelector("button"), {
				width: button.width,
				cursor: "pointer",
				border: "none",
				background: button.src
			});
			
			if (buttonOver.src) _css(_internalSelector("button.hover"), { background: buttonOver.src });
			if (buttonActive.src) _css(_internalSelector("button.active"), { background: buttonActive.src });
			_css(_internalSelector("button>div"), { opacity: _config.iconalpha });
			_css(_internalSelector("button.hover>div"), { opacity: _config.iconalphaover });
			_css(_internalSelector("button.active>div"), { opacity: _config.iconalphaactive});
			_css(_internalSelector(".jwoverlay"), { top: button.height });
			
			_createImage("capLeft", _container);
			_createImage("capRight", _container);
			_createImage("divider");
		}
		
		function _createImage(className, parent) {
			var skinElem = _getSkinElement(className);
			_css(_internalSelector("." + className), {
				width: skinElem.width,
				background: skinElem.src
			});
			return _createElement("div", className, parent);
		}
		
		function _internalSelector(selector, hover) {
			return "#" + _id + " " + (selector ? selector : "");
		}

		function _createElement(type, name, parent) {
			var elem = DOCUMENT.createElement(type);
			if (name) elem.className = name;
			if (parent) parent.appendChild(elem);
			return elem;
		}
		
		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('dock', name);
			return elem ? elem : { width: 0, height: 0, src: "" };
		}

		_this.redraw = function() {};
		
		function _positionTooltip(name) {
			var tooltip = _tooltips[name],
				tipBounds,
				button = _buttons[name],
				buttonBounds = _bounds(button.icon);

			tooltip.offsetX(0);
			_css('#' + tooltip.element().id, {
				left: buttonBounds.left - _dockBounds.left + buttonBounds.width / 2
			});
			tipBounds = _bounds(tooltip.element());
			if (_dockBounds.left > tipBounds.left) {
				tooltip.offsetX(_dockBounds.left - tipBounds.left);
			}

		}
	
		_this.element = function() {
			return _container;
		}
		
		_this.offset = function(offset) {
			_css(_internalSelector(), { 'margin-left': offset });
		}

		_this.hide = function() {
			_this.visible = false;
//			_css(_internalSelector(), {
//				opacity: 0
//			});
			_container.style.opacity = 0;
			_container.style.visibility = "hidden";
		}

		_this.show = function() {
			_this.visible = true;
//			_css(_internalSelector(), {
//				visibility: "visible",
//				opacity: 1
//			});
			_container.style.opacity = 1;
			_container.style.visibility = "visible";
		}
		
		_this.addButton = function(url, label, clickHandler, id) {
			// Can't duplicate button ids
			if (_buttons[id]) return;
			
			var divider = _createElement("div", "divider", _container),
				newButton = _createElement("button", null, _container),
				icon = _createElement("div", null, newButton);
		
			icon.id = _id + "_" + id;
			icon.innerHTML = "&nbsp;"
			_css("#"+icon.id, {
				'background-image': url
			});
			
			if (typeof clickHandler == "string") {
				clickHandler = new Function(clickHandler);
			}
			
			_buttons[id] = { element: newButton, label: label, divider: divider, icon: icon, click: clickHandler };
			
			if (label) {
				var tooltip = new html5.overlay(icon.id+"_tooltip", _skin, true),
					tipText = _createElement("div");
				tipText.innerHTML = label;
				tooltip.setContents(tipText);
				
				_container.appendChild(tooltip.element());
				_tooltips[id] = tooltip;
			}
			
			_buttonCount++;
			_setCaps();
			
			setTimeout(function() {
				_buttons[id].bounds = _bounds(_buttons[id].element);
			}, 100);
		}
		
		
		
		function _moveHandler(evt) {
			if (!_this.visible) return;
			var button, i, bounds;
			for (i in _buttons) {
				button = _buttons[i];
				bounds = button.bounds;
				if (bounds) {
					if (evt.pageX > bounds.left && evt.pageX < bounds.right && evt.pageY > bounds.top && evt.pageY < bounds.bottom) {
						_buttonOver(i); 
					} else {
						_buttonOut(i);
					}
				}
			}
		}
		
		function _clickHandler() {
			if (hovering && typeof _buttons[hovering].click == "function") {
				_buttons[hovering].click();
			}
				
				
		}
		
		var hovering;
		
		function _buttonOver(name) {
			if (hovering == name) return;
			if (hovering) _buttonOut(hovering);
			hovering = name;
			_positionTooltip(name); 
			if (_tooltips[name]) _tooltips[name].show();
			_buttons[name].element.className += " hover";
		}
		
		function _buttonOut(name) {
			if (name == hovering) {
				if (_tooltips[name]) _tooltips[name].hide();
				_buttons[name].element.className = _buttons[name].element.className.replace(/\s+hover/,"");
				hovering = null;
			}
		}
		
		_this.removeButton = function(id) {
			if (_buttons[id]) {
				_container.removeChild(_buttons[id].element);
				_container.removeChild(_buttons[id].divider);
				delete _buttons[id];
				_buttonCount--;
				_setCaps();
			}
		}
		
		function _setCaps() {
			_css(D_CLASS + " .capLeft, " + D_CLASS + " .capRight", {
				display: _buttonCount ? "block" : "none"
			});
		}

		_init();
	};

	_css(D_CLASS, {
	  	position: "absolute",
	  	//visibility: "hidden",
	  	opacity: 0
//	  	overflow: "hidden"
	});
	
	
	_css(D_CLASS + " button", {
		position: "relative",
	});
	
	_css(D_CLASS + " > *", {
		height: "100%",
	  	'float': "left"
	});

	_css(D_CLASS + " > .jwoverlay", {
		height: 'auto',
	  	'float': "none"
	});

	_css(D_CLASS + " .divider", {
		display: "none"
	});

	_css(D_CLASS + " button ~ .divider", {
		display: "block"
	});

	_css(D_CLASS + " .capLeft, " + D_CLASS + " .capRight", {
		display: "none"
	});

	_css(D_CLASS + " .capRight", {
		'float': "right"
	});
	
	_css(D_CLASS + " button > div", {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		margin: 5,
		position: "absolute",
		'background-size': "contain",
		'background-position': "center",
		'background-repeat': "no-repeat"
	});

	utils.transitionStyle(D_CLASS, "background .15s, opacity .15s");
	utils.transitionStyle(D_CLASS + " button div", "opacity .15s");
	utils.transitionStyle(D_CLASS + " .jwoverlay", "opacity .15s");

})(jwplayer.html5);