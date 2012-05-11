package com.longtailvideo.jwplayer.player {
	import com.longtailvideo.jwplayer.events.InstreamEvent;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.model.IInstreamOptions;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.utils.JavascriptSerialization;
	import com.longtailvideo.jwplayer.utils.Logger;
	
	import flash.events.Event;
	import flash.external.ExternalInterface;
	import flash.utils.setTimeout;
	
	public class JavascriptInstreamAPI {
		
		protected var _isPlayer:IInstreamPlayer;
		protected var _isOptions:IInstreamOptions;
		protected var _listeners:Object = {};
		protected var _player:IPlayer;
		protected var _lockPlugin:IPlugin;
		protected var _lockedPlayer:Boolean = false;
		
		public function JavascriptInstreamAPI(isplayer:IInstreamPlayer, options:IInstreamOptions, player:IPlayer, lockPlugin:IPlugin) {
			_isPlayer = isplayer;
			_isOptions = options;
			_player = player;
			_lockPlugin = lockPlugin;

			setupPlayerListeners();
			setupJSListeners();
			
		}
		
		protected function setupPlayerListeners():void {
			_isPlayer.addEventListener(InstreamEvent.JWPLAYER_INSTREAM_DESTROYED, instreamDestroyed);
		}
		
		protected function instreamDestroyed(evt:InstreamEvent):void {
			setTimeout(function():void {
				_listeners = {};
				_isPlayer = null;
			}, 0);
		}
		
		protected function setupJSListeners():void {
			try {
				// Event handlers
				ExternalInterface.addCallback("jwInstreamAddEventListener", js_addEventListener);
				ExternalInterface.addCallback("jwInstreamRemoveEventListener", js_removeEventListener);
				
				// Getters
				ExternalInterface.addCallback("jwInstreamGetState", js_getState);
				ExternalInterface.addCallback("jwInstreamGetDuration", js_getDuration);
				ExternalInterface.addCallback("jwInstreamGetPosition", js_getPosition);

				// Player API Calls
				ExternalInterface.addCallback("jwInstreamPlay", js_play);
				ExternalInterface.addCallback("jwInstreamPause", js_pause);
				ExternalInterface.addCallback("jwInstreamSeek", js_seek);
				
				// Instream API
				ExternalInterface.addCallback("jwInstreamDestroy", js_destroyInstream);
				
			} catch(e:Error) {
				Logger.log("Could not initialize Instream JavaScript API: "  + e.message);
			}
			
		}

		
		/***********************************************
		 **              EVENT LISTENERS              **
		 ***********************************************/
		
		protected function js_addEventListener(eventType:String, callback:String):void {
			if (!_isPlayer) return;
			
			if (!_listeners[eventType]) {
				_listeners[eventType] = [];
				_isPlayer.addEventListener(eventType, listenerCallback);
			}
			(_listeners[eventType] as Array).push(callback);
		}
		
		protected function js_removeEventListener(eventType:String, callback:String):void {
			if (!_isPlayer) return;
			
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
			
			if (evt is MediaEvent)
				args = listenerCallbackMedia(evt as MediaEvent);
			else if (evt is PlayerStateEvent)
				args = listenerCallbackState(evt as PlayerStateEvent);
			else if (evt is InstreamEvent)
				args = listenerCallbackInstream(evt as InstreamEvent);
			else if (evt is PlayerEvent) {
				args = { message: (evt as PlayerEvent).message };
			}
			
			args.type = evt.type;
			var callbacks:Array = _listeners[evt.type] as Array;
			
			
			if (callbacks) {
				for each (var call:String in callbacks) {
					// Not a great workaround, but the JavaScript API competes with the Controller when dealing with certain events
					if (evt.type == MediaEvent.JWPLAYER_MEDIA_COMPLETE) {
						ExternalInterface.call(call, args);
					} else {
						//Insert 1ms delay to allow all Flash listeners to complete before notifying JavaScript
						setTimeout(function():void {
							ExternalInterface.call(call, args);
						}, 0);
					}
				}
			}
			
		}
		
		
		protected function listenerCallbackMedia(evt:MediaEvent):Object {
			var returnObj:Object = {};

			if (evt.bufferPercent >= 0) 		returnObj.bufferPercent = evt.bufferPercent;
			if (evt.duration >= 0)		 		returnObj.duration = evt.duration;
			if (evt.message)					returnObj.message = evt.message;
			if (evt.metadata != null)	 		returnObj.metadata = JavascriptSerialization.stripDots(evt.metadata);
			if (evt.offset > 0)					returnObj.offset = evt.offset;
			if (evt.position >= 0)				returnObj.position = evt.position;

			if (evt.type == MediaEvent.JWPLAYER_MEDIA_MUTE)
				returnObj.mute = evt.mute;
			
			if (evt.type == MediaEvent.JWPLAYER_MEDIA_VOLUME)
				returnObj.volume = evt.volume;

			return returnObj;
		}
		
		
		protected function listenerCallbackState(evt:PlayerStateEvent):Object {
			if (evt.type == PlayerStateEvent.JWPLAYER_PLAYER_STATE) {
				return { newstate: evt.newstate, oldstate: evt.oldstate };
			} else return {};
		}

		protected function listenerCallbackInstream(evt:InstreamEvent):Object {
			if (evt.type == InstreamEvent.JWPLAYER_INSTREAM_DESTROYED) {
				return {
					destroyedReason: evt.destroyedReason
				}
			} else return {};
		}


		/***********************************************
		 **                 GETTERS                   **
		 ***********************************************/
		
		protected function js_getDuration():Number {
			if (!_isPlayer) return -1;
			else return _isPlayer.getPosition();
		}
		
		
		protected function js_getPosition():Number {
			if (!_isPlayer) return -1;
			else return _isPlayer.getDuration();
		}
		
		protected function js_getState():String {
			if (!_isPlayer) return "";
			else return _isPlayer.getState();
		}

		/***********************************************
		 **                 PLAYBACK                  **
		 ***********************************************/

		protected function js_play(playstate:*=null):void {
			if (!_isPlayer) return;

			if (_isOptions.autoload && !_lockedPlayer) {
				_lockedPlayer = true;
				_player.lock(_lockPlugin, function():void {
					doPlay(playstate);
				});
			} else {
				doPlay(playstate);
			}
		}
		
		protected function doPlay(playstate:*=null):void {
			if (playstate == null){
				playToggle();
			} else {
				if (String(playstate).toLowerCase() == "true"){
					_isPlayer.play();
				} else {
					_isPlayer.pause();
				}
			}
		}
		
		
		protected function js_pause(playstate:*=null):void {
			if (!_isPlayer) return;
			
			if (playstate == null){
				playToggle();
			} else {
				if (String(playstate).toLowerCase() == "true"){
					_isPlayer.pause();
				} else {
					_isPlayer.play();	
				}
			}
		}
		
		protected function playToggle():void {
			if (_isPlayer.getState() == PlayerState.IDLE || _isPlayer.getState() == PlayerState.PAUSED) {
				_isPlayer.play();
			} else {
				_isPlayer.pause();
			}
		}
		
		protected function js_seek(position:Number=0):void {
			if (!_isPlayer) return;
			
			_isPlayer.seek(position);
		}
		
		protected function js_destroyInstream():void {
			if (!_isPlayer) return;
			
			_isPlayer.destroy();
		}

		
	}

}