package com.longtailvideo.jwplayer.model {
import com.longtailvideo.jwplayer.player.PlayerVersion;
import com.longtailvideo.jwplayer.plugins.PluginConfig;
import com.longtailvideo.jwplayer.utils.Logger;
import com.longtailvideo.jwplayer.utils.RootReference;

import flash.events.EventDispatcher;
import flash.media.SoundTransform;
import flash.utils.getQualifiedClassName;

public dynamic class PlayerConfig extends EventDispatcher {

    protected var _debug:String = Logger.NONE;
    protected var _id:String = "";
    protected var _stretching:String = "uniform";
    protected var _fullscreen:Boolean = false;
    protected var _plugins:String = "";
    protected var _pluginConfig:Object = {};

    protected var _soundTransform:SoundTransform;
    protected var _volume:Number = 0.9;

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

    public function set width(w:Number):void {}

    public function set height(h:Number):void {}

    public function get stretching():String {
        return _stretching;
    }

    public function set stretching(mode:String):void {
        _stretching = mode ? mode.toLowerCase() : "";
    }

    public function get plugins():String {
        return _plugins;
    }

    public function set plugins(x:String):void {
        _plugins = x;
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

    /** A list of available pluginConfig keys. **/
    public function get pluginIds():Array {
        var names:Array = [];

        // Only include loaded plugins
        for each (var lp:String in _plugins.split(",")) {
            var plugName:String = (lp.substr(lp.lastIndexOf("/") + 1).replace(/(.*)\.swf$/i, "$1").split("-")[0] as String).toLowerCase();
            if (plugName) {
                names.push(plugName);
            }
        }

        return names;
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
        return true;
    }

    public function set controls(x:Boolean):void {
    }

    public function setConfig(config:Object):void {
        this.id    = config.id;
        this.debug = config.debug;
        if (config.stretching) {
            this.stretching = config.stretching;
        }

        this.volume = config.volume;
        this.mute   = config.mute;

        // this.fullscreen = config.fullscreen;
        // this.plugins    = config.plugins;

        this.captionLabel = config.captionLabel;
        this.qualityLabel = config.qualityLabel;
    }

    /** Returns a PluginConfig containing plugin configuration information **/
    public function pluginConfig(pluginId:String):PluginConfig {
        pluginId = pluginId.toLowerCase();
        if (_pluginConfig.hasOwnProperty(pluginId)) {
            return _pluginConfig[pluginId] as PluginConfig;
        } else if (this[pluginId] && getQualifiedClassName(this[pluginId]) == "Object") {
            var duplicatedConfig:PluginConfig = new PluginConfig(pluginId, this[pluginId]);
            _pluginConfig[pluginId] = duplicatedConfig;
            return duplicatedConfig;
        } else {
            var newConfig:PluginConfig = new PluginConfig(pluginId);
            _pluginConfig[pluginId] = newConfig;
            return newConfig;
        }
    }

    /** Overwrites a plugin's configuration. Use with caution. **/
    public function setPluginConfig(pluginId:String, pluginConfig:PluginConfig):void {
        if (pluginId && pluginConfig) {
            _pluginConfig[pluginId] = pluginConfig;
        }
    }

}
}