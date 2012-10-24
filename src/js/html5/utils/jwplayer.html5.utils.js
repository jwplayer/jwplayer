/**
 * HTML5-only utilities for the JW Player.
 * 
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	var DOCUMENT = document, WINDOW = window;
	
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
			return true;
		} else if (val.toString().toLowerCase() == 'false') {
			return false;
		} else if (isNaN(Number(val)) || val.length > 5 || val.length == 0) {
			return val;
		} else {
			return Number(val);
		}
	}
	

	/** Filters the sources by taking the first playable type and eliminating sources of a different type **/
	utils.filterSources = function(sources) {
		var selectedType, newSources, extensionmap = utils.extensionmap;
		if (sources) {
			newSources = [];
			for (var i=0; i<sources.length; i++) {
				var type = sources[i].type,
					file = sources[i].file;
				if (!type) {
					type = extensionmap.extType(utils.extension(file));
					sources[i].type = type;
				}

				if (_canPlayHTML5(type)) {
					if (!selectedType) {
						selectedType = type;
					}
					if (type == selectedType) {
						newSources.push(utils.extend({}, sources[i]));
					}
				}
			}
		}
		return newSources;
	}
	
	/** Returns true if the type is playable in HTML5 **/
	function _canPlayHTML5(type) {
		var mime = utils.extensionmap.types[type];
		return (!!mime && jwplayer.vid.canPlayType(mime));
	}
	
	/** Loads an XML file into a DOM object * */
	utils.ajax = function(xmldocpath, completecallback, errorcallback) {
		var xmlhttp;
		// Hash tags should be removed from the URL since they can't be loaded in IE
		if (xmldocpath.indexOf("#") > 0) xmldocpath = xmldocpath.replace(/#.*$/, "");

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
			errorcallback("Error loading file");
		}
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
		}
	}
	
	function _ajaxComplete(xmlhttp, xmldocpath, completecallback, errorcallback) {
		return function() {
			// Handle the case where an XML document was returned with an incorrect MIME type.
			try {
				// This will throw an error on Windows Mobile 7.5.  We want to trigger the error so that we can move 
				// down to the next section
				var xml = xmlhttp.responseXML;
				if (xml && xml.firstChild) return completecallback(xmlhttp);
			} catch (e) {}
			var parsedXML = utils.parseXML(xmlhttp.responseText);
			if (parsedXML && parsedXML.firstChild) {
				xmlhttp = utils.extend({}, xmlhttp, {responseXML:parsedXML});
			} else {
				if (errorcallback) errorcallback(xmlhttp.responseText ? "Invalid XML" : xmldocpath);
				return;
			}
			completecallback(xmlhttp);
		}
	}
	
	/** Takes an XML string and returns an XML object **/
	utils.parseXML = function(input) {
		try {
			var parsedXML;
			// Parse XML in FF/Chrome/Safari/Opera
			if (WINDOW.DOMParser) {
				parsedXML = (new DOMParser()).parseFromString(input,"text/xml");
				try {
					if (parsedXML.childNodes[0].firstChild.nodeName == "parsererror")
						return;
				} catch(e) {}
			} else { 
				// Internet Explorer
				parsedXML = new ActiveXObject("Microsoft.XMLDOM");
				parsedXML.async="false";
				parsedXML.loadXML(input);
			}
			return parsedXML;
		} catch(e) {
			return;
		}
	}

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
			var hrs = Math.floor(sec / 3600),
				mins = Math.floor((sec - hrs*3600) / 60),
				secs = Math.floor(sec % 60);
				
			return (hrs ? hrs + ":" : "") 
					+ (mins < 10 ? "0" : "") + mins + ":"
					+ (secs < 10 ? "0" : "") + secs;
			return str;
		} else {
			return "00:00";
		}
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
	

	/** Replacement for getBoundingClientRect, which isn't supported in iOS 3.1.2 **/
	utils.bounds = function(element) {
		if (!element) return {
			left: 0,
			right: 0,
			width: 0,
			height: 0,
			right: 0,
			bottom: 0
		};
		
		var obj = element,
			left = 0,
			top = 0,
			width = isNaN(element.offsetWidth) ? 0 : element.offsetWidth,
			height = isNaN(element.offsetHeight) ? 0 : element.offsetHeight;
		
		do {
			left += isNaN(obj.offsetLeft) ? 0 : obj.offsetLeft;
			top += isNaN(obj.offsetTop) ? 0 : obj.offsetTop;
		} while (obj = obj.offsetParent);
		
		return { 
			left: left, 
			top: top,
			width: width,
			height: height,
			right: left + width,
			bottom: top + height
		};
	}
	
	utils.empty = function(element) {
		if (!element) return;
		while (element.childElementCount > 0) {
			element.removeChild(element.children[0]);
		}
	}

})(jwplayer.utils);