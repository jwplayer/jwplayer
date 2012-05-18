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

jwplayer.version = '6.0.2201';

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
	var DOCUMENT = document, WINDOW = window;
	
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

	/** Used for styling dimensions in CSS -- return the string unchanged if it's a percentage width; add 'px' otherwise **/ 
	utils.styleDimension = function(dimension) {
		return dimension + (dimension.toString().indexOf("%") > 0 ? "" : "px");
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

	/**
	 * Recursively traverses nested object, replacing key names containing a
	 * search string with a replacement string.
	 * 
	 * @param searchString
	 *            The string to search for in the object's key names
	 * @param replaceString
	 *            The string to replace in the object's key names
	 * @returns The modified object.
	 */
	jwplayer.utils.deepReplaceKeyName = function(obj, searchString, replaceString) {
		switch (jwplayer.utils.typeOf(obj)) {
		case "array":
			for ( var i = 0; i < obj.length; i++) {
				obj[i] = jwplayer.utils.deepReplaceKeyName(obj[i],
						searchString, replaceString);
			}
			break;
		case "object":
			for ( var key in obj) {
				var searches, replacements;
				if (searchString instanceof Array && replaceString instanceof Array) {
					if (searchString.length != replaceString.length)
						continue;
					else {
						searches = searchString;
						replacements = replaceString;
					}
				} else {
					searches = [searchString];
					replacements = [replaceString];
				}
				var newkey = key;
				for (var i=0; i < searches.length; i++) {
					newkey = newkey.replace(new RegExp(searchString[i], "g"), replaceString[i]);
				}
				obj[newkey] = jwplayer.utils.deepReplaceKeyName(obj[key], searchString, replaceString);
				if (key != newkey) {
					delete obj[key];
				}
			}
			break;
		}
		return obj;
	}

})(jwplayer);/**
 * JW Player Media Extension to Mime Type mapping
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(utils) {
	var video = "video/", 
		audio = "audio/",
		image = "image",
		mp4 = "mp4",
		
		html5Extensions = {
			"f4a": audio+mp4,
			"f4v": video+mp4,
			"mov": video+mp4,
			"m4a": audio+mp4,
			"m4v": video+mp4,
			"mp4": video+mp4,
			"aac": audio+"aac",
			"mp3": audio+"mp3",
			"ogg": audio+"ogg",
			"oga": audio+"ogg",
			"ogv": video+"ogg",
			"webm": video+"webm",
			"m3u8": "application/vnd.apple.mpegurl"
		}, 
		video = "video", 
		flashExtensions = {
			"flv": video,
			"f4v": video,
			"mov": video,
			"m4a": video,
			"m4v": video,
			"mp4": video,
			"aac": video,
			"mp3": "sound",
			"smil": "rtmp",
			"m3u8": "hls"
		};
	
	var _extensionmap = utils.extensionmap = {};
	for (var ext in html5Extensions) {
		_extensionmap[ext] = { html5: html5Extensions[ext] };
	}
	for (ext in flashExtensions) {
		if (!_extensionmap[ext]) _extensionmap[ext] = {};
		_extensionmap[ext].flash = flashExtensions[ext];
	}

})(jwplayer.utils);
/**
 * Loads a <script> tag
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(utils) {

	var _loaderstatus = utils.loaderstatus = {
			NEW: 0,
			LOADING: 1,
			ERROR: 2,
			COMPLETE: 3
		},
		DOCUMENT = document;
	
	
	utils.scriptloader = function(url) {
		var _status = _loaderstatus.NEW,
			_events = jwplayer.events,
			_eventDispatcher = new _events.eventdispatcher();
		
		utils.extend(this, _eventDispatcher);
		
		this.load = function() {
			if (_status == _loaderstatus.NEW) {
				_status = _loaderstatus.LOADING;
				var scriptTag = DOCUMENT.createElement("script");
				// Most browsers
				scriptTag.onload = function(evt) {
					_status = _loaderstatus.COMPLETE;
					_eventDispatcher.sendEvent(_events.COMPLETE);
				}
				scriptTag.onerror = function(evt) {
					_status = _loaderstatus.ERROR;
					_eventDispatcher.sendEvent(_events.ERROR);
				}
				// IE
				scriptTag.onreadystatechange = function() {
					if (scriptTag.readyState == 'loaded' || scriptTag.readyState == 'complete') {
						_status = _loaderstatus.COMPLETE;
						_eventDispatcher.sendEvent(_events.COMPLETE);
					}
					// Error?
				}
				DOCUMENT.getElementsByTagName("head")[0].appendChild(scriptTag);
				scriptTag.src = url;
			}
			
		};
		
		this.getStatus = function() {
			return _status;
		}
	}
})(jwplayer.utils);
/**
 * String utilities for the JW Player.
 *
 * @version 6.0
 */
