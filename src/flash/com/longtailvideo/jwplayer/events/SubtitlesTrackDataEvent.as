package com.longtailvideo.jwplayer.events {
import flash.events.Event;

public class SubtitlesTrackDataEvent extends PlayerEvent {
    public static const TYPE:String = "subtitlesTrackData";

    public function SubtitlesTrackDataEvent(name:String, captions:Array, source:String=null) {
        super(TYPE);
        _name = name;
        _captions = captions;
        _source = source;
    }

    private var _name:String;
    private var _captions:Array;
    private var _source:String;

    public function get name():String {
        return _name;
    }

    public function get captions():Array {
        return _captions;
    }

    public function get source():String {
        return _source;
    }

    public override function clone():Event {
        return new SubtitlesTrackDataEvent(_name, _captions, _source);
    }

    override public function toJsObject():Object {
        return {
            type: TYPE,
            name: name,
            captions: captions,
            source: source
        };
    }
}
}
