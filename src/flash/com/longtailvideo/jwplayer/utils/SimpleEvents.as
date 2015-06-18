package com.longtailvideo.jwplayer.utils {
import com.longtailvideo.jwplayer.player.SwfEventRouter;

/**
 * AS3 event handling based on backbone.Events
 */
public class SimpleEvents {

    private var _events:Object;

    public function SimpleEvents() {}

    public function trigger(name:String, ...args):SimpleEvents {
        if (!_events) {
            return this;
        }
        var events:Vector.<Function> = _events[name];
        if (!events) {
            CONFIG::debugging {
                SwfEventRouter.consoleLog('unregistered event triggered:', name);
            }
            return this;
        }
        // trigger events
        var handler:Function;
        var i:int = -1;
        var len:uint = events.length;
        while (++i < len) {
            handler = events[i];
            handler.apply(NaN, args);
        }
        return this;
    }

    public function on(name:String, callback:Function):SimpleEvents {
        if (!_events) {
            _events = {};
        }
        var events:Vector.<Function> = _events[name] || (_events[name] = new <Function>[]);
        events.push(callback);
        return this;
    }

    public function off(name:String = null, callback:Function = null):SimpleEvents {
        if (!_events) {
            return this;
        }
        if (!name && callback === null) {
            _events = null;
            return this;
        }
        var events:Vector.<Function> = _events[name];
        var retain:Vector.<Function>;
        if (events) {
            _events[name] = retain = new <Function>[];
            if (callback is Function) {
                for (var i:uint = 0, len:uint = events.length; i < len; i++) {
                    var handler:Function = events[i];
                    if (callback !== handler) {
                        retain.push(handler);
                    }
                }
            }
            if (!retain.length) {
                delete _events[name];
            }
        }
        return this;
    }
}
}
