package com.longtailvideo.jwplayer.utils {
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	
	import flash.events.AsyncErrorEvent;
	import flash.events.Event;
	import flash.events.SecurityErrorEvent;
	import flash.events.StatusEvent;
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
		
		
		/**
		 * Log a message to the output system.
		 *
		 * @param message	The message to send forward. Arrays and objects are automatically chopped up.
		 * @param type		The type of message; is capitalized and encapsulates the message.
		 **/
		public static function log(message:*, type:String = "log"):void {
			try{
				if (message == undefined) {
					send(type.toUpperCase());
				} else if (message is String) {
					send(type.toUpperCase() + ' (' + message + ')');
				} else if (message is Boolean || message is Number || message is Array) {
					send(type.toUpperCase() + ' (' + message.toString() + ')');
				} else {
					Logger.object(message, type);
				}
			} catch (err:Error){
				trace(message);
			}
		}
		
		
		/** Explode an object for logging. **/
		private static function object(message:Object, type:String):void {
			var txt:String = type.toUpperCase() + ' (';
			Strings.print_r(message);
			txt += ')';
			Logger.send(txt);
		}
		
		/** Send the messages to the output system. **/
		private static function send(text:String):void {
			var debug:String = _config ? _config.debug : TRACE;
			switch (debug) {
				case CONSOLE:
					if (ExternalInterface.available) {
						ExternalInterface.call('console.log', text);
					}
					break;
				case TRACE:
					trace(text);
					break;
				case NONE:
					break;
			}
		}
		
		public static function setConfig(config:PlayerConfig):void {
			_config = config;
		}
	}
}