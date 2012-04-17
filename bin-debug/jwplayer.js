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


})(jwplayer);
/**
 * AJAX File loading capabilities
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {

	/** Loads an XML file into a DOM object * */
	utils.ajax = function(xmldocpath, completecallback, errorcallback) {
		var xmlhttp;
		if (window.XMLHttpRequest) {
			// IE>7, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		} else {
			// IE6
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState === 4) {
				if (xmlhttp.status === 200) {
					if (completecallback) {
						// Handle the case where an XML document was returned with an incorrect MIME type.
						if (!jwplayer.utils.exists(xmlhttp.responseXML)) {
							try {
								if (window.DOMParser) {
									var parsedXML = (new DOMParser()).parseFromString(xmlhttp.responseText,"text/xml");
									if (parsedXML) {
										xmlhttp = jwplayer.utils.extend({}, xmlhttp, {responseXML:parsedXML});
									}
								} else { 
									// Internet Explorer
									parsedXML = new ActiveXObject("Microsoft.XMLDOM");
									parsedXML.async="false";
									parsedXML.loadXML(xmlhttp.responseText);
									xmlhttp = jwplayer.utils.extend({}, xmlhttp, {responseXML:parsedXML});									
								}
							} catch(e) {
								if (errorcallback) {
									errorcallback(xmldocpath);
								}
							}
						}
						completecallback(xmlhttp);
					}
				} else {
					if (errorcallback) {
						errorcallback(xmldocpath);
					}
				}
			}
		};
		try {
			xmlhttp.open("GET", xmldocpath, true);
			xmlhttp.send(null);
		} catch (error) {
			if (errorcallback) {
				errorcallback(xmldocpath);
			}
		}
		return xmlhttp;
	};
	
})(jwplayer.utils);
/**
 * String utilities for the JW Player.
 *
 * @version 6.0
 */
