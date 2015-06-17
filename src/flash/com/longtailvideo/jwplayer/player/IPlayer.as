package com.longtailvideo.jwplayer.player {
import com.longtailvideo.jwplayer.model.PlayerConfig;
import com.longtailvideo.jwplayer.model.PlaylistItem;
import com.longtailvideo.jwplayer.plugins.IPlugin;

import flash.events.IEventDispatcher;
import flash.geom.Rectangle;

/**
 * Interface for JW Flash Media Player
 */
public interface IPlayer extends IEventDispatcher {
    /**
     * Player version getter
     */
    function get version():String;

    /**
     * The current player state
     */
    function get state():String;

    /**
     * Set to true when the player is in a locked state.
     */
    function get locked():Boolean;

    /**
     * Request that the player enter the locked state.  When the Player is locked, the currently playing stream is
     * paused, and no new playback-related commands will be honored until <code>unlock</code> is
     * called.
     *
     * @param target Reference to plugin requesting the player lock
     * @param callback The function to be executed once a lock is aquired.
     */
    function lock(target:IPlugin, callback:Function):void;

    /**
     * Unlocks the player.  If the player was buffering or playing when it was locked, playback will resume.
     *
     * @param target Reference to the requesting plugin.
     * @return <code>true</code>, if <code>target</code> had previously requested player locking.
     *
     */
    function unlock(target:IPlugin):Boolean;

    function volume(volume:Number):Boolean;

    function mute(state:Boolean):void;

    function load(item:*):Boolean;

    function play():Boolean;

    function pause():Boolean;

    function stop():Boolean;

    function seek(position:Number):Boolean;

    function fullscreen(on:Boolean):void;

    function getAudioTracks():Array;

    function getCurrentAudioTrack():Number;

    function setCurrentAudioTrack(index:Number):void;

    function getQualityLevels():Array;

    function getCurrentQuality():Number;

    function setCurrentQuality(index:Number):void;

    function getCaptionsList():Array;

    function getCurrentCaptions():Number;

    function setCurrentCaptions(index:Number):void;

    function getSafeRegion():Rectangle;

    function getItem():PlaylistItem;

    function get config():PlayerConfig;

}
}