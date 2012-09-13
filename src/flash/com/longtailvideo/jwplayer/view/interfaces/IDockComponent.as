package com.longtailvideo.jwplayer.view.interfaces {
	import com.longtailvideo.jwplayer.view.components.DockButton;
	
	import flash.display.DisplayObject;
	import flash.display.MovieClip;

	public interface IDockComponent extends IPlayerComponent {
		function addButton(icon:*, text:String, clickHandler:*, name:String = null):IDockButton;
		function removeButton(name:String):void;
	}
}