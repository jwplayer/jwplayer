package com.longtailvideo.jwplayer.utils {
	import com.longtailvideo.jwplayer.player.PlayerVersion;
	
	import flash.events.*;
	import flash.external.ExternalInterface;
	import flash.net.SharedObject;
	import flash.system.Security;

	/**
	 * Sent when the configuration block has been successfully retrieved
	 *
	 * @eventType flash.events.Event.COMPLETE
	 */
	[Event(name="complete", type = "flash.events.Event")]

	/**
	 * Sent when an error in the config has
	 *
	 * @eventType flash.events.ErrorEvent.ERROR
	 */
	[Event(name="error", type = "flash.events.ErrorEvent")]

	public class Configger extends EventDispatcher {
		private var _config:Object = {};

		/** The loaded config object; must be a hash map (XML configuration no longer supported). **/
		public function get config():Object {
			return _config;
		}

		/**
		 * @return
		 * @throws Error if something bad happens.
		 */
		public function loadConfig():void {
			loadCookies();
			//loadFlashvars(RootReference.root.loaderInfo.parameters);
			loadExternal();
		}

		/**
		 * Loads configuration flashvars
		 * @param params Hash map containing key/value pairs
		 */
		public function loadFlashvars(params:Object):void {
			try {
				for (var param:String in params) {
					setConfigParam(param, params[param]);
				}
				dispatchEvent(new Event(Event.COMPLETE));
			} catch (e:Error) {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, e.message));
			}
		
		}

		/**
		 * Loads configuration from JW Embedder
		 **/
		private function loadExternal():void {
			if (ExternalInterface.available) {
				try {
					var flashvars:Object = ExternalInterface.call("jwplayer.embed.flash.getVars", ExternalInterface.objectID);
					if (flashvars !== null) {
						// TODO: add ability to pass in JSON directly instead of going to/from a string
						for (var param:String in flashvars) {
							setConfigParam(param, flashvars[param]);
						}
						dispatchEvent(new Event(Event.COMPLETE));
						return;
					}
				} catch (e:Error) {}
			}
			if (Security.sandboxType == Security.LOCAL_WITH_FILE) {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error loading player: Offline playback not supported"));
			} else {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error loading player: Could not load player configuration"));
			}
		}

		public static function saveCookie(param:String, value:*):void {
			try {
				var cookie:SharedObject = SharedObject.getLocal('com.longtailvideo.jwplayer','/');
				cookie.data[param] = value;
				cookie.flush();
			} catch (err:Error) {}
		}

		private function loadCookies():void {
			try {
				var cookie:SharedObject = SharedObject.getLocal('com.longtailvideo.jwplayer','/');
				writeCookieData(cookie.data);
			} catch (err:Error) {}
		}

		/** Overwrite cookie data. **/ 
		private function writeCookieData(obj:Object):void {
			for (var cfv:String in obj) {
				setConfigParam(cfv.toLowerCase(), obj[cfv]); 
			}
		}

		private function setConfigParam(name:String, value:String):void {
			if (name != "fullscreen") {
				_config[name.toLowerCase()] = Strings.serialize(Strings.trim(value));
			}
		}

	}
}