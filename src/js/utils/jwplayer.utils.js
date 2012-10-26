/**
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

})(jwplayer);