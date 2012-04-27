/**
 * JW Player Source start cap
 * 
 * This will appear at the top of the JW Player source
 * 
 * @version 6.0
 */

 if (typeof jwplayer == "undefined") {/**
 * JW Player namespace definition
 * @version 6.0
 */
jwplayer = function(container) {
	if (jwplayer.api) {
		return jwplayer.api.selectPlayer(container);
	}
};

var $jw = jwplayer;

jwplayer.version = '6.0';

// "Shiv" method for older IE browsers; required for parsing media tags
jwplayer.vid = document.createElement("video");
jwplayer.audio = document.createElement("audio");
jwplayer.source = document.createElement("source");/**
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
	
	var foo =false;
	
	utils.appendStylesheet = function(selector, styles) {
		if (!_styleSheet) {
			_styleSheet = DOCUMENT.createElement("style");
			_styleSheet.type = "text/css";
			DOCUMENT.getElementsByTagName('head')[0].appendChild(_styleSheet);
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
				left: element.offsetLeft + DOCUMENT.body.scrollLeft, 
				top: element.offsetTop + DOCUMENT.body.scrollTop, 
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
	
	utils.isIPod = function() {
		return jwplayer.utils.userAgentMatch(/iP(hone|od)/i);
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
				jwCookies[split[0].substring(9, split[0].length)] = split[1];
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
			if (path.split("/")[2] != window.location.href.split("/")[2])
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
						xmlhttp = jwplayer.utils.extend({}, xmlhttp, {responseXML:parsedXML});
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

	/**
	 * Stretches domelement based on stretching. parentWidth, parentHeight,
	 * elementWidth, and elementHeight are required as the elements dimensions
	 * change as a result of the stretching. Hence, the original dimensions must
	 * always be supplied.
	 * 
	 * @param {String}
	 *            stretching
	 * @param {DOMElement}
	 *            domelement
	 * @param {Number}
	 *            parentWidth
	 * @param {Number}
	 *            parentHeight
	 * @param {Number}
	 *            elementWidth
	 * @param {Number}
	 *            elementHeight
	 */
	utils.stretch = function(stretching, domelement, parentWidth,
			parentHeight, elementWidth, elementHeight, transform) {

		var xscale = (utils.exists(parentWidth) && utils.exists(elementWidth)) ? parentWidth / elementWidth : 0,
			yscale = (utils.exists(parentHeight) && utils.exists(elementHeight)) ? parentHeight / elementHeight : 0,
			x = 0, y = 0,
			style = {},
			stretchClass;
		
		switch (stretching.toLowerCase()) {
		case _stretching.NONE:
		case _stretching.FILL:
		case _stretching.EXACTFIT:
			stretchClass = "jw" + stretching.toLowerCase();
			break;
		case _stretching.UNIFORM:
			stretchClass = "jw" + stretching.toLowerCase();
			if (xscale > yscale) {
				if ( (elementWidth * yscale) / parentWidth > 0.95) {
					stretchClass = "jwexactfit";
				}
			} else {
				if ( (elementHeight * xscale) / parentHeight > 0.95) {
					stretchClass = "jwexactfit";
				}
			}
			break;
		default:
			break;
		}

		domelement.className = domelement.className.replace(/jw(none|exactfit|uniform|fill)/g, "");
		domelement.className += " " + stretchClass;
	};
	
	/** Stretching options **/
	var _stretching = utils.stretching = {
		NONE : "none",
		FILL : "fill",
		UNIFORM : "uniform",
		EXACTFIT : "exactfit"
	};

})(jwplayer);
/**
 * String utilities for the JW Player.
 *
 * @version 6.0
 */
(function(utils) {

	var strings = utils.strings = function() {
	};
	
	/** Removes whitespace from the beginning and end of a string **/
	strings.trim = function(inputString) {
		return inputString.replace(/^\s*/, "").replace(/\s*$/, "");
	};
	
	/**
	 * Pads a string
	 * @param {String} string
	 * @param {Number} length
	 * @param {String} padder
	 */
	strings.pad = function (string, length, padder) {
		if (!padder){
			padder = "0";
		}
		while (string.length < length) {
			string = padder + string;
		}
		return string;
	}
	
		/**
	 * Basic serialization: string representations of booleans and numbers are returned typed;
	 * strings are returned urldecoded.
	 *
	 * @param {String} val	String value to serialize.
	 * @return {Object}		The original value in the correct primitive type.
	 */
	strings.serialize = function(val) {
		if (val == null) {
			return null;
		} else if (val == 'true') {
			return true;
		} else if (val == 'false') {
			return false;
		} else if (isNaN(Number(val)) || val.length > 5 || val.length == 0) {
			return val;
		} else {
			return Number(val);
		}
	}
	
	
	/**
	 * Convert a time-representing string to a number.
	 *
	 * @param {String}	The input string. Supported are 00:03:00.1 / 03:00.1 / 180.1s / 3.2m / 3.2h
	 * @return {Number}	The number of seconds.
	 */
	strings.seconds = function(str) {
		str = str.replace(',', '.');
		var arr = str.split(':');
		var sec = 0;
		if (str.substr(-1) == 's') {
			sec = Number(str.substr(0, str.length - 1));
		} else if (str.substr(-1) == 'm') {
			sec = Number(str.substr(0, str.length - 1)) * 60;
		} else if (str.substr(-1) == 'h') {
			sec = Number(str.substr(0, str.length - 1)) * 3600;
		} else if (arr.length > 1) {
			sec = Number(arr[arr.length - 1]);
			sec += Number(arr[arr.length - 2]) * 60;
			if (arr.length == 3) {
				sec += Number(arr[arr.length - 3]) * 3600;
			}
		} else {
			sec = Number(str);
		}
		return sec;
	}
	
	
	/**
	 * Get the value of a case-insensitive attribute in an XML node
	 * @param {XML} xml
	 * @param {String} attribute
	 * @return {String} Value
	 */
	strings.xmlAttribute = function(xml, attribute) {
		for (var attrib = 0; attrib < xml.attributes.length; attrib++) {
			if (xml.attributes[attrib].name && xml.attributes[attrib].name.toLowerCase() == attribute.toLowerCase()) 
				return xml.attributes[attrib].value.toString();
		}
		return "";
	}
	
	/**
	 * Converts a JSON object into its string representation.
	 * @param obj {Object} String, Number, Array or nested Object to serialize
	 * Serialization code borrowed from 
	 */
	strings.jsonToString = function(obj) {
		// Use browser's native JSON implementation if it exists.
		var JSON = JSON || {}
		if (JSON && JSON.stringify) {
				return JSON.stringify(obj);
		}

		var type = typeof (obj);
		if (type != "object" || obj === null) {
			// Object is string or number
			if (type == "string") {
				obj = '"'+obj.replace(/"/g, '\\"')+'"';
			} else {
				return String(obj);
			}
		}
		else {
			// Object is an array or object
			var toReturn = [],
				isArray = (obj && obj.constructor == Array);
				
			for (var item in obj) {
				var value = obj[item];
				
				switch (typeof(value)) {
					case "string":
						value = '"' + value.replace(/"/g, '\\"') + '"';
						break;
					case "object":
						if (utils.exists(value)) {
							value = strings.jsonToString(value);
						}
						break;
				}
				if (isArray) {
					// Array
					if (typeof(value) != "function") {
						toReturn.push(String(value));
					}
				} else {
					// Object
					if (typeof(value) != "function") {
						toReturn.push('"' + item + '":' + String(value));
					}
				}
			}
			
			if (isArray) {
				return "[" + String(toReturn) + "]";
			} else {
				return "{" + String(toReturn) + "}";
			}
		}
	}
	
})(jwplayer.utils);
/**
 * Utility methods for the JW Player.
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(utils) {
	var _colorPattern = new RegExp(/^(#|0x)[0-9a-fA-F]{3,6}/);
	
	utils.typechecker = function(value, type) {
		type = !utils.exists(type) ? _guessType(value) : type;
		return _typeData(value, type);
	};
	
	function _guessType(value) {
		var bools = ["true", "false", "t", "f"];
		if (bools.toString().indexOf(value.toLowerCase().replace(" ", "")) >= 0) {
			return "boolean";
		} else if (_colorPattern.test(value)) {
			return "color";
		} else if (!isNaN(parseInt(value, 10)) && parseInt(value, 10).toString().length == value.length) {
			return "integer";
		} else if (!isNaN(parseFloat(value)) && parseFloat(value).toString().length == value.length) {
			return "float";
		}
		return "string";
	}
	
	function _typeData(value, type) {
		if (!utils.exists(type)) {
			return value;
		}
		
		switch (type) {
			case "color":
				if (value.length > 0) {
					return _stringToColor(value);
				}
				return null;
			case "integer":
				return parseInt(value, 10);
			case "float":
				return parseFloat(value);
			case "boolean":
				if (value.toLowerCase() == "true") {
					return true;
				} else if (value == "1") {
					return true;
				}
				return false;
		}
		return value;
	}
	
	function _stringToColor(value) {
		value = value.replace(/(#|0x)?([0-9A-F]{3,6})$/gi, "$2");
		if (value.length == 3) {
			value = value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);
		}
		return parseInt(value, 16);
	}
	
})(jwplayer.utils);
/**
 * Event namespace defintion for the JW Player
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	jwplayer.events = {
		// General Events
		COMPLETE : 'COMPLETE',
		ERROR : 'ERROR',

		// API Events
		API_READY : 'jwplayerAPIReady',
		JWPLAYER_READY : 'jwplayerReady',
		JWPLAYER_FULLSCREEN : 'jwplayerFullscreen',
		JWPLAYER_RESIZE : 'jwplayerResize',
		JWPLAYER_ERROR : 'jwplayerError',

		// Media Events
		JWPLAYER_MEDIA_BEFOREPLAY : 'jwplayerMediaBeforePlay',
		JWPLAYER_MEDIA_BEFORECOMPLETE : 'jwplayerMediaBeforeComplete',
		JWPLAYER_COMPONENT_SHOW : 'jwplayerComponentShow',
		JWPLAYER_COMPONENT_HIDE : 'jwplayerComponentHide',
		JWPLAYER_MEDIA_BUFFER : 'jwplayerMediaBuffer',
		JWPLAYER_MEDIA_BUFFER_FULL : 'jwplayerMediaBufferFull',
		JWPLAYER_MEDIA_ERROR : 'jwplayerMediaError',
		JWPLAYER_MEDIA_LOADED : 'jwplayerMediaLoaded',
		JWPLAYER_MEDIA_COMPLETE : 'jwplayerMediaComplete',
		JWPLAYER_MEDIA_SEEK : 'jwplayerMediaSeek',
		JWPLAYER_MEDIA_TIME : 'jwplayerMediaTime',
		JWPLAYER_MEDIA_VOLUME : 'jwplayerMediaVolume',
		JWPLAYER_MEDIA_META : 'jwplayerMediaMeta',
		JWPLAYER_MEDIA_MUTE : 'jwplayerMediaMute',

		// State events
		JWPLAYER_PLAYER_STATE : 'jwplayerPlayerState',
		state : {
			BUFFERING : 'BUFFERING',
			IDLE : 'IDLE',
			PAUSED : 'PAUSED',
			PLAYING : 'PLAYING',
			COMPLETED : 'COMPLETED'
		},

		// Playlist Events
		JWPLAYER_PLAYLIST_LOADED : 'jwplayerPlaylistLoaded',
		JWPLAYER_PLAYLIST_ITEM : 'jwplayerPlaylistItem',

		// Instream events
		JWPLAYER_INSTREAM_CLICK : 'jwplayerInstreamClicked',
		JWPLAYER_INSTREAM_DESTROYED : 'jwplayerInstreamDestroyed'
	};

})(jwplayer);
/**
 * Event dispatcher for the JW Player
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(events) {
	var _utils = jwplayer.utils; 
	
	events.eventdispatcher = function(id, debug) {
		var _id = id,
			_debug = debug,
			_listeners, _globallisteners;
		
		/** Clears all event listeners **/
		this.resetEventListeners = function() {
			_listeners = {};
			_globallisteners = [];
		};
		
		this.resetEventListeners();
		
		/** Add an event listener for a specific type of event. **/
		this.addEventListener = function(type, listener, count) {
			try {
				if (!_utils.exists(_listeners[type])) {
					_listeners[type] = [];
				}
				
				if (_utils.typeOf(listener) == "string") {
					listener = ( new Function( 'return ' + listener ) )();
				}
				_listeners[type].push({
					listener: listener,
					count: count
				});
			} catch (err) {
				_utils.log("error", err);
			}
			return false;
		};
		
		/** Remove an event listener for a specific type of event. **/
		this.removeEventListener = function(type, listener) {
			if (!_listeners[type]) {
				return;
			}
			try {
				for (var listenerIndex = 0; listenerIndex < _listeners[type].length; listenerIndex++) {
					if (_listeners[type][listenerIndex].listener.toString() == listener.toString()) {
						_listeners[type].splice(listenerIndex, 1);
						break;
					}
				}
			} catch (err) {
				_utils.log("error", err);
			}
			return false;
		};
		
		/** Add an event listener for all events. **/
		this.addGlobalListener = function(listener, count) {
			try {
				if (_utils.typeOf(listener) == "string") {
					listener = ( new Function( 'return ' + listener ) )();
				}
				_globallisteners.push({
					listener: listener,
					count: count
				});
			} catch (err) {
				_utils.log("error", err);
			}
			return false;
		};
		
		/** Add an event listener for all events. **/
		this.removeGlobalListener = function(listener) {
			if (!listener) {
				return;
			}
			try {
				for (var globalListenerIndex = 0; globalListenerIndex < _globallisteners.length; globalListenerIndex++) {
					if (_globallisteners[globalListenerIndex].listener.toString() == listener.toString()) {
						_globallisteners.splice(globalListenerIndex, 1);
						break;
					}
				}
			} catch (err) {
				_utils.log("error", err);
			}
			return false;
		};
		
		
		/** Send an event **/
		this.sendEvent = function(type, data) {
			if (!_utils.exists(data)) {
				data = {};
			}
			_utils.extend(data, {
				id: _id,
				version: jwplayer.version,
				type: type
			});
			if (_debug) {
				_utils.log(type, data);
			}
			if (_utils.typeOf(_listeners[type]) != "undefined") {
				for (var listenerIndex = 0; listenerIndex < _listeners[type].length; listenerIndex++) {
					try {
						_listeners[type][listenerIndex].listener(data);
					} catch (err) {
						_utils.log("There was an error while handling a listener: " + err.toString(), _listeners[type][listenerIndex].listener);
					}
					if (_listeners[type][listenerIndex]) {
						if (_listeners[type][listenerIndex].count === 1) {
							delete _listeners[type][listenerIndex];
						} else if (_listeners[type][listenerIndex].count > 0) {
							_listeners[type][listenerIndex].count = _listeners[type][listenerIndex].count - 1;
						}
					}
				}
			}
			var globalListenerIndex;
			for (globalListenerIndex = 0; globalListenerIndex < _globallisteners.length; globalListenerIndex++) {
				try {
					_globallisteners[globalListenerIndex].listener(data);
				} catch (err) {
					_utils.log("There was an error while handling a listener: " + err.toString(), _globallisteners[globalListenerIndex].listener);
				}
				if (_globallisteners[globalListenerIndex]) {
					if (_globallisteners[globalListenerIndex].count === 1) {
						delete _globallisteners[globalListenerIndex];
					} else if (_globallisteners[globalListenerIndex].count > 0) {
						_globallisteners[globalListenerIndex].count = _globallisteners[globalListenerIndex].count - 1;
					}
				}
			}
		};
	};
})(jwplayer.events);
/**
 * jwplayer.html5 namespace
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	jwplayer.html5 = {}
})(jwplayer);/**
 * HTML5-only utilities for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	html5.utils = {};
})(jwplayer.html5);/**
 * Utility methods for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	var animations = utils.animations = function() {
	};
	
	animations.transform = function(domelement, value) {
		domelement.style.webkitTransform = value;
		domelement.style.MozTransform = value;
		domelement.style.OTransform = value;
		domelement.style.msTransform = value;
	};
	
	animations.transformOrigin = function(domelement, value) {
		domelement.style.webkitTransformOrigin = value;
		domelement.style.MozTransformOrigin = value;
		domelement.style.OTransformOrigin = value;
		domelement.style.msTransformOrigin = value;
	};
	
	animations.rotate = function(domelement, deg) {
		animations.transform(domelement, "rotate(" + deg + "deg)");
	};
	
})(jwplayer.html5.utils);
/**
 * Parsers namespace declaration
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	html5.parsers = {
		localName : function(node) {
			if (!node) {
				return "";
			} else if (node.localName) {
				return node.localName;
			} else if (node.baseName) {
				return node.baseName;
			} else {
				return "";
			}
		},
		textContent : function(node) {
			if (!node) {
				return "";
			} else if (node.textContent) {
				return node.textContent;
			} else if (node.text) {
				return node.text;
			} else {
				return "";
			}
		},
		getChildNode : function(parent, index) {
			return parent.childNodes[index];
		},
		numChildren : function(parent) {
			if (parent.childNodes) {
				return parent.childNodes.length;
			} else {
				return 0;
			}
		}

	};
})(jwplayer.html5);
/**
 * Parse a feed item for JWPlayer content.
 * 
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(jwplayer) {
	var _parsers = jwplayer.html5.parsers;
	
	var jwparser = _parsers.jwparser = function() {
	};

	var PREFIX = 'jwplayer';

	/**
	 * Parse a feed entry for JWPlayer content.
	 * 
	 * @param {XML}
	 *            obj The XML object to parse.
	 * @param {Object}
	 *            itm The playlistentry to amend the object to.
	 * @return {Object} The playlistentry, amended with the JWPlayer info.
	 */
	jwparser.parseEntry = function(obj, itm) {
		for ( var i = 0; i < obj.childNodes.length; i++) {
			var node = obj.childNodes[i];
			if (node.prefix == PREFIX) {
				var _localName = _parsers.localName(node);
				itm[_localName] = jwplayer.utils.strings.serialize(_parsers.textContent(node));
				if (_localName == "file" && itm.levels) {
					// jwplayer namespace file should override existing level
					// (probably set in MediaParser)
					delete itm.levels;
				}
			}
			if (!itm['file']) {
				itm['file'] = itm['link'];
			}
		}
		return itm;
	}
})(jwplayer);/**
 * Parse a MRSS group into a playlistitem (used in RSS and ATOM).
 *
 * author zach
 * modified pablo
 * version 6.0
 */
