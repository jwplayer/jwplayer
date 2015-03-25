package com.longtailvideo.jwplayer.events {
import com.longtailvideo.jwplayer.player.PlayerVersion;

import flash.events.Event;
import flash.external.ExternalInterface;
import flash.system.Capabilities;

public class PlayerEvent extends Event {

    public static const JWPLAYER_READY:String = "jwplayerReady";

    public static const JWPLAYER_LOCKED:String = "jwplayerLocked";

    public static const JWPLAYER_UNLOCKED:String = "jwplayerUnlocked";

    public static const JWPLAYER_ERROR:String = "jwplayerError";

    public static const JWPLAYER_FULLSCREEN:String = "jwplayerFullscreen";

    public static const JWPLAYER_SETUP_ERROR:String = "jwplayerSetupError";

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

}
}