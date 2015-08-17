package com.longtailvideo.jwplayer.model {
import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.events.PlayerEvent;
import com.longtailvideo.jwplayer.media.IMediaProvider;
import com.longtailvideo.jwplayer.media.MediaProvider;
import com.longtailvideo.jwplayer.media.RTMPMediaProvider;
import com.longtailvideo.jwplayer.media.SoundMediaProvider;
import com.longtailvideo.jwplayer.media.VideoMediaProvider;
import com.longtailvideo.jwplayer.parsers.JWParser;
import com.longtailvideo.jwplayer.player.PlayerState;
import com.longtailvideo.jwplayer.plugins.PluginConfig;

import flash.events.Event;
import flash.media.SoundTransform;

public class Model extends GlobalEventDispatcher {
    /** Constructor **/
    public function Model(config:PlayerConfig) {
        _config = config;
        _mediaSources = {};
    }
    protected var _config:PlayerConfig;
    protected var _mediaSources:Object;
    protected var _currentMedia:IMediaProvider;

    protected var _preComplete:Boolean = false;
    protected var _cancelComplete:Boolean = false;

    protected var _item:PlaylistItem;

    /** The currently loaded MediaProvider **/
    public function get item():PlaylistItem {
        return _item;
    }

    public function set item(playItem:PlaylistItem):void {
        if (_preComplete) {
            _cancelComplete = true;
        }

        if (_item !== playItem) {
            _item = playItem;
            dispatchEvent(new Event('playlistItem'));
        }

        setActiveMediaProvider(JWParser.getProvider(playItem));
    }

    public function get config():PlayerConfig {
        return _config;
    }

    /** The currently loaded MediaProvider **/
    public function get media():IMediaProvider {
        return _currentMedia;
    }

    public function get currentQuality():Number {
        if (_currentMedia) {
            return _currentMedia.currentQuality;
        }
        return -1;
    }

    public function set currentQuality(index:Number):void {
        if (_currentMedia) {
            _currentMedia.currentQuality = index
        }
    }

    public function get qualityLevels():Array {
        if (_currentMedia) {
            return _currentMedia.qualityLevels;
        }
        return null;
    }

    public function get currentAudioTrack():Number {
        if (_currentMedia) {
            return _currentMedia.currentAudioTrack;
        }
        return -1;
    }

    public function set currentAudioTrack(index:Number):void {
        if (_currentMedia) {
            _currentMedia.currentAudioTrack = index
        }
    }

    public function get audioTracks():Array {
        if (_currentMedia) {
            return _currentMedia.audioTracks;
        }
        return null;
    }

    public function get currentSubtitlesTrack():Number {
        if (_currentMedia) {
            return _currentMedia.currentSubtitlesTrack;
        }
        return -1;
    }

    public function set currentSubtitlesTrack(index:Number):void {
        if (_currentMedia) {
            _currentMedia.currentSubtitlesTrack = index;
        }
    }

    /**
     * The current player state
     */
    public function get state():String {
        return _currentMedia ? _currentMedia.state : PlayerState.IDLE;
    }

    public function get fullscreen():Boolean {
        return _config.fullscreen;
    }

    public function set fullscreen(b:Boolean):void {
        _config.fullscreen = b;
    }

    public function get soundTransform():SoundTransform {
        return _config.soundTransform;
    }

    public function get mute():Boolean {
        return _config.mute;
    }

    public function set mute(muted:Boolean):void {
        _config.mute = muted;
        if (_currentMedia) {
            _currentMedia.setVolume(0);
        }
    }

    public function get volume():Number {
        return _config.volume;
    }

    public function set volume(vol:Number):void {
        _config.volume = vol;
        if (_currentMedia) {
            _currentMedia.setVolume(vol);
        }
    }

    public function get controls():Boolean {
        return _config.controls;
    }

    public function set controls(on:Boolean):void {
        _config.controls = on;
    }

    public function get stretching():String {
        return _config.stretching;
    }

    public function set stretching(stretch:String):void {
        _config.stretching = stretch;
    }

    public function setConfig(config:Object):void {
        _config.setConfig(config);
    }

    public function get plugins():Array {
        return _config.plugins;
    }

    public function set plugins(value:Array):void {
        _config.plugins = value;
    }

    public function pluginConfig(id:String):PluginConfig {
        return _config.pluginConfig(id);
    }

    /** Instruct the currently playing media to seek to the specified position. **/
    public function seek(pos:Number):void {
        var newEvent:MediaEvent = new MediaEvent(MediaEvent.JWPLAYER_MEDIA_SEEK);
        newEvent.position = _currentMedia.position;
        newEvent.offset = pos;
        dispatchEvent(newEvent);

        _currentMedia.seek(pos);
    }

    /**
     * Whether the Model has a MediaProvider handler for a given type.
     */
    public function hasMediaProvider(type:String):Boolean {
        return (_mediaSources[url2type(type)] is IMediaProvider);
    }

    /**
     * Add a MediaProvider to the list of available sources.
     */
    public function setMediaProvider(type:String, provider:IMediaProvider):void {
        if (!hasMediaProvider(type)) {
            _mediaSources[url2type(type)] = provider;
            provider.initializeMediaProvider(_config);
        }
    }

    public function setActiveMediaProvider(type:String):void {
        // lazy init
        if (!hasMediaProvider('default')) {
            setupMediaProviders();
        }
        if (!hasMediaProvider(type)) {
            type = "video";
        }

        var newMedia:IMediaProvider = _mediaSources[url2type(type)] as IMediaProvider;

        if (_currentMedia !== newMedia) {
            if (_currentMedia) {
                if (_currentMedia.state !== PlayerState.IDLE) {
                    _currentMedia.stop();
                }
                _currentMedia.removeGlobalListener(forwardEvents);
            }
            newMedia.addGlobalListener(forwardEvents);
            _currentMedia = newMedia;

            dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_PROVIDER_CHANGED, _currentMedia.provider));
        }
    }

    public function checkBeforeComplete():Boolean {
        return _preComplete;
    }

    protected function setupMediaProviders():void {
        setMediaProvider('default', new MediaProvider('default'));
        setMediaProvider('video', new VideoMediaProvider());
        setMediaProvider('rtmp', new RTMPMediaProvider());
        setMediaProvider('sound', new SoundMediaProvider());
        // setActiveMediaProvider('default');
    }

    /** e.g. http://providers.longtailvideo.com/5/myProvider.swf --> myprovider **/
    protected function url2type(type:String):String {
        if (type.toLowerCase() == "audio")
            return "sound";
        else
            return type.substring(type.lastIndexOf("/") + 1, type.length).replace(".swf", "").toLowerCase();
    }

    protected function forwardEvents(evt:Event):void {
        if (evt is PlayerEvent) {
            if (evt.type === MediaEvent.JWPLAYER_MEDIA_COMPLETE) {
                _preComplete = true;
                dispatchEvent(new MediaEvent(MediaEvent.JWPLAYER_MEDIA_BEFORECOMPLETE));
            } else if (evt.type === MediaEvent.JWPLAYER_MEDIA_ERROR) {
                // Translate media error into player error.
                dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_ERROR, (evt as MediaEvent).message));
            }
            if (evt.type === MediaEvent.JWPLAYER_MEDIA_COMPLETE) {
                _preComplete = false;
                if (_cancelComplete) {
                    _cancelComplete = false;
                    return;
                }
            }
        }
        dispatchEvent(evt);
    }

}
}