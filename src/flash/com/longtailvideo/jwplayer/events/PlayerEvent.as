package com.longtailvideo.jwplayer.events {
	import com.longtailvideo.jwplayer.player.PlayerVersion;
	
	import flash.events.Event;
	import flash.external.ExternalInterface;
	import flash.system.Capabilities;

	public class PlayerEvent extends Event {
		
		public static const JWPLAYER_READY:String = "jwplayerReady";

		public static const JWPLAYER_LOCKED:String = "jwplayerLocked";

		public static const JWPLAYER_UNLOCKED:String = "jwplayerUnlocked";

		public static const JWPLAYER_ERROR:String = "jwplayerError";

		public static const JWPLAYER_FULLSCREEN:String = "jwplayerFullscreen";
		
		private static var FLASH_VERSION:String;
		
		public var id:String;
		public var client:String;
		public var version:String;
		public var message:String;

		public function PlayerEvent(type:String, msg:String=undefined) {
			super(type, false, false);
			
			this.id = PlayerVersion.id;
			if (!this.id) {
				try {
					this.id = ExternalInterface.objectID;
				} catch(e:Error) {}
			}
			if (!FLASH_VERSION) {
				FLASH_VERSION = Capabilities.version;
			}
			this.client  = FLASH_VERSION;
			this.version = PlayerVersion.version;
			this.message = msg;
		}

		public override function toString():String {
			return '[PlayerEvent type="'+type+'" id="'+id+'" client="'+client+'" version="'+version+'" message="'+message+'" ]';
		} 
		
		public override function clone():Event {
			return new PlayerEvent(this.type, this.message);
		}
		
	}
}