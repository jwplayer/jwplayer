/**
 * jwplayer.html5 namespace
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	jwplayer.html5 = {};
	jwplayer.html5.version = '6.0.2790';
})(jwplayer);/**
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

})(jwplayer.utils);/**
 * CSS utility methods for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	var _styleSheets={},
		_styleSheet,
		_rules = {},
		_block = 0,
		exists = utils.exists,
		_ruleIndexes = {},
		_debug = false,
				
		JW_CLASS = '.jwplayer ';

	function _createStylesheet() {
		var styleSheet = document.createElement("style");
		styleSheet.type = "text/css";
		document.getElementsByTagName('head')[0].appendChild(styleSheet);
		return styleSheet;
	}
	
	var _css = utils.css = function(selector, styles, important) {
		if (!_styleSheets[selector]) {
			if (_debug) _styleSheets[selector] = _createStylesheet();
			else {
				if (!_styleSheet || _styleSheet.sheet.cssRules.length > 50000) {
					_styleSheet = _createStylesheet();
				}
				_styleSheets[selector] = _styleSheet;
			}
		}
		
		if (!exists(important)) important = false;
		
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

		if (_block > 0)
			return;
		
		_updateStylesheet(selector);
	}
	
	_css.block = function() {
		_block++;
	}
	
	_css.unblock = function() {
		_block = Math.max(_block-1, 0);
		if (_block == 0) {
			_applyStyles();
		}
	}
	
	var _applyStyles = function() {
		// IE9 limits the number of style tags in the head, so we need to update the entire stylesheet each time
		for (var selector in _styleSheets) {
			_updateStylesheet(selector);
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
			if (!!value.match(/png|gif|jpe?g/i) && value.indexOf('url') < 0) {
				return "url(" + value + ")";
			}
			return value + importantString;
		}
	}


	function _updateStylesheet(selector) {
		if (_debug) { _styleSheets[selector].innerHTML = _getRuleText(selector); return; }
		
		var sheet = _styleSheets[selector].sheet,
			ruleIndex = _ruleIndexes[selector];

		if (sheet) {
			var rules = sheet.cssRules;
			if (utils.exists(ruleIndex) && ruleIndex < rules.length && rules[ruleIndex].selectorText == selector) {
				sheet.deleteRule(ruleIndex);
			} else {
				_ruleIndexes[selector] = rules.length;	
			}
			sheet.insertRule(_getRuleText(selector), _ruleIndexes[selector]);
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
		// Safari 5 has problems with CSS3 transitions
		if(navigator.userAgent.match(/5\.\d(\.\d)? safari/i)) return;
		
		utils.css(selector, {
			'-webkit-transition': style,
			'-moz-transition': style,
			'-o-transition': style
		});
	}

	
	utils.rotate = function(domelement, deg) {
		utils.transform(domelement, "rotate(" + deg + "deg)");
	};
	
	function _cssReset() {
		_css(JW_CLASS + ["", "div", "span", "a", "img", "ul", "li", "video"].join(","+JW_CLASS) + ", .jwclick", {
			margin: 0,
			padding: 0,
			border: 0,
			color: '#000000',
			'font-size': "100%",
			font: 'inherit',
			'vertical-align': 'baseline',
			'background-color': 'transparent'
		});
		
		_css(JW_CLASS + "ul", { 'list-style': "none" });
	};

	_cssReset();
	
})(jwplayer.utils);/**
 * Utility methods for the JW Player.
 * 
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	utils.scale = function(domelement, xscale, yscale, xoffset, yoffset) {
		var value, exists = utils.exists;
		
		// Set defaults
		if (!exists(xscale)) xscale = 1;
		if (!exists(yscale)) yscale = 1;
		if (!exists(xoffset)) xoffset = 0;
		if (!exists(yoffset)) yoffset = 0;
		
		if (xscale == 1 && yscale == 1 && xoffset == 0 && yoffset == 0) {
			value = "";
		} else {
			value = "scale("+xscale+","+yscale+") translate("+xoffset+"px,"+yoffset+"px)";
		}
		
		utils.transform(domelement, value);
		
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
	utils.stretch = function(stretching, domelement, parentWidth, parentHeight, elementWidth, elementHeight) {
		if (!domelement) return;
		if (!stretching) stretching = _stretching.UNIFORM;
		if (!parentWidth || !parentHeight || !elementWidth || !elementHeight) return;
		
		var xscale = parentWidth / elementWidth,
			yscale = parentHeight / elementHeight,
			xoff = 0, yoff = 0,
			style = {},
			video = (domelement.tagName.toLowerCase() == "video"),
			scale = false,
			stretchClass;
		
		if (video) {
			utils.transform(domelement);
		}

		stretchClass = "jw" + stretching.toLowerCase();
		
		switch (stretching.toLowerCase()) {
		case _stretching.FILL:
			if (xscale > yscale) {
				elementWidth = elementWidth * xscale;
				elementHeight = elementHeight * xscale;
			} else {
				elementWidth = elementWidth * yscale;
				elementHeight = elementHeight * yscale;
			}
		case _stretching.NONE:
			xscale = yscale = 1;
		case _stretching.EXACTFIT:
			scale = true;
			break;
		case _stretching.UNIFORM:
		default:
			if (xscale > yscale) {
				if (elementWidth * yscale / parentWidth > 0.95) {
					scale = true;
					stretchClass = "jwexactfit";
				} else {
					elementWidth = elementWidth * yscale;
					elementHeight = elementHeight * yscale;
				}
			} else {
				if (elementHeight * xscale / parentHeight > 0.95) {
					scale = true;
					stretchClass = "jwexactfit";
				} else {
					elementWidth = elementWidth * xscale;
					elementHeight = elementHeight * xscale;
				}
			}
			if (scale) {
				yscale = Math.ceil(100 * parentHeight / elementHeight) / 100;
				xscale = Math.ceil(100 * parentWidth / elementWidth) / 100;
			}
			break;
		}

		if (video) {
			if (scale) {
				domelement.style.width = elementWidth + "px";
				domelement.style.height = elementHeight + "px"; 
				xoff = ((parentWidth - elementWidth) / 2) / xscale;
				yoff = ((parentHeight - elementHeight) / 2) / yscale;
				utils.scale(domelement, xscale, yscale, xoff, yoff);
			} else {
				domelement.style.width = "";
				domelement.style.height = "";
			}
		} else {
			domelement.className = domelement.className.replace(/\s*jw(none|exactfit|uniform|fill)/g, "");
			domelement.className += " " + stretchClass;
		}
	};
	
	/** Stretching options **/
	var _stretching = utils.stretching = {
		NONE : "none",
		FILL : "fill",
		UNIFORM : "uniform",
		EXACTFIT : "exactfit"
	};

})(jwplayer.utils);
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
(function(parsers) {


    /** Component that loads and parses an DFXP file. **/
    parsers.dfxp = function(_success, _failure) {

        /** XMLHTTP Object. **/
        var _request,
        /** URL of the DFXP file. **/
        _url,
        _seconds = jwplayer.utils.seconds;


        /** Handle errors. **/
        function _error(status) {
            if(status == 0) {
                _failure("Crossdomain loading denied: "+_url);
            } else if (status == 404) { 
                _failure("DFXP File not found: "+_url);
            } else { 
                _failure("Error "+status+" loading DFXP file: "+_url);
            }
        };


        /** Load a new DFXP file. **/
        this.load = function(url) {
            _url = url;
            try {
                _request.open("GET", url, true);
                _request.send(null);
            } catch (error) {
                _failure("Error loading DFXP File: "+url);
            }
        };

        /** Proceed from loading to parsing. **/
        function _parse(data) {
            var _captions = [{begin:0, text:''}];
            data = data.replace(/^\s+/, '').replace(/\s+$/, '');
            var list = data.split("</p>");
            var newlist = [];
            for (var i = 0; i < list.length; i++) {
                if (list[i].indexOf("<p") >= 0) {
                    list[i] = list[i].substr(list[i].indexOf("<p") + 2).replace(/^\s+/, '').replace(/\s+$/, '');
                    newlist.push(list[i]);
                }
            }
            list = newlist;
            for (i = 0; i < list.length; i++) {
                var entry = _entry(list[i]);
                if(entry['text']) {
                    _captions.push(entry);
                    // Insert empty caption at the end.
                    if(entry['end']) {
                        _captions.push({begin:entry['end'],text:''});
                        delete entry['end'];
                    }
                }
            }
            if(_captions.length > 1) {
                _success(_captions);
            } else {
                _failure("Invalid DFXP file: "+_url);
            }
        };


        /** Parse a single captions entry. **/
        function _entry(data) {
            var entry = {};
            try {
                var idx = data.indexOf("begin=\"");
                data = data.substr(idx + 7);
                idx = data.indexOf("\" end=\"");
                entry['begin'] = _seconds(data.substr(0, idx));
                data = data.substr(idx + 7);
                idx = data.indexOf("\">");
                entry['end'] = _seconds(data.substr(0, idx));
                data = data.substr(idx + 2);
                entry['text'] = data;
            } catch (error) {}
            return entry;
        };

        /** Setup the DFXP parser. **/
        function _setup() {
            _request = new XMLHttpRequest();
            _request.onreadystatechange = function() {
                if (_request.readyState === 4) {
                    if (_request.status === 200) {
                        _parse(_request.responseText);
                    } else {
                        _error(_request.status);
                    }
                }
            };
        };
        _setup();


    };


})(jwplayer.html5.parsers);
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
				itm[_localName] = jwplayer.utils.serialize(_parsers.textContent(node));
				if (_localName == "file" && itm.sources) {
					// jwplayer namespace file should override existing source
					// (probably set in MediaParser)
					delete itm.sources;
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
	var utils = jwplayer.utils,
		_xmlAttribute = utils.xmlAttribute,
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
		var node, 
			i,
			captions = [];

		function getLabel(code) {
			var LANGS = { 
				"zh": "Chinese",
				"nl": "Dutch",
				"en": "English",
				"fr": "French",
				"de": "German",
				"it": "Italian",
				"ja": "Japanese",
				"pt": "Portuguese",
				"ru": "Russian",
				"es": "Spanish"
			};
			
			if(LANGS[code]) {
				return LANGS[code];
			}
			return code;
		}	

		for (i = 0; i < _numChildren(obj); i++) {
			node = obj.childNodes[i];
			if (node.prefix == PREFIX) {
				if (!_localName(node)){
					continue;
				}
				switch (_localName(node).toLowerCase()) {
					case 'content':
						//itm['file'] = _xmlAttribute(node, 'url');
						if (_xmlAttribute(node, 'duration')) {
							itm['duration'] = utils.seconds(_xmlAttribute(node, 'duration'));
						}
						if (_numChildren(node) > 0) {
							itm = mediaparser.parseGroup(node, itm);
						}
						if (_xmlAttribute(node, 'url')) {
							if (!itm.sources) {
								itm.sources = [];
							}
							itm.sources.push({
								file: _xmlAttribute(node, 'url'),
								type: _xmlAttribute(node, 'type'),
								width: _xmlAttribute(node, 'width'),
								label: _xmlAttribute(node, 'height') ? _xmlAttribute(node, 'height') + "p" : undefined
							});
						}
						break;
					case 'title':
						itm['title'] = _textContent(node);
						break;
					case 'description':
						itm['description'] = _textContent(node);
						break;
					case 'guid':
						itm['mediaid'] = _textContent(node);
						break;
					case 'thumbnail':
						itm['image'] = _xmlAttribute(node, 'url');
						break;
					case 'player':
						var url = node.url;
						break;
					case 'group':
						mediaparser.parseGroup(node, itm);
						break;
					case 'subtitle':
						var entry = {};
						entry.file = _xmlAttribute(node, 'url');
						if (_xmlAttribute(node, 'lang').length > 0) {
							entry.label = getLabel(_xmlAttribute(node, 'lang'));
						}
						captions.push(entry);
				}
			}
		}

		if(captions.length > 0) {
			itm['captions'] = captions;
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
	var utils = jwplayer.utils,
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
					itm['file'] = utils.xmlAttribute(node, 'url');
					break;
				case 'title':
					itm['title'] = _textContent(node);
					break;
				case 'guid':
					itm['mediaid'] = _textContent(node);
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

		return new jwplayer.playlist.item(itm);
	}


	
	
})(jwplayer.html5.parsers);
(function(parsers) {


    /** Component that loads and parses an SRT file. **/
    parsers.srt = function(_success, _failure) {


        /** XMLHTTP Object. **/
        var _request,
        /** URL of the SRT file. **/
        _url,
        _seconds = jwplayer.utils.seconds;


        /** Handle errors. **/
        function _error(status) {
            if(status == 0) {
                _failure("Crossdomain loading denied: "+_url);
            } else if (status == 404) { 
                _failure("SRT File not found: "+_url);
            } else { 
                _failure("Error "+status+" loading SRT file: "+_url);
            }
        };


        /** Load a new SRT file. **/
        this.load = function(url) {
            _url = url;
            try {
                _request.open("GET", url, true);
                _request.send(null);
            } catch (error) {
                _failure("Error loading SRT File: "+url);
            }
        };


        /** Proceed from loading to parsing. **/
        function _parse(data) {
            // Trim whitespace and split the list by returns.
            var _captions = [{begin:0, text:''}];
            data = data.replace(/^\s+/, '').replace(/\s+$/, '');
            var list = data.split("\r\n\r\n");
            if(list.length == 1) { list = data.split("\n\n"); }
            for(var i=0; i<list.length; i++) {
                if (list[i] == "WEBVTT") {
                    continue;
                }
                // Parse each entry
                var entry = _entry(list[i]);
                if(entry['text']) {
                    _captions.push(entry);
                    // Insert empty caption at the end.
                    if(entry['end']) {
                        _captions.push({begin:entry['end'],text:''});
                        delete entry['end'];
                    }
                }
            }
            if(_captions.length > 1) {
                _success(_captions);
            } else {
                _failure("Invalid SRT file: "+_url);
            }
        };


        /** Parse a single captions entry. **/
        function _entry(data) {
            var entry = {};
            var array = data.split("\r\n");
            if(array.length == 1) { array = data.split("\n"); }
            try {
                // Second line contains the start and end.
                var idx = 1;
                if (array[0].indexOf(' --> ') > 0) {
                    idx = 0;
                }
                var index = array[idx].indexOf(' --> ');
                if(index > 0) {
                    entry['begin'] = _seconds(array[idx].substr(0,index));
                    entry['end'] = _seconds(array[idx].substr(index+5));
                }
                // Third line starts the text.
                if(array[idx+1]) {
                    entry['text'] = array[idx+1];
                    // Arbitrary number of additional lines.
                    for (var i=idx+2; i<array.length; i++) {
                        entry['text'] += '<br/>' + array[i];
                    }
                }
            } catch (error) {}
            return entry;
        };

        /** Setup the SRT parser. **/
        function _setup() {
            _request = new XMLHttpRequest();
            _request.onreadystatechange = function() {
                if (_request.readyState === 4) {
                    if (_request.status === 200) {
                        _parse(_request.responseText);
                    } else {
                        _error(_request.status);
                    }
                }
            };
        };
        _setup();


    };


})(jwplayer.html5.parsers);
(function(html5) {

    var utils = jwplayer.utils,
        events = jwplayer.events,
        states = events.state,
        _css = utils.css,
        
        PLAYING = "playing",

        DOCUMENT = document,
        D_CLASS = ".jwcaptions",

        /** Some CSS constants we should use for minimization **/
        JW_CSS_ABSOLUTE = "absolute",
        JW_CSS_NONE = "none",
        JW_CSS_100PCT = "100%",
        JW_CSS_HIDDEN = "hidden";

    /** Displays closed captions or subtitles on top of the video. **/
    html5.captions = function(api, options) {
        
        var _api = api,
            _display,

        /** Dimensions of the display. **/
        _dimensions,
        
        _defaults = {
            back: true,
            color: '#FFFFFF',
            fontSize: 15
        },

        /** Default configuration options. **/
        _options = {
            fontFamily: 'Arial,sans-serif',
            fontStyle: 'normal',
            fontWeight: 'normal',
            textDecoration: 'none'
        },
        
        /** Reference to the text renderer. **/
        _renderer,
        /** Current player state. **/
        _state,
        /** Currently active captions track. **/
        _track,
        /** List with all tracks. **/
        _tracks = [],
        /** Currently selected track in the displayed track list. **/
        _selectedTrack = 0,
        /** Flag to remember fullscreen state. **/
        _fullscreen = false,
        /** Current captions file being read. **/
        _file,
        /** Event dispatcher for captions events. **/
        _eventDispatcher = new events.eventdispatcher();

        utils.extend(this, _eventDispatcher);

        function _init() {

            _display = DOCUMENT.createElement("div");
            _display.id = _api.id + "_caption";
            _display.className = "jwcaptions";

            _api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
            _api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_ERROR, _errorHandler);
            _api.jwAddEventListener(events.JWPLAYER_ERROR, _errorHandler);
            _api.jwAddEventListener(events.JWPLAYER_READY, _setup);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_TIME, _timeHandler);
            _api.jwAddEventListener(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
        }

       /** Read or write a cookie. **/
  /*       function _cookie(name,value) {
            name = 'jwplayercaptions' + name;
            if(value !== undefined) {
                var c = name+'='+value+'; expires=Wed, 1 Jan 2020 00:00:00 UTC; path=/';
                document.cookie = c;
            } else {
                // http://www.quirksmode.org/js/cookies.html
                var list = document.cookie.split(';');
                for(var i=0; i< list.length; i++) {
                    var c = list[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1,c.length);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length+1, c.length);
                    }
                }
            }
            return null;
        };
*/

        /** Error loading/parsing the captions. **/
        function _errorHandler(error) {
            utils.log("CAPTIONS(" + error + ")");
        };

        /** Player jumped to idle state. **/
        function _idleHandler() {
            _state = 'idle';
            _redraw();
        };

        function _stateHandler(evt) {
            switch(evt.newstate) {
            case states.IDLE:
                _idleHandler();
                break;
            case states.PLAYING:
                _playHandler();
                break;
            }
        }

        function _fullscreenHandler(event) {
            _fullscreen = event.fullscreen;
            if(event.fullscreen) {
                _fullscreenResize();
                // to fix browser fullscreen issue
                setTimeout(_fullscreenResize, 500);
            }
            else {
                _redraw();
            }
            
        }

        function _fullscreenResize() {
            var height = _display.offsetHeight,
                width = _display.offsetWidth;
            if(height != 0 && width != 0) {
                _renderer.resize(width, Math.round(height*0.94));
            }
        }

        /** Listen to playlist item updates. **/
        function _itemHandler(event) {
            _track = 0;
            _tracks = [];
            _renderer.update(0);

            var item = _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()],
                captions = item['captions'],
                i = 0,
                label = "",
                file = "";

            if (captions) {
                for (i = 0; i < captions.length; i++) {
                    file = captions[i].file;
                    if(file) {
                        if (captions[i].label) {
                            _tracks.push(captions[i]);
                        }
                        else {
                            label = file.substring(file.lastIndexOf('/')+1,file.indexOf('.'));
                            _tracks.push({file: file, label: label});
                        }
                    }
                }
            }   
            
            _selectedTrack = 0;
            _redraw();
            _sendEvent(events.JWPLAYER_CAPTIONS_LIST, _getTracks(), _selectedTrack);
        };

        /** Load captions. **/
        function _load(file) {
            _file = file;
            utils.ajax(file, _xmlReadHandler, _xmlFailedHandler);
        };

        function _xmlReadHandler(xmlEvent) {
            var rss = xmlEvent.responseXML.firstChild,
                loader;
            if (html5.parsers.localName(rss) == "tt") {
                loader = new jwplayer.html5.parsers.dfxp(_loadHandler,_errorHandler);
            }
            else {
                loader = new jwplayer.html5.parsers.srt(_loadHandler,_errorHandler);   
            }
            loader.load(_file);
        }

        function _xmlFailedHandler(xmlEvent) {
            var loader = new jwplayer.html5.parsers.srt(_loadHandler,_errorHandler);
            loader.load(_file);
        }

        /** Captions were loaded. **/
        function _loadHandler(data) {
            _renderer.populate(data);
            _tracks[_track].data = data;
            _redraw();
        };


        /** Player started playing. **/
        function _playHandler(event) {
            _state = PLAYING;
            _redraw();
        };

        /** Update the interface. **/
        function _redraw() {
            if(!_tracks.length) {
                _renderer.hide();
            } else {
                if(_state == PLAYING && _selectedTrack > 0) {
                    _renderer.show();
                    if (_fullscreen) {
                        _fullscreenHandler({fullscreen: true});
                        return;
                    }
                    var width = _api.jwGetWidth();
                    if (_api._model && _api._model.config
                            && _api._model.config.listbar && _api._model.config.listbar.size) {
                        width = width - _api._model.config.listbar.size;
                    }
                    _renderer.resize(width, Math.round(_api.jwGetHeight()*0.94));
                } else {
                    _renderer.hide();
                }
            }
        };

        /** Set dock buttons when player is ready. **/
        function _setup() {

            for (var rule in _defaults) {
                if (options && options[rule.toLowerCase()] != undefined) {
                    // Fix for colors, since the player automatically converts to HEX.
                    if(rule == 'color') {
                        _options['color'] = '#'+String(options['color']).substr(-6);
                    } else {
                        _options[rule] = options[rule.toLowerCase()];
                    }
                }
                else {
                    _options[rule] = _defaults[rule];
                }
            }

            // Place renderer and selector.
            _renderer = new jwplayer.html5.captions.renderer(_options,_display);
            _redraw();
        };


        /** Selection menu was closed. **/
        function _renderCaptions(index) {
            // Store new state and track
            if(index > 0) {
                _track = index - 1;
                _selectedTrack = index;
            } else {
                _selectedTrack = 0;
            }
            // Load new captions
            if(_tracks[_track].data) {
                _renderer.populate(_tracks[_track].data);
            } else {
                _load(_tracks[_track].file);
            }
            _redraw();
        };


        /** Listen to player time updates. **/
        function _timeHandler(event) {
            _renderer.update(event.position);
        };

        function _sendEvent(type, tracks, track) {
            var captionsEvent = {type: type, tracks: tracks, track: track};
            _eventDispatcher.sendEvent(type, captionsEvent);
        };

        function _getTracks() {
            var list = new Array();
            list.push({label: "(Off)"});
            for (var i = 0; i < _tracks.length; i++) {
                list.push({label: _tracks[i].label});
            }
            return list;
        };

        this.element = function() {
            return _display;
        }
        
        this.getCaptionsList = function() {
            return _getTracks();
        };
        
        this.getCurrentCaptions = function() {
            return _selectedTrack;
        };
        
        this.setCurrentCaptions = function(index) {
            if (index >= 0 && _selectedTrack != index && index <= _tracks.length) {
                _renderCaptions(index);
                _sendEvent(events.JWPLAYER_CAPTIONS_CHANGED, _getTracks(), _selectedTrack);
            }
        };
        
        _init();

    };

    _css(D_CLASS, {
        position: JW_CSS_ABSOLUTE,
        cursor: "pointer",
        width: JW_CSS_100PCT,
        height: JW_CSS_100PCT,
        overflow: JW_CSS_HIDDEN
    });

})(jwplayer.html5);
(function(html5) {


    /** Component that renders the actual captions on screen. **/
    html5.captions.renderer = function(_options,_div) {


        /** Captions bottom position. **/
        var _bottom,
        /** Current list with captions. **/
        _captions,
        /** Container of captions. **/
        _container,
        /** Current actie captions entry. **/
        _current,
        /** Height of a single line. **/
        _line,
        /** Current video position. **/
        _position,
        /** Should the captions be visible or not. **/
        _visible = 'visible',
        /** Width of the display. **/
        _width;


        /** Hide the rendering component. **/
        this.hide = function() {
            _style({display:'none'});
        };


        /** Assign list of captions to the renderer. **/
        this.populate = function(captions) {
            _current = -1;
            _captions = captions;
            _select();
        };


        /** Render the active caption. **/
        function _render(html) {
            _style({
                left: '0px',
                top: '0px'
            });
            _container.innerHTML = html;
            if(html == '') { 
                _visible = 'hidden';
            } else { 
                _visible = 'visible';
            }
            setTimeout(_resize,20);
        };


        /** Store new dimensions. **/
        this.resize = function(width,bottom) {
            _width = width;
            _bottom = bottom;
            _resize();
        };


        /** Resize the captions. **/
        function _resize() {
            _style({
                left: '0px',
                top: '0px'
            });

            var size = Math.round(_options.fontSize * Math.pow(_width/400,0.6)),
                line = Math.round(size * 1.4),
                left,
                top;

            _style({
                maxWidth: _width + 'px',
                fontSize: size + 'px',
                lineHeight: line + 'px',
                visibility: _visible
            });

            left = Math.round(_width/2 - _container.clientWidth/2);
            top = Math.round(_bottom - _container.clientHeight);
            
            _style({
                left: left + 'px',
                top: top + 'px'
            });
        };


        /** Select a caption for rendering. **/
        function _select() {
            var found = -1;
            for (var i=0; i < _captions.length; i++) {
                if (_captions[i]['begin'] <= _position && 
                    (i == _captions.length-1 || _captions[i+1]['begin'] >= _position)) {
                    found = i;
                    break;
                }
            }
            // If none, empty the text. If not current, re-render.
            if(found == -1) {
                _render('');
            } else if (found != _current) {
                _current = found;
                _render(_captions[i]['text']);
            }
        };


        /** Constructor for the renderer. **/
        function _setup() {
            _container = document.createElement("div");
            _div.appendChild(_container);
            _style({
                color: '#'+_options.color.substr(-6),
                display: 'block',
                fontFamily: _options.fontFamily,
                fontStyle: _options.fontStyle,
                fontWeight: _options.fontWeight,
                height: 'auto',
                margin: '0 0 0 0',
                padding: '3px 9px',
                position: 'absolute',
                textAlign: 'center',
                textDecoration: _options.textDecoration,
                wordWrap: 'break-word',
                width: 'auto'
            });
            if(_options.back) {
                _style({background:'#000'});
            } else {
                _style({textShadow: '-2px 0px 1px #000,2px 0px 1px #000,0px -2px 1px #000,0px 2px 1px #000,-1px 1px 1px #000,1px 1px 1px #000,1px -1px 1px #000,1px 1px 1px #000'});
            }
        };
        _setup();


        /** Show the rendering component. **/
        this.show = function() {
            _style({display:'block'});
            _resize();
        };


        /** Apply CSS styles to elements. **/
        function _style(styles) {
            for(var property in styles) {
              _container.style[property] = styles[property];
            }
        };


        /** Update the video position. **/
        this.update = function(position) {
            _position = position;
            if(_captions) {
                _select();
            }
        };


    };


})(jwplayer.html5);
// TODO: blankButton
/**
 * JW Player HTML5 Controlbar component
 * 
 * @author pablo
 * @version 6.0
 * 
 * TODO: Since the volume slider was moved from the controbar skinning component
 * to the tooltip component, we should clean up how it gets created
 */
