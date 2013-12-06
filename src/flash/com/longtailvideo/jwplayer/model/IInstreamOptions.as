package com.longtailvideo.jwplayer.model
{
	public interface IInstreamOptions
	{
		function update(options:Object=null):void;
		function get controlbarseekable():String;
		function get controlbarpausable():Boolean;
		function get controlbarstoppable():Boolean;
		function get loadingmessage():String;
		function get playlistclickable():Boolean;
		function get skipoffset():String;
		function get tag():String;
	}
}