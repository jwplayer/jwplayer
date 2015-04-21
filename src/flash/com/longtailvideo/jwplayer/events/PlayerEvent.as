package com.longtailvideo.jwplayer.events {
import flash.events.Event;

public class PlayerEvent extends Event {

    public static const JWPLAYER_READY:String = "ready";

    public static const JWPLAYER_LOCKED:String = "locked";

    public static const JWPLAYER_UNLOCKED:String = "unlocked";

    public static const JWPLAYER_ERROR:String = "jw-error";

    public static const JWPLAYER_FULLSCREEN:String = "fullscreen";

    public static const JWPLAYER_SETUP_ERROR:String = "setupError";

    // MediaProvider
    public static const JWPLAYER_PROVIDER_CHANGED:String = "providerChanged";

    public function PlayerEvent(type:String, msg:String = undefined) {
        super(type, false, false);
        this.message = msg;
    }

    public var message:String;

    public override function toString():String {
        return '[PlayerEvent type="' + type + '" message="' + message + '" ]';
    }

    public override function clone():Event {
        return new PlayerEvent(this.type, this.message);
    }

    public function toJsObject():Object {
        if (message) {
            return {
                type: (type === 'jw-error' ? 'error' : type),
                message: message
            };
        }
        return {
            type: type
        };
    }
}
}
