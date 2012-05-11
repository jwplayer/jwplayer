package com.longtailvideo.jwplayer.player
{
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;

	/**
	 * Fired when a portion of the current media has been loaded into the buffer.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_BUFFER
	 */
	[Event(name="jwplayerMediaBuffer", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Fired when the buffer is full.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL
	 */
	[Event(name="jwplayerMediaBufferFull", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Fired if an error occurs in the course of instream media playback.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_ERROR
	 */
	[Event(name="jwplayerMediaError", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Fired after the MediaProvider has loaded an item into memory.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_LOADED
	 */
	[Event(name="jwplayerMediaLoaded", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sent when a seek has been requested during instream playback, but before the seek actually takes place.
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_SEEK
	 */
	[Event(name="jwplayerMediaSeek", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sends the position and duration of the currently playing instream media
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_TIME
	 */
	[Event(name="jwplayerMediaTime", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sent when the player volume has been updated
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_VOLUME
	 */
	[Event(name="jwplayerMediaVolume", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sent when the player has been muted or unmuted
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_MUTE
	 */
	[Event(name="jwplayerMediaMute", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Fired when the currently playing instream media has completed its playback
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_COMPLETE
	 */
	[Event(name="jwplayerMediaComplete", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Fired when the currently playing instream media has dispatched metadata
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_META
	 */
	[Event(name="jwplayerMediaMeta", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sent when the instream playback state has changed.
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.PlayerStateEvent.JWPLAYER_PLAYER_STATE
	 */
	[Event(name="jwplayerPlayerState", type="com.longtailvideo.jwplayer.events.PlayerStateEvent")]
	/**
	 * Fired if an error has occurred during instream setup or playback
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_ERROR
	 */
	[Event(name="jwplayerError", type = "com.longtailvideo.jwplayer.events.PlayerEvent")]
	/**
	 * Fired if the instream display area has been clicked
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.InstreamEvent.JWPLAYER_INSTREAM_CLICKED
	 */
	[Event(name="jwplayerInstreamClicked", type="com.longtailvideo.jwplayer.events.InstreamEvent")]
	/**
	 * Instream player allows user to control playback of an instream item
	 */
	[Event(name="jwplayerInstreamDestroyed", type="com.longtailvideo.jwplayer.events.InstreamEvent")]
	/**
	 * Instream player allows user to control playback of an instream item
	 */
	
	/**
	 * @author Pablo Schklowsky
	 */
	public interface IInstreamPlayer extends IGlobalEventDispatcher {
		function play():Boolean;
		function pause():Boolean;
		function seek(pos:Number):Boolean;
		function destroy():void;
		function getPosition():Number;
		function getDuration():Number;
		function getState():String;
	}
}