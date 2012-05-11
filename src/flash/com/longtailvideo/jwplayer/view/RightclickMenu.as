package com.longtailvideo.jwplayer.view {

	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.ViewEvent;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.utils.Configger;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.Stretcher;
	
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
		/** Fullscreen menu item **/
		protected var fullscreen:ContextMenuItem;
		/** Stretching menu item **/
		protected var stretching:ContextMenuItem;
	
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
			try {
				fullscreen = new ContextMenuItem('Toggle Fullscreen...');
				addItem(fullscreen, fullscreenHandler);
			} catch (err:Error) {
			}
			stretching = new ContextMenuItem('Stretching is ' + _player.config.stretching + '...');
			addItem(stretching, stretchHandler);
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
			navigateToURL(new URLRequest('http://www.longtailvideo.com/players/jw-flv-player'), '_top');
		}

		/** change the debug system. **/
		protected function debugHandler(evt:ContextMenuEvent):void {
			var arr:Array = new Array(Logger.NONE, Logger.ARTHROPOD, Logger.CONSOLE, Logger.TRACE);
			var idx:Number = arr.indexOf(_player.config.debug);
			idx = (idx == arr.length - 1) ? 0 : idx + 1;
			debug.caption = 'Logging to ' + arr[idx] + '...';
			setCookie('debug', arr[idx]);
			_player.config.debug = arr[idx];
		}

		/** Toggle the fullscreen mode. **/
		protected function fullscreenHandler(evt:ContextMenuEvent):void {
			dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_FULLSCREEN, !_player.config.fullscreen));
		}

		/** Change the stretchmode. **/
		protected function stretchHandler(evt:ContextMenuEvent):void {
			var arr:Array = new Array(Stretcher.UNIFORM, Stretcher.FILL, Stretcher.EXACTFIT, Stretcher.NONE);
			var idx:Number = arr.indexOf(_player.config.stretching);
			idx == arr.length - 1 ? idx = 0 : idx++;
			_player.config.stretching = arr[idx];
			stretching.caption = 'Stretching is ' + arr[idx] + '...';
			dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_REDRAW));
		}
		
		protected function setCookie(name:String, value:*):void {
			Configger.saveCookie(name, value);			
		}

	}

}