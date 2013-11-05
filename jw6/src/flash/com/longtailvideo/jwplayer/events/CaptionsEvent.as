package com.longtailvideo.jwplayer.events {
import flash.events.Event;

/**
 * The CaptionsEvent class represents events related to captions rendering.
 *  
 * @see com.longtailvideo.jwplayer.view.componenets.Captions.as 
 */
public class CaptionsEvent extends PlayerEvent {
	
	/**
	 *  The <code>CaptionsEvent.JWPLAYER_CAPTIONS_LIST</code> constant defines the value of the 
	 *  <code>type</code> property of the event object for a <code>jwplayerCaptionsList</code> event.
	 * 
	 * <p>The properties of the event object have the following values:</p>
	 * <table class="innertable">
	 *		<tr><th>Property</th><th>Value</th></tr>
	 *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	 *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
	 * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
	 * 		<tr><td><code>tracks</code></td><td>An array of caption tracks</td></tr>
	 * 		<tr><td><code>currentTrack</code></td><td>The current track; A value of -1 means the track is off</td></tr>
	 *  </table>
	 *
	 *  @eventType jwplayerCaptionsList
	 */
	public static var JWPLAYER_CAPTIONS_LIST:String = "jwplayerCaptionsList";
	/**
	 *  The <code>CaptionsEvent.JWPLAYER_CAPTIONS_CHANGED</code> constant defines the value of the 
	 *  <code>type</code> property of the event object for a <code>jwplayerCaptionsChanged</code> event.
	 * 
	 * <p>The properties of the event object have the following values:</p>
	 * <table class="innertable">
	 *		<tr><th>Property</th><th>Value</th></tr>
	 *		<tr><td><code>id</code></td><td>ID of the player in the HTML DOM. Used by javascript to reference the player.</td></tr>
	 *		<tr><td><code>client</code></td><td>A string representing the client the player runs in (e.g. FLASH WIN 9,0,115,0).</td></tr>
	 * 		<tr><td><code>version</code></td><td>A string representing the major version, minor version and revision number of the player (e.g. 5.0.395).</td></tr>
	 * 		<tr><td><code>tracks</code></td><td>An array of caption tracks</td></tr>
	 * 		<tr><td><code>currentTrack</code></td><td>The current track; A value of -1 means the track is off</td></tr>
	 *  </table>
	 *
	 *  @eventType jwplayerCaptionsChanged
	 */
	public static var JWPLAYER_CAPTIONS_CHANGED:String = "jwplayerCaptionsChanged";
	
	public var tracks:Array				= null;
	public var currentTrack:Number		= -1;
	
	public function CaptionsEvent(type:String) {
		super(type);
	}
	
	public override function clone():Event {
		var evt:CaptionsEvent = new CaptionsEvent(this.type);
		evt.tracks = this.tracks;
		evt.currentTrack = this.currentTrack;
		return evt;
	}
	
	public override function toString():String {
		var retString:String = '[CaptionsEvent type="' + type + '"';
		var defaults:CaptionsEvent = new CaptionsEvent("");
		
		if (tracks != defaults.tracks) retString += ' tracks="' + tracks + '"';
		if (currentTrack != defaults.currentTrack) retString += ' currentTrack="' + currentTrack + '"';
		
		retString += ' id="' + id + '"'
		retString += ' client="' + client + '"'
		retString += ' version="' + version + '"'
		retString += "]";
		
		return retString;
	}
}
}