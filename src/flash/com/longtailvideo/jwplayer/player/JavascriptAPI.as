package com.longtailvideo.jwplayer.player {
	import com.longtailvideo.jwplayer.events.*;
	import com.longtailvideo.jwplayer.model.*;
	import com.longtailvideo.jwplayer.plugins.*;
	import com.longtailvideo.jwplayer.utils.*;
	import com.longtailvideo.jwplayer.view.interfaces.*;
	
	import flash.events.*;
	import flash.external.*;
	import flash.utils.*;
	
	public class JavascriptAPI {
		protected var _player:IPlayer;
		protected var _playerBuffer:Number = 0;
		protected var _playerPosition:Number = 0;
		
		protected var _listeners:Object;
		protected var _queuedEvents:Array = [];
		
		protected var _lockPlugin:IPlugin;
		protected var _instream:IInstreamPlayer;
		protected var _isItem:PlaylistItem;
		protected var _isConfig:IInstreamOptions;
		
		protected var _destroyed:Boolean = false;
		
		public function JavascriptAPI(player:IPlayer) {
			_listeners = {};
			_lockPlugin = new AbstractPlugin();
			
			_player = player;
			_player.addEventListener(PlayerEvent.JWPLAYER_READY, playerReady);

			setupPlayerListeners();
			setupJSListeners();
			_player.addGlobalListener(queueEvents);
			
		}
		
		/** Delay the response to PlayerReady to allow the external interface to initialize in some browsers **/
		protected function playerReady(evt:PlayerEvent):void {
			var timer:Timer = new Timer(50, 1);
			
			timer.addEventListener(TimerEvent.TIMER_COMPLETE, function(timerEvent:TimerEvent):void {
				_player.removeGlobalListener(queueEvents);
				if (ExternalInterface.available) {
					callJS("jwplayer.playerReady",{
						id:evt.id,
						client:evt.client,
						version:evt.version
					});
					clearQueuedEvents();
				}
			});
			timer.start();
		}

		protected function queueEvents(evt:Event):void {
			_queuedEvents.push(evt);
		}
		
		protected function clearQueuedEvents():void {
			for each (var queuedEvent:Event in _queuedEvents) {
				listenerCallback(queuedEvent);
			}
			_queuedEvents = null;
		}
		
		protected function setupPlayerListeners():void {
			_player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, resetPosition);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, updatePosition);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER, updateBuffer);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_VOLUME, updateVolumeCookie);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_MUTE, updateMuteCookie);
		}
		
		protected function resetPosition(evt:PlaylistEvent):void {
			_playerPosition = 0;
			_playerBuffer = 0;
		}
		
		protected function updatePosition(evt:MediaEvent):void {
			_playerPosition = evt.position;
		}

		protected function updateBuffer(evt:MediaEvent):void {
			_playerBuffer = evt.bufferPercent;
		}
		
		protected function updateVolumeCookie(evt:MediaEvent):void {
			if (!_player.config.mute) {
				callJS("function(vol) { try { jwplayer.utils.saveCookie('volume', vol) } catch(e) {} }", evt.volume.toString());
			}
		}

		protected function updateMuteCookie(evt:MediaEvent):void {
			callJS("function(state) { try { jwplayer.utils.saveCookie('mute', state) } catch(e) {} }", evt.mute.toString());
		}

		protected function setupJSListeners():void {
			try {
				// Event handlers
				ExternalInterface.addCallback("jwAddEventListener", js_addEventListener);
				ExternalInterface.addCallback("jwRemoveEventListener", js_removeEventListener);
				
				// Getters
				ExternalInterface.addCallback("jwGetBuffer", js_getBuffer);
				ExternalInterface.addCallback("jwGetDuration", js_getDuration);
				ExternalInterface.addCallback("jwGetFullscreen", js_getFullscreen);
				ExternalInterface.addCallback("jwGetHeight", js_getHeight);
				ExternalInterface.addCallback("jwGetMute", js_getMute);
				ExternalInterface.addCallback("jwGetPlaylist", js_getPlaylist);
				ExternalInterface.addCallback("jwGetPlaylistIndex", js_getPlaylistIndex);
				ExternalInterface.addCallback("jwGetPosition", js_getPosition);
				ExternalInterface.addCallback("jwGetState", js_getState);
				ExternalInterface.addCallback("jwGetWidth", js_getWidth);
				ExternalInterface.addCallback("jwGetVersion", js_getVersion);
				ExternalInterface.addCallback("jwGetVolume", js_getVolume);
				ExternalInterface.addCallback("jwGetStretching", js_getStretching);
				ExternalInterface.addCallback("jwGetControls", js_getControls);
				ExternalInterface.addCallback("jwGetSafeRegion", js_getSafeRegion);

				// Player API Calls
				ExternalInterface.addCallback("jwPlay", js_play);
				ExternalInterface.addCallback("jwPause", js_pause);
				ExternalInterface.addCallback("jwStop", js_stop);
				ExternalInterface.addCallback("jwSeek", js_seek);
				ExternalInterface.addCallback("jwLoad", js_load);
				ExternalInterface.addCallback("jwPlaylistItem", js_playlistItem);
				ExternalInterface.addCallback("jwPlaylistNext", js_playlistNext);
				ExternalInterface.addCallback("jwPlaylistPrev", js_playlistPrev);
				ExternalInterface.addCallback("jwSetMute", js_mute);
				ExternalInterface.addCallback("jwSetVolume", js_volume);
				ExternalInterface.addCallback("jwSetFullscreen", js_fullscreen);
				ExternalInterface.addCallback("jwSetStretching", js_setStretching);
				ExternalInterface.addCallback("jwSetControls", js_setControls);
				
				// Player Controls APIs
				ExternalInterface.addCallback("jwControlbarShow", js_showControlbar);
				ExternalInterface.addCallback("jwControlbarHide", js_hideControlbar);

				ExternalInterface.addCallback("jwDisplayShow", js_showDisplay);
				ExternalInterface.addCallback("jwDisplayHide", js_hideDisplay);
				
				ExternalInterface.addCallback("jwDockHide", js_hideDock);
				ExternalInterface.addCallback("jwDockAddButton", js_dockAddButton);
				ExternalInterface.addCallback("jwDockRemoveButton", js_dockRemoveButton);
				ExternalInterface.addCallback("jwDockShow", js_showDock);
				
				// Instream API
				ExternalInterface.addCallback("jwLoadInstream", js_loadInstream);

				// The player shouldn't send any events if it's been destroyed
				ExternalInterface.addCallback("jwDestroyAPI", js_destroyAPI);

				// Quality API
				ExternalInterface.addCallback("jwGetQualityLevels", js_getQualityLevels);
				ExternalInterface.addCallback("jwGetCurrentQuality", js_getCurrentQuality);
				ExternalInterface.addCallback("jwSetCurrentQuality", js_setCurrentQuality);

				// Captions API
				ExternalInterface.addCallback("jwGetCaptionsList", js_getCaptionsList);
				ExternalInterface.addCallback("jwGetCurrentCaptions", js_getCurrentCaptions);
				ExternalInterface.addCallback("jwSetCurrentCaptions", js_setCurrentCaptions);
				
				// UNIMPLEMENTED
				//ExternalInterface.addCallback("jwGetBandwidth", js_getBandwidth); 
				//ExternalInterface.addCallback("jwGetLevel", js_getLevel);
				//ExternalInterface.addCallback("jwGetLockState", js_getLockState);
				
			} catch(e:Error) {
				Logger.log("Could not initialize JavaScript API: "  + e.message);
			}
			
		}

		
		/***********************************************
		 **              EVENT LISTENERS              **
		 ***********************************************/
		
		protected function js_addEventListener(eventType:String, callback:String):void {
			if (!_listeners[eventType]) {
				_listeners[eventType] = [];
				_player.addEventListener(eventType, listenerCallback);
			}
			(_listeners[eventType] as Array).push(callback);
		}
		
		protected function js_removeEventListener(eventType:String, callback:String):void {
			var callbacks:Array = _listeners[eventType];
			if (callbacks) {
				var callIndex:Number = callbacks.indexOf(callback);
				if (callIndex > -1) {
					callbacks.splice(callIndex, 1);
				}
			}
		}
		
		
		
		protected function listenerCallback(evt:Event):void {
			var args:Object = {};
			if (evt is CaptionsEvent)
				args = listenerCallbackCaptions(evt as CaptionsEvent);
			else if (evt is MediaEvent)
				args = listenerCallbackMedia(evt as MediaEvent);
			else if (evt is PlayerStateEvent)
				args = listenerCallbackState(evt as PlayerStateEvent);
			else if (evt is PlaylistEvent)
				args = listenerCallbackPlaylist(evt as PlaylistEvent);
			else if (evt.type == ViewEvent.JWPLAYER_CONTROLS)
				args = { controls: (evt as ViewEvent).data };
			else if (evt is ViewEvent && (evt as ViewEvent).data != null)
				args = { data: JavascriptSerialization.stripDots((evt as ViewEvent).data) };
			else if (evt is PlayerEvent) {
				args = { message: (evt as PlayerEvent).message };
			}
			
			args.type = evt.type;
			var callbacks:Array = _listeners[evt.type] as Array;
			
			
			if (callbacks) {
				// These events should be sent immediately to JavaScript
				var synchronousEvents:Array = [
					MediaEvent.JWPLAYER_MEDIA_COMPLETE,
					MediaEvent.JWPLAYER_MEDIA_BEFOREPLAY,
					MediaEvent.JWPLAYER_MEDIA_BEFORECOMPLETE,
					PlaylistEvent.JWPLAYER_PLAYLIST_LOADED,
					PlaylistEvent.JWPLAYER_PLAYLIST_ITEM,
					PlayerStateEvent.JWPLAYER_PLAYER_STATE
				];
				
				for each (var call:String in callbacks) {
					// Not a great workaround, but the JavaScript API competes with the Controller when dealing with certain events
					if (synchronousEvents.indexOf(evt.type) >= 0) {
						callJS(call, args);
					} else {
						//Insert 1ms delay to allow all Flash listeners to complete before notifying JavaScript
						setTimeout(function():void {
							callJS(call, args);
						}, 0);
					}
				}
			}
			
		}
		
		protected function merge(obj1:Object, obj2:Object):Object {
			var newObj:Object = {};
			
			for (var key:String in obj1) {
				newObj[key] = obj1[key];
			}
			
			for (key in obj2) {
				newObj[key] = obj2[key];
			}
			
			return newObj;
		}
		
		protected function listenerCallbackMedia(evt:MediaEvent):Object {
			var returnObj:Object = {};

			if (evt.bufferPercent >= 0) 		returnObj.bufferPercent = evt.bufferPercent;
			if (evt.duration >= 0)		 		returnObj.duration = evt.duration;
			if (evt.message)					returnObj.message = evt.message;
			if (evt.metadata != null)	 		returnObj.metadata = JavascriptSerialization.stripDots(evt.metadata);
			if (evt.offset > 0)					returnObj.offset = evt.offset;
			if (evt.position >= 0)				returnObj.position = evt.position;
			if (evt.currentQuality >= 0)		returnObj.currentQuality = evt.currentQuality;
			if (evt.levels)						returnObj.levels = JavascriptSerialization.stripDots(evt.levels);

			if (evt.type == MediaEvent.JWPLAYER_MEDIA_MUTE)
				returnObj.mute = evt.mute;
			
			if (evt.type == MediaEvent.JWPLAYER_MEDIA_VOLUME)
				returnObj.volume = evt.volume;

			return returnObj;
		}

		protected function listenerCallbackCaptions(evt:CaptionsEvent):Object {
			var returnObj:Object = {};
			
			if (evt.currentTrack >= 0)		returnObj.track = evt.currentTrack;
			if (evt.tracks)					returnObj.tracks = JavascriptSerialization.stripDots(evt.tracks);
	
			return returnObj;
		}
		
		
		protected function listenerCallbackState(evt:PlayerStateEvent):Object {
			if (evt.type == PlayerStateEvent.JWPLAYER_PLAYER_STATE) {
				return { newstate: evt.newstate, oldstate: evt.oldstate };
			} else return {};
		}

		protected function listenerCallbackPlaylist(evt:PlaylistEvent):Object {
			if (evt.type == PlaylistEvent.JWPLAYER_PLAYLIST_LOADED) {
				var list:Array = JavascriptSerialization.playlistToArray(_player.playlist);
				list = JavascriptSerialization.stripDots(list) as Array;
				return { playlist: list };
			} else if (evt.type == PlaylistEvent.JWPLAYER_PLAYLIST_ITEM) {
				return { index: _player.playlist.currentIndex };
			} else return {};
		}


		/***********************************************
		 **                 GETTERS                   **
		 ***********************************************/
		
		protected function js_getBandwidth():Number {
			return _player.config.bandwidth;
		}

		protected function js_getBuffer():Number {
			return _playerBuffer;
		}
		
		protected function js_getDuration():Number {
			return _player.playlist.currentItem ? _player.playlist.currentItem.duration : 0;
		}
		
		protected function js_getFullscreen():Boolean {
			return _player.config.fullscreen;
		}

		protected function js_getHeight():Number {
			return RootReference.stage.stageHeight;
		}
		
		protected function js_getLevel():Number {
			return _player.playlist.currentItem ? _player.playlist.currentItem.currentLevel : 0;
		}
		
		protected function js_getLockState():Boolean {
			return _player.locked;
		}
		
		protected function js_getMute():Boolean {
			return _player.config.mute;
		}
		
		protected function js_getPlaylist():Array {
			var playlistArray:Array = JavascriptSerialization.playlistToArray(_player.playlist);
			for (var i:Number=0; i < playlistArray.length; i++) {
				playlistArray[i] = JavascriptSerialization.stripDots(playlistArray[i]);
			}
			return playlistArray; 
		}

		
		protected function js_getPlaylistIndex():Number {
			return _player.playlist.currentIndex; 
		}
		
		
		protected function js_getPosition():Number {
			return _playerPosition;
		}
		
		protected function js_getState():String {
			return _player.state;
		}

		protected function js_getWidth():Number {
			return RootReference.stage.stageWidth;
		}

		protected function js_getVersion():String {
			return _player.version;
		}

		protected function js_getVolume():Number {
			return _player.config.volume;
		}

		protected function js_getStretching():String {
			return _player.config.stretching;
		}

		/***********************************************
		 **                 PLAYBACK                  **
		 ***********************************************/

		protected function js_dockAddButton(icon:String, label:String, click:String, id:String):void {
			_player.controls.dock.addButton(icon, label, click, id);
		};
		protected function js_dockRemoveButton(id:String):void {
			_player.controls.dock.removeButton(id);
		};
	
		protected function js_play(playstate:*=null):void {
			if (playstate == null){
				playToggle();
			} else {
				if (String(playstate).toLowerCase() == "true"){
					_player.play();
				} else {
					_player.pause();
				}
			}
		}
		
		
		protected function js_pause(playstate:*=null):void {
			if (playstate == null){
				playToggle();
			} else {
				if (String(playstate).toLowerCase() == "true"){
					_player.pause();
				} else {
					_player.play();	
				}
			}
		}
		
		protected function playToggle():void {
			if (_player.state == PlayerState.IDLE || _player.state == PlayerState.PAUSED) {
				_player.play();
			} else {
				_player.pause();
			}
		}
		
		protected function js_stop():void {
			_player.stop();
		}
		
		protected function js_seek(position:Number=0):void {
			_player.seek(position);
		}
		
		protected function js_load(toLoad:*):void {
			_player.load(toLoad);
		}
		
		protected function js_playlistItem(item:Number):void {
			_player.playlistItem(item);
		}

		protected function js_playlistNext():void {
			_player.playlistNext();
		}

		protected function js_playlistPrev():void {
			_player.playlistPrev();
		}

		protected function js_mute(mutestate:*=null):void {
			if (mutestate == null){
				_player.mute(!_player.config.mute);
			} else {
				if (String(mutestate).toLowerCase() == "true") {
					_player.mute(true);
				} else {
					_player.mute(false);
				}
			}
		}

		protected function js_volume(volume:Number):void {
			_player.volume(volume);
		}

		protected function js_fullscreen(fullscreenstate:*=null):void {
			if (fullscreenstate == null){
				fullscreenstate = !_player.config.fullscreen;
			}
			
			if (String(fullscreenstate).toLowerCase() == "true") {
				// This won't ever work - Flash fullscreen mode can't be set from JavaScript
				Logger.log("Can't activate Flash fullscreen mode from JavaScript API");
				return;
			} else {
				_player.fullscreen(false);
			}
		}
		
		protected function js_setStretching(stretching:String):void {
			_player.config.stretching = stretching;
			_player.redraw();
		}

		
		protected function js_loadInstream(item:Object, config:Object):void {
			_isItem = new PlaylistItem(item);
			_isConfig = new InstreamOptions(config);

			if (!_isConfig.autoload) {
				_player.lock(_lockPlugin, function():void {
					_instream = _player.loadInstream(_lockPlugin, _isItem, _isConfig);
					beginInstream();
				});
			} else {
				_instream = _player.loadInstream(_lockPlugin, _isItem, _isConfig);
				beginInstream();
			}
		}
		
		protected function beginInstream():void {
			if (_instream) {
				_instream.addEventListener(InstreamEvent.JWPLAYER_INSTREAM_DESTROYED, function(evt:InstreamEvent):void {
					_player.unlock(_lockPlugin);
				});
				new JavascriptInstreamAPI(_instream, _isConfig, _player, _lockPlugin);	
			}	
		}
		
		protected function setComponentVisibility(component:IPlayerComponent, state:Boolean):void {
			state ? component.show() : component.hide();
		}

		protected function js_showControlbar():void {
			setComponentVisibility(_player.controls.controlbar, true);
		}
		
		protected function js_hideControlbar():void {
			setComponentVisibility(_player.controls.controlbar, false);
		}

		protected function js_showDock():void {
			setComponentVisibility(_player.controls.dock, true);
		}
		
		protected function js_hideDock():void {
			setComponentVisibility(_player.controls.dock, false);
		}

		protected function js_showDisplay():void {
			setComponentVisibility(_player.controls.display, true);
		}
		
		protected function js_hideDisplay():void {
			setComponentVisibility(_player.controls.display, false);
		}

		protected function js_destroyAPI():void {
			_destroyed = true;
		}
		
		protected function js_getQualityLevels():Array {
			return _player.getQualityLevels();
		}
		
		protected function js_getCurrentQuality():Number {
			return _player.getCurrentQuality();
		}
		
		protected function js_setCurrentQuality(index:Number):void {
			_player.setCurrentQuality(index);	
		}

		protected function js_getCaptionsList():Array {
			return _player.getCaptionsList();
		}
		
		protected function js_getCurrentCaptions():Number {
			return _player.getCurrentCaptions();
		}
		
		protected function js_setCurrentCaptions(index:Number):void {
			_player.setCurrentCaptions(index);	
		}
		
		protected function js_getControls():Boolean {
			return _player.getControls();
		}

		protected function js_getSafeRegion():Object {
			return JavascriptSerialization.rectangleToObject(_player.getSafeRegion());
		}
		
		protected function js_setControls(state:Boolean):void {
			_player.setControls(state);
		}
		
		protected function callJS(functionName:String, args:*):void {
			if (!_destroyed && ExternalInterface.available) {
				ExternalInterface.call(functionName, args);
			}
		}

		
	}

}