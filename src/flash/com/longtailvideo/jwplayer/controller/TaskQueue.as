package com.longtailvideo.jwplayer.controller {
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.utils.Dictionary;

	/**
	 * Sent when the all of the tasks have completed successfully
	 *
	 * @eventType flash.events.Event.COMPLETE
	 */
	[Event(name="complete", type = "flash.events.Event")]

	/**
	 * Sent when an error occurred in one of the tasks.
	 *
	 * @eventType flash.events.ErrorEvent.ERROR
	 */
	[Event(name="error", type = "flash.events.ErrorEvent")]

	/**
	 * Runs tasks in a set order.  Dispatches an Event.COMPLETE if all tasks successfully complete, or an ErrorEvent.ERROR 
	 * if one of the tasks in the queue fails. 
	 * @author Pablo Schklowsky
	 */
	public class TaskQueue extends EventDispatcher {
		
		private var activeTask:Function = null;
		private var taskIndex:Number = -1;
		
		private var taskSuccess:Dictionary;
		private var taskFailure:Dictionary;
		private var taskOrder:Array;
		
		private var continueOnFailure:Boolean;
		private var failureState:Boolean = false;
		private var completed:Boolean = false;
		
		public function TaskQueue(cont:Boolean=false) {
			taskOrder = [];
			taskSuccess = new Dictionary();
			taskFailure = new Dictionary();
			continueOnFailure = cont;
		}
		
		public function queueTask(task:Function, success:Function=null, failure:Function=null):void {
			taskOrder.push(task);
			if (success != null) {
				taskSuccess[task] = success;
				taskFailure[task] = failure;
			}
		}
		
		public function runTasks():void {
			if (activeTask == null) {
				nextTask();
			}
		}

		public function success(event:Event=null):void {
			if (!failureState) {
				var runSuccess:Function = taskSuccess[activeTask] as Function;
				if (runSuccess != null) {
					runSuccess(event);
				}
				nextTask();
			}
		}
		
		public function failure(event:Event):void {
			var runFailure:Function = taskFailure[activeTask] as Function;
			if (runFailure != null) {
				runFailure(event);
			}
			
			if (event is ErrorEvent) {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, 
					"Task Queue failed at step " + taskIndex + ": " +  ErrorEvent(event).text));
			} else if (event is PlayerEvent && (event as PlayerEvent).message) {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, 
					"Task Queue failed at step " + taskIndex + ": " +  PlayerEvent(event).message));
			} else {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, 
								"Task Queue failed at step " + taskIndex + ": " +  event.toString()));
			}
			
			if (continueOnFailure) {
				nextTask();
			} else {
				failureState = true;
			}
		}

		private function nextTask():void { 
			if (taskOrder.length > 0) {
				activeTask = taskOrder.shift() as Function;
				taskIndex++;
				activeTask();
			} else if (!completed) {
				completed = true;
				dispatchEvent(new Event(Event.COMPLETE));
			}
		}
		
	}
}