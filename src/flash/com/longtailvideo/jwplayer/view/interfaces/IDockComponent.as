package com.longtailvideo.jwplayer.view.interfaces {
	import com.longtailvideo.jwplayer.view.components.DockButton;
	
	import flash.display.DisplayObject;
	import flash.display.MovieClip;

	/**
	 * Sent when the dock begins to become visible
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ComponentEvent.JWPLAYER_COMPONENT_SHOW
	 */
	[Event(name="jwPlayerComponentShow", type="com.longtailvideo.jwplayer.events.ComponentEvent")]
	/**
	 * Sent when the dock begins to hide
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ComponentEvent.JWPLAYER_COMPONENT_HIDE
	 */
	[Event(name="jwPlayerComponentHide", type="com.longtailvideo.jwplayer.events.ComponentEvent")]
	
	public interface IDockComponent extends IPlayerComponent {
		function addButton(icon:*, text:String, clickHandler:*, name:String = null):IDockButton;
		function removeButton(name:String):void;
/*		function setButton(name:String, click:String=null, over:String=null, out:String=null):void;
*/	}
}