(function(parsers) {
	var _strings = jwplayer.utils.strings,
		_xmlAttribute = _strings.xmlAttribute,
		_localName = parsers.localName,
		_textContent = parsers.textContent,
		_numChildren = parsers.numChildren;
	
	
	var mediaparser = parsers.mediaparser = function() {};
	
	/** Prefix for the MRSS namespace. **/
	var PREFIX = 'media';
	
	/**
	 * Parse a feeditem for Yahoo MediaRSS extensions.
	 * The 'content' and 'group' elements can nest other MediaRSS elements.
	 * @param	{XML}		obj		The entire MRSS XML object.
	 * @param	{Object}	itm		The playlistentry to amend the object to.
	 * @return	{Object}			The playlistentry, amended with the MRSS info.
	 **/
	mediaparser.parseGroup = function(obj, itm) {
		for (var i = 0; i < _numChildren(obj); i++) {
			var node = obj.childNodes[i];
			if (node.prefix == PREFIX) {
				if (!_localName(node)){
					continue;
				}
				switch (_localName(node).toLowerCase()) {
					case 'content':
						itm['file'] = _xmlAttribute(node, 'url');
						if (_xmlAttribute(node, 'duration')) {
							itm['duration'] = _strings.seconds(_xmlAttribute(node, 'duration'));
						}
						if (_xmlAttribute(node, 'start')) {
							itm['start'] = _strings.seconds(_xmlAttribute(node, 'start'));
						}
						if (_numChildren(node) > 0) {
							itm = mediaparser.parseGroup(node, itm);
						}
						if (_xmlAttribute(node, 'width')
								|| _xmlAttribute(node, 'bitrate')
								|| _xmlAttribute(node, 'url')) {
							if (!itm.levels) {
								itm.levels = [];
							}
							itm.levels.push({
								width: _xmlAttribute(node, 'width'),
								bitrate: _xmlAttribute(node, 'bitrate'),
								file: _xmlAttribute(node, 'url')
							});
						}
						break;
					case 'title':
						itm['title'] = _textContent(node);
						break;
					case 'description':
						itm['description'] = _textContent(node);
						break;
					case 'keywords':
						itm['tags'] = _textContent(node);
						break;
					case 'thumbnail':
						itm['image'] = _xmlAttribute(node, 'url');
						break;
					case 'credit':
						itm['author'] = _textContent(node);
						break;
					case 'player':
						var url = node.url;
						break;
					case 'group':
						mediaparser.parseGroup(node, itm);
						break;
				}
			}
		}
		return itm;
	}
	
})(jwplayer.html5.parsers);
/**
 * Parse an RSS feed and translate it to a playlist.
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(parsers) {
	var _utils = jwplayer.utils,
		_textContent = parsers.textContent,
		_getChildNode = parsers.getChildNode,
		_numChildren = parsers.numChildren,
		_localName = parsers.localName;
	
	parsers.rssparser = {};
	
	
	/**
	 * Parse an RSS playlist for feed items.
	 *
	 * @param {XML} dat
	 * @reuturn {Array} playlistarray
	 */
	parsers.rssparser.parse = function(dat) {
		var arr = [];
		for (var i = 0; i < _numChildren(dat); i++) {
			var node = _getChildNode(dat, i),
				localName = _localName(node).toLowerCase();
			if (localName == 'channel') {
				for (var j = 0; j < _numChildren(node); j++) {
					var subNode = _getChildNode(node, j);
					if (_localName(subNode).toLowerCase() == 'item') {
						arr.push(_parseItem(subNode));
					}
				}
			}
		}
		return arr;
	};
		
		
	/** 
	 * Translate RSS item to playlist item.
	 *
	 * @param {XML} obj
	 * @return {PlaylistItem} PlaylistItem
	 */
	function _parseItem(obj) {
		var itm = {};
		for (var i = 0; i < obj.childNodes.length; i++) {
			var node = obj.childNodes[i];
			var localName = _localName(node);
			if (!localName){
				continue;
			}
			switch (localName.toLowerCase()) {
				case 'enclosure':
					itm['file'] = _utils.strings.xmlAttribute(node, 'url');
					break;
				case 'title':
					itm['title'] = _textContent(node);
					break;
				case 'pubdate':
					itm['date'] = _textContent(node);
					break;
				case 'description':
					itm['description'] = _textContent(node);
					break;
				case 'link':
					itm['link'] = _textContent(node);
					break;
				case 'category':
					if (itm['tags']) {
						itm['tags'] += _textContent(node);
					} else {
						itm['tags'] = _textContent(node);
					}
					break;
			}
		}
		itm = parsers.mediaparser.parseGroup(obj, itm);
		itm = parsers.jwparser.parseEntry(obj, itm);

		return new jwplayer.html5.playlistitem(itm);
	}


	
	
})(jwplayer.html5.parsers);
/**
 * JW Player HTML5 Controlbar component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	
	var _html5 = jwplayer.html5,
		_utils = jwplayer.utils,
		_events = jwplayer.events,
		_states = jwplayer.events.state,
		_style = _utils.appendStylesheet,

		/** Controlbar element types **/
		CB_BUTTON = "button",
		CB_TEXT = "text",
		CB_DIVIDER = "divider",
		CB_SLIDER = "slider",
		
		/** Some CSS constants we should use for minimization **/
		JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block",
		JW_CSS_INLINE = "inline",
		JW_CSS_INLINE_BLOCK = "inline-block",
		JW_CSS_LEFT = "left",
		JW_CSS_RIGHT = "right",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "width .25s linear, left .25s linear, opacity .25s, background .25s"
		
		CB_CLASS = '.jwcontrolbar',
		
		DOCUMENT = document;
	
	/** HTML5 Controlbar class **/
	_html5.controlbar = function(api, config) {
		var _api,
			_skin,
			_defaults = {
				// backgroundcolor : "",
				margin : 10,
				font : "Arial,sans-serif",
				fontsize : 10,
				fontcolor : parseInt("000000", 16),
				fontstyle : "normal",
				fontweight : "bold",
				// buttoncolor : parseInt("ffffff", 16),
				// position : html5.view.positions.BOTTOM,
				// position: "OVER",
				// idlehide : false,
				// hideplaylistcontrols : false,
				// forcenextprev : false,
				layout : {
					left: {
						position: "left",
						elements: [ {
							name: "play",
							type: CB_BUTTON
						}, {
							name: "divider",
							type: CB_DIVIDER
						}, {
							name: "prev",
							type: CB_BUTTON
						}, {
							name: "divider",
							type: CB_DIVIDER
						}, {
							name: "next",
							type: CB_BUTTON
						}, {
							name: "divider",
							type: CB_DIVIDER
						}, {
							name: "elapsed",
							type: CB_TEXT
						} ]
					},
					center: {
						position: "center",
						elements: [ {
							name: "time",
							type: CB_SLIDER
						} ]
					},
					right: {
						position: "right",
						elements: [ {
							name: "duration",
							type: CB_TEXT
						}, {
							name: "blank",
							type: CB_BUTTON
						}, {
							name: "divider",
							type: CB_DIVIDER
						}, {
							name: "mute",
							type: CB_BUTTON
						}, {
							name: "volume",
							type: CB_SLIDER
						}, {
							name: "divider",
							type: CB_DIVIDER
						}, {
							name: "fullscreen",
							type: CB_BUTTON
						}]
					}
				}
			},
		
			_settings, 
			_layout, 
			_elements, 
			_controlbar, 
			_id,
			_duration,
			_currentVolume,
			
			_toggles = {
				play: "pause",
				mute: "unmute",
				fullscreen: "normalscreen"
			},
			
			_toggleStates = {
				play: false,
				mute: false,
				fullscreen: false
			},
			
			_buttonMapping = {
				play: _play,
				mute: _mute,
				fullscreen: _fullscreen,
				next: _next,
				prev: _prev
			},
			
			_sliderMapping = {
				time: _seek,
				volume: _volume
			};
		
		

		function _init() {
			_elements = {};
			
			_api = api;

			_id = _api.id + "_controlbar";
			_duration = 0;

			_controlbar = _createSpan();
			_controlbar.id = _id;
			_controlbar.className = "jwcontrolbar";

			// Slider listeners
			window.addEventListener('mousemove', _sliderMouseEvent, false);
			window.addEventListener('mouseup', _sliderMouseEvent, false);

			_skin = _api.skin;
			
			_settings = _utils.extend({}, _defaults, config);
			_layout = _skin.getComponentLayout('controlbar');
			if (!_layout) _layout = _defaults.layout;
			_createStyles();
			_buildControlbar();
			_addEventListeners();
		}
		
		function _addEventListeners() {
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_TIME, _timeUpdated);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_MUTE, _muteHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_VOLUME, _volumeHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_MEDIA_BUFFER, _bufferHandler);
			_api.jwAddEventListener(jwplayer.events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
		}
		
		function _timeUpdated(evt) {
			_duration = evt.duration;
			
			if (_elements.elapsed) {
				_elements.elapsed.innerHTML = _utils.timeFormat(evt.position);
			}
			if (_elements.duration) {
				_elements.duration.innerHTML = _utils.timeFormat(evt.duration);
			}
			if (evt.duration > 0) {
				_setProgress(evt.position / evt.duration);
			} else {
				_setProgress(0);
			}
		}
		
		function _stateHandler(evt) {
			switch (evt.newstate) {
			case _states.BUFFERING:
			case _states.PLAYING:
				if (_elements['timeSliderThumb']) {
					_elements['timeSliderThumb'].style.opacity = 1;
				}
				_toggleButton("play", true);
				break;
			case _states.PAUSED:
				if (!_dragging) {
					_toggleButton("play", false);
				}
				break;
			case _states.IDLE:
				_toggleButton("play", false);
				if (_elements['timeSliderThumb']) {
					_elements['timeSliderThumb'].style.opacity = 0;
				}
				if (_elements["timeRail"]) {
					_elements["timeRail"].className = "jwrail";
					setTimeout(function() {
						// Temporarily disable the buffer animation
						_elements["timeRail"].className += " jwsmooth";
					}, 100);
				}
				_setBuffer(0);
				_timeUpdated({ position: 0, duration: 0});
				break;
			case _states.COMPLETED:
				_controlbar.style.opacity = 0;
				break;
			}
		}
		
		function _muteHandler(evt) {
			_toggleButton("mute", evt.mute);
			_setVolume(evt.mute ? 0 : _currentVolume)
 		}

		function _volumeHandler(evt) {
			_currentVolume = evt.volume / 100;
			_setVolume(_currentVolume);
		}

		function _bufferHandler(evt) {
			_setBuffer(evt.bufferPercent / 100);
		}
		
		function _fullscreenHandler(evt) {
			_toggleButton("fullscreen", evt.fullscreen);
		}

		/**
		 * Styles specific to this controlbar/skin
		 */
		function _createStyles() {
			_utils.clearCss('#'+_id);
			
			_style('#'+_id, {
		  		height: _getSkinElement("background").height,
	  			bottom: _settings.position == "OVER" ? _settings.margin : 0,
	  			left: _settings.position == "OVER" ? _settings.margin : 0,
	  			right: _settings.position == "OVER" ? _settings.margin : 0
			});
			
			_style(_internalSelector(".jwtext"), {
				font: _settings.fontsize + "px/" + _getSkinElement("background").height + "px " + _settings.font,
				color: _settings.fontcolor,
				'font-weight': _settings.fontweight,
				'font-style': _settings.fontstyle,
				'text-align': 'center',
				padding: '0 5px'
			});
		}

		
		function _internalSelector(name) {
			return '#' + _id + " " + name;
		}

		function _createSpan() {
			return DOCUMENT.createElement("span");
		}
		
		function _buildControlbar() {
			var capLeft = _buildImage("capLeft");
			var capRight = _buildImage("capRight");
			var bg = _buildImage("background", {
				position: JW_CSS_ABSOLUTE,
				left: _getSkinElement('capLeft').width,
				right: _getSkinElement('capRight').width,
				'background-repeat': "repeat-x"
			}, true);

			if (bg) _controlbar.appendChild(bg);
			if (capLeft) _controlbar.appendChild(capLeft);
			_buildLayout();
			if (capRight) _controlbar.appendChild(capRight);
		}
		
		function _buildElement(element) {
			switch (element.type) {
			case CB_DIVIDER:
				return _buildDivider(element);
				break;
			case CB_TEXT:
				return _buildText(element.name);
				break;
			case CB_BUTTON:
				if (element.name != "blank") {
					return _buildButton(element.name);
				}
				break;
			case CB_SLIDER:
				return _buildSlider(element.name);
				break;
			}
		}
		
		function _buildImage(name, style, stretch, nocenter) {
			var element = _createSpan();
			element.className = 'jw'+name;
			
			var center = nocenter ? " left center" : " center";

			var skinElem = _getSkinElement(name);
			element.innerHTML = "&nbsp;";
			if (!skinElem || skinElem.src == "") {
				return;
			}
			
			var newStyle;
			
			if (stretch) {
				newStyle = {
					background: "url('" + skinElem.src + "') repeat-x " + center
				};
			} else {
				newStyle = {
					background: "url('" + skinElem.src + "') no-repeat" + center,
					width: skinElem.width
				};
			}
			
			_style(_internalSelector('.jw'+name), _utils.extend(newStyle, style));
			_elements[name] = element;
			return element;
		}

		function _buildButton(name) {
			if (!_getSkinElement(name + "Button").src) {
				return null;
			}
			
			var element = DOCUMENT.createElement("button");
			element.className = 'jw'+name;
			element.addEventListener("click", _buttonClickHandler(name), false);

			var outSkin = _getSkinElement(name + "Button");
			var overSkin = _getSkinElement(name + "ButtonOver");
			
			element.innerHTML = "&nbsp;";
			
			_buttonStyle(_internalSelector('.jw'+name), outSkin, overSkin);
			var toggle = _toggles[name];
			if (toggle) {
				_buttonStyle(_internalSelector('.jw'+name+'.jwtoggle'), _getSkinElement(toggle+"Button"), _getSkinElement(toggle+"ButtonOver"));
			}

			_elements[name] = element;
			
			return element;
		}
		
		function _buttonStyle(selector, out, over) {
			if (!out.src) {
				return;
			}
			
			_style(selector, { 
				width: out.width,
				background: 'url('+ out.src +') center no-repeat'
			});
			
			if (over.src) {
				_style(selector + ':hover', { 
					background: 'url('+ over.src +') center no-repeat'
				});
			}
		}
		
		function _buttonClickHandler(name) {
			return function() {
				if (_buttonMapping[name]) {
					_buttonMapping[name]();
				}
			}
		}
		

		function _play() {
			if (_toggleStates.play) {
				_api.jwPause();
			} else {
				_api.jwPlay();
			}
		}
		
		function _mute() {
			_api.jwSetMute();
			_muteHandler({mute:_toggleStates.mute});
		}
		
		function _volume(pct) {
			if (pct < 0.1) pct = 0;
			if (pct > 0.9) pct = 1;
			_api.jwSetVolume(pct * 100);
			_setVolume(pct);
		}
		
		function _seek(pct) {
			if (!_dragging) {
				_api.jwPlay();
			}
			_api.jwSeek(pct * _duration);
		}
		
		function _fullscreen() {
			_api.jwSetFullscreen();
		}

		function _next() {
			_api.jwPlaylistNext();
		}

		function _prev() {
			_api.jwPlaylistNext();
		}

		function _toggleButton(name, state) {
			if (!_utils.exists(state)) {
				state = !_toggleStates[name];
			}
			if (_elements[name]) {
				_elements[name].className = 'jw' + name + (state ? " jwtoggle jwtoggling" : " jwtoggling");
				// Use the jwtoggling class to temporarily disable the animation;
				setTimeout(function() {
					_elements[name].className = _elements[name].className.replace(" jwtoggling", ""); 
				}, 100);
			}
			_toggleStates[name] = state;
		}
		
		function _createElementId(name) {
			return _id + "_" + name;
		}
		
		function _buildText(name, style) {
			var element = _createSpan();
			element.id = _createElementId(name); 
			element.className = "jwtext jw" + name;
			
			var css = {};
			
			var skinElement = _getSkinElement(name+"Background");
			if (skinElement.src) {
				css.background = "url(" + skinElement.src + ") no-repeat center";
				css['background-size'] = "100% " + _getSkinElement("background").height + "px";
			}

			_style(_internalSelector('.jw'+name), css);
			element.innerHTML = "00:00";
			_elements[name] = element;
			return element;
		}
		
		function _buildDivider(divider) {
			if (divider.width) {
				var element = _createSpan();
				element.className = "jwblankDivider";
				_style(element, {
					width: parseInt(divider.width)
				});
				return element;
			} else if (divider.element) {
				return _buildImage(divider.element);
			} else {
				return _buildImage(divider.name);
			}
		}
		
		function _buildSlider(name) {
			var slider = _createSpan();
			slider.className = "jwslider jw" + name;


			var capLeft = _buildImage(name + "SliderCapLeft");
			var capRight = _buildImage(name + "SliderCapRight");
			if (capRight) capRight.className += " jwcapRight";

			var rail = _buildSliderRail(name);
			
			if (capLeft) slider.appendChild(capLeft);
			slider.appendChild(rail);
			if (capLeft) slider.appendChild(capRight);

			_style(_internalSelector(".jw" + name + " .jwrail"), {
				left: _getSkinElement(name+"SliderCapLeft").width,
				right: _getSkinElement(name+"SliderCapRight").width,
			});

			_elements[name] = slider;

			if (name == "time") {
				_styleTimeSlider(slider);
				_setProgress(0);
				_setBuffer(0);
			} else if (name == "volume") {
				_styleVolumeSlider(slider);
			}

			
			return slider;
		}
		
		function _buildSliderRail(name) {
			var rail = _createSpan();
			rail.className = "jwrail jwsmooth";

			var railElements = ['Rail', 'Buffer', 'Progress'];

			for (var i=0; i<railElements.length; i++) {
				var element = _buildImage(name + "Slider" + railElements[i], null, true, (name=="volume"));
				if (element) {
					element.className += " jwstretch";
					rail.appendChild(element);
				}
			}
			
			var thumb = _buildImage(name + "SliderThumb");
			if (thumb) {
				thumb.className += " jwthumb";
				thumb.style.opacity = 0;
				rail.appendChild(thumb);
			}
			
			rail.addEventListener('mousedown', _sliderMouseDown(name), false);
			
			_elements[name+'Rail'] = rail;
			
			return rail;
		}
		
		var _dragging;
		
		function _sliderMouseDown(name) {
			return (function(evt) {
				if (evt.button != 0)
					return;
				
				_elements[name+'Rail'].className = "jwrail";
				
				if (name == "time") {
					if (!_idle()) {
						_dragging = name;
					}
				} else {
					_dragging = name;
				}
			});
		}
		
		function _idle() {
			var currentState = _api.jwGetState();
			return (currentState == _states.IDLE || currentState == _states.COMPLETED); 
		}
		
		var _lastSeekTime = 0;
		
		function _sliderMouseEvent(evt) {
			if (!_dragging || evt.button != 0) {
				return;
			}
			
			var rail = _elements[_dragging].getElementsByClassName('jwrail')[0],
				railRect = _utils.getBoundingClientRect(rail),
				pct = (evt.clientX - railRect.left) / railRect.width;
			
			if (evt.type == 'mouseup') {
				var name = _dragging;
				_elements[name+'Rail'].className = "jwrail jwsmooth";
				_dragging = null;
				_sliderMapping[name](pct);
			} else {
				if (_dragging == "time") {
					_setProgress(pct);
				} else {
					_setVolume(pct);
				}
				var currentTime = (new Date()).getTime();
				if (currentTime - _lastSeekTime > 500) {
					_api.jwPause();
					_lastSeekTime = currentTime;
					_sliderMapping[_dragging](pct);
				}
			}
		}

	
		function _styleTimeSlider(slider) {
			if (_elements['timeSliderThumb']) {
				_style(_internalSelector(".jwtimeSliderThumb"), {
					'margin-left': (_getSkinElement("timeSliderThumb").width/-2)
				});
			}

			_setBuffer(0);
			_setProgress(0);
		}
		
		
		function _styleVolumeSlider(slider) {
			var capLeftWidth = _getSkinElement("volumeSliderCapLeft").width,
				capRightWidth = _getSkinElement("volumeSliderCapRight").width,
				railWidth = _getSkinElement("volumeSliderRail").width;
			
			_style(_internalSelector(".jwvolume"), {
				width: (capLeftWidth + railWidth + capRightWidth)
			});
		}
		
		var _groups = {};
		
		function _buildLayout() {
			_buildGroup("left");
			_buildGroup("center");
			_buildGroup("right");
			_controlbar.appendChild(_groups.left);
			_controlbar.appendChild(_groups.center);
			_controlbar.appendChild(_groups.right);
			
			_style(_internalSelector(".jwright"), {
				right: _getSkinElement("capRight").width
			});
		}
		
		
		function _buildGroup(pos) {
			var elem = _createSpan();
			elem.className = "jwgroup jw" + pos;
			_groups[pos] = elem;
			if (_layout[pos]) {
				_buildElements(_layout[pos], _groups[pos]);
			}
		}
		
		function _buildElements(group, container) {
			if (group && group.elements.length > 0) {
				for (var i=0; i<group.elements.length; i++) {
					var element = _buildElement(group.elements[i]);
					if (element) {
						container.appendChild(element);
					}
				}
			}
		}

		var _resize = this.resize = function(width, height) {
			_style(_internalSelector('.jwgroup.jwcenter'), {
				left: Math.round(_utils.parseDimension(_groups.left.offsetWidth) + _getSkinElement("capLeft").width),
				right: Math.round(_utils.parseDimension(_groups.right.offsetWidth) + _getSkinElement("capRight").width)
			});
		}
		
		this.getDisplayElement = function() {
			return _controlbar;
		};
		
		function _setBuffer(pct) {
			pct = Math.min(Math.max(0, pct), 1);
			_elements['timeSliderBuffer'].style.width = pct * 100 + "%";
		}

		function _sliderPercent(name, pct, fixedWidth) {
			if (!_elements[name]) return;

			pct = Math.min(Math.max(0, pct), 1);
			
			var progress = _elements[name+'SliderProgress'];
			var thumb = _elements[name+'SliderThumb'];
			var width = 100 * pct + "%";
		
			if (progress) {
				progress.style.width = width; 
			}
			if (thumb) {
				thumb.style.left = width;
			}
		}
		
		function _setVolume (pct) {
			_sliderPercent('volume', pct, true);
		}

		function _setProgress(pct) {
			_sliderPercent('time', pct);
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('controlbar', name); 
			if (elem) {
				return elem;
			} else {
				return {
					width: 0,
					height: 0,
					src: "",
					image: undefined,
					ready: false
				}
			}
		}
		
		// Call constructor
		_init();

	}

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	_style(CB_CLASS, {
		position: JW_CSS_ABSOLUTE,
		overflow: 'hidden',
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	})
	
	_style(CB_CLASS+' span',{
		height: JW_CSS_100PCT,
		'-webkit-user-select': JW_CSS_NONE,
		'-webkit-user-drag': JW_CSS_NONE,
		'user-select': JW_CSS_NONE,
		'user-drag': JW_CSS_NONE
	});
	
    _style(CB_CLASS+' .jwgroup', {
    	display: JW_CSS_INLINE
    });
    
    _style(CB_CLASS+' span, '+CB_CLASS+' .jwgroup button,'+CB_CLASS+' .jwleft', {
    	position: JW_CSS_RELATIVE,
		'float': JW_CSS_LEFT
    });
    
	_style(CB_CLASS+' .jwright', {
		position: JW_CSS_ABSOLUTE
	});
	
    _style(CB_CLASS+' .jwcenter', {
    	position: JW_CSS_ABSOLUTE
    });
    
    _style(CB_CLASS+' button', {
    	display: JW_CSS_INLINE_BLOCK,
    	height: JW_CSS_100PCT,
    	border: JW_CSS_NONE,
    	cursor: 'pointer',
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
    });
    
    _style(CB_CLASS+' .jwcapRight', { 
		right: 0,
		position: JW_CSS_ABSOLUTE
	});
    
    _style(CB_CLASS+' .jwtime,' + CB_CLASS + ' .jwgroup span.jwstretch', {
    	position: JW_CSS_ABSOLUTE,
    	height: JW_CSS_100PCT,
    	width: JW_CSS_100PCT,
    	left: 0
    });
    
   
    
    _style(CB_CLASS+' .jwrail,' + CB_CLASS + ' .jwthumb', {
    	position: JW_CSS_ABSOLUTE,
    	height: JW_CSS_100PCT,
    	cursor: 'pointer'
    });
    
    _style(CB_CLASS + ' .jwtime .jwsmooth span', {
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
    });
    
    _style(CB_CLASS + ' .jwdivider+.jwdivider', {
    	display: JW_CSS_NONE
    });
    
    _style(CB_CLASS + ' .jwtext', {
		padding: '0 5px',
		'text-align': 'center'
	});
    
    _style(CB_CLASS + ' .jwtoggling', {
    	'-webkit-transition': JW_CSS_NONE,
    	'-moz-transition': JW_CSS_NONE,
    	'-o-transition': JW_CSS_NONE
    });
	
})(jwplayer);/**
 * jwplayer.html5 API
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, 
		_utils = _jw.utils, 
		_events = _jw.events, 
		_states = _events.state;
	
	html5.controller = function(model, view) {
		var _model = model,
			_view = view,
			_video = model.getVideo(),
			_eventDispatcher = new _events.eventdispatcher(_model.id, _model.config.debug);
		
		_utils.extend(this, _eventDispatcher);

		function _init() {
			_model.addGlobalListener(_forward);
			_model.addEventListener(_events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
		}
		
		function _forward(evt) {
			_eventDispatcher.sendEvent(evt.type, evt);
		}
		
		function _bufferFullHandler(evt) {
			_video.play();
		}

		var file;
		
		function _load(item) {
			if (_model.state == _states.PLAYING || _model.state == _states.BUFFERING) {
				_video.stop();
			}
			
			switch (_utils.typeOf(item)) {
			case "string":
				file = item;
				break;
			case "object":
				file = item.file;
				break;
			case "number":
				file = _model.playlist[item].file;
				break;
			default:
				file = _model.playlist[_model.item].file;
			}
				
//			if (_video.getTag().canPlayType("video/mp4")) {
//				file = "http://playertest.longtailvideo.com/bunny.mp4";		
//			} else if (_video.getTag().canPlayType("video/webm")) {
//				file = "http://playertest.longtailvideo.com/bunny.webm";		
//			} else {
//				file = "http://playertest.longtailvideo.com/bunny.ogv";		
//			}
//			if (_utils.isMobile()) {
//				_video.load(file);
//			}
		}
		
		function _play() {
			if (_model.state == _states.IDLE) {
				_video.load(file);
			} else if (_model.state == _states.PAUSED) {
				_video.play();
			}
		}

		function _stop() {
			_video.stop();
		}

		function _pause() {
			if (_model.state == _states.PLAYING || _model.state == _states.BUFFERING) {
				_video.pause();
			}
		}

		function _seek(pos) {
			_video.seek(pos);
		}
		
		function _setVolume(vol) {
			_video.volume(vol);
		}
		
		function _setMute(state) {
			if (!_utils.exists(state)) state = !_model.mute;
			_video.mute(state);
		}
		
		function _setFullscreen(state) {
			_view.fullscreen(state);
		}

		
		function _item(item) {
			_stop();
			_model.setItem(item);
			_load(_model.item);
			_play();
		}
		
		function _prev() {
			_item(_model.item - 1);
		}
		
		function _next() {
			_item(_model.item + 1);
		}
		
		
		// TODO: implement waitForReady; either in Controller or in API
		function _waitForReady(func) {
			return function() {
				func.apply(this, arguments);
			}
		}
		
		this.play = _waitForReady(_play);
		this.pause = _waitForReady(_pause);
		this.seek = _waitForReady(_seek);
		this.stop = _waitForReady(_stop);
		this.load = _waitForReady(_load);
		this.next = _waitForReady(_next);
		this.prev = _waitForReady(_prev);
		this.item = _waitForReady(_item);
		this.setVolume = _waitForReady(_setVolume);
		this.setMute = _waitForReady(_setMute);
		this.setFullscreen = _waitForReady(_setFullscreen);
		
/*		this.playerReady = _playerReady;
		this.detachMedia = _detachMedia; 
		this.attachMedia = _attachMedia;
		this.beforePlay = function() { 
			return _preplay; 
		}
*/		
		
		_init();
	}
})(jwplayer.html5);

