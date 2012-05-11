package com.longtailvideo.jwplayer.events {
	import flash.events.Event;

	/**
	 * The MediaEvent class represents events related to media playback.
	 *  
	 * @see com.longtailvideo.media.MediaProvider 
	 */
	public class MediaEvent extends PlayerEvent {

		/**
	     *  The <code>MediaEvent.JWPLAYER_MEDIA_BUFFER</code> constant defines the value of the 
     	 *  <code>type</code> property of the event object for a <code>jwplayerMediaBuffer</code> event.
     	 * 
		 * <p>The properties of the event object have the following values:</p>
	     * <table class="innertable">
     	 *		<tr><th>Property</th><th>Value</th></tr>
	     *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	     *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
  	     * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
	     *		<tr><td><code>buffer</code></td><td>The percent of the media buffered into memory</td></tr>
	     *  </table>
	     *
	     *  @eventType jwplayerMediaBuffer
		 */
		public static var JWPLAYER_MEDIA_BUFFER:String = "jwplayerMediaBuffer";
		
		/**
	     *  The <code>MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL</code> constant defines the value of the 
     	 *  <code>type</code> property of the event object for a <code>jwplayerMediaBufferFull</code> event.
     	 * 
		 * <p>The properties of the event object have the following values:</p>
	     * <table class="innertable">
     	 *		<tr><th>Property</th><th>Value</th></tr>
	     *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	     *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
  	     * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
	     *		<tr><td><code>buffer</code></td><td>The percent of the media buffered into memory</td></tr>
	     *  </table>
	     *
	     *  @eventType jwplayerMediaBufferFull
		 */
		public static var JWPLAYER_MEDIA_BUFFER_FULL:String = "jwplayerMediaBufferFull";

		/**
	     *  The <code>MediaEvent.JWPLAYER_MEDIA_ERROR</code> constant defines the value of the 
     	 *  <code>type</code> property of the event object for a <code>jwplayerMediaError</code> event.
     	 * 
		 * <p>The properties of the event object have the following values:</p>
	     * <table class="innertable">
     	 *		<tr><th>Property</th><th>Value</th></tr>
	     *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	     *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
  	     * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
	     *		<tr><td><code>message</code></td><td>Message explaining the error.</td></tr>
	     *  </table>
	     *
	     *  @eventType jwplayerMediaError
		 */
		public static var JWPLAYER_MEDIA_ERROR:String = "jwplayerMediaError";

		/**
	     *  The <code>MediaEvent.JWPLAYER_MEDIA_LOADED</code> constant defines the value of the 
     	 *  <code>type</code> property of the event object for a <code>jwplayerMediaLoaded</code> event.
     	 * 
		 * <p>The properties of the event object have the following values:</p>
	     * <table class="innertable">
     	 *		<tr><th>Property</th><th>Value</th></tr>
	     *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	     *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
  	     * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
	     *  </table>
	     *
	     *  @eventType jwplayerMediaLoaded
		 */
		public static var JWPLAYER_MEDIA_LOADED:String = "jwplayerMediaLoaded";

		/**
	     *  The <code>MediaEvent.JWPLAYER_MEDIA_COMPLETE</code> constant defines the value of the 
     	 *  <code>type</code> property of the event object for a <code>jwplayerMediaComplete</code> event.
     	 * 
		 * <p>The properties of the event object have the following values:</p>
	     * <table class="innertable">
     	 *		<tr><th>Property</th><th>Value</th></tr>
	     *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	     *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
  	     * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
	     *  </table>
	     *
	     *  @eventType jwplayerMediaComplete
		 */
		public static var JWPLAYER_MEDIA_COMPLETE:String = "jwplayerMediaComplete";

		/**
		 *  The <code>MediaEvent.JWPLAYER_MEDIA_SEEK</code> constant defines the value of the 
		 *  <code>type</code> property of the event object for a <code>jwplayerMediaSeek</code> event.
		 * 
		 * <p>The properties of the event object have the following values:</p>
		 * <table class="innertable">
		 *		<tr><th>Property</th><th>Value</th></tr>
		 *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
		 *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
		 * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
		 * 		<tr><td><code>position</code></td><td>The current position of the media, in seconds.</td></tr>
		 * 		<tr><td><code>offset</code></td><td>The requested seek offset, in seconds.</td></tr>
		 *  </table>
		 *
		 *  @eventType jwplayerMediaSeek
		 */
		public static var JWPLAYER_MEDIA_SEEK:String = "jwplayerMediaSeek";
		
		/**
		 *  The <code>MediaEvent.JWPLAYER_MEDIA_TIME</code> constant defines the value of the 
		 *  <code>type</code> property of the event object for a <code>jwplayerMediaTime</code> event.
		 * 
		 * <p>The properties of the event object have the following values:</p>
		 * <table class="innertable">
		 *		<tr><th>Property</th><th>Value</th></tr>
		 *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
		 *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
		 * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
		 * 		<tr><td><code>position</code></td><td>Number of seconds elapsed since the start of the media playback.</td></tr>
		 * 		<tr><td><code>duration</code></td><td>Total number of seconds in the currently loaded media.</td></tr>
		 *  </table>
		 *
		 *  @eventType jwplayerMediaTime
		 */
		public static var JWPLAYER_MEDIA_TIME:String = "jwplayerMediaTime";
		
		/**
	     *  The <code>MediaEvent.JWPLAYER_MEDIA_VOLUME</code> constant defines the value of the 
     	 *  <code>type</code> property of the event object for a <code>jwplayerMediaVolume</code> event.
     	 * 
		 * <p>The properties of the event object have the following values:</p>
	     * <table class="innertable">
     	 *		<tr><th>Property</th><th>Value</th></tr>
	     *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	     *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
  	     * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
  	     * 		<tr><td><code>duration</code></td><td>The current playback volume, between 0 and 100.</td></tr>
  	     *  </table>
	     *
	     *  @eventType jwplayerMediaVolume
		 */
		public static var JWPLAYER_MEDIA_VOLUME:String = "jwplayerMediaVolume";
		
		/**
	     *  The <code>MediaEvent.JWPLAYER_MEDIA_META</code> constant defines the value of the 
     	 *  <code>type</code> property of the event object for a <code>jwplayerMediaMeta</code> event.
     	 * 
		 * <p>The properties of the event object have the following values:</p>
	     * <table class="innertable">
     	 *		<tr><th>Property</th><th>Value</th></tr>
	     *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	     *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
  	     * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
  	     * 		<tr><td><code>duration</code></td><td>The current playback volume, between 0 and 100.</td></tr>
  	     *  </table>
	     *
	     *  @eventType jwplayerMediaMeta
		 */
		public static var JWPLAYER_MEDIA_META:String = "jwplayerMediaMeta";
		/**
		 * The MediaEvent.JWPLAYER_MEDIA_BEFOREPLAY constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerMediaBeforePlay</code> event.
		 *
		 * <table class="innertable">
		 *		<tr><th>Property</th><th>Value</th></tr>
		 *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
		 *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
		 * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
		 * </table>
		 * 
		 * @eventType jwplayerMediaBeforePlay
		 */
		public static var JWPLAYER_MEDIA_BEFOREPLAY:String = "jwplayerMediaBeforePlay";
		/**
		 * The MediaEvent.JWPLAYER_MEDIA_BEFORECOMPLETE constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerMediaBeforeComplete</code> event.
		 *
		 * <table class="innertable">
		 *		<tr><th>Property</th><th>Value</th></tr>
		 *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
		 *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
		 * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
		 * </table>
		 * 
		 * @eventType jwplayerMediaBeforePlay
		 */
		public static var JWPLAYER_MEDIA_BEFORECOMPLETE:String = "jwplayerMediaBeforeComplete";
		/**
	     *  The <code>MediaEvent.JWPLAYER_MEDIA_MUTE</code> constant defines the value of the 
     	 *  <code>type</code> property of the event object for a <code>jwplayerMediaMute</code> event.
     	 * 
		 * <p>The properties of the event object have the following values:</p>
	     * <table class="innertable">
     	 *		<tr><th>Property</th><th>Value</th></tr>
	     *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	     *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
  	     * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
  	     * 		<tr><td><code>duration</code></td><td>The current playback volume, between 0 and 100.</td></tr>
  	     *  </table>
	     *
	     *  @eventType jwplayerMediaMute
		 */
		public static var JWPLAYER_MEDIA_MUTE:String = "jwplayerMediaMute";

		public var bufferPercent:Number 	= -1;
		public var duration:Number 			= -1;
		public var metadata:Object 			= null;
		public var position:Number 			= -1;
		public var offset:Number			= 0;
		public var volume:Number 			= -1;
		public var mute:Boolean				= false;
	
		public function MediaEvent(type:String) {
			super(type);
		}
		
		public override function clone():Event {
			var evt:MediaEvent = new MediaEvent(this.type);
			evt.bufferPercent = this.bufferPercent;
			evt.duration = this.duration;
			evt.metadata = this.metadata;
			evt.position = this.position;
			evt.offset = this.offset;
			evt.volume = this.volume;
			evt.mute = this.mute;
			return evt;
		}
		
		public override function toString():String {
			var retString:String = '[MediaEvent type="' + type + '"';
			var defaults:MediaEvent = new MediaEvent("");

			for (var s:String in metadata) {
				retString += ' ' + s + '="' + metadata[s] + '"';
			}

			if (bufferPercent != defaults.bufferPercent) retString += ' bufferPercent="' + bufferPercent + '"';
			if (duration != defaults.duration) retString += ' duration="' + duration + '"';
			if (position != defaults.position) retString += ' position="' + position + '"';
			if (offset != defaults.offset) retString += ' offset="' + offset + '"';
			if (volume != defaults.volume) retString += ' volume="' + volume + '"';
			if (mute != defaults.mute) retString += ' mute="' + mute + '"';
			if (message != defaults.message) retString += ' message="' + message + '"';
			
			retString += ' id="' + id + '"'
			retString += ' client="' + client + '"'
			retString += ' version="' + version + '"'
			retString += "]";
			
			return retString;
		}
	}
}