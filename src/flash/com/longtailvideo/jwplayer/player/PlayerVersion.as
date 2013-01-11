package com.longtailvideo.jwplayer.player {
	
	
	public class PlayerVersion {
		protected static var _version:String = JWPLAYER::version;
		
		public static function get version():String {
			return _version;
		}
		
		public static var id:String = "";
		public static var edition:String = "";
	}
}