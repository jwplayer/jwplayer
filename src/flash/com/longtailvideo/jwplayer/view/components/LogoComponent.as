package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.*;
	import com.longtailvideo.jwplayer.player.*;
	import com.longtailvideo.jwplayer.utils.*;
	import com.longtailvideo.jwplayer.view.interfaces.*;
	
	import flash.display.*;
	import flash.events.*;
	import flash.external.*;
	import flash.net.*;
	import flash.system.*;
	import flash.utils.*;
	
	public class LogoComponent extends CoreComponent implements IPlayerComponent {
		/** Configuration defaults **/
		protected var defaults:Object = {
			prefix: "http://l.longtailvideo.com/flash/", 
			file: "logo.png", 
			link: "http://www.longtailvideo.com/players/jw-flv-player/",
			linktarget: "_top",
			margin: 8, 
			out: 1, 
			over: 1, 
			//timeout: 5,
			//hide: "true",
			position: "top-right"
		}
		/** Reference to the current fade timer **/
		protected var timeoutInterval:uint;
		/** Seconds after fading in to hide logo again **/
		protected var timeout:Number = 2;
		/** Reference to the loader **/
		protected var loader:Loader;
		/** Animations handler **/
		protected var animations:Animations;
		/** Whether the buffer icon has been shown for this item **/
		protected var _alreadyShown:Boolean = false;
		/** Whether the logo is currently visible **/
		protected var _showing:Boolean = false;
		
		/** Dimensions **/
		protected var _width:Number;
		protected var _height:Number;
		
		/** Callback to execute when load is complete **/
		protected var _loadCallback:Function;
		
		/** Constructor **/
		public function LogoComponent(player:IPlayer, loadCallback:Function=null) {
			super(player, "logo");
			animations = new Animations(this);
			_player = player;
			
			setupDefaults();
			setupMouseEvents();
			loadFile();
			alpha = 0;
			_loadCallback = loadCallback;
		}
		
		/**
		 * This method can be overridden to set alternate default values. 
		 */
		protected function setupDefaults():void {
			return;
		}

		protected function setupMouseEvents():void {
			this.mouseChildren = false;
			this.buttonMode = true;
			if (getConfigParam('link')) {
				addEventListener(MouseEvent.CLICK, clickHandler);
			} else {
				this.mouseEnabled = false;
			}
		}
		
		protected function loadFile():void {
			var versionRE:RegExp = /(\d+)\.(\d+)\./;
			var versionInfo:Array = versionRE.exec(_player.version);
			var prefix:String = getConfigParam('prefix');
			if (getConfigParam('file') && prefix) {
				try {
					if (RootReference.root.loaderInfo.url.indexOf("https://") == 0) {
						prefix = prefix.replace("http://", "https://secure");
					}
				} catch(e:Error) {}
				defaults['file'] = prefix + versionInfo[1] + "/" + versionInfo[2] + "/" + getConfigParam('file');
			}
			
			if (getConfigParam('file') && RootReference.root.loaderInfo.url.indexOf("http")==0) {
				loader = new Loader();
				loader.contentLoaderInfo.addEventListener(Event.COMPLETE, loaderHandler);
				loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
				loader.load(new URLRequest(getConfigParam('file')));
			}
		}
		
		/** Logo loaded - add to display **/
		protected function loaderHandler(evt:Event):void {
/*			if (getConfigParam('hide').toString() == "true" 
					&& !(_player.state == PlayerState.BUFFERING || _player.state == PlayerState.PLAYING) ) {
				visible = false;
			}
*/			if (loader is DisplayObject) {
				addChild(loader);
				if (_loadCallback != null) _loadCallback();
//				resize(_width, _height);
			} else {
				Logger.log("Logo was not a display object");
			}
		}
		
		/** Logo failed to load - die **/
		protected function errorHandler(evt:ErrorEvent):void {
			Logger.log("Failed to load logo: " + evt.text);
		}
		
		
		/** Handles mouse clicks **/
		protected function clickHandler(evt:MouseEvent):void {
			_player.pause();
			_player.fullscreen(false);
			var link:String = getConfigParam('link');
			if (link) {
				navigateToURL(new URLRequest(Strings.cleanLink(link)), getConfigParam('linktarget'));
			}
		}
		
		/** Handles mouse outs **/
		protected function outHandler(evt:MouseEvent=null):void {
			alpha = getConfigParam('out');
		}
		
		
		/** Handles mouse overs **/
		protected function overHandler(evt:MouseEvent):void {
			if (getConfigParam('link')) {
				alpha = getConfigParam('over');
			}
		}
		

		/** Fade in **/
		override public function show():void {
//			if (getConfigParam('hide').toString() == "true") {
				visible = true;
				_showing = true;
				//alpha = 0;
				clearTimeout(timeoutInterval);
				animations.fade(getConfigParam('out'), 0.5);
				timeoutInterval = setTimeout(hide, timeout * 1000);
				mouseEnabled = true;
//			}
		}
		
		
		/** Fade out **/
		override public function hide():void {
//			if (getConfigParam('hide').toString() == "true") {
				mouseEnabled = false;
				_showing = false;
				animations.fade(0, 0.5);
				clearTimeout(timeoutInterval);
//			}
		}
		
		
		/** Resizes the logo **/
		override public function resize(width:Number, height:Number):void {
			_width = width;
			_height = height;
			var image:DisplayObject = loader ? loader : null;
			var margin:Number = getConfigParam('margin');
			var position:String = (getConfigParam('position') as String).toLowerCase(); 
			if (image) {
				if (position.indexOf('right') >= 0) {
					image.x = _width - image.width - margin;
				} else {
					image.x = margin;
				}
				
				if (position.indexOf('bottom') >= 0) {
					image.y = _height - image.height - margin;
				} else {
					image.y = margin;
				}
			}
		}
		
		public function get position():String {
			return String(getConfigParam('position')).toLowerCase();
		}
		
		public function get margin():Number {
			return Number(getConfigParam('margin'));
		}
		
		/** Gets a configuration parameter **/
		override protected function getConfigParam(param:String):* {
			return defaults[param];
		}

	}
}