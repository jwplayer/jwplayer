package com.longtailvideo.jwplayer.view.interfaces {
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
	
	import flash.display.DisplayObject;
	

	/**
	 * Sent when the user interface requests that the player play the currently loaded media
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_PLAY
	 */
	[Event(name="jwPlayerViewPlay", type = "com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user interface requests that the player pause the currently playing media
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_PAUSE
	 */
	[Event(name="jwPlayerViewPause", type = "com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user clicks on the display
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_CLICK
	 */
	[Event(name="jwPlayerViewClick", type = "com.longtailvideo.jwplayer.events.ViewEvent")]

	public interface IDisplayComponent extends IPlayerComponent {
		//function setIcon(displayIcon:DisplayObject):void;
		//function setText(displayText:String):void;
		function forceState(forcedState:String):void;
		function releaseState():void;
	}
}