/**
 * JW Player Default skin
 *
 * @author zach
 * @version 5.8
 */
(function(jwplayer) {
	jwplayer.html5.defaultskin = function() {
		this.text = '<?xml version="1.0" ?><skin author="LongTail Video" name="Five" version="1.1"><components><component name="controlbar"><settings><setting name="margin" value="20"/><setting name="fontsize" value="11"/><setting name="fontcolor" value="0x000000"/></settings><layout><group position="left"><button name="play"/><divider name="divider"/><button name="prev"/><divider name="divider"/><button name="next"/><divider name="divider"/><text name="elapsed"/></group><group position="center"><slider name="time"/></group><group position="right"><text name="duration"/><divider name="divider"/><button name="blank"/><divider name="divider"/><button name="mute"/><slider name="volume"/><divider name="divider"/><button name="fullscreen"/></group></layout><elements><element name="background" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAElJREFUOI3t1LERACAMQlFgGvcfxNIhHMK4gsUvUviOmgtNsiAZkBSEKxKEnCYkkQrJn/YwbUNiSDDYRZaQRDaShv+oX9GBZEIuK+8hXVLs+/YAAAAASUVORK5CYII="/><element name="blankButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAYCAYAAAAyJzegAAAAFElEQVQYV2P8//8/AzpgHBUc7oIAGZdH0RjKN8EAAAAASUVORK5CYII="/><element name="capLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAYCAYAAAA7zJfaAAAAQElEQVQIWz3LsRGAMADDQJ0XB5bMINABZ9GENGrszxhjT2WLSqxEJG2JQrTMdV2q5LpOAvyRaVmsi7WdeZ/7+AAaOTq7BVrfOQAAAABJRU5ErkJggg=="/><element name="capRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAYCAYAAAA7zJfaAAAAQElEQVQIWz3LsRGAMADDQJ0XB5bMINABZ9GENGrszxhjT2WLSqxEJG2JQrTMdV2q5LpOAvyRaVmsi7WdeZ/7+AAaOTq7BVrfOQAAAABJRU5ErkJggg=="/><element name="divider" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAYCAIAAAC0rgCNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADhJREFUCB0FwcENgEAAw7Aq+893g8APUILNOQcbFRktVGqUVFRkWNz3xTa2sUaLNUosKlRUvvf5AdbWOTtzmzyWAAAAAElFTkSuQmCC"/><element name="playButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAYCAYAAAAVibZIAAAANUlEQVR42u2RsQkAAAjD/NTTPaW6dXLrINJA1kBpGPMAjDWmOgp1HFQXx+b1KOefO4oxY57R73YnVYCQUCQAAAAASUVORK5CYII="/><element name="pauseButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAYCAYAAAAVibZIAAAAIUlEQVQ4jWNgGAWjYOiD/0gYG3/U0FFDB4Oho2AUDAYAAEwiL9HrpdMVAAAAAElFTkSuQmCC"/><element name="prevButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAYCAYAAAAVibZIAAAAQklEQVQ4y2NgGAWjYOiD/1AMA/JAfB5NjCJD/YH4PRaLyDa0H4lNNUP/DxlD59PCUBCIp3ZEwYA+NZLUKBgFgwEAAN+HLX9sB8u8AAAAAElFTkSuQmCC"/><element name="nextButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAYCAYAAAAVibZIAAAAQElEQVQ4y2NgGAWjYOiD/0B8Hojl0cT+U2ooCL8HYn9qGwrD/bQw9P+QMXQ+tSMqnpoRBUpS+tRMUqNgFAwGAADxZy1/mHvFnAAAAABJRU5ErkJggg=="/><element name="timeSliderRail" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAOElEQVRIDe3BwQkAIRADwAhhw/nU/kWwUK+KPITMABFh19Y+F0acY8CJvX9wYpXgRElwolSIiMf9ZWEDhtwurFsAAAAASUVORK5CYII="/><element name="timeSliderBuffer" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAN0lEQVRIDe3BwQkAMQwDMBcc55mRe9zi7RR+FCwBEWG39vcfGHFm4MTuhhMlwYlVBSdKhYh43AW/LQMKm1spzwAAAABJRU5ErkJggg=="/><element name="timeSliderProgress" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAIElEQVRIiWNgGAWjYBTQBfynMR61YCRYMApGwSigMQAAiVWPcbq6UkIAAAAASUVORK5CYII="/><element name="timeSliderThumb" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAYCAYAAAA/OUfnAAAAO0lEQVQYlWP4//8/Awwz0JgDBP/BeN6Cxf/hnI2btiI4u/fsQ3AOHjqK4Jw4eQbBOX/hEoKDYjSd/AMA4cS4mfLsorgAAAAASUVORK5CYII="/><element name="muteButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAYCAYAAADKx8xXAAAAJklEQVQ4y2NgGAUjDcwH4v/kaPxPikZkxcNVI9mBQ5XoGAWDFwAAsKAXKQQmfbUAAAAASUVORK5CYII="/><element name="unmuteButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAYCAYAAADKx8xXAAAAMklEQVQ4y2NgGAWDHPyntub5xBr6Hwv/Pzk2/yfVG/8psRFE25Oq8T+tQnsIaB4FVAcAi2YVysVY52AAAAAASUVORK5CYII="/><element name="volumeSliderRail" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYAgMAAACdGdVrAAAACVBMVEUAAACmpqampqbBXAu8AAAAAnRSTlMAgJsrThgAAAArSURBVAhbY2AgErBAyA4I2QEhOyBkB4TsYOhAoaCCUCUwDTDtMMNgRuMHAFB5FoGH5T0UAAAAAElFTkSuQmCC"/><element name="volumeSliderProgress" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYAgMAAACdGdVrAAAACVBMVEUAAAAAAAAAAACDY+nAAAAAAnRSTlMAgJsrThgAAAArSURBVAhbY2AgErBAyA4I2QEhOyBkB4TsYOhAoaCCUCUwDTDtMMNgRuMHAFB5FoGH5T0UAAAAAElFTkSuQmCC"/><element name="volumeSliderCapRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAYCAYAAAAyJzegAAAAFElEQVQYV2P8//8/AzpgHBUc7oIAGZdH0RjKN8EAAAAASUVORK5CYII="/><element name="fullscreenButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAQklEQVRIiWNgGAWjYMiD/0iYFDmSLbDHImdPLQtgBpEiR7Zl2NijAA5oEkT/0Whi5UiyAJ8BVMsHNMtoo2AUDAIAAGdcIN3IDNXoAAAAAElFTkSuQmCC"/><element name="normalscreenButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAP0lEQVRIx2NgGAWjYMiD/1RSQ5QB/wmIUWzJfzx8qhj+n4DYCAY0DyJ7PBbYU8sHMEvwiZFtODXUjIJRMJgBACpWIN2ZxdPTAAAAAElFTkSuQmCC"/></elements></component><component name="display"><elements><element name="background" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyAQMAAAAk8RryAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlOZpuml+rYAAAASSURBVBhXY2AYJuA/GBwY6jQAyDyoK8QcL4QAAAAASUVORK5CYII="/><element name="playIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAiUlEQVR42u3XSw2AMBREURwgAQlIQAISKgUpSEFKJeCg5b0E0kWBTVcD9ySTsL0Jn9IBAAAA+K2UUrBlW/Rr5ZDoIeeuoFkxJD9ss03aIXXQqB9SttoG7ZA6qNcOKdttiwcJh9RB+iFl4SshkRBuLR72+9cvH0SOKI2HRo7x/Fi1/uoCAAAAwLsD8ki99IlO2dQAAAAASUVORK5CYII="/><element name="muteIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAVUlEQVR42u3WMQrAIAxAUW/g/SdvGmvpoOBeSHgPsjj5QTANAACARCJilIhYM0tEvJM+Ik3Id9E957kQIb+F3OdCPC0hPkQriqWx9hp/x/QGAABQyAPLB22VGrpLDgAAAABJRU5ErkJggg=="/><element name="errorIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAA/0lEQVR42u2U0QmEMBAF7cASLMESUoIlpARLSCkpwRJSgiWkhOvAXD4WsgRkyaG5DbyB+Yvg8KITAAAAAAAYk+u61mwk15EjPtlEfihmqIiZR1Qx80ghjgdUuiHXGHSVsoag0x6x8DUoyjD5KovmEJ9NTDMRPIT0mtdIUkjlonuNohO+Ha99DTmkuGgKCTcvebAzx82ZoCWC3/3aIMWSRucaxcjORSFY4xpFdjYJGp1rFGcyCYZ/RVh6AUnfcNZ2zih3/mGj1jVCdiNDwyrq1rA/xMdeEXvDVdnYc1vDc3uPkDObXrlaxbNHSOohQhr/WOeLEWfWTgAAAAAAADzNF9sHJ7PJ57MlAAAAAElFTkSuQmCC"/><element name="bufferIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAACBklEQVR42u3Zv0sCYRzH8USTzOsHHEWGkC1HgaDgkktGDjUYtDQ01RDSljQ1BLU02+rk1NTm2NLq4Nx/0L/h9fnCd3j4cnZe1/U8xiO8h3uurufF0/3COd/3/0UWYiEWYiEWYiGJQ+J8xuPxKhXjEMZANinjIZhkGuVRNioE4wVURo4JkHm0xKWmhRAc1bh1EyCUw5BcBIjHiApKa4CErko6DEJwuRo6IRKzyJD8FJAyI3Zp2zRImiBcRhlfo5RtlxCcE3CcDNpGrhYIT2IhAJKilO0VRmzJ32fAMTpBTS0QMfGwlcuKMRftE0DJ0wCJdcOsCkBdXP3Mh9CEFUBTPS9mDZJBG6io4aqVzMdCokCw9H3kT6j/C/9iDdSeUMNC7DkyyxAs/Rk6Qss8FPWRZgdVtUH4DjxEn1zxh+/zj1wHlf4MQhNGrwqA6sY40U8JonRJwEQh+AO3AvCG6gHv4U7IY4krxkroWoAOkoQMGfCBrgIm+YBGqPENpIJ66CJg3x66Y0gnSUidAEEnNr9jjLiWMn5DiWP0OC/oAsCgkq43xBdGDMQr7YASP/vEkHvdl1+JOCcEV5sC4hGEOzTlPuKgd0b0xD4JkRcOgnRRTjdErkYhAsQVq6IdUuPJtmk7BCL3t/h88cx91pKQkI/pkDx6pmYTIjEoxiHsN1YWYiEWYiEWknhflZ5IErA5nr8AAAAASUVORK5CYII="/></elements></component><component name="dock"><settings><setting name="fontcolor" value="0xffffff"/></settings><elements><element name="button" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyAQMAAAAk8RryAAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlOZpuml+rYAAAASSURBVBhXY2AYJuA/GBwY6jQAyDyoK8QcL4QAAAAASUVORK5CYII="/></elements></component><component name="playlist"><settings><setting name="backgroundcolor" value="0xe8e8e8"/></settings><elements><element name="item" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAIAAAC1nk4lAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHBJREFUaN7t2MENwCAMBEEe9N8wSKYC/D8YV7CyJoRkVtVImxkZPQInMxoP0XiIxkM0HsGbjjSNBx544IEHHnjggUe/6UQeey0PIh7XTftGxKPj4eXCtLsHHh+ZxkO0Iw8PR55Ni8ZD9Hu/EAoP0dc5RRg9qeRjVF8AAAAASUVORK5CYII="/><element name="sliderCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAHCAYAAADnCQYGAAAAFUlEQVQokWP8//8/A7UB46ihI9hQAKt6FPPXhVGHAAAAAElFTkSuQmCC"/><element name="sliderRail" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAUCAYAAABiS3YzAAAAKElEQVQ4y2P4//8/Az68bNmy/+iYkB6GUUNHDR01dNTQUUNHDaXcUABUDOKhcxnsSwAAAABJRU5ErkJggg=="/><element name="sliderThumb" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAUCAYAAABiS3YzAAAAJUlEQVQ4T2P4//8/Ay4MBP9xYbz6Rg0dNXTU0FFDRw0dNZRyQwHH4NBa7GJsXAAAAABJRU5ErkJggg=="/><element name="sliderCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAHCAYAAADnCQYGAAAAFUlEQVQokWP8//8/A7UB46ihI9hQAKt6FPPXhVGHAAAAAElFTkSuQmCC"/></elements></component></components></skin>'; 
		this.xml = null;
		
		//http://www.w3schools.com/Dom/dom_parser.asp 
		if (window.DOMParser) {
			parser = new DOMParser();
			this.xml = parser.parseFromString(this.text, "text/xml");
		} else {
			//IE
			this.xml = new ActiveXObject("Microsoft.XMLDOM");
			this.xml.async = "false";
			this.xml.loadXML(this.text);
		}
		return this;
	};
	
})(jwplayer);
/**
 * JW Player display component
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _utils = jwplayer.utils,
		_css = _utils.css,
		_style = _utils.appendStylesheet,
		_events = jwplayer.events,
		_states = _events.state,
		_rotate = html5.utils.animations.rotate,

		D_CLASS = ".jwdisplay",

		/** Some CSS constants we should use for minimization **/
		//JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_NONE = "none",
		//JW_CSS_BLOCK = "block",
		//JW_CSS_INLINE = "inline",
		//JW_CSS_INLINE_BLOCK = "inline-block",
		//JW_CSS_LEFT = "left",
		//JW_CSS_RIGHT = "right",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "opacity .5s, background .5s";

	
	html5.display = function(api, config) {
		var _api = api,
			_skin = api.skin,
			_display,
			_config = config ? config : {},
			_image, _imageWidth, _imageHeight,
			_icons = {},
			_hiding,
			_button,		
			_degreesRotated, 
			_rotationInterval, 
			_bufferRotation = !_utils.exists(config.bufferrotation) ? 15 : parseInt(config.bufferrotation, 10), 
			_bufferInterval = !_utils.exists(config.bufferinterval) ? 100 : parseInt(config.bufferinterval, 10);
			
		function _init() {
			_display = DOCUMENT.createElement("div");
			_display.id = _api.id + "_display";
			_display.className = "jwdisplay";
			
			_api.jwAddEventListener(_events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(_events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
			
			_display.addEventListener('click', _clickHandler, false);
			
			_createIcons();
			
			_stateHandler({newstate:_states.IDLE});
			
		}
		
		function _clickHandler(evt) {
			switch (_api.jwGetState()) {
			case _states.PLAYING:
			case _states.BUFFERING:
				_api.jwPause();
				break;
			default:
				_api.jwPlay();
				break;
			}
		}
		
		// Create the icons which will be displayed inside of the display button
		function _createIcons() {
			var iconNames = ['play', 'buffer'];
			for (var i=0; i<iconNames.length; i++) {
				var iconName = iconNames[i],
					iconOut = _getSkinElement(iconName+"Icon"),
					iconOver = _getSkinElement(iconName+"IconOver"),
					icon = DOCUMENT.createElement("div"),
					bg = _getSkinElement("background"),
					bgOver = _getSkinElement("backgroundOver");
					button = DOCUMENT.createElement("button");
			
				if (iconOut) {
					button.className = "jw" + iconName;
					icon.className = "jwicon";
					button.appendChild(icon);
					
					_buttonStyle('#'+_display.id+' .'+button.className, bg, bgOver);
					_buttonStyle('#'+_display.id+' .'+button.className+' div', iconOut, iconOver);
					
					if (bgOver || iconOver) {
						button.addEventListener('mouseover', _hoverButton(button), false);
						button.addEventListener('mouseout', _hoverOutButton(button), false);
					}
					
					_icons[iconName] = button;
				}
			}
		}
		
		function _hoverButton(button) {
			return function(evt) {
				if (button.className.indexOf("jwhover") < 0) 
					button.className += " jwhover";
				if (button.childNodes[0].className.indexOf("jwhover") < 0)
					button.childNodes[0].className += " jwhover";
			}
		}
		
		function _hoverOutButton(button) {
			return function(evt) {
				button.className = button.className.replace(" jwhover", ""); 
				button.childNodes[0].className = button.childNodes[0].className.replace(" jwhover", "");
			}
		}
		
		function _buttonStyle(selector, out, over) {
			if (!(out && out.src)) {
				return;
			}
			
			_style(selector, { 
				width: out.width,
				height: out.height,
				'margin-left': out.width / -2,
				'margin-top': out.height / -2,
				background: 'url('+ out.src +') center no-repeat'
			});

			if (over && over.src) {
				_style(selector + ".jwhover", {
					background: 'url('+ over.src +') center no-repeat'
				});
			}
		}
		
		function _setIcon(name) {
			if (_button) {
				_display.removeChild(_button);
			}
			_button = _icons[name];
			if (_button) {
				_display.appendChild(_button);
			}
		}

		function _itemHandler(evt) {
			var item = _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()];
			_image = item ? item.image : "";
			_getImageDimensions();
			_style('#' + _display.id, {
				'background': 'url('+_image+') no-repeat center' 
			});
		}
		
		function _stateHandler(evt) {
			clearInterval(_rotationInterval);
			
			switch(evt.newstate) {
			case _states.COMPLETED:
			case _states.IDLE:
				_setIcon('play');
				if (_image) {
					_style('#' + _display.id, {
						'background': 'url('+_image+') no-repeat center' 
					});
				}
				break;
			case _states.BUFFERING:
				_setIcon('buffer');
				_degreesRotated = 0;
				_rotationInterval = setInterval(function() {
					_degreesRotated += _bufferRotation;
					_rotate(_button.childNodes[0], _degreesRotated % 360);
				}, _bufferInterval);
				break;
			case _states.PLAYING:
				_setIcon();
				_style('#' + _display.id, {
					'background': 'transparent'
				});
				break;
			case _states.PAUSED:
				_setIcon('play');
				break;
			}
		}

		this.getDisplayElement = function() {
			return _display;
		}
		
		function _getImageDimensions() {
			if (_image) {
				// Find image size and stretch exactfit if close enough
				var img = DOCUMENT.createElement("img");
				img.addEventListener('load', function() {
					_imageWidth = img.width;
					_imageHeight = img.height;
					_resize();
				}, false);
				img.src = _image;
			} else {
				_imageWidth = _imageHeight = 0;
			}
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('display', name); 
			if (elem) {
				return elem;
			}
			return null;
		}

		
		function _resize() {
			_utils.stretch(_api.jwGetStretching(), _display, _display.clientWidth, _display.clientHeight, _imageWidth, _imageHeight);
		}

		this.resize = _resize;

		_init();
	};
	
	_style(D_CLASS, {
		position: JW_CSS_ABSOLUTE,
		cursor: "pointer",
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		overflow: 'hidden'
	});
	
	_style(D_CLASS + ' *', {
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});
	
    _style(D_CLASS+' button, ' + D_CLASS+' .jwicon', {
    	border: JW_CSS_NONE,
    	position: JW_CSS_ABSOLUTE,
    	left: "50%",
    	top: "50%",
    	padding: 0,
    	cursor: 'pointer'
    });

    _style( {
    	position: JW_CSS_ABSOLUTE,
    	left: "50%",
    	top: "50%",
    	padding: 0,
    	cursor: 'pointer'
    });

	
})(jwplayer.html5);/**
 * jwplayer.html5 model
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _utils = jwplayer.utils,
		_events = jwplayer.events;

	html5.model = function(config) {
		var _model = this, 
			// Video provider
			_video, 
			// HTML5 <video> tag
			_videoTag,
			// Saved settings
			_cookies = _utils.getCookies(),
			// Defaults
			_defaults = {
				width: 480,
				height: 320,
				item: 0,
				playlist: [],
				skin: undefined,
				volume: 90,
				mute: false,
				repeat: "",
				stretching: _utils.stretching.UNIFORM,
				autostart: false,
				debug: undefined
			};

		function _parseConfig(config) {
			return config;
		}

		function _init() {
			_utils.extend(_model, new _events.eventdispatcher());
			_model.config = _utils.extend({}, _defaults, _cookies, _parseConfig(config));
			_utils.extend(_model, {
				id: config.id,
				state : _events.state.IDLE,
				position: 0,
				buffer: 0,
			}, _model.config);
			_model.setItem(_model.config.item);
			
			_videoTag = document.createElement("video");
			_video = new html5.video(_videoTag);
			_video.addGlobalListener(_videoEventHandler);
		}

		var _eventMap = {};
		_eventMap[_events.JWPLAYER_MEDIA_MUTE] = "mute";
		_eventMap[_events.JWPLAYER_MEDIA_VOLUME] = "volume";
		_eventMap[_events.JWPLAYER_PLAYER_STATE] = "newstate->state";
		_eventMap[_events.JWPLAYER_MEDIA_BUFFER] = "bufferPercent->buffer";
		_eventMap[_events.JWPLAYER_MEDIA_TIME] = "position";
			
		function _videoEventHandler(evt) {
			var mapping = _eventMap[evt.type];
			if (mapping) {
				var split = mapping.split("->"),
					eventProp = split[0],
					stateProp = split[1] ? split[1] : eventProp;
				if (_model[stateProp] != evt[eventProp]) {
					_model[stateProp] = evt[eventProp];
					_model.sendEvent(evt.type, evt);
				}
			} else {
				_model.sendEvent(evt.type, evt);
			}
		}
		
		this.getVideo = function() {
			return _video;
		}
		
		this.setFullscreen = function(state) {
			if (state != _model.fullscreen) {
				_model.fullscreen = state;
				_model.sendEvent(_events.JWPLAYER_FULLSCREEN, { fullscreen: state } );
			}
		}
		
		this.setItem = function(index) {
			var newItem;
			if (index == _model.playlist.length || index < -1)
				newItem = 0;
			else if (index == -1 || index > _model.playlist.length)
				newItem = _model.playlist.length - 1;
			else
				newItem = index;
			
			if (newItem != _model.item) {
				_model.item = newItem;
				_model.sendEvent(_events.JWPLAYER_PLAYLIST_ITEM, {
					"index": _model.item
				});
			}
		}
		
		_init();
	}
})(jwplayer.html5);
/**
 * Main HTML5 player class
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	html5.player = function(config) {
		var _api = this,
			_model = new html5.model(config), 
			_view = new html5.view(this, _model), 
			_controller = new html5.controller(_model, _view);

		function _init() {
			_api.id = _model.id;
			
//			_controller.load();
/*			
			(new html5.skinloader(config.skin, function(skin) {
				_api.skin = skin;
				_view.setup();
			}, function(err) { _utils.log(err); }));
*/
			var setup = new html5.setup(_model, _view, _controller);
			setup.addEventListener(jwplayer.events.JWPLAYER_READY, _readyHandler);
			setup.addEventListener(jwplayer.events.JWPLAYER_ERROR, _errorHandler);
			setup.start();
		}
		
		function _readyHandler(evt) {
			_controller.sendEvent(evt.type, evt);
			_controller.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_LOADED, {playlist: _model.playlist});
			_controller.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_ITEM, {index: _model.item});
			_controller.load();
			setTimeout(_view.resize, 0);
		}

		function _errorHandler(evt) {
			console.log(evt);
			alert("Can't set up: " + evt.message);
		}

		
		/** Methods **/
		
		this.jwPlay = _controller.play;
		this.jwPause = _controller.pause;
		this.jwStop = _controller.stop;
		this.jwSeek = _controller.seek;
		this.jwSetVolume = _controller.setVolume;
		this.jwSetMute = _controller.setMute;
		this.jwLoad = _controller.load;
		this.jwPlaylistNext = _controller.next;
		this.jwPlaylistPrev = _controller.prev;
		this.jwPlaylistItem = _controller.item;
		this.jwSetFullscreen = _controller.setFullscreen;
		this.jwResize = _view.resize;
		

		/** Getters **/
		
		function _statevarFactory(statevar) {
			return function() {
				return _model[statevar];
			};
		}
		
		this.jwGetPlaylistIndex = _statevarFactory('item');
		this.jwGetPosition = _statevarFactory('position');
		this.jwGetDuration = _statevarFactory('duration');
		this.jwGetBuffer = _statevarFactory('buffer');
		this.jwGetWidth = _statevarFactory('width');
		this.jwGetHeight = _statevarFactory('height');
		this.jwGetFullscreen = _statevarFactory('fullscreen');
		this.jwGetVolume = _statevarFactory('volume');
		this.jwGetMute = _statevarFactory('mute');
		this.jwGetState = _statevarFactory('state');
		this.jwGetStretching = _statevarFactory('stretching');
		this.jwGetPlaylist = _statevarFactory('playlist');

		
		this.jwAddEventListener = _controller.addEventListener;
		this.jwRemoveEventListener = _controller.removeEventListener;
		
		_init();
	}
})(jwplayer.html5);

