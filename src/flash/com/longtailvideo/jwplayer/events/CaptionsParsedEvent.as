/**
 * Created by charles on 10/20/14.
 */
package com.longtailvideo.jwplayer.events {
import flash.events.Event;

public class CaptionsParsedEvent extends PlayerEvent {
    public static const CAPTIONS_PARSED:String = "WebVTTEventCaptionsParsed";

    private var _name:String;
    private var _captions:Array;

    public function CaptionsParsedEvent(type:String, name:String, captions:Array) {
        super(type);
        _name = name;
        _captions = captions;
    }

    public override function clone():Event {
        // the class must be dynamic to make the properties enumerable
        return new CaptionsParsedEvent(this.type, this.name, this.captions);
    }

    public function get name():String {
        return _name;
    }

    public function get captions():Array {
        return _captions;
    }
}
}
