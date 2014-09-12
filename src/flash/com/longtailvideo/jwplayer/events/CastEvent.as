package com.longtailvideo.jwplayer.events
{
	public class CastEvent extends PlayerEvent
	{	
		
		public static var JWPLAYER_CAST_AVAILABLE:String = 'jwplayerCastAvailable';
		public static var JWPLAYER_CAST_SESSION:String = 'jwplayerCastSession';
		public static var JWPLAYER_CAST_AD_CHANGED:String = 'jwplayerCastAdChanged';
		
		public var available:Boolean;
        public var active:Boolean;

		public function CastEvent(type:String, msg:String=undefined)
		{
			super(type, msg);
		}
	}
}