/**
 * JW Player playlist model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(html5) {
	var _utils = jwplayer.utils;
	html5.playlist = function(playlist) {
		var _playlist = [];
		if (playlist && playlist instanceof Array && playlist.length > 0) {
			for (var playlistItem in playlist) {
				if (!isNaN(parseInt(playlistItem))){
					_playlist.push(new html5.playlistitem(playlist[playlistItem]));
				}
			}
		} else {
			_playlist.push(new html5.playlistitem(playlist));
		}
		return _playlist;
	};
	
})(jwplayer.html5);
/**
 * JW Player playlist item model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(html5) {
	html5.playlistitem = function(config) {
		var _defaults = {
			description: "",
			image: "",
			link: "",
			mediaid: "",
			title: "",
			provider: "",
			
			file: "",
			duration: -1,
			start: 0,
			
			currentLevel: -1,
			levels: []
		};
		
		
		var _playlistitem = jwplayer.utils.extend({}, _defaults, config);
		
/*
		if (_playlistitem.type) {
			_playlistitem.provider = _playlistitem.type;
			delete _playlistitem.type;
		}
*/		
		if (_playlistitem.levels.length === 0) {
			_playlistitem.levels[0] = new html5.playlistitemlevel(_playlistitem);
		}
/*		
		if (!_playlistitem.provider) {
			_playlistitem.provider = _getProvider(_playlistitem.levels[0]);
		} else {
			_playlistitem.provider = _playlistitem.provider.toLowerCase();
		}
*/
		
		return _playlistitem;
	};
})(jwplayer.html5);/**
 * JW Player playlist item level model
 *
 * @author zach
 * @version 5.4
 */
