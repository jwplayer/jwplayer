package com.longtailvideo.jwplayer.view.components
{
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
		
		private function getSkinElement(name:String):DisplayObject {
			var elem:DisplayObject = skin.getSkinElement('tooltip', name);
			if (elem) return elem;
			else return new Sprite();
		}

		private function resize(width:Number, height:Number):void {
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
			back.width = borders.top.width;
			back.height = borders.left.height;
			back.x = borders.top.x;
			back.y = borders.left.y;
			arrow.x = width / 2 - arrow.width;
			arrow.y = height;
		}
		
		public override function set width(value:Number):void {
			resize(value, height);
			super.width = value;
		}

		public override function set height(value:Number):void {
			resize(width, value);
			super.height = value;
		}
		
		public override function addChild(child:DisplayObject):DisplayObject {
			child.x = borders.right.width;
			child.y = borders.top.height; 
			if (child.width > width) {
				width = child.width + borders.left.width + borders.right.width;
			}
			if (child.height > height) {
				height = child.height + borders.top.height + borders.bottom.height;
			}
			return super.addChild(child); 
		}

		
		
	}
}