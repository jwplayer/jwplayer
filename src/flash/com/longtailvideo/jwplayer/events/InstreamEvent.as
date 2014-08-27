package com.longtailvideo.jwplayer.events
{
	import flash.events.Event;

	public class InstreamEvent extends PlayerEvent
	{
		public static const JWPLAYER_INSTREAM_CLICKED:String = "jwplayerInstreamClicked";
		
		public var hasControls:Boolean;
		
		public static const JWPLAYER_INSTREAM_DESTROYED:String = "jwplayerInstreamDestroyed";

		public var destroyedReason:String;
		
		
		public function InstreamEvent(type:String, reason:String=null) {
			super(type);
			if (reason) {
				destroyedReason = reason;
			}
		}
		
		public override function clone():Event {
			var evt:InstreamEvent = new InstreamEvent(this.type);
			if (this.destroyedReason) {
				evt.destroyedReason = this.destroyedReason;
			}
			evt.hasControls = this.hasControls;
			return evt;
		}
		
		public override function toString():String {
			var retString:String = '[InstreamEvent type="' + type + '"';
			if (destroyedReason) {
				retString += ' destroyedReason="' + destroyedReason + '"';
			}
			retString += ' id="' + id + '"'
			retString += ' client="' + client + '"'
			retString += ' version="' + version + '"]';
			return retString;
		}
	}
}