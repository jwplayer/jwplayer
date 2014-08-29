package com.longtailvideo.jwplayer.player {
	import com.longtailvideo.jwplayer.events.InstreamEvent;
	import com.longtailvideo.jwplayer.events.JWAdEvent;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
	import com.longtailvideo.jwplayer.utils.JavascriptSerialization;
	import com.longtailvideo.jwplayer.utils.Logger;
	
	import flash.events.Event;
	import flash.external.ExternalInterface;
	
	public class JavascriptInstreamAPI {
		
		private static var _isPlayer:InstreamPlayer;
		
		public static function setPlayer(isplayer:InstreamPlayer):void {
			_destroyInstreamPlayer(_isPlayer);
			_isPlayer = isplayer;
			_isPlayer.addEventListener(InstreamEvent.JWPLAYER_INSTREAM_DESTROYED, instreamDestroyed);
		}
		
		private static function instreamDestroyed(evt:InstreamEvent):void {
			_destroyInstreamPlayer(evt.currentTarget as InstreamPlayer);
		}
		
		private static function _destroyInstreamPlayer(isplayer:InstreamPlayer):void {
			if (!isplayer) return;
			isplayer.removeEventListener(InstreamEvent.JWPLAYER_INSTREAM_DESTROYED, instreamDestroyed);
			for each (var eventType:String in isplayer.jsListeners) {
				isplayer.removeEventListener(eventType, listenerCallback);
			}
			if (isplayer === _isPlayer) {
				isplayer.jsListeners = {};
				_isPlayer = null;
			}
		}
		
		public static function setupJSListeners():void {
			try {
				ExternalInterface.addCallback("jwLoadItemInstream", js_loadItemInstream);
				ExternalInterface.addCallback("jwLoadArrayInstream", js_loadArrayInstream);
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
				ExternalInterface.addCallback("jwInstreamState", js_state);
				
				// Instream API
				ExternalInterface.addCallback("jwInstreamDestroy", js_destroyInstream);
				ExternalInterface.addCallback("jwInstreamSetText", js_setText);
				ExternalInterface.addCallback("jwInstreamClick", js_setClick);
				ExternalInterface.addCallback("jwInstreamHide", js_hideInstream);
				
				
			} catch(e:Error) {
				Logger.log("Could not initialize Instream JavaScript API: "  + e.message);
			}
			
		}

		
		/***********************************************
		 **              EVENT LISTENERS              **
		 ***********************************************/
		
		private static function js_loadItemInstream(item:Object, options:Object):void {
			if (!_isPlayer) {
				throw(new Error('Instream player undefined'));
			}
			_isPlayer.loadItem(item, options);
		}
		
		private static function js_loadArrayInstream(items:Array, options:Array):void {
			if (!_isPlayer) {
				throw(new Error('Instream player undefined'));
			}
			_isPlayer.loadArray(items, options);
		}
		
		private static function js_addEventListener(eventType:String, callback:String):void {
			if (!_isPlayer) return;
			
			if (!_isPlayer.jsListeners[eventType]) {
				_isPlayer.jsListeners[eventType] = [];
				_isPlayer.addEventListener(eventType, listenerCallback);
			}
			(_isPlayer.jsListeners[eventType] as Array).push(callback);
		}
		
		private static function js_removeEventListener(eventType:String, callback:String):void {
			if (!_isPlayer) return;
			_isPlayer.removeEventListener(eventType, listenerCallback);
			
			var callbacks:Array = _isPlayer.jsListeners[eventType];
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

			if (evt is MediaEvent)
				args = listenerCallbackMedia(evt as MediaEvent);
			else if (evt is JWAdEvent) 
				args = listenerCallbackAds(evt as JWAdEvent);
			else if (evt is PlayerStateEvent)
				args = listenerCallbackState(evt as PlayerStateEvent);
			else if (evt is InstreamEvent)
				args = listenerCallbackInstream(evt as InstreamEvent);
			else if (evt is PlaylistEvent) {
				args = listenerCallbackPlaylist(evt as PlaylistEvent);
			}
			else if (evt is PlayerEvent) {
				args = { message: (evt as PlayerEvent).message };
			} 
			args.type = type;

			JavascriptAPI.dispatch(type, _isPlayer.jsListeners[type] as Array, args);
		}
		
		private static function listenerCallbackMedia(evt:MediaEvent):Object {
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
		
		
		private static function listenerCallbackAds(evt:JWAdEvent):Object {
			var returnObj:Object = {};
			
			if (evt.totalAds) 					returnObj.totalAds = evt.totalAds;
			if (evt.currentAd)		 		    returnObj.currentAd = evt.currentAd;
			if (evt.tag)						returnObj.tag = evt.tag;
			return returnObj;
		}
		
		
		private static function listenerCallbackState(evt:PlayerStateEvent):Object {
			if (evt.type == PlayerStateEvent.JWPLAYER_PLAYER_STATE) {
				return { newstate: evt.newstate, oldstate: evt.oldstate };
			} else return {};
		}

		private static function listenerCallbackInstream(evt:InstreamEvent):Object {
			if (evt.type == InstreamEvent.JWPLAYER_INSTREAM_DESTROYED) {
				return { destroyedReason: evt.destroyedReason };
			} else if (evt.type == InstreamEvent.JWPLAYER_INSTREAM_CLICKED) {
				return { hasControls: evt.hasControls };
			} 
			return {};
		}

		private static function listenerCallbackPlaylist(evt:PlaylistEvent):Object {
			 if (evt.type == PlaylistEvent.JWPLAYER_PLAYLIST_ITEM) {
				return { index: _isPlayer.getIndex() };
			} else return {};
		}
		/***********************************************
		 **                 GETTERS                   **
		 ***********************************************/
		
		private static function js_getDuration():Number {
			if (!_isPlayer) return -1;
			else return _isPlayer.getPosition();
		}
		
		
		private static function js_getPosition():Number {
			if (!_isPlayer) return -1;
			else return _isPlayer.getDuration();
		}
		
		private static function js_getState():String {
			if (!_isPlayer) return "";
			else return _isPlayer.getState();
		}

		/***********************************************
		 **                 PLAYBACK                  **
		 ***********************************************/

		private static function js_play(playstate:*=null):void {
			if (!_isPlayer) return;
			doPlay(playstate);
		}
		
		private static function doPlay(playstate:*=null):void {
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
		
		
		private static function js_pause(playstate:*=null):void {
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
		
		private static function playToggle():void {
			if (_isPlayer.getState() == PlayerState.IDLE || _isPlayer.getState() == PlayerState.PAUSED) {
				_isPlayer.play();
			} else {
				_isPlayer.pause();
			}
		}
		
		private static function js_seek(position:Number=0):void {
			if (!_isPlayer) return;
			
			_isPlayer.seek(position);
		}
		
		private static function js_destroyInstream():void {
			if (!_isPlayer) return;
			_isPlayer.destroy();
		}

		private static function js_setText(text:String=""):void {
			if (!_isPlayer) return;
			
			_isPlayer.setText(text);
		}
		
		private static function js_state():String {
			if (!_isPlayer) return PlayerState.IDLE;
			return _isPlayer.getState();
		}
		
		private static function js_setClick(url:String):void {
			if (!_isPlayer) return;
			_isPlayer.setClick(url);
		}
		
		private static function js_hideInstream():void {
			if (!_isPlayer) return;
			_isPlayer.hide();
		}
		
	}
}
