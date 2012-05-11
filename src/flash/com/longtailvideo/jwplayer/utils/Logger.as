package com.longtailvideo.jwplayer.utils {
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	
	import flash.events.AsyncErrorEvent;
	import flash.events.Event;
	import flash.events.SecurityErrorEvent;
	import flash.events.StatusEvent;
	import flash.external.ExternalInterface;
	import flash.net.LocalConnection;
	
	
	/**
	 * <p>Utility class for logging debug messages. It supports the following logging systems:</p>
	 * <ul>
	 * <li>The standalone Arthropod AIR application.</li>
	 * <li>The Console.log function built into Firefox/Firebug.</li>
	 * <li>The tracing sstem built into the debugging players.</li>
	 * </ul>
	 *
	 **/
	public class Logger {
		/** Constant defining the Arthropod output type. **/
		public static const ARTHROPOD:String = "arthropod";
		/** LocalConnection instance arthropod use. **/
		private static const CONNECTION:LocalConnection = new LocalConnection();
		/** Arthropod connection name. **/
		private static const CONNECTION_NAME:String = 'app#com.carlcalderon.Arthropod.161E714B6C1A76DE7B9865F88B32FCCE8FABA7B5.1:arthropod';
		/** Constant defining the Firefox/Firebug console output type. **/
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
				case ARTHROPOD:
					try {
						CONNECTION.send(CONNECTION_NAME, 'debug', 'CDC309AF', text,	0xCCCCCC);
					} catch(e:Error) {
						trace(text);					
					}
					break;
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
				default:
					if (ExternalInterface.available) {
						ExternalInterface.call(_config.debug, text);
					}
					break;
			}
		}
		
		public static function setConfig(config:PlayerConfig):void {
			_config = config;
		}
		
		CONNECTION.addEventListener(AsyncErrorEvent.ASYNC_ERROR, localConnectionEventHandler);
		CONNECTION.addEventListener(SecurityErrorEvent.SECURITY_ERROR, localConnectionEventHandler);
		CONNECTION.addEventListener(StatusEvent.STATUS, localConnectionEventHandler);
		
		/**
		 * Handle LocalConnection events 
		 **/
		private static function localConnectionEventHandler(evt:Event):void{
		}
	}
}