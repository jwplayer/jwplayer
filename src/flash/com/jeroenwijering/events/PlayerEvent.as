/**
* Definition of the READY event, fired by the Player when all components are set up.
* 
* Listen to this event when loading the player.swf in a flash/Flex project. 
* When fired, all API calls are available.
*
* Import this class into your project/plugin for strong-typed api references.
**/
package com.jeroenwijering.events {


import flash.events.Event;


public class PlayerEvent extends Event {


	/** Definition for the ready event. **/
	public static var READY:String = "READY";


	/**
	* Constructor; sets the event definition.
	*
	* @param typ	The type of event.
	* @param dat	An object with all associated data.
	**/
	public function PlayerEvent(typ:String,bbl:Boolean=false,ccb:Boolean=false):void {
		super(typ, bbl, ccb);
	};


}


}