package com.longtailvideo.jwplayer.events {
import flash.events.Event;

public class PlayerStateEvent extends PlayerEvent {

    public static const JWPLAYER_PLAYER_STATE:String = "state";

    public function PlayerStateEvent(newState:String, oldState:String) {
        super(JWPLAYER_PLAYER_STATE);
        this.newstate = newState;
        this.oldstate = oldState;
    }
    public var newstate:String = "";
    public var oldstate:String = "";

    public override function clone():Event {
        return new PlayerStateEvent(newstate, oldstate);
    }

    override public function toJsObject():Object {
        return {
            type: JWPLAYER_PLAYER_STATE,
            newstate: newstate,
            oldstate: oldstate
        };
    }

    public override function toString():String {
        return '[PlayerStateEvent type="' + type + '" oldstate="' + oldstate + '" newstate="' + newstate +
                '" message="' + message + '" ]';
    }
}
}