(function(jwplayer) {
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		events = jwplayer.events,
		states = events.state,
		_css = utils.css,
		_setTransition = utils.transitionStyle,

		/** Controlbar element types * */
		CB_BUTTON = "button",
		CB_TEXT = "text",
		CB_DIVIDER = "divider",
		CB_SLIDER = "slider",
		
		/** Some CSS constants we should use for minimization * */
		JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_NONE = "none",
		JW_CSS_BLOCK = "block",
		JW_CSS_INLINE = "inline",
		JW_CSS_INLINE_BLOCK = "inline-block",
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_LEFT = "left",
		JW_CSS_RIGHT = "right",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "opacity .15s, background .15s, visibility .15s",
		
		HIDDEN = { display: JW_CSS_NONE },
		NOT_HIDDEN = { display: UNDEFINED },
		
		CB_CLASS = '.jwcontrolbar',
		
		FALSE = false,
		TRUE = true,
		NULL = null,
		UNDEFINED = undefined,
		
		WINDOW = window,
		DOCUMENT = document;
	
	/** HTML5 Controlbar class * */
	html5.controlbar = function(api, config) {
		var _api,
			_skin,
			_dividerElement = _layoutElement("divider", CB_DIVIDER),
			_defaults = {
				margin : 8,
				maxwidth: 800,
				font : "Arial,sans-serif",
				fontsize : 11,
				fontcolor : parseInt("eeeeee", 16),
				fontweight : "bold",
				layout : {
					left: {
						position: "left",
						elements: [ 
						   _layoutElement("play", CB_BUTTON), 
						   _dividerElement, 
						   _layoutElement("prev", CB_BUTTON), 
						   _layoutElement("next", CB_BUTTON), 
						   _layoutElement("divider", CB_DIVIDER, 'nextdiv'),
						   _layoutElement("elapsed", CB_TEXT)
						]
					},
					center: {
						position: "center",
						elements: [ _layoutElement("time", CB_SLIDER) ]
					},
					right: {
						position: "right",
						elements: [ 
						    _layoutElement("duration", CB_TEXT), 
						    _dividerElement,
						    _layoutElement("hd", CB_BUTTON), 
						    _layoutElement("cc", CB_BUTTON), 
						    _dividerElement,
						    _layoutElement("mute", CB_BUTTON), 
						    _layoutElement("volume", CB_SLIDER), 
						    _dividerElement,
						    _layoutElement("fullscreen", CB_BUTTON)
					    ]
					}
				}
			},
		
			_settings, 
			_layout, 
			_elements,
			_bgHeight,
			_controlbar, 
			_id,
			_duration,
			_position,
			_levels,
			_currentQuality,
			_captions,
			_currentCaptions,
			_currentVolume,
			_volumeOverlay,
			_cbBounds,
			_timeRail,
			_railBounds,
			_timeOverlay,
			_timeOverlayText,
			_hdTimer,
			_hdOverlay,
			_ccTimer,
			_ccOverlay,
			_fullscreenOverlay,
			_redrawTimeout,
			_audioMode = FALSE,
			_dragging = FALSE,
			_lastSeekTime = 0,
			_lastTooltipPositionTime = 0,
			
			_toggles = {
				play: "pause",
				mute: "unmute",
				fullscreen: "normalscreen"
			},
			
			_toggleStates = {
				play: FALSE,
				mute: FALSE,
				fullscreen: FALSE
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
				volume: _volume,
			},
		
			_overlays = {},
			_this = this;

		function _layoutElement(name, type, className) {
			return { name: name, type: type, className: className };
		}
		
		function _init() {
			_elements = {};
			
			_api = api;

			_id = _api.id + "_controlbar";
			_duration = _position = 0;

			_controlbar = _createSpan();
			_controlbar.id = _id;
			_controlbar.className = "jwcontrolbar";

			_skin = _api.skin;
			
			_layout = _skin.getComponentLayout('controlbar');
			if (!_layout) _layout = _defaults.layout;
			utils.clearCss('#'+_id);
			_createStyles();
			_buildControlbar();
			_addEventListeners();
			setTimeout(function() {
				_volumeHandler();
				_muteHandler();
			}, 0);
			
			_this.visible = false;
		}
		
		function _addEventListeners() {
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_TIME, _timeUpdated);
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_MUTE, _muteHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_VOLUME, _volumeHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_BUFFER, _bufferHandler);
			_api.jwAddEventListener(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_LOADED, _playlistHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVELS, _qualityHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVEL_CHANGED, _qualityLevelChanged);
			_api.jwAddEventListener(events.JWPLAYER_CAPTIONS_LIST, _captionsHandler);
			_api.jwAddEventListener(events.JWPLAYER_CAPTIONS_CHANGED, _captionChanged);
			_controlbar.addEventListener('mouseover', function(){
				// Slider listeners
				WINDOW.addEventListener('mousemove', _sliderMouseEvent, FALSE);
				WINDOW.addEventListener('mouseup', _sliderMouseEvent, FALSE);
				WINDOW.addEventListener('mousedown', _killSelect, FALSE);
			}, false);
			_controlbar.addEventListener('mouseout', function(){
				// Slider listeners
				WINDOW.removeEventListener('mousemove', _sliderMouseEvent);
				WINDOW.removeEventListener('mouseup', _sliderMouseEvent);
				WINDOW.removeEventListener('mousedown', _killSelect);
			}, false);
		}
		
		function _timeUpdated(evt) {
			var refreshRequired = FALSE,
				timeString;
			
			if (_elements.elapsed) {
				timeString = utils.timeFormat(evt.position);
				_elements.elapsed.innerHTML = timeString;
				refreshRequired = (timeString.length != utils.timeFormat(_position).length);
			}
			if (_elements.duration) {
				timeString = utils.timeFormat(evt.duration);
				_elements.duration.innerHTML = timeString;
				refreshRequired = (refreshRequired || (timeString.length != utils.timeFormat(_duration).length));
			}
			if (evt.duration > 0) {
				_setProgress(evt.position / evt.duration);
			} else {
				_setProgress(0);
			}
			_duration = evt.duration;
			_position = evt.position;
			
			if (refreshRequired) _redraw();
		}
		
		function _stateHandler(evt) {
			switch (evt.newstate) {
			case states.BUFFERING:
			case states.PLAYING:
				_css(_internalSelector('.jwtimeSliderThumb'), { opacity: 1 });
				_toggleButton("play", TRUE);
				break;
			case states.PAUSED:
				if (!_dragging) {
					_toggleButton("play", FALSE);
				}
				break;
			case states.IDLE:
				_toggleButton("play", FALSE);
				_css(_internalSelector('.jwtimeSliderThumb'), { opacity: 0 });
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
			}
		}
		
		function _muteHandler() {
			var state = _api.jwGetMute();
			_toggleButton("mute", state);
			_setVolume(state ? 0 : _currentVolume)
 		}

		function _volumeHandler() {
			_currentVolume = _api.jwGetVolume() / 100;
			_setVolume(_currentVolume);
		}

		function _bufferHandler(evt) {
			_setBuffer(evt.bufferPercent / 100);
		}
		
		function _fullscreenHandler(evt) {
			_toggleButton("fullscreen", evt.fullscreen);
			_updateNextPrev();
		}
		
		function _playlistHandler(evt) {
			_css(_internalSelector(".jwhd"), HIDDEN);
			_css(_internalSelector(".jwcc"), HIDDEN);
			_updateNextPrev();
			_redraw();
		}
		
		function _qualityHandler(evt) {
			_levels = evt.levels;
			if (_levels && _levels.length > 1 && _hdOverlay) {
				_css(_internalSelector(".jwhd"), { display: UNDEFINED });
				_hdOverlay.clearOptions();
				for (var i=0; i<_levels.length; i++) {
					_hdOverlay.addOption(_levels[i].label, i);
				}
				_qualityLevelChanged(evt);
			} else {
				_css(_internalSelector(".jwhd"), { display: "none" });
			}
			_redraw();
		}
		
		function _qualityLevelChanged(evt) {
			_currentQuality = evt.currentQuality;
			if (_hdOverlay && _currentQuality >= 0) {
				_hdOverlay.setActive(evt.currentQuality);
			}
		}
		
		function _captionsHandler(evt) {
			_captions = evt.tracks;
			if (_captions && _captions.length > 1 && _ccOverlay) {
				_css(_internalSelector(".jwcc"), { display: UNDEFINED });
				_ccOverlay.clearOptions();
				for (var i=0; i<_captions.length; i++) {
					_ccOverlay.addOption(_captions[i].label, i);
				}
				_captionChanged(evt);
			} else {
				_css(_internalSelector(".jwcc"), { display: "none" });
			}
			_redraw();
		}
		
		function _captionChanged(evt) {
			if (!_captions) return;
			_currentCaptions = evt.track;
			if (_ccOverlay && _currentCaptions >= 0) {
				_ccOverlay.setActive(evt.track);
			}
		}

		// Bit of a hacky way to determine if the playlist is available
		function _sidebarShowing() {
			return (!!DOCUMENT.querySelector("#"+_api.id+" .jwplaylist") && !_api.jwGetFullscreen());
		}
		
		/**
		 * Styles specific to this controlbar/skin
		 */
		function _createStyles() {
			_settings = utils.extend({}, _defaults, _skin.getComponentSettings('controlbar'), config);

			_bgHeight = _getSkinElement("background").height;
			
			_css('#'+_id, {
		  		height: _bgHeight,
		  		bottom: _audioMode ? 0 : _settings.margin
			});
			
			_css(_internalSelector(".jwtext"), {
				font: _settings.fontsize + "px/" + _getSkinElement("background").height + "px " + _settings.font,
				color: _settings.fontcolor,
				'font-weight': _settings.fontweight
			});

			_css(_internalSelector(".jwoverlay"), {
				bottom: _bgHeight
			});

			
			if (_settings.maxwidth > 0) {
				_css(_internalSelector(), {
					'max-width': _settings.maxwidth
				});
			}
		}

		
		function _internalSelector(name) {
			return '#' + _id + (name ? " " + name : "");
		}

		function _createSpan() {
			return _createElement("span");
		}
		
		function _createElement(tagname) {
			return DOCUMENT.createElement(tagname);
		}
		
		function _buildControlbar() {
			var capLeft = _buildImage("capLeft");
			var capRight = _buildImage("capRight");
			var bg = _buildImage("background", {
				position: JW_CSS_ABSOLUTE,
				left: _getSkinElement('capLeft').width,
				right: _getSkinElement('capRight').width,
				'background-repeat': "repeat-x"
			}, TRUE);

			if (bg) _appendChild(_controlbar, bg);
			if (capLeft) _appendChild(_controlbar, capLeft);
			_buildLayout();
			if (capRight) _appendChild(_controlbar, capRight);
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
		
		function _buildImage(name, style, stretch, nocenter, vertical) {
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
					background: "url('" + skinElem.src + "') repeat-x " + center,
					height: vertical ? skinElem.height : UNDEFINED 
				};
			} else {
				newStyle = {
					background: "url('" + skinElem.src + "') no-repeat" + center,
					width: skinElem.width,
					height: vertical ? skinElem.height : UNDEFINED 
				};
			}
			element.skin = skinElem;
			_css(_internalSelector('.jw'+name), utils.extend(newStyle, style));
			_elements[name] = element;
			return element;
		}

		function _buildButton(name) {
			if (!_getSkinElement(name + "Button").src) {
				return NULL;
			}
			
			var element = _createSpan();
			element.className = 'jw'+name + ' jwbuttoncontainer';
			var button = _createElement("button");
			button.addEventListener("click", _buttonClickHandler(name), FALSE);
			button.innerHTML = "&nbsp;";
			_appendChild(element, button);

			var outSkin = _getSkinElement(name + "Button");
			var overSkin = _getSkinElement(name + "ButtonOver");
			
			
			_buttonStyle(_internalSelector('.jw'+name+" button"), outSkin, overSkin);
			var toggle = _toggles[name];
			if (toggle) {
				_buttonStyle(_internalSelector('.jw'+name+'.jwtoggle button'), _getSkinElement(toggle+"Button"), _getSkinElement(toggle+"ButtonOver"));
			}

			_elements[name] = element;
			
			return element;
		}
		
		function _buttonStyle(selector, out, over) {
			if (!out.src) {
				return;
			}
			
			_css(selector, { 
				width: out.width,
				background: 'url('+ out.src +') center no-repeat'
			});
			
			if (over.src) {
				_css(selector + ':hover', { 
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

		function _hideOverlays(exception) {
			for (var i in _overlays) {
				if (i != exception && _overlays.hasOwnProperty(i)) {
					_overlays[i].hide();
				}
			}
		}
		
		function _showVolume() {
			if (_audioMode) return;
			_volumeOverlay.show();
			_hideOverlays('volume');
		}
		
		function _volume(pct) {
			_setVolume(pct);
			if (pct < 0.1) pct = 0;
			if (pct > 0.9) pct = 1;
			_api.jwSetVolume(pct * 100);
		}
		
		function _showFullscreen() {
			if (_audioMode) return;
			_fullscreenOverlay.show();
			_hideOverlays('fullscreen');
		}
		
		function _seek(pct) {
			_api.jwSeek(pct * _duration);
		}
		
		function _fullscreen() {
			_api.jwSetFullscreen();
		}

		function _next() {
			_api.jwPlaylistNext();
		}

		function _prev() {
			_api.jwPlaylistPrev();
		}

		function _toggleButton(name, state) {
			if (!utils.exists(state)) {
				state = !_toggleStates[name];
			}
			if (_elements[name]) {
				_elements[name].className = 'jw' + name + (state ? " jwtoggle jwtoggling" : " jwtoggling");
				// Use the jwtoggling class to temporarily disable the animation
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

			_css(_internalSelector('.jw'+name), css);
			element.innerHTML = "00:00";
			_elements[name] = element;
			return element;
		}
		
		function _buildDivider(divider) {
			var element;
			if (divider.width) {
				element = _createSpan();
				element.className = "jwblankDivider";
				_css(element, {
					width: parseInt(divider.width)
				});
			} else if (divider.element) {
				element = _buildImage(divider.element);
			} else {
				element = _buildImage(divider.name);
				if (!element) {
					element = _createSpan();
					element.className = "jwblankDivider";
				}
			}
			if (divider.className) element.className += " " + divider.className;
			return element;
		}
		
		function _showHd() {
			if (_levels && _levels.length > 1) {
				if (_hdTimer) {
					clearTimeout(_hdTimer);
					_hdTimer = undefined;
				}
				_hdOverlay.show();
				_hideOverlays('hd');
			}
		}
		
		function _showCc() {
			if (_captions && _captions.length > 1) {
				if (_ccTimer) {
					clearTimeout(_ccTimer);
					_ccTimer = undefined;
				}
				_ccOverlay.show();
				_hideOverlays('cc');
			}
		}

		function _switchLevel(newlevel) {
			if (newlevel >= 0 && newlevel < _levels.length) {
				_api.jwSetCurrentQuality(newlevel);
				_hdOverlay.hide();
			}
		}
		
		function _switchCaption(newcaption) {
			if (newcaption >= 0 && newcaption < _captions.length) {
				_api.jwSetCurrentCaptions(newcaption);
				_ccOverlay.hide();
			}
		}

		function _cc() {
			_toggleButton("cc");
		}
		
		function _buildSlider(name) {
			var slider = _createSpan(),
				skinPrefix = name + (name=="time"?"Slider":""),
				capPrefix = skinPrefix + "Cap",
				vertical = name == "volume",
				left = vertical ? "Top" : "Left",
				right = vertical ? "Bottom" : "Right",
				capLeft = _buildImage(capPrefix + left, NULL, FALSE, FALSE, vertical),
				capRight = _buildImage(capPrefix + right, NULL, FALSE, FALSE, vertical),
				rail = _buildSliderRail(name, vertical, left, right),
				capLeftSkin = _getSkinElement(capPrefix+left),
				capRightSkin = _getSkinElement(capPrefix+left),
				railSkin = _getSkinElement(name+"SliderRail");
			
			slider.className = "jwslider jw" + name;
			
			if (capLeft) _appendChild(slider, capLeft);
			_appendChild(slider, rail);
			if (capRight) {
				if (vertical) capRight.className += " jwcapBottom";
				_appendChild(slider, capRight);
			}

			_css(_internalSelector(".jw" + name + " .jwrail"), {
				left: vertical ? UNDEFINED : capLeftSkin.width,
				right: vertical ? UNDEFINED : capRightSkin.width,
				top: vertical ? capLeftSkin.height : UNDEFINED,
				bottom: vertical ? capRightSkin.height : UNDEFINED,
				width: vertical ? JW_CSS_100PCT : UNDEFINED,
				height: vertical ? "auto" : UNDEFINED
			});

			_elements[name] = slider;
			slider.vertical = vertical;

			if (name == "time") {
				_timeOverlay = new html5.overlay(_id+"_timetooltip", _skin);
				_timeOverlayText = _createElement("div");
				_timeOverlayText.className = "jwoverlaytext";
				_timeOverlay.setContents(_timeOverlayText);
				_timeRail = rail;
				_setTimeOverlay(0);
				_appendChild(rail, _timeOverlay.element());
				_styleTimeSlider(slider);
				_setProgress(0);
				_setBuffer(0);
			} else if (name == "volume") {
				_styleVolumeSlider(slider, vertical, left, right);
			}
			
			return slider;
		}
		
		function _buildSliderRail(name, vertical, left, right) {
			var rail = _createSpan(), 
				railElements = ['Rail', 'Buffer', 'Progress'],
				progressRail;
			
			rail.className = "jwrail jwsmooth";

			for (var i=0; i<railElements.length; i++) {
				var sliderPrefix = (name=="time"?"Slider":""),
					prefix = name + sliderPrefix + railElements[i],
					element = _buildImage(prefix, NULL, !vertical, (name=="volume")),
					capLeft = _buildImage(prefix + "Cap" + left, NULL, FALSE, FALSE, vertical),
					capRight = _buildImage(prefix + "Cap" + right, NULL, FALSE, FALSE, vertical),
					capLeftSkin = _getSkinElement(prefix + "Cap" + left),
					capRightSkin = _getSkinElement(prefix + "Cap" + right);
				if (element) {
					var railElement = _createSpan();
					railElement.className = "jwrailgroup " + railElements[i];
					if (capLeft) _appendChild(railElement, capLeft);
					_appendChild(railElement, element);
					if (capRight) { 
						_appendChild(railElement, capRight);
						capRight.className += " jwcap" + (vertical ? "Bottom" : "Right");
					}
					
					_css(_internalSelector(".jwrailgroup." + railElements[i]), {
						'min-width': (vertical ? UNDEFINED : capLeftSkin.width + capRightSkin.width)
					});
					railElement.capSize = vertical ? capLeftSkin.height + capRightSkin.height : capLeftSkin.width + capRightSkin.width;
					
					_css(_internalSelector("." + element.className), {
						left: vertical ? UNDEFINED : capLeftSkin.width,
						right: vertical ? UNDEFINED : capRightSkin.width,
						top: vertical ? capLeftSkin.height : UNDEFINED,
						bottom: vertical ? capRightSkin.height : UNDEFINED,
						height: vertical ? "auto" : UNDEFINED
					});

					if (i == 2) progressRail = railElement;
					
					_elements[prefix] = railElement;
					_appendChild(rail, railElement);
				}
			}
			
			var thumb = _buildImage(name + sliderPrefix + "Thumb", NULL, FALSE, FALSE, vertical);
			if (thumb) {
				_css(_internalSelector('.'+thumb.className), {
					opacity: name == "time" ? 0 : 1,
					'margin-top': vertical ? thumb.skin.height / -2 : UNDEFINED
				});
				
				thumb.className += " jwthumb";
				_appendChild(vertical && progressRail ? progressRail : rail, thumb);
			}
			
			rail.addEventListener('mousedown', _sliderMouseDown(name), FALSE);
			
			if (name == "time") {
				rail.addEventListener('mousemove', _showTimeTooltip, FALSE);
				rail.addEventListener('mouseout', _hideTimeTooltip, FALSE);
			}
			
			_elements[name+'Rail'] = rail;
			
			return rail;
		}
		
		function _idle() {
			var currentState = _api.jwGetState();
			return (currentState == states.IDLE); 
		}

		function _killSelect(evt) {
			evt.preventDefault();
			DOCUMENT.onselectstart = function () { return FALSE; };
		}

		function _sliderMouseDown(name) {
			return (function(evt) {
				if (evt.button != 0)
					return;
				
				_elements[name+'Rail'].className = "jwrail";
				
				if (name == "time") {
					if (!_idle()) {
						_api.jwSeekDrag(TRUE);
						_dragging = name;
					}
				} else {
					_dragging = name;
				}
				
			});
		}

		
		function _sliderMouseEvent(evt) {
			
			var currentTime = (new Date()).getTime();
			
			if (currentTime - _lastTooltipPositionTime > 50) {
				_positionTimeTooltip(evt);
				_lastTooltipPositionTime = currentTime;
			}
			
			if (!_dragging || evt.button != 0) {
				return;
			}
			
			var rail = _elements[_dragging].getElementsByClassName('jwrail')[0],
				railRect = utils.bounds(rail),
				name = _dragging,
				pct = _elements[name].vertical ? (railRect.bottom - evt.pageY) / railRect.height : (evt.pageX - railRect.left) / railRect.width;
			
			if (evt.type == 'mouseup') {
				if (name == "time") {
					_api.jwSeekDrag(FALSE);
				}

				_elements[name+'Rail'].className = "jwrail jwsmooth";
				_dragging = NULL;
				_sliderMapping[name](pct);
				DOCUMENT.onselectstart = null;

			} else {
				if (_dragging == "time") {
					_setProgress(pct);
				} else {
					_setVolume(pct);
				}
				if (currentTime - _lastSeekTime > 500) {
					_lastSeekTime = currentTime;
					_sliderMapping[_dragging](pct);
				}
			}
			return false;
		}

		function _showTimeTooltip(evt) {
			if (_timeOverlay && _duration && !_audioMode) {
				_timeOverlay.show();
			}
		}
		
		function _hideTimeTooltip(evt) {
			if (_timeOverlay) {
				_timeOverlay.hide();
			}
		}
		
		function _positionTimeTooltip(evt) {
			_railBounds = utils.bounds(_timeRail);
			if (!_railBounds || _railBounds.width == 0) return;
			var element = _timeOverlay.element(), 
				position = (evt.pageX - _railBounds.left) - WINDOW.pageXOffset;
			if (position >= 0 && position <= _railBounds.width) {
				element.style.left = Math.round(position) + "px";
				_setTimeOverlay(_duration * position / _railBounds.width);
			}
		}
		
		function _setTimeOverlay(sec) {
			_timeOverlayText.innerHTML = utils.timeFormat(sec);
		}
		
		function _styleTimeSlider(slider) {
			if (_elements['timeSliderThumb']) {
				_css(_internalSelector(".jwtimeSliderThumb"), {
					'margin-left': (_getSkinElement("timeSliderThumb").width/-2)
				});
			}

			_setBuffer(0);
			_setProgress(0);
		}
		
		
		function _styleVolumeSlider(slider, vertical, left, right) {
			var prefix = "volume";
			_css(_internalSelector(".jwvolume"), {
				width: _getSkinElement(prefix+"Rail").width + (vertical ? 0 : _getSkinElement(prefix+"Cap"+left).width + _getSkinElement(prefix+"Cap"+right).width),
				height: vertical ? (
							_getSkinElement(prefix+"Cap"+left).height + 
							_getSkinElement(prefix+"Rail").height + 
							_getSkinElement(prefix+"RailCap"+left).height + 
							_getSkinElement(prefix+"RailCap"+right).height + 
							_getSkinElement(prefix+"Cap"+right).height
						) : UNDEFINED
			});
			if (vertical) slider.className += " jwvertical";
		}
		
		var _groups = {};
		
		function _buildLayout() {
			_buildGroup("left");
			_buildGroup("center");
			_buildGroup("right");
			_appendChild(_controlbar, _groups.left);
			_appendChild(_controlbar, _groups.center);
			_appendChild(_controlbar, _groups.right);
			_buildOverlays();
			
			_css(_internalSelector(".jwright"), {
				right: _getSkinElement("capRight").width
			});
		}

		function _buildOverlays() {
			if (_elements.hd) {
				_hdOverlay = new html5.menu('hd', _id+"_hd", _skin, _switchLevel);
				_addOverlay(_hdOverlay, _elements.hd, _showHd, _setHdTimer);
				_overlays.hd = _hdOverlay;
			}
			if (_elements.cc) {
				_ccOverlay = new html5.menu('cc', _id+"_cc", _skin, _switchCaption);
				_addOverlay(_ccOverlay, _elements.cc, _showCc, _setCcTimer);
				_overlays.cc = _ccOverlay;
			}
			if (_elements.mute && _elements.volume && _elements.volume.vertical) {
				_volumeOverlay = new html5.overlay(_id+"_volumeoverlay", _skin);
				_volumeOverlay.setContents(_elements.volume);
				_addOverlay(_volumeOverlay, _elements.mute, _showVolume);
				_overlays.volume = _volumeOverlay;
			}
			if (_elements.fullscreen) {
				_fullscreenOverlay = new html5.overlay(_id+"_fullscreenoverlay", _skin);
				var text = _createElement("div");
				text.className = "jwoverlaytext";
				text.innerHTML = "Fullscreen";
				_fullscreenOverlay.setContents(text);
				_addOverlay(_fullscreenOverlay, _elements.fullscreen, _showFullscreen);
				_overlays.fullscreen = _fullscreenOverlay;
 			}
		}
		
		function _setCcTimer() {
			_ccTimer = setTimeout(_ccOverlay.hide, 500);
		}

		function _setHdTimer() {
			_hdTimer = setTimeout(_hdOverlay.hide, 500);
		}

		function _addOverlay(overlay, button, hoverAction, timer) {
			var element = overlay.element();
			_appendChild(button, element);
			button.addEventListener('mousemove', hoverAction, FALSE);
			if (timer) {
				button.addEventListener('mouseout', timer, FALSE);	
			}
			else {
				button.addEventListener('mouseout', overlay.hide, FALSE);
			}
			_css('#'+element.id, {
				left: "50%"
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
						if (group.elements[i].name == "volume" && element.vertical) {
							_volumeOverlay = new html5.overlay(_id+"_volumeOverlay", _skin);
							_volumeOverlay.setContents(element);
						} else {
							_appendChild(container, element);
						}
					}
				}
			}
		}

		var _redraw = function() {
			clearTimeout(_redrawTimeout);
			_redrawTimeout = setTimeout(_this.redraw, 0);
		}
		
		_this.redraw = function() {
			_createStyles();
			var capLeft = _getSkinElement("capLeft"), capRight = _getSkinElement("capRight")
			_css(_internalSelector('.jwgroup.jwcenter'), {
				left: Math.round(utils.parseDimension(_groups.left.offsetWidth) + capLeft.width),
				right: Math.round(utils.parseDimension(_groups.right.offsetWidth) + capRight.width)
			});
			
			var max = (_controlbar.parentNode.clientWidth > _settings.maxwidth), 
				margin = _audioMode ? 0 : _settings.margin;
			
			_css(_internalSelector(), {
				left:  max ? "50%" : margin,
				right:  max ? UNDEFINED : margin,
				'margin-left': max ? _controlbar.clientWidth / -2 : UNDEFINED,
				width: max ? JW_CSS_100PCT : UNDEFINED
			});

		
//			setTimeout(function() {
//				var newBounds = utils.bounds(_controlbar);
//				if (!_cbBounds || newBounds.width != _cbBounds.width) {
//					_cbBounds = newBounds;
//					if (_cbBounds.width > 0) {
//						_railBounds = utils.bounds(_timeRail);
//					}
//				}
				_positionOverlays();
//			}, 0);
		}
		
		function _updateNextPrev() {
			if (_api.jwGetPlaylist().length > 1 && !_sidebarShowing()) {
				_css(_internalSelector(".jwnext"), NOT_HIDDEN);
				_css(_internalSelector(".jwprev"), NOT_HIDDEN);
				_css(_internalSelector(".nextdiv"), NOT_HIDDEN);
			} else {
				_css(_internalSelector(".jwnext"), HIDDEN);
				_css(_internalSelector(".jwprev"), HIDDEN);
				_css(_internalSelector(".nextdiv"), HIDDEN);
			}
		}
		
		function _positionOverlays() {
			var overlayBounds, i, overlay;
			_cbBounds = utils.bounds(_controlbar);
			for (i in _overlays) {
				overlay = _overlays[i];
				overlay.offsetX(0);
				overlayBounds = utils.bounds(overlay.element());
				if (overlayBounds.right > _cbBounds.right) {
					overlay.offsetX(_cbBounds.right - overlayBounds.right);
				} else if (overlayBounds.left < _cbBounds.left) {
					overlay.offsetX(_cbBounds.left - overlayBounds.left);
				}
			}
		}

		

		_this.audioMode = function(mode) {
			if (mode != _audioMode) {
				_audioMode = mode;
				_css(_internalSelector(".jwfullscreen"), { display: mode ? JW_CSS_NONE : UNDEFINED });
				_css(_internalSelector(".jwhd"), { display: mode ? JW_CSS_NONE : UNDEFINED });
				_css(_internalSelector(".jwcc"), { display: mode ? JW_CSS_NONE : UNDEFINED });
				_redraw();
			}
		}
		
		_this.element = function() {
			return _controlbar;
		};

		_this.margin = function() {
			return parseInt(_settings.margin);
		};

		function _setBuffer(pct) {
			pct = Math.min(Math.max(0, pct), 1);
			if (_elements.timeSliderBuffer) {
				_elements.timeSliderBuffer.style.width = pct * 100 + "%";
				_elements.timeSliderBuffer.style.opacity = pct > 0 ? 1 : 0;
			}
		}

		function _sliderPercent(name, pct) {
			var vertical = _elements[name].vertical,
				prefix = name + (name=="time"?"Slider":""),
				size = 100 * Math.min(Math.max(0, pct), 1) + "%",
				progress = _elements[prefix+'Progress'],
				thumb = _elements[prefix+'Thumb'],
				hide = FALSE;
			
			// Set style directly on the elements; Using the stylesheets results in some flickering in Chrome.
			if (progress) {
				if (vertical) {
					progress.style.height = size;
					progress.style.bottom = 0;
					if (progress.clientHeight <= progress.capSize) hide = TRUE;
				} else {
					progress.style.width = size;
					if (progress.clientWidth <= progress.capSize) hide = TRUE;
				}
				progress.style.opacity = ((!hide && pct > 0) || _dragging) ? 1 : 0;
				
			}
			
			if (thumb) {
				if (vertical) {
					thumb.style.top = 0;
				} else {
					thumb.style.left = size;
				}
			}
		}
		
		function _setVolume (pct) {
			_sliderPercent('volume', pct);	
		}

		function _setProgress(pct) {
			_sliderPercent('time', pct);
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement(name.indexOf("volume") == 0 ? 'tooltip' : 'controlbar', name); 
			if (elem) {
				return elem;
			} else {
				return {
					width: 0,
					height: 0,
					src: "",
					image: UNDEFINED,
					ready: FALSE
				}
			}
		}
		
		function _appendChild(parent, child) {
			parent.appendChild(child);
		}
		
		_this.show = function() {
			_this.visible = true;
			_controlbar.style.opacity = 1;
		}
		
		_this.hide = function() {
			_this.visible = false;
			_controlbar.style.opacity = 0;
		}
		
		// Call constructor
		_init();

	}

	/***************************************************************************
	 * Player stylesheets - done once on script initialization; * These CSS
	 * rules are used for all JW Player instances *
	 **************************************************************************/

	_css(CB_CLASS, {
		position: JW_CSS_ABSOLUTE,
		opacity: 0
	});
	
	_css(CB_CLASS+' span', {
		height: JW_CSS_100PCT
	});
	utils.dragStyle(CB_CLASS+' span', JW_CSS_NONE);
	
    _css(CB_CLASS+' .jwgroup', {
    	display: JW_CSS_INLINE
    });
    
    _css(CB_CLASS+' span, '+CB_CLASS+' .jwgroup button,'+CB_CLASS+' .jwleft', {
    	position: JW_CSS_RELATIVE,
		'float': JW_CSS_LEFT
    });
    
	_css(CB_CLASS+' .jwright', {
		position: JW_CSS_ABSOLUTE
	});
	
    _css(CB_CLASS+' .jwcenter', {
    	position: JW_CSS_ABSOLUTE
    });
    
    _css(CB_CLASS+' buttoncontainer,'+CB_CLASS+' button', {
    	display: JW_CSS_INLINE_BLOCK,
    	height: JW_CSS_100PCT,
    	border: JW_CSS_NONE,
    	cursor: 'pointer'
    });

    _css(CB_CLASS+' .jwcapRight,'+CB_CLASS+' .jwtimeSliderCapRight,'+CB_CLASS+' .jwvolumeCapRight', { 
		right: 0,
		position: JW_CSS_ABSOLUTE
	});

    _css(CB_CLASS+' .jwcapBottom', { 
		bottom: 0,
    	position: JW_CSS_ABSOLUTE
	});

    _css(CB_CLASS+' .jwtime', {
    	position: JW_CSS_ABSOLUTE,
    	height: JW_CSS_100PCT,
    	width: JW_CSS_100PCT,
    	left: 0
    });
    
    _css(CB_CLASS + ' .jwthumb', {
    	position: JW_CSS_ABSOLUTE,
    	height: JW_CSS_100PCT,
    	cursor: 'pointer'
    });
    
    _css(CB_CLASS + ' .jwrail', {
    	position: JW_CSS_ABSOLUTE,
    	cursor: 'pointer'
    });

    _css(CB_CLASS + ' .jwrailgroup', {
    	position: JW_CSS_ABSOLUTE,
    	width: JW_CSS_100PCT
    });

    _css(CB_CLASS + ' .jwrailgroup span', {
    	position: JW_CSS_ABSOLUTE
    });

    _css(CB_CLASS + ' .jwdivider+.jwdivider', {
    	display: JW_CSS_NONE
    });
    
    _css(CB_CLASS + ' .jwtext', {
		padding: '0 5px',
		'text-align': 'center'
	});
    
	_css(CB_CLASS + ' .jwoverlaytext', {
		padding: 3
	});

    _css(CB_CLASS + ' .jwvertical *', {
    	display: JW_CSS_BLOCK,
    });

	_setTransition(CB_CLASS, JW_CSS_SMOOTH_EASE);
	_setTransition(CB_CLASS + ' button', JW_CSS_SMOOTH_EASE);
	_setTransition(CB_CLASS + ' .jwtime .jwsmooth span', JW_CSS_SMOOTH_EASE + ", width .15s linear, left .15s linear");
	_setTransition(CB_CLASS + ' .jwtoggling', JW_CSS_NONE);

})(jwplayer);/**
 * jwplayer.html5 API
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	var html5 = jwplayer.html5,
		utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state;
		
	html5.controller = function(model, view) {
		var _model = model,
			_view = view,
			_video = model.getVideo(),
			_controller = this,
			_eventDispatcher = new events.eventdispatcher(_model.id, _model.config.debug),
			_ready = false,
			_loadOnPlay = -1,
			_preplay, 
			_actionOnAttach, 
			_interruptPlay,
			_queuedCalls = [];
		
		utils.extend(this, _eventDispatcher);

		function _init() {
			_model.addEventListener(events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
			_model.addEventListener(events.JWPLAYER_MEDIA_COMPLETE, function(evt) {
				// Insert a small delay here so that other complete handlers can execute
				setTimeout(_completeHandler, 25);
			});
		}
		
		function _playerReady(evt) {
			if (!_ready) {
				_ready = true;
				
				_view.completeSetup();
				_eventDispatcher.sendEvent(evt.type, evt);

				if (jwplayer.utils.exists(window.jwplayer.playerReady)) {
					jwplayer.playerReady(evt);
				}

				_model.addGlobalListener(_forward);
				_view.addGlobalListener(_forward);

				_eventDispatcher.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_LOADED, {playlist: _model.playlist});
				_eventDispatcher.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_ITEM, {index: _model.item});
				
				_load();
				
				if (_model.autostart && !utils.isMobile()) {
					_play();
				}
				
				while (_queuedCalls.length > 0) {
					var queuedCall = _queuedCalls.shift();
					_callMethod(queuedCall.method, queuedCall.arguments);
				}
			}
		}

		
		function _forward(evt) {
			_eventDispatcher.sendEvent(evt.type, evt);
		}
		
		function _bufferFullHandler(evt) {
			_video.play();
		}

		function _load(item) {
			_stop();
			
			switch (utils.typeOf(item)) {
			case "string":
				_loadPlaylist(item);
				break;
			case "object":
			case "array":
				_model.setPlaylist(new jwplayer.playlist(item));
				break;
			case "number":
				_model.setItem(item);
				break;
			}
		}
		
		function _loadPlaylist(playlist) {
			var loader = new html5.playlistloader();
			loader.addEventListener(events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
				_load(evt.playlist);
			});
			loader.addEventListener(events.JWPLAYER_ERROR, function(evt) {
				_load([]);
				evt.message = "Could not load playlist: " + evt.message; 
				_forward(evt);
			});
			loader.load(playlist);
		}
		
		function _play(state) {
			if (!utils.exists(state)) state = true;
			if (!state) return _pause();
			try {
				if (_loadOnPlay >= 0) {
					_load(_loadOnPlay);
					_loadOnPlay = -1;
				}
				_actionOnAttach = _play;
				if (!_preplay) {
					_preplay = true;
					_eventDispatcher.sendEvent(events.JWPLAYER_MEDIA_BEFOREPLAY);
					_preplay = false;
					if (_interruptPlay) {
						_interruptPlay = false;
						_actionOnAttach = null;
						return;
					}
				}
				
				if (_isIdle()) {
					if (_model.playlist.length == 0) return false;
					_video.load(_model.playlist[_model.item]);
				} else if (_model.state == states.PAUSED) {
					_video.play();
				}
				
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, err);
				_actionOnAttach = null;
			}
			return false;
		}

		function _stop() {
			_actionOnAttach = null;
			try {
				if (!_isIdle()) {
					_video.stop();
				}
				if (_preplay) {
					_interruptPlay = true;
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, err);
			}
			return false;

		}

		function _pause(state) {
			if (!utils.exists(state)) state = true;
			if (!state) return _play();
			try {
				switch (_model.state) {
					case states.PLAYING:
					case states.BUFFERING:
						_video.pause();
						break;
					default:
						if (_preplay) {
							_interruptPlay = true;
						}
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, err);
			}
			return false;

			
			if (_model.state == states.PLAYING || _model.state == states.BUFFERING) {
				_video.pause();
			}
		}
		
		function _isIdle() {
			return (_model.state == states.IDLE);
		}
		
		function _seek(pos) {
			if (_model.state != states.PLAYING) _play(true);
			_video.seek(pos);
		}
		
		function _setFullscreen(state) {
			_view.fullscreen(state);
		}

		function _setStretching(stretching) {
			_model.stretching = stretching;
			// TODO: Send stretching event
			_view.resize();
		}

		function _item(index) {
			_load(index);
			_play();
		}
		
		function _prev() {
			_item(_model.item - 1);
		}
		
		function _next() {
			_item(_model.item + 1);
		}
		
		function _completeHandler() {
			if (!_isIdle()) {
				// Something has made an API call before the complete handler has fired.
				return;
			}
			_actionOnAttach = _completeHandler;
			if (_model.repeat) {
				_next();
			} else {
				if (_model.item == _model.playlist.length - 1) {
					_loadOnPlay = 0;
					_stop();
					setTimeout(function() { _eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_COMPLETE)}, 0);
				} else {
					_next();
				}
			}
		}
		
		function _setCurrentQuality(quality) {
			_video.setCurrentQuality(quality);
		}

		function _getCurrentQuality() {
			if (_video) return _video.getCurrentQuality();
			else return -1;
		}

		function _getQualityLevels() {
			if (_video) return _video.getQualityLevels();
			else return null;
		}

		function _setCurrentCaptions(caption) {
			_view.setCurrentCaptions(caption);
		}

		function _getCurrentCaptions() {
			return _view.getCurrentCaptions();
		}

		function _getCaptionsList() {
			return _view.getCaptionsList();
		}

		/** Used for the InStream API **/
		function _detachMedia() {
			try {
				return _model.getVideo().detachMedia();
			} catch (err) {
				return null;
			}
		}

		function _attachMedia() {
			try {
				var ret = _model.getVideo().attachMedia();
				if (typeof _actionOnAttach == "function") {
					_actionOnAttach();
				}
			} catch (err) {
				return null;
			}
		}
		
		function _waitForReady(func) {
			return function() {
				if (_ready) {
					_callMethod(func, arguments);
				} else {
					_queuedCalls.push({ method: func, arguments: arguments});
				}
			}
		}
		
		function _callMethod(func, args) {
			var _args = [];
			for (i=0; i < args.length; i++) {
				_args.push(args[i]);
			}
			func.apply(this, _args);
		}

		/** Controller API / public methods **/
		this.play = _waitForReady(_play);
		this.pause = _waitForReady(_pause);
		this.seek = _waitForReady(_seek);
		this.stop = _waitForReady(_stop);
		this.load = _waitForReady(_load);
		this.next = _waitForReady(_next);
		this.prev = _waitForReady(_prev);
		this.item = _waitForReady(_item);
		this.setVolume = _waitForReady(_model.setVolume);
		this.setMute = _waitForReady(_model.setMute);
		this.setFullscreen = _waitForReady(_setFullscreen);
		this.setStretching = _waitForReady(_setStretching);
		this.detachMedia = _detachMedia; 
		this.attachMedia = _attachMedia;
		this.setCurrentQuality = _waitForReady(_setCurrentQuality);
		this.getCurrentQuality = _getCurrentQuality;
		this.getQualityLevels = _getQualityLevels;
		this.setCurrentCaptions = _waitForReady(_setCurrentCaptions);
		this.getCurrentCaptions = _getCurrentCaptions;
		this.getCaptionsList = _getCaptionsList;
		
		this.playerReady = _playerReady;

		_init();
	}
	
})(jwplayer);

