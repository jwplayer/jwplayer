package com.longtailvideo.jwplayer.utils {
public class Utils {

    //public function Utils() { }

    public static function extend(obj:Object, ...args):Object {
        for(var i:uint =0; i < args.length; i++) {
            var source:Object = args[i];
            if (source) {
                for (var key:String in source) {
                    obj[key] = source[key];
                }
            }
        }
        return obj;
    }

    // Return a copy of the object containing only whitelisted properties
    public static function pick(obj:Object, arr:Array):Object {
        var copy:Object = {};

        for(var i:uint =0; i < arr.length; i++) {
            var key:String = arr[i];
            if (key in obj) {
                copy[key] = obj[key];
            }
        }
        return copy;
    }

    /**
     * Append the second Vector to the first
     *   This is an optimization for use cases when we want to
     *   incrementally build a vector as data comes in
     *
     *   Note: This will cause a runtime error if used on vectors of
     *         different types
     *
     * @param originalVector
     * @param append
     */
    public static function pushAll(a:Vector.<*>,  b:Vector.<*>):uint {
        for(var i:uint = 0; i < b.length; i++) {
            a.push(b[i]);
        }

        return a.length;
    }
}
}