(function(utils) {
	/** Removes whitespace from the beginning and end of a string **/
	utils.trim = function(inputString) {
		return inputString.replace(/^\s*/, "").replace(/\s*$/, "");
	};
	
	/**
	 * Pads a string
	 * @param {String} string
	 * @param {Number} length
	 * @param {String} padder
	 */
	utils.pad = function (string, length, padder) {
		if (!padder){
			padder = "0";
		}
		while (string.length < length) {
			string = padder + string;
		}
		return string;
	}
	
	/**
	 * Convert a time-representing string to a number.
	 *
	 * @param {String}	The input string. Supported are 00:03:00.1 / 03:00.1 / 180.1s / 3.2m / 3.2h
	 * @return {Number}	The number of seconds.
	 */
	utils.seconds = function(str) {
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
	utils.xmlAttribute = function(xml, attribute) {
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
	utils.jsonToString = function(obj) {
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
							value = utils.jsonToString(value);
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
	};
	
	/** Returns the extension of a file name * */
	utils.extension = function(path) {
		if (!path) { return ""; }
		path = path.substring(path.lastIndexOf("/") + 1, path.length).split("?")[0];
		if (path.lastIndexOf('.') > -1) {
			return path.substr(path.lastIndexOf('.') + 1, path.length).toLowerCase();
		}
	};
	
	/** Convert a string representation of a string to an integer **/
	utils.stringToColor = function(value) {
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

		// Display CLick
		JWPLAYER_DISPLAY_CLICK : 'jwplayerViewClick',

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
 * Plugin package definition
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {
	var _plugins = {};		
	var _pluginLoaders = {};
	
	jwplayer.plugins = function() {
	}
	
	jwplayer.plugins.loadPlugins = function(id, config) {
		_pluginLoaders[id] = new jwplayer.plugins.pluginloader(new jwplayer.plugins.model(_plugins), config);
		return _pluginLoaders[id];
	}
	
	jwplayer.plugins.registerPlugin = function(id, arg1, arg2) {
		var pluginId = jwplayer.utils.getPluginName(id);
		if (_plugins[pluginId]) {
			_plugins[pluginId].registerPlugin(id, arg1, arg2);
		} else {
			jwplayer.utils.log("A plugin ("+id+") was registered with the player that was not loaded. Please check your configuration.");
			for (var pluginloader in _pluginLoaders){
				_pluginLoaders[pluginloader].pluginFailed();
			}
		}
	}
})(jwplayer);
/**
 * Model that manages all plugins
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {		
	jwplayer.plugins.model = function(plugins) {
		this.addPlugin = function(url) {
			var pluginName = jwplayer.utils.getPluginName(url);
			if (!plugins[pluginName]) {
				plugins[pluginName] = new jwplayer.plugins.plugin(url);
			}
			return plugins[pluginName];
		}
	}
})(jwplayer);
/**
 * Internal plugin model
 * @author zach
 * @version 5.8
 */
(function(jwplayer) {
	jwplayer.plugins.pluginmodes = {
		FLASH: "FLASH",
		JAVASCRIPT: "JAVASCRIPT",
		HYBRID: "HYBRID"
	}
	
	jwplayer.plugins.plugin = function(url) {
		var _repo = "http://plugins.longtailvideo.com"
		var _status = jwplayer.utils.loaderstatus.NEW;
		var _flashPath;
		var _js;
		var _completeTimeout;
		
		var _eventDispatcher = new jwplayer.events.eventdispatcher();
		jwplayer.utils.extend(this, _eventDispatcher);
		
		function getJSPath() {
			switch (jwplayer.utils.getPluginPathType(url)) {
				case jwplayer.utils.pluginPathType.ABSOLUTE:
					return url;
				case jwplayer.utils.pluginPathType.RELATIVE:
					return jwplayer.utils.getAbsolutePath(url, window.location.href);
				case jwplayer.utils.pluginPathType.CDN:
					var pluginName = jwplayer.utils.getPluginName(url);
					var pluginVersion = jwplayer.utils.getPluginVersion(url);
					var repo = (window.location.href.indexOf("https://") == 0) ? _repo.replace("http://", "https://secure") : _repo;
					return repo + "/" + jwplayer.version.split(".")[0] + "/" + pluginName + "/" 
							+ pluginName + (pluginVersion !== "" ? ("-" + pluginVersion) : "") + ".js";
			}
		}
		
		function completeHandler(evt) {
			_completeTimeout = setTimeout(function(){
				_status = jwplayer.utils.loaderstatus.COMPLETE;
				_eventDispatcher.sendEvent(jwplayer.events.COMPLETE);		
			}, 1000);
		}
		
		function errorHandler(evt) {
			_status = jwplayer.utils.loaderstatus.ERROR;
			_eventDispatcher.sendEvent(jwplayer.events.ERROR);
		}
		
		this.load = function() {
			if (_status == jwplayer.utils.loaderstatus.NEW) {
				if (url.lastIndexOf(".swf") > 0) {
					_flashPath = url;
					_status = jwplayer.utils.loaderstatus.COMPLETE;
					_eventDispatcher.sendEvent(jwplayer.events.COMPLETE);
					return;
				}
				_status = jwplayer.utils.loaderstatus.LOADING;
				var _loader = new jwplayer.utils.scriptloader(getJSPath());
				// Complete doesn't matter - we're waiting for registerPlugin 
				_loader.addEventListener(jwplayer.events.COMPLETE, completeHandler);
				_loader.addEventListener(jwplayer.events.ERROR, errorHandler);
				_loader.load();
			}
		}
		
		this.registerPlugin = function(id, arg1, arg2) {
			if (_completeTimeout){
				clearTimeout(_completeTimeout);
				_completeTimeout = undefined;
			}
			if (arg1 && arg2) {
				_flashPath = arg2;
				_js = arg1;
			} else if (typeof arg1 == "string") {
				_flashPath = arg1;
			} else if (typeof arg1 == "function") {
				_js = arg1;
			} else if (!arg1 && !arg2) {
				_flashPath = id;
			}
			_status = jwplayer.utils.loaderstatus.COMPLETE;
			_eventDispatcher.sendEvent(jwplayer.events.COMPLETE);
		}
		
		this.getStatus = function() {
			return _status;
		}
		
		this.getPluginName = function() {
			return jwplayer.utils.getPluginName(url);
		}
		
		this.getFlashPath = function() {
			if (_flashPath) {
				switch (jwplayer.utils.getPluginPathType(_flashPath)) {
					case jwplayer.utils.pluginPathType.ABSOLUTE:
						return _flashPath;
					case jwplayer.utils.pluginPathType.RELATIVE:
						if (url.lastIndexOf(".swf") > 0) {
							return jwplayer.utils.getAbsolutePath(_flashPath, window.location.href);
						}
						return jwplayer.utils.getAbsolutePath(_flashPath, getJSPath());
					case jwplayer.utils.pluginPathType.CDN:
						if (_flashPath.indexOf("-") > -1){
							return _flashPath+"h";
						}
						return _flashPath+"-h";
				}
			}
			return null;
		}
		
		this.getJS = function() {
			return _js;
		}

		this.getPluginmode = function() {
			if (typeof _flashPath != "undefined"
			 && typeof _js != "undefined") {
			 	return jwplayer.plugins.pluginmodes.HYBRID;
			 } else if (typeof _flashPath != "undefined") {
			 	return jwplayer.plugins.pluginmodes.FLASH;
			 } else if (typeof _js != "undefined") {
			 	return jwplayer.plugins.pluginmodes.JAVASCRIPT;
			 }
		}
		
		this.getNewInstance = function(api, config, div) {
			return new _js(api, config, div);
		}
		
		this.getURL = function() {
			return url;
		}
	}
	
})(jwplayer);
/**
 * Loads plugins for a player
 * @author zach
 * @version 5.6
 */
(function(jwplayer) {

	jwplayer.plugins.pluginloader = function(model, config) {
		var _plugins = {};
		var _status = jwplayer.utils.loaderstatus.NEW;
		var _loading = false;
		var _iscomplete = false;
		var _eventDispatcher = new jwplayer.events.eventdispatcher();
		jwplayer.utils.extend(this, _eventDispatcher);
		
		/*
		 * Plugins can be loaded by multiple players on the page, but all of them use
		 * the same plugin model singleton. This creates a race condition because
		 * multiple players are creating and triggering loads, which could complete
		 * at any time. We could have some really complicated logic that deals with
		 * this by checking the status when it's created and / or having the loader
		 * redispatch its current status on load(). Rather than do this, we just check
		 * for completion after all of the plugins have been created. If all plugins
		 * have been loaded by the time checkComplete is called, then the loader is
		 * done and we fire the complete event. If there are new loads, they will
		 * arrive later, retriggering the completeness check and triggering a complete
		 * to fire, if necessary.
		 */
		function _complete() {
			if (!_iscomplete) {
				_iscomplete = true;
				_status = jwplayer.utils.loaderstatus.COMPLETE;
				_eventDispatcher.sendEvent(jwplayer.events.COMPLETE);
			}
		}
		
		// This is not entirely efficient, but it's simple
		function _checkComplete() {
			if (!_iscomplete) {
				var incomplete = 0;
				for (plugin in _plugins) {
					var status = _plugins[plugin].getStatus(); 
					if (status == jwplayer.utils.loaderstatus.LOADING 
							|| status == jwplayer.utils.loaderstatus.NEW) {
						incomplete++;
					}
				}
				
				if (incomplete == 0) {
					_complete();
				}
			}
		}
		
		this.setupPlugins = function(api, config, resizer) {
			var flashPlugins = {
				length: 0,
				plugins: {}
			};
			var jsplugins = {
				length: 0,
				plugins: {}
			};
			for (var plugin in _plugins) {
				var pluginName = _plugins[plugin].getPluginName();
				if (_plugins[plugin].getFlashPath()) {
					flashPlugins.plugins[_plugins[plugin].getFlashPath()] = config.plugins[plugin];
					flashPlugins.plugins[_plugins[plugin].getFlashPath()].pluginmode = _plugins[plugin].getPluginmode();
					flashPlugins.length++;
				}
				if (_plugins[plugin].getJS()) {
					var div = document.createElement("div");
					div.id = api.id + "_" + pluginName;
					div.style.position = "absolute";
					div.style.zIndex = jsplugins.length + 10;
					jsplugins.plugins[pluginName] = _plugins[plugin].getNewInstance(api, config.plugins[plugin], div);
					jsplugins.length++;
					if (typeof jsplugins.plugins[pluginName].resize != "undefined") {
						api.onReady(resizer(jsplugins.plugins[pluginName], div, true));
						api.onResize(resizer(jsplugins.plugins[pluginName], div));
					}
				}
			}
			
			api.plugins = jsplugins.plugins;
			
			return flashPlugins;
		};
		
		this.load = function() {
			_status = jwplayer.utils.loaderstatus.LOADING;
			_loading = true;
			
			/** First pass to create the plugins and add listeners **/
			for (var plugin in config) {
				if (jwplayer.utils.exists(plugin)) {
					_plugins[plugin] = model.addPlugin(plugin);
					_plugins[plugin].addEventListener(jwplayer.events.COMPLETE, _checkComplete);
					_plugins[plugin].addEventListener(jwplayer.events.ERROR, _checkComplete);
				}
			}
			
			/** Second pass to actually load the plugins **/
			for (plugin in _plugins) {
				// Plugin object ensures that it's only loaded once
				_plugins[plugin].load();
			}
			
			_loading = false;
			
			// Make sure we're not hanging around waiting for plugins that already finished loading
			_checkComplete();
		}
		
		this.pluginFailed = function() {
			_complete();
		}
		
		this.getStatus = function() {
			return _status;
		}
		
	}
})(jwplayer);
/**
 * JW Player playlist model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(jwplayer) {
	jwplayer.playlist = function(playlist) {
		var _playlist = [];
		if (jwplayer.utils.typeOf(playlist) == "array") {
			for (var i=0; i < playlist.length; i++) {
				_playlist.push(new jwplayer.playlist.item(playlist[i]));
			}
		} else {
			_playlist.push(new jwplayer.playlist.item(playlist));
		}
		return _playlist;
	};
	
})(jwplayer);
/**
 * JW Player playlist item model
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(playlist) {
	playlist.item = function(config) {
		var _defaults = {
			description: "",
			image: "",
			mediaid: "",
			title: "",
			
			duration: -1,
			
			sources: []
		};
		
		
		var _playlistitem = jwplayer.utils.extend({}, _defaults, config);
		
/*
		if (_playlistitem.type) {
			_playlistitem.provider = _playlistitem.type;
			delete _playlistitem.type;
		}
*/		
		if (_playlistitem.sources.length == 0) {
			_playlistitem.sources[0] = new playlist.source(_playlistitem);
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
})(jwplayer.playlist);/**
 * JW Player playlist item source
 *
 * @author pablo
 * @version 6.0
 */
(function(playlist) {
	playlist.source = function(config) {
		var _source = {
			file: "",
			width: 0,
			label: undefined,
			type: undefined
		};
		
		for (var property in _source) {
			if (jwplayer.utils.exists(config[property])) {
				_source[property] = config[property];
			}
		}
		return _source;
	};
	
})(jwplayer.playlist);
/**
 * Embedder for the JW Player
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var _utils = jwplayer.utils,
		_events = jwplayer.events;
	
	var embed = jwplayer.embed = function(playerApi) {
//		var mediaConfig = _utils.mediaparser.parseMedia(playerApi.container);
		var _config = new embed.config(playerApi.config);
			_config.id = playerApi.id; 
				
		var _pluginloader = jwplayer.plugins.loadPlugins(playerApi.id, _config.plugins);
		
		function _setupEvents(api, events) {
			for (var evt in events) {
				if (typeof api[evt] == "function") {
					(api[evt]).call(api, events[evt]);
				}
			}
		}
		
		function _embedPlayer() {
			var container = document.getElementById(playerApi.id);
			
			if (_pluginloader.getStatus() == _utils.loaderstatus.COMPLETE) {
				for (var mode = 0; mode < _config.modes.length; mode++) {
					if (_config.modes[mode].type && embed[_config.modes[mode].type]) {
						var modeconfig = _config.modes[mode].config;
						var configClone = _utils.extend({}, modeconfig ? embed.config.addConfig(_config, modeconfig) : _config);
						var embedder = new embed[_config.modes[mode].type](container, _config.modes[mode], configClone, _pluginloader, playerApi);
						if (embedder.supportsConfig()) {
							embedder.embed();
							
							_setupEvents(playerApi, _config.events);
							
							return playerApi;
						}
					}
				}
				
				if (_config.fallback) {
					_utils.log("No suitable players found and fallback enabled");
					new embed.download(container, _config);
				} else {
					_utils.log("No suitable players found and fallback disabled");
				}
				
//				new embed.logo(_utils.extend({
//					hide: true
//				}, _config.components.logo), "none", playerApi.id);
			}
		};
		
		_pluginloader.addEventListener(_events.COMPLETE, _embedPlayer);
		_pluginloader.addEventListener(_events.ERROR, _embedPlayer);
		_pluginloader.load();
		
		return playerApi;
	};
	
})(jwplayer);
/**
 * Configuration for the JW Player Embedder
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils,
		embed = jwplayer.embed,
		UNDEFINED = undefined;

	var config = embed.config = function(config) {
		
		function _setSources(modes, base, players) {
			for (var i=0; i<modes.length; i++) {
				var mode = modes[i].type;
				modes[i].src = players[mode] ? players[mode] : base + "jwplayer." + mode + (mode == "flash" ? ".swf" : ".js");
			}
		}
		
		var _defaults = {
				fallback: true,
				height: 300,
				primary: "html5",
				width: 400,
				base: UNDEFINED
			},
			_modes = {
			    html5: { type: "html5" },
				flash: { type: "flash" }
			},
			_config = utils.extend(_defaults, config);

		if (!_config.base) {
			_config.base = utils.getScriptPath("jwplayer.js");
		}
		
		if (!_config.modes) {
			_config.modes = (_config.primary == "flash") ? [_modes.flash, _modes.html5] : [_modes.html5, _modes.flash]; 
		}
		
		_setSources(_config.modes, _config.base, { html5: _config.html5player, flash: _config.flashplayer })
		
		_normalizePlaylist(_config);
		
		return _config;
	};

	/** Appends a new configuration onto an old one; used for mode configuration **/
	config.addConfig = function(oldConfig, newConfig) {
		_normalizePlaylist(newConfig);
		return utils.extend(oldConfig, newConfig);
	}
	
	/** Construct a playlist from base-level config elements **/
	function _normalizePlaylist(config) {
		if (!config.playlist) {
			var singleItem = {};
			_moveProperty(config, singleItem, "sources");
			_moveProperty(config, singleItem, "image");

			if (!config.sources) {
				if (config.levels) {
					singleItem.sources = config.levels;
					delete config.levels;
				} else {
					var singleSource = {};
					_moveProperty(config, singleSource, "file");
					_moveProperty(config, singleSource, "type");
					singleItem.sources = [singleSource];
				}
			}
				
			config.playlist = [singleItem];
		}
	}
	
	function _moveProperty(sourceObj, destObj, property) {
		if (utils.exists(sourceObj[property])) {
			destObj[property] = sourceObj[property];
			delete sourceObj[property];
		}
	}
	
	
//	function _isPosition(string) {
//		var lower = string.toLowerCase();
//		var positions = ["left", "right", "top", "bottom"];
//		
//		for (var position = 0; position < positions.length; position++) {
//			if (lower == positions[position]) {
//				return true;
//			}
//		}
//		
//		return false;
//	}
//	
//	function _isPlaylist(property) {
//		var result = false;
//		// JSON Playlist
//		result = (property instanceof Array) ||
//		// Single playlist item as an Object
//		(typeof property == "object" && !property.position && !property.size);
//		return result;
//	}
	
//	function getSize(size) {
//		if (typeof size == "string") {
//			if (parseInt(size).toString() == size || size.toLowerCase().indexOf("px") > -1) {
//				return parseInt(size);
//			} 
//		}
//		return size;
//	}
	
//	var components = ["playlist", "dock", "controlbar", "logo", "display"];
	
//	function getPluginNames(config) {
//		var pluginNames = {};
//		switch(utils.typeOf(config.plugins)){
//			case "object":
//				for (var plugin in config.plugins) {
//					pluginNames[utils.getPluginName(plugin)] = plugin;
//				}
//				break;
//			case "string":
//				var pluginArray = config.plugins.split(",");
//				for (var i=0; i < pluginArray.length; i++) {
//					pluginNames[utils.getPluginName(pluginArray[i])] = pluginArray[i];	
//				}
//				break;
//		}
//		return pluginNames;
//	}
//	
//	function addConfigParameter(config, componentType, componentName, componentParameter){
//		if (utils.typeOf(config[componentType]) != "object"){
//			config[componentType] = {};
//		}
//		var componentConfig = config[componentType][componentName];
//
//		if (utils.typeOf(componentConfig) != "object") {
//			config[componentType][componentName] = componentConfig = {};
//		}
//
//		if (componentParameter) {
//			if (componentType == "plugins") {
//				var pluginName = utils.getPluginName(componentName);
//				componentConfig[componentParameter] = config[pluginName+"."+componentParameter];
//				delete config[pluginName+"."+componentParameter];
//			} else {
//				componentConfig[componentParameter] = config[componentName+"."+componentParameter];
//				delete config[componentName+"."+componentParameter];
//			}
//		}
//	}
	
//	jwplayer.embed.deserialize = function(config){
//		var pluginNames = getPluginNames(config);
//		
//		for (var pluginId in pluginNames) {
//			addConfigParameter(config, "plugins", pluginNames[pluginId]);
//		}
//		
//		for (var parameter in config) {
//			if (parameter.indexOf(".") > -1) {
//				var path = parameter.split(".");
//				var prefix = path[0];
//				var parameter = path[1];
//
//				if (utils.isInArray(components, prefix)) {
//					addConfigParameter(config, "components", prefix, parameter);
//				} else if (pluginNames[prefix]) {
//					addConfigParameter(config, "plugins", pluginNames[prefix], parameter);
//				}
//			}
//		}
//		return config;
//	}
	
})(jwplayer);
/**
 * Download mode embedder for the JW Player
 * @author Zach
 * @version 5.5
 */
(function(jwplayer) {
	var embed = jwplayer.embed,
		utils = jwplayer.utils,
		
		JW_CSS_CURSOR = "pointer",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block",
		JW_CSS_100PCT = "100%",
		JW_CSS_ABSOLUTE = "absolute";
	
	embed.download = function(_container, _options) {
		var params = utils.extend({}, _options),
			_display,
			_width = params.width ? params.width : 480,
			_height = params.height ? params.height : 320,
			_file, 
			_image,
			_logo = _options.logo ? _options.logo : {
				prefix: 'http://l.longtailvideo.com/download/',
				file: 'logo.png',
				margin: 10
			};


		function _embed() {
			if (params.playlist && params.playlist.length) {
				try {
					_file = params.playlist[0].sources[0].file;
					_image = params.playlist[0].image;
				} catch(e) {
					return;
				}
			} else {
				return;
			}
			
			if (_logo.prefix) {
				_logo.prefix += jwplayer.version.split(/\W/).splice(0, 2).join("/") + "/";
			}
			
			_buildElements();
			_styleElements();
		}
		
		function _buildElements() {
			if (_container) {
				_display = _createElement("a", "display", _container);
				_createElement("div", "iconbackground", _display);
				_createElement("div", "icon", _display);
				_createElement("div", "logo", _display);
				if (_file) {
					_display.setAttribute("href", utils.getAbsolutePath(_file));
				}
			}
		}
		
		function _css(selector, style) {
			var elements = document.querySelectorAll(selector);
			for (var i=0; i<elements.length; i++) {
				for (var prop in style) {
					elements[i].style[prop] = style[prop];
				}
			}
		}
		
		function _styleElements() {
			var _prefix = "#" + _container.id + " .jwdownload";

			_css(_prefix+"display", {
				width: utils.styleDimension(_width),
				height: utils.styleDimension(_height),
				background: "black center no-repeat " + (_image ? 'url('+_image+')' : ""),
				backgroundSize: "contain",
				position: JW_CSS_ABSOLUTE,
				border: JW_CSS_NONE,
				display: JW_CSS_BLOCK
			});

			_css(_prefix+"display div", {
				position: JW_CSS_ABSOLUTE,
				width: JW_CSS_100PCT,
				height: JW_CSS_100PCT
			});

			_css(_prefix+"logo", {
				bottom: _logo.margin + "px",
				left: _logo.margin + "px",
				background: "bottom left no-repeat url(" + _logo.prefix + _logo.file + ")"
			});
			
			_css(_prefix+"icon", {
				background: "center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAALdJREFUeNrs18ENgjAYhmFouDOCcQJGcARHgE10BDcgTOIosAGwQOuPwaQeuFRi2p/3Sb6EC5L3QCxZBgAAAOCorLW1zMn65TrlkH4NcV7QNcUQt7Gn7KIhxA+qNIR81spOGkL8oFJDyLJRdosqKDDkK+iX5+d7huzwM40xptMQMkjIOeRGo+VkEVvIPfTGIpKASfYIfT9iCHkHrBEzf4gcUQ56aEzuGK/mw0rHpy4AAACAf3kJMACBxjAQNRckhwAAAABJRU5ErkJggg==)"
			});
	
			_css(_prefix+"iconbackground", {
				background: "center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEpJREFUeNrszwENADAIA7DhX8ENoBMZ5KR10EryckCJiIiIiIiIiIiIiIiIiIiIiIh8GmkRERERERERERERERERERERERGRHSPAAPlXH1phYpYaAAAAAElFTkSuQmCC)"
			});
			
		}
		
		function _createElement(tag, className, parent) {
			var _element = document.createElement(tag);
			_element.className = "jwdownload"+className;
			if (parent) {
				parent.appendChild(_element);
			}
			return _element;
		};
		
		_embed();
	};


	
})(jwplayer);
/**
 * Flash mode embedder the JW Player
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils;

	jwplayer.embed.flash = function(_container, _player, _options, _loader, _api) {
		function appendAttribute(object, name, value) {
			var param = document.createElement('param');
			param.setAttribute('name', name);
			param.setAttribute('value', value);
			object.appendChild(param);
		};
		
		function _resizePlugin(plugin, div, onready) {
			return function(evt) {
				if (onready) {
					document.getElementById(_api.id+"_wrapper").appendChild(div);
				}
				var display = document.getElementById(_api.id).getPluginConfig("display");
				plugin.resize(display.width, display.height);
				div.style.left = display.x;
				div.style.top = display.h;
			}
		}
		
		
		function parseComponents(componentBlock) {
			if (!componentBlock) {
				return {};
			}
			
			var flat = {};
			
			for (var component in componentBlock) {
				var componentConfig = componentBlock[component];
				for (var param in componentConfig) {
					flat[component + '.' + param] = componentConfig[param];
				}
			}
			
			return flat;
		};
		
		function parseConfigBlock(options, blockName) {
			if (options[blockName]) {
				var components = options[blockName];
				for (var name in components) {
					var component = components[name];
					if (typeof component == "string") {
						// i.e. controlbar="over"
						if (!options[name]) {
							options[name] = component;
						}
					} else {
						// i.e. controlbar.position="over"
						for (var option in component) {
							if (!options[name + '.' + option]) {
								options[name + '.' + option] = component[option];
							}
						}
					}
				}
				delete options[blockName];
			}
		};
		
		function parsePlugins(pluginBlock) {
			if (!pluginBlock) {
				return {};
			}
			
			var flat = {}, pluginKeys = [];
			
			for (var plugin in pluginBlock) {
				var pluginName = utils.getPluginName(plugin);
				var pluginConfig = pluginBlock[plugin];
				pluginKeys.push(plugin);
				for (var param in pluginConfig) {
					flat[pluginName + '.' + param] = pluginConfig[param];
				}
			}
			flat.plugins = pluginKeys.join(',');
			return flat;
		};
		
		function jsonToFlashvars(json) {
//			var flashvars = json.netstreambasepath ? '' : 'netstreambasepath=' + encodeURIComponent(window.location.href.split("#")[0]) + '&';
			var flashvars = '';// = encodeURIComponent(window.location.href.split("#")[0]) + '&';
			for (var key in json) {
				if (typeof(json[key]) == "object") {
					flashvars += key + '=' + encodeURIComponent("[[JSON]]"+utils.jsonToString(json[key])) + '&';
				} else {
					flashvars += key + '=' + encodeURIComponent(json[key]) + '&';
				}
			}
			return flashvars.substring(0, flashvars.length - 1);
		};
		
		this.embed = function() {		
			// Make sure we're passing the correct ID into Flash for Linux API support
			_options.id = _api.id;
			
			var _wrapper;
			
			var params = utils.extend({}, _options);
			
			// Hack for when adding / removing happens too quickly
			if (_container.id + "_wrapper" == _container.parentNode.id) {
				_wrapper = document.getElementById(_container.id + "_wrapper");
			} else {
				_wrapper = document.createElement("div");
				_wrapper.id = _container.id + "_wrapper";
				_wrapper.style.position = "relative";
				_wrapper.style.width = utils.styleDimension(params.width);
				_wrapper.style.height= utils.styleDimension(params.height);
				utils.wrap(_container, _wrapper);
			}
			
			var flashPlugins = _loader.setupPlugins(_api, params, _resizePlugin);
			
			if (flashPlugins.length > 0) {
				utils.extend(params, parsePlugins(flashPlugins.plugins));
			} else {
				delete params.plugins;
			}
			
			
			var toDelete = ["height", "width", "modes", "events", "primary", "base", "fallback"];
				
			for (var i = 0; i < toDelete.length; i++) {
				delete params[toDelete[i]];
			}
			
			var wmode = "opaque";
			if (params.wmode) {
				wmode = params.wmode;
			}
			
			parseConfigBlock(params, 'components');
			parseConfigBlock(params, 'providers');
			
			// Hack for the dock
			if (typeof params["dock.position"] != "undefined"){
				if (params["dock.position"].toString().toLowerCase() == "false") {
					params["dock"] = params["dock.position"];
					delete params["dock.position"];					
				}
			}
			
			// If we've set any cookies in HTML5 mode, bring them into flash
			var cookies = utils.getCookies();
			for (var cookie in cookies) {
				if (typeof(params[cookie])=="undefined") {
					params[cookie] = cookies[cookie];
				}
			}
			
			var bgcolor = "#000000",
				flashPlayer,
				flashvars = jsonToFlashvars(params);
			
			if (utils.isIE()) {
				var html = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ' +
				'bgcolor="' +
				bgcolor +
				'" width="100%" height="100%" ' +
				'id="' +
				_container.id +
				'" name="' +
				_container.id +
				'" tabindex=0"' +
				'">';
				html += '<param name="movie" value="' + _player.src + '">';
				html += '<param name="allowfullscreen" value="true">';
				html += '<param name="allowscriptaccess" value="always">';
				html += '<param name="seamlesstabbing" value="true">';
				html += '<param name="wmode" value="' + wmode + '">';
				html += '<param name="flashvars" value="' +
				flashvars +
				'">';
				html += '</object>';

				utils.setOuterHTML(_container, html);
								
				flashPlayer = document.getElementById(_container.id);
			} else {
				var obj = document.createElement('object');
				obj.setAttribute('type', 'application/x-shockwave-flash');
				obj.setAttribute('data', _player.src);
				obj.setAttribute('width', "100%");
				obj.setAttribute('height', "100%");
				obj.setAttribute('bgcolor', '#000000');
				obj.setAttribute('id', _container.id);
				obj.setAttribute('name', _container.id);
				obj.setAttribute('tabindex', 0);
				appendAttribute(obj, 'allowfullscreen', 'true');
				appendAttribute(obj, 'allowscriptaccess', 'always');
				appendAttribute(obj, 'seamlesstabbing', 'true');
				appendAttribute(obj, 'wmode', wmode);
				appendAttribute(obj, 'flashvars', flashvars);
				_container.parentNode.replaceChild(obj, _container);
				flashPlayer = obj;
			}
			
			_api.container = flashPlayer;
			_api.setPlayer(flashPlayer, "flash");
		}
		/**
		 * Detects whether Flash supports this configuration
		 */
		this.supportsConfig = function() {
			if (utils.hasFlash()) {
				if (_options) {
					try {
						var item = _options.playlist[0],
							sources = item.sources;
						
						if (typeof sources == "undefined") {
							return true;
						} else {
							for (var i = 0; i < sources.length; i++) {
								if (sources[i].file && _flashCanPlay(sources[i].file, item.type)) {
									return true;
								}
							}
						}
					} catch (e) {
						return false;
					}
				} else {
					return true;
				}
			}
			return false;
		}
		
		/**
		 * Determines if a Flash can play a particular file, based on its extension
		 */
		function _flashCanPlay(file, type) {
			var types = ["mp4", "flv", "aac", "mp3", "hls", "rtmp", "youtube"];
			// Type is set, and is not one of the above types; assume a loaded provider and play in flash
			if (type && (types.toString().indexOf(type) < 0) ) {
				return true;
			}
			
			var extension = utils.extension(file);
			
			if (!type) type = extension;
			
			// If there is no extension, use Flash
			if (!extension) {
				return true;
			}
			
			// Extension is in the extension map
			if (utils.exists(utils.extensionmap[extension])) {
				// Return true if the extension has a flash mapping
				return utils.exists(utils.extensionmap[extension].flash);
			}
			return false;
		}
	}
	
})(jwplayer);
/**
 * HTML5 mode embedder for the JW Player
 * @author Zach
 * @version 5.8
 */
