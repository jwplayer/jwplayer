package com.longtailvideo.jwplayer.model {
	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.media.HTTPMediaProvider;
	import com.longtailvideo.jwplayer.media.ImageMediaProvider;
	import com.longtailvideo.jwplayer.media.MediaProvider;
	import com.longtailvideo.jwplayer.media.RTMPMediaProvider;
	import com.longtailvideo.jwplayer.media.SoundMediaProvider;
	import com.longtailvideo.jwplayer.media.VideoMediaProvider;
	import com.longtailvideo.jwplayer.media.YouTubeMediaProvider;
	import com.longtailvideo.jwplayer.player.PlayerState;
	
	import flash.events.Event;

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
	 * Fired after the MediaProvider has loaded an item into memory.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_LOADED
	 */
	[Event(name="jwplayerMediaLoaded", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sent when a seek has been requested, but before the seek actually takes place.
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_SEEK
	 */
	[Event(name="jwplayerMediaSeek", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sends the position and duration of the currently playing media
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_TIME
	 */
	[Event(name="jwplayerMediaTime", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sent when the volume has been updated
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
	 * Fired when the currently playing media has completed its playback
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.MediaEvent.JWPLAYER_MEDIA_COMPLETE
	 */
	[Event(name="jwplayerMediaComplete", type="com.longtailvideo.jwplayer.events.MediaEvent")]
	/**
	 * Sent when the playback state has changed.
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.PlayerStateEvent.JWPLAYER_PLAYER_STATE
	 */
	[Event(name="jwplayerPlayerState", type="com.longtailvideo.jwplayer.events.PlayerStateEvent")]
	/**
	 * Fired if an error has occurred in the model.
	 * 
	 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_ERROR
	 */
	[Event(name="jwplayerError", type = "com.longtailvideo.jwplayer.events.PlayerEvent")]

	/**
	 * @author Pablo Schklowsky
	 */
	public class Model extends GlobalEventDispatcher {
		protected var _config:PlayerConfig;
		protected var _playlist:IPlaylist;

		protected var _fullscreen:Boolean = false;

		protected var _currentMedia:MediaProvider;

		protected var _mediaSources:Object;
		
		/** Constructor **/
		public function Model() {
			_playlist = new Playlist();
			_playlist.addGlobalListener(forwardEvents);
			_config = new PlayerConfig();
			_mediaSources = {};
			//TODO: Set initial mute state based on user configuration
		}

		/** The player config object **/
		public function get config():PlayerConfig {
			return _config;
		}

		public function set config(conf:PlayerConfig):void {
			_config = conf;
		}

		/** The currently loaded MediaProvider **/
		public function get media():MediaProvider {
			return _currentMedia;
		}

		/**
		 * The current player state
		 */
		public function get state():String {
			return _currentMedia ? _currentMedia.state : PlayerState.IDLE;
		}

		/**
		 * The loaded playlist
		 */
		public function get playlist():IPlaylist {
			return _playlist;
		}

		/** The current fullscreen state of the player **/
		public function get fullscreen():Boolean {
			return _fullscreen;
		}

		public function set fullscreen(b:Boolean):void {
			_fullscreen = b;
			_config.fullscreen = b;
		}

		/** The current mute state of the player **/
		public function get mute():Boolean {
			return _config.mute;
		}

		public function set mute(b:Boolean):void {
			_config.mute = b;
			_currentMedia.mute(b);
		}

		public function setupMediaProviders():void {
			setMediaProvider('default', new MediaProvider('default'));
			setMediaProvider('video', new VideoMediaProvider());
			setMediaProvider('http', new HTTPMediaProvider());
			setMediaProvider('rtmp', new RTMPMediaProvider());
			setMediaProvider('sound', new SoundMediaProvider());
			setMediaProvider('image', new ImageMediaProvider());
			setMediaProvider('youtube', new YouTubeMediaProvider());

			setActiveMediaProvider('default');
		}
		
		/** Instruct the currently playing media to seek to the specified position. **/
		public function seek(pos:Number):void {
			var newEvent:MediaEvent = new MediaEvent(MediaEvent.JWPLAYER_MEDIA_SEEK);
			newEvent.position = media.position;
			newEvent.offset = pos;
			dispatchEvent(newEvent);
			
			media.seek(pos);
		}

		/**
		 * Whether the Model has a MediaProvider handler for a given type.
		 */
		public function hasMediaProvider(type:String):Boolean {
			return (_mediaSources[url2type(type)] is MediaProvider);
		}

		/**
		 * Add a MediaProvider to the list of available sources.
		 */
		public function setMediaProvider(type:String, provider:MediaProvider):void {
			if (!hasMediaProvider(type)) {
				_mediaSources[url2type(type)] = provider;
				provider.initializeMediaProvider(config);
			}
		}

		public function setActiveMediaProvider(type:String):Boolean {
			if (!hasMediaProvider(type))
				type = "video";

			var newMedia:MediaProvider = _mediaSources[url2type(type)] as MediaProvider;

			if (_currentMedia != newMedia) {
				if (_currentMedia) {
					_currentMedia.stop();
					_currentMedia.removeGlobalListener(forwardEvents);
				}
				newMedia.addGlobalListener(forwardEvents);
				_currentMedia = newMedia;
			}

			return true;
		}

		
		protected function forwardEvents(evt:Event):void {
			if (evt is PlayerEvent) {
				if (evt.type == MediaEvent.JWPLAYER_MEDIA_COMPLETE) {
					dispatchEvent(new MediaEvent(MediaEvent.JWPLAYER_MEDIA_BEFORECOMPLETE));
				} else if (evt.type == MediaEvent.JWPLAYER_MEDIA_ERROR) {
					// Translate media error into player error.
					dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_ERROR, (evt as MediaEvent).message));
				} 
				dispatchEvent(evt);
			}
		}

		/** e.g. http://providers.longtailvideo.com/5/myProvider.swf --> myprovider **/
		protected function url2type(type:String):String {
			if (type.toLowerCase() == "audio")
				return "sound";
			else
				return type.substring(type.lastIndexOf("/") + 1, type.length).replace(".swf", "").toLowerCase();
		}

	}
}