/**
 * JW Player Default skin
 *
 * @author zach
 * @version 5.8
 */
(function(jwplayer) {
	jwplayer.html5.defaultskin = function() {
		this.text = '<?xml version="1.0" ?><skin author="LongTail Video" name="Six" version="2.0" target="6.0"><components><component name="controlbar"><settings><setting name="margin" value="8"/><setting name="fontcolor" value="eeeeee"/><setting name="fontsize" value="11"/><setting name="fontweight" value="bold"/><setting name="maxwidth" value="800"/></settings><elements><element name="background" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAaCAIAAAD5ZqGGAAAAJklEQVR42mNKSUlhevToEdPXr1+Z/v37RxH+//8/htjv379BZgMA4j5LOzqaqAsAAAAASUVORK5CYII="/><element name="capLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAaCAYAAAB/75arAAAAh0lEQVR42t2RywnDMAxAhSbJRukGPtgDdJSO0k7U4IOPBhuM8b9SIAG3p0JPFTwETxJICIFCSrkqpZ7EYFAIsbbW7s65RWsNDJK4ee/BGAMhhB2stS7WWui9n7CEGOMsaXwSZ+d/yR+cOcaY+HL8vcByyzl/7HllyX8qpexgSulBhQvl7XjxCydafIt3Z4BrAAAAAElFTkSuQmCC"/><element name="capRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAaCAYAAAB/75arAAAAjUlEQVR42tWRywnDMAxAhSbJRukGPtgDdJSO0k7U4INPvthgjP+VSlsSkkvpqYKH4EnCFkKl1Hhxl1LOQIFaa2Ccc1Nr7SqEmDGEAIwxBrz3QIUL9t7hjbUWaq3TRqaUWMJGMjS+l4edfy2/XHOMAWt+eJ3FTuacWS5YSgEmxviU9M/z58R0tIXEifLtATSUfIsSwhegAAAAAElFTkSuQmCC"/><element name="divider" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAaCAYAAAB2BDbRAAAAEElEQVR42mP4//8/A8NAEgDiqk2zfDlcXgAAAABJRU5ErkJggg=="/><element name="playButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAAAdUlEQVR42u2TsQ3AIAwE2YARMkJGyCiMwiiMwgjUFMAIjOC8lMJdiIjd+aSrr3i9MwzjHXoYMOgFmAIvvQCT4aEXYNLvEK2ZMEKvFODQVqC1Rl/sve8Faq20cMIIvUYgQR5ZMJDh6RixQIF8NMHAgMEZhrHNDU+1T3s3o0CaAAAAAElFTkSuQmCC"/><element name="playButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAABhUlEQVR42uXVzUoCYRTGcXNGR3HSDPtASyIhrIjaFJlBRBRUdAUGQQurdVfSrl2LuhEvYxR1IYroRhCEWU1/4R2Yxcz4MUlQB34bGc6D58y8r+/vl2EYczNpKvitzN9/orEEGUEoQhAyJDNs2gAJCiKIYVGIQUUIAWvQNM2jWMEGtoRNpJBAFOGJgsRDAahYRRbHuMAVznGEHaSxZBNkvyPLQhXEkUEew+riE88o4AYn2BVBCcxDgWz+G6fxhLGMPdzBWh184RUPuEUOWaSwgBBkpwAZESRxiALsqoV3EXSPSxwgLUIUc1xOAWvI4RFupeENRVxjH0moCMBvF6BiHXkUMap0lPCCM2QQh2LuwingFE8Ytwa4wTYSCEEaGVCtVo1x1Gq1CQPEiDRNM9yUy2W92WyWdF13HJHrkt2aNxoNbTAYuC555Gtq17her7f6/f7HmK+p+4dmbcysO71ez8OHZnNUDBtXKpVuu932clTM/rCb/XHt/cL5/SvT+6XvKcz3r+sbpPMfjCOvfIMAAAAASUVORK5CYII="/><element name="pauseButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAAAN0lEQVR42u3NoQ0AMAwDwe6/YYBncWlUyQFBBX+SickfADM/0k+AQCbJffHfqir3hZ/ADwEAowtQ1mmQzb8rQgAAAABJRU5ErkJggg=="/><element name="pauseButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAABdUlEQVR42t2WzWrCQBSFq1FSaSjaFi1iF6UFtdBdF6WhC0Hoym3BlSAu+wbddSF9xfyTJ7k9gRMJuY2Oi2w88BG5zLlHZiYzOTttiUijyP768Y2bxCKVv0nD+B/T2AY2OAcdPnOKNZtjrdx/KMCi6QJ0wTW44fOKFGtdjrXzEJPml2AA7sEEPIExeCRj1iYcM6CnOoTz2AYOuAVT8Arm4APMwDuZsTbnmCk9Dns0qxbVBj3wAFzR+iRlufT02IOLrqenA/rgGSxE64uUtaCnzx7WfwEtLtYQvIClaH2Tspb0DNmjtS9gxHldidYPKWtFz+hQgAPuwBtYi9aWlLXOPPQ6JgEu2IjWLylrQ89xAVEUSRzHkiSJpGm6C8jqBVSA8RR5nie+70sQBHmjbUZWL6CmyHiRVQAXWQfoRTbapiqA21QH6G1q9KJl5jwkDMPdi6YCzF40fVSoAB4VKqDiqKj1sKv9uK71wqn9yqzt0q/vs+Wk9QeSkdKwXIKzCgAAAABJRU5ErkJggg=="/><element name="prevButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAcCAYAAABsxO8nAAAAfUlEQVR42u2MwQnAIAxFu4EjOIIjOFJH6EiCF8fw7BQZwf5AegkU2tje8uGR5Afe5vH8mTHGZG5+EXSzSPoMCEyzCPd+9SYRZgCFb7MIJNB5XxURT7OotTYFkql5Jqq1TiGBzrvinUj2AMqSSHXHikj3GZBVpH8R9M3j+Tgn8lcGnlSSd08AAAAASUVORK5CYII="/><element name="prevButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAcCAYAAABsxO8nAAABhUlEQVR42uXUz0oCURTH8VKz/BNFmZJ/iMAoEmohlRRI7Yp2Qa0igyJc9Qot2vUGbnwB3yJXPYKaCi5m62LQzSymr3KE09hAi1nVgQ93hnv4wZ259878o7Jte/YXfADPcAvwIeDgFwHMKYFJoDPILw0hREQYCyKMKBZlDCEIvzMkiAhWEEdCxlURRwoZJBGTwOA4SC0nLJMb2MGujFlsIYc8DrCPrIRHZtR3mccSMtI0qTMUcYoLXKGMTxxiE8t6WSHEsI2iCirhDg94RgVDmTtHDmvjILWsBPZwqYJe8Io3vEPXDfJY10ERJGXiWjVXUYMBZ5VQQMoZlMIRblVzHSZ+qkccI62DokijgHvVbMGtnnCCjGtQu922R7rdriXPU3SQ69IajYY9MhgM6p1Ox5R3zbE0l4+tmquWZdV6vZ7hDNIf2/X3T5r17zcM40MH6d/vuiGleWpD9vv9SrPZHDLn2JAuR0QFTR0R0zTLrVbr2xHx7NB6do14drF5dtV6c/n/7foCpva8IJ04vWUAAAAASUVORK5CYII="/><element name="nextButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAcCAYAAABsxO8nAAAAdklEQVR42u3OwQnAIAyF4WzgCB3BERypI3QkwYtjeHaKjGBfIeClFmvaWx58KAg/ks329WqtBbbBW7vMhhowBH2o2/WhLoJTh0QBrw4JfhXKObcBlnMulFJqNwp4uS+HIjjCNKGDZKshhkCYJlRge/ot2Ww/7gSJGQaejWvrvwAAAABJRU5ErkJggg=="/><element name="nextButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAcCAYAAABsxO8nAAABjElEQVR42uXUPUvDQBwGcNvUatOK4kuKfUEERVGwg/iCguimuAk6iQqKOPkVHLr5DVz8An4LO/kR2jQtZMjaIbRLhvOpPOHOJMahnfQPP5IcyXO5S+5G/ngJIRKUpMRvwiEyIAWjPl5rlApIhgJ5YxoykIMJHnUYJx2ylGFHWjAozQdnoQBlKIIBM2RAnsdpBqa/hbHRgCWowBZswjoss30V1nhcYKe6P0w/aAoWYRua8ABncAKHcABHQlaFbz0JY/589YPm2Psxb+zBCzzCLVzBtWAxeIVvlQHND5rnUC5ArXd4hio8Ke2nsAF5OTwEcWJ32WuwHHiDV6XtnB0XIKsGlWAP7iCqXKgp15ewA8VgUBn24R5+Kk85v+EISpCLDLIsS0Rpt9sez+OC5NDq9boIarVabrfbrfE6bmhysoMhtm07nud9TTbb4iZbfn41xHGcD/Xzsz3u88sfsn9jo9HodTqd0A/JoLgfUi4R0zSbrutGLhEGxS2RwRftMLeRwTe2oW21g2/+/6c+AdO5vCABA1zBAAAAAElFTkSuQmCC"/><element name="elapsedBackground" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAaCAYAAAB2BDbRAAAAEElEQVR42mP4//8/A8NAEgDiqk2zfDlcXgAAAABJRU5ErkJggg=="/><element name="timeSliderCapLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAcCAYAAABCgc61AAAAD0lEQVQoFWNgGAWjYGgCAAK8AAEb3eOQAAAAAElFTkSuQmCC"/><element name="timeSliderCapRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAcCAYAAABCgc61AAAAD0lEQVQoFWNgGAWjYGgCAAK8AAEb3eOQAAAAAElFTkSuQmCC"/><element name="timeSliderRail" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAALElEQVQY02NkQAOMg1aAmZn5P4oALy8vqoCYmBiqgIKCAqqAmpoaxQJDJsQA+54Krz/ExkoAAAAASUVORK5CYII="/><element name="timeSliderRailCapLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAWklEQVR42tWLsQlAIQwFBcVKGyEGK61cJ/tXGeVptPjwN/DgQnIQ9xYxRgkhqPceLqUkW5g5Z7g91BYiQq31BDAzxhjmDb13zDnN+/IP0lr7glFKkX3oCc+wAHpnIpi5hlqoAAAAAElFTkSuQmCC"/><element name="timeSliderRailCapRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAVklEQVR42tXJMQ4AIQhEURKMFZZCrLDyOty/4ijsYuJWewEn+c0buGeIGKUUr7XahtZaENHJgJmj9x7vkTnMOSMTkY2w1opMVX/BPxhjJNgBFxGDq/YAy/oipxG/oRoAAAAASUVORK5CYII="/><element name="timeSliderBuffer" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAE0lEQVQYV2NgGErgPxoeKIGhAQB1/x/hLROY4wAAAABJRU5ErkJggg=="/><element name="timeSliderBufferCapLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAJ0lEQVQYlWNgGGrAH4jvA/F/GOc/EobLwAX+ExTA0IJhKIa1QwMAAIX5GqOIS3lSAAAAAElFTkSuQmCC"/><element name="timeSliderBufferCapRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAJ0lEQVQY02NgGErgPxDfB2J/ZAEY9kcXuI8u8J+gwH2chqJYOzQAALXhGqOFxXzUAAAAAElFTkSuQmCC"/><element name="timeSliderProgress" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAALUlEQVQYV2NgGCqA8T8QIAuwoPEZWD58+IAq8Pr1a1IF3r59iyrw9+9fhqEJABv9F+gP7YohAAAAAElFTkSuQmCC"/><element name="timeSliderProgressCapLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAASklEQVR42tXDQQ0AIAwDwDqcPhLQgAlM8JqDORilnyVY4JLDX0iaOgWZaeccVkSEKyv23nxjrcU35pyurBhjWO+dFZDWmqkr8Y0Lr65i67XRzKcAAAAASUVORK5CYII="/><element name="timeSliderProgressCapRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAS0lEQVQY09XDQQ0AIRAEwXa4+iYBDZjABC8c4ADmHheStUAlBc/wb9oOAM45vvfewVrL6WSM4Zzeu3Naa04npRTftdZAkiVNScFTPhkFYuvY2zeUAAAAAElFTkSuQmCC"/><element name="timeSliderThumb" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAcCAYAAABYvS47AAAAwElEQVR42tWTPQrCQBCF84OsYJCIYEQrsZAU6QKx9xheyG4L6zTZs3iInGZ9Tx4iAWHaDHwwvPlgyWY2mVvFGNNf/gmZyEUm0q+kwQI4sBROWf6R2ShcgRJsRanM0UnUrEEFTuBC1FeaOYoF2IMaXMGNqK81KyhuwDmEcB/H8RVV7JlxRofiDjTe+0eclLKGDsUDaPu+91NRWUuH4hF0wzA8p6Kyjo5ZNB9t/hjz9Zgv3PwLzUthXjPT4hqewrzqDfMnQ2tu8Pr1AAAAAElFTkSuQmCC"/><element name="durationBackground" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAaCAYAAAB2BDbRAAAAEElEQVR42mP4//8/A8NAEgDiqk2zfDlcXgAAAABJRU5ErkJggg=="/><element name="hdButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAcCAMAAACu5JSlAAAAZlBMVEUAAACysrLZ2dkmJiYuLi4xMTE3Nzc8PDxAQEBJSUlRUVFSUlJaWlpdXV1jY2NpaWlsbGx0dHR3d3d4eHh9fX2KioqPj4+SkpKVlZWXl5ehoaGpqamsrKyysrK3t7fCwsLNzc3Z2dkN+/dcAAAAA3RSTlMAf3+Sa81KAAAAh0lEQVQoU+3J0RpCQBCA0dW/i02KpEIzzPu/ZJc+7CM4t8e5k3PuYgmX9VNttv2W2iww9gDhe/iK3mZYHhRVIBwe+l9PYQWjzbB/BYB6gdl096ra4WP0PD/kqh25qq4vIjfuIvBuuMrkaURk8yUvGUAiefSU0/5hkJZSPECcZP8J62epztzpDzcuFrDsGN7pAAAAAElFTkSuQmCC"/><element name="hdButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAcCAYAAACZOmSXAAACFUlEQVR42u2WsWoCQRCGE42I5AikkSBaGSwsAiIpQi4BK0vF+qwEjb1gaWMlaGfvA5xYWvgCNraChY0+gU+wmR3+DcPGC0lQrnHg43bvbv5/d25v764uYYdS6voc/MY0AqLEzYmICt3roJlGiRgRJxLELXD+g8hPQDPGHnIAwjiOpHsiSaSINMj8CeRBIwlNBx7RY8Z3xAORJZ6IZ+KFeCXcP/KK3GdoZbU2POLGPIJyOLiYJ96ICuERDaJJtIiPX9JCTgMaFWjm4eHIBRZHWR6Jd8JXpw8f2o/aS5Y8QSRRnqo6X1ThkTTmN1iRKTwfz87o9/sql8updrutTBSLRT63WCzUZDLhtoCvT6dTW8qDR8o2T2OBNL5leJ4WZBMd+/3+y+RwOKhut8vtUqnE92JgfLSiAY+0NHeIDFZo085gI5gvl0s+GjMKPpoq2IOzogmPzDFzl1eriPV6zSI2eAw8c/TZ1M6RAW33R/PtdqsMo9GIRQqFgqrVagy1+dxwOFSz2YzbrutaOeIckOaBZd9sNgro2bFQp9Mx575m5fu+6vV63K7X63xttVqZwfE1qSXLHrjgZEK5XGah8XjM/fl8bsx1nyuBWcqq6DweiNSSCy7wVZMJMNKm3B8MBkac+zCT8CBgLLFetYBNBjefHLnJBG6vu93OP7Wx1pTba6gfllA/qaH+TIT6GxXaD2Q4v86XoPgE1h55oNE1QD4AAAAASUVORK5CYII="/><element name="ccButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAcCAMAAACqEUSYAAAAXVBMVEUAAACysrLZ2dkmJiYuLi4xMTFAQEBHR0dJSUlKSkpRUVFSUlJaWlpdXV1jY2N0dHR9fX1/f3+Pj4+SkpKVlZWXl5ehoaGpqamsrKytra2ysrK3t7fCwsLNzc3Z2dky1qB2AAAAA3RSTlMAf3+Sa81KAAAAe0lEQVR42uXNQRKCMBAAQWCCIgGCGEU3sv9/JpXykCLxB8y1D1OdsEaLmqT6p6M6wKn6FuyWaUQL9zdcW2yuLV49dmTUL2S6gcYsr+IbwgdC7MYj/EoqIoZFHF1PL08QkYNO0MG8wMUw5LoOwCQyG+jWTMuS1iXW1SnbAaDLE32SOX+lAAAAAElFTkSuQmCC"/><element name="ccButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAcCAYAAACdz7SqAAAB8UlEQVR42uWWsWoCQRCGEzUcEhFsQpCzUiwsBBGLoElrp0HbsxI09j6ClaXgW5xYWvgCNhaWFjb6BD7BZmb5HWSXXAw5rnHg43bd3f/fG+f27uE+Qyn1GCa3mMVAnEj8k7jowdwyxKQnwiGSxDNI/Qmsg4YDzbh15/jRwaIM8UJkCRfkbsQFWWhkoOmwh2nqEGnilcgTZaJGvBF1onEjdaypQSMPzbRlzLvBYIl4J9qER/SJATEkvn5hiLl9rG1DqwTtFFId06ZIQ4H4IHwVXvjQLMDDkcJC/svEpwo5oFmGR1JSjD++ptNixGQyUcViUeD+JRaLhapWqzLmeZ46n8+mhAftLKo6cTF1UQB921AEpT2bzdRms5F+q9Vic5lnRB/armmaI+ooBAkI6TvCnYnwaDTitr5ynE4n2YQRA9aGR8o0baAKOXSaRMQOufP1eq2CApqNQNPD4aCY3W4nptS36Ha7emy5XHL/R4JNkd79fq8uVCoVLez7vu5Pp1Pd73Q6qtfrcZuvemy1WskmrzQC0yuFdL1gPB5rERhJez6f80ak32w29QbxHxumdiFZj8z1gu12KwUD9EYwzuYwk43xGsPUfmSswwGTwyLwcJBj8Hg8+mEZklbgMRj9gR/9qy36l3j0nyuRfphF+wl69/ENcVv6gzz3ulwAAAAASUVORK5CYII="/><element name="muteButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAcCAYAAACQ0cTtAAAA30lEQVR42u2UzQmEMBCFtwNLsARLSAkpwVJSwpZgCQEv6skS5iieLCElzL6FJwxCDlllT3nwkb8hXxLQV01Nzc/Z9739l8gBBRE0j94AiBk3oAceJCCPCM2GauY6zh3AsR/vit5AT8zzBbZCoWdNWypQS0YmQM2tekpDkWzbNs1xqRMQwGraMtk8z5rD1k3TJJgLYF2WZfi2oEw2jqPm4HoHhHMOJNCDAxTLnGHIyALXhRLPmnsfOU+dTpkRJooc+/F1N/bpzLjhITxFAp77i1w3440UxALRzQPU1NTk8gF0y3zyjAvd3AAAAABJRU5ErkJggg=="/><element name="muteButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAcCAYAAACQ0cTtAAAC2UlEQVR42u3WPUwTYRzHcWmBFnqKBYpAHVSQoEB8QTQaiMSILhgDiiFxUBMSlUETnYiDg9GJmDA44OCgo8bF18EFibq5MEBpeUsDIaVAm6P02qTUb5N/k5P2oNg46ZN88tz1yT2//p9e77lt/1u6Fo/Hc9L5GwEmmJGrY4bpz0JlcoOAPFhRCAU2FMAi46YtBa4LyEM+LBKwHSUoh1OUYaeM5yUDtxpSAAVFKJZJd6MGh9GEY6jHXjigpAQaBskySQWlcMpE+3FQJj+DDtxBN9pxCjUogw25yEkJEWbkw4ZiqaBWJm9GK86jEz0YRKKNok9Cm1El11th/i1QF2TBDuxCtYS0oQv3MIObuI+nGMIwIljAQ1xGI5xQINWlBhXBiTqclgtv4xXCUsUTDOADotAwIsce9OIsqmFHPkzJsORvpKACDVLNNfThJ/TtBb7ADRfCEjQm4/3okHkcyaXU3xAW2FEtFW3U3uAbVDn3IQYvQhjGVTSiHIX6MDMK4EA9LsRisbgR2jt8wg/OtbW1NZU+Qu+nX6T/zth1nEBl8q5cH1aGQ+icmpqKG9GHeb1ebWlpSZ2bm4v4fL7A7OzsIn1GYQ7Uod3lcsWN0N6GQqGhyclJNXG+srLic7vdseXlZa/H4wkRnLKMRr9ZFVr8fv8jLh4MBAKv+fbudWEvCfs8Pz/vUVXVRbXaxMRENBgMjiXGV1dX094g6e7GcqmuFVfQiwcszfvx8fGwhPXjGYEf+SxKNRqhI4nj6elpw1vf6A9dgRo0yUWXcINv/piJvRzfRV80Gh1gBb6yAsMERahugc82/FOnC1RQonvYHkELzoXD4S76i+jGLYKeJ6qlolGCtvC4gv5Jr9tGKrEPB9CAoziJNnRqmtaz2YM40+3FCgV2OHT71x7UStXH0ZTJFpNpqEWqtUnFRShFxWabZ1bvHLpd2yrhijB4LcjyXSSLF56sw4WE/HPtFwoiecfnKRGcAAAAAElFTkSuQmCC"/><element name="unmuteButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAcCAYAAACQ0cTtAAAAk0lEQVR42u2NwQnDMAxFtUFH6AgdISN0hI6UEf4Oxgdvkas9RUZQ/yEBYdChgoZC9eCBLBs/SZLkjxlj3Ol2RehJd6rfDq1UT81eKcwZVCMB9Zw/p7CzfErvXT2ndzB3kAitNfUUQ60V555zLFZKUU/zBscOdo7EFiOcmFLMcQli4y+6Bz4LBx90E3JV8CZJkvwsb8qa9F25tXYIAAAAAElFTkSuQmCC"/><element name="unmuteButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAcCAYAAACQ0cTtAAACOUlEQVR42u3WS2sTURjG8ZqJuTSJTW1T26YqrWmN1jt2ISpWTb1ABS3iRkS84WUndlNQFN34Fdy5d+U36MJVQVroKgnmvgqBZBV3Gf8DTyQMzMggRZC+8CNnJsn75CRnzqRvu/6/Mk1zRw8fwBhbEeSDAT92ih+cU7D8dYiahxFFTPoR1HOG+Fxm7h6kRiE1H8Y49iKJEcQRRRghhQegmTuFKkQMBBDBbkwgjVOY0+Mh7McoEhjSa+OIIawehluYgSB2YQ9SOI0MbuEFfuCizs8ijYOYwRSSCo8g0J2hU9AAkmp0AbfxDJ/RhlV3sYgFZPR4GedwApMKDMNvD+v+RlGM4aga3McKvqO3XuKhxt/wFI+xClOBScTU12dfEEEMIqUZudU7vMKajjewrvGqZjiFOAL2MANhJHAENzqdjumE+ojXeMvxJkyxAh/hEqYxiKBT2AiOY6lQKJhOesNqtdpm93y1WvUUlsAsFrPZrOmEeo/lcrm8Zh1XKpUNxuvWuFgsun6N9t/sAM43Go0PzWbzU6vV+sInztvClvHEGpdKpd8LxArinPMCsa9GjGp287iD51ip1+tfc7ncTzV7gJu4igVc8bL07Rf0GGYwhwyWcI9Zvsnn80XG13EGx3AYafzxonYKjOoNE2pyEmcx3263r2nLmu7ZJ4e9b1ew7fQxhY5jUgEp7FPIAPq9bcTut5cQoohjSOKIIKjGhrjeYryEBhWMnnuZ9+buoaJgUcjW/xeRvu36F/ULlStUoyVtQSYAAAAASUVORK5CYII="/><element name="fullscreenButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAAAbElEQVR42u2R0QnAIAxEu1lWc5/+ZYKs4TTWjwS0qIFrP+/BkYMLOdCLELKn1tpG5TleYF2yyMUzvCAOZDtwgU85PJGE/+NPyuTJG1Uts/9+sI0+y6GCrtunLHKJHbjAZYcd8x28IJTmhJAtD4gEt9ueDIktAAAAAElFTkSuQmCC"/><element name="fullscreenButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAACFUlEQVR42t2W324SURCHhS67VCoFbYhRkbQsaCwVSwgUaZP2yia9Mb6MN41vYfpIfYIm5QIegJfA3yTfSU52c1i98KabfGGYmd+cPX+Gw7On+2w2m5JPUfxfC5dhB8pQKooXvjGCiohFFRJ8EVTwVSHGtxOckSuOsCb2xUsDe0/swl42jiZxg2wr/kK0REf0DOzX4hXIzsVbaPODsH4VUSOxL8biwsD+SCEhOx/vo61Rq5zd1JipdhBkn6k4hmk2iKZDjdhtuj9Awnqm4twTPopf4lKM4BLfo0tCk1IjCQ3QFF0xR+QK/BBXYgxX+PycOdpmaAC3RG1xiui7uMWeic8ww3dLzgZNO7tEoU1OxYhpX7Dmd+KDgT0ldk5umt/k/DGtioZ4y/E7EUMx4JQcQR/fkJwemgY1OKbhAd6wnscU+ESRQ+jhOyGniyY4QFlE4rk4sCKIJyzFaLVa/XaNhT0iNiH30LTUiEJ9UGeqg8ViYRv3TVxjj80PY3zXloM9QFvf1gcN3mRiIr3pvX2u1+ufHMMvMDefn2MatI2iPjgSZyYylsvlg77fiK/umGLfWMzlmQbt3/UBQoc7530IxLf3QeT3AYIZbzbE9w5SfGfknGb6IAr1Qez9XL8XXabdxtc0sNvEuuS20MZFd0LsXThNqOOrQg0fcS6cXPHiKzOB2L8yg3GKG4WXfoBSUfz//W15ss8fvEcYMYnLr+AAAAAASUVORK5CYII="/><element name="normalscreenButton" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAAAbElEQVR42u2Q0QnAMAhEu5kD588JXMNpbIUEpCBpe5+9B4JczF3MQQjpcfeBz+4vxpMe2ULSIF9YjaqWM+hXWRrdA2YZah61Wv2/qGrU6nQkQK6yLmCeCbzFCmk02FxWX/WyYXw1H69mCSEtJ16St50Fqd0HAAAAAElFTkSuQmCC"/><element name="normalscreenButtonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAYAAAB75n/uAAACDUlEQVR42u2Vy0ojURCGZ9Kmk4A63cYLMhdE28tCECUgxCuzGBDc6AgO7uYizKAP4NKNb6S+g08gSZO8QZ7h+Bd8ScDDIZmsLfhIpc7/V53uPnS/e4uRwjn3vsto2sHiggdrw2iGaT4miiKGEhShBDEU8YSH9Jr3G4yLSZGID+Q9qCXk0rIBhoSaj4kyxlnxUXyBz+ITKKcuDdoEb+9KQrufEHPiXqyLLVETmwDUpEE7h7cYGhBxmQk72xAWR+KY/Bs4akfkG3gSekTebaJYFlWxKLbFDQ2e+P0BvRqabTxVekT+M+gPmBKZ2BWn4tn146czCNa+o83wlkNXUGAxRVx3fvyC11HHk9KjQFtvQIxoSeyIE/Fb/BWX5EK5auQnaJfwxsMMyMSeOKPZVX8IzVUjP0Ob+QP8Y1rhPq6Kg2az6Yw8z12j0XCKf4blVuuum9Y8eCvBY8ritFgTXzudzl273c4VzlBcG93/tmYa05oHb2XQMZ0RK2JfnFujVquVs9M/huVWY+g52hXzDjqmJe7jgqhZI+3wVvkFA04N8gtbI6/hSekRhV4VMS+vee3uAeOeOOSs1w3yQ9Zq0j6aB2/sPwP/ZTeFYUEsc/mZWISM2jKaeTzeyy50FWV2k/LgquQJpNSmySfxeLsPfnAQlzCC1dgAoInxDP9Vg8gAauG1//82I/ZM1DztW4wSL9xQTRdfTNL0AAAAAElFTkSuQmCC"/></elements></component><component name="display"><settings><setting name="bufferinterval" value="100"/><setting name="bufferrotation" value="45"/><setting name="fontcolor" value="cccccc"/><setting name="overcolor" value="ffffff"/><setting name="fontsize" value="15"/><setting name="fontweight" value="normal"/></settings><elements><element name="background" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAA8CAIAAAAok0etAAAAJUlEQVR42mNKTU1lunnzJtP///+ZGBgYwDQ6xiVOrhw1zSNRPQBu5Zagca3K1AAAAABJRU5ErkJggg=="/><element name="capLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAA8CAYAAABfESsNAAAAnElEQVR42u2WvQ2DMBCFv8I1M3gjMoTpMwqjkI1S0RnJEhaiuZcFEuyCBCnyqz+9+9XpHMAwDD0wAp4PciGEXtK0risxRvZ9fw+a2ZhzZp5njuTMzC/LQklOEtu21YGSyqCZ1YHfcazR1Tle6FjVnr+q+vz2XJxjW4p2Utr2tFn/OvT5s5b0BHwJdmZ2Bybg0NmllB5d190kHb5cL8J5WhbWZJeBAAAAAElFTkSuQmCC"/><element name="capRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAA8CAYAAABfESsNAAAAmklEQVR42mNKTU39jwffB2J/BiBgunnzJgM2/PjxY4bPnz8r/P//f0NKSoo/E5DBgA1//fqV4enTpyDFDP/+/ZvAxEAAvHnzBqRQAaeJMPzz508wTVAhDBOlEGg1LUxkIAIMtBsH0ERigmf4+XpggodGbhxNFKNFymiRMhrXA1Gk0D+uoQH+gIkIRSCrC5gIeOIBkA74+PHjRgDhswBcaL43lQAAAABJRU5ErkJggg=="/><element name="bufferIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAQAAAAm93DmAAAFy0lEQVR42oWXy2sk1xWHv1vvR1erNeqWZ2TFiSQ/ZI2GMBDygsRhTIwZgg3ZeeFV9lnlT8giS/8BhqxCICYJ2TgPhzEhYLJQFgMT2SN79JhoMq1Hq7tVXV3ve7PoktQjd8sHCpq6zVfn8TvnVAkumRLnPzV0LFw8XCwgI2ZITEaJFIqJZlxCneEEAg0bn0Y8176eB2CG19tuhx4DUpRiMtIYw40gooJqGHjMHi5urzt39JZgeHRwb/nBPJRIFOWVHqoRzEDHQKvOTGpxc/uW+zNnzUcQoy9vvx/EbkxKgWS6h0og0DGxcbAxERRIdIKDBfeOszZPgCDmcE2+3n68dMyADJSYFLRx7p2JS0B9a34YCGEMb3aQ+HJGb/kEGIBPQLyUB1joiLXGYx1FwmBSyAIDm2DY2ljVX9WXoXzy8db6f1tSM8V5UkGghwB/t36x0iYfBR2xj3wWKNDQcahvrNo/Mr7joZPcSlYffPT9XTsbnCTE+EDKkPy4FvaK9xaGWZ5XBJ9FHl8A9Sp/NrWtr8Xftl5v0STAFqqhiqx94/TpQC1krZKYHtFm+PsXtz7IP9E7RaLiswxaJGSXQ9Yxh4G+7FHHAmoqE/ELHe+lg6WHX/y6fC1tqqDYHt5bfuAe/9PtFZHMxgviXGTyQthCCNDPNaODoQqi2d6tk6c7eYByw5faboferugY+ZQ+OcshSHIjKp8k6wk+UBAruW+dEjJ01NIhJuqs9XpG1sjUMx4mX+4URXHz6ONPk1c6Sym6ign7w/vrbQYMKBAIFJKcgvzW8aafaWO4bFw6QmlomKOubV/fXHVv21/HlPvx/dbm6i5dIopKFhKFRKJEnefQK0LJHuk40MDAxsGjhp/4O3PdQEo3Wmk3OvQZkFBWQDW6hAJMrmEDIf1xFYJQNjZ+P9iaLwLLDNQLoZORkVSjKqn8U6M/f6kGGgEmkBOOwEIF+FvNf78ys2bXhC6j5PPbO8+fEBGTkI+GwLTZh80i1nkm90nBwOoFGy83f+Dd8IUgFdq1f+Vv9IOclOIrcNoYDiwW2UFqmJtzM2vejRYt1VJNVXvOe3mzXlVVwlQcBGO4ETIAAyNxzZqHjwF4KmEwN3TQERe5m2LmpDuVnsYnColSqCtRV5hG4cT5ICFBVc2QDdyEEoX4Cmg+6Y5Gvtbpb0ZPO5zQEx0RtvsPb3arAa9dCQwvZkxV5xAMskb4ra0N8rUoEE5+cvrZd3fqKQqdEjV9uwGS/UuykWfC9nrBw1bma1pQrHT9mISEjIyC/ErhTBS2gY6NjYODGZob9T23KN3oe4fLAxIyCqSQSlwS0BWtpyEwMbBxP2v87RszC1Zd09J+/+nSzk/axOQUVXEu2m9m+nAwUECBRgl/Xphfqc066Cp1rcauejRYGe1fdY5UijXz0wsc6CzyaAwolBKAQnxU9+e9RkP5CDKEk9345GBlQHHmW9U7cu+aZTwzXi1qz66A0aF27DmBjYsGWHg49Y6HgfmF8buga0KQvd37Zk5pOsXl0kzcKUqq8ccKkKVC/MP7zYI7YxlwlP+qe3fv3YGrlQKyK9++FAo5F+10k/mYUcgxcf/58Ej/4+J803UsBTm+/SG3P38x+o93CTe2U7Tz7BRvdvP/hftdTuhyQq93sP/Dk3u+2/CdgDoz1Jlxm7N/mPllKEpLjOGi8Z1igFBKIClI39n+LcOoNiuITsODH+/OJU9cXbexlQ7Y5NTs0HpN3Xn81wXLrLyM2J8UsqQkaw1+/vAvhx0floZv9MhRqSykHJtEUgJ8kPKoUc8MYMhwQg6FUlACkuLNFA1GAkFoSZJnKsMGCjLivJmNVNHvTevFqmFQlBRkJAwZkpCSk7/VOzg5jUMGRIT04qPuT/uV1KfYuWyEUiO/RrNWAQLxanp370Oas56paVF61L27t55Ne3c9l9u4KXHpVEe/b/6pEVoXwqa8av4Iplr1VaChoVVejzKrrlpd/wdqZ96EzbsuCAAAAABJRU5ErkJggg=="/><element name="errorIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAACL0lEQVR42u2T64nCUBCF7SAlpIQtISVYQkrYElKCJaSElHBL8LfPKD7wyUXxgYrOzkCyHC6b3LgasywOfBDuOTNzcklq73rXfygiqjMxk1YsZ38lXIOyq1F1OI/s5VUZsAlBNOMlaDhvVhXOZ7B80D4ztNeV+VNY9VdUzg3VM/5srM9XhXOMb0zleJXxjTqlB7xer8HtdiPAy/KKhl7pLTXc5XJxGc1QggJNIXgOfs24pQU8nU4hQynn89kFjZD0XDyGFpYS7nA4uMfjkYAQddQEQwtRk1lPD7jb7SKGUvb7vWvoTdCbqIkXNCF6arjNZuNtt1sCAtPDZwp09YMe4AyZ+bSAWmvFUILm4Y7Fo0xderQUep5Rq9XKW6/XBAQ/+fi8AZ5GhicwZj1+i4vFIl4ul5QQZ/lYC8AX5Pi+58nsh8LNZjOfoZT5fO7neAPwZgaUGeIB/F+Fm0wmznQ6jRlKyH1b1uvgred5zbmy6+6Ao9EoGI/HBHh5ftF/6SXZdVe44XDoMJqhBFWgxwO/V8CvwK+Z4rfY7/eDOI4JsC4cDAYO4yVYl8lM3CE7C4XrdrsuQym9Xi+qlVQyW3YArrWp3W6HDKV0Oh1usler1fLTHnku0iOzxQ+EtiUfDAHYYOsl5I6+0Oj9yDNHYNSM84KADqOhNyq65K5fX/wP9tpfznrV9kWu7dbtn1bxgCHj1sorfKmwaEDFUMUo21XrCsNpyVD4yl8GflLvetcfqy+dCCa6ODMoXAAAAABJRU5ErkJggg=="/><element name="playIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAArElEQVR42u3YywnAIBBFUTtJaSnFUqzLhVjKZDZmI8HfGx3CPLj7AyKIjoic5pwBDWhAA+oBei5wlxMYClgGh6KBcKgUEAaVBi5DdwGnobuBw9BTwG7oaWATqgX4CdUGrKBagWX3MjCl5DmSKOe8Dowxeo7ABQ5zxGDgC4NdEhCwgmkBfsJOA5uwU8Bu2G7gMGwXcBomDVyGSQFhMDQQDkO+ZuxnwYAGNOAfgQ8LTbXBn1RvGQAAAABJRU5ErkJggg=="/><element name="playIconOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAACJElEQVR42u2YS0sCURTHNc3sTWEPelMQUQQtKnptIojosWgdFLTIFu2qdZ8i6Cv0BVq3KUi3IqgI4hN0rS5v/xtnahh1Gqd7Z0bowA/EWcyPM/ece+9xMcZcTsbVcoJ6gedul4VhSJBLEW0a3LKFdQVVYh7gBT7QQfjoP48ia5egh4S6QT8YJPjvHuAH7bJEGwpq5PrACJgB88QsGAcBet4pQ1RPsI1eyLM0ChbABtgD+2AXrINFMAWGZIg2ajNKQfDsDYA5sA2ewRt4ANfgDByCLbAEpkWL6gl66CXDYBmcgBf2E1HwCG7BBTiWIaon6KXCGANrlK1XVhtx8ATuZYgaEZwAm+ASvLPGkZAh+psgL5BJWn9X4IP9HkJFjQrugCAIMeMhRLQZQV61YdZ86Ikq7amXGr5XK2mFYCPRI1rbi/QOvjt1UTa/Ja0U1IregXNwAFZpZwpoJe0QVLcn3kdvwCntUrOUST+tSVsFlYjQzsQ3ghXquz2URUcIKvFEa3Kaqlv5zMYFi8ViOJlMMhmUSqW/CxYKhXAsFmMiSafTkXK5LOYTixTMZDLxSqUitkhECEIsUa1W5bSZvwiqxOQ1ajOCdcSkbXVBCIYEiQk/LHwdt/L5/IdVYqYOrBB8t0rM1JE/l8u91msXMsRMXZqy2eyLqsFGqY/ZdmmquXZC6jmVSr1R57fv2un4i3tLjD4cPzxqifGb4weYjh0B/0/5m+QT3Dh1BNFdpj4AAAAASUVORK5CYII="/><element name="replayIcon" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABxUlEQVR42u2XwY3CMBBF0wElpARKcAkpISWkhJRACS5hS3AJnOHAwoEDB2QOHJCQmP2DcrBGycZ2BtiVMtKTEGLe/NixJYq55prrxUVEBjSgBStgu88NMJ8KVXZBPI2XBxaU7wi2AJbyy7LjVeGWwNP08uzSDlcDPzLUCcZ+X79j5RyofumtgNNeSfnO+QG5SfCYIc+kd3LgQKxzpNzT9cqy2VfJ4BPr70iptXpG42JXWcXH4+EBBbhCqdgl3D5JcL/fDSBBpRWQXT3++N253W4NoABfKBc7xYwmuvl6vbaAApx2QHaKGW108+VysYAC1AOyU8yID3g+n1eAAtQDslPMiA94Op1aQAHqAdkpZsQHPB6PDaAA9UPCTjEj/pAcDgcDSJB1zez3e9Pjr3r8Jkm82+08oADe5lSH6Xqt+N4Jd/oObbdbCyhks9mYREcd9D9DskN6gU0OCFEJSODBIsGxEv22c5Ag7/9KJyTBV0K/AzSCLXKLV6vnieuEftkr+RY7khVyGQyqJ74iEp0/TxBVTGKPedX2aj1UC+jPhuTDBEgvpH7AdUJA/4GAw2GAAy2oNQ7KlEt+DWwXxoBFMddc/6x+ACbEv+zn5grUAAAAAElFTkSuQmCC"/><element name="replayIconOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAGZklEQVR42rWYTWxUVRiGoTPM0LG20IEypUCKTX9IhCK0iqAVGtQAIUasAyaAWkaJJlZMhigs8CcaEhdSdSNx0bhRFrqQjS66BTFGFiSFgC2/bWkhQIFSZ4pwfW/ynOTkwO3l9yZPAnfO+b53vvOd95zpuLt9PM8bb1EgIhB1iECBPWfcw3psUQiYIOKiUCTEIw4JPoszNmqLfRjCIkYUyYtFqSgT5aJCzIAK3pUxppg5RmzkgQh1KjZRFJEwJSpFrZgnGsQisRgW8W4eYyqZU0qMiXZF70dcRMRYslKqUyMWiCaxUrSI9aJVZKCVdy2MaWJODTFKiRkz1bxXcXGWJyWqRaN4QaTF2yIrOkSn2C8Oii7+3clnWcammdtIrBSx4wEiQ8VNFCV847limVgn2kQ7QvIi7Mkztp2564g1l9gl5ELkHVaOiTPFfLGCpdspjoh7fY4QI0PM+eQosSsZtiFilH4GAVaJd0UH1bivhxgdxFxFjhnkjAVuHARGad4US7CCQL+JfEjSs6IfzoaOV0xiryBXitxRBAb2XZLd1iwyIZUbEHvFJ2KreB+28m6vGAipZIZcNeR2+hGBGGgR5W6kmXcGiBsVv4odYrNIYyfLYaVI89kOxo4GiNxJrkZyF6FlvNt7cfypFjtoC9gQQ2K3yBK4GY+rE1VQx7tmxmSZMxSwcdrIWYuGuOlFu/cSopzAa7EF9xkl0QdiDSdGNfOSogSSvKtmzBrm7A6oZDs5FzAvYXrRXt5ijqQmjLXLjcJSZUnYKGYjpohvHYM475KMaWROlhju00XOJjRIC8vsLG8d/ZO9efNmTngWA/TTOqoymzmFBONqJbhY8FkpYxcxd4cfy4mdQ/xKUWcv8ziCFXLzqBctN27c6Lh+/bpno3d7afpmli7JPPfQdy8ZhYytZu5mP9Zt4nf4udFQxryIEWj6r0Fs0ITOXC7nWeSxjbTpE2u3FYQYv3GH6cxN+7H8mHYOP6efGw30oQRa5lzBMrRqwv7h4WHPMDIychZvM0uQDDma3Crir7SQYvkx7Rx+Tj83GiqMaRuBxv8Wi4wmdA0NDXmGK1eu9GHAy7GRSeZYCrt5O71YLZ4XW/yYdo5r164dwLQXGz8MFKjJBy9cuOCBHyBYYHDV4ggrwnqmWR67RTH77RxXr14NFugu8eXLl/cPDg564Adwltgx09tsDERNFeUkrKIHXxIf+jHtHMoZtMS3bhJ9u86+vj7P0N/fbzbJq+IJxtoHu3ueT0JUragn7tNU7w3xhR/TzqGcQZvkVptRuTtOnTrl2egb+jbzlnhOPIYIU0X7qvYoFZgnll68eHE79vGa2CS2q4V+d+MrZ4DNBBj1iRMncsePH/cMZ86c8Zd5m3iZICmRsHzQvQ0tu3Tp0uea61fob/3/Yy4G3/X29p63YytXoFEHHnUS1HXs2DHPRsuwhz551jqSYoiLIjhFG7xy7ty5PWauRPXo3c+q1J9uXOU6zCHgHnXBlwX51K6jR496NgqWy+fzH+nzF+2bhznaWN5ZYololai/7Pmq5HnF+M+Nq1zfcAwudC8LY1233jt9+vRhN5iW4xBLMcdcMAkWoy+rsKM2je1jXiCq3j84xConJg4RfGFNj46OfuZXzQ44MDDwAwJqxGQRt08LkqwW2zQ3P5a47u7uER1x32vsO2Ipl4oSx2Mdi8Dx2a0btOPalehfBfT96kes5imW0vRg1HGCtJbt27Dq6fTYp7G7RCsGPZM24UYd8KMJ15+DyBY1+9c+3OmeoXpTERW1e5jqb/Q3VJjAXj0a+5UlcFaYQNvLUghp8EXBQqo7zbrNROzjEkPeJCM+gJAxUZ934a/uDi4Y8+8xJJyC6VZChblBW/ZSYAmcyQ7OnDx5shsRoWjsPusAcHowWOQE+7CHIucGTdWxGAlkqd7s6ekZRMCdMMwXqwwT6C63ERoDhHG8gVXBCvOTNUiMv7NlP/16/lBf/6Ij9FNsq15Mt3923tWfel1RDHONfpp4XDt/IzbSpx47JDH7tGl+km196Z/FXN0yYi2eu5DqTXZ+uN/341rUZBIt4GLawg3ldbEei1qNjy5BWB2tUWqf7Q9WIH2IRSWxizmcyU9Cg6jnfRVjyhlfbHrbFfcwRCZo9ClY1XQoF2UImsSmSlD52IOtXPiPpBiJEwF/9TcbLupuOjfu/32eYAv3OqcpAAAAAElFTkSuQmCC"/></elements></component><component name="dock"><settings><setting name="iconalpha" value="0.75"/><setting name="iconalphaactive" value="0.5"/><setting name="iconalphaover" value="1"/><setting name="margin" value="8"/></settings><elements><element name="button" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAA80lEQVR42u2WQQqDMBBFQ4pQeoVueiN7BtG9R+lR7IlaAllnIZaCxHR+KWLpou7mCxE+Jm7m8b+TiTXy1HVdim5N0yQNoTYYwGKrqiqnaer6vj865x4aQm0wgMXGGC/yYfTeP4dhiBpCbTCAxQrZKYQwppSMpsAAFgAZJiGy90LbITCAhc8hBneWLs2RMegrMgZ3ZodYIuP8qSnbfpmhln66jO5gpOsyhsh4HaI7qfMs29Qsy5H9iyxfYddMe8r7EFWX5cg2FVkeritO6rtsCoILWgEWONRiY4zZy3unoU9tmNLaEMJVFmeRl48HDaE2GMDyAjEWKwKFLBqcAAAAAElFTkSuQmCC"/><element name="buttonOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAA80lEQVR42u2WQQqDMBBFQ4pQeoVueiN7BtG9R+lR7IlaAllnIZaCxHR+KWLpou7mCxE+Jm7m8b+TiTXy1HVdim5N0yQNoTYYwGKrqiqnaer6vj865x4aQm0wgMXGGC/yYfTeP4dhiBpCbTCAxQrZKYQwppSMpsAAFgAZJiGy90LbITCAhc8hBneWLs2RMegrMgZ3ZodYIuP8qSnbfpmhln66jO5gpOsyhsh4HaI7qfMs29Qsy5H9iyxfYddMe8r7EFWX5cg2FVkeritO6rtsCoILWgEWONRiY4zZy3unoU9tmNLaEMJVFmeRl48HDaE2GMDyAjEWKwKFLBqcAAAAAElFTkSuQmCC"/><element name="buttonActive" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAABD0lEQVR42u2XQQ6CMBREm97BeCnjIQjcxLt4KVckrKuphYIC/jEtKRu3fxaSDGlh0ZeZ/2mxRq66rs+iW9M0bw1hbTCAxVZVdVqW5eq9P7Rte9cQ1gYDWOw8zxd5ELque4QQeg1hbTCAxQrZ0Tn3XNd11BQYwAKgkUmI7DsQyklTYAALn0Nyi4lyVBZciltkDNpFpu3QrqizZcoiLeqi7dUj2xxKFa6q/C3idIiyywgiI3ZIBi9th8BQdhmFdl3GuJepn4fy8eMf2c/IEtBEENnEu9uz1BBvlzFGRvHXwRmZUMU0icpCUUfL4E7pEhwayvOIllLbD3DIY2KMUSvsvDZYrHPuLYM+v9BQgunB8gFJekgEq5c0PwAAAABJRU5ErkJggg=="/><element name="divider" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVR42mP4//8/AzJmIF0AAHImL9Fd8LZHAAAAAElFTkSuQmCC"/></elements></component><component name="playlist"><settings><setting name="activecolor" value="bfbfbf"/><setting name="backgroundcolor" value="262626"/><setting name="fontcolor" value="999999"/><setting name="fontsize" value="11"/><setting name="fontweight" value="normal"/><setting name="overcolor" value="cccccc"/><setting name="titlecolor" value="cccccc"/><setting name="titleactivecolor" value="ffffff"/><setting name="titleovercolor" value="ffffff"/><setting name="titlesize" value="13"/><setting name="titleweight" value="normal"/></settings><elements><element name="divider" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAACCAIAAABANcwGAAAAKElEQVR42mNhGPqAmZmZiYkJQsIZuLgsvr6+Q9q3/2Dg79+/yAxcXADiODDtLQ68BAAAAABJRU5ErkJggg=="/><element name="item" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAAMElEQVR42u3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAXA2RQAAEB5C4HAAAAAElFTkSuQmCC"/><element name="itemActive" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAAkklEQVR42u3QsQkAIAxFQQsHy/4LqYWohYW9IAj34ENIeTkiRvq7vlb3ynHXB/+Wk64CCBAgQIACCBAgQAEECBCgAAIECFAAAQIEKIAAAQIUQIAAAQogQIAABRAgQIACCBAgQAEECBAgQAEECBCgAAIECFAAAQIEKIAAAQIUQIAAAQogQIAABRAgQIACCBAgQJ1NmcoiAdM9H4IAAAAASUVORK5CYII="/><element name="itemImage" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAAAAACpLjUBAAAAeklEQVR42mPiJQswMXCSARiYGFjIAEBtZAEmRnJ0MZJrG321jfpt1G+DzW8jMUj2lzMwlO8n2W87PMrLPXaQ7LfOHR4eOzpJ99vLe/deku63eItDhyziSfab5fGFC49bkuy3jIUMDAszRtPkaDYd9duo34aT3/6TARgA1wJNszqw3XsAAAAASUVORK5CYII="/><element name="sliderCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAKCAYAAACqnE5VAAAAEklEQVQ4EWNgGAWjYBSMAnQAAAQaAAFh133DAAAAAElFTkSuQmCC"/><element name="sliderCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAKCAYAAACqnE5VAAAAEklEQVQ4EWNgGAWjYBSMAnQAAAQaAAFh133DAAAAAElFTkSuQmCC"/><element name="sliderRail" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAABCAYAAADAW76WAAAAEElEQVR42mNiIA78J4AJAgCXsgf7Men2/QAAAABJRU5ErkJggg=="/><element name="sliderRailCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAECAYAAACQli8lAAAAJklEQVR42mNgIA78J4CpBu7jseQ+NS3yx2ORPwOVgT+az+6TYgkAKMIaoyp3CGoAAAAASUVORK5CYII="/><element name="sliderRailCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAECAYAAACQli8lAAAALElEQVR42mNgIB74A/F9IP4PxfehYlQF/kgWoGOqWnYfj0X3qWnRfwKYIAAAPu0ao3yGmCgAAAAASUVORK5CYII="/><element name="sliderThumb" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAABCAYAAADAW76WAAAAMElEQVR42mP+//8/Q0NDA16sqqr6Pycnp6G0tLShqqqqoba2tgEEGhsbG6CgkZAZAEhcK/uBtK2eAAAAAElFTkSuQmCC"/><element name="sliderThumbCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAECAYAAACQli8lAAAAUElEQVR42q3NoREAIQwEwHSYJjOo1IBIDfEx+EgEDMfLVwyCbWDphoig1gp3R2sNmYneO+acWGuBXimlxCEKekVV+RAxvWRm/EXxi2KMcZ1sxLJpnEUZrv0AAAAASUVORK5CYII="/><element name="sliderThumbCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAECAYAAACQli8lAAAAUklEQVR42q3NoREAIQwFUTpMk0wUNSBSAz4mPhIBk8/JUwwiW8C+8pqI0BhDzQzujjmnrrWoZNZao947Pgg/CHtvREQexsx6gTQNqrXiAuHlcQDl9mmceNYnwwAAAABJRU5ErkJggg=="/></elements></component><component name="tooltip"><settings><setting name="fontcase" value="normal"/><setting name="fontcolor" value="cccccc"/><setting name="fontsize" value="12"/><setting name="fontweight" value="normal"/><setting name="activecolor" value="cccccc"/><setting name="overcolor" value="ffffff"/></settings><elements><element name="arrow" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAICAYAAADA+m62AAAASklEQVR42p3KQQ2AMAAEwXOAi/lWSqUgpZIqASmVAN+GNECYZH8bHDhfOoLyYSxJEuwP054Z+mLqucOGMU0DW1ZQp7HmCRpa/roABHU6b1RN/woAAAAASUVORK5CYII="/><element name="background" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAADklEQVR42mNQQwIMxHEAuXQHISaBGr0AAAAASUVORK5CYII="/><element name="capTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAADklEQVR42mNQQwIMxHEAuXQHISaBGr0AAAAASUVORK5CYII="/><element name="capBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAADklEQVR42mNQQwIMxHEAuXQHISaBGr0AAAAASUVORK5CYII="/><element name="capLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAADklEQVR42mNQQwIMxHEAuXQHISaBGr0AAAAASUVORK5CYII="/><element name="capRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAADklEQVR42mNQQwIMxHEAuXQHISaBGr0AAAAASUVORK5CYII="/><element name="capTopLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIElEQVR42mNgAAI1NTV/IL4PxP9hnP8wzACTQRb4j4wBSrYUAF5mO7QAAAAASUVORK5CYII="/><element name="capTopRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAH0lEQVR42mNQU1P7D8T3gdifAQSgAjDsjy5wH13gPwBoAhQA/dBvkQAAAABJRU5ErkJggg=="/><element name="capBottomLeft" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHUlEQVR42mNQU1P7j4wZgMR9dAF/FAEQgAqCVQIAxzkUAKo9yiMAAAAASUVORK5CYII="/><element name="capBottomRight" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAHElEQVR42mNQU1P7j4wZ0ATuowv4wwTugzlAAADkhRQAhODqdgAAAABJRU5ErkJggg=="/><element name="menuTopHD" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAYCAYAAABtGnqsAAABKUlEQVR42u2WYQ2DMBSEcYCESuAHAioBCZOAhOFgEiahEpCAhEpAQtcu1+TSwSDbfrDtvuQFWtpHe7lXqCohhBAPDMPQxBhjhBhzjDM9O3MbfWmspfYVc82zeegPlCMUkfpc8f4aa2qOKl5eYI+2iTHlTewU0Mc4bQnPAq6No/UYtN1SniMJmDbuFhzp9wgYr11yIO6ndwWknPd3cM6jCrhValsCJod0VMrduwJS3nDY0qWF9tlB1Gf2OBDlVp5j7kMCpvzjN3xATD6kIYjjcwclPi6dUXhWiu/x7D8EJJFmOMvDSX3hOI/rTOJOuWRp7CWLQnPGLMZPCkjOsuTEtLG6+LDY4lfFruRp4ELLsTQH48xaHv1kCiGEECLStm1QvB5ykBBCiJe5AX69621Fd8YvAAAAAElFTkSuQmCC"/><element name="menuTopCC" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAAYCAYAAAAF6fiUAAABjklEQVR42u1X3c2DMAzsBhmBEXhggIzACIzACGUDRmCEjsAIGSEjMAIfkS7oegr0oQ/9IvkkC2HH+fHZDjweBoPBYDAIpmlqD1kP2Q/ZDhnEPsA2kM5Dt5PfWNBnSfpnEpojvUfYwyE92ZJulPXWi/3ONQff5eDhvcG7pzGvFJwcAA2I+DUcRFnrJABkhTwe8yX/lgiIYl9pP0/af9CkqYmAlN0v0TV08HTASAdvSgRAF4S4OwJiDjbZEykLVwAFnQlYMJfT/dZIwFtbKNjHXOIga6aAxOyPoATxvSNgL6zFQd7xXLEu2xzmCpCTjBoJOLNOKqClrH7r9RcEjBqEDwRsmrVcjURAbm09V4O00EXPUBMBDfde7rGwRRm/aEbezH1HwMxBo17eqy9d1iu1r/6ujdZ4D2wo94inQ5BmGdvD/i0BDkTn9d6+Zgq+Qb6CNmpBm94ntX4NeamEttRbMc59OjS3iqvLEjpfaF/+qi3KPrz9SBgMBoPBYDD8a3Rdt5v8TiwDDQaDwWD4Ef4AO4h4lB2vwSEAAAAASUVORK5CYII="/><element name="menuOption" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAuElEQVR42u2SQQqGIBCF/wOU1UYUMjAiQdSTeI4O2DnmUL9PatVq3AUNPBhEPt6bmd9XL6u+77uiXHRAV9+1wvais4iEEFXor7e9xdkJiJSSjDG0LAsppWgYhgplOb2iVdi2bRRCqHLOkdb6dpo5wAPu4AyglFJVjJGstTSOI+EPF4iYD+C6rjRNExuIyJgZYgJU5b2neZ7vBWX2UrAAzAwx4QwwuLuX0no2mBlAcMY4G85hf/Wu+gNm+kvWRCvtuQAAAABJRU5ErkJggg=="/><element name="menuOptionOver" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABfklEQVR42r2VTWqDUBSFG6v5KcVJsWTWaUZdRLuNbsNxt5CZ4/xsIJhAkGQJ3UBCcCA6UhBJQDDk9h04giREKQkVPpD37j3cc+/z+dD0iEirSn10s4hGHokG/iReEdIVbUVH0SMdrumlcKMYKzEUTwpT8aKwAN9N7hmMbdWKsYJnCrwpBop3MuCaxZh2KXrNpsHAPpK32+2H4zjfw+HQAXjHGoX7jDUu7FNQpxULCa7rftm2/TMajeLZbJaB8XgcYw17FLWYo58LaizfhCVVxScSl8vlYbPZSBiGEkWR7HY78TzvgD3E0L7JXO3cbpdNH8AaqoFYmqZSFIUcj0fZ7/fi+75MJpMYMYhlTre0XR1GT/GK5qNfsIjKIFY+p9NJ4jiW1Wp1QAximdODRqMgbKKyqmCSJLJYLLJrgrWW0TPYhBDI81yCIJDpdHrVcu1QMAD0DDZRGcTW63XdUJqPDSqdz+cZ+oZhNB6b+x/s+396t18Od72+/vuCvf0X8At7J48fIgP61QAAAABJRU5ErkJggg=="/><element name="menuOptionActive" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABfklEQVR42r2VTWqDUBSFG6v5KcVJsWTWaUZdRLuNbsNxt5CZ4/xsIJhAkGQJ3UBCcCA6UhBJQDDk9h04giREKQkVPpD37j3cc+/z+dD0iEirSn10s4hGHokG/iReEdIVbUVH0SMdrumlcKMYKzEUTwpT8aKwAN9N7hmMbdWKsYJnCrwpBop3MuCaxZh2KXrNpsHAPpK32+2H4zjfw+HQAXjHGoX7jDUu7FNQpxULCa7rftm2/TMajeLZbJaB8XgcYw17FLWYo58LaizfhCVVxScSl8vlYbPZSBiGEkWR7HY78TzvgD3E0L7JXO3cbpdNH8AaqoFYmqZSFIUcj0fZ7/fi+75MJpMYMYhlTre0XR1GT/GK5qNfsIjKIFY+p9NJ4jiW1Wp1QAximdODRqMgbKKyqmCSJLJYLLJrgrWW0TPYhBDI81yCIJDpdHrVcu1QMAD0DDZRGcTW63XdUJqPDSqdz+cZ+oZhNB6b+x/s+396t18Od72+/vuCvf0X8At7J48fIgP61QAAAABJRU5ErkJggg=="/><element name="volumeCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAGCAYAAADDl76dAAAAFUlEQVR42mP4//8/AzUxw6iBg89AACt1ZqjY29nMAAAAAElFTkSuQmCC"/><element name="volumeCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAGCAYAAADDl76dAAAAFUlEQVR42mP4//8/AzUxw6iBg89AACt1ZqjY29nMAAAAAElFTkSuQmCC"/><element name="volumeRail" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAA8CAYAAABmdppWAAAAPklEQVR42u3MoREAIAwDQDpI95+xVwG2AjziY3IR+ViPZOaeu7tXVc2O2y+AQCAQCAQCgUAgEAgEAoHAP8ADVGLAaqN7TdUAAAAASUVORK5CYII="/><element name="volumeRailCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAYAAACOXx+WAAAAXklEQVR42pXOMQrAIAyFYUGSIeqQuLh4Ju8/eZRXIhQ6WMHhhxDIRwKAsKv3jm+tNagqcs4gIvzdhQM4d2BKCcw8r8FSyqi1Lsgzs/WdgzHGcQ2+qIhMhzyffXe6eQBmfbZnUQ+tqAAAAABJRU5ErkJggg=="/><element name="volumeRailCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAYAAACOXx+WAAAAX0lEQVR42p2OsQrAIAxEhRAHoxB1cfGb/P/JTzkboVsttMODcOEe5wC4EymlEUKYMUYYdlv21jk+VHXUWtFa25RStlREQETjs7D3Pi9wY9Kc8xZ67+cfIZ6EtpKZceot+LS2cEn/XGYAAAAASUVORK5CYII="/><element name="volumeProgress" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAA8CAYAAABmdppWAAAASUlEQVR42u3MQQ0AUQjE0CFYgARQjGvWwBewh/beZ3enV7t77q7MVFWpuzUzigiZmSTZ6zNAQEBAQEBAQEBAQEBAQEBAQMB/gB8nJqOYNsUfIAAAAABJRU5ErkJggg=="/><element name="volumeProgressCapBottom" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAYAAACOXx+WAAAAVUlEQVR42pXMwQkAIQxE0XSYshQtImXYhh3kKFiD+L3s3iTgwBz/E0BuTylRSsHMaK3Re2fOyd6bb9dOAtAD0J/BnLMGoD6DgNRa1cz8B8cYvtbSqDn4F/TaDHcq1wAAAABJRU5ErkJggg=="/><element name="volumeProgressCapTop" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAECAYAAACOXx+WAAAAVElEQVR42mP5//8/Ay7Q09PjLyIiMkFCQkJBUlKSQVxc/IGoqGgBMzPzRlx6WHBJdHZ2+jMxMW1AFgMapAAVCwDijSQZCHT5BAbcYALJBgKBAjlyAHZIEpxZZYn/AAAAAElFTkSuQmCC"/><element name="volumeThumb" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAMCAYAAABiDJ37AAAAnklEQVR42mP4//8/AxbMBMTsQMwHxMJALALFwlAxdqgaDL24DOMGYoVly5ZFVldXz6ysrFwOwiA2SAwkB1XDRMhARqjtigcPHsw/d+7c9Z9A8B8KQGyQGEgOpAaqlpGQgSAv2Vy7du38fxwAKmcDVYvXQCZoOHkjuwwdQOW8oWqZCBkICvyA/4RBAFQt/Q2kqpepHilUTzZUT9gUZz0ACDf945eBHBQAAAAASUVORK5CYII="/></elements></component></components></skin>'
		this.xml = jwplayer.utils.parseXML(this.text);
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
	var utils = jwplayer.utils,
		events = jwplayer.events,
		states = events.state,
		_css = utils.css,
		

		DOCUMENT = document,
		D_CLASS = ".jwdisplay",
		D_PREVIEW_CLASS = ".jwpreview",
		D_ERROR_CLASS = ".jwerror",
		TRUE = true,
		FALSE = false,

		/** Some CSS constants we should use for minimization **/
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_NONE = "none",
		JW_CSS_100PCT = "100%",
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_SMOOTH_EASE = "opacity .25s, background-image .25s, color .25s";

	
	html5.display = function(api, config) {
		var _api = api,
			_skin = api.skin,
			_display, _preview,
			_item,
			_image, _imageWidth, _imageHeight, _imageURL, 
			_imageHidden = FALSE,
			_icons = {},
			_errorState = FALSE,
			_completedState = FALSE,
			_visibilities = {},
			_hiding,
			_button,
			_config = utils.extend({
				showicons: TRUE,
				bufferrotation: 45,
				bufferinterval: 100,
				fontcolor: '#ccc',
				overcolor: '#fff',
				fontsize: 15,
				fontweight: ""
			}, _skin.getComponentSettings('display'), config),
			_eventDispatcher = new events.eventdispatcher();
			
		utils.extend(this, _eventDispatcher);
			
		function _init() {
			_display = DOCUMENT.createElement("div");
			_display.id = _api.id + "_display";
			_display.className = "jwdisplay";
			
			_preview = DOCUMENT.createElement("div");
			_preview.className = "jwpreview jw" + _api.jwGetStretching();
			_display.appendChild(_preview);
			
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_COMPLETE, _playlistCompleteHandler);
			_api.jwAddEventListener(events.JWPLAYER_MEDIA_ERROR, _errorHandler);
			_api.jwAddEventListener(events.JWPLAYER_ERROR, _errorHandler);

			_display.addEventListener('click', _clickHandler, FALSE);
			
			_createIcons();
			//_createTextFields();
			
			_stateHandler({newstate:states.IDLE});
		}
		
		function _clickHandler(evt) {
			switch (_api.jwGetState()) {
			case states.PLAYING:
			case states.BUFFERING:
				_api.jwPause();
				break;
			default:
				_api.jwPlay();
				break;
			}
			_eventDispatcher.sendEvent(events.JWPLAYER_DISPLAY_CLICK);
		}
		
		this.clickHandler = _clickHandler;
		
		function _createIcons() {
			var	outStyle = {
					font: _config.fontweight + " " + _config.fontsize + "px/"+(parseInt(_config.fontsize)+3)+"px Arial,Helvetica,sans-serif",
					color: _config.fontcolor
				},
				overStyle = {color:_config.overcolor};
			_button = new html5.displayicon(_display.id+"_button", _api, outStyle, overStyle);
			_display.appendChild(_button.element());
		}
		

		function _setIcon(name, text) {
			if (!_config.showicons) return;
			
			if (name || text) {
				_button.setRotation(name == "buffer" ? parseInt(_config.bufferrotation) : 0, parseInt(_config.bufferinterval));
				_button.setIcon(name);
				_button.setText(text);
			} else {
				_button.hide();
			}
			
		}

		function _itemHandler() {
			_clearError();
			_item = _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()];
			var newImage = _item ? _item.image : "";
			_loadImage(newImage);
		}

		function _loadImage(newImage) {
			if (_image != newImage) {
				if (_image) {
					_setVisibility(D_PREVIEW_CLASS, FALSE);
				}
				_image = newImage;
				_getImage();
			} else if (_image) {
				_setVisibility(D_PREVIEW_CLASS, TRUE);
			}
			_updateDisplay(_api.jwGetState());
		}
		
		function _playlistCompleteHandler() {
			_completedState = TRUE;
			_setIcon("replay");
			var item = _api.jwGetPlaylist()[0];
			_loadImage(item.image);
		}
		
		var _stateTimeout;
		
		function _stateHandler(evt) {
			clearTimeout(_stateTimeout);
			_stateTimeout = setTimeout(function() {
				_updateDisplay(evt.newstate);
			}, 100);
		}
		
		function _updateDisplay(state) {
			if (_button) _button.setRotation(0);
			switch(state) {
			case states.IDLE:
				if (!_errorState && !_completedState) {
					if (_image && !_imageHidden) {
						_setVisibility(D_PREVIEW_CLASS, TRUE);
					}
					_setIcon('play', _item ? _item.title : "");
				}
				break;
			case states.BUFFERING:
				_clearError();
				_completedState = FALSE;
				_setIcon('buffer');
				break;
			case states.PLAYING:
				_setIcon();
				break;
			case states.PAUSED:
				_setIcon('play');
				break;
			}
		}
		
		this.hidePreview = function(state) {
			_imageHidden = state;
			_setVisibility(D_PREVIEW_CLASS, !state);
		}

		this.element = function() {
			return _display;
		}
		
		function _internalSelector(selector) {
			return '#' + _display.id + ' ' + selector;
		}
		
		function _getImage() {
			if (_image) {
				// Find image size and stretch exactfit if close enough
				var img = new Image();
				img.addEventListener('load', _imageLoaded, FALSE);
				img.src = _image;
			} else {
				_css(_internalSelector(D_PREVIEW_CLASS), { 'background-image': undefined });
				_setVisibility(D_PREVIEW_CLASS, FALSE);
				_imageWidth = _imageHeight = 0;
			}
		}
		
		function _imageLoaded() {
			_imageWidth = this.width;
			_imageHeight = this.height;
			_updateDisplay(_api.jwGetState());
			_redraw();
			if (_image) {
				_css(_internalSelector(D_PREVIEW_CLASS), {
					'background-image': 'url('+_image+')' 
				});
			}
		}

		function _errorHandler(evt) {
			_errorState = TRUE;
			_setIcon('error', evt.message);
		}
		
		function _clearError() {
			_errorState = FALSE;
			if (_icons.error) _icons.error.setText();
		}

		
		function _redraw() {
			if (_display.clientWidth * _display.clientHeight > 0) {
				utils.stretch(_api.jwGetStretching(), _preview, _display.clientWidth, _display.clientHeight, _imageWidth, _imageHeight);
			}
		}

		this.redraw = _redraw;
		
		function _setVisibility(selector, state) {
			if (!utils.exists(_visibilities[selector])) _visibilities[selector] = false;
			
			if (_visibilities[selector] != state) {
				_visibilities[selector] = state;
				_css(_internalSelector(selector), {
					opacity: state ? 1 : 0,
					visibility: state ? "visible" : "hidden"
				});
			}
		}

		this.show = function() {
			if (_button && _api.jwGetState() != states.PLAYING) _button.show();
		}
		
		this.hide = function() {
			if (_button) _button.hide();
		}

		/** NOT SUPPORTED : Using this for now to hack around instream API **/
		this.setAlternateClickHandler = function(handler) {
			_alternateClickHandler = handler;
		}
		this.revertAlternateClickHandler = function() {
			_alternateClickHandler = undefined;
		}

		_init();
	};
	
	_css(D_CLASS, {
		position: JW_CSS_ABSOLUTE,
		cursor: "pointer",
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		overflow: JW_CSS_HIDDEN
	});

	_css(D_CLASS + ' .jwpreview', {
		position: JW_CSS_ABSOLUTE,
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		background: 'no-repeat center',
		overflow: JW_CSS_HIDDEN,
		opacity: 0
	});

	_css(D_CLASS +', '+D_CLASS + ' *', {
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

})(jwplayer.html5);
/**
 * JW Player display component
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state, 
		_css = utils.css,

		DI_CLASS = ".jwdisplayIcon", 
		UNDEFINED = undefined,
		DOCUMENT = document,

		/** Some CSS constants we should use for minimization * */
		JW_CSS_NONE = "none", 
		JW_CSS_100PCT = "100%",
		JW_CSS_CENTER = "center",
		JW_CSS_ABSOLUTE = "absolute";

	html5.displayicon = function(id, api, textStyle, textStyleOver) {
		var _api = api,
			_skin = _api.skin,
			_id = id,
			_container, 
			_bgSkin,
			_capLeftSkin,
			_capRightSkin,
			_hasCaps,
			_text,
			_icon,
			_iconElement,
			_iconWidth = 0;

		function _init() {
			_container = _createElement("jwdisplayIcon");
			_container.id = _id;

			
			//_createElement('capLeft', _container);
//			_bg = _createElement('background', _container);
			_createBackground();
			_text = _createElement('jwtext', _container, textStyle, textStyleOver);
			_icon = _createElement('icon', _container);
			//_createElement('capRight', _container);
			
			
			_hide();
			_redraw();
		}

		function _internalSelector(selector, hover) {
			return "#" + _id + (hover ? ":hover" : "") + " " + (selector ? selector : "");
		}

		function _createElement(name, parent, style, overstyle) {
			var elem = DOCUMENT.createElement("div");

			elem.className = name;
			if (parent) parent.appendChild(elem);

			_styleIcon(name, "."+name, style, overstyle);
			
			return elem;
		}
		
		function _createBackground() {
			_bgSkin = _getSkinElement('background');
			_capLeftSkin = _getSkinElement('capLeft');
			_capRightSkin = _getSkinElement('capRight');
			_hasCaps = (_capLeftSkin.width * _capRightSkin.width > 0);
			
			var style = {
				'background-image': "url(" + _capLeftSkin.src + "), url(" + _bgSkin.src + "), url(" + _capRightSkin.src + ")",
				'background-position': "left,center,right",
				'background-repeat': 'no-repeat',
				padding: "0 " + _capRightSkin.width + "px 0 " + _capLeftSkin.width + "px",
				height: _bgSkin.height,
				'margin-top': _bgSkin.height / -2
			};
			
			_css(_internalSelector(), style);
			
			if (_bgSkin.overSrc) {
				style['background-image'] = "url(" + _capLeftSkin.overSrc + "), url(" + _bgSkin.overSrc + "), url(" + _capRightSkin.overSrc + ")"; 
			}

			_css("#"+_api.id+" .jwdisplay:hover " + _internalSelector(), style);
		}
		
		function _styleIcon(name, selector, style, overstyle) {
			var skinElem = _getSkinElement(name); 

			style = utils.extend({}, style);
			if (name.indexOf("Icon") > 0) _iconWidth = skinElem.width;
			if (skinElem.src) {
				style['background-image'] = 'url(' + skinElem.src + ')';
				style['width'] = skinElem.width;// + (name.toLowerCase().indexOf("cap") == 0 ? 1 : 0);
			}
			_css(_internalSelector(selector), style);

			overstyle = utils.extend({}, overstyle);
			if (skinElem.overSrc) {
				overstyle['background-image'] = 'url(' + skinElem.overSrc + ')';
			}
			_iconElement = skinElem;
			_css("#"+_api.id+" .jwdisplay:hover " + (selector ? selector : _internalSelector()), overstyle);
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('display', name),
				overElem = _skin.getSkinElement('display', name + 'Over');
				
			if (elem) {
				elem.overSrc = (overElem && overElem.src) ? overElem.src : "";
				return elem;
			}
			return { src : "", overSrc : "", width : 0, height : 0 };
		}
		
		function _redraw() {
			var showText = _hasCaps || (_iconWidth == 0),
				px100pct = "px " + JW_CSS_100PCT,
				contentWidth;
			
			_css(_internalSelector('.jwtext'), {
				display: (_text.innerHTML && showText) ? UNDEFINED : JW_CSS_NONE
			});

			setTimeout(function() {
				 contentWidth = Math.max(_iconElement.width, utils.bounds(_container).width - _capRightSkin.width - _capLeftSkin.width); //Math.ceil(_iconElement.width + (showText ? utils.bounds(_text).width: 0));
				 if (utils.isFF() || utils.isIE()) contentWidth ++;
				 _css(_internalSelector(), {
					//width : contentWidth,
					//'background-position': _capLeftSkin.width + "px 0",
					'background-size': [_capLeftSkin.width + px100pct, contentWidth + px100pct, _capRightSkin.width + px100pct].join(",")
				}, true);
			}, 0);
			

				
			/*
			_css(_internalSelector('.background'), {
				'background-repeat': 'repeat-x',
				'background-size': JW_CSS_100PCT + " " + _bgSkin.height + "px",
				position: "absolute",
				width: UNDEFINED,
				left: _hasCaps ? _capLeftSkin.width : 0,
				right: _hasCaps ? _capRightSkin.width : 0
			});
			*/

		}
		
		this.element = function() {
			return _container;
		}

		this.setText = function(text) {
			var style = _text.style;
			_text.innerHTML = text ? text.replace(":", ":<br>") : "";
			style.height = "0";
			style.display = "block";
			if (text) {
				while (numLines(_text) > 2) {
					_text.innerHTML = _text.innerHTML.replace(/(.*) .*$/, "$1...");
				}
			}
			style.height = "";
			style.display = "";
			//setTimeout(_redraw, 100);
			_redraw();
		}
		
		this.setIcon = function(name) {
			var newIcon = _createElement('icon');
			newIcon.id = _container.id + "_" + name;
			_styleIcon(name+"Icon", "#"+newIcon.id)
			_container.replaceChild(newIcon, _icon);
			_icon = newIcon;
		}

		var _bufferInterval, _bufferAngle = 0, _currentAngle;
		
		function startRotation(angle, interval) {
			clearInterval(_bufferInterval);
			_currentAngle = 0
			_bufferAngle = angle;
			if (angle == 0) {
				rotateIcon();
			} else {
				_bufferInterval = setInterval(rotateIcon, interval)
			}
		}

		function rotateIcon() {
			_currentAngle = (_currentAngle + _bufferAngle) % 360;
			utils.rotate(_icon, _currentAngle);
		}

		this.setRotation = startRotation;
						
		function numLines(element) {
			return Math.floor(element.scrollHeight / DOCUMENT.defaultView.getComputedStyle(element, null).lineHeight.replace("px", ""));
		}

		
		var _hide = this.hide = function() {
			_container.style.opacity = 0;
			// Needed for IE9 for some reason
			//if (_bg && utils.isIE()) _bg.style.opacity = 0;
		}

		var _show = this.show = function() {
			_container.style.opacity = 1;
			//if (_bg && utils.isIE()) _bg.style.opacity = 1;
		}

		_init();
	};

	_css(DI_CLASS, {
		display : 'table',
		cursor : 'pointer',
    	position: "relative",
    	'margin-left': "auto",
    	'margin-right': "auto",
    	top: "50%"
	}, true);

	_css(DI_CLASS + " div", {
		position : "relative",
		display: "table-cell",
		'vertical-align': "middle",
		'background-repeat' : "no-repeat",
		'background-position' : JW_CSS_CENTER
	});

	_css(DI_CLASS + " div", {
		'vertical-align': "middle",
	}, true);

	_css(DI_CLASS + " .jwtext", {
		color : "#fff",
		padding: "0 1px",
		'max-width' : "300px",
		'overflow-y' : "hidden",
		'text-align': JW_CSS_CENTER,
		'-webkit-user-select' : JW_CSS_NONE,
		'-moz-user-select' : JW_CSS_NONE,
		'-ms-user-select' : JW_CSS_NONE,
		'user-select' : JW_CSS_NONE
	});

})(jwplayer.html5);/**
 * JW Player display component
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state, 
		_css = utils.css,
		_bounds = utils.bounds,

		D_CLASS = ".jwdock",
		DB_CLASS = ".jwdockbuttons", 
		UNDEFINED = undefined,
		DOCUMENT = document,

		/** Some CSS constants we should use for minimization * */
		JW_CSS_NONE = "none", 
		JW_CSS_100PCT = "100%",
		JW_CSS_CENTER = "center",
		JW_CSS_ABSOLUTE = "absolute";

	html5.dock = function(api, config) {
		var _api = api,
			_defaults = {
				iconalpha: 0.75,
				iconalphaactive: 0.5,
				iconalphaover: 1,
				margin: 8
			},
			_config = utils.extend({}, _defaults, config), 
			_id = _api.id + "_dock",
			_skin = _api.skin,
			_height,
			_buttonCount = 0,
			_buttons = {},
			_tooltips = {},
			_container,
			_buttonContainer,
			_dockBounds,
			_this = this;

		function _init() {
			_this.visible = false;
			
			_container = _createElement("div", "jwdock");
			_buttonContainer = _createElement("div", "jwdockbuttons");
			_container.appendChild(_buttonContainer);
			_container.id = _id;

			_setupElements();
			
			setTimeout(function() {
				_dockBounds = _bounds(_container);
			});
			
		}
		
		function _setupElements() {
			var button = _getSkinElement('button'),
				buttonOver = _getSkinElement('buttonOver'),
				buttonActive = _getSkinElement('buttonActive');
			
			if (!button) return;
			
			_css(_internalSelector(), {
				height: button.height,
				padding: _config.margin
			});

			_css(DB_CLASS, {
				height: button.height
			});

			_css(_internalSelector("button"), {
				width: button.width,
				cursor: "pointer",
				border: "none",
				background: button.src
			});
			
			if (buttonOver.src) _css(_internalSelector("button:hover"), { background: buttonOver.src });
			if (buttonActive.src) _css(_internalSelector("button:active"), { background: buttonActive.src });
			_css(_internalSelector("button>div"), { opacity: _config.iconalpha });
			_css(_internalSelector("button:hover>div"), { opacity: _config.iconalphaover });
			_css(_internalSelector("button:active>div"), { opacity: _config.iconalphaactive});
			_css(_internalSelector(".jwoverlay"), { top: _config.margin + button.height });
			
			_createImage("capLeft", _buttonContainer);
			_createImage("capRight", _buttonContainer);
			_createImage("divider");
		}
		
		function _createImage(className, parent) {
			var skinElem = _getSkinElement(className);
			_css(_internalSelector("." + className), {
				width: skinElem.width,
				background: skinElem.src
			});
			return _createElement("div", className, parent);
		}
		
		function _internalSelector(selector, hover) {
			return "#" + _id + " " + (selector ? selector : "");
		}

		function _createElement(type, name, parent) {
			var elem = DOCUMENT.createElement(type);
			if (name) elem.className = name;
			if (parent) parent.appendChild(elem);
			return elem;
		}
		
		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('dock', name);
			return elem ? elem : { width: 0, height: 0, src: "" };
		}

		_this.redraw = function() {
			_dockBounds = _bounds(_container);
		};
		
		function _positionTooltip(name) {
			var tooltip = _tooltips[name],
				tipBounds,
				button = _buttons[name],
				dockBounds,
				buttonBounds = _bounds(button.icon);

			tooltip.offsetX(0);
			dockBounds = _bounds(_container);
			_css('#' + tooltip.element().id, {
				left: buttonBounds.left - dockBounds.left + buttonBounds.width / 2
			});
			tipBounds = _bounds(tooltip.element());	
			if (dockBounds.left > tipBounds.left) {
				tooltip.offsetX(dockBounds.left - tipBounds.left + 8);
			}

		}
	
		_this.element = function() {
			return _container;
		}
		
		_this.offset = function(offset) {
			_css(_internalSelector(), { 'margin-left': offset });
		}

		_this.hide = function() {
			_this.visible = false;
//			_css(_internalSelector(), {
//				opacity: 0
//			});
			_container.style.opacity = 0;
			_container.style.visibility = "hidden";
		}

		_this.show = function() {
			_this.visible = true;
//			_css(_internalSelector(), {
//				visibility: "visible",
//				opacity: 1
//			});
			_container.style.opacity = 1;
			_container.style.visibility = "visible";
		}
		
		_this.addButton = function(url, label, clickHandler, id) {
			// Can't duplicate button ids
			if (_buttons[id]) return;
			
			var divider = _createElement("div", "divider", _buttonContainer),
				newButton = _createElement("button", null, _buttonContainer),
				icon = _createElement("div", null, newButton);
		
			icon.id = _id + "_" + id;
			icon.innerHTML = "&nbsp;"
			_css("#"+icon.id, {
				'background-image': url
			});
			
			if (typeof clickHandler == "string") {
				clickHandler = new Function(clickHandler);
			}
			newButton.addEventListener("click", clickHandler);
			
			_buttons[id] = { element: newButton, label: label, divider: divider, icon: icon };
			
			if (label) {
				var tooltip = new html5.overlay(icon.id+"_tooltip", _skin, true),
					tipText = _createElement("div");
				tipText.id = tooltip.id + "_label";
				tipText.innerHTML = label;
				_css('#'+tipText.id, {
					padding: 3
				});
				tooltip.setContents(tipText);
				
				
				var timeout;
				newButton.addEventListener('mouseover', function() { 
					clearTimeout(timeout); 
					_positionTooltip(id); 
					tooltip.show();
					for (var i in _tooltips) {
						if (i != id) {
							_tooltips[i].hide();
						}
					}
				}, false);
				newButton.addEventListener('mouseout', function() {
					timeout = setTimeout(tooltip.hide, 100); 
				} , false);
				
				_container.appendChild(tooltip.element());
				_tooltips[id] = tooltip;
			}
			
			_buttonCount++;
			_setCaps();
		}
		
		_this.removeButton = function(id) {
			if (_buttons[id]) {
				_buttonContainer.removeChild(_buttons[id].element);
				_buttonContainer.removeChild(_buttons[id].divider);
				delete _buttons[id];
				_buttonCount--;
				_setCaps();
			}
		}
		
		_this.numButtons = function() {
			return _buttonCount;
		}
		
		function _setCaps() {
			_css(DB_CLASS + " .capLeft, " + DB_CLASS + " .capRight", {
				display: _buttonCount ? "block" : "none"
			});
		}

		_init();
	};

	_css(D_CLASS, {
	  	position: "absolute",
	  	//visibility: "hidden",
	  	width: JW_CSS_100PCT,
	  	opacity: 0,
		//overflow: "hidden"
	});
		
	_css(D_CLASS + " > *", {
		height: JW_CSS_100PCT,
	  	'float': "left"
	});

	_css(D_CLASS + " > .jwoverlay", {
		height: 'auto',
	  	'float': "none",
	  	'z-index': 99
	});

	_css(DB_CLASS, {
	  	position: "absolute",
	});

	_css(DB_CLASS + " button", {
		position: "relative",
	});
	
	_css(DB_CLASS + " > *", {
		height: JW_CSS_100PCT,
	  	'float': "left"
	});

	_css(DB_CLASS + " .divider", {
		display: "none"
	});

	_css(DB_CLASS + " button ~ .divider", {
		display: "block"
	});

	_css(DB_CLASS + " .capLeft, " + DB_CLASS + " .capRight", {
		display: "none"
	});

	_css(DB_CLASS + " .capRight", {
		'float': "right"
	});
	
	_css(DB_CLASS + " button > div", {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		margin: 5,
		position: "absolute",
		'background-position': "center",
		'background-repeat': "no-repeat"
	});

	utils.transitionStyle(D_CLASS, "background .15s, opacity .15s");
	utils.transitionStyle(D_CLASS + " .jwoverlay", "opacity .15s");
	utils.transitionStyle(DB_CLASS + " button div", "opacity .15s");

})(jwplayer.html5);/** 
 * API to control instream playback without interrupting currently playing video
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, 
		_utils = _jw.utils, 
		_events = _jw.events, 
		_states = _events.state,
		_playlist = _jw.playlist;
	
	html5.instream = function(api, model, view, controller) {
		var _defaultOptions = {
			controlbarseekable:"always",
			controlbarpausable:true,
			controlbarstoppable:true,
			playlistclickable:true
		};
		
		var _item,
			_options,
			_api=api, _model=model, _view=view, _controller=controller,
			_video, _oldsrc, _oldsources, _oldpos, _oldstate, _olditem,
			_provider, _cbar, _disp, _instreamMode = false,
			_dispatcher, _instreamContainer,
			_self = this;


		/*****************************************
		 *****  Public instream API methods  *****
		 *****************************************/

		/** Load an instream item and initialize playback **/
		this.load = function(item, options) {
			// Update the instream player's model
			_copyModel();
			// Sets internal instream mode to true
			_instreamMode = true;
			// Instream playback options
			_options = _utils.extend(_defaultOptions, options);
			// Copy the playlist item passed in and make sure it's formatted as a proper playlist item
			_item = new _playlist.item(item);
			// Create (or reuse) video media provider.  No checks right now to make sure it's a valid playlist item (i.e. provider="video").
			_setupProvider();
			// Create the container in which the controls will be placed
			_instreamContainer = document.createElement("div");
			_instreamContainer.id = _self.id + "_instream_container";
			// Make sure the original player's provider stops broadcasting events (pseudo-lock...)
			_controller.detachMedia();
			// Get the video tag
			_video = _provider.getTag();
			// Store this to compare later (in case the main player switches to the next playlist item when we switch out of instream playback mode 
			_olditem = _model.playlist[_model.item];
			// Keep track of the original player state
			_oldstate = _api.jwGetState();
			// If the player's currently playing, pause the video tag
			if (_oldstate == _states.BUFFERING || _oldstate == _states.PLAYING) {
				_video.pause();
			}
			
			// Copy the video src/sources tags and store the current playback time
			_oldsrc = _video.src ? _video.src : _video.currentSrc;
			_oldsources = _video.innerHTML;
			_oldpos = _video.currentTime;
			
			// Instream display component
			_disp = new html5.display(_self);
			_disp.setAlternateClickHandler(function(evt) {
				if (_fakemodel.state == _states.PAUSED) {
					_self.jwInstreamPlay();
				} else {
					_sendEvent(_events.JWPLAYER_INSTREAM_CLICK, evt);
				}
			});
			_instreamContainer.appendChild(_disp.element());

			// Instream controlbar (if not iOS/Android)
			if (!_utils.isMobile()) {
//				_cbar = new html5.controlbar(_self, _utils.extend({},_model.plugins.config.controlbar, {}));
				_cbar = new html5.controlbar(_self);
//				if (_model.plugins.config.controlbar.position == html5.view.positions.OVER) {
					_instreamContainer.appendChild(_cbar.element());
//				} else {
//					var cbarParent = _model.plugins.object.controlbar.getDisplayElement().parentNode;
//					cbarParent.appendChild(_cbar.getDisplayElement());
//				}
			}

			// Show the instream layer
			_view.setupInstream(_instreamContainer, _video);
			// Resize the instream components to the proper size
			_resize();
			// Load the instream item
			_provider.load(_item);
			
		}
			
		/** Stop the instream playback and revert the main player back to its original state **/
		this.jwInstreamDestroy = function(complete) {
			if (!_instreamMode) return;
			// We're not in instream mode anymore.
			_instreamMode = false;
			if (_oldstate != _states.IDLE) {
				// Load the original item into our provider, which sets up the regular player's video tag
				_provider.load(_olditem, false);
				// We don't want the position interval to be running anymore
				//_provider.stop(false);
			} else {
				_provider.stop(true);
			}
			// We don't want the instream provider to be attached to the video tag anymore
			_provider.detachMedia();
			// Return the view to its normal state
			_view.destroyInstream();
			// If we added the controlbar anywhere, let's get rid of it
			if (_cbar) try { _cbar.element().parentNode.removeChild(_cbar.getDisplayElement()); } catch(e) {}
			// Let listeners know the instream player has been destroyed, and why
			_sendEvent(_events.JWPLAYER_INSTREAM_DESTROYED, {reason:(complete ? "complete":"destroyed")}, true);
			// Re-attach the controller
			_controller.attachMedia();
			if (_oldstate == _states.BUFFERING || _oldstate == _states.PLAYING) {
				// Model was already correct; just resume playback
				_video.play();
				if (_model.playlist[_model.item] == _olditem) {
					// We need to seek using the player's real provider, since the seek may have to be delayed
					//_model.getMedia().seek(_oldpos);
					_model.getVideo().seek(_oldpos);
				}
			}
			return;
		};
		
		/** Forward any calls to add and remove events directly to our event dispatcher **/
		this.jwInstreamAddEventListener = function(type, listener) {
			_dispatcher.addEventListener(type, listener);
		} 
		this.jwInstreamRemoveEventListener = function(type, listener) {
			_dispatcher.removeEventListener(type, listener);
		}

		/** Start instream playback **/
		this.jwInstreamPlay = function() {
			if (!_instreamMode) return;
			_provider.play(true);
		}

		/** Pause instream playback **/
		this.jwInstreamPause = function() {
			if (!_instreamMode) return;
			_provider.pause(true);
		}
		
		/** Seek to a point in instream media **/
		this.jwInstreamSeek = function(position) {
			if (!_instreamMode) return;
			_provider.seek(position);
		}
		
		/** Get the current instream state **/
		this.jwInstreamGetState = function() {
			if (!_instreamMode) return undefined;
			return _fakemodel.state;
		}

		/** Get the current instream playback position **/
		this.jwInstreamGetPosition = function() {
			if (!_instreamMode) return undefined;
			return _fakemodel.position;
		}

		/** Get the current instream media duration **/
		this.jwInstreamGetDuration = function() {
			if (!_instreamMode) return undefined;
			return _fakemodel.duration;
		}
		
		this.playlistClickable = function() {
			return (!_instreamMode || _options.playlistclickable.toString().toLowerCase()=="true");
		}
		

		/*****************************
		 ****** Private methods ****** 
		 *****************************/

		function _init() {
			// Initialize the instream player's model copied from main player's model
			//_fakemodel = new html5.model(this, _model.getMedia() ? _model.getMedia().getDisplayElement() : _model.container, _model);
			_fakemodel = new html5.model({});
			// Create new event dispatcher
			_dispatcher = new _events.eventdispatcher();
			// Listen for player resize events
			_api.jwAddEventListener(_events.JWPLAYER_RESIZE, _resize);
			_api.jwAddEventListener(_events.JWPLAYER_FULLSCREEN, _resize);
		}

		function _copyModel() {
			_controller.setMute(_model.mute);
			_controller.setVolume(_model.volume);
		}
		
		function _setupProvider() {
			if (!_provider) {
//				_provider = new html5.mediavideo(_fakemodel, _model.getMedia() ? _model.getMedia().getDisplayElement() : _model.container);
				_provider = new html5.video(_model.getVideo().getTag());
				_provider.addGlobalListener(_forward);
				_provider.addEventListener(_events.JWPLAYER_MEDIA_META, _metaHandler);
				_provider.addEventListener(_events.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
				_provider.addEventListener(_events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
			}
			_provider.attachMedia();
		}
		
		/** Forward provider events to listeners **/		
		function _forward(evt) {
			if (_instreamMode) {
				_sendEvent(evt.type, evt);
			}
		}
		
		/** Handle the JWPLAYER_MEDIA_BUFFER_FULL event **/		
		function _bufferFullHandler(evt) {
			if (_instreamMode) {
				_provider.play();
			}
		}

		/** Handle the JWPLAYER_MEDIA_COMPLETE event **/		
		function _completeHandler(evt) {
			if (_instreamMode) {
				setTimeout(function() {
					_self.jwInstreamDestroy(true);
				}, 10);
			}
		}

		/** Handle the JWPLAYER_MEDIA_META event **/		
		function _metaHandler(evt) {
			// If we're getting video dimension metadata from the provider, allow the view to resize the media
			if (evt.metadata.width && evt.metadata.height) {
				_view.resizeMedia();
			}
		}
		
		function _sendEvent(type, data, forceSend) {
			if (_instreamMode || forceSend) {
				_dispatcher.sendEvent(type, data);
			}
		}
		
		// Resize handler; resize the components.
		function _resize() {
//			var originalDisp = _model.plugins.object.display.getDisplayElement().style;
//			
			if (_cbar) {
//				var originalBar = _model.plugins.object.controlbar.getDisplayElement().style;
				_cbar.redraw();
				//_cbar.resize(_utils.parseDimension(originalDisp.width), _utils.parseDimension(originalDisp.height));
//				_css(_cbar.getDisplayElement(), _utils.extend({}, originalBar, { zIndex: 1001, opacity: 1 }));
			}
			if (_disp) {
//				
//				_disp.resize(_utils.parseDimension(originalDisp.width), _utils.parseDimension(originalDisp.height));
				_disp.redraw();
//				_css(_disp.getDisplayElement(), _utils.extend({}, originalDisp, { zIndex: 1000 }));
			}
//			if (_view) {
//				_view.resizeMedia();
//			}
		}
		
		
		/**************************************
		 *****  Duplicate main html5 api  *****
		 **************************************/
		
		this.jwPlay = function(state) {
			if (_options.controlbarpausable.toString().toLowerCase()=="true") {
				this.jwInstreamPlay();
			}
		};
		
		this.jwPause = function(state) {
			if (_options.controlbarpausable.toString().toLowerCase()=="true") {
				this.jwInstreamPause();
			}
		};

		this.jwStop = function() {
			if (_options.controlbarstoppable.toString().toLowerCase()=="true") {
				this.jwInstreamDestroy();
				_api.jwStop();
			}
		};

		this.jwSeek = function(position) {
			switch(_options.controlbarseekable.toLowerCase()) {
			case "always":
				this.jwInstreamSeek(position);
				break;
			case "backwards":
				if (_fakemodel.position > position) {
					this.jwInstreamSeek(position);
				}
				break;
			}
		};
		
		this.jwGetPosition = function() {};
		this.jwGetDuration = function() {};
		this.jwGetWidth = _api.jwGetWidth;
		this.jwGetHeight = _api.jwGetHeight;
		this.jwGetFullscreen = _api.jwGetFullscreen;
		this.jwSetFullscreen = _api.jwSetFullscreen;
		this.jwGetVolume = function() { return _model.volume; };
		this.jwSetVolume = function(vol) {
			_provider.volume(vol);
			_api.jwSetVolume(vol);
		}
		this.jwGetMute = function() { return _model.mute; };
		this.jwSetMute = function(state) {
			_provider.mute(state);
			_api.jwSetMute(state);
		}
		this.jwGetState = function() { return _fakemodel.state; };
		this.jwGetPlaylist = function() { return [_item]; };
		this.jwGetPlaylistIndex = function() { return 0; };
		this.jwGetStretching = function() { return _model.config.stretching; };
		this.jwAddEventListener = function(type, handler) { _dispatcher.addEventListener(type, handler); };
		this.jwRemoveEventListener = function(type, handler) { _dispatcher.removeEventListener(type, handler); };

		this.skin = _api.skin;
		this.id = _api.id + "_instream";

		_init();
		return this;
	};
})(jwplayer.html5);

