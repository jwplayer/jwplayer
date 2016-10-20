package com.longtailvideo.jwplayer.player {
import com.longtailvideo.jwplayer.controller.Controller;
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.events.PlayerEvent;
import com.longtailvideo.jwplayer.events.PlayerStateEvent;
import com.longtailvideo.jwplayer.media.MediaProvider;
import com.longtailvideo.jwplayer.media.RTMPMediaProvider;
import com.longtailvideo.jwplayer.media.SoundMediaProvider;
import com.longtailvideo.jwplayer.media.VideoMediaProvider;
import com.longtailvideo.jwplayer.model.Model;
import com.longtailvideo.jwplayer.model.PlaylistItem;
import com.longtailvideo.jwplayer.parsers.JWParser;
import com.longtailvideo.jwplayer.plugins.IPlugin;
import com.longtailvideo.jwplayer.utils.RootReference;
import com.longtailvideo.jwplayer.view.View;

import flash.display.Sprite;
import flash.events.Event;

public class InstreamPlayer extends Sprite {

    public static const UNSUPPORTED_ERROR:String = "Unsupported IPlayer method in InstreamPlayer";

    protected var _model:Model;
    protected var _view:View;
    protected var _controller:Controller;
    protected var _item:PlaylistItem;
    protected var _provider:MediaProvider;
    protected var _plugin:IPlugin;
    protected var _mediaLayer:Sprite;

    public function InstreamPlayer(target:IPlugin, model:Model, view:View, controller:Controller) {

        _plugin = target;
        _model = model;
        _controller = controller;
        _view = view;

        if (!target || !model || !view || !controller) {
            throw new ArgumentError("InstreamPlayer must be initialized with non-null arguments");
        }

        lock(_plugin, _lockCallback);

        this.mouseEnabled = false;
        this.mouseChildren = false;

        _mediaLayer = new Sprite();
        _mediaLayer.visible = false;
        this.addChild(_mediaLayer);

        CONFIG::debugging {
            this.name = 'instreamPlayer';
            _mediaLayer.name = 'instreamMedia';
        }

        // Put Instream on top of media layer, under plugins layer
        _view.addChildAt(this, 1);

        RootReference.stage.addEventListener(Event.RESIZE, resizeHandler);
    }

    public function loadItem(item:Object):void {
        _item = new PlaylistItem(item);
        beginPlayback(_item);
    }

    public function play():Boolean {
        if (_provider) {
            if (_provider.state == PlayerState.PLAYING || PlayerState.isBuffering(_provider.state)) {
                _provider.pause();
            } else {
                _provider.play();
            }
        }
        return true;
    }

    public function pause():Boolean {
        if (_provider && (_provider.state == PlayerState.PLAYING || PlayerState.isBuffering(_provider.state))) {
            _provider.pause();
        }
        return true;
    }

    private function lock(target:IPlugin, callback:Function):void {
        _controller.lockPlayback(target, callback);
    }

    private function unlock(target:IPlugin):Boolean {
        return _controller.unlockPlayback(target);
    }

    private function setupProvider(item:PlaylistItem):void {
        stopProvider();

        var type:String = JWParser.getProvider(item);
        _provider = getProvider(type);
        if (!_provider) {
            return;
        }
        _provider.initializeMediaProvider(_model.config);
        _provider.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler, false, 0, true);
        _provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_META, metaHandler, false, 0, true);
        _provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL, bufferFullHandler, false, 0, true);
        _provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, timeHandler, false, 0, true);
        _provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, completeHandler, false, 0, true);
        _provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_ERROR, errorHandler, false, 0, true);
    }

    private function showMedia():void {
        if (_provider.display) {
            _mediaLayer.visible = true;
            _mediaLayer.addChild(_provider.display);
            this.resizeHandler();
        } else {
            _mediaLayer.visible = false;
        }
    }

    private function getProvider(type:String):MediaProvider {
        // Only accept video, http or rtmp providers for now
        switch (type) {
            case 'video':
                return new VideoMediaProvider();
            case 'rtmp':
                return new RTMPMediaProvider();
            case 'sound':
                return new SoundMediaProvider();
        }
        // ERROR
        SwfEventRouter.triggerJsEvent('instream:error', {
            message: 'Unsupported Instream Format; only video or rtmp are currently supported'
        });
        return null;
    }

    public function _destroyFromJS():void {
        if (_view.contains(this)) {
            _view.removeChild(this);
        }
        RootReference.stage.removeEventListener(Event.RESIZE, resizeHandler);
        stopProvider();
        _provider = null;
        unlock(_plugin);
    }

    public function setVolume(volume:Number):void {
        if (_provider) {
            _provider.setVolume(volume);
        }
    }

    public function setMute(bool:Boolean):void {
        if (bool && _provider) {
            _provider.setVolume(0);
        }
    }

    private function stopProvider():void {
        if (_provider) {
            _provider.removeEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
            _provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_META, metaHandler);
            _provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL, bufferFullHandler);
            _provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, timeHandler);
            _provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, completeHandler);
            _provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_ERROR, errorHandler);
            if (_provider.state !== PlayerState.IDLE) {
                _provider.stop();
            }
            if (_provider.display && _mediaLayer.contains(_provider.display)) {
                _mediaLayer.addChild(_provider.display);
            }
        }
    }

    private function _lockCallback():void {
        if (_item && (!_provider || _provider.item !== _item)) {
            beginPlayback(_item);
        }
    }

    private function beginPlayback(item:PlaylistItem):void {
        setupProvider(item);
        _provider.load(item);
    }

    private function resizeHandler(evt:Event = null):void {
        var width:Number = RootReference.stage.stageWidth;
        var height:Number = RootReference.stage.stageHeight;
        this.graphics.clear();
        const bgColor:uint = 0x000000;
        const opacity:Number = 1;
        this.graphics.beginFill(bgColor, opacity);
        this.graphics.drawRect(0, 0, width, height);
        this.graphics.endFill();
        if (_provider) {
            _provider.resize(width, height);
        }
    }

    private function stateHandler(evt:PlayerStateEvent):void {
        SwfEventRouter.triggerJsEvent('instream:state', evt);
    }

    private function metaHandler(evt:MediaEvent):void {
        if (evt.metadata.width && evt.metadata.height) {
            showMedia();
        }
    }

    private function bufferFullHandler(evt:MediaEvent):void {
        _provider.play();
        showMedia();
    }

    private function timeHandler(evt:MediaEvent):void {
        SwfEventRouter.triggerJsEvent('instream:time', evt);
        dispatchEvent(evt);
    }

    private function completeHandler(evt:MediaEvent):void {
        SwfEventRouter.triggerJsEvent('instream:complete', evt);
    }

    private function errorHandler(evt:PlayerEvent):void {
        SwfEventRouter.triggerJsEvent('instream:error', evt);
    }
}
}
