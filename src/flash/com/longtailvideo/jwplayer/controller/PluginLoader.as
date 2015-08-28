package com.longtailvideo.jwplayer.controller {
import com.longtailvideo.jwplayer.utils.AssetLoader;

import flash.display.DisplayObject;
import flash.events.ErrorEvent;
import flash.events.Event;
import flash.events.EventDispatcher;
import flash.utils.Dictionary;

/**
 * Sent when the plugin loader has loaded all valid plugins.
 *
 * @eventType flash.events.Event.COMPLETE
 */
[Event(name="complete", type="flash.events.Event")]

/**
 * Sent when an error occured during plugin loading.
 *
 * @eventType flash.events.ErrorEvent.ERROR
 */
[Event(name="error", type="flash.events.ErrorEvent")]


/**
 * Loads plugins during player startup
 */
public class PluginLoader extends EventDispatcher {

    public var plugins:Object;

    private var _remainingLoaders:uint;
    private var _errorState:Boolean;

    public function PluginLoader() {
        _remainingLoaders = 0;
        plugins = {};
    }

    public function loadPlugins(pluginsToLoad:Array):void {
        if (pluginsToLoad.length) {
            for each(var plugin:Object in pluginsToLoad) {
                if (plugin) {
                    loadLocalPlugin(plugin.swf);
                }
            }
        } else {
            dispatchEvent(new Event(Event.COMPLETE));
        }
    }

    private function loadLocalPlugin(plugin:String):void {
        if (plugin.indexOf("/") >= 0 || plugin.indexOf(".swf")) {
            var loader:AssetLoader = new AssetLoader();
            loader.addEventListener(Event.COMPLETE, loadSuccess);
            loader.addEventListener(ErrorEvent.ERROR, pluginLoadFailed);
            _remainingLoaders++;
            loader.load(plugin);
        }
    }

    private function checkComplete():void {
        if (_errorState || _remainingLoaders) {
            return;
        }

        dispatchEvent(new Event(Event.COMPLETE));
    }

    private function pluginLoadFailed(evt:ErrorEvent):void {
        _errorState = true;
        var loader:AssetLoader = evt.target as AssetLoader;
        loader.removeEventListener(Event.COMPLETE, loadSuccess);
        loader.removeEventListener(ErrorEvent.ERROR, pluginLoadFailed);
        dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error loading plugin: Plugin file not found "+ loader.url));
    }

    private function loadSuccess(evt:Event):void {
        var loader:AssetLoader = evt.target as AssetLoader;
        loader.removeEventListener(Event.COMPLETE, loadSuccess);
        loader.removeEventListener(ErrorEvent.ERROR, pluginLoadFailed);
        var url:String = loader.url;
        var pluginId:String = url.substr(url.lastIndexOf("/") + 1).replace(/(.*)\.swf$/i, "$1").split("-")[0];
        plugins[pluginId] = loader.loadedObject as DisplayObject;
        _remainingLoaders--;
        checkComplete();
    }


}
}