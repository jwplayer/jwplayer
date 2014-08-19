package com.longtailvideo.jwplayer.utils {
public class Utils {

    //public function Utils() { }

    public static function extend(obj:Object, ...args):Object {
        for(var i:uint =0; i < args.length; i++) {
            var source:Object = args[i];

            for (var key:String in source) {
                obj[key] = source[key];
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

}
}
