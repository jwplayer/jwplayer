package com.longtailvideo.jwplayer.media
{
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	
	import flash.display.DisplayObject;
	
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
	 * Fired if an error occurs in the course of media playback.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_ERROR
	 */
	[Event(name="jwplayerMediaError", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Fired after the MediaProvider has successfully set up a connection to the media.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_LOADED
	 */
	[Event(name="jwplayerMediaLoaded", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sends the position and duration of the currently playing media.
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_TIME
	 */
	[Event(name="jwplayerMediaTime", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Fired after a volume change.
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_VOLUME
	 */
	[Event(name="jwplayerMediaVolume", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Fired when the currently playing media has completed its playback.
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_COMPLETE
	 */
	[Event(name="jwplayerMediaComplete", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Fired when the currently playing media exposes different quality levels
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_LEVELS
	 */
	[Event(name="jwplayerMediaLevels", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Fired when the currently quality level has changed
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_LEVEL_CHANGED
	 */
	[Event(name="jwplayerMediaLevelChanged", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sent when the playback state has changed.
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.PlayerStateEvent.JWPLAYER_PLAYER_STATE
	 */
	[Event(name="jwplayerPlayerState", type="com.longtailvideo.jwplayer.events.PlayerStateEvent")]
	
	
	public interface IMediaProvider extends IGlobalEventDispatcher {
		function initializeMediaProvider(cfg:PlayerConfig):void;
		function load(itm:PlaylistItem):void;
		function play():void;
		function pause():void;
		function seek(pos:Number):void;
		function stop():void;
		function setVolume(vol:Number):void;
		function mute(mute:Boolean):void;
		function resize(width:Number, height:Number):void;
		
		function get display():DisplayObject;
		function get state():String;
		function get position():Number;
		function get stretchMedia():Boolean;
		function get audioTracks():Array;
		function get currentAudioTrack():Number;
		function set currentAudioTrack(audioTrack:Number):void;
		function get qualityLevels():Array;
		function get currentQuality():Number;
		function set currentQuality(quality:Number):void;
	}
}