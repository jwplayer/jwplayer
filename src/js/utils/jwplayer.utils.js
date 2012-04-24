/**
 * Utility methods for the JW Player.
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	//Declare namespace
	var utils = jwplayer.utils = function() {
	};

	/**
	 * Returns true if the value of the object is null, undefined or the empty
	 * string
	 * 
	 * @param a The variable to inspect
	 */
	utils.exists = function(item) {
		switch (typeof (item)) {
		case "string":
			return (item.length > 0);
			break;
		case "object":
			return (item !== null);
		case "undefined":
			return false;
		}
		return true;
	}

	var _styleSheet;
	var _rules = {}
	
	/**
	 * @param {Object} or {String} domelement If domelement is a string, create a document-wide CSS rule for that string 
	 * @param {Object} styles
	 */
	utils.css = function(domelement, styles) {
		if (utils.exists(domelement)) {
			for (var style in styles) {
				try {
					if (typeof styles[style] === "undefined") {
						continue;
					} else if (typeof styles[style] == "number" && !(style == "zIndex" || style == "opacity")) {
						if (isNaN(styles[style])) {
							continue;
						}
						if (style.match(/color/i)) {
							styles[style] = "#" + utils.strings.pad(styles[style].toString(16), 6);
						} else {
							styles[style] = Math.ceil(styles[style]) + "px";
						}
					}
					if (styles[style]) {
						domelement.style[style] = styles[style];
					}
				} catch (err) {
				}
			}
		}
	};
	
	utils.appendStylesheet = function(selector, styles) {
		if (!_styleSheet) {
			_styleSheet = document.createElement("style");
			_styleSheet.type = "text/css";
			document.getElementsByTagName('head')[0].appendChild(_styleSheet);
		}

		if (!_rules[selector]) {
			_rules[selector] = {};
		}

		for (var style in styles) {
			var val = _styleValue(style, styles[style]);
			if (utils.exists(_rules[selector][style]) && !utils.exists(val)) {
				delete _rules[selector][style];
			} else {
				_rules[selector][style] = val;
			}
		}

		_updateStylesheet();
	}
	
	function _styleValue(style, value) {
		if (typeof value === "undefined") {
			return undefined;
		} 

		if (typeof value == "number") {
			if (isNaN(value)) {
				return undefined;
			}
			switch (style) {
			case "z-index":
			case "opacity":
				return value;
				break;
			default:
				if (style.match(/color/i)) {
					return "#" + utils.strings.pad(value.toString(16), 6);
				} else {
					return Math.ceil(value) + "px";
				}
				break;
			}
		} else {
			return value;
		}
	}
	
	function _updateStylesheet() {
		if (_styleSheet) {
			var ruleText = "";
			for (var rule in _rules) {
				var styles = _rules[rule];
				ruleText += rule + "{\n";
				for (var style in styles) {
					ruleText += "  "+style + ": " + styles[style] + ";\n";
				}
				ruleText += "}\n";
			}
			_styleSheet.innerHTML = ruleText;
		}
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
		_updateStylesheet();
	}
	
	/** Gets an absolute file path based on a relative filepath * */
	utils.getAbsolutePath = function(path, base) {
		if (!utils.exists(base)) {
			base = document.location.href;
		}
		if (!utils.exists(path)) {
			return undefined;
		}
		if (isAbsolutePath(path)) {
			return path;
		}
		var protocol = base.substring(0, base.indexOf("://") + 3);
		var domain = base.substring(protocol.length, base.indexOf('/', protocol.length + 1));
		var patharray;
		if (path.indexOf("/") === 0) {
			patharray = path.split("/");
		} else {
			var basepath = base.split("?")[0];
			basepath = basepath.substring(protocol.length + domain.length + 1, basepath.lastIndexOf('/'));
			patharray = basepath.split("/").concat(path.split("/"));
		}
		var result = [];
		for ( var i = 0; i < patharray.length; i++) {
			if (!patharray[i] || !utils.exists(patharray[i]) || patharray[i] == ".") {
				continue;
			} else if (patharray[i] == "..") {
				result.pop();
			} else {
				result.push(patharray[i]);
			}
		}
		return protocol + domain + "/" + result.join("/");
	};

	function isAbsolutePath(path) {
		if (!utils.exists(path)) {
			return;
		}
		var protocol = path.indexOf("://");
		var queryparams = path.indexOf("?");
		return (protocol > 0 && (queryparams < 0 || (queryparams > protocol)));
	}

	/** Merges a list of objects **/
	utils.extend = function() {
		var args = utils.extend['arguments'];
		if (args.length > 1) {
			for ( var i = 1; i < args.length; i++) {
				for ( var element in args[i]) {
					args[0][element] = args[i][element];
				}
			}
			return args[0];
		}
		return null;
	};

	/**
	 * Cleans up a css dimension (e.g. '420px') and returns an integer.
	 */
	utils.parseDimension = function(dimension) {
		if (typeof dimension == "string") {
			if (dimension === "") {
				return 0;
			} else if (dimension.lastIndexOf("%") > -1) {
				return dimension;
			} else {
				return parseInt(dimension.replace("px", ""), 10);
			}
		}
		return dimension;
	}

	/** Format the elapsed / remaining text. **/
	utils.timeFormat = function(sec) {
		if (sec > 0) {
			str = Math.floor(sec / 60) < 10 ? "0" + Math.floor(sec / 60) + ":" : Math.floor(sec / 60) + ":";
			str += Math.floor(sec % 60) < 10 ? "0" + Math.floor(sec % 60) : Math.floor(sec % 60);
			return str;
		} else {
			return "00:00";
		}
	}

	/** Logger * */
	utils.log = function(msg, obj) {
		if (typeof console != "undefined" && typeof console.log != "undefined") {
			if (obj) {
				console.log(msg, obj);
			} else {
				console.log(msg);
			}
		}
	};

	/** Replacement for getBoundingClientRect, which isn't supported in iOS 3.1.2 **/
	utils.getBoundingClientRect = function(element) {
		if (typeof element.getBoundingClientRect == "function") {
			return element.getBoundingClientRect();
		} else {
			return { 
				left: element.offsetLeft + document.body.scrollLeft, 
				top: element.offsetTop + document.body.scrollTop, 
				width: element.offsetWidth, 
				height: element.offsetHeight
			};
		}
	}
	
	utils.userAgentMatch = function(regex) {
		var agent = navigator.userAgent.toLowerCase();
		return (agent.match(regex) !== null);
	};
	
	/** Matches iOS and Android devices **/	
	utils.isMobile = function() {
		return utils.userAgentMatch(/(iP(hone|ad|od))|android/i);
	}	
	
})(jwplayer);
