package com.longtailvideo.jwplayer.controller {
	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
	import com.longtailvideo.jwplayer.events.ViewEvent;
	import com.longtailvideo.jwplayer.model.Model;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.parsers.JWParser;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.utils.Configger;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.RootReference;
	import com.longtailvideo.jwplayer.view.View;
	
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.utils.setTimeout;

	/**
	 * Sent when the player has been initialized and skins and plugins have been successfully loaded.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_READY
	 */
	[Event(name="jwplayerReady", type = "com.longtailvideo.jwplayer.events.PlayerEvent")]

	/**
	 * Sent when the player has entered the ERROR state
	 *
	 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_ERROR
	 */
	[Event(name="jwplayerError", type = "com.longtailvideo.jwplayer.events.PlayerEvent")]

	/**
	 * Sent when the player has been locked
	 *
	 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_LOCKED
	 */
	[Event(name="jwplayerLocked", type = "com.longtailvideo.jwplayer.events.PlayerEvent")]

	/**
	 * Sent when the player has been unlocked
	 *
	 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_UNLOCKED
	 */
	[Event(name="jwplayerUnlocked", type = "com.longtailvideo.jwplayer.events.PlayerEvent")]

	/**
	 * Sent when the player has gone into or out of fullscreen mode
	 *
	 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_FULLSCREEN
	 */
	[Event(name="jwplayerFullscreen", type = "com.longtailvideo.jwplayer.events.PlayerEvent")]

	/**
	 * The Controller is responsible for handling Model / View events and calling the appropriate responders
	 *
	 * @author Pablo Schklowsky
	 */
	public class Controller extends GlobalEventDispatcher {

		/** MVC References **/
		protected var _player:IPlayer;
		protected var _model:Model;
		protected var _view:View;

		/** Setup completed **/
		protected var _setupComplete:Boolean = false;
		/** Setup finalized **/
		protected var _setupFinalized:Boolean = false;
		/** Whether to autostart on unlock **/
		protected var _unlockAutostart:Boolean = false;
		/** Whether to resume on unlock **/
		protected var _lockingResume:Boolean = false;
		/** Lock manager **/
		protected var _lockManager:LockManager;
		/** Load after unlock - My favorite variable ever **/
		protected var _unlockAndLoad:Boolean;
		/** The lock swallowed the complete action; we should go to the next playlist item if necessary **/
		protected var _completeOnUnlock:Boolean;
		/** Whether the playlist has been loaded yet **/
		protected var _playlistReady:Boolean = false;
		/** Set this value if a seek request comes in before the seek is possible **/
		protected var _queuedSeek:Number = -1;
		/** Saving whether a seek was sent on idle. **/
		protected var _idleSeek:Number = -1;
		/** Set this to true if play should be interrupted after onBeforePlay propagates. **/
		protected var _interruptPlay:Boolean = false;
		/** This is set to true while the onBeforePlay event is propagating **/
		protected var _preplay:Boolean = false;
		/** Set the playlist index to this on next play (after playlist complete) **/
		protected var _loadOnPlay:Number = -1;
		/** Whether to stop the playlist onComplete **/
		protected var _stopPlaylist:Boolean = false;
	

		/** Reference to a PlaylistItem which has triggered an external MediaProvider load **/
		protected var _delayedItem:PlaylistItem;

		
		public function Controller(player:IPlayer, model:Model, view:View) {
			_player = player;
			_model = model;
			_view = view;
			_lockManager = new LockManager();

		}

		/**
		 * Begin player setup
		 * @param readyConfig If a PlayerConfig object is already available, use it to configure the player.
		 * Otherwise, load the config from XML / flashvars.
		 */
		public function setupPlayer():void {
			var setup:PlayerSetup = new PlayerSetup(_player, _model, _view);

			setup.addEventListener(Event.COMPLETE, setupComplete);
			setup.addEventListener(ErrorEvent.ERROR, setupError);

			addViewListeners();

			setup.setupPlayer();
			
		}

		protected function addViewListeners():void {
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_PLAY, playHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_PAUSE, pauseHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_STOP, stopHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_NEXT, nextHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_PREV, prevHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_SEEK, seekHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_MUTE, muteHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_VOLUME, volumeHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_FULLSCREEN, fullscreenHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_LOAD, loadHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_REDRAW, redrawHandler);
			
		}


		protected function playHandler(evt:ViewEvent):void { play(); }
		protected function stopHandler(evt:ViewEvent):void { stop(); }
		protected function pauseHandler(evt:ViewEvent):void { pause(); }
		protected function nextHandler(evt:ViewEvent):void { next(); }
		protected function prevHandler(evt:ViewEvent):void { previous(); }
		protected function seekHandler(evt:ViewEvent):void { seek(evt.data); }
		protected function muteHandler(evt:ViewEvent):void { mute(evt.data); }
		protected function volumeHandler(evt:ViewEvent):void { setVolume(evt.data); }
		protected function fullscreenHandler(evt:ViewEvent):void { fullscreen(evt.data); }
		protected function loadHandler(evt:ViewEvent):void { load(evt.data); }
		protected function redrawHandler(evt:ViewEvent):void { redraw(); }


		protected function setupComplete(evt:Event):void {
			_setupComplete = true;

			RootReference.stage.dispatchEvent(new Event(Event.RESIZE));
			_view.completeView();
			finalizeSetup();
		}


		protected function setupError(evt:ErrorEvent):void {
			Logger.log("STARTUP: Error occurred during player startup: " + evt.text);
			_view.completeView(true, evt.text);
		}


		protected function finalizeSetup():void {
			if (!locking && _setupComplete && !_setupFinalized) {
				_setupFinalized = true;
				
				_player.addEventListener(ErrorEvent.ERROR, errorHandler);

				_model.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_LOADED, playlistLoadHandler, false, -1);
				_model.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, playlistItemHandler, false, 1000);
				_model.addEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, completeHandler, false);
				_model.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, timeHandler);
				
				dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_READY));

