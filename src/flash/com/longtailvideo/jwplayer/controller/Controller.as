package com.longtailvideo.jwplayer.controller {
import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.events.PlayerEvent;
import com.longtailvideo.jwplayer.model.Model;
import com.longtailvideo.jwplayer.model.PlaylistItem;
import com.longtailvideo.jwplayer.player.IPlayer;
import com.longtailvideo.jwplayer.player.PlayerState;
import com.longtailvideo.jwplayer.plugins.IPlugin;
import com.longtailvideo.jwplayer.utils.Logger;
import com.longtailvideo.jwplayer.view.View;

import flash.events.ErrorEvent;
import flash.events.Event;

/**
 * Sent when the player has been initialized and skins and plugins have been successfully loaded.
 *
 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_READY
 */
[Event(name="jwplayerReady", type="com.longtailvideo.jwplayer.events.PlayerEvent")]

/**
 * Sent when the player has entered the ERROR state
 *
 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_ERROR
 */
[Event(name="jwplayerError", type="com.longtailvideo.jwplayer.events.PlayerEvent")]

/**
 * Sent when the player has been locked
 *
 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_LOCKED
 */
[Event(name="jwplayerLocked", type="com.longtailvideo.jwplayer.events.PlayerEvent")]

/**
 * Sent when the player has been unlocked
 *
 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_UNLOCKED
 */
[Event(name="jwplayerUnlocked", type="com.longtailvideo.jwplayer.events.PlayerEvent")]

/**
 * Sent when the player has gone into or out of fullscreen mode
 *
 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_FULLSCREEN
 */
[Event(name="jwplayerFullscreen", type="com.longtailvideo.jwplayer.events.PlayerEvent")]

public class Controller extends GlobalEventDispatcher {

    /** MVC References **/
    protected var _player:IPlayer;
    protected var _model:Model;
    protected var _view:View;
    /** Setup completed **/
    protected var _setupComplete:Boolean = false;
    /** Setup finalized **/
    protected var _setupFinalized:Boolean = false;
    /** Whether to autostart on unlock **/
    protected var _unlockAutostart:Boolean = false;
    /** Whether to resume on unlock **/
    protected var _lockingResume:Boolean = false;
    /** Lock manager **/
    protected var _lockManager:LockManager;
    /** Load after unlock - My favorite variable ever **/
    protected var _unlockAndLoad:Boolean;
    /** The lock swallowed the complete action; we should go to the next playlist item if necessary **/
    protected var _completeOnUnlock:Boolean;
    /** Set this value if a seek request comes in before the seek is possible **/
    protected var _queuedSeek:Number = -1;
    /** Saving whether a seek was sent on idle. **/
    protected var _idleSeek:Number = -1;
    /** Set this to true if play should be interrupted after onBeforePlay propagates. **/
    protected var _interruptPlay:Boolean = false;
    /** This is set to true while the onBeforePlay event is propagating **/
    protected var _preplay:Boolean = false;

    public function Controller(player:IPlayer, model:Model, view:View) {
        _player = player;
        _model = model;
        _view = view;
        _lockManager = new LockManager();
    }

    public function get locking():Boolean {
        return _lockManager.locked();
    }

    public function setupPlayer():void {
        var setup:PlayerSetup = new PlayerSetup(_player, _model, _view);

        setup.addEventListener(Event.COMPLETE, setupComplete);
        setup.addEventListener(ErrorEvent.ERROR, setupError);

        setup.setupPlayer();
    }

    public function lockPlayback(plugin:IPlugin, callback:Function):void {
        var wasLocked:Boolean = locking;

        _lockManager.lock(plugin, callback);

        // If it was playing, pause playback and plan to resume when you're done
        if (_player.state == PlayerState.PLAYING || _player.state == PlayerState.BUFFERING || _preplay) {
            if (!_preplay) {
                _model.media.pause();
            }
            _lockingResume = true;
        }
        _interruptPlay = _preplay;


        // Tell everyone you're locked
        if (!wasLocked) {
            Logger.log(plugin.id + " locking playback", "LOCK");
            dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_LOCKED));
            _lockManager.executeCallback();
        }
    }

    public function unlockPlayback(target:IPlugin):Boolean {
        if (_lockManager.unlock(target)) {
            if (!locking) {
                dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_UNLOCKED));
            }
            if (_setupComplete && !_setupFinalized) {
                finalizeSetup();
            }
            if (!locking) {
                if (_completeOnUnlock) {
                    _completeOnUnlock = false;
                    completeHandler();
                    _interruptPlay = false;
                    return true;
                } else if (_unlockAndLoad) {
                    load(_model.item);
                    _unlockAndLoad = false;
                }
                if (_lockingResume || _unlockAutostart) {
                    _lockingResume = false;
                    play();
                    if (_unlockAutostart) {
                        _unlockAutostart = false;
                    }
                }
                _interruptPlay = false;
                return true;
            }
        }
        return false;
    }

    public function setVolume(vol:Number):Boolean {
        if (_model.media) {
            mute(false);
            _model.volume = vol;
            return true;
        }
        return false;
    }

    public function mute(muted:Boolean):Boolean {
        if (muted !== _model.mute) {
            _model.mute = muted;
            return true;
        }
        return false;
    }

    public function play():Boolean {
        if (locking || _player.state == PlayerState.PLAYING || _player.state == PlayerState.BUFFERING) {
            return false;
        }

        if (!_preplay) {
            _preplay = true;
            dispatchEvent(new MediaEvent(MediaEvent.JWPLAYER_MEDIA_BEFOREPLAY));
            _preplay = false;
            if (_interruptPlay) {
                _interruptPlay = false;
                return false;
            }
        }

        if (!_model.item) {
            Logger.log("Attempted to begin playback before loading item");
            return false;
        }
        switch (_player.state) {
            case PlayerState.IDLE:
                _model.media.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL, bufferFullHandler);
                _model.media.load(_model.item);
                break;
            case PlayerState.PAUSED:
                if (_queuedSeek >= 0) {
                    _model.media.seek(_queuedSeek);
                    _queuedSeek = -1;
                } else {
                    _model.media.play();
                }
                break;
        }
        return true;
    }

    public function pause():Boolean {
        if (!locking && _model.media) {
            switch (_model.media.state) {
                case PlayerState.PLAYING:
                case PlayerState.BUFFERING:
                    _model.media.pause();
                    return true;
                default:
                    _interruptPlay = _preplay;
            }
        }
        return false;
    }

    public function stop():Boolean {
        if (!locking && _model.media) {
            _interruptPlay = _preplay;
            switch (_model.media.state) {
                case PlayerState.PLAYING:
                case PlayerState.BUFFERING:
                case PlayerState.PAUSED:
                    _model.media.stop();
                    return true;
            }
        }
        return false;
    }

    public function seek(pos:Number):Boolean {
        if (!locking && pos !== -1 && _model.media) {
            switch (_model.media.state) {
                case PlayerState.IDLE:
                    _model.item.start = pos;
                    _idleSeek = pos;
                    return true;
                case PlayerState.PAUSED:
                case PlayerState.PLAYING:
                case PlayerState.BUFFERING:
                    if (_model.media.canSeek) {
                        _model.seek(pos);
                        return true;
                    }
                    _queuedSeek = pos;
            }
        }
        return false;
    }

    public function load(item:PlaylistItem):Boolean {
        if (locking) {
            _unlockAndLoad = true;
            return false;
        }

        if (_model.item && _model.item.file === item.file) {
            // resume current item
            _model.item.start = item.start;
            _model.item.starttime = item.starttime;
            return false;
        }

        // new item to load
        _model.item = item;

        return true;
    }

    public function redraw():Boolean {
        if (locking) {
            return false;
        }
        _view.redraw();
        return true;
    }

    public function fullscreen(mode:Boolean):Boolean {
        if (mode != _model.fullscreen) {
            _model.fullscreen = mode;
            _view.fullscreen(mode);
            dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_FULLSCREEN, mode.toString()));
            return true;
        } else {
            return false;
        }
    }

    public function checkBeforePlay():Boolean {
        return _preplay;
    }

    protected function finalizeSetup():void {
        if (!locking && _setupComplete && !_setupFinalized) {
            _setupFinalized = true;

            _player.addEventListener(ErrorEvent.ERROR, errorHandler);

            _model.addEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, completeHandler, false);
            _model.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, timeHandler);

            // setup listeners so playlist loaded can be dispatched (ready will be forwarded asynchronously)
            dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_READY));
        }
    }

    protected function errorState(message:String = ""):void {
        dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_ERROR, message));
    }

    protected function setupComplete(evt:Event):void {
        _setupComplete = true;
        finalizeSetup();
    }

    protected function setupError(evt:ErrorEvent):void {
        Logger.log("STARTUP: Error occurred during player startup: " + evt.text);
        dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_SETUP_ERROR, evt.text));
    }

    protected function errorHandler(evt:ErrorEvent):void {
        errorState(evt.text);
    }

    protected function completeHandler(evt:MediaEvent = null):void {
        if (locking) {
            _completeOnUnlock = true;
            return;
        }
    }

    private function bufferFullHandler(evt:MediaEvent):void {
        if (!locking) {
            if (_queuedSeek >= 0) {
                _model.media.seek(_queuedSeek);
                _queuedSeek = -1;
            } else {
                _model.media.play();
            }
        } else {
            _lockingResume = true;
        }
    }

    private function timeHandler(evt:MediaEvent):void {
        if (_idleSeek > 0 && evt.position >= _idleSeek) {
            _model.item.start = 0;
            _idleSeek = -1;
        }
    }
}
}