package com.longtailvideo.jwplayer.player {


public class PlayerVersion {
    public static var id:String = "";
    public static var edition:String = "";

    protected static var _version:String = JWPLAYER::version;

    public static function get version():String {
        return _version;
    }

    public static function versionCheck(target:*):Boolean {
        var tParts:Array = ('0' + target).split(/\W/);
        var jParts:Array = _version.split(/\W/);
        var tMajor:Number = parseFloat(tParts[0]);
        var jMajor:Number = parseFloat(jParts[0]);
        if (tMajor > jMajor) {
            return false;
        } else if (tMajor === jMajor) {
            if (parseFloat('0' + tParts[1]) > parseFloat(jParts[1])) {
                return false;
            }
        }
        return true;
    }
}
}
