package com.longtailvideo.jwplayer.utils {
	import com.longtailvideo.jwplayer.model.Color;
	
	import flash.utils.describeType;

	public class TypeChecker {
		
		public static function getType(object:Object, property:String):String {
			var description:XML = describeType(object);
			var type:String;
			
			if ((description.accessor as XMLList).length()) { 
				type = description.accessor.(@name == property).@type;
			} else {
				type = description.variable.(@name == property).@type;
			}
			return type.replace(/(.+::)(.*)/,"$2");
		}

		public static function guessType(value:String):String {
			var bools:Array = ["true", "false", "t", "f"];
			if (bools.indexOf(value.toLowerCase().replace(" ","")) >= 0) {
				return "Boolean";
			} else if ( value.search(/^(#|0x)[0-9a-fA-F]{3,6}/) >= 0 ) {
				return "Color";
			} else if (value === "") {
				return "String";
			} else if (!isNaN(Number(value)) ) {
				return "Number";
			} else {
				return "String";
			}
		} 
		
		public static function fromString(value:String, type:String=null):* {
			if (type == null) 
				type = guessType(value);

			switch(type.toLowerCase()) {
				case "color":
					if (value.length > 0) {
						return new Color(stringToColor(value));
					} else return null;
				case "number":
					return Number(value);
				case "boolean":
					if (value.toLowerCase() == "true") return true;
					else if (value == "1") return true;
					else return false;
			}
			return value;
		}
		
		public static function stringToColor(value:String):uint {
			switch(value.toLowerCase()) {
				case "blue": return 0x0000FF; break;
				case "green": return 0x00FF00; break;
				case "red": return 0xFF0000; break;
				case "cyan": return 0x00FFFF; break;
				case "magenta": return 0xFF00FF; break;
				case "yellow": return 0xFFFF00; break;
				case "black": return 0x000000; break;
				case "white": return 0xFFFFFF; break;
				default:
					value = value.replace(/(#|0x)?([0-9A-F]{3,6})$/gi, "$2");
					if (value.length == 3) 
						value = value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);
					return uint("0x" + value);
					break;
			}
			
			return 0x000000;
		}

	}
	
}