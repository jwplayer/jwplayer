package com.longtailvideo.jwplayer.view {
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.plugins.PluginConfig;
	
	import flash.geom.Rectangle;


	public class PlayerLayoutManager {

		public static var LEFT:String = "left";  
		public static var RIGHT:String = "right";  
		public static var TOP:String = "top";  
		public static var BOTTOM:String = "bottom";  
		public static var NONE:String = "none";  
	
		private var _player:IPlayer;
	
		private var toLayout:Array;
		private var noLayout:Array;
		
		private var remainingSpace:Rectangle;
	
		public function PlayerLayoutManager(player:IPlayer) {
			_player = player;
		}
		
		public function resize(width:Number, height:Number):void {
			toLayout = [];
			noLayout = [];

			remainingSpace = new Rectangle(0, 0, width, height);

			for each (var plugin:String in _player.config.pluginIds) {
				addLayout(plugin);
			}
			
			addLayout('playlist');			
			addLayout('controlbar');
			addLayout('display');			
			addLayout('dock');	
			
			generateLayout();
		} 

		
		private function pluginSize(config:PluginConfig):Number {
			var confSize:String = String(config['size']);
			var align:String = config['position'];
			
			if (!isNaN(config['size'])) {
				return Number(config['size']);
			}
			
			if (confSize.indexOf('%') == confSize.length-1) {
				confSize = confSize.substr(0, confSize.length-1);
			} else if (confSize.indexOf('pct') == confSize.length-3) {
				confSize = confSize.substr(0, confSize.length-3);
			} else {
				return 0;
			}
			
			if (align == LEFT || align == RIGHT) {
				return remainingSpace.width * Number(confSize) / 100;
			} else {
				return remainingSpace.height * Number(confSize) / 100;
			}
		}

		private function addLayout(plugin:String):void {
			var cfg:PluginConfig = _player.config.pluginConfig(plugin);

			if (!_player.config.fullscreen && testPosition(cfg['position']) && pluginSize(cfg) > 0 ) {
				toLayout.push(cfg);
			} else {
				noLayout.push(cfg);
			}
		}
		
		private function fitsLayout(config:PluginConfig):Boolean {
			switch (testPosition(config['position'])) {
				case BOTTOM:
				case TOP:
					var controlbarConfig:PluginConfig = _player.config.pluginConfig('controlbar');
					if (config['id'] != "controlbar" && (testPosition(controlbarConfig['position']) == TOP || testPosition(controlbarConfig['position']) == BOTTOM)) {
						return ((remainingSpace.height - pluginSize(controlbarConfig)) > pluginSize(config) > 0);
					} else {
						return (remainingSpace.height > pluginSize(config) > 0);
					}
					break;
				case LEFT:
				case RIGHT:
					var playlistConfig:PluginConfig = _player.config.pluginConfig('playlist');
					if (config['id'] != "playlist" && (testPosition(playlistConfig['position']) == LEFT || testPosition(playlistConfig['position']) == RIGHT)) {
						return ((remainingSpace.width - pluginSize(playlistConfig)) > pluginSize(config) > 0);
					} else {
						return (remainingSpace.width > pluginSize(config) > 0);
					}
					break;
			}
			
			return false;
			
		}

		public static function testPosition(pos:String):String {
			if (!pos) { return ""; }
			
			switch (pos.toLowerCase()) {
				case LEFT:
				case RIGHT:
				case TOP:
				case BOTTOM:
					return pos.toLowerCase();
					break;
				default:
					return "";
					break;
			}
		}

		protected function generateLayout():void {
			if (toLayout.length == 0) {
				for each(var item:PluginConfig in noLayout) {
					item['visible'] = !(_player.config.fullscreen && testPosition(item['position']));
					assignSpace(item, remainingSpace);
				}
				_player.config.width = remainingSpace.width;
				_player.config.height = remainingSpace.height;
				return;
			}
			
			var config:PluginConfig = toLayout.shift() as PluginConfig;
			var pluginSpace:Rectangle = new Rectangle();
			var size:Number = pluginSize(config);
			
			if (fitsLayout(config)) {
				switch (testPosition(config['position'])) {
					case LEFT:
						pluginSpace.x = remainingSpace.x;
						pluginSpace.y = remainingSpace.y;
						pluginSpace.width = size;
						pluginSpace.height = remainingSpace.height;
						remainingSpace.width -= size;
						remainingSpace.x += size;
						break;
					case RIGHT:
						pluginSpace.x = remainingSpace.x + remainingSpace.width - size;
						pluginSpace.y = remainingSpace.y;
						pluginSpace.width = size;
						pluginSpace.height = remainingSpace.height;
						remainingSpace.width -= size;
						break;
					case TOP:
						pluginSpace.x = remainingSpace.x;
						pluginSpace.y = remainingSpace.y;
						pluginSpace.width = remainingSpace.width;
						pluginSpace.height = size;
						remainingSpace.height -= size;
						remainingSpace.y += size;
						break;
					case BOTTOM:
						pluginSpace.x = remainingSpace.x;
						pluginSpace.y = remainingSpace.y + remainingSpace.height - size;
						pluginSpace.width = remainingSpace.width;
						pluginSpace.height = size;
						remainingSpace.height -= size;
						break;
				}

				config['visible'] = true;
				assignSpace(config, pluginSpace);
			} else {
				noLayout.push(config);
			}
			
			generateLayout();
		}
		
		protected function assignSpace(cfg:PluginConfig, space:Rectangle):void {
			cfg['width'] 	= space.width;
			cfg['height'] 	= space.height;
			cfg['x'] 		= space.x;
			cfg['y'] 		= space.y;
		}
		
		
	}
}