/**
 * JW Player logo component
 *
 * @author zach
 * @modified pablo
 * @version 6.0
 */
(function(jwplayer) {
	var utils = jwplayer.utils,
		html5 = jwplayer.html5,
		_css = utils.css,
	
		UNDEFINED = undefined,
		
		FREE = "free",
		PRO = "pro",
		PREMIUM = "premium",
		ADS = "ads",
		OPEN = "open",

		LINK_DEFAULT = "http://www.longtailvideo.com/jwpabout/?a=l&v=",
		JW_CSS_VISIBLE = "visible",
		JW_CSS_HIDDEN = "hidden",
		LOGO_CLASS = ".jwlogo";
	
	
	var logo = html5.logo = function(api, logoConfig) {
		var _api = api,
			_id = _api.id + "_logo",
			_settings,
			_logo,
			_defaults = logo.defaults,
			_showing = false;
		
		function _setup() {
			_setupConfig();
			_setupDisplayElements();
		}
		
		function _setupConfig() {
			if (_defaults.prefix) {
				var version = jwplayer.version.split(/\W/).splice(0, 2).join("/");
				if (_defaults.prefix.indexOf(version) < 0) {
					_defaults.prefix += version + "/";
				}
			}
			try {
				if (utils.isHTTPS()) {
					_defaults.prefix = _defaults.prefix.replace("http://", "https://ssl.");
				}
			} catch(e) {}
			
			var linkFlag = _getLinkFlag(_getEdition());
			_defaults.link = LINK_DEFAULT+jwplayer.version+'&m=h&e='+linkFlag;

			_settings = utils.extend({}, _defaults, logoConfig);
			_settings.hide = (_settings.hide.toString() == "true");
		}
		
		function _setupDisplayElements() {
			_logo = document.createElement("img");
			_logo.className = "jwlogo";
			_logo.id = _id;
			
			if (!_settings.file) {
				_logo.style.display = "none";
				return;
			}
			
			var positions = (/(\w+)-(\w+)/).exec(_settings.position),
				style = {},
/*
					opacity: _settings.hide ? UNDEFINED : 1,
					visibility: _settings.hide ? UNDEFINED : JW_CSS_VISIBLE
				},
*/
				margin = _settings.margin;

			if (positions.length == 3) {
				style[positions[1]] = margin;
				style[positions[2]] = margin;
			} else {
				style.top = style.right = margin;
			}

			_css(_internalSelector(), style); 
			
			if (_settings.file.indexOf("/") >= 0) {
				_logo.src = _settings.file;
			} else {
				_logo.src = _settings.prefix + _settings.file;
			}
			
			_logo.onclick = _clickHandler;
		}
		
		this.resize = function(width, height) {
		};
		
		this.element = function() {
			return _logo;
		};
		
		this.offset = function(offset) {
			_css(_internalSelector(), { 'margin-bottom': offset }); 
		}
		
		this.position = function() {
			return _settings.position;
		}

		this.margin = function() {
			return parseInt(_settings.margin);
		}

		function _clickHandler(evt) {
			if (utils.exists(evt)) {
				evt.stopPropagation();
			}
			
			if (_showing && _settings.link) {
				_api.jwPause();
				_api.jwSetFullscreen(false);
				window.open(_settings.link, _settings.linktarget);
			}
			return;
		}

		function _getEdition() {
			if (jwplayer().config.key) {
				var	licenseKey = new utils.key(jwplayer().config.key);
				return licenseKey.edition();
			}
			else {
				return OPEN;
			}
		}

		function _getLinkFlag(edition) {
			if (edition == PRO) {
				return "p";
			}
			else if (edition == PREMIUM) {
				return "r";
			}
			else if (edition == ADS) {
				return "a";
			}
			else if (edition == OPEN) {
				return "o";
			}
			else {
				return "f";
			}
		}
		
		function _internalSelector(selector) {
			return "#" + _id + " " + (selector ? selector : "");
		}
		
		this.hide = function(forced) {
			if (_settings.hide || forced) {
				_showing = false;
				_logo.style.opacity = 0;
			}
		}

		this.show = function() {
			_showing = true;
			_logo.style.opacity = 1;
		}
		
		_setup();
		
		return this;
	};
	
	logo.defaults = {
		prefix: "http://p.jwpcdn.com/",
		file: "logo.png",
		link: LINK_DEFAULT+jwplayer.version+'&m=h&e=f',
		linktarget: "_top",
		margin: 8,
		hide: false,
		position: "top-right"
	};
	
	_css(LOGO_CLASS, {
		cursor: "pointer",
	  	position: "absolute",
	  	'z-index': 100,
	  	opacity: 0
	});

	utils.transitionStyle(LOGO_CLASS, "visibility .15s, opacity .15s");

})(jwplayer);
/**
 * JW Player HTML5 overlay component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		_css = utils.css,
		
		MENU_CLASS = 'jwmenu',
		OPTION_CLASS = 'jwoption',
		UNDEFINED = undefined,
		WHITE = '#ffffff',
		CCC = '#cccccc';
	
	/** HTML5 Overlay class **/
	html5.menu = function(name, id, skin, changeHandler) {
		var _skin = skin,
			_name = name,
			_id = id,
			_changeHandler = changeHandler,
			_overlay = new html5.overlay(_id+"_overlay", skin),
			_settings = utils.extend({
				fontcase: UNDEFINED,
				fontcolor: CCC,
				fontsize: 11,
				fontweight: UNDEFINED,
				activecolor: WHITE,
				overcolor: WHITE
			}, skin.getComponentSettings('tooltip')),
			_container,
			_options = [];
		
		function _init() {
			_container = _createElement(MENU_CLASS);
			_container.id = _id;
			
			var top = _getSkinElement('menuTop'+name),
				menuOption = _getSkinElement('menuOption'),
				menuOptionOver = _getSkinElement('menuOptionOver'),
				menuOptionActive = _getSkinElement('menuOptionActive');

			if (top) {
				_container.appendChild(top.image);
			}
			
			if (menuOption) {
				var selector = '#'+id+' .'+OPTION_CLASS;
				_css(selector, {
					'background-image': menuOption.src,
					height: menuOption.height,
					color: _settings.fontcolor,
					'padding-left': menuOption.width,
					font: _settings.fontweight + " " + _settings.fontsize + "px Arial,Helvetica,sans-serif",
					'line-height': menuOption.height,
					'text-transform': (_settings.fontcase == "upper") ? "uppercase" : UNDEFINED 
				});
				_css(selector+":hover", {
					'background-image': menuOptionOver.src ? menuOptionOver.src : UNDEFINED,
					color: _settings.overcolor
				});
				_css(selector+".active", {
					'background-image': menuOptionActive.src ? menuOptionActive.src : UNDEFINED,
					color: _settings.activecolor
				});
			}
			_overlay.setContents(_container);
		}
		
		this.element = function() {
			return _overlay.element();
		};
		
		this.addOption = function(label, value) {
			var option = _createElement(OPTION_CLASS, _container);
			option.id = _id+"_option_"+value;
			option.innerHTML = label;
			option.addEventListener('click', _clickHandler(_options.length, value));
			_options.push(option);
		}
		
		function _clickHandler(index, value) {
			return function() {
				_setActive(index);
				if (_changeHandler) _changeHandler(value);
			}
		}
		
		this.clearOptions = function() {
			while(_options.length > 0) {
				_container.removeChild(_options.pop());
			}
		}

		var _setActive = this.setActive = function(index) {
			for (var i = 0; i < _options.length; i++) {
				var option = _options[i];
				option.className = option.className.replace(" active", "");
				if (i == index) option.className += " active";
			}
		}
		

		function _createElement(className, parent) {
			var elem = document.createElement("div");
			if (className) elem.className = className;
			if (parent) parent.appendChild(elem);
			return elem;
		}
		
		function _getSkinElement(name) {
			var elem = skin.getSkinElement('tooltip', name);
			return elem ? elem : { width: 0, height: 0, src: UNDEFINED };
		}

		this.show = _overlay.show;
		this.hide = _overlay.hide;
		this.offsetX = _overlay.offsetX;
		
		_init();
	}
	
	function _class(className) {
		return "." + className.replace(/ /g, " .");
	}
	
	_css(_class(MENU_CLASS + ' ' + OPTION_CLASS), {
		'background-repeat': "no-repeat",
		cursor: "pointer",
		position: "relative"
	});
	

})(jwplayer);/**
 * jwplayer.html5 model
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils,
		events = jwplayer.events,
		UNDEF = undefined,
		TRUE = true,
		FALSE = false;

	html5.model = function(config) {
		var _model = this, 
			// Video provider
			_video, 
			// HTML5 <video> tag
			_videoTag,
			// Saved settings
			_cookies = utils.getCookies(),
			// Sub-component configurations
			_componentConfigs = {},
			// Defaults
			_defaults = {
				autostart: FALSE,
				controlbar: TRUE,
				controls: TRUE,
				debug: UNDEF,
				fullscreen: FALSE,
				height: 320,
				icons: TRUE,
				item: 0,
				mobilecontrols: FALSE,
				mute: FALSE,
				playlist: [],
				playlistposition: "none",
				playlistsize: 180,
				repeat: FALSE,
				skin: UNDEF,
				stretching: utils.stretching.UNIFORM,
				volume: 90,
				width: 480
			};

		function _parseConfig(config) {
			for (var i in config) {
				config[i] = utils.serialize(config[i]);
			}
			return config;
		}

		function _init() {
			utils.extend(_model, new events.eventdispatcher());
			_model.config = _parseConfig(utils.extend({}, _defaults, _cookies, config));
			utils.extend(_model, {
				id: config.id,
				state : events.state.IDLE,
				duration: -1,
				position: 0,
				buffer: 0,
			}, _model.config);
			// This gets added later
			_model.playlist = [];
			_setComponentConfigs();
			_model.setItem(_model.config.item);
			
			_videoTag = document.createElement("video");
			_video = new html5.video(_videoTag);
			_video.volume(_model.volume);
			_video.mute(_model.mute);
			_video.addGlobalListener(_videoEventHandler);
		}
		
		function _setComponentConfigs() {
			_componentConfigs.display = { showicons: _model.icons };
			_componentConfigs.controlbar = {};
		}

		var _eventMap = {};
		_eventMap[events.JWPLAYER_MEDIA_MUTE] = "mute";
		_eventMap[events.JWPLAYER_MEDIA_VOLUME] = "volume";
		_eventMap[events.JWPLAYER_PLAYER_STATE] = "newstate->state";
		_eventMap[events.JWPLAYER_MEDIA_BUFFER] = "bufferPercent->buffer";
		_eventMap[events.JWPLAYER_MEDIA_TIME] = "position,duration";
			
		function _videoEventHandler(evt) {
			var mappings = (_eventMap[evt.type] ? _eventMap[evt.type].split(",") : []), i, _sendEvent;
			if (mappings.length > 0) {
				for (i=0; i<mappings.length; i++) {
					var mapping = mappings[i],
						split = mapping.split("->"),
						eventProp = split[0],
						stateProp = split[1] ? split[1] : eventProp;
						
					if (_model[stateProp] != evt[eventProp]) {
						_model[stateProp] = evt[eventProp];
						_sendEvent = true;
					}
				}
				if (_sendEvent) {
					_model.sendEvent(evt.type, evt);
				}
			} else {
				_model.sendEvent(evt.type, evt);
			}
		}
		
		_model.getVideo = function() {
			return _video;
		}
		
		_model.seekDrag = function(state) {
			_video.seekDrag(state);
		}
		
		_model.setFullscreen = function(state) {
			if (state != _model.fullscreen) {
				_model.fullscreen = state;
				_model.sendEvent(events.JWPLAYER_FULLSCREEN, { fullscreen: state } );
			}
		}
		
		_model.setPlaylist = function(playlist) {
			_model.playlist = _filterPlaylist(playlist);
			
			if (_model.playlist.length == 0) {
				_model.sendEvent(events.JWPLAYER_ERROR, { message: "Error loading playlist: No playable sources found" });
			} else {
				_model.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
					playlist: playlist
				});
				_model.item = -1;
				_model.setItem(0);
			}
		}

		/** Go through the playlist and choose a single playable type to play; remove sources of a different type **/
		function _filterPlaylist(playlist) {
			var pl = [];
			for (var i=0; i < playlist.length; i++) {
				var item = utils.extend({}, playlist[i]);
				item.sources = utils.filterSources(item.sources);
				if (item.sources.length > 0) {
					pl.push(item)
				}
			}
			return pl;
		}
		
		_model.setItem = function(index) {
			var newItem;
			if (index == _model.playlist.length || index < -1)
				newItem = 0;
			else if (index == -1 || index > _model.playlist.length)
				newItem = _model.playlist.length - 1;
			else
				newItem = index;
			
			if (newItem != _model.item) {
				_model.item = newItem;
				_model.sendEvent(events.JWPLAYER_PLAYLIST_ITEM, {
					"index": _model.item
				});
			}
		}
		
		_model.setVolume = function(newVol) {
			if (_model.mute && newVol > 0) _model.setMute(FALSE);
			newVol = Math.round(newVol);
			if (!_model.mute) {
				utils.saveCookie("volume", newVol);
			}
			_video.volume(newVol);
		}

		_model.setMute = function(state) {
			if (!utils.exists(state)) state = !_model.mute;
			utils.saveCookie("mute", state);
			_video.mute(state);
		}

		_model.componentConfig = function(name) {
			return _componentConfigs[name];
		}
		
		_init();
	}
})(jwplayer.html5);
/**
 * JW Player HTML5 overlay component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		_css = utils.css,
		_setTransition = utils.transitionStyle,

		/** Some CSS constants we should use for minimization **/
		JW_CSS_RELATIVE = "relative",
		JW_CSS_ABSOLUTE = "absolute",
		//JW_CSS_NONE = "none",
		//JW_CSS_BLOCK = "block",
		//JW_CSS_INLINE = "inline",
		//JW_CSS_INLINE_BLOCK = "inline-block",
		JW_CSS_HIDDEN = "hidden",
		//JW_CSS_LEFT = "left",
		//JW_CSS_RIGHT = "right",
		JW_CSS_100PCT = "100%",
		JW_CSS_SMOOTH_EASE = "opacity .15s, visibility .15s, left .01s linear",
		
		OVERLAY_CLASS = '.jwoverlay',
		CONTENTS_CLASS = 'jwcontents',
		
		TOP = "top",
		BOTTOM = "bottom",
		RIGHT = "right",
		LEFT = "left",
		WHITE = "#ffffff",
		
		UNDEFINED = undefined,
		DOCUMENT = document,
		
		_defaults = {
			fontcase: UNDEFINED,
			fontcolor: WHITE,
			fontsize: 12,
			fontweight: UNDEFINED,
			activecolor: WHITE,
			overcolor: WHITE
		};
	
	/** HTML5 Overlay class **/
	html5.overlay = function(id, skin, inverted) {
		var _skin = skin,
			_id = id,
			_container,
			_contents,
			_offset = 0,
			_arrow, _arrowHeight,
			_inverted = inverted,
			_settings = utils.extend({}, _defaults, _skin.getComponentSettings('tooltip')),
			_borderSizes = {},
			_this = this;
		
		function _init() {
			_container = _createElement(OVERLAY_CLASS.replace(".",""));
			_container.id = _id;

			_arrow = _createSkinElement("arrow", "jwarrow")[1];
			_arrowHeight = _arrow.height;
			
			_css(_internalSelector("jwarrow"), {
				position: JW_CSS_ABSOLUTE,
				//bottom: _inverted ? UNDEFINED : -1 * _arrow.height,
				bottom: _inverted ? UNDEFINED : 0,
				top: _inverted ? 0 : UNDEFINED,
				width: _arrow.width,
				height: _arrowHeight,
				left: "50%"
			});

			_createBorderElement(TOP, LEFT);
			_createBorderElement(BOTTOM, LEFT);
			_createBorderElement(TOP, RIGHT);
			_createBorderElement(BOTTOM, RIGHT);
			_createBorderElement(LEFT);
			_createBorderElement(RIGHT);
			_createBorderElement(TOP);
			_createBorderElement(BOTTOM);
			
			_createSkinElement("background", "jwback");
			_css(_internalSelector("jwback"), {
				left: _borderSizes.left,
				right: _borderSizes.right,
				top: _borderSizes.top,
				bottom: _borderSizes.bottom
			});
			
			_contents = _createElement(CONTENTS_CLASS, _container);
			_css(_internalSelector(CONTENTS_CLASS) + " *", {
				color: _settings.fontcolor,
				font: _settings.fontweight + " " + (_settings.fontsize) + "px Arial,Helvetica,sans-serif",
				'text-transform': (_settings.fontcase == "upper") ? "uppercase" : UNDEFINED
			});

			
			if (_inverted) {
				utils.transform(_internalSelector("jwarrow"), "rotate(180deg)");
			}

			_css(_internalSelector(), {
				padding: (_borderSizes.top+1) + "px " + _borderSizes.right + "px " + (_borderSizes.bottom+1) + "px " + _borderSizes.left + "px"  
			});
			
			_this.showing = false;
		}
		
		function _internalSelector(name) {
			return '#' + _id + (name ? " ." + name : "");
		}
		
		function _createElement(className, parent) {
			var elem = DOCUMENT.createElement("div");
			if (className) elem.className = className;
			if (parent) parent.appendChild(elem);
			return elem;
		}


		function _createSkinElement(name, className) {
			var skinElem = _getSkinElement(name),
				elem = _createElement(className, _container);
			
			_css(_internalSelector(className.replace(" ", ".")), {
				'background-image': skinElem.src
			});
			
			return [elem, skinElem];
			
		}
		
		function _createBorderElement(dim1, dim2) {
			if (!dim2) dim2 = "";
			var created = _createSkinElement('cap' + dim1 + dim2, "jwborder jw" + dim1 + (dim2 ? dim2 : "")), 
				elem = created[0],
				skinElem = created[1],
				elemStyle = {
					'background-image': skinElem.src,
					width: (dim1 == LEFT || dim2 == LEFT || dim1 == RIGHT || dim2 == RIGHT) ? skinElem.width: UNDEFINED,
					height: (dim1 == TOP || dim2 == TOP || dim1 == BOTTOM || dim2 == BOTTOM) ? skinElem.height: UNDEFINED
				};
			
			
			elemStyle[dim1] = ((dim1 == BOTTOM && !_inverted) || (dim1 == TOP && _inverted)) ? _arrowHeight : 0;
			if (dim2) elemStyle[dim2] = 0;
			
			_css(_internalSelector(elem.className.replace(/ /g, ".")), elemStyle);
			
			var dim1style = {}, 
				dim2style = {}, 
				dims = { 
					left: skinElem.width, 
					right: skinElem.width, 
					top: (_inverted ? _arrowHeight : 0) + skinElem.height, 
					bottom: (_inverted ? 0 : _arrowHeight) + skinElem.height
				};
			if (dim2) {
				dim1style[dim2] = dims[dim2];
				dim1style[dim1] = 0;
				dim2style[dim1] = dims[dim1];
				dim2style[dim2] = 0;
				_css(_internalSelector("jw"+dim1), dim1style);
				_css(_internalSelector("jw"+dim2), dim2style);
				_borderSizes[dim1] = dims[dim1];
				_borderSizes[dim2] = dims[dim2];
			}
		}

		_this.element = function() {
			return _container;
		};

		var contentsTimeout;
		
		_this.setContents = function(contents) {
			utils.empty(_contents);
			_contents.appendChild(contents);
			clearTimeout(contentsTimeout);
			contentsTimeout = setTimeout(_position, 0);
		}
		
		_this.offsetX = function(offset) {
			_offset = offset;
			clearTimeout(contentsTimeout);
			_position();
		}
		
		function _position() {
			if (_container.clientWidth == 0) return;
			_css(_internalSelector(), {
				'margin-left': Math.round(_offset - _container.clientWidth / 2)
			});
			_css(_internalSelector("jwarrow"), {
				'margin-left': Math.round((_arrow.width / -2) - _offset)
			});
		}
		
		_this.borderWidth = function() {
			return _borderSizes.left
		}

		function _getSkinElement(name) {
			var elem = _skin.getSkinElement('tooltip', name); 
			if (elem) {
				return elem;
			} else {
				return {
					width: 0,
					height: 0,
					src: "",
					image: UNDEFINED,
					ready: false
				}
			}
		}
		
		_this.show = function() {
			_this.showing = true;
			_container.style.opacity = 1;
			_container.style.visibility = "visible";
			//_css(_internalSelector(), { opacity: 1, visibility: "visible" });
		}
		
		_this.hide = function() {
			_this.showing = false;
			_container.style.opacity = 0;
			_container.style.visibility = JW_CSS_HIDDEN;
			//_css(_internalSelector(), { opacity: 0, visibility: JW_CSS_HIDDEN });
		}
		
		// Call constructor
		_init();

	}

	/*************************************************************
	 * Player stylesheets - done once on script initialization;  *
	 * These CSS rules are used for all JW Player instances      *
	 *************************************************************/

	_css(OVERLAY_CLASS, {
		position: JW_CSS_ABSOLUTE,
		visibility: JW_CSS_HIDDEN,
		opacity: 0
	});

	_css(OVERLAY_CLASS + " .jwcontents", {
		position: JW_CSS_RELATIVE,
		'z-index': 1
	});

	_css(OVERLAY_CLASS + " .jwborder", {
		position: JW_CSS_ABSOLUTE,
		'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT
	}, true);

	_css(OVERLAY_CLASS + " .jwback", {
		position: JW_CSS_ABSOLUTE,
		'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT
	});

	_setTransition(OVERLAY_CLASS, JW_CSS_SMOOTH_EASE);
})(jwplayer);/**
 * Main HTML5 player class
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils;
	
	html5.player = function(config) {
		var _api = this,
			_model, 
			_view, 
			_controller,
			_instreamPlayer;

		function _init() {
			_model = new html5.model(config); 
			_api.id = _model.id;
			_view = new html5.view(_api, _model); 
			_controller = new html5.controller(_model, _view);
			
			_api._model = _model;

			jwplayer.utils.css.block();
			
			_initializeAPI();
			
			var setup = new html5.setup(_model, _view, _controller);
			setup.addEventListener(jwplayer.events.JWPLAYER_READY, _readyHandler);
			setup.addEventListener(jwplayer.events.JWPLAYER_ERROR, _errorHandler);
			setup.start();

		}
		
		function _readyHandler(evt) {
			_controller.playerReady(evt);
			utils.css.unblock();
		}

		function _errorHandler(evt) {
			utils.log('There was a problem setting up the player: ', evt);
			utils.css.unblock();
		}
		
		function _initializeAPI() {
			
			/** Methods **/
			_api.jwPlay = _controller.play;
			_api.jwPause = _controller.pause;
			_api.jwStop = _controller.stop;
			_api.jwSeek = _controller.seek;
			_api.jwSetVolume = _controller.setVolume;
			_api.jwSetMute = _controller.setMute;
			_api.jwLoad = _controller.load;
			_api.jwPlaylistNext = _controller.next;
			_api.jwPlaylistPrev = _controller.prev;
			_api.jwPlaylistItem = _controller.item;
			_api.jwSetFullscreen = _controller.setFullscreen;
			_api.jwResize = _view.resize;		
			_api.jwSeekDrag = _model.seekDrag;
			_api.jwSetStretching = _controller.setStretching;
			_api.jwGetQualityLevels = _controller.getQualityLevels;
			_api.jwGetCurrentQuality = _controller.getCurrentQuality;
			_api.jwSetCurrentQuality = _controller.setCurrentQuality;
			_api.jwGetCaptionsList = _controller.getCaptionsList;
			_api.jwGetCurrentCaptions = _controller.getCurrentCaptions;
			_api.jwSetCurrentCaptions = _controller.setCurrentCaptions;
			_api.jwSetControls = _view.setControls;
			_api.jwGetSafeRegion = _view.getSafeRegion; 
			
			_api.jwGetPlaylistIndex = _statevarFactory('item');
			_api.jwGetPosition = _statevarFactory('position');
			_api.jwGetDuration = _statevarFactory('duration');
			_api.jwGetBuffer = _statevarFactory('buffer');
			_api.jwGetWidth = _statevarFactory('width');
			_api.jwGetHeight = _statevarFactory('height');
			_api.jwGetFullscreen = _statevarFactory('fullscreen');
			_api.jwGetVolume = _statevarFactory('volume');
			_api.jwGetMute = _statevarFactory('mute');
			_api.jwGetState = _statevarFactory('state');
			_api.jwGetStretching = _statevarFactory('stretching');
			_api.jwGetPlaylist = _statevarFactory('playlist');
			_api.jwGetControls = _statevarFactory('controls');

			/** InStream API **/
			_api.jwDetachMedia = _controller.detachMedia;
			_api.jwAttachMedia = _controller.attachMedia;
			
			_api.jwLoadInstream = function(item, options) {
				if (!_instreamPlayer) {
					_instreamPlayer = new html5.instream(_api, _model, _view, _controller);
				}
				setTimeout(function() {
					_instreamPlayer.load(item, options);
				}, 10);
			}
			
			_api.jwInstreamDestroy = function() {
				if (_instreamPlayer) {
					_instreamPlayer.jwInstreamDestroy();
				}
			}
			
			/** Events **/
			_api.jwAddEventListener = _controller.addEventListener;
			_api.jwRemoveEventListener = _controller.removeEventListener;
			
			/** Dock **/
			_api.jwDockAddButton = _view.addButton;
			_api.jwDockRemoveButton = _view.removeButton;
						
		}

		/** Getters **/
		
		function _statevarFactory(statevar) {
			return function() {
				return _model[statevar];
			};
		}
		


		_init();
	}
})(jwplayer.html5);

