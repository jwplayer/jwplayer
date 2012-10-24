package com.longtailvideo.jwplayer.view {
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.plugins.PluginConfig;
	import com.longtailvideo.jwplayer.view.components.CaptionsComponent;
	import com.longtailvideo.jwplayer.view.components.ControlbarComponent;
	import com.longtailvideo.jwplayer.view.components.DisplayComponent;
	import com.longtailvideo.jwplayer.view.components.DockComponent;
	import com.longtailvideo.jwplayer.view.components.LogoComponent;
	import com.longtailvideo.jwplayer.view.components.PlaylistComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IControlbarComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IDisplayComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IDockComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IPlayerComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IPlaylistComponent;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	public class PlayerComponents implements IPlayerComponents {
		protected var _controlbar:IControlbarComponent;
		protected var _display:IDisplayComponent;
		protected var _dock:IDockComponent;
		protected var _playlist:IPlaylistComponent;
		protected var _logo:LogoComponent;
		protected var _config:PlayerConfig;
		protected var _skin:ISkin;
		protected var _player:IPlayer;
		protected var _captions:CaptionsComponent;
		
		/**
		 * @inheritDoc
		 */
		public function PlayerComponents(player:IPlayer) {
			_player = player;
			_skin = player.skin;
			_config = player.config;
			createComponents();
		}
		
		protected function createComponents():void {
			_controlbar = new ControlbarComponent(_player);
			_display = new DisplayComponent(_player);
			_playlist = new PlaylistComponent(_player);
			_dock = new DockComponent(_player);
			_captions = new CaptionsComponent(_player);
			setupLogo();
		}
		
		protected function setupLogo():void {
			_logo = new LogoComponent(_player, redraw);
		}
		
		/**
		 * @inheritDoc
		 */
		public function get controlbar():IControlbarComponent {
			return _controlbar;
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function get display():IDisplayComponent {
			return _display;
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function get dock():IDockComponent {
			return _dock;
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function get playlist():IPlaylistComponent {
			return _playlist;
		}

		/**
		 * @inheritDoc
		 */
		public function get logo():IPlayerComponent {
			return _logo;
		}

		/**
		 * @inheritDoc
		 */
		public function get captions():CaptionsComponent {
			return _captions;
		}
		

		/**
		 * @inheritDoc
		 */
		public function redraw():void {
			var cbConfig:PluginConfig = _config.pluginConfig('controlbar'); 
			var dockConfig:PluginConfig = _config.pluginConfig('dock'); 
			var logoConfig:PluginConfig = _config.pluginConfig('logo'); 

			resizeComponent(_controlbar, cbConfig);
			resizeComponent(_display, _config.pluginConfig('display'));
			resizeComponent(_playlist, _config.pluginConfig('playlist'));
			resizeComponent(_logo, logoConfig);

			if (_logo.position.indexOf("bottom") == 0) {
				logoConfig.height -= (_controlbar.height + cbConfig.margin);
				resizeComponent(_logo, logoConfig);
			} else if (_logo.position == "top-left") {
				dockConfig.width -= (_logo.width);
				dockConfig.x = _logo.width + _logo.margin;
			}
			
			resizeComponent(_dock, dockConfig);

			resizeComponent(_captions, _config.pluginConfig('display'));
		}
		
		
		private function resizeComponent(comp:IPlayerComponent, config:PluginConfig):void {
			comp.x = config['x'];
			comp.y = config['y'];
			comp.resize(config['width'], config['height']);
		}
	}
}