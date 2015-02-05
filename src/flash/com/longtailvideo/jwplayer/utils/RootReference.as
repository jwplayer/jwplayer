package com.longtailvideo.jwplayer.utils {
	import flash.display.DisplayObject;
	import flash.display.Stage;

	/**
	 * Maintains a static reference to the stage and root of the application.
	 *
	 * @author Pablo Schklowsky
	 */
	public class RootReference {

		/** The root DisplayObject of the application.  **/ 
		public static var root:DisplayObject;

		/** A reference to the stage. **/ 
		private static var _stage:Stage;
		
		public static function get stage():Stage {
			return _stage;
		}

		public static function set stage(s:Stage):void  {
			_stage = s;
		}

		public function RootReference(displayObj:DisplayObject) {
			if (!RootReference.root) {
				RootReference.root = displayObj.root;
				RootReference.stage = displayObj.stage;
			}
		}
	}
}