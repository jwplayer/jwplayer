package com.longtailvideo.jwplayer.view.components
{
	import com.longtailvideo.jwplayer.utils.Animations;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.*;
	import flash.text.*;
	import flash.external.ExternalInterface;
	
	public class TooltipOverlay extends Sprite {
		// Border skin elements
		private var borders:Object = {};
		// Background element
		private var back:DisplayObject;
		// Arrow
		private var arrow:DisplayObject;
		// Skin
		protected var skin:ISkin;
		// Dimensions of tooltip contents
		protected var contentWidth:Number = 0;
		protected var contentHeight:Number = 0;
		protected var fade:Animations;
		protected var _text:TextField;
		
		
		public function TooltipOverlay(skin:ISkin) {
			this.skin = skin;
			createBorders();
			back = getSkinElement('background');
			super.addChild(back);
			arrow = getSkinElement('arrow');
			super.addChild(arrow);
			fade = new Animations(this);
			_text = new TextField();
			_text.autoSize = TextFieldAutoSize.CENTER;
			_text.defaultTextFormat = new TextFormat("_sans", 12, 0xffffff, null, null, null, null, null, TextFormatAlign.CENTER, 5, 5);
			_text.visible = false;
			super.addChild(_text);
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
			if (elem) return elem;
			else return new Sprite();
		}
		
		protected function getSkinSetting(name:String):* {
			return skin.getSkinProperties() ? skin.getSkinProperties()['tooltip.'+name] : null;
		}

		protected function resize(wid:Number, hei:Number):void {
			wid = Math.ceil(wid);
			hei = Math.ceil(hei);
			
			for each (var vertical:String in ["top", "bottom"]) {
				for each (var horizontal:String in ["left", "right"]) {
					borders[horizontal].x = borders[vertical+horizontal].x = (horizontal == "left") ? 0 : wid - borders[horizontal].width;  
					borders[vertical].y = borders[vertical+horizontal].y = (vertical == "top") ? 0 : hei - borders[vertical].height;

					borders[horizontal].y = borders.top.height; 
					borders[horizontal].height = hei - borders.top.height - borders.bottom.height;
				}
				borders[vertical].x = borders.left.width; 
				borders[vertical].width = wid - borders.left.width - borders.right.width;
			}
			
			contentWidth = borders.top.width;
			contentHeight = borders.left.height;
			back.height = contentHeight;
			back.width = contentWidth;
			back.x = borders.top.x;
			back.y = borders.left.y;
			arrow.x = Math.ceil((contentWidth + borders.left.width + borders.right.width - arrow.width) / 2);
			arrow.y = hei;
		}
		
		public override function set width(value:Number):void {
			resize(Math.max(value, borders.left.width + borders.right.width), height);
		}

		public override function set height(value:Number):void {
			resize(width, Math.round(Math.max(value, borders.bottom.height + borders.top.height)));
		}
		
		public override function addChild(child:DisplayObject):DisplayObject {
			positionChild(child);
			return super.addChild(child); 
		}
		
		private function positionChild(child:DisplayObject):void {
			var wid:Number = contentWidth + borders.right.width + borders.left.width;
			var hei:Number = contentHeight + borders.top.width + borders.bottom.width;
			var toResize:Boolean = false;
			child.x += borders.left.width;
			child.y += borders.top.height;
			if (child.x + child.width > contentWidth) {
				wid = child.x + child.width + borders.right.width;
				toResize = true;
			}
			if (child.y + child.height > contentHeight) {
				hei = child.y + child.height + borders.bottom.height;
				toResize = true;
			}
			if (toResize) resize(wid, hei);
		}

		public function set text(s:String):void {
			_text.visible = Boolean(s);
			if (s) {
				_text.text = s;
				_text.x = _text.y = 0;
				_text.width = _text.textWidth + 10;
				_text.height = _text.textHeight;
				positionChild(_text);
			}
		}
		
		public function offsetX(offset:Number):void {
			super.x = super.x + offset;
			arrow.x -= offset;
		}
		
		public override function set x(value:Number):void {
			arrow.x = Math.ceil((contentWidth + borders.left.width + borders.right.width - arrow.width) / 2);
			super.x = Math.ceil(value - arrow.x - (arrow.width / 2));
		}

		public override function set y(value:Number):void {
			super.y = Math.ceil(value - contentHeight - arrow.height);
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