(function(jwplayer) {
	jwplayer.html5.playlistitemlevel = function(config) {
		var _playlistitemlevel = {
			file: "",
			streamer: "",
			bitrate: 0,
			width: 0
		};
		
		for (var property in _playlistitemlevel) {
			if (jwplayer.utils.exists(config[property])) {
				_playlistitemlevel[property] = config[property];
			}
		}
		return _playlistitemlevel;
	};
	
})(jwplayer);
/**
 * JW Player playlist loader
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, _utils = _jw.utils, _events = _jw.events;

	html5.playlistloader = function() {
		var _eventDispatcher = new _events.eventdispatcher();
		_utils.extend(this, _eventDispatcher);
		
		this.load = function(playlistfile) {
			_utils.ajax(playlistfile, _playlistLoaded, _playlistError)
		}
		
		function _playlistLoaded(loadedEvent) {
			try {
				var rss = loadedEvent.responseXML.firstChild;
				if (html5.parsers.localName(rss) == "xml") {
					rss = rss.nextSibling;
				}
				var playlistObj = html5.parsers.rssparser.parse(rss);
				_eventDispatcher.sendEvent(_events.JWPLAYER_PLAYLIST_LOADED, {
					"playlist": new html5.playlist(playlistObj)
				});
			} catch (e) {
				_playlistError('Could not load the playlist.');
			}
		}
		
		function _playlistError(msg) {
			_eventDispatcher.sendEvent(_events.JWPLAYER_ERROR, {
				message: msg ? msg : 'Could not load playlist an unknown reason.'
			});
		}
	}
})(jwplayer.html5);/**
 * This class is responsible for setting up the player and triggering the PLAYER_READY event, or an JWPLAYER_ERROR event
 * 
 * The order of the player setup is as follows:
 * 
 * 1. parse config
 * 2. load skin (async)
 * 3. load external playlist (async)
 * 4. load preview image (requires 3)
 * 5. initialize components (requires 2)
 * 6. initialize plugins (requires 5)
 * 7. ready
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, _utils = _jw.utils, _events = _jw.events,
	
		PARSE_CONFIG = "config",
		LOAD_SKIN = "skin",
		LOAD_PLAYLIST = "playlist",
		LOAD_PREVIEW = "preview",
		SETUP_COMPONENTS = "components",
		INIT_PLUGINS = "plugins",
		SEND_READY = "ready";

	html5.setup = function(model, view, controller) {
		var _model = model, 
			_view = view,
			_controller = controller,
			_completed = {},
			_depends = {},
			_skin,
			_eventDispatcher = new _events.eventdispatcher(),
			_errorState = false,
			_queue = [];
			
		function _initQueue() {
			_addTask(PARSE_CONFIG, _parseConfig);
			_addTask(LOAD_SKIN, _loadSkin, PARSE_CONFIG);
			_addTask(LOAD_PLAYLIST, _loadPlaylist, PARSE_CONFIG);
			_addTask(LOAD_PREVIEW, _loadPreview, LOAD_PLAYLIST);
			_addTask(SETUP_COMPONENTS, _setupComponents, LOAD_SKIN);
			_addTask(INIT_PLUGINS, _initPlugins, SETUP_COMPONENTS + "," + LOAD_PLAYLIST);
			_addTask(SEND_READY, _sendReady, INIT_PLUGINS);
		}
		
		function _addTask(name, method, depends) {
			_queue.push({name:name, method:method, depends:depends});
		}

		function _nextTask() {
			for (var i=0; i < _queue.length; i++) {
				var task = _queue[i];
				if (_allComplete(task.depends)) {
					_queue.splice(i, 1);
					try {
						task.method();
						_nextTask();
					} catch(error) {
						_error(error.message);
					}
					return;
				}
			}
			if (_queue.length > 0 && !_errorState) {
				// Still waiting for a dependency to come through; wait a little while.
				setTimeout(_nextTask, 500);
			}
		}
		
		function _allComplete(dependencies) {
			if (!dependencies) return true;
			var split = dependencies.split(",");
			for (var i=0; i<split.length; i++) {
				if (!_completed[split[i]])
					return false;
			}
			return true;
		}

		function _taskComplete(name) {
			_completed[name] = true;
		}
		
		function _parseConfig() {
			_taskComplete(PARSE_CONFIG);
		}
		
		function _loadSkin() {
			_skin = new html5.skin();
			_skin.load(_model.config.skin, _skinLoaded);
		}
		
		function _skinLoaded(skin) {
			_taskComplete(LOAD_SKIN);
		}
		
		function _loadPlaylist() {
			switch(_utils.typeOf(_model.config.playlist)) {
			case "string":
				var loader = new html5.playlistloader();
				loader.addEventListener(_events.JWPLAYER_PLAYLIST_LOADED, _playlistLoaded);
				loader.addEventListener(_events.JWPLAYER_ERROR, _playlistError);
				loader.load(_model.config.playlist);
				break;
			case "array":
				_model.playlist = new html5.playlist(_model.config.playlist);
				_taskComplete(LOAD_PLAYLIST);
			}
		}
		
		function _playlistLoaded(evt) {
			_model.playlist = evt.playlist;
			_taskComplete(LOAD_PLAYLIST);
		}

		function _playlistError(evt) {
			_error(evt.message);
		}
		
		function _loadPreview() {
			var preview = _model.playlist[_model.item].image; 
			if (preview) {
				var img = new Image();
				img.addEventListener('load', _previewLoaded, false);
				// If there was an error, continue anyway
				img.addEventListener('error', _previewLoaded, false);
				img.src = preview; 
			}
		}
		
		function _previewLoaded(evt) {
			_taskComplete(LOAD_PREVIEW);
		}

		function _setupComponents() {
			_view.setup(_skin);
			_taskComplete(SETUP_COMPONENTS);
		}

		function _initPlugins() {
			_taskComplete(INIT_PLUGINS);
		}

		function _sendReady() {
			_eventDispatcher.sendEvent(_events.JWPLAYER_READY);
			_taskComplete(SEND_READY);
		}
		
		function _error(message) {
			_errorState = true;
			_eventDispatcher.sendEvent(_events.JWPLAYER_ERROR, {message: message});		
		}
		
		_utils.extend(this, _eventDispatcher);
		
		this.start = _nextTask;
		
		_initQueue();
	}

})(jwplayer.html5);

/**
 * JW Player component that loads PNG skins.
 *
 * @author zach
 * @version 5.4
 */