//				playlistLoadHandler();

				// Broadcast playlist loaded (which was swallowed during player setup);
				if (_model.playlist.length > 0) {
					_model.dispatchEvent(new PlaylistEvent(PlaylistEvent.JWPLAYER_PLAYLIST_LOADED, _model.playlist));
				}

				
			}
		}

		protected function errorHandler(evt:ErrorEvent):void {
			_delayedItem = null;
			errorState(evt.text);
		}
		protected function playlistLoadHandler(evt:PlaylistEvent=null):void {
			if (!_playlistReady) {
				_playlistReady = true;
				_model.playlist.currentIndex = 0;
	
				if(_model.config.autostart) {
					if (locking) {
						_unlockAutostart = true;
					} else {
						play();
					}
				}
			}
		}


		protected function playlistItemHandler(evt:PlaylistEvent):void {
			_interruptPlay = false;
			load(_model.playlist.currentItem);
		}





		protected function errorState(message:String=""):void {
			dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_ERROR, message));
		}


		protected function completeHandler(evt:MediaEvent=null):void {
			if (locking) {
				_completeOnUnlock = true;
				return;
			}
			
			if (_stopPlaylist) {
				// This happens if stop() is called onComplete
				_stopPlaylist = false;
				return;
			}
			
			if (_model.config.repeat) {
				if (_model.playlist.currentIndex == _model.playlist.length - 1) {
					_model.playlist.currentIndex = 0;
					_model.dispatchEvent(new PlaylistEvent(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, _model.playlist))
					play();
				} else {
					next();
				}
			} else {
				if (_model.playlist.currentIndex == _model.playlist.length - 1) {
					_lockingResume = false;
					_loadOnPlay = 0;
					setTimeout(function():void { 
						_model.dispatchEvent(new PlaylistEvent(PlaylistEvent.JWPLAYER_PLAYLIST_COMPLETE, _model.playlist))
					}, 10);
				} else {
					next();
				}
			}
		}


		////////////////////
		// Public methods //
		////////////////////

		public function get locking():Boolean {
			return _lockManager.locked();
		}


		/**
		* @private
		* @copy com.longtailvideo.jwplayer.player.Player#lockPlayback
		*/
		public function lockPlayback(plugin:IPlugin, callback:Function):void {
			var wasLocked:Boolean = locking;

			_lockManager.lock(plugin, callback);

			// If it was playing, pause playback and plan to resume when you're done
			if (_player.state == PlayerState.PLAYING || _player.state == PlayerState.BUFFERING || _preplay) {
				if (!_preplay) {
					_model.media.pause();
				}
				_lockingResume = true;
			}
			_interruptPlay = _preplay;


			// Tell everyone you're locked
			if (!wasLocked) {
				Logger.log(plugin.id + " locking playback", "LOCK");
				dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_LOCKED));
				_lockManager.executeCallback();
			}
		}


		/**
		 * @private
		 * @copy com.longtailvideo.jwplayer.player.Player#unlockPlayback
		 */
		public function unlockPlayback(target:IPlugin):Boolean {
			if (_lockManager.unlock(target)) {
				if (!locking) {
					dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_UNLOCKED));
				}
				if (_setupComplete && !_setupFinalized) {
					finalizeSetup();
				}
				if (!locking) {
					if (_completeOnUnlock) {
						_completeOnUnlock = false;
						completeHandler();
						_interruptPlay = false;
						return true;
					} else if (_unlockAndLoad) {
						load(_player.playlist.currentItem);
						_unlockAndLoad = false;
					}
					if (_lockingResume || _unlockAutostart) {
						_lockingResume = false;
						play();
						if (_unlockAutostart) {
							_unlockAutostart = false;
						}
					}
					_interruptPlay = false;
					return true;
				}
			}
			return false;
		}


		public function setVolume(vol:Number):Boolean {
/*			if (locking) {
				return false;
			}
*/
			if (_model.media) {
				if (!_model.mute) {
					setCookie('volume', vol);
				}
				mute(false); 
				_model.config.volume = vol;
				_model.media.setVolume(vol);
				return true;
			}
			return false;
		}


		public function mute(muted:Boolean):Boolean {
/*			if (locking) {
				return false;
			}
*/
			if (muted && !_model.mute) {
				_model.mute = true;
				setCookie('mute', true);
				return true;
			} else if (!muted && _model.mute) {
				_model.mute = false;
				setCookie('mute', false);
				return true;
			}
			return false;
		}


		public function play():Boolean {
			if (!_playlistReady) {
				Logger.log("Attempted to begin playback before playlist is ready");
				return false;
			}
			
			
			if (locking || _player.state == PlayerState.PLAYING || _player.state == PlayerState.BUFFERING) {
				return false;
			}

			if (_loadOnPlay >= 0) {
				_model.playlist.currentIndex = _loadOnPlay;
				_loadOnPlay = -1;
			}
			
			if (!_preplay) {
				_preplay = true;
				dispatchEvent(new MediaEvent(MediaEvent.JWPLAYER_MEDIA_BEFOREPLAY));
				_preplay = false;
				if (_interruptPlay) {
					_interruptPlay = false;
					return false;
				}
			}
			
			if (_model.playlist.currentItem) {
				switch (_player.state) {
					case PlayerState.IDLE:
						_model.media.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL, bufferFullHandler);
						_model.media.load(_model.playlist.currentItem);
						break;
					case PlayerState.PAUSED:
						if (_queuedSeek >= 0) { 
							_model.media.seek(_queuedSeek);
							_queuedSeek = -1; 
						} else { 
							_model.media.play(); 
						}
						break;
				}
			}
			return true;
		}


		public function pause():Boolean {
			if (!locking && _model.media) {
				switch (_model.media.state) {
					case PlayerState.PLAYING:
					case PlayerState.BUFFERING:
						_model.media.pause();
						return true;
					default:
						_interruptPlay = _preplay;
				}
			}
			return false;
		}


		public function stop():Boolean {
			if (!locking && _model.media) {
				_interruptPlay = _preplay;
				switch (_model.media.state) {
					case PlayerState.PLAYING:
					case PlayerState.BUFFERING:
					case PlayerState.PAUSED:
						_model.media.stop();
						return true;
					default:
						_stopPlaylist = true;
				}
			}
			return false;
		}


		public function next():Boolean {
			if (locking) {
				_unlockAndLoad = true;
				return false;
			}

			_lockingResume = true;
			stop();
			_stopPlaylist = false;
			if (_model.playlist.currentIndex == _model.playlist.length - 1) {
				_player.playlist.currentIndex = 0;
			} else {
				_player.playlist.currentIndex = _player.playlist.currentIndex + 1;
			}
			play();
			
			return true;
		}


		public function previous():Boolean {
			if (locking) {
				_unlockAndLoad = true;
				return false;
			}

			_lockingResume = true;
			stop();
			_stopPlaylist = false;
			if (_model.playlist.currentIndex <= 0) {
				_model.playlist.currentIndex = _model.playlist.length - 1;
			} else {
				_player.playlist.currentIndex = _player.playlist.currentIndex - 1;
			}
			play();
			
			return true;
		}


		public function setPlaylistIndex(index:Number):Boolean {
			if (locking) {
				_unlockAndLoad = true;
				return false;
			}

			_lockingResume = true;
			if (0 <= index && index < _player.playlist.length) {
				stop();
				_stopPlaylist = false;
				_player.playlist.currentIndex = index;
				_interruptPlay = false;
				play();
				return true;
			}
			return false;
		}

		public function seek(pos:Number):Boolean {
			if (!locking && pos !== -1 && _model.media) {
				switch (_model.media.state) {
					case PlayerState.PAUSED:
						play();
						/* fallthrough */
					case PlayerState.PLAYING:
						_model.seek(pos);
						return true;
					case PlayerState.IDLE:
						_model.playlist.currentItem.start = pos;
						_idleSeek = pos;
						if (!_preplay) {
							play();
						}
						return true;
					case PlayerState.BUFFERING:
						_queuedSeek = pos;
				}
			}
			return false;
		}


		public function load(item:*):Boolean {
			if (locking) {
				_unlockAndLoad = true;
				return false;
			}
			
			if (_model.state != PlayerState.IDLE) {
				_model.media.stop();
			}
			_model.loadCalled();
			if (item is PlaylistItem) {
				return loadPlaylistItem(item as PlaylistItem);
			} else if (item is String) {
				return loadString(item as String);
			} else if (item is Number) {
				return loadNumber(item as Number);
			} else if (item is Array) {
				return loadArray(item as Array);
			} else if (item is Object) {
				return loadObject(item as Object);
			}
			return false;
		}


		protected function loadPlaylistItem(item:PlaylistItem):Boolean {
			if (locking) {
				_lockingResume = true;
				return false;
			}

			if (!_model.playlist.contains(item)) {
				_playlistReady = false;
				_model.playlist.load(item);
				return false;
			}
			
			try {
				if (!item.streamer && _model.config.streamer) { item.streamer = _model.config.streamer; }
				
				loadFile(item);
				
			} catch (err:Error) {
				Logger.log(err.message, "Error Loading Item");
				return false;
			}
			Logger.log("Loading PlaylistItem: " + item.toString(), "LOAD");
			return true;
		}

		protected function loadFile(item:PlaylistItem):void {
			if (!item.provider)
			{	
				item.provider = JWParser.getProvider(item);
				_model.playlist.load(item.file);
			}
			_model.setActiveMediaProvider(item.provider);
			
		}
		protected function loadString(item:String):Boolean {
			_playlistReady = false;
			_model.playlist.load(item);
			return true;
		}


		protected function loadArray(item:Array):Boolean {
			if (item.length > 0) {
				_playlistReady = false;
				_model.playlist.load(item);
				return true;
			}
			return false;
		}


		protected function loadNumber(item:Number):Boolean {
			if (item >= 0 && item < _model.playlist.length) {
				_model.playlist.currentIndex = item;
				return loadPlaylistItem(_model.playlist.currentItem);
			}
			return false;
		}


		protected function loadObject(item:Object):Boolean {
			if (item.hasOwnProperty('file') || item.hasOwnProperty('sources')) {
				loadPlaylistItem(new PlaylistItem(item));
				return true;
			}
			return false;
		}




		private function bufferFullHandler(evt:MediaEvent):void {
			if (!locking) {
				if (_queuedSeek >= 0) {
					_model.media.seek(_queuedSeek);
					_queuedSeek = -1;
				} else {
					_model.media.play();
				}
			} else {
				_lockingResume = true;
			}
		}


		private function timeHandler(evt:MediaEvent):void {
			if(_idleSeek > 0 && evt.position >= _idleSeek) {
				_model.playlist.currentItem.start = 0;
				_idleSeek = -1;
			}
		};


		public function redraw():Boolean {
			if (locking) {
				return false;
			}
			_view.redraw();
			return true;
		}


		public function fullscreen(mode:Boolean):Boolean {
			if (mode != _model.fullscreen) {
				_model.fullscreen = mode;
				_view.fullscreen(mode);
				dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_FULLSCREEN, mode.toString()));
				return true;
			} else {
				return false;
			}
		}
		
		public function checkBeforePlay():Boolean {
			return _preplay;
		}


		protected function setCookie(name:String, value:*):void {
			Configger.saveCookie(name, value);
		}
		
	}
}