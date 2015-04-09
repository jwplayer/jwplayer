package com.longtailvideo.jwplayer.player {
import com.longtailvideo.jwplayer.controller.Controller;
import com.longtailvideo.jwplayer.events.CaptionsEvent;
import com.longtailvideo.jwplayer.events.PlayerEvent;
import com.longtailvideo.jwplayer.model.Model;
import com.longtailvideo.jwplayer.model.PlayerConfig;
import com.longtailvideo.jwplayer.model.PlaylistItem;
import com.longtailvideo.jwplayer.plugins.IPlugin;
import com.longtailvideo.jwplayer.utils.RootReference;
import com.longtailvideo.jwplayer.view.View;

import flash.display.Sprite;
import flash.events.ErrorEvent;
import flash.events.Event;
import flash.geom.Rectangle;
import flash.system.Security;

[SWF(width="640", height="360", frameRate="60", backgroundColor="#000000")]

// TODO: extend BasePlayer which implements IPlayer, so main class just does Setup
public class Player extends Sprite implements IPlayer {

    protected var _config:PlayerConfig;
    protected var _model:Model;
    protected var _view:View;
    protected var _controller:Controller;

    public function Player() {
        Security.allowDomain("*");

        RootReference.init(this);
        this.addEventListener(Event.ADDED_TO_STAGE, stageReady);
        this.tabEnabled = false;
        this.tabChildren = false;
        this.focusRect = false;
        this.mouseEnabled = false;
        this.mouseChildren = false;

        _config = new PlayerConfig();

        _model = newModel(_config);

        _view = newView(_model);
        _view.addEventListener(CaptionsEvent.JWPLAYER_CAPTIONS_CHANGED, _captionsChanged);
        _view.addEventListener(CaptionsEvent.JWPLAYER_CAPTIONS_LIST, _captionsList);

        _controller = newController(_model, _view);
        _controller.addEventListener(PlayerEvent.JWPLAYER_READY, playerReady, false, -1);
        _controller.addEventListener(PlayerEvent.JWPLAYER_SETUP_ERROR, setupError, false, -1);

        _controller.setupPlayer();
    }

    private function stageReady(e:Event):void {
        this.removeEventListener(Event.ADDED_TO_STAGE, stageReady);
        RootReference.init(this);
        _view.setupView();
    }

    public function get version():String {
        return PlayerVersion.version;
    }

    public function get state():String {
        return _model.state;
    }

    public function get locked():Boolean {
        return _controller.locking;
    }

    public function lock(target:IPlugin, callback:Function):void {
        _controller.lockPlayback(target, callback);
    }

    public function unlock(target:IPlugin):Boolean {
        return _controller.unlockPlayback(target);
    }

    public function volume(volume:Number):Boolean {
        return _controller.setVolume(volume);
    }

    public function mute(state:Boolean):void {
        _controller.mute(state);
    }

    public function play():Boolean {
        return _controller.play();
    }

    public function pause():Boolean {
        return _controller.pause();
    }

    public function stop():Boolean {
        return _controller.stop();
    }

    public function seek(position:Number):Boolean {
        return _controller.seek(position);
    }

    public function redraw():Boolean {
        return _controller.redraw();
    }

    public function fullscreen(on:Boolean):void {
        _controller.fullscreen(on);
    }

    public function setupInstream(target:IPlugin):IInstreamPlayer {
        return new InstreamPlayer(target, _model, _view, _controller);
    }

    public function getAudioTracks():Array {
        return _model.media ? _model.media.audioTracks : null;
    }

    public function getCurrentAudioTrack():Number {
        return _model.media ? _model.media.currentAudioTrack : NaN;
    }

    public function setCurrentAudioTrack(index:Number):void {
        if (_model.media) _model.media.currentAudioTrack = index;
    }

    public function getQualityLevels():Array {
        return _model.media ? _model.media.qualityLevels : null;
    }

    public function getCurrentQuality():Number {
        return _model.media ? _model.media.currentQuality : NaN;
    }

    public function setCurrentQuality(index:Number):void {
        if (_model.media) _model.media.currentQuality = index;
    }

    public function getCaptionsList():Array {
        return [];
    }

    public function getCurrentCaptions():Number {
        return 0;
    }

    public function setCurrentCaptions(index:Number):void {

    }

    public function getSafeRegion():Rectangle {
        return _view.getBounds(RootReference.root);
    }

    public function load(item:*):Boolean {
        _controller.load(new PlaylistItem(item));
        _controller.play();

        return true;
    }

    protected function setupPlayer(config:Object):void {
        var commands:Array = config.commands as Array;
        delete config.commands;

        _model.setConfig(config);

        for (var i:uint = 0; i < commands.length; i++) {
            var args:Array = commands[i] as Array;
            var name:String = args.shift() as String;
            var fn:Function = this[name] as Function;
            if (!fn) {
                throw new Error('unknown command:', name);
            }
            fn.apply(this, args);
        }
    }

    protected function stretch(stretch:String = null):void {
        _model.stretching = stretch;
    }

    protected function newModel(config:PlayerConfig):Model {
        return new Model(config);
    }

    protected function newView(model:Model):View {
        return new View(model);
    }

    protected function newController(model:Model, view:View):Controller {
        return new Controller(this, model, view);
    }

    protected function playerReady(evt:PlayerEvent):void {
        // Only handle Setup Events once
        _controller.removeEventListener(PlayerEvent.JWPLAYER_READY, playerReady);
        _controller.removeEventListener(PlayerEvent.JWPLAYER_SETUP_ERROR, setupError);

        // Forward all MVC events
        _model.addGlobalListener(globalHandler);
        _controller.addGlobalListener(globalHandler);
        _view.addEventListener(ErrorEvent.ERROR, globalHandler);

        // listen to JavaScript for player commands
        SwfEventRouter
                .on('setup', setupPlayer)
                .on('load', load)
                .on('play', play)
                .on('pause', pause)
                .on('stop', stop)
                .on('seek', seek)
                .on('fullscreen', fullscreen)
                .on('mute', mute)
                .on('volume', volume)
                .on('stretch', stretch)
                .on('quality', setCurrentQuality);

        // Send ready event to browser
        SwfEventRouter.triggerJsEvent('ready');
    }


    protected function globalHandler(event:Event):void {
        // forward event to JavaScript
        SwfEventRouter.triggerJsEvent(event.type, event);
        // forward event to Flash plugins
        dispatchEvent(event);
    }

    protected function setupError(evt:PlayerEvent):void {
        // Only handle Setup Events once
        _controller.removeEventListener(PlayerEvent.JWPLAYER_READY, playerReady);
        _controller.removeEventListener(PlayerEvent.JWPLAYER_SETUP_ERROR, setupError);

        // Send Setup Error to browser
        SwfEventRouter.error(0, evt.message);
    }

    protected function _captionsChanged(evt:CaptionsEvent):void {
        if (_model.media) {
            _model.media.currentSubtitlesTrack = evt.currentTrack - 1;
        }
    }

    protected function _captionsList(evt:CaptionsEvent):void {
        if (_model.media) {
            _model.media.currentSubtitlesTrack = evt.currentTrack - 1;
        }
    }
}
}