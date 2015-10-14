package com.longtailvideo.jwplayer.media {
import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.events.PlayerStateEvent;
import com.longtailvideo.jwplayer.model.PlayerConfig;
import com.longtailvideo.jwplayer.model.PlaylistItem;
import com.longtailvideo.jwplayer.player.PlayerState;
import com.longtailvideo.jwplayer.utils.Stretcher;

import flash.display.DisplayObject;
import flash.display.Sprite;
import flash.events.Event;

public class MediaProvider extends Sprite implements IMediaProvider {

    public static const LIVE_DURATION:Number = Infinity;
    public static const UNKNOWN_DURATION:Number = 0;

    public static function isVOD(duration:Number):Boolean {
        return duration > 0 && duration !== LIVE_DURATION;
    }

    protected var _item:PlaylistItem;
    protected var _config:PlayerConfig;
    protected var _media:Sprite;
    protected var _width:Number;
    protected var _height:Number;
    protected var _position:Number;
    protected var _bufferPercent:Number;
    protected var _currentQuality:Number = -1;
    protected var _currentAudioTrack:Number = -1;
    protected var _currentSubtitlesTrack:Number = -1;

    private var _dispatcher:GlobalEventDispatcher;
    private var _provider:String;
    private var _state:String;
    private var _volume:Number;
    /** Queue buffer full event if it occurs while the player is paused. **/
    private var _queuedBufferFull:Boolean;


    public function MediaProvider(provider:String) {
        _provider = provider;
        _position = 0;
        _dispatcher = new GlobalEventDispatcher();
    }

    /** Name of the MediaProvider. */
    public function get provider():String {
        return _provider;
    }

    /** Currently playing PlaylistItem **/
    public function get item():PlaylistItem {
        return _item;
    }

    /** Current position, in seconds **/
    public function get position():Number {
        return _position;
    }

    /**
     * The current volume of the playing media
     * <p>Range: 0-100</p>
     */
    public function get volume():Number {
        return _volume;
    }

    /**
     * Current state of the MediaProvider.
     * @see PlayerStates
     */
    public function get state():String {
        return _state;
    }

    /** Current quality level **/
    public function get currentQuality():Number {
        return _currentQuality;
    }

    /** Current quality level setter **/
    public function set currentQuality(quality:Number):void {
        _currentQuality = quality;
    }

    /** Current audio track getter **/
    public function get currentAudioTrack():Number {
        return _currentAudioTrack;
    }

    /** Current audio track setter **/
    public function set currentAudioTrack(audioTrack:Number):void {
        _currentAudioTrack = audioTrack;
    }


    /** Current subtitles track getter **/
    public function get currentSubtitlesTrack():Number {
        return _currentSubtitlesTrack;
    }

    /** Current subtitles track setter **/
    public function set currentSubtitlesTrack(subtitlesTrack:Number):void {
        _currentSubtitlesTrack = subtitlesTrack;
    }

    /** Graphical representation of media **/
    public function get display():DisplayObject {
        return _media;
    }

    /** Determine if seek can be called or should be delayed **/
    public function get canSeek():Boolean {
        return !PlayerState.isBuffering(state);
    }

    /** Audio Tracks (must be overridden by inheritors) **/
    public function get audioTracks():Array {
        return null;
    }

    /** Subtitles Tracks (must be overridden by inheritors) **/
    public function get subtitlesTracks():Array {
        return null;
    }

    /** Quality levels (must be overridden by inheritors **/
    public function get qualityLevels():Array {
        return null;
    }

    /** The current config **/
    protected function get config():PlayerConfig {
        return _config;
    }

    /** Gets the graphical representation of the media **/
    protected function get media():DisplayObject {
        return _media;
    }

    /** Sets the graphical representation of the media **/
    protected function set media(m:DisplayObject):void {
        if (m) {
            _media = new Sprite();
            _media.addChild(m);
            if (_width * _height > 0) {
                Stretcher.stretch(_media, _width, _height, _config.stretching);
            }
        } else {
            _media = null;
        }
        // update the model/view
        sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_LOADED);
    }

    /**
     * Called after construction to initialize provider with player settings.
     * @param config The player configuration passed to jwplayer().setup({config})
     */
    public function initializeMediaProvider(config:PlayerConfig):void {
        _config = config;
        _state = PlayerState.IDLE;
    }

    /**
     * Called when preloading. Placeholder to be override
     * @param itm
     */
    public function init(itm:PlaylistItem):void {
        _item = itm;
    }

    /**
     * Load a new playlist item
     * @param itm The playlistItem to load
     **/
    public function load(itm:PlaylistItem):void {
        _item = itm;
        dispatchEvent(new MediaEvent(MediaEvent.JWPLAYER_MEDIA_LOADED));
    }

    /** Resume playback of the item. **/
    public function play():void {
        if (_queuedBufferFull) {
            // This path of execution implies we were in a paused state
            _queuedBufferFull = false;
            setState(PlayerState.LOADING);
            sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
        } else {
            setState(PlayerState.PLAYING);
        }
    }

    /** Pause playback of the item. **/
    public function pause():void {
        setState(PlayerState.PAUSED);
    }

    /**
     * Seek to a certain position in the item.
     * @param pos    The position in seconds.
     **/
    public function seek(pos:Number):void {
        _position = pos;
    }

    /** Stop playing and loading the item. **/
    public function stop():void {
        setState(PlayerState.IDLE);
        _position = 0;
    }

    /**
     * Change the playback volume of the item.
     * @param vol    The new volume (0 to 100).
     **/
    public function setVolume(vol:Number):void {
    }

    /**
     * Changes the mute state of the item.
     * @param muted    The new mute state.
     **/
    public function mute(muted:Boolean):void {
    }

    /**
     * Resizes the display.
     * @param width     The new width of the display.
     * @param height    The new height of the display.
     **/
    public function resize(width:Number, height:Number):void {
        _width = width;
        _height = height;
        if (_media) {
            Stretcher.stretch(_media, width, height, _config.stretching);
        }
    }

    /**
     * @inheritDoc
     */
    public function addGlobalListener(listener:Function):void {
        _dispatcher.addGlobalListener(listener);
    }

    /**
     * @inheritDoc
     */
    public function removeGlobalListener(listener:Function):void {
        _dispatcher.removeGlobalListener(listener);
    }

    /** Puts the video into a buffer state **/
    protected function buffer():void {
    }

    /** Completes video playback **/
    protected function complete():void {
        if (state != PlayerState.IDLE) {
            stop();
            sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_COMPLETE);
        }
    }

    /** Dispatches error notifications **/
    protected function error(message:String):void {
        stop();
        sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_ERROR, {message: message});
    }

    /**
     * Sets the current state to a new state and sends a PlayerStateEvent
     * @param newState A state from ModelStates.
     */
    protected function setState(newState:String):void {
        if (state !== newState) {
            var evt:PlayerStateEvent = new PlayerStateEvent(newState, state);
            _state = newState;
            dispatchEvent(evt);
        }
    }

    /**
     * Sends a MediaEvent, simultaneously setting a property
     * @param type
     * @param property
     * @param value
     */
    protected function sendMediaEvent(type:String, properties:Object = null):void {
        if (type === MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL && state === PlayerState.PAUSED) {
            _queuedBufferFull = true;
        } else {
            var newEvent:MediaEvent = new MediaEvent(type, properties);
            dispatchEvent(newEvent);
        }
    }

    /** Dispatches buffer change notifications **/
    protected function sendBufferEvent(bufferPercent:Number, offset:Number = 0, metadata:Object = null):void {
        bufferPercent = Math.max(0, Math.min(bufferPercent, 100));
        if (bufferPercent !== _bufferPercent) {
            _bufferPercent = bufferPercent;
            var obj:Object = {
                bufferPercent: bufferPercent,
                offset: offset,
                duration: _item.duration,
                position: Math.max(0, _position),
                metadata: metadata
            };
            sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER, obj);
        }
    }

    /**
     * Gets a property from the player configuration
     * @param property The property to be retrieved.
     * **/
    protected function getConfigProperty(property:String):* {
        var providerConfig:Object = _config[provider];
        if (providerConfig) {
            return providerConfig[property];
        }
        return null;
    }

    /** Translate sources into quality levels. **/
    protected function sources2Levels(sources:Array):Array {
        var levels:Array = new Array();
        for (var i:Number = 0; i < sources.length; i++) {
            var level:Object = {label: i + " "};
            if (sources[i].bitrate) {
                level.bitrate = sources[i].bitrate;
                level.label = level.bitrate + "kbps";
            }
            if (sources[i].width) {
                level.width = sources[i].width;
                level.label = level.width + "px";
            }
            if (sources[i].height) {
                level.height = sources[i].height;
                level.label = level.height + "p";
            }
            if (sources[i].label) {
                level.label = sources[i].label;
            }
            levels.push(level);
        }
        return levels;
    }

    /** Broadcast onQualityLevels / onCurrentQuality. **/
    protected function sendQualityEvent(type:String, sources:Array, quality:Number):void {
        var qualityEvent:MediaEvent = new MediaEvent(type);
        qualityEvent.levels = sources2Levels(sources);
        qualityEvent.currentQuality = quality;
        dispatchEvent(qualityEvent);
    }

    public override function dispatchEvent(event:Event):Boolean {
        _dispatcher.dispatchEvent(event);
        return super.dispatchEvent(event);
    }

    /**
     * DEPRECATED IN JW7
     * _stretch - no longer stored in provider
     */
    private function noop(...args):void {
    }

    protected function get _stretch():Boolean {
        return false;
    }

    protected function set _stretch(v:Boolean):void {
    }

}
}