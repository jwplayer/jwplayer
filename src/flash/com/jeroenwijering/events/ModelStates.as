/**
* Static typed list of all possible model states, fired with the 'state' event.
*
* Import this class into your project/plugin for strong-typed api references.
**/
package com.jeroenwijering.events {


public class ModelStates {


	/** Nothing happening. No playback and no file in memory. **/
	public static var IDLE:String = "IDLE";
	/** Buffering; will start to play when the buffer is full. **/
	public static var BUFFERING:String = "BUFFERING";
	/** The file is being played back. **/
	public static var PLAYING:String = "PLAYING";
	/** Playback is paused. **/
	public static var PAUSED:String = "PAUSED";
	/** End of mediafile has been reached. No playback but the file is in memory. **/
	public static var COMPLETED:String = "COMPLETED";


}


}