/**
* Definitions for all event types fired by the Controller.
*
* Import this class into your project/plugin for strong-typed api references.
**/
package com.jeroenwijering.events {


import flash.events.Event;


public class ControllerEvent extends Event {


	/** Definitions for all event types. **/
	public static var ERROR:String = "ERROR";
	public static var ITEM:String = "ITEM";
	public static var MUTE:String = "MUTE";
	public static var PLAY:String = "PLAY";
	public static var PLAYLIST:String = "PLAYLIST";
	public static var RESIZE:String = "RESIZE";
	public static var SEEK:String = "SEEK";
	public static var STOP:String = "STOP";
	public static var VOLUME:String = "VOLUME";
	/** The data associated with the event. **/
	private var _data:Object;


	/**
	* Constructor; sets the event type and inserts the data value.
	*
	* @param typ	The type of event.
	* @param dat	An object with all associated data.
	**/
	public function ControllerEvent(typ:String,dat:Object=undefined,bbl:Boolean=false,ccb:Boolean=false):void {
		super(typ,bbl,ccb);
		_data = dat;
	};


	/** Returns the data associated with the event. **/
	public function get data():Object {
		return _data;
	};


}


}