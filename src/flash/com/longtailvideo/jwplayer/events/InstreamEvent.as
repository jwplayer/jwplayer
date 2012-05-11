package com.longtailvideo.jwplayer.events
{
	import flash.events.Event;

	/**
	 * The InstreamEvent class represents events related to the Instream API
	 *  
	 * @see com.longtailvideo.player.IInstreamPlayer 
	 */
	public class InstreamEvent extends PlayerEvent
	{
		/**
		 *  The <code>InstreamEvent.JWPLAYER_INSTREAM_CLICKED</code> constant defines the value of the 
		 *  <code>type</code> property of the event object for a <code>jwplayerInstreamClicked</code> event.
		 * 
		 * <p>The properties of the event object have the following values:</p>
		 * <table class="innertable">
		 *		<tr><th>Property</th><th>Value</th></tr>
		 *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
		 *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
		 * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
		 *  </table>
		 *
		 *  @eventType jwplayerMediaMute
		 */
		public static var JWPLAYER_INSTREAM_CLICKED:String = "jwplayerInstreamClicked";

		/**
		 *  The <code>InstreamEvent.JWPLAYER_INSTREAM_DESTROYED</code> constant defines the value of the 
		 *  <code>type</code> property of the event object for a <code>jwplayerInstreamDestroyed</code> event.
		 * 
		 * <p>The properties of the event object have the following values:</p>
		 * <table class="innertable">
		 *		<tr><th>Property</th><th>Value</th></tr>
		 *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
		 *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
		 * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
		 * 		<tr><td><code>destroyedReason</code></td><td>The reason a JWPLAYER_INSTREAM_DESTROYED event was dispatched</td></tr>
		 *  </table>
		 *
		 *  @eventType jwplayerMediaMute
		 */
		public static var JWPLAYER_INSTREAM_DESTROYED:String = "jwplayerInstreamDestroyed";

		public var destroyedReason:String;

		public function InstreamEvent(type:String, reason:String=null) {
			if (reason) destroyedReason = reason;
			super(type);
		}
		
		public override function clone():Event {
			var evt:InstreamEvent = new InstreamEvent(this.type);
			if (this.destroyedReason) {
				evt.destroyedReason = this.destroyedReason;
			}
			return evt;
		}
		
		public override function toString():String {
			var retString:String = '[InstreamEvent type="' + type + '"';
			if (destroyedReason) retString += ' destroyedReason="' + destroyedReason + '"';
			retString += ' id="' + id + '"'
			retString += ' client="' + client + '"'
			retString += ' version="' + version + '"'
			retString += "]";
			return retString;
		}
	}
}