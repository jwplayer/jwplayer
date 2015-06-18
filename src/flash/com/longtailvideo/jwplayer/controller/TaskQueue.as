package com.longtailvideo.jwplayer.controller {
import com.longtailvideo.jwplayer.events.PlayerEvent;

import flash.events.ErrorEvent;
import flash.events.Event;
import flash.events.EventDispatcher;

/**
 * Sent when the all of the tasks have completed successfully
 *
 * @eventType flash.events.Event.COMPLETE
 */
[Event(name="complete", type="flash.events.Event")]

/**
 * Sent when an error occurred in one of the tasks.
 *
 * @eventType flash.events.ErrorEvent.ERROR
 */
[Event(name="error", type="flash.events.ErrorEvent")]

/**
 * Runs tasks in a set order.  Dispatches an Event.COMPLETE if all tasks successfully complete, or an ErrorEvent.ERROR
 * if one of the tasks in the queue fails.
 */
public class TaskQueue extends EventDispatcher {

    public function TaskQueue(cont:Boolean = false) {
        _tasks = new <Task>[];
        _continueOnFailure = cont;
    }
    private var _taskIndex:int = -1;
    private var _tasks:Vector.<Task>;
    private var _completed:Boolean = false;
    private var _failureState:Boolean = false;
    private var _continueOnFailure:Boolean;

    public function queueTask(fn:Function, success:Function = null, error:Function = null):void {
        _tasks.push(new Task(fn, success, error));
    }

    public function runTasks():void {
        if (_taskIndex < 0) {
            nextTask();
        }
    }

    public function get currentTask():Task {
        if (_taskIndex >= 0 && _taskIndex < _tasks.length) {
            return _tasks[_taskIndex];
        }
        return null;
    }

    public function get time():Number {
        if (currentTask) {
            return currentTask.time;
        }
        return 0;
    }

    private function nextTask():void {
        if (++_taskIndex < _tasks.length) {
            // if (_taskIndex > 0) {
            //     trace('task', _taskIndex - 1, 'completed in', _tasks[_taskIndex-1].time);
            // }
            currentTask.run();
        } else if (!_completed) {
            _completed = true;
            dispatchEvent(new Event(Event.COMPLETE));
        }
    }

    public function success(event:Event = null):void {
        if (!_failureState && currentTask) {
            if (currentTask.success !== null) {
                currentTask.success(event);
            }
            nextTask();
        }
    }

    public function failure(event:Event):void {
        if (currentTask && currentTask.error !== null) {
            currentTask.error(event);
        }

        if (event is ErrorEvent) {
            dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, ErrorEvent(event).text));
        } else if (event is PlayerEvent && (event as PlayerEvent).message) {
            dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, PlayerEvent(event).message));
        } else {
            dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, event.toString()));
        }

        if (_continueOnFailure) {
            nextTask();
        } else {
            _failureState = true;
        }
    }

}
}

import flash.utils.getTimer;

class Task {

    private var _startTime:Number;

    public var fn:Function;
    public var success:Function;
    public var error:Function;


    public function Task(_fn:Function, _success:Function = null, _error:Function = null):void {
        fn = _fn;
        success = _success;
        error = _error;
    }

    public function run():void {
        _startTime = getTimer();
        fn();
    }

    public function get time():Number {
        return getTimer() - _startTime;
    }
}