package com.longtailvideo.jwplayer.player {


/**
 * Static typed list of all possible Model states
 *
 * @see com.longtailvideo.jwplayer.model.Model
 */
public class PlayerState {
    /** Nothing happening. No playback and no file in memory. **/
    public static var IDLE:String = "IDLE";
    /** Buffering; will start to play when the buffer is full. **/
    public static var BUFFERING:String = "BUFFERING";
    /** The file is being played back. **/
    public static var PLAYING:String = "PLAYING";
    /** Playback is paused. **/
    public static var PAUSED:String = "PAUSED";


    // These are specific types of buffering which a provider may use for
    //  better QOE introspection
    public static const STALLED:String = "STALLED";
    public static const LOADING:String = "LOADING";

    public static function isBuffering(state:String):Boolean {
        return (state === LOADING || state === STALLED || state === BUFFERING);
    }
}
}