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
		exists = utils.exists;

	function _createStylesheet() {
		var styleSheet = document.createElement("style");
		styleSheet.type = "text/css";
		document.getElementsByTagName('head')[0].appendChild(styleSheet);
		return styleSheet;
	}
	
	utils.css = function(selector, styles, important) {
		if (!exists(important)) important = false;
		
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
			if (exists(_rules[selector][style]) && !exists(val)) {
				delete _rules[selector][style];
			} else if (exists(val)) {
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
					return "#" + utils.pad(value.toString(16).replace(/^0x/i,""), 6) + importantString;
				} else if (value === 0) {
					return 0 + importantString;
				} else {
					return Math.ceil(value) + "px" + importantString;
				}
				break;
			}
		} else {
			if (!!value.match(/png|gif|jpe?g/i) && value.indexOf('url') != 0) {
				return "url(" + value + ")";
			}
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
		if (sheet && sheet.sheet) {
			sheet.innerHTML = _getRuleText(selector);
			return;
			// This stuff below fixes some performance problems, but causes other issues;
			var rules = sheet.sheet.cssRules;
			for (var i=0; i < rules.length; i++) {
				var rule = rules[i];
				if (rule.selectorText == selector) {
					sheet.sheet.deleteRule(i);
					//rule.disabled = true;
					break;
				}
			}
			sheet.sheet.insertRule(_getRuleText(selector), rules.length);
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
		utils.css(selector, {
			'-webkit-transition': style,
			'-moz-transition': style,
			'-o-transition': style
		});
	}

	
	utils.rotate = function(domelement, deg) {
		utils.transform(domelement, "rotate(" + deg + "deg)");
	};
	
	utils.cssReset = function() {
		utils.css("div, span, a, img, ul, li, video", {
			margin: 0,
			padding: 0,
			border: 0,
			'font-size': "100%",
			font: 'inherit',
			'vertical-align': 'baseline'
		});
		
		utils.css("ul", { 'list-style': "none" });
	};

})(jwplayer.utils);