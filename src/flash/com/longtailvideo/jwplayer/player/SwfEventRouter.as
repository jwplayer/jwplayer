package com.longtailvideo.jwplayer.player {
import com.longtailvideo.jwplayer.utils.SimpleEvents;

import flash.external.ExternalInterface;

public class SwfEventRouter {

    /**
     * After ExternalInterface.available
     * Add a single callback for all messages sent from the browser
     */

    static private var _initialized:Boolean;

    static public function get available():Boolean {
        if (ExternalInterface.available) {
            if (!_initialized) {
                // ExternalInterface.marshallExceptions = true;
                try {
                    ExternalInterface.addCallback('__externalCall', _externalJsEvent);
                    _initialized = true;
                } catch(err:Error) {
                    // ExternalInterface calls can fail when swf is removed during ActionScript execution
                    trace(err);
                }

            }
            return true;
        }
        return false;
    }

    /**
     * Use SimpleEvents for event handling from JS
     * This way the interface looks the same in AS3 as in JavaScript
     * Any instance in the Flash app can add and remove callbacks,
     * without additional methods added to the swf element
     */

    static private var _jsEvents:SimpleEvents = new SimpleEvents();

    static private function _externalJsEvent(name:String, json:String = null):void {
        var args:Array = null;
        if (json) {
            args = JSON.parse(json) as Array;
        }
        if (args && args.length) {
            args.unshift(name);
            _jsEvents.trigger.apply(_jsEvents, args);
        } else {
            _jsEvents.trigger(name);
        }
    }

    static public function trigger(args:Array):SimpleEvents {
        return _jsEvents.trigger.apply(_jsEvents, args);
    }

    static public function on(name:String, callback:Function):SimpleEvents {
        return _jsEvents.on(name, callback);
    }

    static public function off(name:String = null, callback:Function = null):SimpleEvents {
        return _jsEvents.off(name, callback);
    }

    /**
     * SwfEventRouter.triggerJsEvent() will fire a backbone event on the swf element
     * Any instance in the Flash app can fire an event
     *
     * Since Sprites cannot dispatch events of the same type as native events, we need
     * to prefix some events like "error" with "jw-". These are renamed before triggering.
     */

    static private var _sendScript:XML = <script><![CDATA[
function(id, name, json) {
    var swf = document.getElementById(id);
    if (swf && typeof swf.trigger === 'function') {
        return swf.trigger(name, json);
    }
}]]></script>;

    static public function triggerJsEvent(name:String, data:Object = null):void {
        var id:String = ExternalInterface.objectID;
        if (ExternalInterface.available) {
            var json:String;
            if (data !== null) {
                try {
                    if (data is String || data is Number) {
                        // do nothing
                    } else if ('toJsObject' in data && data.toJsObject is Function) {
                        data = data.toJsObject();
                    } else if ('clone' in data && data.clone is Function) {
                        // event object targets often have Cyclic structure
                        data = data.clone();
                        delete data.target;
                        delete data.currentTarget;
                    }
                    json = encodeURIComponent(JSON.stringify(data));
                } catch(err:Error) {
                    trace(err);
                }
            }
            try {
                ExternalInterface.call(_sendScript, id, name, json);
            } catch(err:Error) {
                trace(err);
            }
            return;
        }
        trace('Could not dispatch event "' + id + '":', name, json);
    }

    static public function error(code:int, message:String):void {
        SwfEventRouter.triggerJsEvent('error', {
            code: code,
            message: message
        });
    }

    static private var _consoleLog:XML = <script><![CDATA[
function() {
    if (typeof console.log === 'object') {
        console.log(Array.prototype.slice.call(arguments, 0));
        return;
    }
    console.log.apply(console, arguments);
}]]></script>;

    static public function consoleLog(...args):void {
        trace.apply(null, ['<<'].concat(args));
        if (ExternalInterface.available) {
            try {
                ExternalInterface.call.apply(null, [_consoleLog].concat(args));
            } catch(err:Error) {
                trace(err);
            }
        }
    }

}
}
