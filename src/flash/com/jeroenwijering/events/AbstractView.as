/**
* Abstract superclass for the View. Defines all methods accessible to plugins.
*
* Import this class into your project/plugin for strong-typed api references.
**/
package com.jeroenwijering.events {


import flash.display.MovieClip;
import flash.events.EventDispatcher;


public class AbstractView extends EventDispatcher {


	/** Constructor. **/
	public function AbstractView() {};


	/**  Getter for config, the hashmap with configuration settings. **/
	public function get config():Object { return new Object(); };
	/** Getter for playlist, an array of hashmaps (file,link,image,etc) for each playlistentry. **/
	public function get playlist():Array { return new Array(); };
	/** Getter for skin, the on-stage player graphics. **/ 
	public function get skin():MovieClip { return new MovieClip(); };


	/**
	* *(Un)subscribe to events fired by the Controller (seek,load,resize,etc).
	* 
	* @param typ	The specific event to listen to.
	* @param fcn	The function that will handle the event.
	* @see 			ControllerEvent
	**/
	public function addControllerListener(typ:String,fcn:Function):void {};
	public function removeControllerListener(typ:String,fcn:Function):void {};


	/**
	* (Un)subscribe to events fired by the Model (time,state,meta,etc).
	* 
	* @param typ	The specific event to listen to.
	* @param fcn	The function that will handle the event.
	* @see 			ModelEvent
	**/
	public function addModelListener(typ:String,fcn:Function):void {};
	public function removeModelListener(typ:String,fcn:Function):void {};


	/**
	* (Un)subscribe to events fired from the View (play,mute,stop,etc).
	* All events fired by plugins or the actionscript/javascript API flow through the View.
	* 
	* @param typ	The specific event to listen to.
	* @param fcn	The function that will handle the event.
	* @see 			ViewEvent
	**/
	public function addViewListener(typ:String,fcn:Function):void {};
	public function removeViewListener(typ:String,fcn:Function):void {};


	/**
	* Get a reference to a specific plugin.
	*
	* @param nam	The name of the plugin to return.
	* @return		A reference to the plugin itself. Public methods can be directly called on this.
	* @see 			SPLoader
	**/
	public function getPlugin(nam:String):Object { return {}; };


	/**
	* Get a reference to a specific plugin.
	*
	* @param obj	The plugin whose config we want.
	* @return		The plugin config options, as a hashmap.
	* @see 			SPLoader
	**/
	public function getPluginConfig(obj:Object):Object { return {}; };


	/**
	* Load a plugin into the player at runtime.
	*
	* @prm url	The url of the plugin to load.
	* @prm vrs	A string of flashvars for the plugin 
	*			(separated by & and = signs, no 'pluginname.' variable needed).
	* @return	Boolean true if succeeded.
	**/
	public function loadPlugin(url:String,vrs:String=null):Boolean {
		return true;
	};


	/**
	* Dispatch an event. The event will be serialized and fired by the View.
	*
	* @param typ	The specific event to fire to.
	* @param prm	The accompanying parameter. Some events require one, others not.
	* @see 			ViewEvent
	**/
	public function sendEvent(typ:String,prm:Object=undefined):void {};


}


}