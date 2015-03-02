package com.longtailvideo.jwplayer.view.components
{
	import com.longtailvideo.jwplayer.model.Color;
	import com.longtailvideo.jwplayer.utils.Animations;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.DisplayObject;
	import flash.display.Sprite;
	import flash.geom.Rectangle;
	import flash.text.TextField;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	
	public class TooltipOverlay extends Sprite {
		// Border skin elements
		protected var borders:Object = {};
		// Background element
		protected var back:DisplayObject;
		// Arrow
		protected var arrow:DisplayObject;
		// Skin
		protected var skin:ISkin;
		// Tooltip contents
		protected var content:Sprite;
		// Fade in/out animation
		protected var fade:Animations;
		// Label text field
		protected var _text:TextField;
		// Whether the arrow should appear on top or bottom
		protected var _inverted:Boolean = false;
		// Last set X position
		private var _x:Number = 0;
		// Last set Y position
		private var _y:Number = 0;
		// X offset
		private var _offset:Number = 0;
		// Format for text
		protected var textFormat:TextFormat;
		// Default settings
		protected var settings:Object = {
			fontcase: null,
			fontcolor: 0xcccccc,
			fontsize: 11,
			fontweight: null,
			activecolor: 0xffffff,
			overcolor: 0xffffff
		}
		// Dimensions of the content's children
		protected var contentDimensions:Rectangle = new Rectangle();
		// Max Width not including borders and padding
		private var _maxWidth:Number = 0;
			
			
		public function TooltipOverlay(skin:ISkin, inverted:Boolean=false) {
			this.skin = skin;
			
			for (var prop:String in settings) {
				if (getSkinSetting(prop)) {
					settings[prop] = getSkinSetting(prop);
				}
			} 

			textFormat = new TextFormat("_sans");
			textFormat.size = settings.fontsize;
			textFormat.color = new Color(settings.fontcolor).color;
			textFormat.bold = (String(settings.fontweight).toLowerCase() == "bold");

			_inverted = inverted;
			createBorders();
			back = getSkinElement('background');
			super.addChild(back);
			arrow = getSkinElement('arrow');
			if (_inverted) arrow.scaleY = -1;
			super.addChild(arrow);
			fade = new Animations(this);
			_text = new TextField();
			_text.autoSize = TextFieldAutoSize.LEFT;
			_text.defaultTextFormat = new TextFormat("_sans", textFormat.size, textFormat.color, textFormat.bold, null, null, null, null, TextFormatAlign.CENTER, 5, 5);
			_text.visible = false;
			
			content = new Sprite();
			content.addChild(_text);
			//super.addChild(content);
			
			redraw();
		}
		
		private function createBorders():void {
			for each (var vertical:String in ["top", "bottom"]) {
				createBorderElement(vertical);
				for each (var horizontal:String in ["left", "right"]) {
					createBorderElement(vertical+horizontal);
					createBorderElement(horizontal);
				}
			}
		}
		
		private function createBorderElement(name:String):void {
			if (!borders[name]) {
				borders[name] = getSkinElement('cap'+name);
				super.addChild(borders[name]);
			}
		}
		
		protected function getSkinElement(name:String):DisplayObject {
			var elem:DisplayObject = skin.getSkinElement('tooltip', name);
			if (!elem) {
				elem = new Sprite();
			}
			return elem;
		}
		
		protected function getSkinSetting(name:String):* {
			return skin.getSkinProperties() ? skin.getSkinProperties()['tooltip.'+name] : null;
		}

		protected function redraw():void {
			updateContentDimensions();
			borders.top.x = borders.bottom.x = borders.left.width;
			borders.top.width = borders.bottom.width = contentDimensions.width;
			borders.topright.x = borders.top.x + borders.top.width;
			borders.left.height = borders.right.height = contentDimensions.height;
			borders.left.y = borders.right.y = borders.top.height;
			borders.bottomleft.y = borders.bottomright.y = borders.bottom.y = borders.top.height + contentDimensions.height;
			borders.topright.x = borders.right.x = borders.bottomright.x = borders.left.width + contentDimensions.width;

			back.height = contentDimensions.height;
			back.width = contentDimensions.width;
			back.x = content.x = borders.top.x;
			back.y = content.y = borders.left.y;
			arrow.y = _inverted ? 0 : borders.bottom.y + borders.bottom.height;
			positionX();
			positionY();
		}
		
		public override function addChild(child:DisplayObject):DisplayObject {
			content.addChild(child);
			redraw();
			super.addChild(content);
			return child;
		}
		
		protected function updateContentDimensions():void {
			contentDimensions = new Rectangle(0, 0, 0, 0);
			// For the first pass, figure out the minimum x/y coordinates of the children
			for (var i:Number=0; i < content.numChildren; i++) {
				var child:DisplayObject = content.getChildAt(i);
				if (child != _text) {
					contentDimensions.x = Math.min(contentDimensions.x, child.x);
					contentDimensions.y = Math.min(contentDimensions.y, child.y);
				}
			}
			// Second pass sets the width/height and subtracts the origin
			for (i=0; i < content.numChildren; i++) {
				child = content.getChildAt(i);
				if (child != _text) {
					contentDimensions.width = Math.max(contentDimensions.width, child.x + child.width) - contentDimensions.x;
					contentDimensions.height = Math.max(contentDimensions.height, child.y + child.height) - contentDimensions.y;
				}
			}
			
			if (_text.visible) {
				_text.x = _text.y = 0;
				if (contentDimensions.width > 0) {
					_text.multiline = true;
					_text.wordWrap = true;
					_text.width = contentDimensions.width;
					_text.autoSize = TextFieldAutoSize.CENTER;
					_text.y = contentDimensions.height + 3; 
					contentDimensions.height += _text.height + 3;
				} else {
					var width:Number = _text.width;
					if (_maxWidth && width > _maxWidth) {
						_text.multiline = true;
						_text.wordWrap = true;
						_text.width = width;
						_text.autoSize = TextFieldAutoSize.CENTER;
						if (contentDimensions.height > 0) {
							_text.y = contentDimensions.height + 3;
						}
						contentDimensions.height += _text.height + 6;
					} else {
						_text.multiline = false;
						_text.wordWrap = false;
					}
					contentDimensions.width = width;
					contentDimensions.height = _text.height;
				}
			}
		}
		
		public override function removeChild(child:DisplayObject):DisplayObject {
			content.removeChild(child);
			redraw();
			return child;
		}
		
		public override function contains(child:DisplayObject):Boolean {
			return content.contains(child);
		}
		
		public function set text(s:String):void {
			_text.visible = Boolean(s);
			if (s) {
				var fontcase:String = getSkinSetting("fontcase");
				if (fontcase && fontcase.toLowerCase() == "upper") s = s.toUpperCase();
			}
			_text.text = s;
			redraw();
			super.addChild(content);
		}
		
		public function set maxWidth(width:Number):void {
			_maxWidth = width;
		}
		
		public function set offsetX(offset:Number):void {
			_offset = offset;
			positionX();
		}
		
		public function get offsetX():Number {
			return _offset;
		}

		public override function set x(value:Number):void {
			_x = value;
			positionX();
		}
		
		public override function set y(value:Number):void {
			_y = value;
			positionY();
		}
		
		protected function positionX():void {
			arrow.x = ((contentDimensions.width + borders.left.width + borders.right.width - arrow.width) / 2) + _offset;
			super.x = Math.ceil(_x - arrow.x - (arrow.width/2));
		}
		
		protected function positionY():void {
			super.y = Math.ceil(_y - (_inverted ? -arrow.height : (borders.top.height + borders.bottom.height + arrow.height + contentDimensions.height)));
		}
		
		public function hide():void {
			fade.cancelAnimation();
			fade.fade(0);
		}

		public function show():void {
			fade.cancelAnimation();
			fade.fade(1);
		}
		

	}
}