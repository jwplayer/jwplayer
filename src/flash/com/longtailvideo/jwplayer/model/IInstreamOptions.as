package com.longtailvideo.jwplayer.model
{
	public interface IInstreamOptions
	{
		function get controlbarseekable():String;
		function get controlbarpausable():Boolean;
		function get controlbarstoppable():Boolean;
		function get playlistclickable():Boolean;
		function get autoload():Boolean;
	}
}