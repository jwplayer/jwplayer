package com.longtailvideo.jwplayer.plugins
{
	import com.longtailvideo.jwplayer.player.IPlayer;
	
	public class AbstractPlugin implements IPlugin	{
		public function initPlugin(player:IPlayer, config:PluginConfig):void
		{
		}
		
		public function resize(width:Number, height:Number):void
		{
		}
		
		public function get id():String {
			return null;
		}
	}
}