package com.longtailvideo.jwplayer.plugins {
import com.longtailvideo.jwplayer.player.IPlayer;

/**
 * All plugins must implement the <code>IPlugin</code> interface.
 */
public interface IPlugin {
    function get id():String;

    function initPlugin(player:IPlayer, config:PluginConfig):void;

    function resize(width:Number, height:Number):void;
}
}