/**
 * A button from within the dock.
 **/
package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.model.Color;
	
	import flash.display.*;
	import flash.events.*;
	import flash.geom.ColorTransform;
	import flash.text.TextField;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	
	public class DockButton extends ComponentButton {
		/** Asset color **/
		//protected var _assetColor:Color;
		/** Reference to the text field **/
		//protected var _text:TextField;
		/** Background colorization **/
		//private var _colorize:Boolean;
		/** Background over state **/
		private var _outBackground:DisplayObject;
		/** Background over state **/
		private var _overBackground:DisplayObject;
		/** Mouse-over label text **/
		private var _label:String;
		
		/** Constructor **/
		public function DockButton():void {
		}
		
		
		/** Sets up the button **/
		override public function init():void {
			if (!_overBackground && !_outBackground) {
				setupBackground();
				setBackground(_outBackground);
			} else if (_outBackground){
				setBackground(_outBackground);
			} else if (!_background) {
				var backgroundSprite:Sprite = new Sprite();
				backgroundSprite.graphics.clear();
				backgroundSprite.graphics.beginFill(0, 0.55);
				backgroundSprite.graphics.drawRect(0, 0, 50, 50);
				backgroundSprite.graphics.endFill();
				setBackground(backgroundSprite);
			}
			super.init();
			mouseChildren = false;
			buttonMode = true;
		}
		
		
		/** Draws the dock icon background if one doesn't exist **/
		private function setupBackground ():void {
			var defaultBG:Sprite = new Sprite();
			defaultBG.graphics.clear();
			defaultBG.graphics.beginFill(0, .55);
			defaultBG.graphics.drawRect(0, 0, 50, 50);
			defaultBG.graphics.endFill();
			
			_outBackground = defaultBG;
			_overBackground = defaultBG;
		}
		
		
		/** When rolling over, the background is color changed. **/
		override protected function outHandler (evt:MouseEvent):void {
			setBackground(_outBackground);
		}
		
		
		/** When rolling over, the background is color changed. **/
		override protected function overHandler (evt:MouseEvent):void {
			setBackground(_overBackground);
		}
		
		
		override protected function clickHandler (evt:MouseEvent):void {
			super.clickHandler(evt);
		}
			
		
		public function set outBackground (outBackground:DisplayObject):void {
			_outBackground = outBackground;
		}
		
		
		public function set overBackground (overBackground:DisplayObject):void {
			_overBackground = overBackground;
		}
		
		
		public function set label (text:String):void {
			_label = text;
		}
		
	}
}

