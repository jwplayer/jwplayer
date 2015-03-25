package com.longtailvideo.jwplayer.events {
import flash.events.Event;

public class ViewEvent extends PlayerEvent {

    public static const JWPLAYER_RESIZE:String = "resize";
    public static const JWPLAYER_FULLSCREEN:String = "fullscreen";

    public function ViewEvent(type:String, width:Number, height:Number, fullscreen:Boolean) {
        super(type);

        this.width = width;
        this.height = height;
        this.fullscreen = fullscreen;
    }
    public var width:Number;
    public var height:Number;
    public var fullscreen:Boolean;

    public override function clone():Event {
        return new ViewEvent(type, width, height, fullscreen);
    }

}
}