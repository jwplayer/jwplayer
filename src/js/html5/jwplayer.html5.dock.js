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
		DB_CLASS = ".jwdockbuttons", 
		UNDEFINED = undefined,
		DOCUMENT = document,

		/** Some CSS constants we should use for minimization * */
		JW_CSS_NONE = "none", 
		JW_CSS_BLOCK = "block", 
		JW_CSS_100PCT = "100%",
		JW_CSS_CENTER = "center";

	html5.dock = function(api, config) {
		var _api = api,
			_defaults = {
				iconalpha: 0.75,
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
			_buttonContainer,
			_dockBounds,
			_this = this;

		function _init() {
			_this.visible = false;
			
			_container = _createElement("div", "jwdock");
			_buttonContainer = _createElement("div", "jwdockbuttons");
			_container.appendChild(_buttonContainer);
			_container.id = _id;
			
			_setupElements();
			
			setTimeout(function() {
				_dockBounds = _bounds(_container);
			});
			
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

			_css(DB_CLASS, {
				height: button.height
			});

			_css(_internalSelector("button"), utils.extend(_formatBackground(button), {
				width: button.width,
				cursor: "pointer",
				border: JW_CSS_NONE
			}));
			
			_css(_internalSelector("button:hover"), _formatBackground(buttonOver));
			_css(_internalSelector("button:active"), _formatBackground(buttonActive));
			_css(_internalSelector("button>div"), { opacity: _config.iconalpha });
			_css(_internalSelector("button:hover>div"), { opacity: _config.iconalphaover });
			_css(_internalSelector("button:active>div"), { opacity: _config.iconalphaactive});
			_css(_internalSelector(".jwoverlay"), { top: _config.margin + button.height });
			
			_createImage("capLeft", _buttonContainer);
			_createImage("capRight", _buttonContainer);
			_createImage("divider");
		}
		
		function _formatBackground(elem) {
			if (!(elem && elem.src)) return {};
			return { 
				background: "url("+elem.src+") center",
				'background-size': elem.width+"px "+elem.height+"px"
			}
		}
		
		function _createImage(className, parent) {
			var skinElem = _getSkinElement(className);
			_css(_internalSelector("." + className), utils.extend(_formatBackground(skinElem), {
				width: skinElem.width
			}));
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

		_this.redraw = function() {
			_dockBounds = _bounds(_container);
		};
		
		function _positionTooltip(name) {
			var tooltip = _tooltips[name],
				tipBounds,
				button = _buttons[name],
				dockBounds,
				buttonBounds = _bounds(button.icon);

			tooltip.offsetX(0);
			dockBounds = _bounds(_container);
			_css('#' + tooltip.element().id, {
				left: buttonBounds.left - dockBounds.left + buttonBounds.width / 2
			});
			tipBounds = _bounds(tooltip.element());	
			if (dockBounds.left > tipBounds.left) {
				tooltip.offsetX(dockBounds.left - tipBounds.left + 8);
			}

		}
	
		_this.element = function() {
			return _container;
		}
		
		_this.offset = function(offset) {
			_css(_internalSelector(), { 'margin-left': offset });
		}

		_this.hide = function() {
			if (!_this.visible) return;
			_this.visible = false;
			_container.style.opacity = 0;
			setTimeout(function() {
				_container.style.display = JW_CSS_NONE
			}, 150);
		}

		_this.show = function() {
			if (_this.visible || !_buttonCount) return;
			_this.visible = true;
			_container.style.display = JW_CSS_BLOCK;
			setTimeout(function() {
				_container.style.opacity = 1;
			}, 0);
		}
		
		_this.addButton = function(url, label, clickHandler, id) {
			// Can't duplicate button ids
			if (_buttons[id]) return;
			
			var divider = _createElement("div", "divider", _buttonContainer),
				newButton = _createElement("button", null, _buttonContainer),
				icon = _createElement("div", null, newButton);
		
			icon.id = _id + "_" + id;
			icon.innerHTML = "&nbsp;"
			_css("#"+icon.id, {
				'background-image': url
			});
			
			if (typeof clickHandler == "string") {
				clickHandler = new Function(clickHandler);
			}
			if (!utils.isMobile()) {
				newButton.addEventListener("click", function(evt) {
					clickHandler(evt);
					evt.preventDefault();
				});
			} else {
				var buttonTouch = new utils.touch(newButton);
				buttonTouch.addEventListener(utils.touchEvents.TAP, function(evt) {
					clickHandler(evt);
				});
			}
			
			_buttons[id] = { element: newButton, label: label, divider: divider, icon: icon };
			
			if (label) {
				var tooltip = new html5.overlay(icon.id+"_tooltip", _skin, true),
					tipText = _createElement("div");
				tipText.id = icon.id + "_label";
				tipText.innerHTML = label;
				_css('#'+tipText.id, {
					padding: 3
				});
				tooltip.setContents(tipText);
				
				if(!utils.isMobile()) {
					var timeout;
					newButton.addEventListener('mouseover', function() { 
						clearTimeout(timeout); 
						_positionTooltip(id); 
						tooltip.show();
						utils.foreach(_tooltips, function(i, tooltip) {
							if (i != id) tooltip.hide();
						});
					}, false);
					newButton.addEventListener('mouseout', function() {
						timeout = setTimeout(tooltip.hide, 100); 
					} , false);
					
					_container.appendChild(tooltip.element());
					_tooltips[id] = tooltip;
				}
			}
			
			_buttonCount++;
			_setCaps();
		}
		
		_this.removeButton = function(id) {
			if (_buttons[id]) {
				_buttonContainer.removeChild(_buttons[id].element);
				_buttonContainer.removeChild(_buttons[id].divider);
				delete _buttons[id];
				_buttonCount--;
				_setCaps();
			}
		}
		
		_this.numButtons = function() {
			return _buttonCount;
		}
		
		function _setCaps() {
			_css(DB_CLASS + " .capLeft, " + DB_CLASS + " .capRight", {
				display: _buttonCount ? JW_CSS_BLOCK : JW_CSS_NONE
			});
		}

		_init();
	};

	_css(D_CLASS, {
	  	opacity: 0,
	  	display: JW_CSS_NONE
	});
		
	_css(D_CLASS + " > *", {
		height: JW_CSS_100PCT,
	  	'float': "left"
	});

	_css(D_CLASS + " > .jwoverlay", {
		height: 'auto',
	  	'float': JW_CSS_NONE,
	  	'z-index': 99
	});

	_css(DB_CLASS + " button", {
		position: "relative"
	});
	
	_css(DB_CLASS + " > *", {
		height: JW_CSS_100PCT,
	  	'float': "left"
	});

	_css(DB_CLASS + " .divider", {
		display: JW_CSS_NONE
	});

	_css(DB_CLASS + " button ~ .divider", {
		display: JW_CSS_BLOCK
	});

	_css(DB_CLASS + " .capLeft, " + DB_CLASS + " .capRight", {
		display: JW_CSS_NONE
	});

	_css(DB_CLASS + " .capRight", {
		'float': "right"
	});
	
	_css(DB_CLASS + " button > div", {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		margin: 5,
		position: "absolute",
		'background-position': "center",
		'background-repeat': "no-repeat"
	});

	utils.transitionStyle(D_CLASS, "background .15s, opacity .15s");
	utils.transitionStyle(D_CLASS + " .jwoverlay", "opacity .15s");
	utils.transitionStyle(DB_CLASS + " button div", "opacity .15s");

})(jwplayer.html5);