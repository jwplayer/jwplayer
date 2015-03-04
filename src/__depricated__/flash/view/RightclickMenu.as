package com.longtailvideo.jwplayer.view {

	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerVersion;
	import com.longtailvideo.jwplayer.utils.Configger;
	import com.longtailvideo.jwplayer.utils.Logger;
	
	import flash.display.MovieClip;
	import flash.events.ContextMenuEvent;
	import flash.net.URLRequest;
	import flash.net.navigateToURL;
	import flash.system.Capabilities;
	import flash.ui.ContextMenu;
	import flash.ui.ContextMenuItem;

	/**
	 * Implement a rightclick menu with "fullscreen", "stretching" and "about" options.
	 **/
	public class RightclickMenu extends GlobalEventDispatcher {

		/** Player API. **/
		protected var _player:IPlayer;
		/** Context menu **/
		protected var context:ContextMenu;

		/** About JW Player menu item **/
		protected var about:ContextMenuItem;
		/** Debug menu item **/
		protected var debug:ContextMenuItem;
	
		/** Constructor. **/
		public function RightclickMenu(player:IPlayer, clip:MovieClip) {
			_player = player;
			context = new ContextMenu();
			context.hideBuiltInItems();
			clip.contextMenu = context;
			initializeMenu();
		}

		/** Add an item to the contextmenu. **/
		protected function addItem(itm:ContextMenuItem, fcn:Function):void {
			itm.addEventListener(ContextMenuEvent.MENU_ITEM_SELECT, fcn);
			itm.separatorBefore = true;
			context.customItems.push(itm);
		}

		/** Initialize the rightclick menu. **/
		public function initializeMenu():void {
			setAboutText();
			addItem(about, aboutHandler);
			if (Capabilities.isDebugger == true || _player.config.debug != Logger.NONE) {
				debug = new ContextMenuItem('Logging to ' + _player.config.debug + '...');
				addItem(debug, debugHandler);
			}
		}
		
		protected function setAboutText():void {
			about = new ContextMenuItem('About JW Player ' + _player.version + '...');
		}

		/** jump to the about page. **/
		protected function aboutHandler(evt:ContextMenuEvent):void {
			navigateToURL(new URLRequest('http://www.longtailvideo.com/jwpabout/?a=r&v='+PlayerVersion.version+'&m=f&e=o'), '_top');
		}

		/** change the debug system. **/
		protected function debugHandler(evt:ContextMenuEvent):void {
			var arr:Array = new Array(Logger.NONE, Logger.CONSOLE, Logger.TRACE);
			var idx:Number = arr.indexOf(_player.config.debug);
			idx = (idx == arr.length - 1) ? 0 : idx + 1;
			debug.caption = 'Logging to ' + arr[idx] + '...';
			setCookie('debug', arr[idx]);
			_player.config.debug = arr[idx];
		}

		protected function setCookie(name:String, value:*):void {
			Configger.saveCookie(name, value);			
		}

	}

}