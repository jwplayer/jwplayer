package com.longtailvideo.jwplayer.events {
import com.longtailvideo.jwplayer.media.MediaProvider;

import flash.events.Event;

/**
 * The MediaEvent class represents events related to media playback.
 *
 * @see com.longtailvideo.media.MediaProvider
 */
public class MediaEvent extends PlayerEvent {

    public static const JWPLAYER_MEDIA_ERROR:String = "mediaError";
    public static const JWPLAYER_MEDIA_LOADED:String = "loaded";
    public static const JWPLAYER_MEDIA_COMPLETE:String = "complete";
    public static const JWPLAYER_MEDIA_BEFOREPLAY:String = "beforePlay";
    public static const JWPLAYER_MEDIA_BEFORECOMPLETE:String = "beforeComplete";

    public static const JWPLAYER_MEDIA_BUFFER:String = "bufferChange";
    public static const JWPLAYER_MEDIA_BUFFER_FULL:String = "bufferFull";
    public static const JWPLAYER_MEDIA_SEEK:String = "seek";
    public static const JWPLAYER_MEDIA_SEEKED:String = "seeked";
    public static const JWPLAYER_MEDIA_TIME:String = "time";

    // The requested seek offset, in seconds
    public static const JWPLAYER_MEDIA_META:String = "meta";
    public static const JWPLAYER_MEDIA_VOLUME:String = "volume";

    // Number of seconds elapsed since the start of the media playback
    public static const JWPLAYER_MEDIA_MUTE:String = "mute";
    // Total number of seconds in the currently loaded media
    public static const JWPLAYER_MEDIA_LEVELS:String = "levels";
    public static const JWPLAYER_MEDIA_LEVEL_CHANGED:String = "levelsChanged";
    public static const JWPLAYER_MEDIA_TYPE:String = "mediaType";

    private var _currentQuality:Number;
    private var _bufferPercent:Number;
    private var _position:Number;
    private var _duration:Number;
    private var _volume:Number;
    private var _mediaType:String;

    public var levels:Array = null;
    public var metadata:Object = null;
    public var offset:Number = 0;
    public var mute:Boolean = false;


    public function MediaEvent(type:String, properties:Object = null) {
        super(type);
        if (properties !== null) {
            for (var property:String in properties) {
                if (this.hasOwnProperty(property)) {
                    this[property] = properties[property];
                }
            }
        }
    }

    public function get currentQuality():Number {
        if (isNaN(_currentQuality)) {
            return -1;
        }
        return _currentQuality;
    }

    public function set currentQuality(value:Number):void {
        _currentQuality = value;
    }

    public function get bufferPercent():Number {
        if (isNaN(_bufferPercent)) {
            return -1;
        }
        return _bufferPercent;
    }

    public function set bufferPercent(value:Number):void {
        _bufferPercent = value;
    }

    public function get position():Number {
        if (isNaN(_position)) {
            return -1;
        }
        return _position;
    }

    public function set position(value:Number):void {
        _position = value;
    }

    public function get duration():Number {
        if (isNaN(_duration)) {
            return MediaProvider.UNKNOWN_DURATION;
        }
        return _duration;
    }

    public function set duration(value:Number):void {
        _duration = value;
    }

    public function get volume():Number {
        if (isNaN(_volume)) {
            return -1;
        }
        return _volume;
    }

    public function set volume(value:Number):void {
        _volume = value;
    }

    public function get mediaType():String {
        return _mediaType;
    }

    public function set mediaType(value:String):void {
        _mediaType = value;
    }

    public override function clone():Event {
        // the class must be dynamic to make the properties enumerable
        return new MediaEvent(type, {
            bufferPercent: _bufferPercent,
            offset: offset,
            position: _position,
            duration: _duration,
            metadata: metadata,
            volume: _volume,
            mute: mute,
            levels: levels,
            currentQuality: _currentQuality,
            mediaType: _mediaType
        });
    }

    override public function toJsObject():Object {
        var js:Object = super.toJsObject();
        switch (type) {
            case JWPLAYER_MEDIA_TIME:
            case JWPLAYER_MEDIA_BUFFER:
                if (!isNaN(_bufferPercent)) {
                    js.bufferPercent = _bufferPercent;
                }
                if (!isNaN(_position)) {
                    js.position = Math.round(_position * 1000) / 1000;
                }
            // fall through
            case JWPLAYER_MEDIA_META:
                if(_duration === Infinity) {
                    js.duration = 'Infinity';
                } else if (!isNaN(_duration)) {
                    js.duration = Math.round(_duration * 1000) / 1000;
                }
                break;
            case JWPLAYER_MEDIA_LEVEL_CHANGED:
            case JWPLAYER_MEDIA_LEVELS:
                js.levels = levels;
                js.currentQuality = currentQuality;
                break;
            case JWPLAYER_MEDIA_SEEK:
                js.position = _position;
                js.offset = offset;
                break;
            case JWPLAYER_MEDIA_VOLUME:
                js.volume = _volume;
                break;
            case JWPLAYER_MEDIA_MUTE:
                js.mute = mute;
                break;
            case JWPLAYER_MEDIA_TYPE:
                js.mediaType = _mediaType;
                break;
        }

        // any event may supply additional properties as metadata
        if (metadata) {
            js.metadata = metadata;
        }

        return js;
    }

    public override function toString():String {
        if (!type) {
            return '';
        }
        var retString:String = '[MediaEvent type="' + type + '"';

        for (var s:String in metadata) {
            retString += ' ' + s + '="' + metadata[s] + '"';
        }

        if (type === JWPLAYER_MEDIA_VOLUME) retString += ' volume="' + _volume + '"';
        if (type === JWPLAYER_MEDIA_MUTE)   retString += ' mute="' + mute + '"';

        if (_bufferPercent > -1) retString += ' bufferPercent="' + _bufferPercent + '"';
        if (!isNaN(_duration)) retString += ' duration="' + _duration + '"';
        if (_position > -1) retString += ' position="' + _position + '"';

        if (levels !== null) retString += ' levels="' + levels + '"';
        if (_currentQuality > -1) retString += ' currentQuality="' + _currentQuality + '"';

        if (offset)  retString += ' offset="' + offset + '"';
        if (message) retString += ' message="' + message + '"';

        retString += "]";

        return retString;
    }
}
}