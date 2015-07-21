package com.longtailvideo.jwplayer.model {
import com.longtailvideo.jwplayer.player.PlayerVersion;
import com.longtailvideo.jwplayer.plugins.PluginConfig;
import com.longtailvideo.jwplayer.utils.Logger;
import com.longtailvideo.jwplayer.utils.RootReference;
import com.longtailvideo.jwplayer.utils.Stretcher;

import flash.events.EventDispatcher;
import flash.media.SoundTransform;
import flash.ui.Mouse;
import flash.ui.MouseCursor;
import flash.utils.getQualifiedClassName;

public dynamic class PlayerConfig extends EventDispatcher {

    protected var _debug:String = Logger.NONE;
    protected var _id:String = "";
    protected var _stretching:String = Stretcher.UNIFORM;
    protected var _fullscreen:Boolean = false;
    protected var _plugins:Array = [];
    protected var _pluginConfig:Object = {};

    protected var _soundTransform:SoundTransform;
    protected var _volume:Number = 0.9;
    protected var _controls:Boolean = true;

    public var captionLabel:String;
    public var qualityLabel:String;

    public function PlayerConfig(soundTransform:SoundTransform) {
        _soundTransform = soundTransform;
        _soundTransform.volume = _volume;
    }

    public function get soundTransform():SoundTransform {
        return _soundTransform;
    }

    public function get volume():Number {
        return _soundTransform.volume * 100;
    }

    public function set volume(vol:Number):void {
        if (isNaN(vol)) {
            return;
        }
        vol /= 100;
        _volume = vol;
        _soundTransform.volume = vol;
    }

    public function get mute():Boolean {
        return _soundTransform.volume === 0;
    }

    public function set mute(muted:Boolean):void {
        _soundTransform.volume = muted ? 0 : _volume;
    }

    public function get fullscreen():Boolean {
        return _fullscreen;
    }

    public function set fullscreen(fs:Boolean):void {
        _fullscreen = fs;
    }

    public function get width():Number {
        if (RootReference.stage) {
            return RootReference.stage.stageWidth;
        }
        return 0;
    }

    public function get height():Number {
        if (RootReference.stage) {
            return RootReference.stage.stageHeight;
        }
        return 0;
    }

    public function set width(w:Number):void {
    }

    public function set height(h:Number):void {
    }

    public function get stretching():String {
        return _stretching;
    }

    public function set stretching(mode:String):void {
        mode = mode.toLowerCase();
        switch (mode) {
            case Stretcher.EXACTFIT:
            case Stretcher.FILL:
            case Stretcher.NONE:
            case Stretcher.UNIFORM:
                _stretching = mode;
                return;
        }
        _stretching = Stretcher.UNIFORM;
    }

    public function get plugins():Array {
        return _plugins;
    }

    public function set plugins(value:Array):void {
        _plugins = value;
    }

    public function get id():String {
        return _id;
    }

    public function set id(playerId:String):void {
        PlayerVersion.id = _id = playerId;
    }

    public function get debug():String {
        return _debug;
    }

    public function set debug(value:String):void {
        if (value != "0") {
            _debug = value;
        }
    }

    /** DEPRICATED METHODS - KEEPING FOR LEGACY PROVIDER SUPPORT **/

    public function get singleItem():PlaylistItem {
        return new PlaylistItem();
    }

    public function get playlist():String {
        return '';
    }

    public function set playlist(x:String):void {
    }

    public function get description():String {
        return '';
    }

    public function get duration():String {
        return '';
    }

    public function get file():String {
        return '';
    }

    public function get image():String {
        return '';
    }

    public function get mediaid():String {
        return '';
    }

    public function get start():String {
        return '';
    }

    public function get streamer():String {
        return '';
    }

    public function get title():String {
        return '';
    }

    public function get provider():String {
        return '';
    }

    public function get type():String {
        return '';
    }

    public function get playlistposition():String {
        return 'none';
    }

    public function set playlistposition(x:String):void {
    }

    public function get playlistsize():String {
        return '0';
    }

    public function set playlistsize(x:String):void {
    }

    public function get playlistlayout():String {
        return '';
    }

    public function set playlistlayout(x:String):void {
    }

    public function get skin():String {
        return '';
    }

    public function set skin(x:String):void {
    }

    public function get autostart():Boolean {
        return false;
    }

    public function set autostart(x:Boolean):void {
    }

    public function get repeat():Boolean {
        return false;
    }

    public function set repeat(x:*):void {
    }

    public function get controls():Boolean {
        return _controls;
    }

    public function set controls(show:Boolean):void {
        _controls = show;
        Mouse.cursor = (_controls) ? MouseCursor.BUTTON : MouseCursor.AUTO;
    }

    public function setConfig(config:Object):void {
        // add dynamic properties from js config
        for (var key:String in config) {
            // exclude builtin properties
            if (!this.hasOwnProperty(key)) {
                this[key] = config[key];
            }
        }

        // make sure these setters are invoked
        this.id = config.id;
        this.debug = config.debug;
        this.volume = config.volume;
        this.mute = config.mute;
        this.controls = config.controls;

        if (config.stretching) {
            this.stretching = config.stretching;
        }

        this.plugins = config.flashPlugins;

        this.captionLabel = config.captionLabel;
        this.qualityLabel = config.qualityLabel;
    }

    /** Returns a PluginConfig containing plugin configuration information **/
    public function pluginConfig(pluginId:String):PluginConfig {
        pluginId = pluginId.toLowerCase();
        var pluginConfig:PluginConfig = _pluginConfig[pluginId] as PluginConfig;
        if (pluginConfig) {
            return pluginConfig;
        }
        var plugin:Object;
        for (var i:uint = _plugins.length; i--;) {
            if (_plugins[i].name === pluginId) {
                plugin = _plugins[i];
                break;
            }
        }
        if (plugin && getQualifiedClassName(plugin) === 'Object') {
            pluginConfig = new PluginConfig(pluginId, plugin);
        } else {
            pluginConfig = new PluginConfig(pluginId);
        }
        _pluginConfig[pluginId] = pluginConfig;
        return pluginConfig;
    }

}
}