package com.longtailvideo.jwplayer.events {
	import flash.events.Event;

	public class PlayerStateEvent extends PlayerEvent {

		public static var JWPLAYER_PLAYER_STATE:String = "jwplayerPlayerState";

		public var newstate:String = "";
		public var oldstate:String = "";

		public function PlayerStateEvent(type:String, newState:String, oldState:String) {
			super(type);
			this.newstate = newState;
			this.oldstate = oldState;
		}
		
		public override function clone():Event {
			return new PlayerStateEvent(this.type, this.newstate, this.oldstate);
		}
		
		public override function toString():String {
			return this.formatToString('PlayerStateEvent', 'type', 'oldstate', 'newstate', 'id', 'client', 'version', 'message');
		}
	}
}