package com.longtailvideo.jwplayer.player {
	import com.longtailvideo.jwplayer.events.CaptionsEvent;
	import com.longtailvideo.jwplayer.events.CastEvent;
	import com.longtailvideo.jwplayer.events.InstreamEvent;
	import com.longtailvideo.jwplayer.events.JWAdEvent;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
	import com.longtailvideo.jwplayer.events.TrackEvent;
	import com.longtailvideo.jwplayer.events.ViewEvent;
	import com.longtailvideo.jwplayer.plugins.AbstractPlugin;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.utils.JavascriptSerialization;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.RootReference;
	import com.longtailvideo.jwplayer.view.interfaces.IPlayerComponent;
	
	import flash.events.Event;
	import flash.events.TimerEvent;
	import flash.external.ExternalInterface;
	import flash.utils.Timer;
	import flash.utils.setTimeout;
	
	public class JavascriptAPI {
		private static var _player:IPlayer;
		private static var _playerBuffer:Number = 0;
		private static var _playerPosition:Number = 0;
		
		private static var _listeners:Object;
		private static var _queuedEvents:Array = [];
		
		private static var _lockPlugin:IPlugin;
		private static var _instream:IInstreamPlayer;

		// These events should be sent immediately to JavaScript
		private static const SYNCHRONOUS_EVENTS:Array = [
			MediaEvent.JWPLAYER_MEDIA_COMPLETE,
			MediaEvent.JWPLAYER_MEDIA_BEFOREPLAY,
			MediaEvent.JWPLAYER_MEDIA_BEFORECOMPLETE,
			PlaylistEvent.JWPLAYER_PLAYLIST_LOADED,
			PlaylistEvent.JWPLAYER_PLAYLIST_ITEM,
			PlayerStateEvent.JWPLAYER_PLAYER_STATE
		];
		
		public static var javaScriptEventLoop:String = null;
		
		public static function callJS(functionName:String, args:*, eventType:String=null):void {
			if (ExternalInterface.available) {
				if (eventType) {
					javaScriptEventLoop = eventType;
				}
				try {
					ExternalInterface.call(functionName, args);
				} catch (error:Error) {
					CONFIG::debugging {
						trace('js error:', error.message);
					}
				}
				javaScriptEventLoop = null;
			}
		}
		
		public static function setPlayer(player:IPlayer):void {
			_listeners = {};
			_lockPlugin = new AbstractPlugin();
			
			_player = player;
			_player.addEventListener(PlayerEvent.JWPLAYER_READY, playerReady);

			setupPlayerListeners();
			setupJSListeners();
			JavascriptInstreamAPI.setupJSListeners();
			
			_player.addGlobalListener(queueEvents);
		}

        public static function setupError(evt:PlayerEvent):void {
            var _setupError:Function = function(timerEvent:TimerEvent):void {
                timerEvent.target.delay = 20;
                if (ExternalInterface.available) {
                    timerEvent.target.stop();
                    // dispatch the translated event to JavaScript
                    _listeners = {};
                    _listeners[evt.type] = ['function(evt){jwplayer("'+evt.id+'").dispatchEvent(evt.type,evt)}'];
                    listenerCallback(evt);
                }
            };
            var timer:Timer = new Timer(1, 5);
            timer.addEventListener(TimerEvent.TIMER_COMPLETE, _setupError);
            timer.start();
        }
		
		/** Delay the response to PlayerReady to allow the external interface to initialize in some browsers **/
		private static function playerReady(evt:PlayerEvent):void {
			var type:String = evt.type;
			var args:Object = {
				id: evt.id,
				client: evt.client,
				version: evt.version
			};
			var ready:Function = function(timerEvent:TimerEvent = null):void {
				if (timerEvent) timerEvent.target.delay = 20;
				if (ExternalInterface.available) {
					if (timerEvent) timerEvent.target.stop();
					_player.removeGlobalListener(queueEvents);
					callJS("jwplayer.playerReady", args, type);
					clearQueuedEvents();
				}
			};
			var timer:Timer = new Timer(0, 5);
			timer.addEventListener(TimerEvent.TIMER_COMPLETE, ready);
			timer.start();
		}

		private static function queueEvents(evt:Event):void {
			_queuedEvents.push(evt);
		}
		
		private static function clearQueuedEvents():void {
			for each (var queuedEvent:Event in _queuedEvents) {
				listenerCallback(queuedEvent);
			}
			_queuedEvents = null;
		}
		
		private static function setupPlayerListeners():void {
			_player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, resetPosition);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, updatePosition);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER, updateBuffer);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_VOLUME, updateVolumeCookie);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_MUTE, updateMuteCookie);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_LEVEL_CHANGED, updateLevelCookie);
			_player.addEventListener(CaptionsEvent.JWPLAYER_CAPTIONS_CHANGED, updateCaptionCookie);
		}
		
		private static function resetPosition(evt:PlaylistEvent):void {
			_playerPosition = 0;
			_playerBuffer = 0;
		}
		
		private static function updatePosition(evt:MediaEvent):void {
			_playerPosition = evt.position;
		}

		private static function updateBuffer(evt:MediaEvent):void {
			_playerBuffer = evt.bufferPercent;
		}
		
		private static function updateVolumeCookie(evt:MediaEvent):void {
			if (!_player.config.mute) {
				callJS("function(vol) { try { jwplayer.utils.saveCookie('volume', vol) } catch(e) {} }", evt.volume.toString());
			}
		}

		private static function updateMuteCookie(evt:MediaEvent):void {
			callJS("function(state) { try { jwplayer.utils.saveCookie('mute', state) } catch(e) {} }", evt.mute.toString());
		}
		
		private static function updateLevelCookie(evt:MediaEvent):void {
			callJS("function(state) { try { jwplayer.utils.saveCookie('qualityLabel', state) } catch(e) {} }", evt.levels[evt.currentQuality].label);
		}
		
		private static function updateCaptionCookie(evt:CaptionsEvent):void {
			callJS("function(state) { try { jwplayer.utils.saveCookie('captionLabel', state) } catch(e) {} }", evt.tracks[evt.currentTrack].label);
		}

		private static function setupJSListeners():void {
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
				ExternalInterface.addCallback("jwSetControls", js_setControls);
				ExternalInterface.addCallback("jwForceState", js_forceState);
				ExternalInterface.addCallback("jwReleaseState", js_releaseState);
				
				
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
				ExternalInterface.addCallback("jwInitInstream", js_initInstream);
				
				// Quality API
				ExternalInterface.addCallback("jwGetQualityLevels", js_getQualityLevels);
				ExternalInterface.addCallback("jwGetCurrentQuality", js_getCurrentQuality);
				ExternalInterface.addCallback("jwSetCurrentQuality", js_setCurrentQuality);

				//Audio Track API
				ExternalInterface.addCallback("jwGetAudioTracks", js_getAudioTracks);
				ExternalInterface.addCallback("jwGetCurrentAudioTrack", js_getCurrentAudioTrack);
				ExternalInterface.addCallback("jwSetCurrentAudioTrack", js_setCurrentAudioTrack);
				
				// Captions API
				ExternalInterface.addCallback("jwGetCaptionsList", js_getCaptionsList);
				ExternalInterface.addCallback("jwGetCurrentCaptions", js_getCurrentCaptions);
				ExternalInterface.addCallback("jwSetCurrentCaptions", js_setCurrentCaptions);
				
				// Ads API
				ExternalInterface.addCallback("jwIsBeforePlay", js_isBeforePlay);
				ExternalInterface.addCallback("jwIsBeforeComplete", js_isBeforeComplete);
				ExternalInterface.addCallback("jwSetCues", js_setCues);
				
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
		
		private static function js_addEventListener(eventType:String, callback:String):void {
			if (!_listeners[eventType]) {
				_listeners[eventType] = [];
				_player.addEventListener(eventType, listenerCallback);
			}
			(_listeners[eventType] as Array).push(callback);
		}
		
		private static function js_removeEventListener(eventType:String, callback:String):void {
			var callbacks:Array = _listeners[eventType];
			if (callbacks) {
				var callIndex:Number = callbacks.indexOf(callback);
				if (callIndex > -1) {
					callbacks.splice(callIndex, 1);
				}
			}
		}
		
		private static function listenerCallback(evt:Event):void {
			var args:Object = {};
			var type:String = evt.type;

			if (evt is JWAdEvent)
				args = listenerCallbackAds(evt as JWAdEvent);
			else if (evt is CaptionsEvent)
				args = listenerCallbackCaptions(evt as CaptionsEvent);
			else if (evt is MediaEvent)
				args = listenerCallbackMedia(evt as MediaEvent);
            else if (evt is TrackEvent)
                args = listenerCallbackTrack(evt as TrackEvent);
			else if (evt is PlayerStateEvent)
				args = listenerCallbackState(evt as PlayerStateEvent);
			else if (evt is PlaylistEvent)
				args = listenerCallbackPlaylist(evt as PlaylistEvent);
			else if (evt is CastEvent) {
				args.available = (evt as CastEvent).available;
				args.active = (evt as CastEvent).active;
			}
			else if (type == ViewEvent.JWPLAYER_CONTROLS)
				args.controls = (evt as ViewEvent).data;
			else if (type == ViewEvent.JWPLAYER_VIEW_TAB_FOCUS)
				args.hasFocus = (evt as ViewEvent).data;
			else if (evt is ViewEvent && (evt as ViewEvent).data != null)
				args.data = JavascriptSerialization.stripDots((evt as ViewEvent).data);
			else if (evt is PlayerEvent) {
				args.message = (evt as PlayerEvent).message;
			}
			args.type = type;
			
			dispatch(type, _listeners[type] as Array, args);
		}

		public static function dispatch(type:String, callbacks:Array, args:Object):void {
			if (callbacks) {
				// Not a great workaround, but the JavaScript API competes with the Controller when dealing with certain events
				var asyncCallbacks:Array = null;
				for each (var call:String in callbacks) {
					if (javaScriptEventLoop === null || SYNCHRONOUS_EVENTS.indexOf(type) > -1) {
						callJS(call, args, type);
					} else {
						if (asyncCallbacks === null) {
							asyncCallbacks = [];
						}
						asyncCallbacks.push(call);
					}
				}
				// delay call to allow all Flash listeners to complete before notifying JavaScript
				if (asyncCallbacks && asyncCallbacks.length > 0) {
					// Identify the event as asynchronous in JavaScript
					args.async = true;
					setTimeout(function():void {
						while (asyncCallbacks.length > 0) {
							callJS(asyncCallbacks.shift(), args, type);
						}
					}, 0);
				}
			}
			
		}
		
		private static function listenerCallbackMedia(evt:MediaEvent):Object {
			var returnObj:Object = {};

			if (evt.bufferPercent >= 0) 		returnObj.bufferPercent = evt.bufferPercent;
			if (evt.duration >= 0)		 		returnObj.duration = evt.duration;
			if (evt.message)					returnObj.message = evt.message;
			if (evt.metadata != null) {
                returnObj.metadata = JavascriptSerialization.stripDots(evt.metadata);
            }
			if (evt.offset > 0)					returnObj.offset = evt.offset;
			if (evt.position >= 0)				returnObj.position = evt.position;
			if (evt.currentQuality >= 0)		returnObj.currentQuality = evt.currentQuality;
			if (evt.levels)						returnObj.levels = evt.levels;
			if (evt.type == MediaEvent.JWPLAYER_MEDIA_MUTE) {
				returnObj.mute = evt.mute;
			}
			if (evt.type == MediaEvent.JWPLAYER_MEDIA_VOLUME) {
				returnObj.volume = evt.volume;
			}
			return returnObj;
		}

        private static function listenerCallbackTrack(evt:TrackEvent):Object {
            return {
                tracks: evt.tracks,
                currentTrack: evt.currentTrack
            };
        }

		private static function listenerCallbackCaptions(evt:CaptionsEvent):Object {
			var returnObj:Object = {};

			if (evt.currentTrack >= 0) {
				returnObj.track = evt.currentTrack;
			}
			if (evt.tracks) {
				returnObj.tracks = evt.tracks;
			}
			return returnObj;
		}
		
		private static function listenerCallbackAds(evt:JWAdEvent):Object {
			var returnObj:Object = {};
			returnObj.tag = evt.tag;
			if (evt.message)    returnObj.message    = evt.message;
			if (evt.duration)   returnObj.duration   = evt.duration;
			if (evt.position)   returnObj.position   = evt.position;
			if (evt.companions) returnObj.companions = evt.companions;
			if (evt.newstate)   returnObj.newstate   = evt.newstate;
			if (evt.oldstate)   returnObj.oldstate   = evt.oldstate;
			return returnObj;
		}
		
		private static function listenerCallbackState(evt:PlayerStateEvent):Object {
			if (evt.type == PlayerStateEvent.JWPLAYER_PLAYER_STATE) {
				return {
					newstate: evt.newstate,
					oldstate: evt.oldstate
				};
			}
			return {};
		}

		private static function listenerCallbackPlaylist(evt:PlaylistEvent):Object {
			if (evt.type == PlaylistEvent.JWPLAYER_PLAYLIST_LOADED) {
				var list:Array = js_getPlaylist();
				return {
					playlist: list
				};
			} else if (evt.type == PlaylistEvent.JWPLAYER_PLAYLIST_ITEM) {
				return {
					index: _player.playlist.currentIndex
				};
			}
			return {};
		}


		/***********************************************
		 **                 GETTERS                   **
		 ***********************************************/
		
		// private static function js_getBandwidth():Number {
		// 	return _player.config.bandwidth;
		// }

		private static function js_getBuffer():Number {
			return _playerBuffer;
		}
		
		private static function js_getDuration():Number {
			return _player.playlist.currentItem ? _player.playlist.currentItem.duration : 0;
		}
		
		private static function js_getFullscreen():Boolean {
			return _player.config.fullscreen;
		}

		private static function js_getHeight():Number {
			return RootReference.stage.stageHeight;
		}
		
		// private static function js_getLevel():Number {
		// 	return _player.playlist.currentItem ? _player.playlist.currentItem.currentLevel : 0;
		// }
		
		// private static function js_getLockState():Boolean {
		// 	return _player.locked;
		// }
		
		private static function js_getMute():Boolean {
			return _player.config.mute;
		}
		
		private static function js_getPlaylist():Array {
			var playlistArray:Array = JavascriptSerialization.playlistToArray(_player.playlist);
			for (var i:Number=0; i < playlistArray.length; i++) {
				playlistArray[i] = JavascriptSerialization.stripDots(playlistArray[i]);
			}
			return playlistArray; 
		}

		
		private static function js_getPlaylistIndex():Number {
			return _player.playlist.currentIndex; 
		}
		
		
		private static function js_getPosition():Number {
			return _playerPosition;
		}
		
		private static function js_getState():String {
			return _player.state;
		}

		private static function js_getWidth():Number {
			return RootReference.stage.stageWidth;
		}

		private static function js_getVersion():String {
			return _player.version;
		}

		private static function js_getVolume():Number {
			return _player.config.volume;
		}

		private static function js_getStretching():String {
			return _player.config.stretching;
		}

		/***********************************************
		 **                 PLAYBACK                  **
		 ***********************************************/

		private static function js_dockAddButton(icon:String, label:String, click:String, id:String):void {
            try {
                _player.controls.dock.addButton(icon, label, click, id);
            } catch(e:Error){}
		};
		private static function js_dockRemoveButton(id:String):void {
			_player.controls.dock.removeButton(id);
		};
	
		private static function js_play(playstate:*=null):void {
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
		
		
		private static function js_pause(playstate:*=null):void {
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
		
		private static function playToggle():void {
			if (_player.state == PlayerState.IDLE || _player.state == PlayerState.PAUSED) {
				_player.play();
			} else {
				_player.pause();
			}
		}
		
		private static function js_stop():void {
			_player.stop();
		}

		private static function js_seek(position:Number=0):void {
			_player.seek(position);
		}
		
		private static function js_load(toLoad:*):void {
			_player.load(toLoad);
		}
		
		private static function js_playlistItem(item:Number):void {
			_player.playlistItem(item);
		}

		private static function js_playlistNext():void {
			_player.playlistNext();
		}

		private static function js_playlistPrev():void {
			_player.playlistPrev();
		}

		private static function js_mute(mutestate:*=null):void {
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

		private static function js_volume(volume:Number):void {
			_player.volume(volume);
		}

		private static function js_fullscreen(fullscreenstate:*=null):void {
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
		
		private static function js_forceState(state:String):void {
			_player.controls.display.forceState(state);
		}
		
		private static function js_releaseState():void {
			
			_player.controls.display.releaseState();
		}
		
		private static function js_initInstream():void {
			if (_instream) {
				_instream.destroy();
			}
			_instream = _player.setupInstream(_lockPlugin);
			_instream.addEventListener(InstreamEvent.JWPLAYER_INSTREAM_DESTROYED, function(evt:Event):void {
				_instream = null;
			}
			);
			_instream.init();
			JavascriptInstreamAPI.setPlayer(_instream as InstreamPlayer);
		}
		
		private static function setComponentVisibility(component:IPlayerComponent, state:Boolean):void {
			state ? component.show() : component.hide();
		}

		private static function js_showControlbar():void {
			setComponentVisibility(_player.controls.controlbar, true);
		}
		
		private static function js_hideControlbar():void {
			setComponentVisibility(_player.controls.controlbar, false);
		}

		private static function js_showDock():void {
			setComponentVisibility(_player.controls.dock, true);
		}
		
		private static function js_hideDock():void {
			setComponentVisibility(_player.controls.dock, false);
		}

		private static function js_showDisplay():void {
			setComponentVisibility(_player.controls.display, true);
		}
		
		private static function js_hideDisplay():void {
			setComponentVisibility(_player.controls.display, false);
		}

		private static function js_getQualityLevels():Array {
			return _player.getQualityLevels();
		}
		
		private static function js_getCurrentQuality():Number {
			return _player.getCurrentQuality();
		}
		
		private static function js_setCurrentQuality(index:Number):void {
			_player.setCurrentQuality(index);	
		}
		
		private static function js_getAudioTracks():Array {
			return _player.getAudioTracks();
		}
		
		private static function js_getCurrentAudioTrack():Number {
			return _player.getCurrentAudioTrack();
		}
		
		private static function js_setCurrentAudioTrack(index:Number):void {
			_player.setCurrentAudioTrack(index);	
		}

		private static function js_getCaptionsList():Array {
			return _player.getCaptionsList();
		}
		
		private static function js_getCurrentCaptions():Number {
			return _player.getCurrentCaptions();
		}
		
		private static function js_setCurrentCaptions(index:Number):void {
			_player.setCurrentCaptions(index);	
		}
		
		private static function js_getControls():Boolean {
			return _player.getControls();
		}

		private static function js_getSafeRegion(includeCB:Boolean = true):Object {
			return JavascriptSerialization.rectangleToObject(_player.getSafeRegion(includeCB));
		}
		
		private static function js_setControls(state:Boolean):void {
			_player.setControls(state);
			if (_instream) _instream.setControls(state);
		}
		
		private static function js_isBeforePlay():Boolean {
			return _player.checkBeforePlay();
		}
		
		private static function js_isBeforeComplete():Boolean {
			return _player.checkBeforeComplete();
		}

		private static function js_setCues(cues:Array):void {
			_player.setCues(cues);
		}
	}
}
