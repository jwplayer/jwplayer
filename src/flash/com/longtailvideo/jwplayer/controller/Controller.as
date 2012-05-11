package com.longtailvideo.jwplayer.controller {
	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
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
		

		/** A list with legacy CDN classes that are now redirected to buit-in ones. **/
		protected var cdns:Object = {
				bitgravity:{'http.startparam':'starttime', provider:'http'},
				edgecast:{'http.startparam':'ec_seek', provider:'http'},
				flvseek:{'http.startparam':'fs', provider:'http'},
				highwinds:{'rtmp.loadbalance':true, provider:'rtmp'},
				lighttpd:{'http.startparam':'start', provider:'http'},
				vdox:{'rtmp.loadbalance':true, provider:'rtmp'}
		};
		
		/** Reference to a PlaylistItem which has triggered an external MediaProvider load **/
		protected var _delayedItem:PlaylistItem;
		/** Loader for external MediaProviders **/
		protected var _mediaLoader:MediaProviderLoader;
		
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
			dispatchEvent(evt.clone());
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

				// Broadcast playlist loaded (which was swallowed during player setup);
				if (_model.playlist.length > 0) {
					_model.dispatchEvent(new PlaylistEvent(PlaylistEvent.JWPLAYER_PLAYLIST_LOADED, _model.playlist));
				}

				
			}
		}


		protected function playlistLoadHandler(evt:PlaylistEvent=null):void {
			_playlistReady = true;
			
			if (_model.config.shuffle) {
				shuffleItem();
			} else {
				if (_model.config.item >= _model.playlist.length) {
					_model.config.item = _model.playlist.length - 1;
				}
				_model.playlist.currentIndex = _model.config.item;
			}

			if(_model.config.autostart) {
				if (locking) {
					_unlockAutostart = true;
				} else {
					play();
				}
			}
		}


		protected function shuffleItem():void {
			_model.playlist.currentIndex = Math.floor(Math.random() * _model.playlist.length);
		}


		protected function playlistItemHandler(evt:PlaylistEvent):void {
			_model.config.item = _model.playlist.currentIndex;
			_interruptPlay = false;
			load(_model.playlist.currentItem);
		}


		protected function errorHandler(evt:ErrorEvent):void {
			_delayedItem = null;
			_mediaLoader = null;
			errorState(evt.text);
		}


		protected function errorState(message:String=""):void {
			dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_ERROR, message));
		}


		protected function completeHandler(evt:MediaEvent=null):void {
			if (locking) {
				_completeOnUnlock = true;
				return;
			}
			
			switch (_model.config.repeat) {
				case RepeatOptions.SINGLE:
					play();
					break;
				case RepeatOptions.ALWAYS:
					if (_model.playlist.currentIndex == _model.playlist.length - 1 && !_model.config.shuffle) {
						_model.playlist.currentIndex = 0;
						play();
					} else {
						next();
					}
					break;
				case RepeatOptions.LIST:
					if (_model.playlist.currentIndex == _model.playlist.length - 1 && !_model.config.shuffle) {
						_lockingResume = false;
						_model.playlist.currentIndex = 0;
					} else {
						next();
					}
					break;
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
			if (_lockManager.lock(plugin, callback)) {
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
				mute(false); 
				_model.config.volume = vol;
				_model.media.setVolume(vol);
				setCookie('volume', vol);
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
			
			if (_mediaLoader) {
				_delayedItem = _model.playlist.currentItem;
				return false;
			}

			if (locking) {
				return false;
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
			if (locking) {
				return false;
			}
			if (!_model.media)
				return false;

			switch (_model.media.state) {
				case PlayerState.PLAYING:
				case PlayerState.BUFFERING:
					_model.media.pause();
					return true;
					break;
				default:
					_interruptPlay = _preplay;
					break;
			}

			return false;
		}


		public function stop():Boolean {
			if (locking) {
				return false;
			}
			
			if (!_model.media) {
				return false;
			}
			
			_interruptPlay = _preplay;

			switch (_model.media.state) {
				case PlayerState.PLAYING:
				case PlayerState.BUFFERING:
				case PlayerState.PAUSED:
					_model.media.stop();
					return true;
					break;
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
			if (_model.config.shuffle) {
				shuffleItem();
			} else if (_model.playlist.currentIndex == _model.playlist.length - 1) {
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
			if (_model.config.shuffle) {
				shuffleItem();
			} else if (_model.playlist.currentIndex <= 0) {
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
				_player.playlist.currentIndex = index;
				_interruptPlay = false;
				play();
				return true;
			}
			return false;
		}

		public function seek(pos:Number):Boolean {
			if (locking) {
				return false;
			}
			if (!_model.media || pos == -1) {
				// Couldn't seek since media wasn't initialized
				return false;
			}

			switch (_model.media.state) {
				case PlayerState.PLAYING:
				case PlayerState.PAUSED:
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
					break;
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
				_model.playlist.load(item);
				return false;
			}
			
			try {
				if (!item.streamer && _model.config.streamer) { item.streamer = _model.config.streamer; }
				if (!item.provider) { item.provider = JWParser.getProvider(item); }
				
				if (!setProvider(item) && item.file) {
					_model.playlist.load(item.file); 
				} else if(_mediaLoader) {
					_model.setActiveMediaProvider('default');
					dispatchEvent(new PlayerStateEvent(PlayerStateEvent.JWPLAYER_PLAYER_STATE, PlayerState.BUFFERING, PlayerState.IDLE));
				}
			} catch (err:Error) {
				Logger.log(err.message, "ERROR");
				return false;
			}
			Logger.log("Loading PlaylistItem: " + item.toString(), "LOAD");
			return true;
		}


		protected function loadString(item:String):Boolean {
			_model.playlist.load(new PlaylistItem({file: item}));
			return true;
		}


		protected function loadArray(item:Array):Boolean {
			if (item.length > 0) {
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
			if (item.hasOwnProperty('file') || item.hasOwnProperty('levels')) {
				_model.playlist.load(new PlaylistItem(item));
				return true;
			}
			return false;
		}


		protected function setProvider(item:PlaylistItem):Boolean {
			var provider:String = item.provider;

			if (provider) {

				// Backwards compatibility for CDNs in the 'type' flashvar.
				if (cdns.hasOwnProperty(provider)) {
					_model.config.setConfig(cdns[provider]);
					provider = cdns[provider]['provider'];
				}

				// If the model doesn't have an instance of the provider, load & instantiate it
				if (!_model.hasMediaProvider(provider)) {
					_mediaLoader = new MediaProviderLoader();
					_mediaLoader.addEventListener(Event.COMPLETE, mediaSourceLoaded);
					_mediaLoader.addEventListener(ErrorEvent.ERROR, errorHandler);
					_mediaLoader.loadSource(provider);
					return true;
				}

				_model.setActiveMediaProvider(provider);
				return true;
			}

			return false;
		}


		protected function mediaSourceLoaded(evt:Event):void {
			var loader:MediaProviderLoader = _mediaLoader;
			_mediaLoader = null;
			if (_delayedItem) {
				_model.setMediaProvider(_delayedItem.provider, loader.loadedSource);
				_model.setActiveMediaProvider(_delayedItem.provider);
				_delayedItem = null;
				play();
			} else {
				_model.setMediaProvider(_model.playlist.currentItem.provider, loader.loadedSource);
				_model.setActiveMediaProvider(_model.playlist.currentItem.provider);
			}
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


		protected function setCookie(name:String, value:*):void {
			Configger.saveCookie(name, value);
		}
		
	}
}