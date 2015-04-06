package com.longtailvideo.jwplayer.events {
import flash.events.Event;

/**
 * The MediaEvent class represents events related to media playback.
 *
 * @see com.longtailvideo.media.MediaProvider
 */
public class MediaEvent extends PlayerEvent {

    public static const JWPLAYER_MEDIA_ERROR:String = "error";
    public static const JWPLAYER_MEDIA_LOADED:String = "loaded";
    public static const JWPLAYER_MEDIA_COMPLETE:String = "complete";
    public static const JWPLAYER_MEDIA_BEFOREPLAY:String = "beforePlay";
    public static const JWPLAYER_MEDIA_BEFORECOMPLETE:String = "beforeComplete";

    public static const JWPLAYER_MEDIA_BUFFER:String = "buffer";
    public static const JWPLAYER_MEDIA_BUFFER_FULL:String = "bufferFull";
    public static const JWPLAYER_MEDIA_SEEK:String = "seek";
    public static const JWPLAYER_MEDIA_TIME:String = "time";

    // The requested seek offset, in seconds
    public static const JWPLAYER_MEDIA_META:String = "meta";
    public static const JWPLAYER_MEDIA_VOLUME:String = "volume";

    // Number of seconds elapsed since the start of the media playback
    public static const JWPLAYER_MEDIA_MUTE:String = "mute";
    // Total number of seconds in the currently loaded media
    public static const JWPLAYER_MEDIA_LEVELS:String = "levels";
    public static const JWPLAYER_MEDIA_LEVEL_CHANGED:String = "levelsChanged";

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
    public var bufferPercent:Number = -1;
    public var offset:Number = 0;
    public var position:Number = -1;
    public var duration:Number = -1;
    public var metadata:Object = null;
    public var volume:Number = -1;

    //An array of quality levels
    public var mute:Boolean = false;
    // The current level; A value of -1 means the level is automatically selected
    public var levels:Array = null;
    public var currentQuality:Number = -1;

    public override function clone():Event {
        // the class must be dynamic to make the properties enumerable
        return new MediaEvent(this.type, {
            bufferPercent: this.bufferPercent,
            offset: this.offset,
            position: this.position,
            duration: this.duration,
            metadata: this.metadata,
            volume: this.volume,
            mute: this.mute,
            levels: this.levels,
            currentQuality: this.currentQuality
        });
    }

    public override function toString():String {
        if (!type) {
            return '';
        }
        var retString:String = '[MediaEvent type="' + type + '"';

        for (var s:String in metadata) {
            retString += ' ' + s + '="' + metadata[s] + '"';
        }

        if (type === JWPLAYER_MEDIA_VOLUME) retString += ' volume="' + volume + '"';
        if (type === JWPLAYER_MEDIA_MUTE)   retString += ' mute="' + mute + '"';

        if (bufferPercent > -1) retString += ' bufferPercent="' + bufferPercent + '"';
        if (duration > -1) retString += ' duration="' + duration + '"';
        if (position > -1) retString += ' position="' + position + '"';

        if (levels !== null) retString += ' levels="' + levels + '"';
        if (currentQuality > -1) retString += ' currentQuality="' + currentQuality + '"';

        if (offset)  retString += ' offset="' + offset + '"';
        if (message) retString += ' message="' + message + '"';

        retString += "]";

        return retString;
    }
}
}