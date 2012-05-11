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
		protected var _assetColor:Color;
		/** Reference to the text field **/
		protected var _text:TextField;
		/** Background colorization **/
		private var _colorize:Boolean;
		/** Background over state **/
		private var _outBackground:Sprite;
		/** Background over state **/
		private var _overBackground:Sprite;
		
		
		/** Constructor **/
		public function DockButton():void {
			var textFormat:TextFormat = new TextFormat();
			textFormat.align = TextFormatAlign.CENTER;
			textFormat.font = "_sans";
			textFormat.size = 11;
			_text = new TextField();
			_text.defaultTextFormat = textFormat;
			_text.x = 0;
			_text.y = 30;
			_text.width = 50;
			_text.height = 20;
		}
		
		
		/** Sets up the button **/
		override public function init():void {
			if (!_overBackground && !_outBackground) {
				setupBackground();
				setBackground(_outBackground);
			} else if (_outBackground){
				if (_colorize && _outColor) {
					_outBackground.transform.colorTransform = createColorTransform(_outColor);
				}
				setBackground(_outBackground);
			} else if (!_background) {
				var backgroundSprite:Sprite = new Sprite();
				backgroundSprite.graphics.clear();
				backgroundSprite.graphics.beginFill(_outColor ? _outColor.color : 0x000000, 0.55);
				backgroundSprite.graphics.drawRect(0, 0, 50, 50);
				backgroundSprite.graphics.endFill();
				setBackground(backgroundSprite);
			}
			super.init();
			_imageLayer.addChild(_text);
			if (_assetColor) {
				_text.textColor = _assetColor.color;
			} else {
				_text.textColor = 0xFFFFFF;
			}
			mouseChildren = false;
			buttonMode = true;
		}
		
		
		protected function createColorTransform (color:Color):ColorTransform {
			var colorTransform:ColorTransform = new ColorTransform();
			if (color)
				colorTransform.color = color.color;
			return colorTransform;
		}

		
		/** Draws the dock icon background **/
		private function setupBackground ():void {
			_outBackground = new Sprite();
			_outBackground.graphics.clear();
			_outBackground.graphics.beginFill(_outColor ? _outColor.color : 0x000000, 0.55);
			_outBackground.graphics.drawRect(0, 0, 50, 50);
			_outBackground.graphics.endFill();
			
			_overBackground = new Sprite();
			_overBackground.graphics.clear();
			_overBackground.graphics.beginFill(_overColor ? _overColor.color : 0x000000, 0.55);
			_overBackground.graphics.drawRect(0, 0, 50, 50);
			_overBackground.graphics.endFill();
		}
		
		
		public function centerText ():void {
			_text.width = _background.width;
			_text.y = _background.height / 2 + (_background.height / 2 - _text.height) / 2;
		}

		
		override protected function centerIcon (icon:DisplayObject):void {
			if (icon) {
				if (_background) {
					icon.x = (_background.width - icon.width) / 2;
					icon.y = (_background.height - icon.height * 1.5) / 2;
				} else {
					icon.x = 0;
					icon.y = 0;
				}
			}
		}	
		
		
		/** When rolling over, the background is color changed. **/
		override protected function outHandler (evt:MouseEvent):void {
			if (_outBackground) {
				setBackground(_outBackground);
			} else if (_colorize) {
				_background.transform.colorTransform = createColorTransform(_outColor);
			}
		}
		
		
		/** When rolling over, the background is color changed. **/
		override protected function overHandler (evt:MouseEvent):void {
			if (_overBackground) {
				setBackground(_overBackground);
			} else if (_colorize) {
				_background.transform.colorTransform = createColorTransform(_overColor);
			}
		}
		
		
		override protected function clickHandler (evt:MouseEvent):void {
			super.clickHandler(evt);
		}
			
		
		public function set assetColor (assetColor:Color):void {
			_assetColor = assetColor;
		}
		
		
		public function set colorize (value:Boolean):void {
			_colorize = value;
		}
		
		
		public function set outBackground (outBackground:Sprite):void {
			_outBackground = outBackground;
		}
		
		
		public function set overBackground (overBackground:Sprite):void {
			_overBackground = overBackground;
		}
		
		
		public function set text (text:String):void {
			_text.text = text;
			centerText();
		}
		
		
		/** Legacy support**/
		public function get field ():TextField {
			return _text;
		}
	}
}

