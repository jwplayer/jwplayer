package com.longtailvideo.jwplayer.utils {
	/**
	 * This class groups a couple of commonly used string operations.
	 * @author Jeroen Wijering
	 **/
	public class Strings {
		
		/**
		 * Unescape a string and filter "asfunction" occurences ( can be used for XSS exploits).
		 *
		 * @param str	The string to decode.
		 * @return 		The decoded string.
		 **/
		public static function decode(str:String):String {
			if (str.indexOf('asfunction') == -1) {
				return unescape(str);
			} else {
				return '';
			}
		}
		
		/**
		 * Convert a number to a digital-clock like string.
		 *
		 * @param nbr	The number of seconds.
		 * @return		An H:MN:SS string.
		 **/
		public static function digits(nbr:Number):String {
			var hrs:Number = Math.floor(nbr / 3600);
			var min:Number = Math.floor((nbr - (hrs*3600)) / 60);
			var sec:Number = Math.floor(nbr % 60);
			var str:String = (hrs ? hrs + ':' : '') + Strings.zero(min) + ':' + Strings.zero(sec);
			return str;
		}
		
		/**
		 * Convert a time-representing string to a number.
		 *
		 * @param str	The input string. Supported are 00:03:00.1 / 03:00.1 / 180.1s / 3.2m / 3.2h
		 * @return		The number of seconds.
		 **/
		public static function seconds(str:String):Number {
			str = str.replace(',', '.');
			var arr:Array = str.split(':');
			var sec:Number = 0;
			if (str.substr(-2) == 'ms') {
				sec = Number(str.substr(0, str.length - 2)) / 1000;
			} else if (str.substr(-1) == 's') {
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
		 * Basic serialization: string representations of booleans and numbers are returned typed;
		 * strings are returned urldecoded.
		 *
		 * @param val	String value to serialize.
		 * @return		The original value in the correct primitive type.
		 **/
		public static function serialize(val:String):Object {
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
		 * Strip HTML tags and linebreaks off a string.
		 *
		 * @param str	The string to clean up.
		 * @return		The clean string.
		 **/
		public static function strip(str:String):String {
			var tmp:Array = str.split("\n");
			str = tmp.join("");
			tmp = str.split("\r");
			str = tmp.join("");
			var idx:Number = str.indexOf("<");
			while (idx != -1) {
				var end:Number = str.indexOf(">", idx + 1);
				end == -1 ? end = str.length - 1 : null;
				str = str.substr(0, idx) + " " + str.substr(end + 1, str.length);
				idx = str.indexOf("<", idx);
			}
			return str;
		}
		
		/**
		 * Add a leading zeros to a number or string.
		 *
		 * @param num		A number or string
		 * @param length	Length of the target string including leading zeros
		 * @ return			A string of length 'length' or greater
		 **/
		public static function zero(num:*, length:uint = 2):String {
			var str:String = '' + num;
			while (str.length < length) {
				str = '0' + str;
			}
			return str;
		}
		
		public static function hex(num:Number, length:uint = 2):String {
			return '0x' + Strings.zero(num.toString(16).toUpperCase(), length);
		}
		
		/**
		 * Finds the extension of a filename or URL 
		 * @param filename 	The string on which to search
		 * @return 			Everything trailing the final '.' character
		 * 
		 */

        public static function getAzureFileFormat(path:String):String {
            if (path.indexOf('(format=m3u8-') > -1) {
                return 'm3u8';
            } else { 
                return '';
            }
        }

        public static function extension(filename:String):String {

            var azureFormat:String = getAzureFileFormat(filename);
            if (azureFormat) {
                return azureFormat;
            }

			if (filename && filename.lastIndexOf(".") > 0) {
				filename = String(filename.split("?")[0]).split("#")[0]; 
				return filename.substring(filename.lastIndexOf(".")+1, filename.length).toLowerCase();
			} else {
                return "";
			}
		}
		
		/**
		 * Recursively creates a string representation of an object and its properties.
		 * 
		 * @param object The object to be converted to a string.
		 */
		public static function print_r(object:Object):String {
			var result:String = "";
			if (typeof(object) == "object") {
				result += "{";
			}
			for (var property:Object in object) {
				if (typeof(object[property]) == "object") {
					result += property + ": ";
				} else {
					result += property + ": " + object[property];
				}
				result += print_r(object[property]) +  ", ";
			}
			
			if (result != "{"){
				result = result.substr(0, result.length - 2);
			}
			
			if (typeof(object) == "object") {
				result += "}";
			}
			
			return result;
		}
		
		/** Remove white space from before and after a string. **/
		public static function trim(s:String):String {
			return s.replace(/^\s+/, '').replace(/\s+$/, '');
		}
		
		/** Get the value of a case-insensitive attribute in an XML node **/
		public static function xmlAttribute(xml:XML, attribute:String):String {
			for each (var attrib:XML in xml.attributes()) {
				if (attrib.name().toString().toLowerCase() == attribute.toLowerCase())
					return attrib.toString();
			}
			return "";
		}
		
		/** Gets an absolute file path based on a relative filepath **/
		public static function getAbsolutePath(path:String, basepath:String=null):String {
			if (basepath == null){
				return path;
			}
			if (isAbsolutePath(path)) {
				return path;
			}
			var protocol:String = basepath.indexOf("//") > -1 ? basepath.substring(0, basepath.indexOf("//") + 2) : "";
			var domain:String = protocol ? basepath.substring(protocol.length, basepath.indexOf('/', protocol.length + 1)) : "";
			var patharray:Array;
			if (path.indexOf("/") === 0) {
				if(isAbsolutePath(basepath)) {
					return protocol + domain + path;
				}
				patharray = path.split("/");
			} else {
				var newbase:String = basepath.split("?")[0];
				newbase = newbase.substring(protocol.length + domain.length + 1, newbase.lastIndexOf('/'));
				patharray = newbase.split("/").concat(path.split("/"));
			}
			var result:Array = [];
			for (var i:int = 0; i < patharray.length; i++) {
				if (!patharray[i] || patharray[i] === undefined || patharray[i] == ".") {
					continue;
				} else if (patharray[i] == "..") {
					result.pop();
				} else {
					result.push(patharray[i]);
				}
			}
			return protocol + domain + "/" + result.join("/");
		};
		
		public static function isAbsolutePath(path:String):Boolean {
			var protocol:int = path.indexOf("://");
			var queryparams:int = path.indexOf("?");
			return ((protocol > 0 && (queryparams < 0 || (queryparams > protocol))));
		}

		/** Removes potentially harmful string headers from a link **/
		public static function cleanLink(link:String):String {
			// Only match http: and https:
			if (link.indexOf(":") > 0 && link.indexOf("http") != 0) return "";
			else return link;
		}
		
		public static function isYouTube(file:String):Boolean {
			if (file) {
				if (file.indexOf('youtube.com/w') > -1)
					return true;
				else if (file.indexOf('youtube.com/v') > -1)
					return true;
				else if (file.indexOf('youtu.be') > -1)
					return true;
			}
			return false;
		}
		
		/** Capitalizes the first letter of a string; rest is lowercased **/
		public static function capitalizeFirst(s:String):String {
			var firstChar:String = s.charAt(0);
			var rest:String = s.substr(1, s.length-1);
			
			return firstChar.toUpperCase() + rest.toLowerCase();
		}
		
	}
	
}