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

    public function PluginLoader() {
        loaders = new Dictionary();
        plugins = {};
    }
    public var plugins:Object;
    private var loaders:Dictionary;
    private var errorState:Boolean = false;

    public function loadPlugins(plugins:Array):void {
        if (plugins.length) {
            for each(var plugin:Object in plugins) {
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
            loaders[loader] = plugin;
            loader.load(plugin);
        }
    }

    private function checkComplete():void {
        if (errorState) return;

        var waiting:Boolean = false;
        for each(var remaining:String in loaders) {
            // Still waiting for some plugins to load
            waiting = true;
            continue;
        }

        if (!waiting) {
            dispatchEvent(new Event(Event.COMPLETE));
        }
    }

    private function pluginLoadFailed(evt:ErrorEvent):void {
        errorState = true;
        dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error loading plugin: Plugin file not found"));
    }

    private function loadSuccess(evt:Event):void {
        var loader:AssetLoader = evt.target as AssetLoader;
        var url:String = loaders[loader] as String;
        var pluginId:String = url.substr(url.lastIndexOf("/") + 1).replace(/(.*)\.swf$/i, "$1").split("-")[0];
        plugins[pluginId] = loader.loadedObject as DisplayObject;
        loader.removeEventListener(Event.COMPLETE, loadSuccess);
        delete loaders[loader];
        checkComplete();
    }


}
}