package com.longtailvideo.jwplayer.events
{
	import flash.events.Event;

	public class JWAdEvent extends PlayerEvent
	{
		
		public static const JWPLAYER_AD_TIME:String = "jwplayerAdTime";
		public static const JWPLAYER_AD_ERROR:String = "jwplayerAdError";
		public static const JWPLAYER_AD_CLICK:String = "jwplayerAdClicked";
		public static const JWPLAYER_AD_COMPLETE:String = "jwplayerAdComplete";
		public static const JWPLAYER_AD_IMPRESSION:String = "jwplayerAdImpression";
		public static const JWPLAYER_AD_COMPANIONS:String = "jwplayerAdCompanions";
		public static const JWPLAYER_AD_SKIPPED:String =  "jwplayerAdSkipped";
		public static const JWPLAYER_AD_PLAY:String =  "jwplayerAdPlay";
		public static const JWPLAYER_AD_PAUSE:String =  "jwplayerAdPause";
		
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
		
		public override function clone():Event {
			var evt:JWAdEvent = new JWAdEvent(this.type);
			evt.duration = this.duration;
			evt.position = this.position;
			evt.currentAd = this.currentAd;
			evt.totalAds = this.totalAds;
			evt.companions = this.companions;
			evt.tag = this.tag;
			evt.oldstate = this.oldstate;
			evt.newstate = this.newstate;
			return evt;
		}
	}
}