(function(jwplayer) {
	var utils = jwplayer.utils, extensionmap = utils.extensionmap;

	jwplayer.embed.html5 = function(_container, _player, _options, _loader, _api) {
		function _resizePlugin (plugin, div, onready) {
			return function(evt) {
				var displayarea = document.getElementById(_container.id + "_displayarea");
				if (onready) {
					displayarea.appendChild(div);
				}
				plugin.resize(displayarea.clientWidth, displayarea.clientHeight);
				div.left = displayarea.style.left;
				div.top = displayarea.style.top;
			}
		}
		
		this.embed = function() {
			if (jwplayer.html5) {
				_loader.setupPlugins(_api, _options, _resizePlugin);
				_container.innerHTML = "";
				var playerOptions = jwplayer.utils.extend({}, _options);
//				var toDelete = ["plugins", "modes", "events"];
//				
//				for (var i = 0; i < toDelete.length; i++){
//					delete playerOptions[toDelete[i]];
//				}

				// Use XML skins instead of ZIP in HTML5 mode
				if (playerOptions.skin && playerOptions.skin.toLowerCase().indexOf(".zip") > 0) {
					playerOptions.skin = playerOptions.skin.replace(/\.zip/i, ".xml");
				}
				
				var html5player = new jwplayer.html5.player(playerOptions);
				_api.container = document.getElementById(_api.id);
				_api.setPlayer(html5player, "html5");
			} else {
				var scriptLoader = new utils.scriptloader(_player.src);
				scriptLoader.addEventListener(jwplayer.events.COMPLETE, this.embed);
				scriptLoader.load();
			}
		}
		
		/**
		 * Detects whether the html5 player supports this configuration.
		 *
		 * @return {Boolean}
		 */
		this.supportsConfig = function() {
			if (!!jwplayer.vid.canPlayType) {
				try {
					if (utils.typeOf(_options.playlist) == "string") {
						return true;
					} else {
						var sources = _options.playlist[0].sources;
						for (var i=0; i<sources.length; i++) {
							var file = sources[i].file,
								type = sources[i].type;
							
							if (_html5CanPlay(file, type)) {
								return true;
							}
						}
					}
				} catch(e) {
					return false;
				}
//				if (_options) {
//					var item = jwplayer.utils.getFirstPlaylistItemFromConfig(_options);
//					if (typeof item.file == "undefined" && typeof item.levels == "undefined") {
//						return true;
//					} else if (item.file) {
//						return html5CanPlay(jwplayer.vid, item.file, item.provider, item.playlistfile);
//					} else if (item.levels && item.levels.length) {
//						for (var i = 0; i < item.levels.length; i++) {
//							if (item.levels[i].file && html5CanPlay(jwplayer.vid, item.levels[i].file, item.provider, item.playlistfile)) {
//								return true;
//							}
//						}
//					}
//				} else {
//					return true;
//				}
			}
			
			return false;
		}
		
		/**
		 * Determines if a video element can play a particular file, based on its extension
		 * @param {Object} file
		 * @param {Object} type
		 * @return {Boolean}
		 */
		function _html5CanPlay(file, type) {
			// HTML5 playback is not sufficiently supported on Blackberry devices; should fail over automatically.
			if(navigator.userAgent.match(/BlackBerry/i) !== null) { return false; }
			
			var extension = utils.extension(file);
			
			type = type ? type : extension;
			
			// If no type or unrecognized type, don't allow to play
			if ((!type) || !extensionmap[type]) {
				return false;
			}
			
						
			// Last, but not least, we ask the browser 
			// (But only if it's a video with an extension known to work in HTML5)
			return _browserCanPlay(extensionmap[type].html5);
		};
		
		/**
		 * 
		 * @param {DOMMediaElement} video
		 * @param {String} mimetype
		 * @return {Boolean}
		 */
		function _browserCanPlay(mimetype) {
			var video = jwplayer.vid;

			// OK to use HTML5 with no extension
			if (!mimetype) {
				return true;
			}
			
			if (video.canPlayType(mimetype)) {
				return true;
			} else if (mimetype == "audio/mp3" && navigator.userAgent.match(/safari/i)) {
				// Work around Mac Safari bug
				return video.canPlayType("audio/mpeg");
			} else {
				return false;
			}
			
		}
	};
	
})(jwplayer);
/**
 * API for the JW Player
 * 
 * @author Pablo
 * @version 5.8
 */
