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

jwplayer.version = '6.0.2790';

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
	var DOCUMENT = document, WINDOW = window, NAVIGATOR = navigator, 
		UNDEFINED = "undefined", STRING = "string", OBJECT = "object";
	
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
		case STRING:
			return (item.length > 0);
			break;
		case OBJECT:
			return (item !== null);
		case UNDEFINED:
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
					try {
						if (utils.exists(args[i][element])) {
							args[0][element] = args[i][element];
						}
					} catch(e) {}
				}
			}
			return args[0];
		}
		return null;
	};

	/** Logger * */
	utils.log = function(msg, obj) {
		if (typeof console != UNDEFINED && typeof console.log != UNDEFINED) {
			if (obj) {
				console.log(msg, obj);
			} else {
				console.log(msg);
			}
		}
	};

	var _userAgentMatch = utils.userAgentMatch = function(regex) {
		var agent = NAVIGATOR.userAgent.toLowerCase();
		return (agent.match(regex) !== null);
	};
	
	function _browserCheck(regex) {
		return function() {
			return _userAgentMatch(regex);
		}
	}


	utils.isIE = _browserCheck(/msie/i);
	utils.isFF = _browserCheck(/firefox/i);
	utils.isIOS = _browserCheck(/iP(hone|ad|od)/i);
	utils.isIPod = _browserCheck(/iP(hone|od)/i);
	utils.isIPad = _browserCheck(/iPad/i);
	
	/** Matches Android devices **/	
	utils.isAndroid = function(version) {
		if (version) {
			return _userAgentMatch(new RegExp("android.*"+version, "i"));
		} else {
			return _userAgentMatch(/android/i);
		}
	}

	/** Matches iOS and Android devices **/	
	utils.isMobile = function() {
		return utils.isIOS() || utils.isAndroid();
	}


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
		} else if (typeof translated.data == OBJECT) {
			// Takes ViewEvent "data" block and moves it up a level
			translated = utils.extend(translated, translated.data);
			delete translated.data;
		} else if (typeof translated.metadata == OBJECT) {
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
	 * If the browser has flash capabilities, return the flash version 
	 */
	utils.flashVersion = function() {
		if (utils.isAndroid()) return 0;
		
		var plugins = NAVIGATOR.plugins, flash;
		if (plugins != UNDEFINED) {
			flash = plugins['Shockwave Flash'];
			if (flash) {
				return parseInt(flash.description.replace(/\D+(\d+)\..*/, "$1"));
			}
		}
		if (typeof WINDOW.ActiveXObject != UNDEFINED) {
			try {
				flash = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
				if (flash) {
					return parseInt(flash.GetVariable("$version").split(" ")[1].split(",")[0]);
				}
			} catch (err) {
			}
		}
		return 0;
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
	utils.deepReplaceKeyName = function(obj, searchString, replaceString) {
		switch (jwplayer.utils.typeOf(obj)) {
		case "array":
			for ( var i = 0; i < obj.length; i++) {
				obj[i] = jwplayer.utils.deepReplaceKeyName(obj[i],
						searchString, replaceString);
			}
			break;
		case OBJECT:
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
	};
	
	
	/**
	 * Types of plugin paths
	 */
	var _pluginPathType = utils.pluginPathType = {
		ABSOLUTE : 0,
		RELATIVE : 1,
		CDN : 2
	}

	/*
	 * Test cases getPathType('hd') getPathType('hd-1') getPathType('hd-1.4')
	 * 
	 * getPathType('http://plugins.longtailvideo.com/5/hd/hd.swf')
	 * getPathType('http://plugins.longtailvideo.com/5/hd/hd-1.swf')
	 * getPathType('http://plugins.longtailvideo.com/5/hd/hd-1.4.swf')
	 * 
	 * getPathType('./hd.swf') getPathType('./hd-1.swf')
	 * getPathType('./hd-1.4.swf')
	 */
	utils.getPluginPathType = function(path) {
		if (typeof path != STRING) {
			return;
		}
		path = path.split("?")[0];
		var protocol = path.indexOf("://");
		if (protocol > 0) {
			return _pluginPathType.ABSOLUTE;
		}
		var folder = path.indexOf("/");
		var extension = utils.extension(path);
		if (protocol < 0 && folder < 0 && (!extension || !isNaN(extension))) {
			return _pluginPathType.CDN;
		}
		return _pluginPathType.RELATIVE;
	};

	
	/**
	 * Extracts a plugin name from a string
	 */
	utils.getPluginName = function(pluginName) {
		/** Regex locates the characters after the last slash, until it encounters a dash. **/
		return pluginName.replace(/^(.*\/)?([^-]*)-?.*\.(swf|js)$/, "$2")
	};

	/**
	 * Extracts a plugin version from a string
	 */
	utils.getPluginVersion = function(pluginName) {
		return pluginName.replace(/[^-]*-?([^\.]*).*$/, "$1");
	};

	/**
	 * Determines if a URL is a YouTube link
	 */
	utils.isYouTube = function(path) {
		return (path.indexOf("youtube.com") > -1 || path.indexOf("youtu.be") > -1);
	};

	/**
	 * Determines if a URL is an RTMP link
	 */
	utils.isRtmp = function(file,type) {
		return (file.indexOf("rtmp") == 0 || type == 'rtmp');
	};

	/**
	 * Iterates over an object and executes a callback function for each property (if it exists)
	 * This is a safe way to iterate over objects if another script has modified the object prototype
	 */
	utils.foreach = function(obj, each) {
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) each(i);
		}
	}

	/** Determines if the current page is HTTPS **/
	utils.isHTTPS = function() {
		return (WINDOW.location.href.indexOf("https") == 0);	
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
		webm = "webm",
		ogg = "ogg",
		aac = "aac",
		mp3 = "mp3",
		vorbis = "vorbis",
		
		mimeMap = {
			mp4: video+mp4,
			vorbis: audio+ogg,
			ogg: video+ogg,
			webm: video+webm,
			aac: audio+mp4,
			mp3: audio+mp3,
			hls: "application/vnd.apple.mpegurl"
		},
		
		html5Extensions = {
			"mp4": mimeMap[mp4],
			"f4v": mimeMap[mp4],
			"m4v": mimeMap[mp4],
			"mov": mimeMap[mp4],
			"m4a": mimeMap[aac],
			"f4a": mimeMap[aac],
			"aac": mimeMap[aac],
			"mp3": mimeMap[mp3],
			"ogv": mimeMap[ogg],
			"ogg": mimeMap[vorbis],
			"oga": mimeMap[vorbis],
			"webm": mimeMap[webm],
			"m3u8": mimeMap.hls
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
	
	_extensionmap.types = mimeMap; 

	_extensionmap.mimeType = function(mime) {
		for (var type in mimeMap) {
			if (mimeMap[type] == mime) return type;
		}
	}

	_extensionmap.extType = function(extension) {
		return _extensionmap.mimeType(html5Extensions[extension]);
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
			var sameLoader = utils.scriptloader.loaders[url];
			if (sameLoader && (sameLoader.getStatus() == _loaderstatus.NEW || sameLoader.getStatus() == _loaderstatus.LOADING)) {
				// If we already have a scriptloader loading the same script, don't create a new one;
				sameLoader.addEventListener(_events.ERROR, _sendError);
				sameLoader.addEventListener(_events.COMPLETE, _sendComplete);
				return;
			}
			
			utils.scriptloader.loaders[url] = this;
			
			if (_status == _loaderstatus.NEW) {
				_status = _loaderstatus.LOADING;
				var scriptTag = DOCUMENT.createElement("script");
				// Most browsers
				if (scriptTag.addEventListener) {
					scriptTag.onload = _sendComplete;
					scriptTag.onerror = _sendError;
				}
				else if (scriptTag.readyState) {
					// IE
					scriptTag.onreadystatechange = function() {
						if (scriptTag.readyState == 'loaded' || scriptTag.readyState == 'complete') {
							_sendComplete();
						}
						// Error?
					}
				}
				DOCUMENT.getElementsByTagName("head")[0].appendChild(scriptTag);
				scriptTag.src = url;
			}
			
		};
		
		function _sendError(evt) {
			_status = _loaderstatus.ERROR;
			_eventDispatcher.sendEvent(_events.ERROR);
		}
		
		function _sendComplete(evt) {
			_status = _loaderstatus.COMPLETE;
			_eventDispatcher.sendEvent(_events.COMPLETE);
		}

		
		this.getStatus = function() {
			return _status;
		}
	}
	
	utils.scriptloader.loaders = {};
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
		if (!path || path.substr(0,4) == 'rtmp') { return ""; }
		path = path.substring(path.lastIndexOf("/") + 1, path.length).split("?")[0].split("#")[0];
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
		JWPLAYER_MEDIA_LEVELS: 'jwplayerMediaLevels',
		JWPLAYER_MEDIA_LEVEL_CHANGED: 'jwplayerMediaLevelChanged',
		JWPLAYER_CAPTIONS_CHANGED: 'jwplayerCaptionsChanged',
		JWPLAYER_CAPTIONS_LIST: 'jwplayerCaptionsList',

		// State events
		JWPLAYER_PLAYER_STATE : 'jwplayerPlayerState',
		state : {
			BUFFERING : 'BUFFERING',
			IDLE : 'IDLE',
			PAUSED : 'PAUSED',
			PLAYING : 'PLAYING'
		},

		// Playlist Events
		JWPLAYER_PLAYLIST_LOADED : 'jwplayerPlaylistLoaded',
		JWPLAYER_PLAYLIST_ITEM : 'jwplayerPlaylistItem',
		JWPLAYER_PLAYLIST_COMPLETE : 'jwplayerPlaylistComplete',

		// Display CLick
		JWPLAYER_DISPLAY_CLICK : 'jwplayerViewClick',

		// Controls show/hide 
	 	JWPLAYER_CONTROLS : 'jwplayerViewControls', 

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
	var _plugins = {},	
		_pluginLoaders = {};
	
	jwplayer.plugins = function() {
	}
	
	jwplayer.plugins.loadPlugins = function(id, config) {
		_pluginLoaders[id] = new jwplayer.plugins.pluginloader(new jwplayer.plugins.model(_plugins), config);
		return _pluginLoaders[id];
	}
	
	jwplayer.plugins.registerPlugin = function(id, target, arg1, arg2) {
		var pluginId = jwplayer.utils.getPluginName(id);
		if (!_plugins[pluginId]) {
			_plugins[pluginId] = new jwplayer.plugins.plugin(id);
		}
		_plugins[pluginId].registerPlugin(id, target, arg1, arg2);
//		} else {
//			jwplayer.utils.log("A plugin ("+id+") was registered with the player that was not loaded. Please check your configuration.");
//			for (var pluginloader in _pluginLoaders){
//				_pluginLoaders[pluginloader].pluginFailed();
//			}
//		}
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
		this.getPlugins = function() {
			return plugins;
		}
	}
})(jwplayer);
/**
 * Internal plugin model
 * @author zach
 * @version 5.8
 */
