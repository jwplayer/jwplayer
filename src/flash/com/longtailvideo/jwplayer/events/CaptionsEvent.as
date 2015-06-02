package com.longtailvideo.jwplayer.events {
import flash.events.Event;

public class CaptionsEvent extends PlayerEvent {

    public static const JWPLAYER_CAPTIONS_LIST:String = "captionsList";

    public static const JWPLAYER_CAPTIONS_CHANGED:String = "captionsChanged";

    // An array of caption tracks

    public function CaptionsEvent(type:String) {
        super(type);
    }

    // The current track; A value of -1 means the track is off
    public var tracks:Array = null;
    public var currentTrack:Number = -1;

    public override function clone():Event {
        var evt:CaptionsEvent = new CaptionsEvent(this.type);
        evt.tracks = this.tracks;
        evt.currentTrack = this.currentTrack;
        return evt;
    }

    override public function toJsObject():Object {
        return {
            type: type,
            currentTrack: currentTrack,
            tracks: tracks
        };
    }

    public override function toString():String {
        var retString:String = '[CaptionsEvent type="' + type + '"';

        if (tracks !== null) retString += ' tracks="' + tracks + '"';
        if (currentTrack > -1) retString += ' currentTrack="' + currentTrack + '"';

        retString += "]";

        return retString;
    }
}
}