(function(utils) {

	jwplayer.utils.strings = function() {
	};
	
	/** Removes whitespace from the beginning and end of a string **/
	jwplayer.utils.strings.trim = function(inputString) {
		return inputString.replace(/^\s*/, "").replace(/\s*$/, "");
	};
	
	/**
	 * Pads a string
	 * @param {String} string
	 * @param {Number} length
	 * @param {String} padder
	 */
	jwplayer.utils.strings.pad = function (string, length, padder) {
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
	jwplayer.utils.strings.serialize = function(val) {
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
	jwplayer.utils.strings.seconds = function(str) {
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
	jwplayer.utils.strings.xmlAttribute = function(xml, attribute) {
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
	jwplayer.utils.strings.jsonToString = function(obj) {
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
						if (jwplayer.utils.exists(value)) {
							value = jwplayer.utils.strings.jsonToString(value);
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
 * @version 5.4
 */
(function(utils) {
	var _colorPattern = new RegExp(/^(#|0x)[0-9a-fA-F]{3,6}/);
	
	jwplayer.utils.typechecker = function(value, type) {
		type = !jwplayer.utils.exists(type) ? _guessType(value) : type;
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
		if (!jwplayer.utils.exists(type)) {
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
		switch (value.toLowerCase()) {
			case "blue":
				return parseInt("0000FF", 16);
			case "green":
				return parseInt("00FF00", 16);
			case "red":
				return parseInt("FF0000", 16);
			case "cyan":
				return parseInt("00FFFF", 16);
			case "magenta":
				return parseInt("FF00FF", 16);
			case "yellow":
				return parseInt("FFFF00", 16);
			case "black":
				return parseInt("000000", 16);
			case "white":
				return parseInt("FFFFFF", 16);
			default:
				value = value.replace(/(#|0x)?([0-9A-F]{3,6})$/gi, "$2");
				if (value.length == 3) {
					value = value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);
				}
				return parseInt(value, 16);
		}
		
		return parseInt("000000", 16);
	}
	
})(jwplayer.utils);
/**
 * jwplayer.html5 namespace
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	jwplayer.html5 = {};
})(jwplayer);

/**
 * JW Player HTML5 Controlbar component
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	
	var _utils = jwplayer.utils, 
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
		
		CB_CLASS = '.jwcontrolbar';
	
	/** HTML5 Controlbar class **/
	html5.controlbar = function(api, config) {
		var _api;

		var _defaults = {
			backgroundcolor : "",
			margin : 10,
			font : "Arial,sans-serif",
			fontsize : 10,
			fontcolor : parseInt("000000", 16),
			fontstyle : "normal",
			fontweight : "bold",
			buttoncolor : parseInt("ffffff", 16),
			// position : html5.view.positions.BOTTOM,
			position: "OVER",
			idlehide : false,
			hideplaylistcontrols : false,
			forcenextprev : false,
			layout : {
				"left" : {
					"position" : "left",
					"elements" : [ {
						"name" : "play",
						"type" : CB_BUTTON
					}, {
						"name" : "divider",
						"type" : CB_DIVIDER
					}, {
						"name" : "prev",
						"type" : CB_BUTTON
					}, {
						"name" : "divider",
						"type" : CB_DIVIDER
					}, {
						"name" : "next",
						"type" : CB_BUTTON
					}, {
						"name" : "divider",
						"type" : CB_DIVIDER
					}, {
						"name" : "elapsed",
						"type" : CB_TEXT
					} ]
				},
				"center" : {
					"position" : "center",
					"elements" : [ {
						"name" : "time",
						"type" : CB_SLIDER
					} ]
				},
				"right" : {
					"position" : "right",
					"elements" : [ {
						"name" : "duration",
						"type" : CB_TEXT
					}, {
						"name" : "blank",
						"type" : CB_BUTTON
					}, {
						"name" : "divider",
						"type" : CB_DIVIDER
					}, {
						"name" : "mute",
						"type" : CB_BUTTON
					}, {
						"name" : "volume",
						"type" : CB_SLIDER
					}, {
						"name" : "divider",
						"type" : CB_DIVIDER
					}, {
						"name" : "fullscreen",
						"type" : CB_BUTTON
					} ]
				}
			}
		};
		
		var _settings, _layout, _elements;
		
		var _controlbar, _id;

		function _init() {
			_elements = {};
			
			_api = {
				settings: {
					controlbar: {
						position: "OVER"
					}
				},
				id: "player"
			};
			
			config = _utils.extend({}, config);
			_id = _api.id + "_controlbar";
			
			(new html5.skinloader(config.skin, function(skin) {
				_api.skin = skin;
				_settings = _utils.extend({}, _defaults, _api.skin.controlbar.settings, _api.settings.controlbar);
				_layout = (skin.controlbar.layout.left || skin.controlbar.layout.right || skin.controlbar.layout.center) ? skin.controlbar.layout : _defaults.layout;
				_createStyles();
				_buildControlbar();
			}, function(err) { console.log(err); }));
			
			
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
			
			_style(_internalSelector(".text"), {
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
			return document.createElement("span");
		}
		
		function _buildControlbar() {
			_controlbar = _createSpan();
			_controlbar.id = _id;
			_controlbar.className = "jwcontrolbar";

			var capLeft = _buildImage("capLeft");
			var capRight = _buildImage("capRight");
			var bg = _buildImage("background", {
				position: JW_CSS_ABSOLUTE,
				left: _getSkinElement('capLeft').width,
				right: _getSkinElement('capRight').width,
				'backgroundRepeat': "repeat-x"
			}, true);

			_controlbar.style.opacity = 0;
			if (bg) _controlbar.appendChild(bg);
			if (capLeft) _controlbar.appendChild(capLeft);
			_buildLayout();
			if (capRight) _controlbar.appendChild(capRight);

			setTimeout(function() {
				_resize();
				html5.utils.animations.fadeIn(_controlbar, 250);
			},1000);
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
			//element.id = _createElementId(name);
			element.className = name;
			
			var center = nocenter ? "" : "center";

			var skinElem = _getSkinElement(name);
			element.innerHTML = "&nbsp;";
			if (!skinElem || skinElem.src == "") {
				return;
			}
			
			var newStyle;
			
			if (stretch) {
				newStyle = {
					background: "url('" + skinElem.src + "') "+center+" repeat-x"
				};
			} else {
				newStyle = {
					background: "url('" + skinElem.src + "') "+center+" no-repeat",
					width: skinElem.width
				};
			}
			
			_style(_internalSelector('.'+name), _utils.extend(newStyle, style));
			_elements[name] = element;
			return element;
		}

		function _buildButton(name) {
			var element = document.createElement("button");
			//element.id = _createElementId(name);
			element.className = name;

			var outSkin = _getSkinElement(name + "Button");
			var overSkin = _getSkinElement(name + "ButtonOver");
			
			element.innerHTML = "&nbsp;";
			if (!outSkin.src) {
				return element;
			}
			
			_style(_internalSelector('.'+name), { 
				width: outSkin.width,
				background: 'url('+ outSkin.src +') center no-repeat'
			});
			
			if (overSkin.src) {
				_style(_internalSelector('.'+name) + ':hover', { 
					background: 'url('+ overSkin.src +') center no-repeat'
				});
			}

			_elements[name] = element;
			
			return element;
		}

		function _createElementId(name) {
			//return (_id + "_" + name + Math.round(Math.random()*10000000));
			return _id + "_" + name;
		}
		
		function _buildText(name, style) {
			var element = _createSpan();
			element.id = _createElementId(name); 
			element.className = "text " + name;
			
			var css = {};
			
			var skinElement = _getSkinElement(name+"Background");
			if (skinElement.src) {
				css.background = "url(" + skinElement.src + ") no-repeat center";
				css['background-size'] = "100% " + _getSkinElement("background").height + "px";
			}

			_style(_internalSelector('.'+name), css);
			element.innerHTML = "00:00";
			_elements[name] = element;
			return element;
		}
		
		function _buildDivider(divider) {
			if (divider.width) {
				var element = _createSpan();
				element.className = "blankDivider";
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
			//slider.id = _createElementId(name);
			slider.className = "slider " + name;

			var rail = _createSpan();
			rail.className = "rail";

			var railElements = ['Rail', 'Buffer', 'Progress'];

			for (var i=0; i<railElements.length; i++) {
				var element = _buildImage(name + "Slider" + railElements[i], null, true, (name=="volume"));
				if (element) {
					element.className += " stretch";
					rail.appendChild(element);
				}
			}
			
			var thumb = _buildImage(name + "SliderThumb");
			if (thumb) {
				thumb.className += " thumb";
				rail.appendChild(thumb);
			}

			var capLeft = _buildImage(name + "SliderCapLeft");
			var capRight = _buildImage(name + "SliderCapRight");
			if (capRight) capRight.className += " capRight";

			if (capLeft) slider.appendChild(capLeft);
			slider.appendChild(rail);
			if (capLeft) slider.appendChild(capRight);

			_style(_internalSelector("." + name + " .rail"), {
				left: _getSkinElement(name+"SliderCapLeft").width,
				right: _getSkinElement(name+"SliderCapRight").width,
			});

			if (name == "time") {
				_styleTimeSlider(slider);
				_setProgress(0);
				_setBuffer(0);
			} else if (name == "volume") {
				_styleVolumeSlider(slider);
			}

			_elements[name] = slider;
			
		return slider;
		}
	
		function _styleTimeSlider(slider) {
			if (_elements['timeSliderThumb']) {
				_style(_internalSelector(".timeSliderThumb"), {
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
			
			_style(_internalSelector(".volume"), {
				width: (capLeftWidth + railWidth + capRightWidth),
				margin: (capLeftWidth * capRightWidth == 0) ? "0 5px" : 0 
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
			
			_style(_internalSelector(".right"), {
				right: _getSkinElement("capRight").width
			});
		}
		
		
		function _buildGroup(pos) {
			var elem = _createSpan();
			elem.className = "group " + pos;
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
			_style(_internalSelector('.group.center'), {
				left: _utils.parseDimension(_groups.left.offsetWidth) + _getSkinElement("capLeft").width,
				right: _utils.parseDimension(_groups.right.offsetWidth) + _getSkinElement("capRight").width
			});
		}
		
		this.getDisplayElement = function() {
			return _controlbar;
		};
		
		var _setBuffer = this.setBuffer = function(pct) {
			pct = Math.min(Math.max(0, pct), 1);
			_elements['timeSliderBuffer'].style.width = 100 * pct + "%";
		}

		function _sliderPercent(name, pct, fixedWidth) {
			pct = Math.min(Math.max(0, pct), 1);
			
			var progress = _elements[name+'SliderProgress'];
			var thumb = _elements[name+'SliderThumb'];
			
			if (progress) {
				progress.style.width = 100 * pct + "%";
			}
			if (thumb) {
				thumb.style.left = pct * _utils.parseDimension(_elements[name+'SliderRail'].clientWidth) + "px";
				//thumb.style.opacity = 0.5; //(pct <= 0 || pct >= 1) ? 0 : 1;
			}
		}
		
		var _setVolume = this.setVolume = function(pct) {
			_sliderPercent('volume', pct, true);
		}

		var _setProgress = this.setProgress = function(pct) {
			_sliderPercent('time', pct);
		}

		this.getSkin = function() { return _api.skin; }
		
		function _getSkinElement(name) {
			if (_api.skin.controlbar.elements[name]) {
				return _api.skin.controlbar.elements[name];
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

	/**
	 * General JW Player controlbar styles -- should only be executed once
	 **/
	function _generalStyles() {
		_style(CB_CLASS, {
  			position: JW_CSS_ABSOLUTE,
  			overflow: 'hidden'
		})
  		_style(CB_CLASS+' span',{
  			height: JW_CSS_100PCT,
  			'-webkit-user-select': JW_CSS_NONE,
  			'-webkit-user-drag': JW_CSS_NONE,
  			'user-select': JW_CSS_NONE,
  			'user-drag': JW_CSS_NONE
  		});
  	    _style(CB_CLASS+' .group', {
  	    	display: JW_CSS_INLINE
  	    });
  	    _style(CB_CLASS+' span, '+CB_CLASS+' .group button,'+CB_CLASS+' .left', {
  	    	position: JW_CSS_RELATIVE,
  			'float': JW_CSS_LEFT
  	    });
		_style(CB_CLASS+' .right', {
			position: JW_CSS_RELATIVE,
			'float': JW_CSS_RIGHT
		});
  	    _style(CB_CLASS+' .center', {
  	    	position: JW_CSS_ABSOLUTE,
  			'float': JW_CSS_LEFT
 	    });
  	    _style(CB_CLASS+' button', {
  	    	display: JW_CSS_INLINE_BLOCK,
  	    	height: JW_CSS_100PCT,
  	    	border: JW_CSS_NONE,
  	    	cursor: 'pointer',
  	    	'-webkit-transition': 'background .5s',
  	    	'-moz-transition': 'background .5s',
  	    	'-o-transition': 'background 1s'
  	    });
  	    _style(CB_CLASS+' .capRight', { 
			right: 0,
			position: JW_CSS_ABSOLUTE
		});
  	    _style(CB_CLASS+' .time,' + CB_CLASS + ' .group span.stretch', {
  	    	position: JW_CSS_ABSOLUTE,
  	    	height: JW_CSS_100PCT,
  	    	width: JW_CSS_100PCT,
  	    	left: 0
  	    });
  	    _style(CB_CLASS+' .rail,' + CB_CLASS + ' .thumb', {
  	    	position: JW_CSS_ABSOLUTE,
  	    	height: JW_CSS_100PCT
  	    });
  	    _style(CB_CLASS + ' .timeSliderThumb', {
  	    	'-webkit-transition': 'left .5s linear 0s, opacity .5s ease .5s',
  	    	'-moz-transition': 'left .5s linear 0s, opacity .5s ease .5s'
  	    	//OTransition: 'left .5s linear 0s, opacity .5s ease .5s' -- this produces console errors in Opera
  	    });	  	    
  	    _style(CB_CLASS + ' .timeSliderProgress,' + CB_CLASS + ' .timeSliderBuffer', {
  	    	'-webkit-transition': 'width .5s linear',
  	    	'-moz-transition': 'width .5s linear',
  	    	'-o-transition': 'width .5s linear'
  	    });
  	    _style(CB_CLASS + ' .volume', {
  	    	display: JW_CSS_INLINE_BLOCK
  	    });
  	    _style(CB_CLASS + ' .divider+.divider', {
  	    	display: JW_CSS_NONE
  	    });
  	    _style(CB_CLASS + ' .text', {
			padding: '0 5px',
			textAlign: 'center'
		});

	}
	
	_generalStyles();
})(jwplayer.html5);/**
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
 * JW Player component that loads PNG skins.
 *
 * @author zach
 * @version 5.4
 */
(function(jwplayer) {
	jwplayer.html5.skin = function() {
		var _components = {};
		var _loaded = false;
		
		this.load = function(path, callback) {
			new jwplayer.html5.skinloader(path, function(skin) {
				_loaded = true;
				_components = skin;
				callback();
			}, function() {
				new jwplayer.html5.skinloader("", function(skin) {
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
})(jwplayer);
/**
 * JW Player component that loads PNG skins.
 *
 * @author zach
 * @version 5.7
 */
(function(jwplayer) {
	/** Constructor **/
	jwplayer.html5.skinloader = function(skinPath, completeHandler, errorHandler) {
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
				_loadSkin(jwplayer.html5.defaultskin().xml);
			} else {
				jwplayer.utils.ajax(jwplayer.utils.getAbsolutePath(_skinPath), function(xmlrequest) {
					try {
						if (jwplayer.utils.exists(xmlrequest.responseXML)){
							_loadSkin(xmlrequest.responseXML);
							return;	
						}
					} catch (err){
						_clearSkin();
					}
					_loadSkin(jwplayer.html5.defaultskin().xml);
				}, function(path) {
					_loadSkin(jwplayer.html5.defaultskin().xml);
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
						_skin[componentName].settings[name] = jwplayer.utils.typechecker(value, type);
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
							if (!jwplayer.utils.exists(_skin[componentName].layout[group.getAttribute("position")].elements[groupElementIndex].name)) {
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
				var skinUrl = jwplayer.utils.getAbsolutePath(_skinPath);
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
				jwplayer.utils.log("Loaded an image for a missing element: " + component + "." + element);
			}
		}
		
		_load();
	};
})(jwplayer);
/**
 * Video tag stuff
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayerhtml5) {
	
  /** HTML5 video class * */
  jwplayerhtml5.video = function(videotag) {
	  
	  var _mediaEvents = {
		  "abort": _videoEventHandler,
		  "canplay": _canPlayHandler,
		  "canplaythrough": _videoEventHandler,
		  "durationchange": _videoEventHandler,
		  "emptied": _videoEventHandler,
		  "ended": _videoEventHandler,
		  "error": _errorHandler,
		  "loadeddata": _videoEventHandler,
		  "loadedmetadata": _videoEventHandler,
		  "loadstart": _videoEventHandler,
		  "pause": _videoEventHandler,
		  "play": _videoEventHandler,
		  "playing": _videoEventHandler,
		  "progress": _videoEventHandler,
		  "ratechange": _videoEventHandler,
		  "readystatechange": _videoEventHandler,
		  "seeked": _videoEventHandler,
		  "seeking": _videoEventHandler,
		  "stalled": _videoEventHandler,
		  "suspend": _videoEventHandler,
		  "timeupdate": _videoEventHandler,
		  "volumechange": _videoEventHandler,
		  "waiting": _videoEventHandler
	  };
	  
	  // Reference to the video tag
	  var _video;
	  // Whether seeking is ready yet
	  var _canSeek;
	  // If we should seek on canplay
	  var _delayedSeek;
	  
	  // Constructor
	  function _init(videotag) {
		_video = videotag;
		_setupListeners();
	  }
	  
	  function _setupListeners() {
		  for (var evt in _mediaEvents) {
			  _video.addEventListener(evt, _mediaEvents[evt]);
		  }
	  }
	  
	  function _videoEventHandler(evt) {
		  console.log("%s %o (%s,%s)", evt.type, evt, _bufferedStart(), _bufferedEnd());
	  }

	  function _canPlayHandler(evt) {
		  _canSeek = true;
		  _videoEventHandler(evt);
		  if (_delayedSeek > 0) {
			  _seek(_delayedSeek);
		  }
	  }
	  
	  function _errorHandler(evt) {
		  console.log("Error: %o", _video.error);
		  _videoEventHandler(evt);
	  }

	  function _bufferedStart() {
		 if (_video.buffered.length > 0)
			 return _video.buffered.start(0);
		 else
			 return 0;
	  }
	  
	  function _bufferedEnd() {
		  if (_video.buffered.length > 0)
			 return Math.ceil(_video.buffered.end(_video.buffered.length-1));
		  else
			 return 0;
	  }

	  var _file;
	  
	  this.load = function(videoURL) {
		  _canSeek = false;
		  _delayedSeek = 0;
		  _file = videoURL;
 		  _video.src = _file;
		  _video.load();
		  //_video.pause();
	  }
	  
	  this.stop = function() {
		  //_video.src = "";
		  _video.removeAttribute("src");
		  _video.load();
		  _video.style.display = "none";
	  }
	  
	  this.play = function() {
		  _video.style.display = "block";
		  _video.play();
	  }
  
	  var _seek = this.seek = function(pos) {
		  if (_canSeek) {
			  _delayedSeek = 0;
			  _video.play();
			  _video.currentTime = pos;
		  } else {
			  _delayedSeek = pos;
		  }
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
	html5.utils = {};
})(jwplayer.html5);

/**
 * jwplayer.html5.utils.animations
 * Class for creating and managing visual transitions and effects
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	utils.animations = function(element, property, from, to, duration, easing) {
		var _element, 
			_property,
			_from,
			_to,
			_duration,
			_ease,
			_units,
			_self;
		
		var _startMS, _currentMS, _lastMS, _currentMS, _interval;
		
		function _init() {
			_ease = easing ? easing : utils.animations.easing.quint.easeOut;
			_element = element;
			_property = property;
			
			if (_element.id && !utils.animations.active[_element.id]) {
				utils.animations.active[_element.id] = {};
			}
			
			if (isNaN(from)) {
				if (from.indexOf("%") > 0) {
					_units = "%";
				} else if (from.indexOf("px")) {
					_units = "px";
				}
				_from = parseFloat(from.replace(_units, ""));
				_to = parseFloat(to.replace(_units, ""));
			} else {
				_units = "";
				_from = parseFloat(from);
				_to = parseFloat(to);
			}
			
			_duration = parseFloat(duration);
			this.id = Math.random();
		}

		
		
		this.start = function() {
			if (_element.id) {
				if (utils.animations.active[_element.id][_property] && utils.animations.active[_element.id][_property] != _self) {
					utils.animations.active[_element.id][_property].stop();
					newFrom = parseFloat(_element.style[_property].toString().replace(_units, ""));
					_currentMS = _duration * (_from / newFrom);
				}
				utils.animations.active[_element.id][_property] = _self;
			}
			
			if (_interval) {
				clearInterval(_interval);
			}
			_lastMS = (new Date()).valueOf();
			_tick();
			_interval = setInterval(_tick, utils.animations.INTERVAL_SPEED);
		};
		
		this.stop = function() {
			clearInterval(_interval);
			if (_element.id) {
				utils.animations.active[_element.id][_property] = null;
			}
		}

		function _tick() {
			_currentMS = (new Date()).valueOf();
			if (_currentMS - _lastMS >= _duration) {
				_complete();
				return;
			}
			value = _ease((_currentMS - _lastMS) , 0, 1, _duration);
			_execute(value);
		}
		
		function _complete() {
			_execute(1);
			_self.stop();
		}
		
		function _execute(value) {
			var val = (_from + (_to - _from) * value);
			_element.style[_property] = val + _units;
		}
		
		_self = this;
		_init();
	};

	utils.animations.INTERVAL_SPEED = 10;
	
	utils.animations.easing = {};
	
	utils.animations.easing.quint = {
		easeIn: function(t, b, c, d) {
			return c*(t/=d)*t*t*t*t + b;
		},
		easeOut: function(t, b, c, d) {
			return c*((t=t/d-1)*t*t*t*t + 1) + b;
		},
		easeInOut: function(t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
			return c/2*((t-=2)*t*t*t*t + 2) + b;
		}
	};

	utils.animations.easing.linear = {
		easeIn: function(t, b, c, d) {
			return c*t/d + b;
		},
		easeOut: function(t, b, c, d) {
			return c*t/d + b;
		},
		easeInOut: function(t, b, c, d) {
			return c*t/d + b;
		}
	};
	
	utils.animations.active = {};

	utils.animations.fadeIn = function(element, duration, easing) {
		var anim = new utils.animations(element, "opacity", 0, 1, duration, easing);
		anim.start();
	}

	utils.animations.fadeOut = function(element, duration, easing) {
		var anim = new utils.animations(element, "opacity", 1, 0, duration, easing);
		anim.start();
	}

	utils.animations.transform = function(element, fromX, fromY, toX, toY, duration, easing) {
		var horiz = new utils.animations(element, "left", fromX, toX, duration, easing);
		var vert = new utils.animations(element, "top", fromY, toY, duration, easing);
		horiz.start();
		vert.start();
	}
	
})(jwplayer.html5.utils);

/**
 * JW Player Source Endcap
 * 
 * This will appear at the end of the JW Player source
 * 
 * @version 6.0
 */

 }