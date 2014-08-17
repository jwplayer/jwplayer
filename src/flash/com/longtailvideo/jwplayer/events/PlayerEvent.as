package com.longtailvideo.jwplayer.events {
	import com.longtailvideo.jwplayer.player.PlayerVersion;
	
	import flash.events.Event;
	import flash.external.ExternalInterface;
	import flash.system.Capabilities;

	public class PlayerEvent extends Event {
		
		public static var JWPLAYER_READY:String = "jwplayerReady";

		public static var JWPLAYER_LOCKED:String = "jwplayerLocked";

		public static var JWPLAYER_UNLOCKED:String = "jwplayerUnlocked";

		public static var JWPLAYER_ERROR:String = "jwplayerError";

		public static var JWPLAYER_FULLSCREEN:String = "jwplayerFullscreen";
		
		private static var FLASH_VERSION:String = "FLASH " + Capabilities.version;
		
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
			this.client  = FLASH_VERSION;
			this.version = PlayerVersion.version;
			this.message = msg;
		}

		public override function toString():String {
			return this.formatToString('PlayerEvent', 'type', 'id', 'client', 'version', 'message');
		} 
		
		public override function clone():Event {
			return new PlayerEvent(this.type, this.message);
		}
		
	}
}