(function(plugins) {
	var utils = jwplayer.utils, events = jwplayer.events, UNDEFINED = "undefined";
	
	plugins.pluginmodes = {
		FLASH: 0,
		JAVASCRIPT: 1,
		HYBRID: 2
	}
	
	plugins.plugin = function(url) {
		var _status = utils.loaderstatus.NEW,
			_flashPath,
			_js,
			_target,
			_completeTimeout;
		
		var _eventDispatcher = new events.eventdispatcher();
		utils.extend(this, _eventDispatcher);
		
		function getJSPath() {
			switch (utils.getPluginPathType(url)) {
				case utils.pluginPathType.ABSOLUTE:
					return url;
				case utils.pluginPathType.RELATIVE:
					return utils.getAbsolutePath(url, window.location.href);
//				case utils.pluginPathType.CDN:
//					_status = utils.loaderstatus.COMPLETE;
//					var pluginName = utils.getPluginName(url);
//					var pluginVersion = utils.getPluginVersion(url);
					//var repo = (window.location.href.indexOf("https://") == 0) ? _repo.replace("http://", "https://secure") : _repo;
//					return repo + "/" + jwplayer.version.split(".")[0] + "/" + pluginName + "/" 
//							+ pluginName + (pluginVersion !== "" ? ("-" + pluginVersion) : "") + ".js";
			}
		}
		
		function completeHandler(evt) {
			_completeTimeout = setTimeout(function(){
				_status = utils.loaderstatus.COMPLETE;
				_eventDispatcher.sendEvent(events.COMPLETE);		
			}, 1000);
		}
		
		function errorHandler(evt) {
			_status = utils.loaderstatus.ERROR;
			_eventDispatcher.sendEvent(events.ERROR);
		}
		
		this.load = function() {
			if (_status == utils.loaderstatus.NEW) {
				if (url.lastIndexOf(".swf") > 0) {
					_flashPath = url;
					_status = utils.loaderstatus.COMPLETE;
					_eventDispatcher.sendEvent(events.COMPLETE);
					return;
				} else if (utils.getPluginPathType(url) == utils.pluginPathType.CDN) {
					_status = utils.loaderstatus.COMPLETE;
					_eventDispatcher.sendEvent(events.COMPLETE);
					return;
				}
				_status = utils.loaderstatus.LOADING;
				var _loader = new utils.scriptloader(getJSPath());
				// Complete doesn't matter - we're waiting for registerPlugin 
				_loader.addEventListener(events.COMPLETE, completeHandler);
				_loader.addEventListener(events.ERROR, errorHandler);
				_loader.load();
			}
		}
		
		this.registerPlugin = function(id, target, arg1, arg2) {
			if (_completeTimeout){
				clearTimeout(_completeTimeout);
				_completeTimeout = undefined;
			}
			_target = target;
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
			_status = utils.loaderstatus.COMPLETE;
			_eventDispatcher.sendEvent(events.COMPLETE);
		}
		
		this.getStatus = function() {
			return _status;
		}
		
		this.getPluginName = function() {
			return utils.getPluginName(url);
		}
		
		this.getFlashPath = function() {
			if (_flashPath) {
				switch (utils.getPluginPathType(_flashPath)) {
					case utils.pluginPathType.ABSOLUTE:
						return _flashPath;
					case utils.pluginPathType.RELATIVE:
						if (url.lastIndexOf(".swf") > 0) {
							return utils.getAbsolutePath(_flashPath, window.location.href);
						}
						return utils.getAbsolutePath(_flashPath, getJSPath());
//					case utils.pluginPathType.CDN:
//						if (_flashPath.indexOf("-") > -1){
//							return _flashPath+"h";
//						}
//						return _flashPath+"-h";
				}
			}
			return null;
		}
		
		this.getJS = function() {
			return _js;
		}
		
		this.getTarget = function() {
			return _target;
		}

		this.getPluginmode = function() {
			if (typeof _flashPath != UNDEFINED
			 && typeof _js != UNDEFINED) {
			 	return plugins.pluginmodes.HYBRID;
			 } else if (typeof _flashPath != UNDEFINED) {
			 	return plugins.pluginmodes.FLASH;
			 } else if (typeof _js != UNDEFINED) {
			 	return plugins.pluginmodes.JAVASCRIPT;
			 }
		}
		
		this.getNewInstance = function(api, config, div) {
			return new _js(api, config, div);
		}
		
		this.getURL = function() {
			return url;
		}
	}
	
})(jwplayer.plugins);
/**
 * Loads plugins for a player
 * @author zach
 * @version 5.6
 */
