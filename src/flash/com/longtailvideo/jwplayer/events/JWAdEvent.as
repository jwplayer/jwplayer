package com.longtailvideo.jwplayer.events
{
	public class JWAdEvent extends PlayerEvent
	{
		
		public static var JWPLAYER_AD_TIME:String = "jwplayerAdTime";
		public static var JWPLAYER_AD_ERROR:String = "jwplayerAdError";
		public static var JWPLAYER_AD_CLICK:String = "jwplayerAdClicked";
		public static var JWPLAYER_AD_COMPLETE:String = "jwplayerAdComplete";
		public static var JWPLAYER_AD_IMPRESSION:String = "jwplayerAdImpression";
		public static var JWPLAYER_AD_COMPANIONS:String = "jwplayerAdCompanions";
		
		
		public var duration:Number;
		public var position:Number;
		public var companions:Array;
		public var tag:String;
		
		public function JWAdEvent(type:String, msg:String=undefined)
		{
			super(type, msg);
		}
	}
}