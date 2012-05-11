/**
* Interface all plugins must implement.
*
* It defines the initializePlugin call, which is fired by the player.
* It passes a reference of the view, which is the entrypoint for the API.
*
* The plugin API is part of the JW Player and as such covered by its licenses.
* Implementing the API in other projects violates the license.
* Contact us (www.longtailvideo.com) for more info or waivers.
*
* Import this class into your plugin for strong-typed api references.
**/
package com.jeroenwijering.events {


import flash.events.Event;


public interface PluginInterface {

	/**
	* When a plugin is loaded, the player attempts to call this function.
	* 
	* @param vie	Reference to the View, which is the entrypoint for the API.
	*				It defines all available variables, listeners and calls.
	* @see			AbstractView
	**/
	function initializePlugin(vie:AbstractView):void;


};


}