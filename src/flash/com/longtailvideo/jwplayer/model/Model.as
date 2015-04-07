package com.longtailvideo.jwplayer.model {
import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.events.PlayerEvent;
import com.longtailvideo.jwplayer.media.IMediaProvider;
import com.longtailvideo.jwplayer.media.MediaProvider;
import com.longtailvideo.jwplayer.media.RTMPMediaProvider;
import com.longtailvideo.jwplayer.media.SoundMediaProvider;
import com.longtailvideo.jwplayer.media.VideoMediaProvider;
import com.longtailvideo.jwplayer.media.YouTubeMediaProvider;
import com.longtailvideo.jwplayer.parsers.JWParser;
import com.longtailvideo.jwplayer.player.PlayerState;
import com.longtailvideo.jwplayer.plugins.PluginConfig;

import flash.events.Event;

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

        if (state !== PlayerState.IDLE) {
            _currentMedia.stop();
        }

        _item = playItem;

        setActiveMediaProvider(JWParser.getProvider(playItem));
    }

    /** The currently loaded MediaProvider **/
    public function get media():IMediaProvider {
        return _currentMedia;
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

    public function get mute():Boolean {
        return _config.mute;
    }

    public function set mute(b:Boolean):void {
        _config.mute = b;
        _currentMedia.mute(b);
    }

    public function get volume():Number {
        return _config.volume;
    }

    public function set volume(n:Number):void {
        _config.volume = n;
        _currentMedia.setVolume(n);
    }

    public function get width():Number {
        return _config.width;
    }

    public function get height():Number {
        return _config.height;
    }

    public function set width(n:Number):void {
        _config.width = n;
    }

    public function set height(n:Number):void {
        _config.height = n;
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

    public function get pluginIds():Array {
        return _config.pluginIds;
    }

    public function get plugins():String {
        return _config.plugins;
    }

    public function set plugins(x:String):void {
        _config.plugins = x;
    }

    public function pluginConfig(id:String):PluginConfig {
        return _config.pluginConfig(id);
    }

    /** Instruct the currently playing media to seek to the specified position. **/
    public function seek(pos:Number):void {
        var newEvent:MediaEvent = new MediaEvent(MediaEvent.JWPLAYER_MEDIA_SEEK);
        newEvent.position = media.position;
        newEvent.offset = pos;
        dispatchEvent(newEvent);

        media.seek(pos);
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
                if (_currentMedia.state != PlayerState.IDLE) _currentMedia.stop();
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
        setMediaProvider('youtube', new YouTubeMediaProvider());
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
            dispatchEvent(evt);
        }
    }

}
}