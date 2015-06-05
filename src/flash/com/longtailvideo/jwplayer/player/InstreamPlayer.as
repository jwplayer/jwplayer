package com.longtailvideo.jwplayer.player {
import com.longtailvideo.jwplayer.controller.Controller;
import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
import com.longtailvideo.jwplayer.events.InstreamEvent;
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.events.PlayerEvent;
import com.longtailvideo.jwplayer.events.PlayerStateEvent;
import com.longtailvideo.jwplayer.media.MediaProvider;
import com.longtailvideo.jwplayer.media.RTMPMediaProvider;
import com.longtailvideo.jwplayer.media.SoundMediaProvider;
import com.longtailvideo.jwplayer.media.VideoMediaProvider;
import com.longtailvideo.jwplayer.model.IInstreamOptions;
import com.longtailvideo.jwplayer.model.InstreamOptions;
import com.longtailvideo.jwplayer.model.Model;
import com.longtailvideo.jwplayer.model.PlayerConfig;
import com.longtailvideo.jwplayer.model.PlaylistItem;
import com.longtailvideo.jwplayer.parsers.JWParser;
import com.longtailvideo.jwplayer.plugins.IPlugin;
import com.longtailvideo.jwplayer.utils.RootReference;
import com.longtailvideo.jwplayer.utils.Stretcher;
import com.longtailvideo.jwplayer.view.View;

import flash.display.Sprite;
import flash.events.Event;
import flash.geom.Rectangle;
import flash.utils.setTimeout;

public class InstreamPlayer extends GlobalEventDispatcher implements IInstreamPlayer, IPlayer {

    public static const UNSUPPORTED_ERROR:String = "Unsupported IPlayer method in InstreamPlayer";
    // Player's MVC

    public function InstreamPlayer(target:IPlugin, model:Model, view:View, controller:Controller) {

        _plugin = target;
        _model = model;
        _controller = controller;
        _view = view;

        if (!target || !model || !view || !controller) {
            throw new ArgumentError("InstreamPlayer must be initialized with non-null arguments");
        }

        lock(_plugin, _lockCallback);

        initializeLayers();

        RootReference.stage.addEventListener(Event.RESIZE, resizeHandler);

        _setupView();

        //default options
        _options = new InstreamOptions();
    }
    public var jsListeners:Object = {};
    protected var _model:Model;
    protected var _view:View;
    protected var _controller:Controller;
    protected var _item:PlaylistItem;
    protected var _options:IInstreamOptions;
    protected var _provider:MediaProvider;
    protected var _plugin:IPlugin;
    protected var _instreamDisplay:Sprite;
    protected var _mediaLayer:Sprite;
    protected var _mediaDisplayed:Boolean = false;
    protected var _viewSetup:Boolean = false;
    protected var _playerLocked:Boolean = false;

    public function get state():String {
        return this.getState();
    }

    public function get position():Number {
        return this.getPosition();
    }

    public function get version():String {
        return PlayerVersion.version;
    }

    public function get config():PlayerConfig {
        return _model.config;
    }

    public function get locked():Boolean {
        return _controller.locking;
    }

    public function loadItem(item:Object, options:Object = null):void {
        _options.update(options);
        _item = new PlaylistItem(item);
        if (_playerLocked) {
            beginPlayback(_item);
        }
    }

    public function getItem():PlaylistItem {
        return _item;
    }

    public function getOptions():IInstreamOptions {
        return _options;
    }

    public function play():Boolean {
        _setupView();
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
        if (_provider && _provider.state == PlayerState.PLAYING || PlayerState.isBuffering(_provider.state)) {
            _provider.pause();
        }
        return true;
    }

    public function seek(position:Number):Boolean {
        if (_provider && _provider.state != PlayerState.IDLE) {
            var newEvent:MediaEvent = new MediaEvent(MediaEvent.JWPLAYER_MEDIA_SEEK);
            newEvent.position = _provider.position;
            newEvent.offset = position;
            dispatchEvent(newEvent);
            _provider.seek(position);
        }
        return true;
    }

    public function destroy():void {
        _destroy();
    }

    public function hide():void {
        removeEventListeners();
        _view.hideInstream();
    }

    public function getState():String {
        return (_provider ? _provider.state : PlayerState.IDLE);
    }

    public function getPosition():Number {
        return _provider.position;
    }

    public function getDuration():Number {
        return _item.duration;
    }

    public function lock(target:IPlugin, callback:Function):void {
        _controller.lockPlayback(target, callback);
    }

    public function unlock(target:IPlugin):Boolean {
        _playerLocked = false;
        return _controller.unlockPlayback(target);
    }

    public function getSafeRegion():Rectangle {
        return _view.getBounds(RootReference.root);
    }

    public function volume(volume:Number):Boolean {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function mute(state:Boolean):void {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function stop():Boolean {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function load(item:*):Boolean {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function fullscreen(on:Boolean):void {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function setupInstream(target:IPlugin):IInstreamPlayer {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function getQualityLevels():Array {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function getCurrentQuality():Number {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function setCurrentQuality(index:Number):void {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function getAudioTracks():Array {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function getCurrentAudioTrack():Number {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function setCurrentAudioTrack(index:Number):void {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function getCaptionsList():Array {
        throw new Error(UNSUPPORTED_ERROR);
    }

    /**************** IPLAYER METHODS *************/
    /**  These methods should only be called by  **/
    /**  internal player methods                 **/
    /**********************************************/

    public function getCurrentCaptions():Number {
        throw new Error(UNSUPPORTED_ERROR);
    }

    public function setCurrentCaptions(index:Number):void {
        throw new Error(UNSUPPORTED_ERROR);
    }

    protected function setupProvider(item:PlaylistItem):void {
        setProvider(item);
        _provider.initializeMediaProvider(_model.config);
        _provider.addGlobalListener(eventForwarder);
        _provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_ERROR, _errorHandler);
        _provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL, bufferFullHandler);
        _provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
        _provider.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
        _provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_META, metaHandler);
    }

    protected function showMedia():void {
        if (!_mediaDisplayed) {
            _mediaDisplayed = true;
            if (_provider.display) {
                _mediaLayer.visible = true;
                _mediaLayer.addChild(_provider.display);
            } else {
                _mediaLayer.visible = false;
            }
        }
    }

    protected function initializeLayers():void {
        _instreamDisplay = new Sprite();
        _mediaLayer = new Sprite();

        _instreamDisplay.addChild(_mediaLayer);
    }

    protected function setProvider(item:PlaylistItem):void {
        /* Only accept video, http or rtmp providers for now */
        _provider = getProvider(JWParser.getProvider(item));
    }

    protected function getProvider(type:String):MediaProvider {
        switch (type) {
            case 'rtmp':
                return new RTMPMediaProvider(false);
            case 'video':
                return new VideoMediaProvider(false);
            case 'sound':
                return new SoundMediaProvider();
        }
        throw new Error("Unsupported Instream Format; only video or rtmp are currently supported");
    }

    /********** UNSUPPORTED IPLAYER METHODS *******/
    /**    These methods should not be called    **/
    /**********************************************/

    protected function _setupView():void {
        if (!_viewSetup) {
            _view.setupInstream(this, _instreamDisplay, _plugin);
            _viewSetup = true;
        }
    }

    protected function _destroy(complete:Boolean = false):void {
        removeEventListeners();
        if (!complete && _provider && _provider.state != PlayerState.IDLE) {
            _provider.stop();
        }
        _view.destroyInstream();
        _provider = null;

        unlock(_plugin);
        dispatchEvent(new InstreamEvent(InstreamEvent.JWPLAYER_INSTREAM_DESTROYED, complete ? "complete" : "destroy"));
    }

    protected function removeEventListeners():void {
        RootReference.stage.removeEventListener(Event.RESIZE, resizeHandler);

        if (_provider) {
            _provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_ERROR, _errorHandler);
            _provider.removeEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
            _provider.removeGlobalListener(eventForwarder);
            _provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL, bufferFullHandler);
            _provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
            _provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_META, metaHandler);
        }
    }

    private function _lockCallback():void {
        _playerLocked = true;
        if (_item && (!_provider || _provider.item !== _item)) {
            beginPlayback(_item);
        }
    }

    private function beginPlayback(item:PlaylistItem):void {
        setupProvider(item);
        _provider.load(item);
    }

    protected function skipAd(event:Event):void {
        destroy();
    }

    protected function _completeHandler(evt:MediaEvent):void {
        dispatchEvent(new Event(Event.COMPLETE));
        setTimeout(function ():void {
            _destroy(evt ? true : false);
        }, 0);
    }

    protected function resizeHandler(event:Event):void {
        var width:Number = RootReference.stage.stageWidth;
        var height:Number = RootReference.stage.stageHeight;
        _instreamDisplay.graphics.clear();
        _instreamDisplay.graphics.beginFill(0, 0);
        _instreamDisplay.graphics.drawRect(0, 0, width, height);
        _instreamDisplay.graphics.endFill();
        if (_provider) {
            _provider.resize(width, height);
        }
    }

    private function stateHandler(evt:PlayerStateEvent):void {
        switch (evt.newstate) {
            case PlayerState.PLAYING:
                break;
            case PlayerState.PAUSED:
                break;
        }
    }

    private function bufferFullHandler(evt:MediaEvent):void {
        _provider.play();
        if (!_mediaDisplayed && (_model.stretching == Stretcher.EXACTFIT || _provider is SoundMediaProvider)) {
            showMedia();
        }
    }

    private function metaHandler(evt:MediaEvent):void {
        if (evt.metadata.width && evt.metadata.height) { //_provider sound
            showMedia();
        }
    }

    private function eventForwarder(evt:Event):void {
        dispatchEvent(evt);
    }

    private function _errorHandler(evt:PlayerEvent):void {
        if (evt.type == MediaEvent.JWPLAYER_MEDIA_ERROR) {
            // Translate media error into player error.
            dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_ERROR, (evt as MediaEvent).message));
        } else {
            dispatchEvent(evt);
        }
        _destroy();
    }
}
}