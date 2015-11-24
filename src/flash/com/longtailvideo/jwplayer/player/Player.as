package com.longtailvideo.jwplayer.player {
import com.longtailvideo.jwplayer.controller.Controller;
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.events.PlayerEvent;
import com.longtailvideo.jwplayer.model.Model;
import com.longtailvideo.jwplayer.model.PlayerConfig;
import com.longtailvideo.jwplayer.model.PlaylistItem;
import com.longtailvideo.jwplayer.plugins.AbstractPlugin;
import com.longtailvideo.jwplayer.plugins.IPlugin;
import com.longtailvideo.jwplayer.utils.AssetLoader;
import com.longtailvideo.jwplayer.utils.RootReference;
import com.longtailvideo.jwplayer.view.View;

import flash.display.Sprite;
import flash.events.ErrorEvent;
import flash.events.Event;
import flash.geom.Rectangle;
import flash.system.Security;

[SWF(width="640", height="360", frameRate="30", backgroundColor="#000000")]

public class Player extends Sprite implements IPlayer {

    protected var _model:Model;
    protected var _view:View;
    protected var _controller:Controller;

    protected var _instream:InstreamPlayer;

    public function Player() {
        Security.allowDomain("*");

        // Send embedded event so we know flash isn't blocked
        SwfEventRouter.triggerJsEvent('embedded');

        RootReference.init(this);
        this.addEventListener(Event.ADDED_TO_STAGE, stageReady);

        this.tabEnabled = false;
        this.tabChildren = false;
        this.focusRect = false;
        this.buttonMode = true;

        _model = newModel(new PlayerConfig(this.soundTransform));

        _view = newView(_model);
        this.addChild(_view);

        _controller = newController(_model, _view);
        _controller.addEventListener(PlayerEvent.JWPLAYER_READY, playerReady, false, -1);
        _controller.addEventListener(PlayerEvent.JWPLAYER_SETUP_ERROR, setupError, false, -1);

        _controller.runSetupInterface();
    }

    private function pluginPowerSaveTarget():Boolean {
        var audioPlayer:Boolean = RootReference.stage.stageWidth < 6 && RootReference.stage.stageHeight < 6;
        var contentPlayer:Boolean = RootReference.stage.stageWidth > 400 && RootReference.stage.stageHeight > 300;
        if (audioPlayer || contentPlayer) {
            return false;
        }

        return true;
    }

    private function stageReady(e:Event):void {
        this.removeEventListener(Event.ADDED_TO_STAGE, stageReady);

        this.addEventListener('throttle', onThrottleEvent);
        _model.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, removeThrottleListener);

        RootReference.init(this);
        _view.setupView();
    }

    private function onThrottleEvent(e:Event):void {

        // e.state can be ThrottleType.THROTTLE, ThrottleType.PAUSE, or ThrottleType.RESUME
        // in Chrome we only get 'throttle' and 'resume' for offscreen and power-save throttling
        var state:String = e['state'] as String;

        if (state !== 'resume') {
            // Ignore throttle events for players ignored by Chrome's heuristics
            if (! pluginPowerSaveTarget() ) {
                return;
            }
        }

        SwfEventRouter.triggerJsEvent('throttle', {
            state: state
        });
    }

    private function removeThrottleListener(e:MediaEvent):void {
        // After a time event has been received, we're past Chrome Power Save
        // stop listening to the off-screen throttle events
        if (e.position) {
            _model.removeEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, removeThrottleListener);
            if (_instream) {
                _instream.removeEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, removeThrottleListener);
            }
            this.removeEventListener('throttle', onThrottleEvent);
            SwfEventRouter.triggerJsEvent('throttle', {
                state: 'resume'
            });
        }
    }

    public function get version():String {
        return PlayerVersion.version;
    }

    public function get state():String {
        return _model.state;
    }

    public function get config():PlayerConfig {
        return _model.config;
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
        if (_instream) {
            _instream.setVolume(volume);
        }

        return _controller.setVolume(volume);
    }

    public function mute(muted:Boolean):void {
        // Set the models value, and update video provider
        _controller.mute(muted);

        if (_instream) {
            _instream.setMute(muted);
        }
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

    public function getAudioTracks():Array {
        return _model.audioTracks;
    }

    public function getCurrentAudioTrack():Number {
        return _model.currentAudioTrack;
    }

    public function setCurrentAudioTrack(index:Number):void {
        _model.currentAudioTrack = index;
    }

    public function getQualityLevels():Array {
        return _model.qualityLevels;
    }

    public function getCurrentQuality():Number {
        return _model.currentQuality;
    }

    public function setCurrentQuality(index:Number):void {
        _model.currentQuality = index;
    }

    public function setControls(show:Boolean):void {
        _model.controls = show;
    }

    public function getCaptionsList():Array {
        return [];
    }

    public function getCurrentCaptions():Number {
        return 0;
    }

    public function setCurrentCaptions(index:Number):void {}

    public function setSubtitlesTrack(index:Number):void {
        _model.currentSubtitlesTrack = index - 1;
    }

    public function getSafeRegion():Rectangle {
        return _view.getSafeRegion();
    }

    public function getItem():PlaylistItem {
        return _model.item;
    }

    public function init(item:*):void {
        _controller.init(new PlaylistItem(item));
    }

    public function load(item:*):Boolean {
        _controller.load(new PlaylistItem(item));
        _controller.play();

        return true;
    }

    protected function setupPlayer(config:Object):void {
        delete config.playlist;

        _model.setConfig(config);

        // do it a second time
        _controller.runSetupPlugins(function():void {
            SwfEventRouter.triggerJsEvent('pluginsLoaded');
        });
    }

    protected function setupPlayerCommandQueue(commands:Array):void {
        _controller.removeEventListener(PlayerEvent.JWPLAYER_SETUP_ERROR, setupError);

        // run this once setup is complete (plugins are loaded)
        for (var i:uint = 0; i < commands.length; i++) {
            var args:Array = commands[i] as Array;
            SwfEventRouter.trigger(args);
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
        // Send embedded event so we know flash isn't blocked
        SwfEventRouter.triggerJsEvent('embedded');

        // Only handle Setup Events once
        _controller.removeEventListener(PlayerEvent.JWPLAYER_READY, playerReady);

        // Forward all MVC events
        _model.addGlobalListener(globalHandler);
        _controller.addGlobalListener(globalHandler);
        _view.addEventListener(ErrorEvent.ERROR, globalHandler);

        // listen to JavaScript for player commands
        SwfEventRouter.off()
                .on('setup', setupPlayer)
                .on('setupCommandQueue', setupPlayerCommandQueue)
                .on('init', init)
                .on('load', load)
                .on('play', play)
                .on('pause', pause)
                .on('stop', stop)
                .on('seek', seek)
                .on('fullscreen', fullscreen)
                .on('mute', mute)
                .on('volume', volume)
                .on('setControls', setControls)
                .on('stretch', stretch)
                .on('setCurrentQuality', setCurrentQuality)
                .on('setSubtitlesTrack', setSubtitlesTrack)
                .on('setCurrentAudioTrack', setCurrentAudioTrack)
                .on('loadXml', loadXml)
                .on('instream:init', initInstream)
                .on('instream:load', loadInstream)
                .on('instream:play', playInstream)
                .on('instream:pause', pauseInstream)
                .on('instream:destroy', destroyInstream);

        // Send ready event to browser
        SwfEventRouter.triggerJsEvent('ready');
    }

    protected function initInstream():void {
        var lockPlugin:IPlugin = new AbstractPlugin();
        _instream = new InstreamPlayer(lockPlugin, _model, _view, _controller);
        _instream.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, removeThrottleListener, false, 0, true);
    }

    protected function loadInstream(item:Object):void {
        if (!_instream) {
            return;
        }
        _instream.loadItem(item);
    }

    protected function playInstream():void {
        if (!_instream) {
            return;
        }
        _instream.play();
    }

    protected function pauseInstream():void {
        if (!_instream) {
            return;
        }
        _instream.pause();
    }

    protected function destroyInstream():void {
        if (!_instream) {
            return;
        }
        _instream._destroyFromJS();
        _instream = null;
    }

    protected function globalHandler(event:Event):void {
        // forward event to JavaScript
        SwfEventRouter.triggerJsEvent(event.type, event);
        // forward event to Flash plugins
        dispatchEvent(event);
    }

    protected function setupError(evt:PlayerEvent):void {
        // Send embedded event so we know flash isn't blocked
        SwfEventRouter.triggerJsEvent('embedded');

        // Only handle Setup Events once
        _controller.removeEventListener(PlayerEvent.JWPLAYER_READY, playerReady);
        _controller.removeEventListener(PlayerEvent.JWPLAYER_SETUP_ERROR, setupError);

        // Send Setup Error to browser
        SwfEventRouter.error(0, evt.message);
    }

    private function loadXml(url:String, success:String, failure:String):void {
        CONFIG::debugging {
            trace('loadXML', url, success, failure);
        }
        var loader:AssetLoader = new AssetLoader();
        loader.addEventListener(Event.COMPLETE, function(evt:Event):void {
            var data:String = loader.loadedObject;
            SwfEventRouter.triggerJsEvent(success, data);
        });
        loader.addEventListener(ErrorEvent.ERROR, function(evt:ErrorEvent):void {
            SwfEventRouter.triggerJsEvent(failure, 'VAST could not be loaded');
        });
        loader.load(url);
    }
}
}