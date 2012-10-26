/**
 * CSS utility methods for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	var _styleSheets={},
		_styleSheet,
		_rules = {},
		_block = 0,
		exists = utils.exists,
		_ruleIndexes = {},
		_debug = false,
				
		JW_CLASS = '.jwplayer ';

	function _createStylesheet() {
		var styleSheet = document.createElement("style");
		styleSheet.type = "text/css";
		document.getElementsByTagName('head')[0].appendChild(styleSheet);
		return styleSheet;
	}
	
	var _css = utils.css = function(selector, styles, important) {
		if (!_styleSheets[selector]) {
			if (_debug) _styleSheets[selector] = _createStylesheet();
			else {
				if (!_styleSheet || _styleSheet.sheet.cssRules.length > 50000) {
					_styleSheet = _createStylesheet();
				}
				_styleSheets[selector] = _styleSheet;
			}
		}
		
		if (!exists(important)) important = false;
		
		if (!_rules[selector]) {
			_rules[selector] = {};
		}

		for (var style in styles) {
			var val = _styleValue(style, styles[style], important);
			if (exists(_rules[selector][style]) && !exists(val)) {
				delete _rules[selector][style];
			} else if (exists(val)) {
				_rules[selector][style] = val;
			}
		}

		if (_block > 0)
			return;
		
		_updateStylesheet(selector);
	}
	
	_css.block = function() {
		_block++;
	}
	
	_css.unblock = function() {
		_block = Math.max(_block-1, 0);
		if (_block == 0) {
			_applyStyles();
		}
	}
	
	var _applyStyles = function() {
		// IE9 limits the number of style tags in the head, so we need to update the entire stylesheet each time
		for (var selector in _styleSheets) {
			_updateStylesheet(selector);
		}
	}
	
	function _styleValue(style, value, important) {
		if (typeof value === "undefined") {
			return undefined;
		}
		
		var importantString = important ? " !important" : "";

		if (!isNaN(value)) {
			switch (style) {
			case "z-index":
			case "opacity":
				return value + importantString;
				break;
			default:
				if (style.match(/color/i)) {
					return "#" + utils.pad(value.toString(16).replace(/^0x/i,""), 6) + importantString;
				} else if (value === 0) {
					return 0 + importantString;
				} else {
					return Math.ceil(value) + "px" + importantString;
				}
				break;
			}
		} else {
			if (!!value.match(/png|gif|jpe?g/i) && value.indexOf('url') < 0) {
				return "url(" + value + ")";
			}
			return value + importantString;
		}
	}


	function _updateStylesheet(selector) {
		if (_debug) { _styleSheets[selector].innerHTML = _getRuleText(selector); return; }
		
		var sheet = _styleSheets[selector].sheet,
			ruleIndex = _ruleIndexes[selector];

		if (sheet) {
			var rules = sheet.cssRules;
			if (utils.exists(ruleIndex) && ruleIndex < rules.length && rules[ruleIndex].selectorText == selector) {
				sheet.deleteRule(ruleIndex);
			} else {
				_ruleIndexes[selector] = rules.length;	
			}
			sheet.insertRule(_getRuleText(selector), _ruleIndexes[selector]);
		}
		
	}
	
	function _getRuleText(selector) {
		var ruleText = selector + "{\n";
		var styles = _rules[selector];
		for (var style in styles) {
			ruleText += "  "+style + ": " + styles[style] + ";\n";
		}
		ruleText += "}\n";
		return ruleText;
	}
	
	
	/**
	 * Removes all css elements which match a particular style
	 */
	utils.clearCss = function(filter) {
		for (var rule in _rules) {
			if (rule.indexOf(filter) >= 0) {
				delete _rules[rule];
			}
		}
		for (var selector in _styleSheets) {
			if (selector.indexOf(filter) >= 0) {
				_styleSheets[selector].innerHTML = '';
			}
		}
	}
	
	utils.transform = function(element, value) {
		var transform = "-transform", style;
		value = value ? value : "";
		if (typeof element == "string") {
			style = {};
			style['-webkit'+transform] = value;
			style['-ms'+transform] = value;
			style['-moz'+transform] = value;
			style['-o'+transform] = value;
			utils.css(element, style);
		} else {
			transform = "Transform";
			style = element.style;
			style['webkit'+transform] = value;
			style['Moz'+transform] = value;
			style['ms'+transform] = value;
			style['O'+transform] = value;
		}
	}
	
	utils.dragStyle = function(selector, style) {
		utils.css(selector, {
			'-webkit-user-select': style,
			'-moz-user-select': style,
			'-ms-user-select': style,
			'-webkit-user-drag': style,
			'user-select': style,
			'user-drag': style
		});
	}
	
	utils.transitionStyle = function(selector, style) {
		// Safari 5 has problems with CSS3 transitions
		if(navigator.userAgent.match(/5\.\d(\.\d)? safari/i)) return;
		
		utils.css(selector, {
			'-webkit-transition': style,
			'-moz-transition': style,
			'-o-transition': style
		});
	}

	
	utils.rotate = function(domelement, deg) {
		utils.transform(domelement, "rotate(" + deg + "deg)");
	};
	
	function _cssReset() {
		_css(JW_CLASS + ["", "div", "span", "a", "img", "ul", "li", "video"].join(","+JW_CLASS) + ", .jwclick", {
			margin: 0,
			padding: 0,
			border: 0,
			color: '#000000',
			'font-size': "100%",
			font: 'inherit',
			'vertical-align': 'baseline',
			'background-color': 'transparent'
		});
		
		_css(JW_CLASS + "ul", { 'list-style': "none" });
	};

	_cssReset();
	
})(jwplayer.utils);