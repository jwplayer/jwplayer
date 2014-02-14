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
		public static var JWPLAYER_AD_SKIPPED:String =  "jwplayerAdSkipped";
		public static var JWPLAYER_AD_PLAY:String =  "jwplayerAdPlay";
		public static var JWPLAYER_AD_PAUSE:String =  "jwplayerAdPause";
		
		public var duration:Number;
		public var position:Number;
		public var currentAd:Number;
		public var totalAds:Number;
		public var companions:Array;
		public var tag:String;
		public var oldstate:String;
		public var newstate:String;
		
		public function JWAdEvent(type:String, msg:String=undefined)
		{
			super(type, msg);
		}
	}
}