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
