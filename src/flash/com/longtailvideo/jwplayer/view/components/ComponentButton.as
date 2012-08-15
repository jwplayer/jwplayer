package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.utils.*;
	import flash.display.*;
	import flash.events.*;
	import flash.net.*;
	import flash.utils.*;
	import flash.external.ExternalInterface;
	
	public class ComponentButton extends MovieClip {
		protected var _background:DisplayObject;
		protected var _clickFunction:*;
		protected var _imageLayer:Sprite;
		protected var _outIcon:DisplayObject;
		protected var _overIcon:DisplayObject;
		protected var _enabled:Boolean = true;
		protected var _over:Boolean = false;

		protected static var currentTabIndex:Number = 100;
		
		public function ComponentButton () {
			this.tabEnabled = true;
			this.tabChildren = false;
			this.tabIndex = currentTabIndex++;
			this.buttonMode = true;
		}

	
		public function init():void {
			if (_background) {
				nameDisplayObject("backgroundLayer", _background);
				addChild(_background);
				_background.x = 0;
				_background.y = 0;
			}
			_imageLayer = new Sprite();
			_imageLayer.buttonMode = true;
			_imageLayer.mouseChildren = false;
			nameDisplayObject("imageLayer", _imageLayer);
			addChild(_imageLayer);
			_imageLayer.x = 0;
			_imageLayer.y = 0;
			setImage(_outIcon);
//			addEventListener(MouseEvent.MOUSE_OVER, overHandler);
//			addEventListener(MouseEvent.MOUSE_OUT, outHandler);
			addEventListener(MouseEvent.CLICK, clickHandler);
			RootReference.stage.addEventListener(MouseEvent.MOUSE_MOVE, moveHandler);
			//RootReference.stage.addEventListener(MouseEvent.CLICK, clickHandler);
			
		}
		
		protected function moveHandler(event:MouseEvent):void {
			if (!visible || !parent) return;
			var contains:Boolean = getBounds(RootReference.stage).contains(event.stageX, event.stageY);
			if (!_over && contains) {
				_over = true;
				overHandler(event);
			} else if (_over && !contains) {
				_over = false;
				outHandler(event);
			}
		}
		
		protected function outHandler(event:MouseEvent=null):void {
			if (_overIcon) {
				if (_imageLayer.contains(_overIcon)) {
					_imageLayer.removeChild(_overIcon);
				}
				setImage(_outIcon);
			}
		}
		
		
		protected function overHandler(event:MouseEvent):void {
			if (_overIcon) {
				if (_imageLayer.contains(_outIcon)) {
					_imageLayer.removeChild(_outIcon);
				}
				setImage(_overIcon);
			}
		}
		
				
		/** Handles mouse clicks **/
		protected function clickHandler(event:MouseEvent):void {
			if (_enabled) {
				try {
					if (_clickFunction is Function) {
						_clickFunction(event);
					} else if (_clickFunction is String) {
						ExternalInterface.call("function() { " + _clickFunction + " }");
					}
				} catch (error:Error) {
					Logger.log(error.message);
				}
			}
		}

		
		/**
		 * Change the image in the button.
		 *
		 * @param dpo	The new caption for the button.
		 **/
		protected function setImage(dpo:DisplayObject):void {
			if (dpo) {
				if (_imageLayer.contains(dpo)) {
					_imageLayer.removeChild(dpo);
				}
				_imageLayer.addChild(dpo);
				centerIcon(dpo);
			}
		}


		public function setBackground(background:DisplayObject = null):void {
			if (_background){
				removeChild(_background);
			}
			if (background) {
				_background = background;
				nameDisplayObject("backgroundLayer", _background);
				addChild(_background);
				setChildIndex(_background, 0);
				_background.x = 0;
				_background.y = 0;
			}
		}

		
		public function setOutIcon(outIcon:* = null):void {
			if (outIcon is DisplayObject) {
				_outIcon = outIcon as DisplayObject;
			} else if (outIcon is String) {
				var loader:Loader = new Loader();
				loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(evt:Event):void {});
				loader.contentLoaderInfo.addEventListener(Event.COMPLETE, function(evt:Event):void { centerIcon(loader); });
				loader.load(new URLRequest(outIcon));
				_outIcon = loader;
			}
		}
		
		
		public function setOverIcon(overIcon:DisplayObject = null):void {
			if (overIcon) {
				_overIcon = overIcon;
			}
		}
		
		protected function centerIcon(icon:DisplayObject):void {
			if (icon) {
				if (_background) {
					Stretcher.stretch(icon, _background.width, _background.height, Stretcher.NONE);
				} else {
					icon.x = 0;
					icon.y = 0;
				}
			
				
			}
		}

		public function set clickFunction(clickFunction:*):void {
			_clickFunction = clickFunction;
		}
		
		/** Enable / disable button **/
		public override function set enabled(state:Boolean):void {
			_enabled = state;
		}
		
		public override function get enabled():Boolean {
			return _enabled;
		} 


		private function nameDisplayObject(name:String, displayObject:DisplayObject):void {
			try {
				displayObject.name = name;
			} catch (error:Error) {
				
			}
		}
	}
}