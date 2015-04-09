package com.longtailvideo.jwplayer.events {
import flash.events.Event;

public class CaptionsParsedEvent extends PlayerEvent {
    public static const CAPTIONS_PARSED:String = "WebVTTParsed";

    public function CaptionsParsedEvent(type:String, name:String, captions:Array) {
        super(type);
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
        return new CaptionsParsedEvent(type, _name, _captions);
    }

    override public function toJsObject():Object {
        return {
            type: CAPTIONS_PARSED,
            name: name,
            captions: captions
        };
    }
}
}
