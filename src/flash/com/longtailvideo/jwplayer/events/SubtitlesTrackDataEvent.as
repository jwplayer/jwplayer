package com.longtailvideo.jwplayer.events {
import flash.events.Event;

public class SubtitlesTrackDataEvent extends PlayerEvent {
    public static const TYPE:String = "subtitlesTrackData";

    public function SubtitlesTrackDataEvent(name:String, captions:Array) {
        super(TYPE);
        _name = name;
        _captions = captions;
    }

    private var _name:String;

    public function get name():String {
        return _name;
    }

    private var _captions:Array;

    public function get captions():Array {
        return _captions;
    }

    public override function clone():Event {
        return new SubtitlesTrackDataEvent(_name, _captions);
    }

    override public function toJsObject():Object {
        return {
            type: TYPE,
            name: name,
            captions: captions
        };
    }
}
}
