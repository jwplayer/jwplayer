package com.longtailvideo.jwplayer.media {
import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
import com.longtailvideo.jwplayer.model.PlayerConfig;
import com.longtailvideo.jwplayer.model.PlaylistItem;

import flash.display.DisplayObject;

public interface IMediaProvider extends IGlobalEventDispatcher {
    function get display():DisplayObject;

    function get state():String;

    function get position():Number;

    function get audioTracks():Array;

    function get currentAudioTrack():Number;

    function set currentAudioTrack(audioTrack:Number):void;

    function get subtitlesTracks():Array;

    function get currentSubtitlesTrack():Number;

    function set currentSubtitlesTrack(subtitlesTrack:Number):void;

    function get qualityLevels():Array;

    function get currentQuality():Number;

    function set currentQuality(quality:Number):void;

    function get canSeek():Boolean;

    function get provider():String;

    function initializeMediaProvider(cfg:PlayerConfig):void;

    function init(itm:PlaylistItem):void;

    function load(itm:PlaylistItem):void;

    function play():void;

    function pause():void;

    function seek(pos:Number):void;

    function stop():void;

    function setVolume(vol:Number):void;

    function mute(muted:Boolean):void;

    function resize(width:Number, height:Number):void;
}
}