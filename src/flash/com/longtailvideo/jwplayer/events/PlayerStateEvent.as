package com.longtailvideo.jwplayer.events {
	import flash.events.Event;

	public class PlayerStateEvent extends PlayerEvent {

		/**
		 * The PlayerEvent.JWPLAYER_PLAYER_STATE constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerPlayerState</code> event.
		 *
	     * <table class="innertable">
     	 *		<tr><th>Property</th><th>Value</th></tr>
	     *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	     *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
  	     * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
  	     * 		<tr><td><code>newstate</code></td><td>The new state of the player</td></tr>
  	     * 		<tr><td><code>oldstate</code></td><td>The previous state of the player</td></tr>
   	     * </table>
  	     * 
		 * @see com.longtailvideo.jwplayer.player.PlayerState
		 * @eventType jwplayerPlayerState
		 */
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
			return '[PlayerStateEvent type="' + type + '"' 
				+ ' oldstate="' + oldstate + '"'
				+ ' newstate="' + newstate + '"'
				+ ' id="' + id + '"'
				+ ' client="' + client + '"'
				+ ' version="' + version + '"'
				+ ' message="' + message + '"'
				+ "]";
		}
	}
}