package com.longtailvideo.jwplayer.view.components
{
	import com.longtailvideo.jwplayer.utils.Animations;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.*;
	
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
		protected var contentWidth:Number = -1;
		protected var contentHeight:Number = -1;
		
		
		public function TooltipOverlay(skin:ISkin) {
			this.skin = skin;
			createBorders();
			back = getSkinElement('background');
			super.addChild(back);
			arrow = getSkinElement('arrow');
			super.addChild(arrow);
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

		protected function resize(width:Number, height:Number):void {
			for each (var vertical:String in ["top", "bottom"]) {
				for each (var horizontal:String in ["left", "right"]) {
					borders[horizontal].x = borders[vertical+horizontal].x = (horizontal == "left") ? 0 : width - borders[horizontal].width;  
					borders[vertical].y = borders[vertical+horizontal].y = (vertical == "top") ? 0 : height - borders[vertical].height;

					borders[horizontal].y = borders.top.height; 
					borders[horizontal].height = height - borders.top.height - borders.bottom.height;
				}
				borders[vertical].x = borders.left.width; 
				borders[vertical].width = width - borders.left.width - borders.right.width;
			}
			contentWidth = back.width = borders.top.width;
			contentHeight = back.height = borders.left.height;
			back.x = borders.top.x;
			back.y = borders.left.y;
			arrow.x = (this.width - arrow.width) / 2;
			arrow.y = height;
			
		}
		
		public override function set width(value:Number):void {
			resize(value, height);
		}

		public override function set height(value:Number):void {
			resize(width, value);
		}
		
		public override function addChild(child:DisplayObject):DisplayObject {
			child.x += borders.right.width;
			child.y += borders.top.height; 
			if (child.x + child.width > contentWidth) {
				width = child.x + child.width + borders.right.width;
			}
			if (child.y + child.height > contentHeight) {
				height = child.y + child.height + borders.bottom.height;
			}
			return super.addChild(child); 
		}

		public override function set x(value:Number):void {
			super.x = value - arrow.x - arrow.width / 2;
		}
		
		public override function set y(value:Number):void {
			super.y = value - contentHeight - arrow.height;
		}
		
		public function hide():void {
			if (alpha == 1) {
				new Animations(this).fade(0);
			}
		}

		public function show():void {
			if (alpha == 0) {
				new Animations(this).fade(1);
			}
		}

	}
}