(function(jwplayer) {
	var _players = [], 
		utils = jwplayer.utils, 
		events = jwplayer.events,
		states = events.state;
	
	var api = jwplayer.api = function(container) {
		var _this = this,
			_listeners = {},
			_stateListeners = {},
			_componentListeners = {},
			_readyListeners = [],
			_player = undefined,
			_playerReady = false,
			_queuedCalls = [],
			_instream = undefined,
			_itemMeta = {},
			_callbacks = {};
		
		_this.container = container;
		_this.id = container.id;
		
		// Player Getters
		_this.getBuffer = function() {
			return _callInternal('jwGetBuffer');
		};
		_this.getContainer = function() {
			return _this.container;
		};
		
		function _setButton(ref, plugin) {
			return function(id, handler, outGraphic, overGraphic) {
				if (ref.renderingMode == "flash" || ref.renderingMode == "html5") {
					var handlerString;
					if (handler) {
						_callbacks[id] = handler;
						handlerString = "jwplayer('" + ref.id + "').callback('" + id + "')";
					} else if (!handler && _callbacks[id]) {
						delete _callbacks[id];
					}
					_player.jwDockSetButton(id, handlerString, outGraphic, overGraphic);
				}
				return plugin;
			};
		}
		
		_this.getPlugin = function(pluginName) {
			var _plugin = {};
			if (pluginName == "dock") {
				return utils.extend(_plugin, {
					setButton: _setButton(_this, _plugin),
					show: function() { _callInternal('jwDockShow'); return _plugin; },
					hide: function() { _callInternal('jwDockHide'); return _plugin; },
					onShow: function(callback) { 
						_componentListener("dock", events.JWPLAYER_COMPONENT_SHOW, callback); 
						return _plugin; 
					},
					onHide: function(callback) { 
						_componentListener("dock", events.JWPLAYER_COMPONENT_HIDE, callback); 
						return _plugin; 
					}
				});
			} else if (pluginName == "controlbar") {
				return utils.extend(_plugin, {
					show: function() { __callInternal('jwControlbarShow'); return _plugin; },
					hide: function() { __callInternal('jwControlbarHide'); return _plugin; },
					onShow: function(callback) { 
						_componentListener("controlbar", events.JWPLAYER_COMPONENT_SHOW, callback); 
						return _plugin; 
					},
					onHide: function(callback) { 
						_componentListener("controlbar", events.JWPLAYER_COMPONENT_HIDE, callback); 
						return _plugin; 
					}
				});
			} else if (pluginName == "display") {
				return utils.extend(_plugin, {
					show: function() { __callInternal('jwDisplayShow'); return _plugin; },
					hide: function() { __callInternal('jwDisplayHide'); return _plugin; },
					onShow: function(callback) { 
						_componentListener("display", events.JWPLAYER_COMPONENT_SHOW, callback); 
						return _plugin; 
					},
					onHide: function(callback) { 
						_componentListener("display", events.JWPLAYER_COMPONENT_HIDE, callback); 
						return _plugin; 
					}
				});
			} else {
				return _this.plugins[pluginName];
			}
		};
		
		_this.callback = function(id) {
			if (_callbacks[id]) {
				return _callbacks[id]();
			}
		};
		_this.getDuration = function() {
			return _callInternal('jwGetDuration');
		};
		_this.getFullscreen = function() {
			return _callInternal('jwGetFullscreen');
		};
		_this.getStretching = function() {
			return _callInternal('jwGetStretching');
		};
		_this.getHeight = function() {
			return _callInternal('jwGetHeight');
		};
		_this.getLockState = function() {
			return _callInternal('jwGetLockState');
		};
		_this.getMeta = function() {
			return _this.getItemMeta();
		};
		_this.getMute = function() {
			return _callInternal('jwGetMute');
		};
		_this.getPlaylist = function() {
			var playlist = _callInternal('jwGetPlaylist');
			if (_this.renderingMode == "flash") {
				utils.deepReplaceKeyName(playlist, ["__dot__","__spc__","__dsh__"], ["."," ","-"]);	
			}
			for (var i = 0; i < playlist.length; i++) {
				if (!utils.exists(playlist[i].index)) {
					playlist[i].index = i;
				}
			}
			return playlist;
		};
		_this.getPlaylistItem = function(item) {
			if (!utils.exists(item)) {
				item = _this.getCurrentItem();
			}
			return _this.getPlaylist()[item];
		};
		_this.getPosition = function() {
			return _callInternal('jwGetPosition');
		};
		_this.getRenderingMode = function() {
			return _this.renderingMode;
		};
		_this.getState = function() {
			return _callInternal('jwGetState');
		};
		_this.getVolume = function() {
			return _callInternal('jwGetVolume');
		};
		_this.getWidth = function() {
			return _callInternal('jwGetWidth');
		};
		// Player Public Methods
		_this.setFullscreen = function(fullscreen) {
			if (!utils.exists(fullscreen)) {
				_callInternal("jwSetFullscreen", !_callInternal('jwGetFullscreen'));
			} else {
				_callInternal("jwSetFullscreen", fullscreen);
			}
			return _this;
		};
		_this.setStretching = function(stretching) {
			_callInternal("jwSetStretching", stretching);
			return _this;
		};
		_this.setMute = function(mute) {
			if (!utils.exists(mute)) {
				_callInternal("jwSetMute", !_callInternal('jwGetMute'));
			} else {
				_callInternal("jwSetMute", mute);
			}
			return _this;
		};
		_this.lock = function() {
			return _this;
		};
		_this.unlock = function() {
			return _this;
		};
		_this.load = function(toLoad) {
			_callInternal("jwLoad", toLoad);
			return _this;
		};
		_this.playlistItem = function(item) {
			_callInternal("jwPlaylistItem", item);
			return _this;
		};
		_this.playlistPrev = function() {
			_callInternal("jwPlaylistPrev");
			return _this;
		};
		_this.playlistNext = function() {
			_callInternal("jwPlaylistNext");
			return _this;
		};
		_this.resize = function(width, height) {
			if (_this.renderingMode == "html5") {
				_player.jwResize(width, height);
			} else {
				var wrapper = document.getElementById(_this.id + "_wrapper");
				if (wrapper) {
					wrapper.style.width = utils.styleDimension(width);
					wrapper.style.height = utils.styleDimension(height);
				}
			}
			return _this;
		};
		_this.play = function(state) {
			if (typeof state == "undefined") {
				state = _this.getState();
				if (state == states.PLAYING || state == states.BUFFERING) {
					_callInternal("jwPause");
				} else {
					_callInternal("jwPlay");
				}
			} else {
				_callInternal("jwPlay", state);
			}
			return _this;
		};
		_this.pause = function(state) {
			if (typeof state == "undefined") {
				state = _this.getState();
				if (state == states.PLAYING || state == states.BUFFERING) {
					_callInternal("jwPause");
				} else {
					_callInternal("jwPlay");
				}
			} else {
				_callInternal("jwPause", state);
			}
			return _this;
		};
		_this.stop = function() {
			_callInternal("jwStop");
			return _this;
		};
		_this.seek = function(position) {
			_callInternal("jwSeek", position);
			return _this;
		};
		_this.setVolume = function(volume) {
			_callInternal("jwSetVolume", volume);
			return _this;
		};
		_this.loadInstream = function(item, instreamOptions) {
			_instream = new api.instream(this, _player, item, instreamOptions);
			return _instream;
		};
		
		var _eventMapping = {
			onBufferChange: events.JWPLAYER_MEDIA_BUFFER,
			onBufferFull: events.JWPLAYER_MEDIA_BUFFER_FULL,
			onError: events.JWPLAYER_ERROR,
			onFullscreen: events.JWPLAYER_FULLSCREEN,
			onMeta: events.JWPLAYER_MEDIA_META,
			onMute: events.JWPLAYER_MEDIA_MUTE,
			onPlaylist: events.JWPLAYER_PLAYLIST_LOADED,
			onPlaylistItem: events.JWPLAYER_PLAYLIST_ITEM,
			onReady: events.API_READY,
			onResize: events.JWPLAYER_RESIZE,
			onComplete: events.JWPLAYER_MEDIA_COMPLETE,
			onSeek: events.JWPLAYER_MEDIA_SEEK,
			onTime: events.JWPLAYER_MEDIA_TIME,
			onVolume: events.JWPLAYER_MEDIA_VOLUME,
			onBeforePlay: events.JWPLAYER_MEDIA_BEFOREPLAY,
			onBeforeComplete: events.JWPLAYER_MEDIA_BEFORECOMPLETE,
			onDisplayClick: events.JWPLAYER_DISPLAY_CLICK
		};
		
		for (var event in _eventMapping) {
			_this[event] = _eventCallback(_eventMapping[event], _eventListener); 
		}

		var _stateMapping = {
			onBuffer: states.BUFFERING,
			onPause: states.PAUSED,
			onPlay: states.PLAYING,
			onIdle: states.IDLE 
		};

		for (var state in _stateMapping) {
			_this[state] = _eventCallback(_stateMapping[state], _stateListener); 
		}
		
		function _eventCallback(event, listener) {
			return function(callback) {
				return listener(event, callback);
			};
		}

		_this.remove = function() {
			if (!_playerReady) {
				throw "Cannot call remove() before player is ready";
				return;
			}
			_remove(this);
		};
		
		function _remove(player) {
			_queuedCalls = [];
			api.destroyPlayer(player.id);
		}
		
		_this.setup = function(options) {
			if (jwplayer.embed) {
				// Destroy original API on setup() to remove existing listeners
				_remove(this);
				var newApi = jwplayer(_this.id);
				newApi.config = options;
				return new jwplayer.embed(newApi);
			}
			return _this;
		};
		_this.registerPlugin = function(id, arg1, arg2) {
			jwplayer.plugins.registerPlugin(id, arg1, arg2);
		};
		
		/** Use this function to set the internal low-level player.  This is a javascript object which contains the low-level API calls. **/
		_this.setPlayer = function(player, renderingMode) {
			_player = player;
			_this.renderingMode = renderingMode;
		};
		
		_this.detachMedia = function() {
			if (_this.renderingMode == "html5") {
				return _callInternal("jwDetachMedia");
			}
		}

		_this.attachMedia = function() {
			if (_this.renderingMode == "html5") {
				return _callInternal("jwAttachMedia");
			}
		}

		function _stateListener(state, callback) {
			if (!_stateListeners[state]) {
				_stateListeners[state] = [];
				_eventListener(events.JWPLAYER_PLAYER_STATE, _stateCallback(state));
			}
			_stateListeners[state].push(callback);
			return _this;
		};

		function _stateCallback(state) {
			return function(args) {
				var newstate = args.newstate, oldstate = args.oldstate;
				if (newstate == state) {
					var callbacks = _stateListeners[newstate];
					if (callbacks) {
						for (var c = 0; c < callbacks.length; c++) {
							if (typeof callbacks[c] == 'function') {
								callbacks[c].call(this, {
									oldstate: oldstate,
									newstate: newstate
								});
							}
						}
					}
				}
			};
		}
		
		function _componentListener(component, type, callback) {
			if (!_componentListeners[component]) {
				_componentListeners[component] = {};
			}
			if (!_componentListeners[component][type]) {
				_componentListeners[component][type] = [];
				_eventListener(type, _componentCallback(component, type));
			}
			_componentListeners[component][type].push(callback);
			return _this;
		};
		
		function _componentCallback(component, type) {
			return function(event) {
				if (component == event.component) {
					var callbacks = _componentListeners[component][type];
					if (callbacks) {
						for (var c = 0; c < callbacks.length; c++) {
							if (typeof callbacks[c] == 'function') {
								callbacks[c].call(this, event);
							}
						}
					}
				}
			};
		}		
		
		function _addInternalListener(player, type) {
			try {
				player.jwAddEventListener(type, 'function(dat) { jwplayer("' + _this.id + '").dispatchEvent("' + type + '", dat); }');
			} catch(e) {
				utils.log("Could not add internal listener");
			}
		};
		
		function _eventListener(type, callback) {
			if (!_listeners[type]) {
				_listeners[type] = [];
				if (_player && _playerReady) {
					_addInternalListener(_player, type);
				}
			}
			_listeners[type].push(callback);
			return _this;
		};
		
		_this.dispatchEvent = function(type) {
			if (_listeners[type]) {
				var args = utils.translateEventResponse(type, arguments[1]);
				for (var l = 0; l < _listeners[type].length; l++) {
					if (typeof _listeners[type][l] == 'function') {
						_listeners[type][l].call(this, args);
					}
				}
			}
		};

		_this.dispatchInstreamEvent = function(type) {
			if (_instream) {
				_instream.dispatchEvent(type, arguments);
			}
		};

		function _callInternal() {
			if (_playerReady) {
				var funcName = arguments[0],
				args = [];
			
				for (var argument = 1; argument < arguments.length; argument++) {
					args.push(arguments[argument]);
				}
				
				if (typeof _player != "undefined" && typeof _player[funcName] == "function") {
					if (args.length == 2) { 
						return (_player[funcName])(args[0], args[1]);
					} else if (args.length == 1) {
						return (_player[funcName])(args[0]);
					} else {
						return (_player[funcName])();
					}
				}
				return null;
			} else {
				_queuedCalls.push(arguments);
			}
		};
		
		_this.playerReady = function(obj) {
			_playerReady = true;
			
			if (!_player) {
				_this.setPlayer(document.getElementById(obj.id));
			}
			_this.container = document.getElementById(_this.id);
			
			for (var eventType in _listeners) {
				_addInternalListener(_player, eventType);
			}
			
			_eventListener(events.JWPLAYER_PLAYLIST_ITEM, function(data) {
				_itemMeta = {};
			});
			
			_eventListener(events.JWPLAYER_MEDIA_META, function(data) {
				utils.extend(_itemMeta, data.metadata);
			});
			
			_this.dispatchEvent(events.API_READY);
			
			while (_queuedCalls.length > 0) {
				_callInternal.apply(this, _queuedCalls.shift());
			}
		};
		
		_this.getItemMeta = function() {
			return _itemMeta;
		};
		
		_this.getCurrentItem = function() {
			return _callInternal('jwGetPlaylistIndex');
		};
		
		/** Using this function instead of array.slice since Arguments are not an array **/
		function slice(list, from, to) {
			var ret = [];
			if (!from) {
				from = 0;
			}
			if (!to) {
				to = list.length - 1;
			}
			for (var i = from; i <= to; i++) {
				ret.push(list[i]);
			}
			return ret;
		}
		return _this
	};
	
	api.selectPlayer = function(identifier) {
		var _container;
		
		if (!utils.exists(identifier)) {
			identifier = 0;
		}
		
		if (identifier.nodeType) {
			// Handle DOM Element
			_container = identifier;
		} else if (typeof identifier == 'string') {
			// Find container by ID
			_container = document.getElementById(identifier);
		}
		
		if (_container) {
			var foundPlayer = api.playerById(_container.id);
			if (foundPlayer) {
				return foundPlayer;
			} else {
				// Todo: register new object
				return api.addPlayer(new api(_container));
			}
		} else if (typeof identifier == "number") {
			return _players[identifier];
		}
		
		return null;
	};
	

	api.playerById = function(id) {
		for (var p = 0; p < _players.length; p++) {
			if (_players[p].id == id) {
				return _players[p];
			}
		}
		return null;
	};
	
	api.addPlayer = function(player) {
		for (var p = 0; p < _players.length; p++) {
			if (_players[p] == player) {
				return player; // Player is already in the list;
			}
		}
		
		_players.push(player);
		return player;
	};
	
	api.destroyPlayer = function(playerId) {
		var index = -1;
		for (var p = 0; p < _players.length; p++) {
			if (_players[p].id == playerId) {
				index = p;
				continue;
			}
		}
		if (index >= 0) {
			var id = _players[index].id,
				toDestroy = document.getElementById(id + "_wrapper");
			
			if (!toDestroy) {
				toDestroy = document.getElementById(id);	
			}
			
			if (toDestroy) {
				var replacement = document.createElement('div');
				replacement.id = id;
				toDestroy.parentNode.replaceChild(replacement, toDestroy);
			}
			_players.splice(index, 1);
		}
		
		return null;
	};
	
})(jwplayer);