/**
 * jwplayer Playlist component for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var WHITE = "#FFFFFF",
		CCC = "#CCCCCC",
		THREES = "#333333",
		NINES = "#999999",
		NORMAL = "normal",
		_defaults = {
			size: 180,
			//position: html5.view.positions.NONE,
			//thumbs: true,
			// Colors
			backgroundcolor: THREES,
			fontcolor: NINES,
			overcolor: CCC,
			activecolor: CCC,
			titlecolor: CCC,
			titleovercolor: WHITE,
			titleactivecolor: WHITE,
			
			fontweight: NORMAL,
			titleweight: NORMAL,
			fontsize: 11,
			titlesize: 13
		},

		events = jwplayer.events,
		utils = jwplayer.utils, 
		_css = utils.css,
		
		PL_CLASS = '.jwplaylist',
		DOCUMENT = document,
		
		/** Some CSS constants we should use for minimization **/
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_RELATIVE = "relative",
		JW_CSS_HIDDEN = "hidden",
		JW_CSS_100PCT = "100%";
	
	html5.playlistcomponent = function(api, config) {
		var _api = api,
			_skin = _api.skin,
			_settings = utils.extend({}, _defaults, _api.skin.getComponentSettings("playlist"), config),
			_wrapper,
			_container,
			_playlist,
			_items,
			_ul,
			_lastCurrent = -1,
			_clickedIndex,
			_slider,
			_itemheight = 60,
			_elements = {
				'background': undefined,
				'divider': undefined,
				'item': undefined,
				'itemOver': undefined,
				'itemImage': undefined,
				'itemActive': undefined
			};

		this.element = function() {
			return _wrapper;
		};
		
		this.redraw = function() {
			if (_slider) _slider.redraw();
		};
		
		this.show = function() {
			_show(_wrapper);
		}

		this.hide = function() {
			_hide(_wrapper);
		}


		function _setup() {
			_wrapper = _createElement("div", "jwplaylist"); 
			_wrapper.id = _api.id + "_jwplayer_playlistcomponent";
			
			_container = _createElement("div", "jwlistcontainer");
			_appendChild(_wrapper, _container);
			
			_populateSkinElements();
			if (_elements.item) {
				_itemheight = _elements.item.height;
			}
			
			_setupStyles();
			
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_LOADED, _rebuildPlaylist);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
		}
		
		function _internalSelector(className) {
			return '#' + _wrapper.id + (className ? ' .' + className : "");
		}
		
		function _setupStyles() {
			var imgPos = 0, imgWidth = 0, imgHeight = 0; 

			utils.clearCss(_internalSelector());

			_css(_internalSelector(), {
				'background-color':	_settings.backgroundcolor 
			});
			
			_css(_internalSelector("jwlist"), {
				'background-image': _elements.background ? " url("+_elements.background.src+")" : "",
			});
			
			_css(_internalSelector("jwlist" + " *"), {
				color: _settings.fontcolor,
				font: _settings.fontweight + " " + _settings.fontsize + "px Arial, Helvetica, sans-serif"
			});

			
        	if (_elements.itemImage) {
        		imgPos = (_itemheight - _elements.itemImage.height) / 2 + "px ";
        		imgWidth = _elements.itemImage.width;
        		imgHeight = _elements.itemImage.height;
        	} else {
        		imgWidth = _itemheight * 4 / 3;
        		imgHeight = _itemheight
        	}
			
        	if (_elements.divider) {
        		_css(_internalSelector("jwplaylistdivider"), {
        			'background-image': "url("+_elements.divider.src + ")",
        			'background-size': JW_CSS_100PCT + " " + _elements.divider.height + "px",
        			width: JW_CSS_100PCT,
        			height: _elements.divider.height
        		});
        	}
        	
        	_css(_internalSelector("jwplaylistimg"), {
			    height: imgHeight,
			    width: imgWidth,
				margin: imgPos ? (imgPos + imgPos + imgPos + imgPos) : "0 5px 0 0"
        	});
			
			_css(_internalSelector("jwlist li"), {
				'background-image': _elements.item ? "url("+_elements.item.src+")" : "",
				height: _itemheight,
				'background-size': JW_CSS_100PCT + " " + _itemheight + "px",
		    	cursor: 'pointer'
			});

			var activeStyle = { overflow: 'hidden' };
			if (_settings.activecolor !== "") activeStyle.color = _settings.activecolor;
			if (_elements.itemActive) activeStyle['background-image'] = "url("+_elements.itemActive.src+")";
			_css(_internalSelector("jwlist li.active"), activeStyle);
			_css(_internalSelector("jwlist li.active .jwtitle"), {
				color: _settings.titleactivecolor
			});

			var overStyle = { overflow: 'hidden' };
			if (_settings.overcolor !== "") overStyle.color = _settings.overcolor;
			if (_elements.itemOver) overStyle['background-image'] = "url("+_elements.itemOver.src+")";
			_css(_internalSelector("jwlist li:hover"), overStyle);
			_css(_internalSelector("jwlist li:hover .jwtitle"), {
				color: _settings.titleovercolor
			});


			_css(_internalSelector("jwtextwrapper"), {
				//padding: "0 5px 0 " + (imgPos ? 0 : "5px"),
				height: _itemheight - 5,
				position: JW_CSS_RELATIVE
			});
			
			_css(_internalSelector("jwtitle"), {
	    		height: 15,
	        	overflow: 'hidden',
	        	display: "inline-block",
	        	width: JW_CSS_100PCT,
	        	color: _settings.titlecolor,
	        	'margin-top': imgPos ? imgPos : 7,
	        	'line-height': 13,
		    	'font-size': _settings.titlesize,
	        	'font-weight': _settings.titleweight
	    	});
			
			
			_css(_internalSelector("jwdescription"), {
	    	    display: 'block',
	    	    'font-size': _settings.fontsize,
	    	    'line-height': 19,
	    	    'margin-top': 5,
	        	overflow: 'hidden',
	        	height: _itemheight,
	        	position: JW_CSS_RELATIVE
	    	});

		}

		function _createList() {
			var ul = _createElement("ul", "jwlist");
			ul.id = _wrapper.id + "_ul" + Math.round(Math.random()*10000000);
			return ul;
		}


		function _createItem(index) {
			var item = _playlist[index],
				li = _createElement("li", "jwitem"),
				div;
			
			li.id = _ul.id + '_item_' + index;

	        if (index > 0) {
	        	div = _createElement("div", "jwplaylistdivider");
	        	_appendChild(li, div);
	        }
		        
			var imageWrapper = _createElement("div", "jwplaylistimg jwfill");
        	
			if (_showThumbs() && (item.image || item['playlist.image'] || _elements.itemImage) ) {
				var imageSrc; 
				if (item['playlist.image']) {
					imageSrc = item['playlist.image'];	
				} else if (item.image) {
					imageSrc = item.image;
				} else if (_elements.itemImage) {
					imageSrc = _elements.itemImage.src;
				}
	        	
	        	_css('#'+li.id+' .jwplaylistimg', {
					'background-image': imageSrc ? 'url('+imageSrc+')': null
	        	});
	        	
				_appendChild(li, imageWrapper);
	        }
			
			var textWrapper = _createElement("div", "jwtextwrapper");
        	var title = _createElement("span", "jwtitle");
        	title.innerHTML = (item && item.title) ? item.title : "";
        	_appendChild(textWrapper, title);

	        if (item.description) {
	        	var desc = _createElement("span", "jwdescription");
	        	desc.innerHTML = item.description;
	        	_appendChild(textWrapper, desc);
	        }
	        
	        _appendChild(li, textWrapper);
			return li;
		}
		
		function _createElement(type, className) {
			var elem = DOCUMENT.createElement(type);
			if (className) elem.className = className;
			return elem;
		}
		
		function _appendChild(parent, child) {
			parent.appendChild(child);
		}
			
		function _rebuildPlaylist(evt) {
			_container.innerHTML = "";
			
			_playlist = _getPlaylist();
			if (!_playlist) {
				return;
			}
			items = [];
			_ul = _createList();
			
			for (var i=0; i<_playlist.length; i++) {
				var li = _createItem(i);
				li.onclick = _clickHandler(i);
				_appendChild(_ul, li);
				items.push(li);
			}
			
			_lastCurrent = _api.jwGetPlaylistIndex();
			
			if (utils.isIOS() && window.iScroll) {
				_wrapper.innerHTML = "";
				_appendChild(_wrapper, _ul);
				_ul.style.height = _itemheight * _playlist.length + "px";
				var myscroll = new iScroll(_wrapper.id);
			} else {
				_appendChild(_container, _ul);
				_slider = new html5.playlistslider(_wrapper.id + "_slider", _api.skin, _wrapper, _ul);
			}
			
		}
		
		function _getPlaylist() {
			var list = _api.jwGetPlaylist();
			var strippedList = [];
			for (var i=0; i<list.length; i++) {
				if (!list[i]['ova.hidden']) {
					strippedList.push(list[i]);
				}
			}
			return strippedList;
		}
		
		function _clickHandler(index) {
			return function() {
				_clickedIndex = index;
				_api.jwPlaylistItem(index);
				_api.jwPlay(true);
			}
		}
		
		function _scrollToItem() {
			var idx = _api.jwGetPlaylistIndex();
			// No need to scroll if the user clicked the current item
			if (idx == _clickedIndex) return;
			_clickedIndex = -1;
				
			if (utils.isIOS() && window.iScroll) {
				_ul.scrollTop = idx * _itemheight;
			} else if (_slider && _slider.visible()) {
				_slider.thumbPosition(idx / (_api.jwGetPlaylist().length-1)) ;
			}
		}

		function _showThumbs() {
			return true;//_settings.thumbs.toString().toLowerCase() == "true";	
		}

		function _itemHandler(evt) {
			if (_lastCurrent >= 0) {
				DOCUMENT.getElementById(_ul.id + '_item_' + _lastCurrent).className = "jwitem";
				_lastCurrent = evt.index;
			}
			DOCUMENT.getElementById(_ul.id + '_item_' + evt.index).className = "jwitem active";
			_scrollToItem();
		}

		
		function _populateSkinElements() {
			for (var element in _elements) {
				_elements[element] = _skin.getSkinElement("playlist", element);
			}
		}
		
		_setup();
		return this;
	};
	
	/** Global playlist styles **/

	_css(PL_CLASS, {
		position: JW_CSS_ABSOLUTE,
	    width: JW_CSS_100PCT,
		height: JW_CSS_100PCT
	});
	
	utils.dragStyle(PL_CLASS, 'none');

	_css(PL_CLASS + ' .jwplaylistimg', {
		position: JW_CSS_RELATIVE,
	    width: JW_CSS_100PCT,
	    'float': 'left',
	    margin: '0 5px 0 0',
		background: "#000",
		overflow: JW_CSS_HIDDEN
	});

	_css(PL_CLASS+' .jwlist', {
		position: JW_CSS_ABSOLUTE,
		width: JW_CSS_100PCT,
    	'list-style': 'none',
    	margin: 0,
    	padding: 0
	});
	
	_css(PL_CLASS+' .jwlistcontainer', {
		position: JW_CSS_ABSOLUTE,
		overflow: JW_CSS_HIDDEN,
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT
	});

	_css(PL_CLASS+' .jwlist li', {
	    width: JW_CSS_100PCT
	});

	_css(PL_CLASS+' .jwtextwrapper', {
		overflow: JW_CSS_HIDDEN
	});

	_css(PL_CLASS+' .jwplaylistdivider', {
		position: JW_CSS_ABSOLUTE
	});

})(jwplayer.html5);
/**
 * JW Player playlist loader
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, utils = _jw.utils, events = _jw.events;

	html5.playlistloader = function() {
		var _eventDispatcher = new events.eventdispatcher();
		utils.extend(this, _eventDispatcher);
		
		this.load = function(playlistfile) {
			utils.ajax(playlistfile, _playlistLoaded, _playlistLoadError);
		}
		
		function _playlistLoaded(loadedEvent) {
			try {
				var rss = loadedEvent.responseXML.firstChild;
				if (html5.parsers.localName(rss) == "xml") {
					rss = rss.nextSibling;
				}
				
				
				if (html5.parsers.localName(rss) != "rss") {
					_playlistError("Not a valid RSS feed");
					return;
				}
				
				var playlist = new _jw.playlist(html5.parsers.rssparser.parse(rss));
				playlist = _filterPlaylist(playlist);
				if (playlist && playlist.length && playlist[0].sources && playlist[0].sources.length && playlist[0].sources[0].file) {
					_eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
						playlist: playlist
					});
				} else {
					_playlistError("No playable sources found");
				}
			} catch (e) {
				_playlistError();
			}
		}
		
		function _filterPlaylist(list) {
			if (!list) return;
			var newList = [], i, item, sources;
			for (i=0; i < list.length; i++) {
				item = list[i];
				sources = utils.filterSources(item.sources);
				
				if (sources && sources.length) {
					item.sources = sources;
					newList.push(item);
				}
			}
			return newList;
		}
		
		function _playlistLoadError(err) {
			_playlistError(err.match(/invalid/i) ? "Not a valid RSS feed" : "");
		}
		
		function _playlistError(msg) {
			_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, {
				message: msg ? msg : 'Error loading file'
			});
		}
	}
})(jwplayer.html5);/**
 * Playlist slider component for the JW Player.
 *
 * @author pablo
 * @version 6.0
 * 
 * TODO: reuse this code for vertical controlbar volume slider
 */