(function(jwplayer) {
	var utils = jwplayer.utils, events = jwplayer.events;

	jwplayer.plugins.pluginloader = function(model, config) {
		var _status = utils.loaderstatus.NEW,
			_loading = false,
			_iscomplete = false,
			_errorState = false,
			_errorMessage,
			_config = config,
			_eventDispatcher = new events.eventdispatcher();
		
		
		utils.extend(this, _eventDispatcher);
		
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
			if (_errorState) {
				_eventDispatcher.sendEvent(events.ERROR, {message: _errorMessage});
			} else if (!_iscomplete) {
				_iscomplete = true;
				_status = utils.loaderstatus.COMPLETE;
				_eventDispatcher.sendEvent(events.COMPLETE);
			}
		}
		
		// This is not entirely efficient, but it's simple
		function _checkComplete() {
			if (!_config) _complete();
			if (!_iscomplete && !_errorState) {
				var incomplete = 0, plugins = model.getPlugins();
				
				for (var plugin in _config) {
					var pluginName = utils.getPluginName(plugin),
						pluginObj = plugins[pluginName],
						js = pluginObj.getJS(),
						target = pluginObj.getTarget(),
						status = pluginObj.getStatus(); 
					if (status == utils.loaderstatus.LOADING || status == utils.loaderstatus.NEW) {
						incomplete++;
					} else if (js && (!target || parseFloat(target) > parseFloat(jwplayer.version))) {
						_errorState = true;
						_errorMessage = "Incompatible player version";
						_complete();
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
			},
			jsplugins = {
				length: 0,
				plugins: {}
			},

			plugins = model.getPlugins();
			
			for (var plugin in config.plugins) {
				var pluginName = utils.getPluginName(plugin),
					pluginObj = plugins[pluginName],
					flashPath = pluginObj.getFlashPath(),
					jsPlugin = pluginObj.getJS(),
					pluginURL = pluginObj.getURL();
				

				if (flashPath) {
					flashPlugins.plugins[flashPath] = utils.extend({}, config.plugins[plugin]);
					flashPlugins.plugins[flashPath].pluginmode = pluginObj.getPluginmode();
					flashPlugins.length++;
				}

				if (jsPlugin && config.plugins && config.plugins[pluginURL]) {
					var div = document.createElement("div");
					div.id = api.id + "_" + pluginName;
					div.style.position = "absolute";
					div.style.top = 0;
					div.style.zIndex = jsplugins.length + 10;
					jsplugins.plugins[pluginName] = pluginObj.getNewInstance(api, utils.extend({}, config.plugins[pluginURL]), div);
					jsplugins.length++;
					api.onReady(resizer(jsplugins.plugins[pluginName], div, true));
					api.onResize(resizer(jsplugins.plugins[pluginName], div));
				}
			}
			
			api.plugins = jsplugins.plugins;
			
			return flashPlugins;
		};
		
		this.load = function() {
			// Must be a hash map
			if (utils.exists(config) && utils.typeOf(config) != "object") {
				_checkComplete();
				return;
			}
			
			_status = utils.loaderstatus.LOADING;
			_loading = true;
			
			/** First pass to create the plugins and add listeners **/
			for (var plugin in config) {
				if (utils.exists(plugin)) {
					var pluginObj = model.addPlugin(plugin);
					pluginObj.addEventListener(events.COMPLETE, _checkComplete);
					pluginObj.addEventListener(events.ERROR, _pluginError);
				}
			}
			
			var plugins = model.getPlugins();
			
			/** Second pass to actually load the plugins **/
			for (plugin in plugins) {
				// Plugin object ensures that it's only loaded once
				plugins[plugin].load();
			}
			
			_loading = false;
			
			// Make sure we're not hanging around waiting for plugins that already finished loading
			_checkComplete();
		}
		
		var _pluginError = this.pluginFailed = function(evt) {
			if (!_errorState) {
				_errorState = true;
				_errorMessage = "File not found";
				_complete();
			}
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
	var _item = playlist.item = function(config) {
		var _playlistitem = jwplayer.utils.extend({}, _item.defaults, config);
		
/*
		if (_playlistitem.type) {
			_playlistitem.provider = _playlistitem.type;
			delete _playlistitem.type;
		}
*/		
		if (_playlistitem.sources.length == 0) {
			_playlistitem.sources = [new playlist.source(_playlistitem)];
		}
		
		/** Each source should be a named object **/
		for (var i=0; i < _playlistitem.sources.length; i++) {
			_playlistitem.sources[i] = new playlist.source(_playlistitem.sources[i]);
		}
/*		
 * 
		if (!_playlistitem.provider) {
			_playlistitem.provider = _getProvider(_playlistitem.levels[0]);
		} else {
			_playlistitem.provider = _playlistitem.provider.toLowerCase();
		}
*/

		return _playlistitem;
	};
	
	_item.defaults = {
		description: "",
		image: "",
		mediaid: "",
		title: "",
		tags: "",
		duration: -1,
		sources: []
	};
	
})(jwplayer.playlist);/**
 * JW Player playlist item source
 *
 * @author pablo
 * @version 6.0
 */
(function(playlist) {
	var UNDEF = undefined,
		utils = jwplayer.utils,
		defaults = {
			file: UNDEF,
			label: UNDEF,
			bitrate: UNDEF,
			width: UNDEF,
			height: UNDEF,
			type: UNDEF
		};
	
	playlist.source = function(config) {
		var _source = utils.extend({}, defaults);
		
		for (var property in defaults) {
			if (utils.exists(config[property])) {
				_source[property] = config[property];
				// Actively move from config to source
				delete config[property];
			}
		}
		if (_source.type && _source.type.indexOf("/") > 0) {
			_source.type = utils.extensionmap.mimeType(_source.type);
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
	var utils = jwplayer.utils,
		events = jwplayer.events,
		
		DOCUMENT = document;
	
	var embed = jwplayer.embed = function(playerApi) {
//		var mediaConfig = utils.mediaparser.parseMedia(playerApi.container);
		var _config = new embed.config(playerApi.config),
			_container, _oldContainer,
			_width = _config.width,
			_height = _config.height,
			_errorText = "Error loading player: ",
			_pluginloader = jwplayer.plugins.loadPlugins(playerApi.id, _config.plugins);

		_config.id = playerApi.id;
		_oldContainer = DOCUMENT.getElementById(playerApi.id);
		_container = DOCUMENT.createElement("div");
		_container.id = _oldContainer.id;
		_container.style.width = _width.toString().indexOf("%") > 0 ? _width : (_width + "px");
		_container.style.height = _height.toString().indexOf("%") > 0 ? _height : (_height + "px");
		_oldContainer.parentNode.replaceChild(_container, _oldContainer);
		
		function _setupEvents(api, events) {
			for (var evt in events) {
				if (typeof api[evt] == "function") {
					(api[evt]).call(api, events[evt]);
				}
			}
		}
		
		function _embedPlayer() {
			if (utils.typeOf(_config.playlist) == "array" && _config.playlist.length < 2) {
				if (_config.playlist.length == 0 || !_config.playlist[0].sources || _config.playlist[0].sources.length == 0) {
					_sourceError();
					return;
				}
			}
			
			if (_pluginloader.getStatus() == utils.loaderstatus.COMPLETE) {
				for (var mode = 0; mode < _config.modes.length; mode++) {
					if (_config.modes[mode].type && embed[_config.modes[mode].type]) {
						var modeconfig = _config.modes[mode].config,
							configClone = utils.extend({}, modeconfig ? embed.config.addConfig(_config, modeconfig) : _config),
							embedder = new embed[_config.modes[mode].type](_container, _config.modes[mode], configClone, _pluginloader, playerApi);

						if (embedder.supportsConfig()) {
							embedder.addEventListener(events.ERROR, _embedError);
							embedder.embed();
							_setupEvents(playerApi, configClone.events);
							return playerApi;
						}
					}
				}
				
				if (_config.fallback) {
					utils.log("No suitable players found and fallback enabled");
					new embed.download(_container, _config, _sourceError);
				} else {
					utils.log("No suitable players found and fallback disabled");
					_replaceContainer();
				}
				
			}
		};
		
		function _replaceContainer() {
			_container.parentNode.replaceChild(_oldContainer, _container);
		}
		
		function _embedError(evt) {
			_errorScreen(_container, _errorText + evt.message);
		}
		
		function _pluginError(evt) {
			_errorScreen(_container, "Could not load plugins: " + evt.message);
		}
		
		function _sourceError() {
			_errorScreen(_container, _errorText  + "No playable sources found");
		}
		
		function _errorScreen(container, message) {
			if (!_config.fallback) return;
				
			var style = container.style;
			style.backgroundColor = "#000";
			style.color = "#FFF";
			style.width = utils.styleDimension(_config.width);
			style.height = utils.styleDimension(_config.height);
			style.display = "table";
			style.opacity = 1;
			
			var text = document.createElement("p"),
				textStyle = text.style;	
			textStyle.verticalAlign = "middle";
			textStyle.textAlign = "center";
			textStyle.display = "table-cell";
			textStyle.font = "15px/20px Arial, Helvetica, sans-serif";
			text.innerHTML = message.replace(":", ":<br>");

			container.innerHTML = "";
			container.appendChild(text);
		}

		// Make this publicly accessible so the HTML5 player can error out on setup using the same code
		jwplayer.embed.errorScreen = _errorScreen;
		
		_pluginloader.addEventListener(events.COMPLETE, _embedPlayer);
		_pluginloader.addEventListener(events.ERROR, _pluginError);
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
		playlistitem = jwplayer.playlist.item,
		UNDEFINED = undefined;

	var config = embed.config = function(config) {
		
		function _setSources(modes, base, players) {
			for (var i=0; i<modes.length; i++) {
				var mode = modes[i].type;
				if (!modes[i].src) {
					modes[i].src = players[mode] ? players[mode] : base + "jwplayer." + mode + (mode == "flash" ? ".swf" : ".js");
				}
			}
		}
		
		var _defaults = {
				fallback: true,
				height: 270,
				primary: "html5",
				width: 480,
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
		
		if (_config.listbar) {
			_config.playlistsize = _config.listbar.size;
			_config.playlistposition = _config.listbar.position;
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
			
			for (var itemProp in playlistitem.defaults) {
				_moveProperty(config, singleItem, itemProp);
			}

			if (!singleItem.sources) {
				if (config.levels) {
					singleItem.sources = config.levels;
					delete config.levels;
				} else {
					var singleSource = {};
					_moveProperty(config, singleSource, "file");
					_moveProperty(config, singleSource, "type");
					singleItem.sources = singleSource.file ? [singleSource] : [];
				}
			}
				
			config.playlist = [singleItem];
		} else {
			// Use JW Player playlist items to normalize sources of existing playlist items
			for (var i=0; i<config.playlist.length; i++) {
				config.playlist[i] = new playlistitem(config.playlist[i]);
			}
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

		DOCUMENT = document,
		
		JW_CSS_CURSOR = "pointer",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block",
		JW_CSS_100PCT = "100%",
		JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute";
	
	embed.download = function(_container, _options, _errorCallback) {
		var params = utils.extend({}, _options),
			_display,
			_width = params.width ? params.width : 480,
			_height = params.height ? params.height : 320,
			_file, 
			_image,
			_logo = _options.logo ? _options.logo : {
				prefix: 'http://p.jwpcdn.com/',
				file: 'logo.png',
				margin: 10
			};


		function _embed() {
			var file, image, youtube, i, playlist = params.playlist, item, sources, i,
				types = ["mp4", "aac", "mp3"]; 
			if (playlist && playlist.length) {
				item = playlist[0];
				sources = item.sources;
				// If no downloadable files, and youtube, display youtube
				// If nothing, show error message
				for (i=0; i<sources.length; i++) {
					var source = sources[i], 
						type = source.type ? source.type : utils.extensionmap.extType(utils.extension(source.file));
					if (source.file) {
						for (i in types) {
							if (type == types[i]) {
								file = source.file;
								image = item.image;
							} else if (utils.isYouTube(source.file)) {
								youtube = source.file;
							}
						}

						if (file || youtube) continue;
					}
				}
			} else {
				return;
			}
			
			if (file) {
				_file = file;
				_image = image;
				if (_logo.prefix) {
					if (utils.isHTTPS()) {
						_logo.prefix = _logo.prefix.replace('http://', 'https://ssl.');
					}
					_logo.prefix += jwplayer.version.split(/\W/).splice(0, 2).join("/");
				}
				_buildElements();
				_styleElements();
			} else if (youtube) {
				_embedYouTube(youtube);
			} else {
				_errorCallback();
			}
		}
		
		function _buildElements() {
			if (_container) {
				_display = _createElement("a", "display", _container);
				_createElement("div", "icon", _display);
				_createElement("div", "logo", _display);
				if (_file) {
					_display.setAttribute("href", utils.getAbsolutePath(_file));
				}
			}
		}
		
		function _css(selector, style) {
			var elements = DOCUMENT.querySelectorAll(selector);
			for (var i=0; i<elements.length; i++) {
				for (var prop in style) {
					elements[i].style[prop] = style[prop];
				}
			}
		}
		
		function _styleElements() {
			var _prefix = "#" + _container.id + " .jwdownload";

			_container.style.width = "";
			_container.style.height = "";
			
			_css(_prefix+"display", {
				width: utils.styleDimension(Math.max(320, _width)),
				height: utils.styleDimension(Math.max(180, _height)),
				background: "black center no-repeat " + (_image ? 'url('+_image+')' : ""),
				backgroundSize: "contain",
				position: JW_CSS_RELATIVE,
				border: JW_CSS_NONE,
				display: JW_CSS_BLOCK
			});

			_css(_prefix+"display div", {
				position: JW_CSS_ABSOLUTE,
				width: JW_CSS_100PCT,
				height: JW_CSS_100PCT
			});

			_css(_prefix+"logo", {
				top: _logo.margin + "px",
				right: _logo.margin + "px",
				background: "top right no-repeat url(" + _logo.prefix + _logo.file + ")"
			});
			
			_css(_prefix+"icon", {
				background: "center no-repeat url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAgNJREFUeNrs28lqwkAYB/CZqNVDDj2r6FN41QeIy8Fe+gj6BL275Q08u9FbT8ZdwVfotSBYEPUkxFOoks4EKiJdaDuTjMn3wWBO0V/+sySR8SNSqVRKIR8qaXHkzlqS9jCfzzWcTCYp9hF5o+59sVjsiRzcegSckFzcjT+ruN80TeSlAjCAAXzdJSGPFXRpAAMYwACGZQkSdhG4WCzehMNhqV6vG6vVSrirKVEw66YoSqDb7cqlUilE8JjHd/y1MQefVzqdDmiaJpfLZWHgXMHn8F6vJ1cqlVAkEsGuAn83J4gAd2RZymQygX6/L1erVQt+9ZPWb+CDwcCC2zXGJaewl/DhcHhK3DVj+KfKZrMWvFarcYNLomAv4aPRSFZVlTlcSPA5fDweW/BoNIqFnKV53JvncjkLns/n/cLdS+92O7RYLLgsKfv9/t8XlDn4eDyiw+HA9Jyz2eyt0+kY2+3WFC5hluej0Ha7zQQq9PPwdDq1Et1sNsx/nFBgCqWJ8oAK1aUptNVqcYWewE4nahfU0YQnk4ntUEfGMIU2m01HoLaCKbTRaDgKtaVLk9tBYaBcE/6Artdr4RZ5TB6/dC+9iIe/WgAMYADDpAUJAxjAAAYwgGFZgoS/AtNNTF7Z2bL0BYPBV3Jw5xFwwWcYxgtBP5OkE8i9G7aWGOOCruvauwADALMLMEbKf4SdAAAAAElFTkSuQmCC)"
			});
	
		}
		
		function _createElement(tag, className, parent) {
			var _element = DOCUMENT.createElement(tag);
			if (className) _element.className = "jwdownload"+className;
			if (parent) {
				parent.appendChild(_element);
			}
			return _element;
		};
		
		/** 
		 * Although this function creates a flash embed, the target is iOS, which interprets the embed code as a YouTube video, 
		 * and plays it using the browser
		 */
		function _embedYouTube(path) {
			var embed = _createElement("embed", "", _container);

			/** Left as a dense regular expression for brevity.  Matches the following YouTube URL types:
			 * http://www.youtube.com/watch?v=ylLzyHk54Z0
			 * http://www.youtube.com/watch#!v=ylLzyHk54Z0
			 * http://www.youtube.com/v/ylLzyHk54Z0
			 * http://youtu.be/ylLzyHk54Z0
			 * ylLzyHk54Z0
			 **/
			embed.src = "http://www.youtube.com/v/" + (/v[=\/](\w*)|\/(\w+)$|^(\w+)$/i).exec(path).slice(1).join('');
			embed.type = "application/x-shockwave-flash";
			embed.width = _width;
			embed.height = _height;
		}
		
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
	var utils = jwplayer.utils, 
		events = jwplayer.events,
		storedFlashvars = {};

	var _flash = jwplayer.embed.flash = function(_container, _player, _options, _loader, _api) {
		var _eventDispatcher = new jwplayer.events.eventdispatcher(),
			_flashVersion = utils.flashVersion();
		utils.extend(this, _eventDispatcher);
		
		
		function appendAttribute(object, name, value) {
			var param = document.createElement('param');
			param.setAttribute('name', name);
			param.setAttribute('value', value);
			object.appendChild(param);
		};
		
		function _resizePlugin(plugin, div, onready) {
			return function(evt) {
				try {
					if (onready) {
						document.getElementById(_api.id+"_wrapper").appendChild(div);
					}
					var display = document.getElementById(_api.id).getPluginConfig("display");
					if (typeof plugin.resize == "function") {
						plugin.resize(display.width, display.height);
					}
					div.style.left = display.x;
					div.style.top = display.h;
				} catch (e) {}
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
		
		/**function jsonToFlashvars(json) {
			var flashvars = [];
			for (var key in json) {
				if (typeof(json[key]) == "object") {
					flashvars += key + '=' + encodeURIComponent("[[JSON]]"+utils.jsonToString(json[key])) + '&';
				} else {
					flashvars += key + '=' + encodeURIComponent(json[key]) + '&';
				}
			}
			return flashvars.substring(0, flashvars.length - 1);
		}**/

		function stringify(json) {
			var flashvars = {};
			for (var key in json) {
				if (typeof(json[key]) == "object") {
					flashvars[key] = "[[JSON]]"+utils.jsonToString(json[key]);
				} else {
					flashvars[key] = json[key];
				}
			}
			return flashvars;
		}

		this.embed = function() {		
			// Make sure we're passing the correct ID into Flash for Linux API support
			_options.id = _api.id;
			
			// If Flash is installed, but the version is too low, display an error.
			if (_flashVersion < 10) {
				_eventDispatcher.sendEvent(events.ERROR, {message:"Flash version must be 10.0 or greater"});
				return false;
			}
			
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
				_container.parentNode.replaceChild(_wrapper, _container);
				_wrapper.appendChild(_container);
			}
			
			var flashPlugins = _loader.setupPlugins(_api, params, _resizePlugin);
			
			if (flashPlugins.length > 0) {
				utils.extend(params, parsePlugins(flashPlugins.plugins));
			} else {
				delete params.plugins;
			}

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
				flashPlayer, //flashvars,
				wmode = params.wmode ? params.wmode : (params.height && params.height <= 40 ? "transparent" : "opaque"),
				toDelete = ["height", "width", "modes", "events", "primary", "base", "fallback"];
			
			for (var i = 0; i < toDelete.length; i++) {
				delete params[toDelete[i]];
			}
			
			var base = window.location.pathname.split("/");
			base.splice(base.length-1, 1);
			base = base.join("/");
			params.base = base + "/";
			
			
			//flashvars = jsonToFlashvars(params);
			// TODO: add ability to pass in JSON directly instead of going to/from a string
			storedFlashvars[_container.id] = stringify(params);

			if (utils.isIE()) {
				var html = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ' +
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
				html += '<param name="bgcolor" value="' + bgcolor + '">';
				html += '</object>';

				_container.outerHTML = html;
								
				flashPlayer = document.getElementById(_container.id);
			} else {
				var obj = document.createElement('object');
				obj.setAttribute('type', 'application/x-shockwave-flash');
				obj.setAttribute('data', _player.src);
				obj.setAttribute('width', "100%");
				obj.setAttribute('height', "100%");
				obj.setAttribute('bgcolor', bgcolor);
				obj.setAttribute('id', _container.id);
				obj.setAttribute('name', _container.id);
				obj.setAttribute('tabindex', 0);
				appendAttribute(obj, 'allowfullscreen', 'true');
				appendAttribute(obj, 'allowscriptaccess', 'always');
				appendAttribute(obj, 'seamlesstabbing', 'true');
				appendAttribute(obj, 'wmode', wmode);
				
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
			if (_flashVersion) {
				if (_options) {
					try {
						var item = _options.playlist[0],
							sources = item.sources;
						
						if (typeof sources == "undefined") {
							return true;
						} else {
							for (var i = 0; i < sources.length; i++) {
								if (sources[i].file && _flashCanPlay(sources[i].file, sources[i].type)) {
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
			if (utils.isYouTube(file)) return true;
			if (utils.isRtmp(file,type)) return true;
			if (type == "hls") return true;

			var mappedType = utils.extensionmap[type ? type : utils.extension(file)];
			
			// If no type or unrecognized type, don't allow to play
			if (!mappedType) {
				return false;
			}

			return !!(mappedType.flash);
		}
	}
	
	_flash.getVars = function(id) {
		return storedFlashvars[id];		
	}
	
})(jwplayer);
/**
 * HTML5 mode embedder for the JW Player
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils, extensionmap = utils.extensionmap, events = jwplayer.events;

	jwplayer.embed.html5 = function(_container, _player, _options, _loader, _api) {
		var _this = this,
			_eventdispatcher = new events.eventdispatcher();
		
		utils.extend(_this, _eventdispatcher);
		
		
		function _resizePlugin (plugin, div, onready) {
			return function(evt) {
				try {
					var displayarea = document.querySelector("#" + _container.id + " .jwmain");
					if (onready) {
						displayarea.appendChild(div);
					}
					if (typeof plugin.resize == "function") {
						plugin.resize(displayarea.clientWidth, displayarea.clientHeight);
						setTimeout(function () {
							plugin.resize(displayarea.clientWidth, displayarea.clientHeight);
						}, 400);
					}
					div.left = displayarea.style.left;
					div.top = displayarea.style.top;
				} catch(e) {}
			}
		}
		
		_this.embed = function() {
			if (jwplayer.html5) {
				_loader.setupPlugins(_api, _options, _resizePlugin);
				_container.innerHTML = "";
				var playerOptions = jwplayer.utils.extend({}, _options);
//				var toDelete = ["plugins", "modes", "events"];
//				
//				for (var i = 0; i < toDelete.length; i++){
//					delete playerOptions[toDelete[i]];
//				}

				var html5player = new jwplayer.html5.player(playerOptions);
				_api.container = document.getElementById(_api.id);
				_api.setPlayer(html5player, "html5");
			} else {
				var scriptLoader = new utils.scriptloader(_player.src);
				scriptLoader.addEventListener(events.ERROR, _loadError);
				scriptLoader.addEventListener(events.COMPLETE, _this.embed);
				scriptLoader.load();
			}
		}
		
		function _loadError(evt) {
			_this.sendEvent(evt.type, {message: "HTML5 player not found"});
		}
		
		/**
		 * Detects whether the html5 player supports this configuration.
		 *
		 * @return {Boolean}
		 */
		_this.supportsConfig = function() {
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

			// Ensure RTMP files are not seen as videos
			if (utils.isRtmp(file,type)) return false;

			var mappedType = extensionmap[type ? type : utils.extension(file)];
			
			// If no type or unrecognized type, don't allow to play
			if (!mappedType) {
				return false;
			}
			
			// Extension is recognized as a format Flash can play, but no HTML5 support is listed  
			if (mappedType.flash && !mappedType.html5) {
				return false;
			}
			
			// Last, but not least, we ask the browser 
			// (But only if it's a video with an extension known to work in HTML5)
			return _browserCanPlay(mappedType.html5);
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

			try {
				if (video.canPlayType(mimetype)) {
					return true;
				} else {
					return false;
				}
			} catch(e) {
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
		states = events.state,
		
		DOCUMENT = document;
	
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
				
		_this.addButton = function(icon, label, handler, id) {
			try {
				_callbacks[id] = handler;
				var handlerString = "jwplayer('" + _this.id + "').callback('" + id + "')";
				//_player.jwDockAddButton(icon, label, handlerString, id);
				_callInternal("jwDockAddButton", icon, label, handlerString, id);
			} catch (e) {
				utils.log("Could not add dock button" + e.message);
			}
		};
		_this.removeButton = function(id) { _callInternal('jwDockRemoveButton', id); },

		_this.callback = function(id) {
			if (_callbacks[id]) {
				_callbacks[id]();
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
			_callInternal("jwPlaylistItem", parseInt(item));
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
				var wrapper = DOCUMENT.getElementById(_this.id + "_wrapper");
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
		_this.getQualityLevels = function() {
			return _callInternal("jwGetQualityLevels");
		};
		_this.getCurrentQuality = function() {
			return _callInternal("jwGetCurrentQuality");
		};
		_this.setCurrentQuality = function(level) {
			_callInternal("jwSetCurrentQuality", level);
		};
		_this.getCaptionsList = function() {
			return _callInternal("jwGetCaptionsList");
		};
		_this.getCurrentCaptions = function() {
			return _callInternal("jwGetCurrentCaptions");
		};
		_this.setCurrentCaptions = function(caption) {
			_callInternal("jwSetCurrentCaptions", caption);
		};
		_this.getControls = function() {
			return _callInternal("jwGetControls");
		};
		_this.getSafeRegion = function() {
			return _callInternal("jwGetSafeRegion");
		};	
		_this.setControls = function(state) {
			_callInternal("jwSetControls", state);
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
			onPlaylistComplete: events.JWPLAYER_PLAYLIST_COMPLETE,
			onReady: events.API_READY,
			onResize: events.JWPLAYER_RESIZE,
			onComplete: events.JWPLAYER_MEDIA_COMPLETE,
			onSeek: events.JWPLAYER_MEDIA_SEEK,
			onTime: events.JWPLAYER_MEDIA_TIME,
			onVolume: events.JWPLAYER_MEDIA_VOLUME,
			onBeforePlay: events.JWPLAYER_MEDIA_BEFOREPLAY,
			onBeforeComplete: events.JWPLAYER_MEDIA_BEFORECOMPLETE,
			onDisplayClick: events.JWPLAYER_DISPLAY_CLICK,
			onControls: events.JWPLAYER_CONTROLS,
			onQualityLevels: events.JWPLAYER_MEDIA_LEVELS,
			onQualityChange: events.JWPLAYER_MEDIA_LEVEL_CHANGED,
			onCaptionsList: events.JWPLAYER_CAPTIONS_LIST,
			onCaptionsChange: events.JWPLAYER_CAPTIONS_CHANGED
		};
		
		utils.foreach(_eventMapping, function(event) {
			_this[event] = _eventCallback(_eventMapping[event], _eventListener); 
		});

		var _stateMapping = {
			onBuffer: states.BUFFERING,
			onPause: states.PAUSED,
			onPlay: states.PLAYING,
			onIdle: states.IDLE 
		};

		utils.foreach(_stateMapping, function(state) {
			_this[state] = _eventCallback(_stateMapping[state], _stateListener); 
		});
		
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
				_remove(_this);
				var newApi = jwplayer(_this.id);
				newApi.config = options;
				return new jwplayer.embed(newApi);
			}
			return _this;
		};
		_this.registerPlugin = function(id, target, arg1, arg2) {
			jwplayer.plugins.registerPlugin(id, target, arg1, arg2);
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
					// Can't use apply here -- Flash's externalinterface doesn't like it.
					switch(args.length) {
						case 4:  return (_player[funcName])(args[0], args[1], args[2], args[3]);
						case 3:  return (_player[funcName])(args[0], args[1], args[2]);
						case 2:  return (_player[funcName])(args[0], args[1]);
						case 1:  return (_player[funcName])(args[0]);
						default: return (_player[funcName])();
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
				_this.setPlayer(DOCUMENT.getElementById(obj.id));
			}
			_this.container = DOCUMENT.getElementById(_this.id);
			
			utils.foreach(_listeners, function(eventType) {
				_addInternalListener(_player, eventType);
			});
			
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
			_container = DOCUMENT.getElementById(identifier);
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
		var index = -1, player;
		for (var p = 0; p < _players.length; p++) {
			if (_players[p].id == playerId) {
				index = p;
				player = _players[p];
				continue;
			}
		}
		if (index >= 0) {
			var id = player.id,
				toDestroy = DOCUMENT.getElementById(id + (player.renderingMode == "flash" ? "_wrapper" : ""));
			
			if (utils.clearCss) {
				// Clear HTML5 rules
				utils.clearCss("#"+id);
			}

//			if (!toDestroy) {
//				toDestroy = DOCUMENT.getElementById(id);	
//			}
			
			if (toDestroy) {
				var replacement = DOCUMENT.createElement('div');
				replacement.id = id;
				toDestroy.parentNode.replaceChild(replacement, toDestroy);
			}
			_players.splice(index, 1);
		}
		
		return null;
	};

	jwplayer.playerReady = function(obj) {
		var api = jwplayer.api.playerById(obj.id);

		if (api) {
			api.playerReady(obj);
		} else {
			jwplayer.api.selectPlayer(obj.id).playerReady(obj);
		}
		
	};
})(jwplayer);

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