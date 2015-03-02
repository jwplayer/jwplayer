package com.longtailvideo.jwplayer.model {
import com.longtailvideo.jwplayer.player.PlayerVersion;
import com.longtailvideo.jwplayer.plugins.PluginConfig;
import com.longtailvideo.jwplayer.utils.Logger;

import flash.events.EventDispatcher;
import flash.utils.getQualifiedClassName;

public dynamic class PlayerConfig extends EventDispatcher {

    public function PlayerConfig():void {
    }
    protected var _pluginConfig:Object = {};

    protected var _volume:Number = 90;

    public function get volume():Number {
        return _volume;
    }

    public function set volume(x:Number):void {
        _volume = x;
    }

    protected var _mute:Boolean = false;

        public function get mute():Boolean {
        return _mute;
    } //plugins initial string

    public function set mute(x:Boolean):void {
        _mute = x;
    }

    protected var _fullscreen:Boolean = false;

    public function get fullscreen():Boolean {
        return _fullscreen;
    }

    public function set fullscreen(x:Boolean):void {
        _fullscreen = x;
    }

    protected var _width:Number = 400;

    public function get width():Number {
        return _width;
    }

    public function set width(x:Number):void {
        _width = x;
    }

    protected var _height:Number = 280;

    public function get height():Number {
        return _height;
    }

    public function set height(x:Number):void {
        _height = x;
    }

    protected var _stretching:String = "uniform";

    public function get stretching():String {
        return _stretching;
    }

    public function set stretching(x:String):void {
        _stretching = x ? x.toLowerCase() : "";
    }

protected var _plugins:String = "";

    public function get plugins():String {
        return _plugins;
    }

    public function set plugins(x:String):void {
        _plugins = x;
    }

    protected var _id:String = "";

    public function get id():String {
        return _id;
    }

    public function set id(x:String):void {
        PlayerVersion.id = _id = x;
    }

    protected var _debug:String = Logger.NONE;

    public function get debug():String {
        return _debug;
    }

    public function set debug(x:String):void {
        if (x != "0") {
            _debug = x;
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
        // TODO: copy supported properties
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