(function(html5) {
	html5.skin = function() {
		var _components = {};
		var _loaded = false;
		
		this.load = function(path, callback) {
			new html5.skinloader(path, function(skin) {
				_loaded = true;
				_components = skin;
				callback();
			}, function() {
				new html5.skinloader("", function(skin) {
					_loaded = true;
					_components = skin;
					callback();
				});
			});
			
		};
		
		this.getSkinElement = function(component, element) {
			if (_loaded) {
				try {
					return _components[component].elements[element];
				} catch (err) {
					jwplayer.utils.log("No such skin component / element: ", [component, element]);
				}
			}
			return null;
		};
		
		this.getComponentSettings = function(component) {
			if (_loaded && _components && _components[component]) {
				return _components[component].settings;
			}
			return null;
		};
		
		this.getComponentLayout = function(component) {
			if (_loaded) {
				var lo = _components[component].layout;
				if (lo && (lo.left || lo.right || lo.center))
					return _components[component].layout;
			}
			return null;
		};
		
	};
})(jwplayer.html5);
/**
 * JW Player component that loads PNG skins.
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(html5) {
	var _utils = jwplayer.utils;
	
	/** Constructor **/
	html5.skinloader = function(skinPath, completeHandler, errorHandler) {
		var _skin = {};
		var _completeHandler = completeHandler;
		var _errorHandler = errorHandler;
		var _loading = true;
		var _completeInterval;
		var _skinPath = skinPath;
		var _error = false;
		
		/** Load the skin **/
		function _load() {
			if (typeof _skinPath != "string" || _skinPath === "") {
				_loadSkin(html5.defaultskin().xml);
			} else {
				_utils.ajax(_utils.getAbsolutePath(_skinPath), function(xmlrequest) {
					try {
						if (_utils.exists(xmlrequest.responseXML)){
							_loadSkin(xmlrequest.responseXML);
							return;	
						}
					} catch (err){
						_clearSkin();
					}
					_loadSkin(html5.defaultskin().xml);
				}, function(path) {
					_loadSkin(html5.defaultskin().xml);
				});
			}
			
		}
		
		
		function _loadSkin(xml) {
			var components = xml.getElementsByTagName('component');
			if (components.length === 0) {
				return;
			}
			for (var componentIndex = 0; componentIndex < components.length; componentIndex++) {
				var componentName = components[componentIndex].getAttribute("name");
				var component = {
					settings: {},
					elements: {},
					layout: {}
				};
				_skin[componentName] = component;
				var elements = components[componentIndex].getElementsByTagName('elements')[0].getElementsByTagName('element');
				for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
					_loadImage(elements[elementIndex], componentName);
				}
				var settingsElement = components[componentIndex].getElementsByTagName('settings')[0];
				if (settingsElement && settingsElement.childNodes.length > 0) {
					var settings = settingsElement.getElementsByTagName('setting');
					for (var settingIndex = 0; settingIndex < settings.length; settingIndex++) {
						var name = settings[settingIndex].getAttribute("name");
						var value = settings[settingIndex].getAttribute("value");
						var type = /color$/.test(name) ? "color" : null;
						_skin[componentName].settings[name] = _utils.typechecker(value, type);
					}
				}
				var layout = components[componentIndex].getElementsByTagName('layout')[0];
				if (layout && layout.childNodes.length > 0) {
					var groups = layout.getElementsByTagName('group');
					for (var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
						var group = groups[groupIndex];
						_skin[componentName].layout[group.getAttribute("position")] = {
							elements: []
						};
						for (var attributeIndex = 0; attributeIndex < group.attributes.length; attributeIndex++) {
							var attribute = group.attributes[attributeIndex];
							_skin[componentName].layout[group.getAttribute("position")][attribute.name] = attribute.value;
						}
						var groupElements = group.getElementsByTagName('*');
						for (var groupElementIndex = 0; groupElementIndex < groupElements.length; groupElementIndex++) {
							var element = groupElements[groupElementIndex];
							_skin[componentName].layout[group.getAttribute("position")].elements.push({
								type: element.tagName
							});
							for (var elementAttributeIndex = 0; elementAttributeIndex < element.attributes.length; elementAttributeIndex++) {
								var elementAttribute = element.attributes[elementAttributeIndex];
								_skin[componentName].layout[group.getAttribute("position")].elements[groupElementIndex][elementAttribute.name] = elementAttribute.value;
							}
							if (!_utils.exists(_skin[componentName].layout[group.getAttribute("position")].elements[groupElementIndex].name)) {
								_skin[componentName].layout[group.getAttribute("position")].elements[groupElementIndex].name = element.tagName;
							}
						}
					}
				}
				
				_loading = false;
				
				_resetCompleteIntervalTest();
			}
		}
		
		
		function _resetCompleteIntervalTest() {
			clearInterval(_completeInterval);
			if (!_error) {
				_completeInterval = setInterval(function() {
					_checkComplete();
				}, 100);
			}
		}
		
		
		/** Load the data for a single element. **/
		function _loadImage(element, component) {
			var img = new Image();
			var elementName = element.getAttribute("name");
			var elementSource = element.getAttribute("src");
			var imgUrl;
			if (elementSource.indexOf('data:image/png;base64,') === 0) {
				imgUrl = elementSource;
			} else {
				var skinUrl = _utils.getAbsolutePath(_skinPath);
				var skinRoot = skinUrl.substr(0, skinUrl.lastIndexOf('/'));
				imgUrl = [skinRoot, component, elementSource].join('/');
			}
			
			_skin[component].elements[elementName] = {
				height: 0,
				width: 0,
				src: '',
				ready: false,
				image: img
			};
			
			img.onload = function(evt) {
				_completeImageLoad(img, elementName, component);
			};
			img.onerror = function(evt) {
				_error = true;
				_resetCompleteIntervalTest();
				_errorHandler();
			};
			
			img.src = imgUrl;
		}
		
		function _clearSkin() {
			for (var componentName in _skin) {
				var component = _skin[componentName];
				for (var elementName in component.elements) {
					var element = component.elements[elementName];
					var img = element.image;
					img.onload = null;
					img.onerror = null;
					delete element.image;
					delete component.elements[elementName];
				}
				delete _skin[componentName];
			}
		}
		
		function _checkComplete() {
			for (var component in _skin) {
				if (component != 'properties') {
					for (var element in _skin[component].elements) {
						if (!_skin[component].elements[element].ready) {
							return;
						}
					}
				}
			}
			if (_loading === false) {
				clearInterval(_completeInterval);
				_completeHandler(_skin);
			}
		}
		
		
		function _completeImageLoad(img, element, component) {
			if(_skin[component] && _skin[component].elements[element]) {
				_skin[component].elements[element].height = img.height;
				_skin[component].elements[element].width = img.width;
				_skin[component].elements[element].src = img.src;
				_skin[component].elements[element].ready = true;
				_resetCompleteIntervalTest();
			} else {
				_utils.log("Loaded an image for a missing element: " + component + "." + element);
			}
		}
		
		_load();
	};
})(jwplayer.html5);
/**
 * Video tag stuff
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayerhtml5) {

	var _jw = jwplayer, 
		_utils = _jw.utils, 
		_events = _jw.events, 
		_states = _events.state,
		_isMobile = _utils.isMobile();
	

	/** HTML5 video class * */
	jwplayerhtml5.video = function(videotag) {

		var _mediaEvents = {
			"abort" : _generalHandler,
			"canplay" : _canPlayHandler,
			"canplaythrough" : _generalHandler,
			"durationchange" : _durationUpdateHandler,
			"emptied" : _generalHandler,
			"ended" : _generalHandler,
			"error" : _errorHandler,
			"loadeddata" : _generalHandler,
			"loadedmetadata" : _canPlayHandler,
			"loadstart" : _generalHandler,
			"pause" : _playHandler,
			"play" : _playHandler,
			"playing" : _playHandler,
			"progress" : _generalHandler,
			"ratechange" : _generalHandler,
			"readystatechange" : _generalHandler,
			"seeked" : _generalHandler,
			"seeking" : _generalHandler,
			"stalled" : _generalHandler,
			"suspend" : _generalHandler,
			"timeupdate" : _timeUpdateHandler,
			"volumechange" : _volumeHandler,
			"waiting" : _bufferStateHandler
		},

		// Reference to the video tag
		_video,
		// Current duration
		_duration,
		// Current position
		_position,
		// Requested seek position
		_seekOffset,
		// Whether seeking is ready yet
		_canSeek,
		// If we should seek on canplay
		_delayedSeek,
		// Current media state
		_state = _states.IDLE,
		// Save the volume state before muting
		_lastVolume = 0,
		// Using setInterval to check buffered ranges
		_bufferInterval = -1,
		// Last sent buffer amount
		_bufferPercent = -1,
		// Event dispatcher
		_eventDispatcher = new _events.eventdispatcher();

		_utils.extend(this, _eventDispatcher);

		// Constructor
		function _init(videotag) {
			_video = videotag;
			_setupListeners();

			// Workaround for a Safari bug where video disappears on switch to fullscreen
			_video.controls = true;
			_video.controls = false;
		}

		function _setupListeners() {
			for (var evt in _mediaEvents) {
				_video.addEventListener(evt, _mediaEvents[evt], false);
			}
		}

		function _sendEvent(type, data) {
			_eventDispatcher.sendEvent(type, data);
		}

		
		function _generalHandler(evt) {
			//console.log("%s %o (%s,%s)", evt.type, evt);
		}

		function _durationUpdateHandler(evt) {
			_duration = _video.duration;
			_timeUpdateHandler();
		}

		function _timeUpdateHandler(evt) {
			if (_state == _states.PLAYING) {
				_position = _video.currentTime;
				_sendEvent(_events.JWPLAYER_MEDIA_TIME, {
					position : _position,
					duration : _duration
				});
				if (_position >= _duration && _duration > 0) {
					_complete();
				}
			}
		}

		function _canPlayHandler(evt) {
			if (!_canSeek) {
				_canSeek = true;
				_sendEvent(_events.JWPLAYER_MEDIA_BUFFER_FULL);
				if (_delayedSeek > 0) {
					_seek(_delayedSeek);
				}
			}
		}

		function _playHandler(evt) {
			if (_video.paused) {
				_setState(_states.PAUSED);
			} else {
				_setState(_states.PLAYING);
			}
		}
		
		function _bufferStateHandler(evt) {
			_setState(_states.BUFFERING);
		}

		function _errorHandler(evt) {
			_utils.log("Error: %o", _video.error);
			_setState(_states.IDLE);
		}

		this.load = function(videoURL) {
			_canSeek = false;
			_delayedSeek = 0;
			_duration = 0;
			_position = 0;
			_setState(_states.BUFFERING); 
			_video.src = videoURL;
			
			_video.load();
			
			_bufferInterval = setInterval(_sendBufferUpdate, 100);

			if (_isMobile) {
				_video.controls = true;
				_video.style.opacity = 1;
			}
		}

		var _stop = this.stop = function() {
			// _video.src = "";
			_video.removeAttribute("src");
			_video.load();
			_video.style.opacity = 0;
			clearInterval(_bufferInterval);
			_setState(_states.IDLE);
		}

		this.play = function() {
			_video.style.opacity = 1;
			_video.play();
		}

		this.pause = function() {
			_video.pause();
		}

		var _seek = this.seek = function(pos) {
			if (_canSeek) {
				_delayedSeek = 0;
				_sendEvent(_events.JWPLAYER_MEDIA_SEEK, {
					position: _position,
					offset: pos
				});
				_video.currentTime = pos;
			} else {
				_delayedSeek = pos;
			}
		}

		var _volume = this.volume = function(vol) {
			if (_video.muted) _video.muted = false;
			_video.volume = vol / 100;

		}
		
		function _volumeHandler(evt) {
			_sendEvent(_events.JWPLAYER_MEDIA_VOLUME, {
				volume: Math.round(_video.volume * 100)
			});
			_sendEvent(_events.JWPLAYER_MEDIA_MUTE, {
				mute: _video.muted
			});
		}
		
		this.mute = function(state) {
			if (!_utils.exists(state)) state = !_video.mute;
			if (state) {
				_lastVolume = _video.volume * 100;
				_volume(0);
				_video.muted = true;
			} else {
				_volume(_lastVolume);
			}
		}

		/** Set the current player state * */
		function _setState(newstate) {
			// Handles a FF 3.5 issue
			if (newstate == _states.PAUSED && _state == _states.IDLE) {
				return;
			}

			if (_state != newstate) {
				var oldstate = _state;
				_state = newstate;
				_sendEvent(_events.JWPLAYER_PLAYER_STATE, {
					oldstate : oldstate,
					newstate : newstate
				});
			}
		}
		
		function _sendBufferUpdate() {
			var newBuffer = _getBuffer();
			if (newBuffer != _bufferPercent) {
				_bufferPercent = newBuffer;
				_sendEvent(_events.JWPLAYER_MEDIA_BUFFER, {
					bufferPercent: Math.round(_bufferPercent * 100)
				});
			}
			if (newBuffer >= 1) {
				clearInterval(_bufferInterval);
			}
		}
		
		function _getBuffer() {
			if (_video.buffered.length == 0 || _video.duration == 0)
				return 0;
			else
				return _video.buffered.end(_video.buffered.length-1) / _video.duration;
		}
		

		function _complete() {
			_stop();
			_sendEvent(_events.JWPLAYER_MEDIA_COMPLETE);
		}
		
		// Provide access to video tag
		// TODO: remove
		this.getTag = function() {
			return videotag;
		}

		// Call constructor
		_init(videotag);

	}

})(jwplayer.html5);/**
 * jwplayer.html5 namespace
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, _utils = _jw.utils, _style = _utils.appendStylesheet, _events = jwplayer.events, _states = _events.state;

	DOCUMENT = document, 
	VIEW_CONTAINER_CLASS = "jwplayer", 
	VIEW_VIDEO_CONTAINER_CLASS = "jwvideocontainer", 
	VIEW_CONTROLS_CONTAINER_CLASS = "jwcontrolscontainer";

	html5.view = function(api, model) {
		var _api = api, 
			_model = model, 
			_controls = {},
			_container,
			_controlsLayer,
			_controlsTimeout=0,
			_timeoutDuration = 2000,
			_videoLayer;

		this.setup = function(skin) {
			_api.skin = skin;
			
			_container = DOCUMENT.createElement("div");
			_container.className = VIEW_CONTAINER_CLASS;
			_container.id = _api.id;
			
			var replace = document.getElementById(_api.id);
			replace.parentNode.replaceChild(_container, replace);

			_videoLayer = DOCUMENT.createElement("span");
			_videoLayer.className = VIEW_VIDEO_CONTAINER_CLASS;
			_videoLayer.appendChild(_model.getVideo().getTag());

			_controlsLayer = DOCUMENT.createElement("span");
			_controlsLayer.className = VIEW_CONTROLS_CONTAINER_CLASS;

			_setupControls();
			
			_container.appendChild(_videoLayer);
			_container.appendChild(_controlsLayer);
			
			DOCUMENT.addEventListener('webkitfullscreenchange', _fullscreenChangeHandler, false);
			DOCUMENT.addEventListener('mozfullscreenchange', _fullscreenChangeHandler, false);
			DOCUMENT.addEventListener('keydown', _keyHandler, false);
			
			_api.jwAddEventListener(_events.JWPLAYER_PLAYER_STATE, _stateHandler);
			
			_container.addEventListener('mouseout', _fadeControls, false);
			
			_container.addEventListener('mousemove', function(evt) {
				_showControls();
				clearTimeout(_controlsTimeout);
				_controlsTimeout = setTimeout(_fadeControls, _timeoutDuration);
			}, false);
			
		}
	
		function _fadeControls() {
			if (_api.jwGetState() == _states.PLAYING) {
				_hideControls();
			}
			clearTimeout(_controlsTimeout);
			_controlsTimeout = 0;
		}
		
		function _setupControls() {
			var width = _api.jwGetWidth(),
				height = _api.jwGetHeight(),
				cbSettings = _api.skin.getComponentSettings('controlbar'),
				displaySettings = _api.skin.getComponentSettings('display')
		
			if (height > 40 || height.indexOf("%")) {
				_controls.display = new html5.display(_api, displaySettings);
				_controlsLayer.appendChild(_controls.display.getDisplayElement());
			} else {
				displaySettings.backgroundcolor = 'transparent';
				cbSettings.margin = 0;
			}

			_style('#'+_container.id, {
				'background-color': displaySettings.backgroundcolor ? displaySettings.backgroundcolor : 0,
				width: width,
				height: height
			});

			if (!_utils.isMobile()) {
				_controls.controlbar = new html5.controlbar(_api, cbSettings);
				_controlsLayer.appendChild(_controls.controlbar.getDisplayElement());
			}
		}

		/** 
		 * Switch to fullscreen mode.  If a native fullscreen method is available in the browser, use that.  
		 * Otherwise, use the false fullscreen method using CSS. 
		 **/
		var _fullscreen = this.fullscreen = function(state) {
			if (!_utils.exists(state)) {
				state = !_model.fullscreen;
			}

			if (state) {
				if (!_model.fullscreen) {
					_fakeFullscreen(true);
					
					if (_container.requestFullScreen) {
						_container.requestFullScreen();
					} else if (_container.mozRequestFullScreen) {
						_container.mozRequestFullScreen();
					} else if (_container.webkitRequestFullScreenWithKeys) {
						_container.webkitRequestFullScreenWithKeys();
					} else if (_container.webkitRequestFullScreen) {
						_container.webkitRequestFullScreen();
					}
				}
				_model.setFullscreen(true);
			} else {
		    	_fakeFullscreen(false);
			    if (DOCUMENT.cancelFullScreen) {  
			    	DOCUMENT.cancelFullScreen();  
			    } else if (DOCUMENT.mozCancelFullScreen) {  
			    	DOCUMENT.mozCancelFullScreen();  
			    } else if (DOCUMENT.webkitCancelFullScreen) {  
			    	DOCUMENT.webkitCancelFullScreen();  
			    }
				_model.setFullscreen(false);
			}
		}

		/**
		 * Resize the player
		 */
		function _resize(width, height) {
			if (_controls.display) {
				_controls.display.resize(width, height);
			}
			if (_controls.controlbar) {
				_controls.controlbar.resize(width, height);
			}
			if (_container.style.opacity == 0) {
				_container.style.opacity = 1;
			}
			return;
		}
		
		this.resize = _resize;
		
		
		/**
		 * Listen for keystrokes.  Currently only ESC is recognized, to switch out of fullscreen mode.
		 **/
		function _keyHandler(evt) {
			switch (evt.keyCode) {
			// ESC
			case 27:
				if (_model.fullscreen) {
					_fullscreen(false);
				}
				break;
			// SPACE
			case 32:
				_api.jwPlay()
				break;
			}
		}
		
		/**
		 * False fullscreen mode. This is used for browsers without full support for HTML5 fullscreen.
		 * This method sets the CSS of the container element to a fixed position with 100% width and height.
		 */
		function _fakeFullscreen(state) {
			if (state) {
				_container.className += " jwfullscreen";
			} else {
				_container.className = _container.className.replace(/\s+jwfullscreen/, "");
			}
		}

		/**
		 * Return whether or not we're in native fullscreen
		 */
		function _isNativeFullscreen() {
			return (DOCUMENT.mozFullScreenElement == _container || 
					DOCUMENT.webkitCurrentFullScreenElement == _container);
		}
		
		/**
		 * If the browser enters or exits fullscreen mode (without the view's knowing about it) update the model.
		 **/
		function _fullscreenChangeHandler(evt) {
			_model.setFullscreen(_isNativeFullscreen());
			_fullscreen(_model.fullscreen);
		}

		function _hideControls() {
			_controlsLayer.style.opacity = 0;
		}

		function _showControls() {
			_controlsLayer.style.opacity = 1;
		}

		/**
		 * Player state handler
		 */
		function _stateHandler(evt) {
			switch(evt.newstate) {
			case _states.PLAYING:
				_hideControls();
				break;
			case _states.COMPLETED:
			case _states.IDLE:
			case _states.BUFFERING:
			case _states.PAUSED:
				_showControls();
				break;
			}
		}


	}

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	var JW_CSS_SMOOTH_EASE = "opacity .25s ease";

	
	// Container styles
	_style('.' + VIEW_CONTAINER_CLASS, {
		position : "relative",
		overflow: "hidden",
		opacity: 0,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_style('.' + VIEW_VIDEO_CONTAINER_CLASS + ' ,.'+ VIEW_CONTROLS_CONTAINER_CLASS, {
		position : "absolute",
		width : "100%",
		height : "100%",
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_style('.' + VIEW_VIDEO_CONTAINER_CLASS + " video", {
		background : "transparent",
		width : "100%",
		height : "100%",
		opacity : 0,
		'-webkit-transition' : 'opacity .15s ease'
	});


	
	// Fullscreen styles
	
	_style('.' + VIEW_CONTAINER_CLASS+':-webkit-full-screen', {
		width: "100% !important",
		height: "100% !important"
	});
	
	_style('.' + VIEW_CONTAINER_CLASS+':-moz-full-screen', {
		width: "100% !important",
		height: "100% !important"
	});
	
	_style('.' + VIEW_CONTAINER_CLASS+'.jwfullscreen', {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		'z-index': 1000,
		position: "fixed !important"
	});

	_style('.' + VIEW_CONTAINER_CLASS+' .jwuniform', {
		'background-size': 'contain !important'
	});

	_style('.' + VIEW_CONTAINER_CLASS+' .jwfill', {
		'background-size': 'cover !important'
	});

	_style('.' + VIEW_CONTAINER_CLASS+' .jwexactfit', {
		'background-size': '100% 100% !important'
	});

	_style('.' + VIEW_CONTAINER_CLASS+' .jwnone', {
		'background-size': null
	});

})(jwplayer.html5);/**
 * JW Player Source Endcap
 * 
 * This will appear at the end of the JW Player source
 * 
 * @version 6.0
 */

 }