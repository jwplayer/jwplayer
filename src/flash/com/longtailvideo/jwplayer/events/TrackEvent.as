package com.longtailvideo.jwplayer.events {
import flash.events.Event;

/**
 * represents a track associated to media
 */
public class TrackEvent extends PlayerEvent {
    public static const JWPLAYER_AUDIO_TRACKS:String = "jwplayerAudioTracks";
    public static const JWPLAYER_AUDIO_TRACK_CHANGED:String = "jwplayerAudioTrackChanged";

    public static const JWPLAYER_SUBTITLES_TRACKS:String = "jwplayerSubtitlesTracks";
    public static const JWPLAYER_SUBTITLES_TRACK_CHANGED:String = "jwplayerSubtitlesTrackChanged";

    //An array of tracks not including the "off" track
    public var tracks:Array = null;
    // The current tracks; A value of -1 means the track is off
    public var currentTrack:int	= -1;

    public function TrackEvent(type:String, tracks:Array, currentTrack:int) {
        super(type);
        this.tracks = tracks;
        this.currentTrack = currentTrack;
    }

    public override function clone():Event {
        // the class must be dynamic to make the properties enumerable
        return new TrackEvent(this.type, this.tracks, this.currentTrack);
    }

    public override function toString():String {
        if (!type) {
            return '';
        }
        var retString:String = '[TrackEvent type="' + type + '"';
        retString += ' tracks="' + tracks + '"';
        retString += ' currentTrack="' + currentTrack + '"';

        if (message) retString += ' message="' + message + '"';

        retString += ' id="' + id + '"'
        retString += ' client="' + client + '"'
        retString += ' version="' + version + '"'
        retString += "]";

        return retString;
    }
}
}
