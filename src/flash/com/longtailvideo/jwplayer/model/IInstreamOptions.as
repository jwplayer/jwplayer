package com.longtailvideo.jwplayer.model
{
	public interface IInstreamOptions
	{
		function get controlbarseekable():String;
		function get controlbarpausable():Boolean;
		function get controlbarstoppable():Boolean;
		function get loadingmessage():String;
		function get playlistclickable():Boolean;
		function get skipoffset():Number;
		function get tag():String;
	}
}