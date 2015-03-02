package com.longtailvideo.jwplayer.model {
import com.longtailvideo.jwplayer.utils.Logger;
import com.longtailvideo.jwplayer.utils.Strings;

public class InstreamOptions implements IInstreamOptions {

    public function InstreamOptions(options:Object = null) {
        update(options);
    }

    protected var _tag:String;

    public function get tag():String {
        return _tag;
    }

    public function set tag(t:String):void {
        _tag = t;
    }

    public function update(options:Object = null):void {
        if (options) {
            for (var i:String in options) {
                try {
                    this[i.toLowerCase()] = Strings.serialize(options[i]);
                } catch (e:Error) {
                    Logger.log("Could not set instream option " + i.toLowerCase());
                }
            }
        }
    }
}
}