(function(html5) {
	var events = jwplayer.events,
		utils = jwplayer.utils, 
		_css = utils.css,
	
		SLIDER_CLASS = 'jwslider',
		SLIDER_TOPCAP_CLASS = 'jwslidertop',
		SLIDER_BOTTOMCAP_CLASS = 'jwsliderbottom',
		SLIDER_RAIL_CLASS = 'jwrail',
		SLIDER_RAILTOP_CLASS = 'jwrailtop',
		SLIDER_RAILBACK_CLASS = 'jwrailback',
		SLIDER_RAILBOTTOM_CLASS = 'jwrailbottom',
		SLIDER_THUMB_CLASS = 'jwthumb',
		SLIDER_THUMBTOP_CLASS = 'jwthumbtop',
		SLIDER_THUMBBACK_CLASS = 'jwthumbback',
		SLIDER_THUMBBOTTOM_CLASS = 'jwthumbbottom',
	
		DOCUMENT = document,
		WINDOW = window,
		UNDEFINED = undefined,
	
		/** Some CSS constants we should use for minimization **/
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_100PCT = "100%";
	
	html5.playlistslider = function(id, skin, parent, pane) {
		var _skin = skin,
			_id = id,
			_pane = pane,
			_wrapper,
			_rail,
			_thumb,
			_dragging,
			_thumbPercent = 0, 
			_dragTimeout, 
			_dragInterval,
			_visible = true,
			
			// Skin elements
			_sliderCapTop,
			_sliderCapBottom,
			_sliderRail,
			_sliderRailCapTop,
			_sliderRailCapBottom,
			_sliderThumb,
			_sliderThumbCapTop,
			_sliderThumbCapBottom,
			
			_topHeight,
			_bottomHeight,
			_redrawTimeout;


		this.element = function() {
			return _wrapper;
		};

		this.visible = function() {
			return _visible;
		};


		function _setup() {	
			var capTop, capBottom;
			
			_wrapper = _createElement(SLIDER_CLASS, null, parent);
			_wrapper.id = id;
			
			_wrapper.addEventListener('mousedown', _startDrag, false);
			_wrapper.addEventListener('click', _moveThumb, false);
			
			_populateSkinElements();
			
			_topHeight = _sliderCapTop.height;
			_bottomHeight = _sliderCapBottom.height;
			
			_css(_internalSelector(), { width: _sliderRail.width });
			_css(_internalSelector(SLIDER_RAIL_CLASS), { top: _topHeight, bottom: _bottomHeight });
			_css(_internalSelector(SLIDER_THUMB_CLASS), { top: _topHeight });
			
			capTop = _createElement(SLIDER_TOPCAP_CLASS, _sliderCapTop, _wrapper);
			capBottom = _createElement(SLIDER_BOTTOMCAP_CLASS, _sliderCapBottom, _wrapper);
			_rail = _createElement(SLIDER_RAIL_CLASS, null, _wrapper);
			_thumb = _createElement(SLIDER_THUMB_CLASS, null, _wrapper);
			
			capTop.addEventListener('mousedown', _scroll(-1), false);
			capBottom.addEventListener('mousedown', _scroll(1), false);
			
			_createElement(SLIDER_RAILTOP_CLASS, _sliderRailCapTop, _rail);
			_createElement(SLIDER_RAILBACK_CLASS, _sliderRail, _rail, true);
			_createElement(SLIDER_RAILBOTTOM_CLASS, _sliderRailCapBottom, _rail);
			_css(_internalSelector(SLIDER_RAILBACK_CLASS), {
				top: _sliderRailCapTop.height,
				bottom: _sliderRailCapBottom.height
			});
			
			_createElement(SLIDER_THUMBTOP_CLASS, _sliderThumbCapTop, _thumb);
			_createElement(SLIDER_THUMBBACK_CLASS, _sliderThumb, _thumb, true);
			_createElement(SLIDER_THUMBBOTTOM_CLASS, _sliderThumbCapBottom, _thumb);
			
			_css(_internalSelector(SLIDER_THUMBBACK_CLASS), {
				top: _sliderThumbCapTop.height,
				bottom: _sliderThumbCapBottom.height
			});
			
			_redraw();
			
			if (_pane) {
				_pane.addEventListener("mousewheel", _scrollHandler, false);
				_pane.addEventListener("DOMMouseScroll", _scrollHandler, false);
			}
		}
		
		function _internalSelector(className) {
			return '#' + _wrapper.id + (className ? " ." + className : "");
		}
		
		function _createElement(className, skinElement, parent, stretch) {
			var elem = DOCUMENT.createElement("div");
			if (className) {
				elem.className = className;
				if (skinElement) {
					_css(_internalSelector(className), { 
						'background-image': skinElement.src ? skinElement.src : UNDEFINED, 
						'background-repeat': stretch ? "repeat-y" : "no-repeat",
						height: stretch ? UNDEFINED : skinElement.height
					});
				}
			}
			if (parent) parent.appendChild(elem);
			return elem;
		}
		
		function _populateSkinElements() {
			_sliderCapTop = _getElement('sliderCapTop');
			_sliderCapBottom = _getElement('sliderCapBottom');
			_sliderRail = _getElement('sliderRail');
			_sliderRailCapTop = _getElement('sliderRailCapTop');
			_sliderRailCapBottom = _getElement('sliderRailCapBottom');
			_sliderThumb = _getElement('sliderThumb');
			_sliderThumbCapTop = _getElement('sliderThumbCapTop');
			_sliderThumbCapBottom = _getElement('sliderThumbCapBottom');
		}
		
		function _getElement(name) {
			var elem = _skin.getSkinElement("playlist", name);
			return elem ? elem : { width: 0, height: 0, src: UNDEFINED };
		}
		
		var _redraw = this.redraw = function() {
			clearTimeout(_redrawTimeout);
			_redrawTimeout = setTimeout(function() {
				if (_pane && _pane.clientHeight) {
					_setThumbPercent(_pane.parentNode.clientHeight / _pane.clientHeight);
				} else {
					_redrawTimeout = setTimeout(_redraw, 10);
				}
			}, 0);
		}
		

		function _scrollHandler(evt) {
			if (!_visible) return;
			evt = evt ? evt : WINDOW.event;
			var wheelData = evt.detail ? evt.detail * -1 : evt.wheelDelta / 40;
			_setThumbPosition(_thumbPercent - wheelData / 10);
			  
			// Cancel event so the page doesn't scroll
			if(evt.stopPropagation) evt.stopPropagation();
			if(evt.preventDefault) evt.preventDefault();
			evt.cancelBubble = true;
			evt.cancel = true;
			evt.returnValue = false;
			return false;
		};
	
		function _setThumbPercent(pct) {
			if (pct < 0) pct = 0;
			if (pct > 1) {
				_visible = false;
			} else {
				_visible = true;
				_css(_internalSelector(SLIDER_THUMB_CLASS), { height: Math.max(_rail.clientHeight * pct , _sliderThumbCapTop.height + _sliderThumbCapBottom.height) });
			}
			_css(_internalSelector(), { visibility: _visible ? "visible" : "hidden" });
			if (_pane) {
				_pane.style.width = _visible ? _pane.parentElement.clientWidth - _sliderRail.width + "px" : "";
			}
		}

		var _setThumbPosition = this.thumbPosition = function(pct) {
			if (isNaN(pct)) pct = 0;
			_thumbPercent = Math.max(0, Math.min(1, pct));
			_css(_internalSelector(SLIDER_THUMB_CLASS), {
				top: _topHeight + (_rail.clientHeight - _thumb.clientHeight) * _thumbPercent
			});
			if (pane) {
				pane.style.top = (_wrapper.clientHeight - pane.scrollHeight) * _thumbPercent + "px";
			}
		}


		function _startDrag(evt) {
			if (evt.button == 0) _dragging = true;
			DOCUMENT.onselectstart = function() { return false; }; 
			WINDOW.addEventListener('mousemove', _moveThumb, false);
			WINDOW.addEventListener('mouseup', _endDrag, false);
		}
		
		function _moveThumb(evt) {
			if (_dragging || evt.type == "click") {
				var railRect = utils.bounds(_rail),
					rangeTop = _thumb.clientHeight / 2,
					rangeBottom = railRect.height - rangeTop,
					y = evt.pageY - railRect.top,
					pct = (y - rangeTop) / (rangeBottom - rangeTop);
				_setThumbPosition(pct);
			}
		}
		
		function _scroll(dir) {
			return function(evt) {
				if (evt.button > 0) return;
				_setThumbPosition(_thumbPercent+(dir*.05));
				_dragTimeout = setTimeout(function() {
					_dragInterval = setInterval(function() {
						_setThumbPosition(_thumbPercent+(dir*.05));
					}, 50);
				}, 500);
			}
		}
		
		function _endDrag() {
			_dragging = false;
			WINDOW.removeEventListener('mousemove', _moveThumb);
			WINDOW.removeEventListener('mouseup', _endDrag);
			DOCUMENT.onselectstart = UNDEFINED; 
			clearTimeout(_dragTimeout);
			clearInterval(_dragInterval);
		}
		
		_setup();
		return this;
	};
	
	function _globalSelector() {
		var selector=[],i;
		for (i=0; i<arguments.length; i++) {
			selector.push(".jwplaylist ."+arguments[i]);
		}
		return selector.join(',');
	}
	
	/** Global slider styles **/

	_css(_globalSelector(SLIDER_CLASS), {
		position: JW_CSS_ABSOLUTE,
		height: JW_CSS_100PCT,
		visibility: "hidden",
		right: 0,
		top: 0,
		cursor: "pointer",
		'z-index': 1
	});
	
	_css(_globalSelector(SLIDER_CLASS) + ' *', {
		position: JW_CSS_ABSOLUTE,
	    width: JW_CSS_100PCT,
	    'background-position': "center",
	    'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT,
	});

	_css(_globalSelector(SLIDER_TOPCAP_CLASS, SLIDER_RAILTOP_CLASS, SLIDER_THUMBTOP_CLASS), { top: 0 });
	_css(_globalSelector(SLIDER_BOTTOMCAP_CLASS, SLIDER_RAILBOTTOM_CLASS, SLIDER_THUMBBOTTOM_CLASS), { bottom: 0 });

})(jwplayer.html5);
/**
 * JW Player html5 right-click
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils,
		_css = utils.css,

		ABOUT_DEFAULT = "About JW Player ",
		LINK_DEFAULT = "http://www.longtailvideo.com/jwpabout/?a=r&v=",

		DOCUMENT = document,
		RC_CLASS = ".jwclick",
		RC_ITEM_CLASS = RC_CLASS + "_item",

		/** Some CSS constants we should use for minimization **/
		JW_CSS_100PCT = "100%",
		JW_CSS_NONE = "none",
		JW_CSS_BOX_SHADOW = "5px 5px 7px rgba(0,0,0,.10), 0px 1px 0px rgba(255,255,255,.3) inset",
		JW_CSS_WHITE = "#FFF";
	
	html5.rightclick = function(api, config) {
		var _api = api,
			_container,// = DOCUMENT.getElementById(_api.id),
			_config = utils.extend({
				aboutlink: LINK_DEFAULT+html5.version+'&m=h&e=o',
				abouttext: ABOUT_DEFAULT + html5.version + '...'
			}, config),
			_mouseOverContext = false,
			_menu,
			_about;
			
		function _init() {
			_container = DOCUMENT.getElementById(_api.id);
			_menu = _createElement(RC_CLASS);
			_menu.id = _api.id + "_menu";
			_menu.style.display = JW_CSS_NONE;
	        _container.oncontextmenu = _showContext;
	        _menu.onmouseover = function() { _mouseOverContext = true; };
	        _menu.onmouseout = function() { _mouseOverContext = false; };
	        DOCUMENT.addEventListener("mousedown", _hideContext, false);
	        _about = _createElement(RC_ITEM_CLASS);
	        _about.innerHTML = _config.abouttext;
	        _about.onclick = _clickHandler;
	        _menu.appendChild(_about);
	        _container.appendChild(_menu);
		}
		
		function _createElement(className) {
			var elem = DOCUMENT.createElement("div");
			elem.className = className.replace(".", "");
			return elem;
		}
		
		function _clickHandler() {
			window.location.href = _config.aboutlink;
		}
		
	    function _showContext(evt) {
	        if (_mouseOverContext) {
	            // returning because _mouseOverContext is true, indicating the mouse is over the menu
	            return;
	        }

	        // IE doesn't pass the event object
	        if (evt == null) evt = window.event;

	        // we assume we have a standards compliant browser, but check if we have IE
	        // Also, document.body.scrollTop does not work in IE
	        var target = evt.target != null ? evt.target : evt.srcElement,
	        	bounds = utils.bounds(_container),
	        	scrollTop = bounds.top,// ? DOCUMENT.body.scrollTop : DOCUMENT.documentElement.scrollTop,
	        	scrollLeft = bounds.left;// ? DOCUMENT.body.scrollLeft : DOCUMENT.documentElement.scrollLeft;

	        // hide the menu first to avoid an "up-then-over" visual effect
	        _menu.style.display = JW_CSS_NONE;
	        _menu.style.left = evt.pageX - scrollLeft + 'px';
	        _menu.style.top = evt.pageY - scrollTop + 'px';
	        _menu.style.display = 'block';
	        evt.preventDefault();
	    }

	    function _hideContext() {
	        if (_mouseOverContext) {
	            // returning because _mouseOverContext is true, indicating the mouse is over the menu
	            return;
	        }
	        else {
	            _menu.style.display = JW_CSS_NONE;
	        }
	    }

		this.element = function() {
			return _menu;
		}
		
		_init();
	};
	
	_css(RC_CLASS, {
		'background-color': JW_CSS_WHITE,
		'-webkit-border-radius': 5,
		'-moz-border-radius': 5,
		'border-radius': 5,
		height: "auto",
		border: "1px solid #bcbcbc",
		'font-family': '"MS Sans Serif", "Geneva", sans-serif',
		'font-size': 10,
		width: 320,
		'-webkit-box-shadow': JW_CSS_BOX_SHADOW,
		'-moz-box-shadow': JW_CSS_BOX_SHADOW,
		'box-shadow': JW_CSS_BOX_SHADOW,
		position: "absolute",
		'z-index': 999,
	}, true);

	_css(RC_CLASS + " div", {
		padding: "8px 21px",
		margin: '0px',
		'background-color': JW_CSS_WHITE,
		border: "none",
		'font-family': '"MS Sans Serif", "Geneva", sans-serif',
		'font-size': 10,
		color: 'inherit'
	}, true);
	
	_css(RC_ITEM_CLASS, {
		padding: "8px 21px",
		'text-align': 'left',
		cursor: "pointer"
	}, true);

	_css(RC_ITEM_CLASS + ":hover", {
		"background-color": "#595959",
		color: JW_CSS_WHITE
	}, true);

	_css(RC_ITEM_CLASS + " a", {
		'text-decoration': JW_CSS_NONE,
		color: "#000"
	}, true);
	
	_css(RC_CLASS + " hr", {
		width: JW_CSS_100PCT,
		padding: 0,
		margin: 0,
		border: "1px #e9e9e9 solid"
	}, true);

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
	var _jw = jwplayer, utils = _jw.utils, events = _jw.events, playlist = _jw.playlist,
	
		PARSE_CONFIG = 1,
		LOAD_SKIN = 2,
		LOAD_PLAYLIST = 3,
		LOAD_PREVIEW = 4,
		SETUP_COMPONENTS = 5,
		INIT_PLUGINS = 6,
		SEND_READY = 7;

	html5.setup = function(model, view, controller) {
		var _model = model, 
			_view = view,
			_controller = controller,
			_completed = {},
			_depends = {},
			_skin,
			_eventDispatcher = new events.eventdispatcher(),
			_errorState = false,
			_queue = [];
			
		function _initQueue() {
			_addTask(PARSE_CONFIG, _parseConfig);
			_addTask(LOAD_SKIN, _loadSkin, PARSE_CONFIG);
			_addTask(LOAD_PLAYLIST, _loadPlaylist, PARSE_CONFIG);
			_addTask(LOAD_PREVIEW, _loadPreview, LOAD_PLAYLIST);
			_addTask(SETUP_COMPONENTS, _setupComponents, LOAD_PREVIEW + "," + LOAD_SKIN);
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
			var split = dependencies.toString().split(",");
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
			_skin.load(_model.config.skin, _skinLoaded, _skinError);
		}
		
		function _skinLoaded(skin) {
			_taskComplete(LOAD_SKIN);
		}

		function _skinError(message) {
			_error("Error loading skin: " + message);
		}

		function _loadPlaylist() {
			switch(utils.typeOf(_model.config.playlist)) {
			case "string":
				var loader = new html5.playlistloader();
				loader.addEventListener(events.JWPLAYER_PLAYLIST_LOADED, _playlistLoaded);
				loader.addEventListener(events.JWPLAYER_ERROR, _playlistError);
				loader.load(_model.config.playlist);
				break;
			case "array":
				_completePlaylist(new playlist(_model.config.playlist));
			}
		}
		
		function _playlistLoaded(evt) {
			_completePlaylist(evt.playlist);
		}
		
		function _completePlaylist(playlist) {
			_model.setPlaylist(playlist);
			if (_model.playlist[0].sources.length == 0) {
				_error("Error loading playlist: No playable sources found");
			} else {
				_taskComplete(LOAD_PLAYLIST);
			}
		}

		function _playlistError(evt) {
			_error("Error loading playlist: " + evt.message);
		}
		
		function _loadPreview() {
			var preview = _model.playlist[_model.item].image; 
			if (preview) {
				var img = new Image();
				img.addEventListener('load', _previewLoaded, false);
				// If there was an error, continue anyway
				img.addEventListener('error', _previewLoaded, false);
				img.src = preview;
				setTimeout(_previewLoaded, 500);
			} else {
				_taskComplete(LOAD_PREVIEW);	
			}
		}
		
		function _previewLoaded() {
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
			_eventDispatcher.sendEvent(events.JWPLAYER_READY);
			_taskComplete(SEND_READY);
		}
		
		function _error(message) {
			_errorState = true;
			_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, {message: message});
			_view.setupError(message);
		}
		
		utils.extend(this, _eventDispatcher);
		
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
		
		this.load = function(path, completeCallback, errorCallback) {
			new html5.skinloader(path, function(skin) {
				_loaded = true;
				_components = skin;
				if (typeof completeCallback == "function") completeCallback();
			}, function(message) {
				if (typeof errorCallback == "function") errorCallback(message);
			});
			
		};
		
		this.getSkinElement = function(component, element) {
			component = _lowerCase(component);
			element = _lowerCase(element);
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
			component = _lowerCase(component);
			if (_loaded && _components && _components[component]) {
				return _components[component].settings;
			}
			return null;
		};
		
		this.getComponentLayout = function(component) {
			component = _lowerCase(component);
			if (_loaded) {
				var lo = _components[component].layout;
				if (lo && (lo.left || lo.right || lo.center))
					return _components[component].layout;
			}
			return null;
		};
		
		function _lowerCase(string) {
			return string.toLowerCase();
		}
		
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
	var utils = jwplayer.utils,
	
		FORMAT_ERROR = "Skin formatting error";
	
	/** Constructor **/
	html5.skinloader = function(skinPath, completeHandler, errorHandler) {
		var _skin = {},
			_completeHandler = completeHandler,
			_errorHandler = errorHandler,
			_loading = true,
			_completeInterval,
			_skinPath = skinPath,
			_error = false,
			_defaultSkin;
		
		/** Load the skin **/
		function _load() {
			if (typeof _skinPath != "string" || _skinPath === "") {
				_loadSkin(html5.defaultskin().xml);
			} else {
				if (utils.extension(_skinPath) != "xml") {
					_errorHandler("Skin not a valid file type");
					return;
				}
				// Load the default skin first; if any components are defined in the loaded skin, they will overwrite the default
				var defaultLoader = new html5.skinloader("", _defaultLoaded, _errorHandler);
			}
			
		}
		
		
		function _defaultLoaded(defaultSkin) {
			_skin = defaultSkin;
			utils.ajax(utils.getAbsolutePath(_skinPath), function(xmlrequest) {
				try {
					if (utils.exists(xmlrequest.responseXML)){
						_loadSkin(xmlrequest.responseXML);
						return;	
					}
				} catch (err){
					//_clearSkin();
					_errorHandler(FORMAT_ERROR);
				}
			}, function(message) {
				_errorHandler(message);
			});
		}
		
		function _getElementsByTagName(xml, tagName) {
			return xml ? xml.getElementsByTagName(tagName) : null;
		}
		
		function _loadSkin(xml) {
			var skinNode = _getElementsByTagName(xml, 'skin')[0],
				components = _getElementsByTagName(skinNode, 'component'),
				target = skinNode.getAttribute("target"); 

			if (!target || parseFloat(target) > parseFloat(jwplayer.version)) {
				_errorHandler("Incompatible player version")
			}

			if (components.length === 0) {
				// This is legal according to the skin doc - don't produce an error.
				// _errorHandler(FORMAT_ERROR);
				_completeHandler(_skin);
				return;
			}
			for (var componentIndex = 0; componentIndex < components.length; componentIndex++) {
				var componentName = _lowerCase(components[componentIndex].getAttribute("name")),
					component = {
						settings: {},
						elements: {},
						layout: {}
					},
					elements = _getElementsByTagName(_getElementsByTagName(components[componentIndex], 'elements')[0], 'element');
					
				_skin[componentName] = component;

				for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
					_loadImage(elements[elementIndex], componentName);
				}
				var settingsElement = _getElementsByTagName(components[componentIndex], 'settings')[0];
				if (settingsElement && settingsElement.childNodes.length > 0) {
					var settings = _getElementsByTagName(settingsElement, 'setting');
					for (var settingIndex = 0; settingIndex < settings.length; settingIndex++) {
						var name = settings[settingIndex].getAttribute("name");
						var value = settings[settingIndex].getAttribute("value");
						if(/color$/.test(name)) { value = utils.stringToColor(value); }
						component.settings[_lowerCase(name)] = value;
					}
				}
				var layout = _getElementsByTagName(components[componentIndex], 'layout')[0];
				if (layout && layout.childNodes.length > 0) {
					var groups = _getElementsByTagName(layout, 'group');
					for (var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
						var group = groups[groupIndex],
							_layout = {
								elements: []
							};
						component.layout[_lowerCase(group.getAttribute("position"))] = _layout;
						for (var attributeIndex = 0; attributeIndex < group.attributes.length; attributeIndex++) {
							var attribute = group.attributes[attributeIndex];
							_layout[attribute.name] = attribute.value;
						}
						var groupElements = _getElementsByTagName(group, '*');
						for (var groupElementIndex = 0; groupElementIndex < groupElements.length; groupElementIndex++) {
							var element = groupElements[groupElementIndex];
							_layout.elements.push({
								type: element.tagName
							});
							for (var elementAttributeIndex = 0; elementAttributeIndex < element.attributes.length; elementAttributeIndex++) {
								var elementAttribute = element.attributes[elementAttributeIndex];
								_layout.elements[groupElementIndex][_lowerCase(elementAttribute.name)] = elementAttribute.value;
							}
							if (!utils.exists(_layout.elements[groupElementIndex].name)) {
								_layout.elements[groupElementIndex].name = element.tagName;
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
			component = _lowerCase(component);
			var img = new Image(),
				elementName = _lowerCase(element.getAttribute("name")),
				elementSource = element.getAttribute("src"),
				imgUrl;
			
			if (elementSource.indexOf('data:image/png;base64,') === 0) {
				imgUrl = elementSource;
			} else {
				var skinUrl = utils.getAbsolutePath(_skinPath);
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
				_errorHandler("Skin image not found: " + this.src);
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
						if (!_getElement(component, element).ready) {
							return;
						}
					}
				}
			}
			if (_loading == false) {
				clearInterval(_completeInterval);
				_completeHandler(_skin);
			}
		}
		
		function _completeImageLoad(img, element, component) {
			var elementObj = _getElement(component, element);
			if(elementObj) {
				elementObj.height = img.height;
				elementObj.width = img.width;
				elementObj.src = img.src;
				elementObj.ready = true;
				_resetCompleteIntervalTest();
			} else {
				utils.log("Loaded an image for a missing element: " + component + "." + element);
			}
		}
		

		function _getElement(component, element) {
			return _skin[_lowerCase(component)] ? _skin[_lowerCase(component)].elements[_lowerCase(element)] : null;
		}
		
		function _lowerCase(string) {
			return string ? string.toLowerCase() : '';
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
(function(jwplayer) {

	var utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state;
	

	/** HTML5 video class * */
	jwplayer.html5.video = function(videotag) {

		var _mediaEvents = {
			"abort" : _generalHandler,
			"canplay" : _canPlayHandler,
			"canplaythrough" : _generalHandler,
			"durationchange" : _durationUpdateHandler,
			"emptied" : _generalHandler,
			"ended" : _endedHandler,
			"error" : _errorHandler,
			"loadeddata" : _generalHandler,
			"loadedmetadata" : _canPlayHandler,
			"loadstart" : _generalHandler,
			"pause" : _playHandler,
			"play" : _playHandler,
			"playing" : _playHandler,
			"progress" : _progressHandler,
			"ratechange" : _generalHandler,
			"readystatechange" : _generalHandler,
			"seeked" : _sendSeekEvent,
			"seeking" : _generalHandler,
			"stalled" : _generalHandler,
			"suspend" : _generalHandler,
			"timeupdate" : _timeUpdateHandler,
			"volumechange" : _volumeHandler,
			"waiting" : _bufferStateHandler
		},
		
		_extensions = utils.extensionmap,

		// Current playlist item
		_item,
		// Currently playing source
		_source,
		// Current type - used to filter the sources
		_type,
		// Reference to the video tag
		_videotag,
		// Current duration
		_duration,
		// Current position
		_position,
		// Requested seek position
		_seekOffset,
		// Whether seeking is ready yet
		_canSeek,
		// Whether we have sent out the BUFFER_FULL event
		_bufferFull,
		// If we should seek on canplay
		_delayedSeek,
		// If we're currently dragging the seek bar
		_dragging,
		// Current media state
		_state = states.IDLE,
		// Save the volume state before muting
		_lastVolume,
		// Using setInterval to check buffered ranges
		_bufferInterval = -1,
		// Last sent buffer amount
		_bufferPercent = -1,
		// Event dispatcher
		_eventDispatcher = new events.eventdispatcher(),
		// Whether or not we're listening to video tag events
		_attached = false,
		// Quality levels
		_levels,
		// Current quality level index
		_currentQuality = -1,
		// Reference to self
		_this = this;
		
		utils.extend(_this, _eventDispatcher);

		// Constructor
		function _init(videotag) {
			_videotag = videotag;
			_setupListeners();

			// Workaround for a Safari bug where video disappears on switch to fullscreen
			_videotag.controls = true;
			_videotag.controls = false;
			
			_attached = true;
		}

		function _setupListeners() {
			for (var evt in _mediaEvents) {
				_videotag.addEventListener(evt, _mediaEvents[evt], false);
			}
		}

		function _sendEvent(type, data) {
			if (_attached) {
				_eventDispatcher.sendEvent(type, data);
			}
		}

		
		function _generalHandler(evt) {
			//console.log("%s %o (%s,%s)", evt.type, evt);
		}

		function _durationUpdateHandler(evt) {
			if (!_attached) return;
			var newDuration = _round(_videotag.duration);
			if (_duration != newDuration) {
				_duration = newDuration;
			}
			_timeUpdateHandler();
		}

		function _timeUpdateHandler(evt) {
			if (!_attached) return;
			if (_state == states.PLAYING && !_dragging) {
				_position = _round(_videotag.currentTime);
				_sendEvent(events.JWPLAYER_MEDIA_TIME, {
					position : _position,
					duration : _duration
				});
				// Working around a Galaxy Tab bug; otherwise _duration should be > 0
				if (_position >= _duration && _duration > 3 && !utils.isAndroid(2.3)) {
					_complete();
				}
			}
		}

		function _round(number) {
			return Number(number.toFixed(1));
		}

		function _canPlayHandler(evt) {
			_generalHandler(evt);
			if (!_attached) return;
			if (!_canSeek) {
				_canSeek = true;
				_sendBufferFull();
			}
		}
		
		function _progressHandler(evt) {
			if (_canSeek && _delayedSeek > 0) {
				// Need to set a brief timeout before executing delayed seek; IE9 stalls otherwise. 
				setTimeout(function() { _seek(_delayedSeek); }, 200);
			}
		}
		
		function _sendBufferFull() {
			if (!_bufferFull) {
				_bufferFull = true;
				_sendEvent(events.JWPLAYER_MEDIA_BUFFER_FULL);
			}
		}

		function _playHandler(evt) {
			if (!_attached || _dragging) return;
			
			if (_videotag.paused) {
				if (_videotag.currentTime == _videotag.duration && _videotag.duration > 3) {
					// Needed as of Chrome 20
					_complete();
				} else {
					_pause();
				}
			} else {
				_setState(states.PLAYING);
			}
		}

		function _bufferStateHandler(evt) {
			if (!_attached) return;
			_setState(states.BUFFERING);
		}

		function _errorHandler(evt) {
			if (!_attached) return;
			utils.log("Error playing media: %o", _videotag.error);
			_eventDispatcher.sendEvent(events.JWPLAYER_MEDIA_ERROR, {message: "Error loading media: File could not be played"});
			_setState(states.IDLE);
		}

		function _getPublicLevels(levels) {
			var publicLevels;
			if (utils.typeOf(levels)=="array" && levels.length > 0) {
				publicLevels = [];
				for (var i=0; i<levels.length; i++) {
					var level = levels[i], publicLevel = {};
					publicLevel.label = _levelLabel(level) ? _levelLabel(level) : i;
					if (level.width) publicLevel.width = level.width;
					if (level.height) publicLevel.height = level.height;
					if (level.bitrate) publicLevel.bitrate = level.bitrate;
					publicLevels[i] = publicLevel;
				}
			}
			return publicLevels;
		}
		
		function _sendLevels(levels) {
			var publicLevels = _getPublicLevels(levels);
			if (publicLevels) {
				_eventDispatcher.sendEvent(events.JWPLAYER_MEDIA_LEVELS, { levels: publicLevels, currentQuality: _currentQuality });
			}
		}
		
		function _levelLabel(level) {
			if (level.label) return level.label;
			else if (level.height) return level.height + "p";
			else if (level.width) return Math.round(level.width * 9 / 16) + "p";
			else if (level.bitrate) return level.bitrate + "kbps";
			else return 0;
		}
		
		_this.load = function(item) {
			if (!_attached) return;
			_item = item;
			_delayedSeek = 0;
			_duration = item.duration ? item.duration : -1;
			_position = 0;
			
			_levels = _item.sources;
			_pickInitialQuality();
			_sendLevels(_levels);
			
			_completeLoad();
		}
		
		function _pickInitialQuality() {
			if (_currentQuality < 0) _currentQuality = 0;
			var _sortedLevels = _levels.slice(0).sort(function(a, b) { return Number(b.width) - Number(a.width) }),
				bounds = utils.bounds(_videotag),
				i, level;
			for (i=0; i<_sortedLevels.length; i++) {
				level = _sortedLevels[i];
				if (level.width && level.width <= bounds.width) {
					_currentQuality = _levels.indexOf(level);
					break;
				}
			}
		}
		
		function _completeLoad() {
			_canSeek = false;
			_bufferFull = false;
			_source = _levels[_currentQuality];
			
			_setState(states.BUFFERING); 
			_videotag.src = _source.file;
			_videotag.load();
			
			_bufferInterval = setInterval(_sendBufferUpdate, 100);

			if (utils.isIPod() || utils.isAndroid(2.3)) {
				_sendBufferFull();
			}
		}

		var _stop = _this.stop = function() {
			if (!_attached) return;
			_videotag.removeAttribute("src");
			if (!utils.isIE()) _videotag.load();
			_currentQuality = -1;
			clearInterval(_bufferInterval);
			_setState(states.IDLE);
		}

		_this.play = function() {
			if (_attached && !_dragging) _videotag.play();
		}

		var _pause = _this.pause = function() {
			if (_attached) {
				_videotag.pause();
				_setState(states.PAUSED);
			}
		}
			
		_this.seekDrag = function(state) {
			if (!_attached) return; 
			_dragging = state;
			if (state) _videotag.pause();
			else _videotag.play();
		}
		
		var _seek = _this.seek = function(pos) {
			if (!_attached) return; 
			//if (_videotag.readyState >= _videotag.HAVE_FUTURE_DATA) {
			if (_canSeek) {
				_delayedSeek = 0;
				_videotag.currentTime = pos;
			} else {
				_delayedSeek = pos;
			}
		}
		
		function _sendSeekEvent() {
			if (!_dragging) {
				_sendEvent(events.JWPLAYER_MEDIA_SEEK, {
					position: _position,
					offset: _videotag.currentTime
				});
			}
		}

		var _volume = _this.volume = function(vol) {
			_videotag.volume = Math.min(Math.max(0, vol / 100), 1);
		}
		
		function _volumeHandler(evt) {
			_sendEvent(events.JWPLAYER_MEDIA_VOLUME, {
				volume: Math.round(_videotag.volume * 100)
			});
			_sendEvent(events.JWPLAYER_MEDIA_MUTE, {
				mute: _videotag.muted
			});
		}
		
		_this.mute = function(state) {
			if (!utils.exists(state)) state = !_videotag.mute;
			if (state) {
				if (!_videotag.muted) {
					_lastVolume = _videotag.volume * 100;
					_videotag.muted = true;
					_volume(0);
				}
			} else {
				if (_videotag.muted) {
					_volume(_lastVolume);
					_videotag.muted = false;
				}
			}
		}

		/** Set the current player state * */
		function _setState(newstate) {
			// Handles a FF 3.5 issue
			if (newstate == states.PAUSED && _state == states.IDLE) {
				return;
			}
			
			// Ignore state changes while dragging the seekbar
			if (_dragging) return

			if (_state != newstate) {
				var oldstate = _state;
				_state = newstate;
				_sendEvent(events.JWPLAYER_PLAYER_STATE, {
					oldstate : oldstate,
					newstate : newstate
				});
			}
		}
		
		function _sendBufferUpdate() {
			if (!_attached) return; 
			var newBuffer = _getBuffer();
			if (newBuffer != _bufferPercent) {
				_bufferPercent = newBuffer;
				_sendEvent(events.JWPLAYER_MEDIA_BUFFER, {
					bufferPercent: Math.round(_bufferPercent * 100)
				});
			}
			if (newBuffer >= 1) {
				clearInterval(_bufferInterval);
			}
		}
		
		function _getBuffer() {
			if (_videotag.buffered.length == 0 || _videotag.duration == 0)
				return 0;
			else
				return _videotag.buffered.end(_videotag.buffered.length-1) / _videotag.duration;
		}
		
		function _endedHandler() {
			if (utils.isAndroid(2.3)) _complete();
		}
		
		function _complete() {
			//_stop();
			if (_state != states.IDLE) {
				_currentQuality = -1;
				_setState(states.IDLE);
				_sendEvent(events.JWPLAYER_MEDIA_BEFORECOMPLETE);
				_sendEvent(events.JWPLAYER_MEDIA_COMPLETE);
			}
		}
		

		/**
		 * Return the video tag and stop listening to events  
		 */
		_this.detachMedia = function() {
			_attached = false;
			return _videotag;
		}
		
		/**
		 * Begin listening to events again  
		 */
		_this.attachMedia = function() {
			_attached = true;
		}
		
		// Provide access to video tag
		// TODO: remove; used by InStream
		_this.getTag = function() {
			return _videotag;
		}
		
		_this.audioMode = function() {
			if (!_levels) { return false; }
			var type = _levels[0].type;
			return (type == "aac" || type == "mp3" || type == "vorbis");
		}

		_this.setCurrentQuality = function(quality) {
			if (_currentQuality == quality) return;
			quality = parseInt(quality);
			if (quality >=0) {
				if (_levels && _levels.length > quality) {
					_currentQuality = quality;
					_sendEvent(events.JWPLAYER_MEDIA_LEVEL_CHANGED, { currentQuality: quality, levels: _getPublicLevels(_levels)} );
					var currentTime = _videotag.currentTime;
					_completeLoad();
					_this.seek(currentTime);
				}
			}
		}
		
		_this.getCurrentQuality = function() {
			return _currentQuality;
		}
		
		_this.getQualityLevels = function() {
			return _getPublicLevels(_levels);
		}
		
		// Call constructor
		_init(videotag);

	}

})(jwplayer);/**
 * jwplayer.html5 namespace
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var jw = jwplayer, 
		utils = jw.utils, 
		events = jwplayer.events, 
		states = events.state,
		_css = utils.css, 
		_bounds = utils.bounds,
		_isMobile = utils.isMobile(),
		_isIPad = utils.isIPad(),
		_isIPod = utils.isIPod(),
		_isAndroid = utils.isAndroid(),

		DOCUMENT = document, 
		PLAYER_CLASS = "jwplayer", 
		FULLSCREEN_SELECTOR = "."+PLAYER_CLASS+".jwfullscreen",
		VIEW_MAIN_CONTAINER_CLASS = "jwmain",
		VIEW_INSTREAM_CONTAINER_CLASS = "jwinstream",
		VIEW_VIDEO_CONTAINER_CLASS = "jwvideo", 
		VIEW_CONTROLS_CONTAINER_CLASS = "jwcontrols",
		VIEW_PLAYLIST_CONTAINER_CLASS = "jwplaylistcontainer",
		
		/*************************************************************
		 * Player stylesheets - done once on script initialization;  *
		 * These CSS rules are used for all JW Player instances      *
		 *************************************************************/

		TRUE = true,
		FALSE = false,
		
		JW_CSS_SMOOTH_EASE = "opacity .5s ease",
		JW_CSS_100PCT = "100%",
		JW_CSS_ABSOLUTE = "absolute",
		JW_CSS_IMPORTANT = " !important",
		JW_CSS_HIDDEN = "hidden";

	html5.view = function(api, model) {
		var _api = api, 
			_model = model, 
			_playerElement,
			_container,
			_controlsLayer,
			_playlistLayer,
			_controlsTimeout=0,
			_timeoutDuration = 2000,
			_videoTag,
			_videoLayer,
			_instreamLayer,
			_controlbar,
			_display,
			_dock,
			_logo,
			_logoConfig = utils.extend({}, _model.componentConfig("logo")),
			_captions,
			_playlist,
			_audioMode,
			_forcedControls = (_model.mobilecontrols),
			_errorState = FALSE,
			_replayState,
			_readyState,
			_fullscreenInterval,
			_eventDispatcher = new events.eventdispatcher();
		
		utils.extend(this, _eventDispatcher);

		function _init() {
			_playerElement = _createElement("div", PLAYER_CLASS);
			_playerElement.id = _api.id;
			
//			_css(_internalSelector(), {
//				width: _model.width,
//				height: _model.height
//			});
			_resize(_model.width, _model.height);
			
			var replace = document.getElementById(_api.id);
			replace.parentNode.replaceChild(_playerElement, replace);
		}

		this.getCurrentCaptions = function() {
			return _captions.getCurrentCaptions();
		}

		this.setCurrentCaptions = function(caption) {
			_captions.setCurrentCaptions(caption);
		}

		this.getCaptionsList = function() {
			return _captions.getCaptionsList();
		}
		
		this.setup = function(skin) {
			if (_errorState) return;
			_api.skin = skin;
			
			_container = _createElement("span", VIEW_MAIN_CONTAINER_CLASS);
			_videoLayer = _createElement("span", VIEW_VIDEO_CONTAINER_CLASS);
			
			_videoTag = _model.getVideo().getTag();
			_videoLayer.appendChild(_videoTag);
			_controlsLayer = _createElement("span", VIEW_CONTROLS_CONTAINER_CLASS);
			_instreamLayer = _createElement("span", VIEW_INSTREAM_CONTAINER_CLASS);
			_playlistLayer = _createElement("span", VIEW_PLAYLIST_CONTAINER_CLASS);

			_setupControls();
			
			_container.appendChild(_videoLayer);
			_container.appendChild(_controlsLayer);
			_container.appendChild(_instreamLayer);
			
			var newContainer = _createElement("div");
			newContainer.style.position="absolute";
			newContainer.style.width="100%";
			newContainer.style.height="100%";
			newContainer.appendChild(_container);
			newContainer.appendChild(_playlistLayer);
			_playerElement.appendChild(newContainer);
			
			DOCUMENT.addEventListener('webkitfullscreenchange', _fullscreenChangeHandler, FALSE);
			_videoTag.addEventListener('webkitbeginfullscreen', _fullscreenChangeHandler, FALSE);
			_videoTag.addEventListener('webkitendfullscreen', _fullscreenChangeHandler, FALSE);
			DOCUMENT.addEventListener('mozfullscreenchange', _fullscreenChangeHandler, FALSE);
			DOCUMENT.addEventListener('keydown', _keyHandler, FALSE);
			
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_READY, _readyHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
			_api.jwAddEventListener(events.JWPLAYER_PLAYLIST_COMPLETE, _playlistCompleteHandler);

			_stateHandler({newstate:states.IDLE});
			
			_controlsLayer.addEventListener('mouseout', _fadeControls, FALSE);
			_controlsLayer.addEventListener('mousemove', _startFade, FALSE);
			if (utils.isIE()) {
				// Not sure why this is needed
				_videoLayer.addEventListener('mousemove', _startFade, FALSE);
				_videoLayer.addEventListener('click', _display.clickHandler);
			}
			_componentFadeListeners(_controlbar);
			_componentFadeListeners(_dock);
			_componentFadeListeners(_logo);
		}
		
		function _componentFadeListeners(comp) {
			if (comp) {
				comp.element().addEventListener('mousemove', _cancelFade, FALSE);
				comp.element().addEventListener('mouseout', _resumeFade, FALSE);
			}
		}
	
		function _createElement(elem, className) {
			var newElement = DOCUMENT.createElement(elem);
			if (className) newElement.className = className;
			return newElement;
		}
		
		function _startFade() {
			clearTimeout(_controlsTimeout);
			if (_api.jwGetState() == states.PLAYING || _api.jwGetState() == states.PAUSED) {
				_showControls();
				if (!_inCB) {
					_controlsTimeout = setTimeout(_fadeControls, _timeoutDuration);
				}
			}
		}
		
		var _inCB = FALSE;
		
		function _cancelFade() {
			clearTimeout(_controlsTimeout);
			_inCB = TRUE;
		}
		
		function _resumeFade() {
			_inCB = FALSE;
		}
		
		function _fadeControls() {
			if (_api.jwGetState() != states.BUFFERING) {
				_hideControlbar();
				_hideDock();
				_hideLogo();
			}
			clearTimeout(_controlsTimeout);
			_controlsTimeout = 0;
		}

		function forward(evt) {
			_eventDispatcher.sendEvent(evt.type, evt);
		}
		
		function _setupControls() {
			var width = _model.width,
				height = _model.height,
				cbSettings = _model.componentConfig('controlbar'),
				displaySettings = _model.componentConfig('display');

			_checkAudioMode(height);

			_captions = new html5.captions(_api, _model.captions);
			_captions.addEventListener(events.JWPLAYER_CAPTIONS_LIST, forward);
			_captions.addEventListener(events.JWPLAYER_CAPTIONS_CHANGED, forward);
			_controlsLayer.appendChild(_captions.element());

			_display = new html5.display(_api, displaySettings);
			_display.addEventListener(events.JWPLAYER_DISPLAY_CLICK, forward);
			if (_audioMode) _display.hidePreview(TRUE);
			_controlsLayer.appendChild(_display.element());
			
			_logo = new html5.logo(_api, _logoConfig);
			_controlsLayer.appendChild(_logo.element());
			
			_dock = new html5.dock(_api, _model.componentConfig('dock'));
			_controlsLayer.appendChild(_dock.element());
			
			if (_api.edition) {
				new html5.rightclick(_api, {abouttext: _model.abouttext, aboutlink: _model.aboutlink});	
			}
			else {
				new html5.rightclick(_api, {});
			}
			
			if (_model.playlistsize && _model.playlistposition && _model.playlistposition != "none") {
				_playlist = new html5.playlistcomponent(_api, {});
				_playlistLayer.appendChild(_playlist.element());
			}
			
			if (!_isMobile || _forcedControls) {
				// TODO: allow override for showing HTML controlbar on iPads
				_controlbar = new html5.controlbar(_api, cbSettings);
				_controlsLayer.appendChild(_controlbar.element());
				if (_forcedControls) {
					_showControls();
				}
			}
				
			setTimeout(function() {
				_resize(width, height);
			}, 0);
		}

		/** 
		 * Switch to fullscreen mode.  If a native fullscreen method is available in the browser, use that.  
		 * Otherwise, use the false fullscreen method using CSS. 
		 **/
		var _fullscreen = this.fullscreen = function(state) {
			if (!utils.exists(state)) {
				state = !_model.fullscreen;
			}

			if (state) {
				if (!_model.fullscreen) {
					_fakeFullscreen(TRUE);
					if (_playerElement.requestFullScreen) {
						_playerElement.requestFullScreen();
					} else if (_playerElement.mozRequestFullScreen) {
						_playerElement.mozRequestFullScreen();
					} else if (_playerElement.webkitRequestFullScreen) {
						_playerElement.webkitRequestFullScreen();
					}
					_model.setFullscreen(TRUE);
				}
			} else {
		    	_fakeFullscreen(FALSE);
				if (_model.fullscreen) {
					_model.setFullscreen(FALSE);
				    if (DOCUMENT.cancelFullScreen) {  
				    	DOCUMENT.cancelFullScreen();  
				    } else if (DOCUMENT.mozCancelFullScreen) {  
				    	DOCUMENT.mozCancelFullScreen();  
				    } else if (DOCUMENT.webkitCancelFullScreen) {  
				    	DOCUMENT.webkitCancelFullScreen();  
				    } else if (_videoTag.webkitExitFullScreen) {
				    	_videoTag.webkitExitFullScreen();
				    }
				}
				if (_isIPad && _api.jwGetState() == states.PAUSED) {
					setTimeout(_showDisplay, 500);
				}
			}

			_redrawComponent(_controlbar);
			_redrawComponent(_display);
			_redrawComponent(_dock);
			_resizeMedia();
			
			if (_model.fullscreen) {
				// Browsers seem to need an extra second to figure out how large they are in fullscreen...
				_fullscreenInterval = setInterval(_resizeMedia, 200);
			} else {
				clearInterval(_fullscreenInterval);
			}
			_eventDispatcher.sendEvent(events.JWPLAYER_RESIZE);
		}
		
		function _redrawComponent(comp) {
			if (comp) comp.redraw();
		}

		/**
		 * Resize the player
		 */
		function _resize(width, height) {
			//if (_model.fullscreen) return;
			
			if (utils.exists(width) && utils.exists(height)) {
//				_css(_internalSelector(), {
//					width: width,
//					height: height
//				});
				_model.width = width;
				_model.height = height;
			}
			
			_playerElement.style.width = isNaN(width) ? width : width + "px"; 
			_playerElement.style.height = isNaN(height) ? height : height + "px"; 

			if (_display) _display.redraw();
			if (_controlbar) _controlbar.redraw();
			if (_logo) {
				setTimeout(function() {
					_logo.offset(_controlbar && _logo.position().indexOf("bottom") >= 0 ? _controlbar.element().clientHeight + _controlbar.margin() : 0);
					if (_dock) _dock.offset(_logo.position() == "top-left" ? _logo.element().clientWidth + _logo.margin() : 0)
				}, 500);
			}

			var playlistSize = _model.playlistsize,
				playlistPos = _model.playlistposition
			
			if (_playlist && playlistSize && (playlistPos == "right" || playlistPos == "bottom")) {
				_playlist.redraw();
				
				var playlistStyle = { display: "block" }, containerStyle = {};
				playlistStyle[playlistPos] = 0;
				containerStyle[playlistPos] = playlistSize;
				
				if (playlistPos == "right") {
					playlistStyle.width = playlistSize;
				} else {
					playlistStyle.height = playlistSize;
				}
				
				_css(_internalSelector(VIEW_PLAYLIST_CONTAINER_CLASS), playlistStyle);
				_css(_internalSelector(VIEW_MAIN_CONTAINER_CLASS), containerStyle);
			}
			
			_checkAudioMode(height);
			_resizeMedia();

			_eventDispatcher.sendEvent(events.JWPLAYER_RESIZE);
			
			return;
		}
		
		function _checkAudioMode(height) {
			_audioMode = ((!_isMobile || _forcedControls) && height <= 40 && height.toString().indexOf("%") < 0);
			if (_controlbar) {
				if (_audioMode) {
					_controlbar.audioMode(TRUE);
					_showControls();
					_display.hidePreview(TRUE);
					_hideDisplay();
					_showVideo(FALSE);
				} else {
					_controlbar.audioMode(FALSE);
					_updateState(_api.jwGetState());
				}
			}
			if (_logo && _audioMode) {
				_hideLogo();
			}
			//_css(_internalSelector(), {
			_playerElement.style.backgroundColor = _audioMode ? 'transparent' : '#000';
			//});
		}
		
		function _resizeMedia() {
			if (_videoTag) {
				utils.stretch(_model.stretching, 
						_videoTag, 
						_videoLayer.clientWidth, _videoLayer.clientHeight, 
						_videoTag.videoWidth, _videoTag.videoHeight);
			}
		}
		
		this.resize = _resize;
		this.resizeMedia = _resizeMedia;

		var _completeSetup = this.completeSetup = function() {
			_css(_internalSelector(), {opacity: 1});
		}
		
		/**
		 * Listen for keystrokes while in fullscreen mode.  
		 * ESC returns from fullscreen
		 * SPACE toggles playback
		 **/
		function _keyHandler(evt) {
			if (_model.fullscreen) {
				switch (evt.keyCode) {
				// ESC
				case 27:
					_fullscreen(FALSE);
					break;
				// SPACE
//				case 32:
//					if (_model.state == states.PLAYING || _model.state = states.BUFFERING)
//						_api.jwPause();
//					break;
				}
			}
		}
		
		/**
		 * False fullscreen mode. This is used for browsers without full support for HTML5 fullscreen.
		 * This method sets the CSS of the container element to a fixed position with 100% width and height.
		 */
		function _fakeFullscreen(state) {
			if (state) {
				_playerElement.className += " jwfullscreen";
			} else {
				_playerElement.className = _playerElement.className.replace(/\s+jwfullscreen/, "");
			}
		}

		/**
		 * Return whether or not we're in native fullscreen
		 */
		function _isNativeFullscreen() {
			var fsElements = [DOCUMENT.mozFullScreenElement, DOCUMENT.webkitCurrentFullScreenElement, _videoTag.webkitDisplayingFullscreen];
			for (var i=0; i<fsElements.length; i++) {
				if (fsElements[i] && (!fsElements[i].id || fsElements[i].id == _api.id))
					return TRUE;
			}
			return FALSE;
		}
		
		/**
		 * If the browser enters or exits fullscreen mode (without the view's knowing about it) update the model.
		 **/
		function _fullscreenChangeHandler(evt) {
			var fsNow = _isNativeFullscreen();
			if (_model.fullscreen != fsNow) {
				_fullscreen(fsNow);
			}
		}
		
		function _showControlbar() {
			if (_controlbar && _model.controlbar) _controlbar.show();
		}
		function _hideControlbar() {
			if (_controlbar && !_audioMode && !_forcedControls) {
				_controlbar.hide();
//				_setTimeout(function() { _controlbar.style.display="none")
			}
		}
		
		function _showDock() {
			if (_dock && !_audioMode && (!_isMobile || _replayState)) _dock.show();
		}
		function _hideDock() {
			if (_dock && !(_replayState || _forcedControls)) {
				_dock.hide();
			}
		}

		function _showLogo() {
			if (_logo && !_audioMode) _logo.show();
		}
		function _hideLogo() {
			if (_logo && (!_forcedControls || _audioMode)) _logo.hide(_audioMode);
		}

		function _showDisplay() {
			if (_display && _model.controls && !_audioMode) {
				if (!_isIPod || _api.jwGetState() == states.IDLE)
					_display.show();
			}
			if (_isMobile && !_forcedControls) {
				if (_isAndroid) _controlsLayer.style.display = "block";
				if (!(_isMobile && _model.fullscreen)) _videoTag.controls = false;
			}
		}
		function _hideDisplay() {
			if (_display) {
				if (_isMobile && !_forcedControls) {
					if (_isAndroid) _controlsLayer.style.display = "none";
					_videoTag.controls = true;
				}
				_display.hide();
			}
		}

		function _hideControls() {
			_hideControlbar();
			_hideDock();
			_hideLogo();
			_sendControlsEvent();
		}

		function _showControls() {
			if (_model.controls || _audioMode) {
				_showControlbar();
				_showDock();
				_sendControlsEvent();
			}
			_showLogo();
		}

		function _sendControlsEvent() {
			return;
			var height = _bounds(_container).height,
				y = 0;
			if (_controlbar && _controlbar.visible) {
				height -= _bounds(_controlbar.element()).height;
			}
			if (_dock && _dock.visible) {
				y = _bounds(_dock.element()).height;
			}
			if (_dock) {}
			
		}
		
		// Subtracts rect2 rectangle from rect1 rectangle's area
		function _subtractRect(rect1, rect2) {
			if (rect2.right < rect1.left || rect2.left > rect1.right) return rect1;
			if (rect2.bottom < rect1.top || rect2.top > rect1.bottom) return rect1;
			
			var bottomCutout = (rect2.y > rect2.height / 2),  
				newRect = {
					x: rect1.x,
					y: bottomCutout ? rect1.y : rect2.bottom,
					width: rect1.width,
				};
			
		}
		
		function _showVideo(state) {
			state = state && !_audioMode;
			_css(_internalSelector(VIEW_VIDEO_CONTAINER_CLASS), {
				visibility: state ? "visible" : "hidden",
				opacity: state ? 1 : 0
			});
		}

		function _playlistCompleteHandler() {
			_replayState = TRUE;
			_fullscreen(false);
			if (_model.controls) {
				_showDock();
			}
		}

		function _readyHandler(evt) {
			_readyState = TRUE;
		}

		/**
		 * Player state handler
		 */
		var _stateTimeout;
		
		function _stateHandler(evt) {
			_replayState = FALSE;
			clearTimeout(_stateTimeout);
			_stateTimeout = setTimeout(function() {
				_updateState(evt.newstate);
			}, 100);
		}
		
		function _updateState(state) {
			switch(state) {
			case states.PLAYING:
				if (!_model.getVideo().audioMode() || _isMobile) {
					_showVideo(TRUE);
					_resizeMedia();
					_display.hidePreview(TRUE);
					if (_isMobile) {
						if (!(_isIPad && _forcedControls)) {
							_hideDisplay();
						}
					}
				} else {
					_showVideo(FALSE);
					_display.hidePreview(_audioMode);
				}
				_startFade();
				break;
			case states.IDLE:
				if (!_isAndroid) {
					_showVideo(FALSE);
				}
				//_hideControls();
				_fadeControls();
				if (!_audioMode) {
					_display.hidePreview(FALSE);
					_showDisplay();
					if (!_logoConfig.hide) _showLogo();	
				}
//				if (_isIPad) _videoTag.controls = FALSE;
				break;
			case states.BUFFERING:
				_showDisplay();
				if (_isMobile) _showVideo(TRUE);
				else _showControls();
				break;
			case states.PAUSED:
				_showDisplay();
				if (!_isMobile || _forcedControls) {
					_showControls();
//				} else if (_isIPad) {
//					_videoTag.controls = FALSE;
				}
				break;
			}
		}
		
		function _internalSelector(className) {
			return '#' + _api.id + (className ? " ." + className : "");
		}
		
		this.setupInstream = function(instreamDisplay, instreamVideo) {
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), TRUE);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), FALSE);
			_instreamLayer.appendChild(instreamDisplay);
			_instreamVideo = instreamVideo;
			_stateHandler({newstate:states.PLAYING});
			_instreamMode = TRUE;
		}
		
		var _destroyInstream = this.destroyInstream = function() {
			_setVisibility(_internalSelector(VIEW_INSTREAM_CONTAINER_CLASS), FALSE);
			_setVisibility(_internalSelector(VIEW_CONTROLS_CONTAINER_CLASS), TRUE);
			_instreamLayer.innerHTML = "";
			_instreamVideo = null;
			_instreamMode = FALSE;
			_resize(_model.width, _model.height);
		}
		
		this.setupError = function(message) {
			_errorState = true;
			jwplayer.embed.errorScreen(_playerElement, message);
			_completeSetup();
		}
		
		function _setVisibility(selector, state) {
			_css(selector, { display: state ? "block" : "none" });
		}
		
		this.addButton = function(icon, label, handler, id) {
			if (_dock) _dock.addButton(icon, label, handler, id);
		}

		this.removeButton = function(id) {
			if (_dock) _dock.removeButton(id);
		}
		
		this.setControls = function(state) {
			var oldstate = _model.controls,
				newstate = state ? TRUE : FALSE;
			_model.controls = newstate;
			if (newstate != oldstate) {
				if (newstate) {
					_showDisplay();
				} else {
					_hideControls();
					_hideDisplay();
				}
				_eventDispatcher.sendEvent(events.JWPLAYER_CONTROLS, { controls: newstate });
			}
		}
		
		this.getSafeRegion = function() {
			var controls = _model.controls,
				dispBounds = utils.bounds(_container),
				dispOffset = dispBounds.top,
				cbBounds = utils.bounds(_controlbar.element()),
				dockButtons = (_dock.numButtons() > 0),
				dockBounds = utils.bounds(_dock.element()),
				logoBounds = utils.bounds(_logo.element()),
				logoTop = (_logo.position().indexOf("top") == 0), 
				bounds = {};
			
			bounds.x = 0;
			bounds.y = Math.max(dockButtons ? (dockBounds.top + dockBounds.height - dispOffset) : 0, logoTop ? (logoBounds.top + logoBounds.height - dispOffset) : 0);
			bounds.width = dispBounds.width;
			bounds.height = (logoTop ? cbBounds.top : logoBounds.top) - bounds.y - dispOffset;
			
			return {
				x: 0,
				y: controls ? bounds.y : 0,
				width: controls ? bounds.width : 0,
				height: controls ? bounds.height : 0
			}
		}

		_init();

		
	}

	// Container styles
	_css('.' + PLAYER_CLASS, {
		position: "relative",
		opacity: 0,
		'min-height': utils.isMobile() ? 200 : 0,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_MAIN_CONTAINER_CLASS, {
		position : JW_CSS_ABSOLUTE,
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS + ' ,.'+ VIEW_CONTROLS_CONTAINER_CLASS, {
		position : JW_CSS_ABSOLUTE,
		height : JW_CSS_100PCT,
		width: JW_CSS_100PCT,
    	'-webkit-transition': JW_CSS_SMOOTH_EASE,
    	'-moz-transition': JW_CSS_SMOOTH_EASE,
    	'-o-transition': JW_CSS_SMOOTH_EASE
	});

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS, {
		visibility: "hidden",
		overflow: "hidden",
		cursor: "pointer"
	});

	_css('.' + VIEW_VIDEO_CONTAINER_CLASS + " video", {
		background : "transparent",
		width : JW_CSS_100PCT,
		height : JW_CSS_100PCT
	});

	_css('.' + VIEW_PLAYLIST_CONTAINER_CLASS, {
		position: JW_CSS_ABSOLUTE,
		height : JW_CSS_100PCT,
		width: JW_CSS_100PCT,
		display: "none"
	});
	
	_css('.' + VIEW_INSTREAM_CONTAINER_CLASS, {
		position: JW_CSS_ABSOLUTE,
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		display: 'none'
	});

	// Fullscreen styles
	
	_css(FULLSCREEN_SELECTOR, {
		width: JW_CSS_100PCT,
		height: JW_CSS_100PCT,
		left: 0, 
		right: 0,
		top: 0,
		bottom: 0,
		'z-index': 1000,
		position: "fixed"
	}, TRUE);

	_css(FULLSCREEN_SELECTOR + ' .'+ VIEW_MAIN_CONTAINER_CLASS, {
		left: 0, 
		right: 0,
		top: 0,
		bottom: 0
	}, TRUE);

	_css(FULLSCREEN_SELECTOR + ' .'+ VIEW_PLAYLIST_CONTAINER_CLASS, {
		display: "none"
	}, TRUE);
	
	_css('.' + PLAYER_CLASS+' .jwuniform', {
		'background-size': 'contain' + JW_CSS_IMPORTANT
	});

	_css('.' + PLAYER_CLASS+' .jwfill', {
		'background-size': 'cover' + JW_CSS_IMPORTANT,
		'background-position': 'center'
	});

	_css('.' + PLAYER_CLASS+' .jwexactfit', {
		'background-size': JW_CSS_100PCT + " " + JW_CSS_100PCT + JW_CSS_IMPORTANT
	});
	
})(jwplayer.html5);
