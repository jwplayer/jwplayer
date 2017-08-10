package com.longtailvideo.jwplayer.controller {
import com.longtailvideo.jwplayer.model.Model;
import com.longtailvideo.jwplayer.player.IPlayer;
import com.longtailvideo.jwplayer.player.SwfEventRouter;
import com.longtailvideo.jwplayer.view.View;

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

    private var _player:IPlayer;
    private var _model:Model;
    private var _view:View;

    private var tasker:TaskQueue;

    public function PlayerSetup(player:IPlayer, model:Model, view:View) {
        _player = player;
        _model = model;
        _view = view;
    }

    public function setupInterface():void {
        tasker = new TaskQueue(false);
        tasker.addEventListener(Event.COMPLETE, setupTasksComplete);
        tasker.addEventListener(ErrorEvent.ERROR, setupTasksFailed);

        tasker.queueTask(waitForSwfEventsRouter);

        tasker.runTasks();
    }

    ///////////////////////
    // Tasks
    ///////////////////////

    private function waitForSwfEventsRouter():void {
        // This may take a moment to setup with early versions of IE
        if (SwfEventRouter.available) {
            tasker.success();
            return;
        } else if (tasker.time < 1000) {
            setTimeout(waitForSwfEventsRouter, 20);
            return;
        }
        tasker.failure(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error: Flash ExternalInterface unavailable"));
    }

    private function setupTasksComplete(evt:Event):void {
        dispatchEvent(new Event(Event.COMPLETE));
    }

    private function setupTasksFailed(evt:ErrorEvent):void {
        dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, evt.text));
    }

}
}
