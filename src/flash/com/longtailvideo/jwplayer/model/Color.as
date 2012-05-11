package com.longtailvideo.jwplayer.model {
	import com.longtailvideo.jwplayer.utils.TypeChecker;

	public class Color {
		private var _color:uint;
		
		public function Color(color:*) {
			if (color is String) {
				_color = TypeChecker.stringToColor(color);
			} else if (color is uint || color is Number) {
				_color = color;
			} else {
				throw(new Error("Color must be a String, Number or uint"));
			}
		}
		
		public function toString():String {
			var colorString:String = ((_color == 0) ? "000000" : _color.toString(16));
			while (colorString.length < 6) {
				colorString = "0" + colorString;
			}
			return "0x" + colorString;
		}
		
		public function get color():uint {
			return _color;
		}
	}
}