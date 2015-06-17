package com.longtailvideo.jwplayer.utils {
import com.longtailvideo.jwplayer.model.PlayerConfig;
import com.longtailvideo.jwplayer.player.SwfEventRouter;

import flash.events.Event;

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


    private static function get mode():String {
        if (_config && _config.debug) {
            return CONSOLE;
        }
        if (CONFIG::debugging) {
            return TRACE;
        }
        return NONE;
    }

    /**
     * Log a message to the output system.
     *
     * @param message    The message to send forward. Arrays and objects are automatically chopped up.
     * @param type        The type of message; is capitalized and encapsulates the message.
     **/
    public static function log(message:*, type:String = "[flash.swf]"):void {
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

    public static function setConfig(config:PlayerConfig):void {
        _config = config;
    }

    /** Send the messages to the output system. **/
    private static function send(text:String):void {
        var debug:String = mode;
        if (debug === CONSOLE) {
            SwfEventRouter.consoleLog(text);
        } else if (debug === TRACE) {
            trace(text);
        }
    }

    /**
     *
     * Only convert event to string if logging is active
     * @param event
     */
    public static function logEvent(event:Event):void {
        var debug:String = mode;
        if (debug === CONSOLE) {
            SwfEventRouter.consoleLog(event.type, event.toString());
        } else if (debug === TRACE) {
            trace(event.type, event.toString());
        }
    }
}
}