package com.longtailvideo.jwplayer.view.interfaces {
	
	public interface IDockComponent extends IPlayerComponent {
		function addButton(icon:*, text:String, clickHandler:*, name:String = null):IDockButton;
		function removeButton(name:String):void;
	}
}