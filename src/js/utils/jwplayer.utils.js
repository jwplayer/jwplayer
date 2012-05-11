/**
 * Utility methods for the JW Player.
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	var DOCUMENT = document;
	var WINDOW = window;
	
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

	var _styleSheets={},
		_styleSheet,
		_rules = {};

	function _createStylesheet() {
		var styleSheet = DOCUMENT.createElement("style");
		styleSheet.type = "text/css";
		DOCUMENT.getElementsByTagName('head')[0].appendChild(styleSheet);
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

		if (typeof value == "number") {
			if (isNaN(value)) {
				return undefined;
			}
			switch (style) {
			case "z-index":
			case "opacity":
				return value + importantString;
				break;
			default:
				if (style.match(/color/i)) {
					return "#" + utils.pad(value.toString(16), 6);
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
	
	/** Gets an absolute file path based on a relative filepath * */
	utils.getAbsolutePath = function(path, base) {
		if (!utils.exists(base)) {
			base = DOCUMENT.location.href;
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
			var str = Math.floor(sec / 60) < 10 ? "0" + Math.floor(sec / 60) + ":" : Math.floor(sec / 60) + ":";
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
				left: element.offsetLeft + DOCUMENT.body.scrollLeft, 
				top: element.offsetTop + DOCUMENT.body.scrollTop, 
				width: element.offsetWidth, 
				height: element.offsetHeight
			};
		}
	}
	
	var _userAgentMatch = utils.userAgentMatch = function(regex) {
		var agent = navigator.userAgent.toLowerCase();
		return (agent.match(regex) !== null);
	};

	utils.isIE = function() {
		return _userAgentMatch(/msie/i);
	};
	
	/** Matches iOS and Android devices **/	
	utils.isMobile = function() {
		return _userAgentMatch(/(iP(hone|ad|od))|android/i);
	}

	/**
	 * Detects whether the current browser is mobile Safari.
	 */
	utils.isIOS = function() {
		return _userAgentMatch(/iP(hone|ad|od)/i);
	};
	
	utils.isIPod = function() {
		return _userAgentMatch(/iP(hone|od)/i);
	};

	utils.isIPad = function() {
		return _userAgentMatch(/iPad/i);
	};

	/** Save a setting **/
	utils.saveCookie = function(name, value) {
		DOCUMENT.cookie = "jwplayer." + name + "=" + value + "; path=/";
	}

	/** Retrieve saved  player settings **/
	utils.getCookies = function() {
		var jwCookies = {};
		var cookies = DOCUMENT.cookie.split('; ');
		for (var i=0; i<cookies.length; i++) {
			var split = cookies[i].split('=');
			if (split[0].indexOf("jwplayer.") == 0) {
				jwCookies[split[0].substring(9, split[0].length)] = utils.serialize(split[1]);
			}
		}
		return jwCookies;
	}
	
	/** Loads an XML file into a DOM object * */
	utils.ajax = function(xmldocpath, completecallback, errorcallback) {
		var xmlhttp;
		if (_isCrossdomain(xmldocpath) && utils.exists(WINDOW.XDomainRequest)) {
			// IE9
			xmlhttp = new XDomainRequest();
			xmlhttp.onload = _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback);
			xmlhttp.onerror = _ajaxError(errorcallback, xmldocpath, xmlhttp);
		} else if (utils.exists(WINDOW.XMLHttpRequest)) {
			// Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback);
			xmlhttp.onerror = _ajaxError(errorcallback, xmldocpath);
		} else {
			if (errorcallback) errorcallback();
		}
		 
		try {
			xmlhttp.open("GET", xmldocpath, true);
			xmlhttp.send(null);
		} catch (error) {
			if (errorcallback) errorcallback(xmldocpath);
		}
		return xmlhttp;
	};
	
	function _isCrossdomain(path) {
		if (path && path.indexOf("://") >= 0) {
			if (path.split("/")[2] != WINDOW.location.href.split("/")[2])
				return true
		} 
		return false;	
	}
	
	function _ajaxError(errorcallback, xmldocpath, xmlhttp) {
		return function() {
			errorcallback(xmldocpath);
		}
 	}
	
	function _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback) {
		return function() {
			if (xmlhttp.readyState === 4) {
				if (xmlhttp.status == 200) {
					_ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback)();
				} else if (errorcallback) {
					errorcallback(xmldocpath);
				}
			}
		}
	}
	
	function _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback) {
		return function() {
			// Handle the case where an XML document was returned with an incorrect MIME type.
			if (!utils.exists(xmlhttp.responseXML)) {
				try {
					var parsedXML;
					// Parse XML in FF/Chrome/Safari/Opera
					if (WINDOW.DOMParser) {
						parsedXML = (new DOMParser()).parseFromString(xmlhttp.responseText,"text/xml");
					} else { 
						// Internet Explorer
						parsedXML = new ActiveXObject("Microsoft.XMLDOM");
						parsedXML.async="false";
						parsedXML.loadXML(xmlhttp.responseText);
					}
					if (parsedXML) {
						xmlhttp = utils.extend({}, xmlhttp, {responseXML:parsedXML});
					}
				} catch(e) {
					if (errorcallback) errorcallback(xmldocpath);
					return;
				}
			}
			completecallback(xmlhttp);
		}
	}

	/** Returns the true type of an object * */
	utils.typeOf = function(value) {
		var typeofString = typeof value;
		if (typeofString === 'object') {
			if (!value) return "null";
			return (value instanceof Array) ? 'array' : typeofString;
		} else {
			return typeofString;
		}
	};

	/* Normalizes differences between Flash and HTML5 internal players' event responses. */
	utils.translateEventResponse = function(type, eventProperties) {
		var translated = utils.extend({}, eventProperties);
		if (type == jwplayer.events.JWPLAYER_FULLSCREEN && !translated.fullscreen) {
			translated.fullscreen = translated.message == "true" ? true : false;
			delete translated.message;
		} else if (typeof translated.data == "object") {
			// Takes ViewEvent "data" block and moves it up a level
			translated = utils.extend(translated, translated.data);
			delete translated.data;
		} else if (typeof translated.metadata == "object") {
			utils.deepReplaceKeyName(translated.metadata, ["__dot__","__spc__","__dsh__"], ["."," ","-"]);
		}
		
		var rounders = ["position", "duration", "offset"];
		for (var rounder in rounders) {
			if (translated[rounders[rounder]]) {
				translated[rounders[rounder]] = Math.round(translated[rounders[rounder]] * 1000) / 1000;
			}
		}
		
		return translated;
	}

	/**
	 * Detects whether or not the current player has flash capabilities 
	 * TODO: Add minimum flash version constraint: 9.0.115
	 */
	utils.hasFlash = function() {
		if (typeof navigator.plugins != "undefined" && typeof navigator.plugins['Shockwave Flash'] != "undefined") {
			return true;
		}
		if (typeof WINDOW.ActiveXObject != "undefined") {
			try {
				new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
				return true
			} catch (err) {
			}
		}
		return false;
	};


	/** Wraps an HTML element with another element * */
	utils.wrap = function(originalElement, appendedElement) {
		if (originalElement.parentNode) {
			originalElement.parentNode.replaceChild(appendedElement, originalElement);
		}
		appendedElement.appendChild(originalElement);
	};
	
	/** Finds the location of jwplayer.js and returns the path **/
	utils.getScriptPath = function(scriptName) {
		var scripts = DOCUMENT.getElementsByTagName("script");
		for (var i=0; i<scripts.length; i++) {
			var src = scripts[i].src;
			if (src && src.indexOf(scriptName) >= 0) {
				return src.substr(0, src.indexOf(scriptName));
			}
		}
		return "";
	}

})(jwplayer);