var _userPlayerReady = (typeof playerReady == 'function') ? playerReady : undefined;

playerReady = function(obj) {
	var api = jwplayer.api.playerById(obj.id);

	if (api) {
		api.playerReady(obj);
	} else {
		jwplayer.api.selectPlayer(obj.id).playerReady(obj);
	}
	
	if (_userPlayerReady) {
		_userPlayerReady.call(this, obj);
	}
};
/**
 * InStream API 
 * 
 * @author Pablo
 * @version 5.9
 */
(function(jwplayer) {
	var events = jwplayer.events,
		states = events.state;
	
	jwplayer.api.instream = function(api, player, item, options) {
		
		var _api = api,
			_player = player,
			_item = item,
			_options = options,
			_listeners = {},
			_stateListeners = {};
		
		function _init() {
		   	_api.callInternal("jwLoadInstream", item, options);
		}
		
		function _addInternalListener(player, type) {
			_player.jwInstreamAddEventListener(type, 'function(dat) { jwplayer("' + _api.id + '").dispatchInstreamEvent("' + type + '", dat); }');
		};

		function _eventListener(type, callback) {
			if (!_listeners[type]) {
				_listeners[type] = [];
				_addInternalListener(_player, type);
			}
			_listeners[type].push(callback);
			return this;
		};

		function _stateListener(state, callback) {
			if (!_stateListeners[state]) {
				_stateListeners[state] = [];
				_eventListener(events.JWPLAYER_PLAYER_STATE, _stateCallback(state));
			}
			_stateListeners[state].push(callback);
			return this;
		};

		function _stateCallback(state) {
			return function(args) {
				var newstate = args.newstate, oldstate = args.oldstate;
				if (newstate == state) {
					var callbacks = _stateListeners[newstate];
					if (callbacks) {
						for (var c = 0; c < callbacks.length; c++) {
							if (typeof callbacks[c] == 'function') {
								callbacks[c].call(this, {
									oldstate: oldstate,
									newstate: newstate,
									type: args.type
								});
							}
						}
					}
				}
			};
		}		
		this.dispatchEvent = function(type, calledArguments) {
			if (_listeners[type]) {
				var args = _utils.translateEventResponse(type, calledArguments[1]);
				for (var l = 0; l < _listeners[type].length; l++) {
					if (typeof _listeners[type][l] == 'function') {
						_listeners[type][l].call(this, args);
					}
				}
			}
		}
		
		
		this.onError = function(callback) {
			return _eventListener(events.JWPLAYER_ERROR, callback);
		};
		this.onFullscreen = function(callback) {
			return _eventListener(events.JWPLAYER_FULLSCREEN, callback);
		};
		this.onMeta = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_META, callback);
		};
		this.onMute = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_MUTE, callback);
		};
		this.onComplete = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_COMPLETE, callback);
		};
		this.onSeek = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_SEEK, callback);
		};
		this.onTime = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_TIME, callback);
		};
		this.onVolume = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_VOLUME, callback);
		};
		// State events
		this.onBuffer = function(callback) {
			return _stateListener(states.BUFFERING, callback);
		};
		this.onPause = function(callback) {
			return _stateListener(states.PAUSED, callback);
		};
		this.onPlay = function(callback) {
			return _stateListener(states.PLAYING, callback);
		};
		this.onIdle = function(callback) {
			return _stateListener(states.IDLE, callback);
		};
		// Instream events
		this.onInstreamClick = function(callback) {
			return _eventListener(events.JWPLAYER_INSTREAM_CLICK, callback);
		};
		this.onInstreamDestroyed = function(callback) {
			return _eventListener(events.JWPLAYER_INSTREAM_DESTROYED, callback);
		};
		
		this.play = function(state) {
			_player.jwInstreamPlay(state);
		};
		this.pause= function(state) {
			_player.jwInstreamPause(state);
		};
		this.seek = function(pos) {
			_player.jwInstreamSeek(pos);
		};
		this.destroy = function() {
			_player.jwInstreamDestroy();
		};
		this.getState = function() {
			return _player.jwInstreamGetState();
		}
		this.getDuration = function() {
			return _player.jwInstreamGetDuration();
		}
		this.getPosition = function() {
			return _player.jwInstreamGetPosition();
		}

		_init();
		
		
	}
	
})(jwplayer);

/**
 * JW Player Source Endcap
 * 
 * This will appear at the end of the JW Player source
 * 
 * @version 6.0
 */

 }