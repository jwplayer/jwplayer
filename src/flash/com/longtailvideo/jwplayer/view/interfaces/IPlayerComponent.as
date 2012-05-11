package com.longtailvideo.jwplayer.view.interfaces {
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;

	public interface IPlayerComponent extends IGlobalEventDispatcher {
		function resize(width:Number, height:Number):void;
		function get height():Number;
		function get width():Number;
		function get x():Number;
		function set x(_x:Number):void;
		function get y():Number;
		function set y(_y:Number):void;
		function show():void;
		function hide():void;
	}
}