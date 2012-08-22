package com.longtailvideo.jwplayer.media {
	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.model.PlaylistItemLevel;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.utils.Stretcher;
	
	import flash.display.DisplayObject;
	import flash.display.MovieClip;
	import flash.display.Sprite;
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
	
	public class MediaProvider extends Sprite implements IMediaProvider {
		/** Reference to the player configuration. **/
		protected var _config:PlayerConfig;
		/** Name of the MediaProvider **/
		private var _provider:String;
		/** Reference to the currently active playlistitem. **/
		protected var _item:PlaylistItem;
		/** The current position inside the file. **/
		protected var _position:Number = 0;
		/** The current volume of the audio output stream **/
		private var _volume:Number;
		/** The playback state for the currently loaded media.  @see com.longtailvideo.jwplayer.model.ModelStates **/
		private var _state:String;
		/** Clip containing graphical representation of the currently playing media **/
		protected var _media:MovieClip;
		/** Most recent buffer data **/
		private var _bufferPercent:Number;
		/** Handles event dispatching **/
		private var _dispatcher:GlobalEventDispatcher;
		/** Whether or not to stretchthe media **/
		protected var _stretch:Boolean;
		/** Queue buffer full event if it occurs while the player is paused. **/
		private var _queuedBufferFull:Boolean;
		/** Current quality level **/
		protected var _currentQuality:Number = -1;
		
		protected var _width:Number;
		protected var _height:Number;
		
		
		public function MediaProvider(provider:String) {
			_provider = provider;
			_dispatcher = new GlobalEventDispatcher();
			_stretch = true;
		}
		
		
		public function initializeMediaProvider(cfg:PlayerConfig):void {
			_config = cfg;
			_state = PlayerState.IDLE;
		}
		
		
		/**
		 * Load a new playlist item
		 * @param itm The playlistItem to load
		 **/
		public function load(itm:PlaylistItem):void {
			_item = itm;
			dispatchEvent(new MediaEvent(MediaEvent.JWPLAYER_MEDIA_LOADED));
		}
		
		
		/** Resume playback of the item. **/
		public function play():void {
			if (_queuedBufferFull) {
				_queuedBufferFull = false;
				setState(PlayerState.BUFFERING);
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
			} else {
				setState(PlayerState.PLAYING);
			}
		}
		
		
		/** Pause playback of the item. **/
		public function pause():void {
			setState(PlayerState.PAUSED);
		}
		
		
		/**
		 * Seek to a certain position in the item.
		 *
		 * @param pos	The position in seconds.
		 **/
		public function seek(pos:Number):void {
			_position = pos;
		}
		
		
		/** Stop playing and loading the item. **/
		public function stop():void {
			setState(PlayerState.IDLE);
			_position = 0;
		}
		
		
		/**
		 * Change the playback volume of the item.
		 *
		 * @param vol	The new volume (0 to 100).
		 **/
		public function setVolume(vol:Number):void {
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_VOLUME, {'volume': vol});
		}
		
		
		/**
		 * Changes the mute state of the item.
		 *
		 * @param mute	The new mute state.
		 **/
		public function mute(mute:Boolean):void {
			mute == true ? setVolume(0) : setVolume(_config.volume);
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_MUTE, {'mute': mute});
		}
		
		
		/**
		 * Resizes the display.
		 *
		 * @param width		The new width of the display.
		 * @param height	The new height of the display.
		 * @param stretch	Whether or not to stretch the media 
		 **/
		public function resize(width:Number, height:Number):void {
			if (_stretch) {
				_width = width;
				_height = height;
				
				if (_media) {
					// Fix some rounding errors by resetting the media container size before stretching
					if (_media.numChildren > 0) {
						_media.width = _media.getChildAt(0).width;
						_media.height = _media.getChildAt(0).height;
					}
					Stretcher.stretch(_media, width, height, _config.stretching);
				}
			}
		}
		
		
		/** Graphical representation of media **/
		public function get display():DisplayObject {
			return _media;
		}
		
		
		/** Name of the MediaProvider. */
		public function get provider():String {
			return _provider;
		}
		
		
		/**
		 * Current state of the MediaProvider.
		 * @see PlayerStates
		 */
		public function get state():String {
			return _state;
		}
		
		
		/** Currently playing PlaylistItem **/
		public function get item():PlaylistItem {
			return _item;
		}
		
		
		/** Current position, in seconds **/
		public function get position():Number {
			return _position;
		}
		
		
		/**
		 * The current volume of the playing media
		 * <p>Range: 0-100</p>
		 */
		public function get volume():Number {
			return _volume;
		}
		
		
		/** Puts the video into a buffer state **/
		protected function buffer():void {
			
		}
		
		
		/** Completes video playback **/
		protected function complete():void {
			if (state != PlayerState.IDLE) {
				stop();
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_COMPLETE);
			}
		}
		
		
		/** Dispatches error notifications **/
		protected function error(message:String):void {
			stop();
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_ERROR, {message: message});
		}
		
		
		/**
		 * Sets the current state to a new state and sends a PlayerStateEvent
		 * @param newState A state from ModelStates.
		 */
		protected function setState(newState:String):void {
			if (state != newState) {
				var evt:PlayerStateEvent = new PlayerStateEvent(PlayerStateEvent.JWPLAYER_PLAYER_STATE, newState, state);
				_state = newState;
				dispatchEvent(evt);
			}
		}
		
		
		/**
		 * Sends a MediaEvent, simultaneously setting a property
		 * @param type
		 * @param property
		 * @param value
		 */
		protected function sendMediaEvent(type:String, properties:Object=null):void {
			if (type == MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL && state == PlayerState.PAUSED) {
				_queuedBufferFull = true;
			} else {
				var newEvent:MediaEvent = new MediaEvent(type);
				for (var property:String in properties) {
					if (newEvent.hasOwnProperty(property)) {
						newEvent[property] = properties[property];
					}
				}
				dispatchEvent(newEvent);
			}
		}
		
		
		/** Dispatches buffer change notifications **/
		protected function sendBufferEvent(bufferPercent:Number, offset:Number=0, metadata:Object=null):void {
			if ((_bufferPercent != bufferPercent || bufferPercent == 0) && 0 <= bufferPercent < 100) {
				_bufferPercent = bufferPercent;
				var obj:Object = {
					'bufferPercent':	_bufferPercent, 
					'offset': 			offset, 
					'duration': 		_item.duration,
					'position': 		Math.max(0, _position),
					'metadata':			metadata
				};
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER, obj);
			}
		}
		
		
		/**
		 * The current config
		 */
		protected function get config():PlayerConfig {
			return _config;
		}
		
		
		/**
		 * Gets a property from the player configuration
		 *
		 * @param property The property to be retrieved.
		 * **/
		protected function getConfigProperty(property:String):* {
			if (item && item.hasOwnProperty(_provider + "." + property)) {
				return item[_provider + "." + property];
			} else {
				return _config.pluginConfig(provider)[property];
			}
		}
		
		/**
		 * Gets the graphical representation of the media.
		 * 
		 */
		protected function get media():DisplayObject {
			return _media;
		}
		
		
		/**
		 * Sets the graphical representation of the media.
		 * 
		 */
		protected function set media(m:DisplayObject):void {
			if (m) {
				_media = new MovieClip();
				_media.addChild(m);
				if (_width * _height > 0) {
					Stretcher.stretch(_media, _width, _height, _config.stretching);
				}
			} else {
				_media = null;
			}
		}
		
		/**
		 * Allows MediaProviders to specify whether or not super.resize() should stretch the media
		 **/
		protected function set stretch(stretch:Boolean):void {
			_stretch = stretch;
		}

		/**
		 * Whether or not the media should be streched by the player on resize()
		 **/
		public function get stretchMedia():Boolean {
			return _stretch;
		}


		/** Current quality level getter **/
		public function get currentQuality():Number {
			return _currentQuality;
		}


		/** Current quality level setter **/
		public function set currentQuality(quality:Number):void {
			_currentQuality = quality;
		}


		/** Quality levels (must be overridden by inheritors **/
		public function get qualityLevels():Array {
			return null;
		}


		/** Translate sources into quality levels. **/
		protected function sources2Levels(sources:Array):Array {
			var levels:Array = new Array();
			for (var i:Number=0; i<sources.length; i++) {
				var level:Object = { label: i+" " };
				if(sources[i].bitrate) {
					level.bitrate = sources[i].bitrate;
					level.label = sources[i].bitrate + "kbps";
				}
				if(sources[i].width) {
					level.width = sources[i].width;
					level.label = sources[i].width + "px";
				}
				if(sources[i].height) {
					level.height = sources[i].height;
					level.label = sources[i].height + "p";
				}
				if(sources[i].label) {
					level.label = sources[i].label;
				}
				levels.push(level);
			}
			return levels;
		}


		/** Broadcast onQualityLevels / onCurrentQuality. **/
		protected function sendQualityEvent(type:String, sources:Array, quality:Number):void {
			var qualityEvent:MediaEvent = new MediaEvent(type);
			qualityEvent.levels = sources2Levels(sources);
			qualityEvent.currentQuality = quality;
			dispatchEvent(qualityEvent);
		}


		/**
		 * @inheritDoc
		 */
		public function addGlobalListener(listener:Function):void {
			_dispatcher.addGlobalListener(listener);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function removeGlobalListener(listener:Function):void {
			_dispatcher.removeGlobalListener(listener);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public override function dispatchEvent(event:Event):Boolean {
			_dispatcher.dispatchEvent(event);
			return super.dispatchEvent(event);
		}
	}
}