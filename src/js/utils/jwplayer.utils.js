/**
 * Utility methods for the JW Player.
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	var DOCUMENT = document, 
		WINDOW = window, 
		NAVIGATOR = navigator, 
		UNDEFINED = "undefined", 
		STRING = "string", 
		OBJECT = "object",
		TRUE = true, 
		FALSE = false;
	
	//Declare namespace
	var utils = jwplayer.utils = function() {};

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
		case OBJECT:
			return (item !== null);
		case UNDEFINED:
			return FALSE;
		}
		return TRUE;
	};

	/** Used for styling dimensions in CSS -- return the string unchanged if it's a percentage width; add 'px' otherwise **/ 
	utils.styleDimension = function(dimension) {
		return dimension + (dimension.toString().indexOf("%") > 0 ? "" : "px");
	};
	
	/** Gets an absolute file path based on a relative filepath * */
	utils.getAbsolutePath = function(path, base) {
		if (!utils.exists(base)) {
			base = DOCUMENT.location.href;
		}
		if (!utils.exists(path)) {
			return;
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
				utils.foreach(args[i], function(element, arg) {
					try {
						if (utils.exists(arg)) {
							args[0][element] = arg;
						}
					} catch(e) {}
				});
			}
			return args[0];
		}
		return null;
	};

	/** Logger * */
	var console = window.console = window.console || {log: function(){}};
	utils.log = function() {
		var args = Array.prototype.slice.call(arguments, 0);
		if (typeof console.log === OBJECT) {
			console.log(args);
		} else {
			console.log.apply(console, args);
		}
	};

	var _userAgentMatch = utils.userAgentMatch = function(regex) {
		var agent = NAVIGATOR.userAgent.toLowerCase();
		return (agent.match(regex) !== null);
	};
	
	function _browserCheck(regex) {
		return function() {
			return _userAgentMatch(regex);
		};
	}

	utils.isIE = _browserCheck(/msie/i);
	utils.isFF = _browserCheck(/firefox/i);
	utils.isChrome = _browserCheck(/chrome/i);
	utils.isIPod = _browserCheck(/iP(hone|od)/i);
	utils.isIPad = _browserCheck(/iPad/i);
	utils.isSafari602 = _browserCheck(/Macintosh.*Mac OS X 10_8.*6\.0\.\d* Safari/i);

	utils.isSafari = function() {
		return (_userAgentMatch(/safari/i) && !_userAgentMatch(/chrome/i) && !_userAgentMatch(/chromium/i) && !_userAgentMatch(/android/i));
	};

	/** Matches iOS devices **/
	utils.isIOS = function(version) {
		if (version) {
			return _userAgentMatch(new RegExp("iP(hone|ad|od).+\\sOS\\s"+version, "i"));
		} else {
			return _userAgentMatch(/iP(hone|ad|od)/i);
		}
	};

	/** Matches Android devices **/	
	utils.isAndroid = function(version, excludeChrome) {
		//Android Browser appears to include a user-agent string for Chrome/18
		var androidBrowser = excludeChrome ? !_userAgentMatch(/chrome\/[23456789]/i) : TRUE;
		if (version) {
			return androidBrowser && _userAgentMatch(new RegExp("android.*"+version, "i"));
		} else {
			return androidBrowser && _userAgentMatch(/android/i);
		}
	};

	/** Matches iOS and Android devices **/	
	utils.isMobile = function() {
		return utils.isIOS() || utils.isAndroid();
	};
	
	/** Save a setting **/
	utils.saveCookie = function(name, value) {
		DOCUMENT.cookie = "jwplayer." + name + "=" + value + "; path=/";
	};

	/** Retrieve saved  player settings **/
	utils.getCookies = function() {
		var jwCookies = {};
		var cookies = DOCUMENT.cookie.split('; ');
		for (var i=0; i<cookies.length; i++) {
			var split = cookies[i].split('=');
			if (split[0].indexOf("jwplayer.") === 0) {
				jwCookies[split[0].substring(9, split[0].length)] = split[1];
			}
		}
		return jwCookies;
	};

	/** Returns the true type of an object * */
	utils.typeOf = function(value) {
		var typeofString = typeof value;
		if (typeofString === OBJECT) {
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
			translated.fullscreen = translated.message == "true" ? TRUE : FALSE;
			delete translated.message;
		} else if (typeof translated.data == OBJECT) {
			// Takes ViewEvent "data" block and moves it up a level
			var data = translated.data;
			delete translated.data;
			translated = utils.extend(translated, data);

		} else if (typeof translated.metadata == OBJECT) {
			utils.deepReplaceKeyName(translated.metadata, ["__dot__","__spc__","__dsh__","__default__"], ["."," ","-","default"]);
		}
		
		var rounders = ["position", "duration", "offset"];
		utils.foreach(rounders, function(rounder, val) {
			if (translated[val]) {
				translated[val] = Math.round(translated[val] * 1000) / 1000;
			}
		});
		
		return translated;
	};

	/**
	 * If the browser has flash capabilities, return the flash version 
	 */
	utils.flashVersion = function() {
		if (utils.isAndroid()) return 0;
		
		var plugins = NAVIGATOR.plugins, flash;
		
		try {
			if (plugins !== UNDEFINED) {
				flash = plugins['Shockwave Flash'];
				if (flash) {
					return parseInt(flash.description.replace(/\D+(\d+)\..*/, "$1"), 10);
				}
			}
		} catch(e) {
			// The above evaluation (plugins != undefined) messes up IE7
		}
		
		if (typeof WINDOW.ActiveXObject != UNDEFINED) {
			try {
				flash = new WINDOW.ActiveXObject("ShockwaveFlash.ShockwaveFlash");
				if (flash) {
					return parseInt(flash.GetVariable("$version").split(" ")[1].split(",")[0], 10);
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
	};

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
			utils.foreach(obj, function(key, val) {
				var searches, replacements;
				if (searchString instanceof Array && replaceString instanceof Array) {
					if (searchString.length != replaceString.length)
						return;
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
				obj[newkey] = jwplayer.utils.deepReplaceKeyName(val, searchString, replaceString);
				if (key != newkey) {
					delete obj[key];
				}
			});
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
	};

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
		return pluginName.replace(/^(.*\/)?([^-]*)-?.*\.(swf|js)$/, "$2");
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
		return /^(http|\/\/).*(youtube\.com|youtu\.be)\/.+/.test(path);
	};
	
	/** 
	 * Returns a YouTube ID from a number of YouTube URL formats:
	 * 
	 * Matches the following YouTube URL types:
	 *  - http://www.youtube.com/watch?v=YE7VzlLtp-4
	 *  - http://www.youtube.com/watch?v=YE7VzlLtp-4&extra_param=123
	 *  - http://www.youtube.com/watch#!v=YE7VzlLtp-4
	 *  - http://www.youtube.com/watch#!v=YE7VzlLtp-4?extra_param=123&another_param=456
	 *  - http://www.youtube.com/v/YE7VzlLtp-4
	 *  - http://www.youtube.com/v/YE7VzlLtp-4?extra_param=123&another_param=456
	 *  - http://youtu.be/YE7VzlLtp-4
	 *  - http://youtu.be/YE7VzlLtp-4?extra_param=123&another_param=456
	 *  - YE7VzlLtp-4
	 **/
	utils.youTubeID = function(path) {
		try {
			// Left as a dense regular expression for brevity.  
			return (/v[=\/]([^?&]*)|youtu\.be\/([^?]*)|^([\w-]*)$/i).exec(path).slice(1).join('').replace("?", "");		
		} catch (e) {
			return "";
		}
	};

	/**
	 * Determines if a URL is an RTMP link
	 */
	utils.isRtmp = function(file,type) {
		return (file.indexOf("rtmp") === 0 || type == 'rtmp');
	};

	/**
	 * Iterates over an object and executes a callback function for each property (if it exists)
	 * This is a safe way to iterate over objects if another script has modified the object prototype
	 */
	utils.foreach = function(aData, fnEach) {
		var key, val;
		for (key in aData) {
			if (utils.typeOf(aData.hasOwnProperty) == "function") {
				if (aData.hasOwnProperty(key)) {
					val = aData[key];
					fnEach(key, val);
				}
			} else {
				// IE8 has a problem looping through XML nodes
				val = aData[key];
				fnEach(key, val);
			}
		}
	};

	/** Determines if the current page is HTTPS **/
	utils.isHTTPS = function() {
		return (WINDOW.location.href.indexOf("https") === 0);	
	};
	
	/** Gets the repository location **/
	utils.repo = function() {
		var repo = "http://p.jwpcdn.com/" + jwplayer.version.split(/\W/).splice(0, 2).join("/") + "/";
		
		try {
			if (utils.isHTTPS()) {
				repo = repo.replace("http://", "https://ssl.");
			}
		} catch(e) {}
		
		return repo;
	};
	
	/** Loads an XML file into a DOM object * */
	utils.ajax = function(xmldocpath, completecallback, errorcallback) {
		var xmlhttp;
		// Hash tags should be removed from the URL since they can't be loaded in IE
		if (xmldocpath.indexOf("#") > 0) xmldocpath = xmldocpath.replace(/#.*$/, "");

		if (_isCrossdomain(xmldocpath) && utils.exists(WINDOW.XDomainRequest)) {
			// IE8 / 9
			xmlhttp = new WINDOW.XDomainRequest();
			xmlhttp.onload = _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback);
			xmlhttp.ontimeout = xmlhttp.onprogress = function(){};
			xmlhttp.timeout = 5000;
		} else if (utils.exists(WINDOW.XMLHttpRequest)) {
			// Firefox, Chrome, Opera, Safari
			xmlhttp = new WINDOW.XMLHttpRequest();
			xmlhttp.onreadystatechange = _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback);
		} else {
			if (errorcallback) errorcallback();
			return xmlhttp; 
		}
		if (xmlhttp.overrideMimeType) {
			xmlhttp.overrideMimeType('text/xml');
		}

		xmlhttp.onerror = _ajaxError(errorcallback, xmldocpath, xmlhttp);

		try {
			xmlhttp.open("GET", xmldocpath, TRUE);
			xmlhttp.send(null);
		} catch (error) {
			if (errorcallback) errorcallback(xmldocpath);
		}
		return xmlhttp;
	};
	
	function _isCrossdomain(path) {
		return (path && path.indexOf('://') >= 0) &&
				(path.split('/')[2] != WINDOW.location.href.split('/')[2]);
	}
	
	function _ajaxError(errorcallback, xmldocpath, xmlhttp) {
		return function() {
			errorcallback("Error loading file");
		};
	}
	
	function _readyStateChangeHandler(xmlhttp, xmldocpath, completecallback, errorcallback) {
		return function() {
			if (xmlhttp.readyState === 4) {
				switch (xmlhttp.status) {
				case 200:
					_ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback)();
					break;
				case 404:
					errorcallback("File not found");
				}
				
			}
		};
	}
	
	function _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback) {
		return function() {
			// Handle the case where an XML document was returned with an incorrect MIME type.
			var xml, firstChild;
			try {
				// This will throw an error on Windows Mobile 7.5.  We want to trigger the error so that we can move 
				// down to the next section
				xml = xmlhttp.responseXML;
				firstChild = xml.firstChild;
			} catch (e) {
				utils.log('xml mime type error', e);
			}
			if (xml && firstChild) {
				return completecallback(xmlhttp);
			}
			var parsedXML = utils.parseXML(xmlhttp.responseText);
			if (parsedXML && parsedXML.firstChild) {
				xmlhttp = utils.extend({}, xmlhttp, {responseXML:parsedXML});
			} else {
				if (errorcallback) {
					errorcallback(xmlhttp.responseText ? "Invalid XML" : xmldocpath);
				}
				return;
			}
			completecallback(xmlhttp);
		};
	}
	
	/** Takes an XML string and returns an XML object **/
	utils.parseXML = function(input) {
		try {
			var parsedXML;
			// Parse XML in FF/Chrome/Safari/Opera
			if (WINDOW.DOMParser) {
				parsedXML = (new WINDOW.DOMParser()).parseFromString(input,"text/xml");
				try {
					if (parsedXML.childNodes[0].firstChild.nodeName == "parsererror")
						return;
				} catch(e) {}
			} else { 
				// Internet Explorer
				parsedXML = new WINDOW.ActiveXObject("Microsoft.XMLDOM");
				parsedXML.async="false";
				parsedXML.loadXML(input);
			}
			return parsedXML;
		} catch(e) {
			return;
		}
	};
	
	/** Go through the playlist and choose a single playable type to play; remove sources of a different type **/
	utils.filterPlaylist = function(playlist, checkFlash) {
		var pl = [], i, item, j, source;
		for (i=0; i < playlist.length; i++) {
			item = utils.extend({}, playlist[i]);
			item.sources = utils.filterSources(item.sources);
			if (item.sources.length > 0) {
				for (j = 0; j < item.sources.length; j++) {
					source = item.sources[j];
					if (!source.label) source.label = j.toString();
				}
				pl.push(item);
			}
		}
		
		// HTML5 filtering failed; try for Flash sources
		if (checkFlash && pl.length === 0) {
			for (i=0; i < playlist.length; i++) {
				item = utils.extend({}, playlist[i]);
				item.sources = utils.filterSources(item.sources, TRUE);
				if (item.sources.length > 0) {
					for (j = 0; j < item.sources.length; j++) {
						source = item.sources[j];
						if (!source.label) source.label = j.toString();
					}
					pl.push(item);
				}
			}
		}
		return pl;
	};

	/** Filters the sources by taking the first playable type and eliminating sources of a different type **/
	utils.filterSources = function(sources, filterFlash) {
		var selectedType, newSources, extensionmap = utils.extensionmap;
		if (sources) {
			newSources = [];
			for (var i=0; i<sources.length; i++) {
				var type = sources[i].type,
					file = sources[i].file;
				
				if (file) file = utils.trim(file);
				
				if (!type) {
					type = extensionmap.extType(utils.extension(file));
					sources[i].type = type;
				}

				if (filterFlash) {
					if (jwplayer.embed.flashCanPlay(file, type)) {
						if (!selectedType) {
							selectedType = type;
						}
						if (type == selectedType) {
							newSources.push(utils.extend({}, sources[i]));
						}
					}
				} else {
					if (utils.canPlayHTML5(type)) {
						if (!selectedType) {
							selectedType = type;
						}
						if (type == selectedType) {
							newSources.push(utils.extend({}, sources[i]));
						}
					}
				}
			}
		}
		return newSources;
	};
	
	/** Returns true if the type is playable in HTML5 **/
	utils.canPlayHTML5 = function(type) {
		if (utils.isAndroid() && (type == "hls" || type == "m3u" || type == "m3u8")) return FALSE;
		var mime = utils.extensionmap.types[type];
		return (!!mime && !!jwplayer.vid.canPlayType && jwplayer.vid.canPlayType(mime));
	};

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
	};
	
	/**
	 * Basic serialization: string representations of booleans and numbers are
	 * returned typed
	 * 
	 * @param {String}
	 *            val String value to serialize.
	 * @return {Object} The original value in the correct primitive type.
	 */
	utils.serialize = function(val) {
		if (val == null) {
			return null;
		} else if (val.toString().toLowerCase() == 'true') {
			return TRUE;
		} else if (val.toString().toLowerCase() == 'false') {
			return FALSE;
		} else if (isNaN(Number(val)) || val.length > 5 || val.length === 0) {
			return val;
		} else {
			return Number(val);
		}
	};
	
})(jwplayer);