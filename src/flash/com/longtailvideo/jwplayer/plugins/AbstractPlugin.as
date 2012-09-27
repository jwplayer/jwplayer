package com.longtailvideo.jwplayer.plugins
{
	import com.longtailvideo.jwplayer.player.IPlayer;
	
	import flash.display.Sprite;
	
	public class AbstractPlugin extends Sprite implements IPlugin6 {
		public function initPlugin(player:IPlayer, config:PluginConfig):void
		{
		}
		
		public function resize(width:Number, height:Number):void
		{
		}
		
		public function get id():String {
			return null;
		}
		
		public function get target():String {
			return null;
		}
	}
}