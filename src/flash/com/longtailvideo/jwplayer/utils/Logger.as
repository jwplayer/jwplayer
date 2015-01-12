package com.longtailvideo.jwplayer.utils {
import com.longtailvideo.jwplayer.model.PlayerConfig;

import flash.events.Event;

import flash.external.ExternalInterface;

/**
	 * <p>Utility class for logging debug messages. It supports the following logging systems:</p>
	 * <ul>
	 * <li>The Console.log function built into Firefox/Firebug.</li>
	 * <li>The tracing sstem built into the debugging players.</li>
	 * </ul>
	 *
	 **/
	public class Logger {
		public static const CONSOLE:String = "console";
		/** Constant defining there's no output. **/
		public static const NONE:String = "none";
		/** Constant defining the Flash tracing output type. **/
		public static const TRACE:String = "trace";
		
		/** Reference to the player config **/
		private static var _config:PlayerConfig;
		/** filter stuff **/
		private static var _filter:RegExp;
		
		/**
		 * Log a message to the output system.
		 *
		 * @param message	The message to send forward. Arrays and objects are automatically chopped up.
		 * @param type		The type of message; is capitalized and encapsulates the message.
		 **/
		public static function log(message:*, type:String = "log"):void {
			type = type.toUpperCase();
			if (message == undefined) {
				send(type);
			} else if (message is String) {
				send(type + ' (' + message + ')');
			} else if (message is Boolean || message is Number || message is Array) {
				send(type + ' (' + message.toString() + ')');
			} else {
				send(type + ' (' + Strings.print_r(message) + ')');
			}
		}

		/**
		 *
		 * Only convert event to string if logging is active
		 * @param event
		 */
		public static function logEvent(event:Event):void {
			var debug:String = mode;
			if (debug === CONSOLE || debug === TRACE) {
				log(event.toString(), event.type);
			}
		}

		public static function set filter(pattern:String):void {
			if (pattern.length) {
				_filter = new RegExp(pattern, "ig");
			} else {
				_filter = null;
			}
		}
		
		/** Send the messages to the output system. **/
		private static function send(text:String):void {
			if (_filter && !_filter.test(text)) {
				return;
			}
			var debug:String = mode;
			if (debug === CONSOLE) {
				try{
					if (ExternalInterface.available) {
						ExternalInterface.call('console.log', text);
					}
				} catch (err:Error){}
			} else if (debug === TRACE) {
				trace(text);
			}
		}
		
		public static function setConfig(config:PlayerConfig):void {
			_config = config;
		}

		private static function get mode():String {
			return _config ? _config.debug : TRACE;
		}
	}
}