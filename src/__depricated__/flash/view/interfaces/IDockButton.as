/**
 * Interface for dock button
 **/
package com.longtailvideo.jwplayer.view.interfaces {
	import flash.display.DisplayObject;
	
	public interface IDockButton {
		
	 	function setAlphas(out:Number, over:Number, active:Number):void;
		function init():void;
		function setBackground(background:DisplayObject = null):void;
		function setOutIcon(outIcon:* = null):void;
		function setOverIcon(overIcon:DisplayObject = null):void;	
		function set clickFunction(clickFunction:*):void;
		function set outBackground(outBackground:DisplayObject):void;
		function set overBackground(overBackground:DisplayObject):void;
		function set activeBackground(activeBackground:DisplayObject):void;
		function set label(text:String):void;
		function set active(state:Boolean):void;
		function get active():Boolean;
	}
}
