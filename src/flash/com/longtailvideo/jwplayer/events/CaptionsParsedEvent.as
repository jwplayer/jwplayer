package com.longtailvideo.jwplayer.events {
import flash.events.Event;

public class CaptionsParsedEvent extends PlayerEvent {
    public static const CAPTIONS_PARSED:String = "WebVTTParsed";

    private var _name:String;
    private var _captions:Array;

    public function CaptionsParsedEvent(type:String, name:String, captions:Array) {
        super(type);
        _name = name;
        _captions = captions;
    }

    public override function clone():Event {
        return new CaptionsParsedEvent(type, _name, _captions);
    }

    public function get name():String {
        return _name;
    }

    public function get captions():Array {
        return _captions;
    }
}
}
