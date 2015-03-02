package com.longtailvideo.jwplayer.controller {
import com.longtailvideo.jwplayer.model.Model;
import com.longtailvideo.jwplayer.player.IPlayer;
import com.longtailvideo.jwplayer.player.PlayerVersion;
import com.longtailvideo.jwplayer.player.SwfEventRouter;
import com.longtailvideo.jwplayer.plugins.IPlugin;
import com.longtailvideo.jwplayer.plugins.IPlugin6;
import com.longtailvideo.jwplayer.utils.Logger;
import com.longtailvideo.jwplayer.view.View;

import flash.display.DisplayObject;
import flash.events.ErrorEvent;
import flash.events.Event;
import flash.events.EventDispatcher;
import flash.utils.setTimeout;

/**
 * Sent when the all of the setup steps have successfully completed.
 *
 * @eventType flash.events.Event.COMPLETE
 */
[Event(name="complete", type="flash.events.Event")]

/**
 * Sent when an error occurred during player setup
 *
 * @eventType flash.events.ErrorEvent.ERROR
 */
[Event(name="error", type="flash.events.ErrorEvent")]


/**
 * PlayerSetup is a helper class to Controller.  It manages the initial player startup process, firing an
 * Event.COMPLETE event when finished, or an ErrorEvent.ERROR if a problem occurred during setup.
 */
public class PlayerSetup extends EventDispatcher {

    public function PlayerSetup(player:IPlayer, model:Model, view:View) {
        _player = player;
        _model = model;
        _view = view;
    }
    /** MVC references **/
    protected var _player:IPlayer;
    protected var _model:Model;
    protected var _view:View;

    /** TaskQueue **/
    protected var tasker:TaskQueue;

    public function setupPlayer():void {
        tasker = new TaskQueue(false);
        tasker.addEventListener(Event.COMPLETE, setupTasksComplete);
        tasker.addEventListener(ErrorEvent.ERROR, setupTasksFailed);

        setupTasks();

        tasker.runTasks();
    }

    protected function setupTasks():void {
        tasker.queueTask(setupView);
        tasker.queueTask(loadPlugins, loadPluginsComplete);
        tasker.queueTask(initPlugins);
        tasker.queueTask(waitForSwfEventsRouter);
    }

    protected function setupView():void {
        try {
            _view.setupView();
        } catch (e:Error) {
            tasker.failure(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error: " + e.message));
            return;
        }
        tasker.success();
    }

    protected function loadPlugins():void {
        if (_model.plugins) {
            var loader:PluginLoader = new PluginLoader();
            loader.addEventListener(Event.COMPLETE, tasker.success);
            loader.addEventListener(ErrorEvent.ERROR, tasker.failure);
            loader.loadPlugins(_model.plugins);
        } else {
            tasker.success();
        }
    }

    ///////////////////////
    // Tasks
    ///////////////////////

    protected function initPlugins():void {
        for each (var pluginId:String in _view.loadedPlugins()) {
            try {
                var plugin:IPlugin6 = _view.getPlugin(pluginId);
                if (!PlayerVersion.versionCheck(plugin['target'])) {
                    tasker.failure(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error loading plugin: Incompatible player version"));
                    return;
                }
                plugin.initPlugin(_player, _model.pluginConfig(pluginId));
            } catch (e:Error) {
                Logger.log("Plugin error: " + e.message);
                if (plugin) {
                    _view.removePlugin(plugin);
                }
            }
        }
        tasker.success();
    }

    protected function waitForSwfEventsRouter():void {
        if (SwfEventRouter.available) {
            tasker.success();
            return;
        } else if (tasker.time < 1000) {
            setTimeout(waitForSwfEventsRouter, 20);
            return;
        }
        tasker.failure(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error: Flash ExternalInterface unavailable"));
    }

    protected function setupTasksComplete(evt:Event):void {
        dispatchEvent(new Event(Event.COMPLETE));
    }

    protected function setupTasksFailed(evt:ErrorEvent):void {
        dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, evt.text));
    }

    protected function loadPluginsComplete(event:Event = null):void {
        if (event) {
            var loader:PluginLoader = event.target as PluginLoader;

            for (var pluginId:String in loader.plugins) {
                var plugin:DisplayObject = loader.plugins[pluginId] as DisplayObject;
                if (plugin is IPlugin) {
                    try {
                        _view.addPlugin(pluginId, plugin as IPlugin);
                    } catch (e:Error) {
                        tasker.failure(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error loading plugin: " + e.message));
                    }
                }
            }
        }

        // Compiled in plugins go here.  Example:
        //_view.addPlugin("test", new TestPlugin());
    }
}
}
