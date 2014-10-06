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
    /*
    private static function merge(obj1:Object, obj2:Object):Object {
        var newObj:Object = {};

        for (var key:String in obj1) {
            newObj[key] = obj1[key];
        }

        for (key in obj2) {
            newObj[key] = obj2[key];
        }

        return newObj;
    }
    */

}
}
