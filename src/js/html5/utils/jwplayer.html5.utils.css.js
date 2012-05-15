/**
 * CSS utility methods for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	var _styleSheets={},
		_styleSheet,
		_rules = {};

	function _createStylesheet() {
		var styleSheet = document.createElement("style");
		styleSheet.type = "text/css";
		document.getElementsByTagName('head')[0].appendChild(styleSheet);
		return styleSheet;
	}
	
	utils.css = function(selector, styles, important) {
		if (!utils.exists(important)) important = false;
		
		if (utils.isIE()) {
			if (!_styleSheet) {
				_styleSheet = _createStylesheet();
			}
		} else if (!_styleSheets[selector]) {
			_styleSheets[selector] = _createStylesheet();
		}

		if (!_rules[selector]) {
			_rules[selector] = {};
		}

		for (var style in styles) {
			var val = _styleValue(style, styles[style], important);
			if (utils.exists(_rules[selector][style]) && !utils.exists(val)) {
				delete _rules[selector][style];
			} else {
				_rules[selector][style] = val;
			}
		}

		// IE9 limits the number of style tags in the head, so we need to update the entire stylesheet each time
		if (utils.isIE()) {
			_updateAllStyles();
		} else {
			_updateStylesheet(selector, _styleSheets[selector]);
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
					return "#" + utils.pad(value.toString(16), 6) + importantString;
				} else if (value == 0) {
					return 0 + importantString;
				} else {
					return Math.ceil(value) + "px" + importantString;
				}
				break;
			}
		} else {
			return value + importantString;
		}
	}

	function _updateAllStyles() {
		var ruleText = "\n";
		for (var rule in _rules) {
			ruleText += _getRuleText(rule);
		}
		_styleSheet.innerHTML = ruleText;
	}
	
	function _updateStylesheet(selector, sheet) {
		if (sheet) {
			sheet.innerHTML = _getRuleText(selector);
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
})(jwplayer.utils);