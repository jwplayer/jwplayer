package com.longtailvideo.jwplayer.view.components {
	import flash.display.DisplayObject;
	import flash.display.DisplayObjectContainer;
	import flash.display.Sprite;
	import flash.text.TextField;
	
	
	public class ControlbarLayoutManager {
		protected var _controlbar:ControlbarComponent;
		protected var _currentLeft:Number;
		protected var _currentRight:Number;
		protected var _height:Number;
		
		protected var _tabLeft:Number;
		protected var _tabRight:Number;
		
		public function ControlbarLayoutManager(controlbar:ControlbarComponent) {
			_controlbar = controlbar;
		}
		
		
		public function resize(width:Number, height:Number):void {
			if (width && height){
				_height = height;
				_currentLeft = 0;
				if (_controlbar.getButton('capLeft')){
					_currentLeft += _controlbar.getButton('capLeft').width;
				}
				_currentRight = width;
				if (_controlbar.getButton('capRight')){
					_currentRight -= _controlbar.getButton('capRight').width;
				}
				var controlbarPattern:RegExp = /\[(.*)\]\[(.*)\]\[(.*)\]/;
				var result:Object = controlbarPattern.exec(_controlbar.layout);
				
				_tabLeft = 300;
				_tabRight = 399;
				
				position(result[1], "left");
				position(result[3], "right");
				positionCenter(result[2]);
			}
		}
		
		
		private function position(group:String, align:String):void {
			var items:Array = group.split(/(<[^>]*>)/);
			if (align == "right") { items = items.reverse(); }
			for  (var i:Number = 0; i < items.length; i++) {
				var item:String = items[i];
				if (item) {
					var dividerMatch:Array = (/<(.*)>/).exec(item);
					if (dividerMatch) {
						if (isNaN(dividerMatch[1])) {
							place(_controlbar.getButton(dividerMatch[1]), align);
						} else {
							var space:Number = Number(dividerMatch[1]);
							if (align == "left") {
								_currentLeft += space;
							} else if (align == "right") {
								_currentRight -= space;
							}
						}
						
					} else {
						var spacers:Array = item.split(" ");
						if (align == "right") { spacers = spacers.reverse(); }
						for (var j:Number = 0; j < spacers.length; j++) {
							var name:String = spacers[j];
							var button:DisplayObject = _controlbar.getButton(spacers[j]);
							place(_controlbar.getButton(spacers[j]), align);
						}
					}
				}
			}
		}
		
		private function place(displayObject:DisplayObject, align:String):void {
			var displayObjectSprite:Sprite = displayObject as Sprite;
			if (align == "left") {
				if (displayObjectSprite && displayObjectSprite.buttonMode) {
					displayObjectSprite.tabIndex = _tabLeft++;
				}
				placeLeft(displayObject);
			} else if (align == "right") {
				if (displayObjectSprite && displayObjectSprite.buttonMode) {
					displayObjectSprite.tabIndex = _tabRight--;
				}
				placeRight(displayObject);
			}
		}
		
		
		private function placeLeft(displayObject:DisplayObject):void {
			if (displayObject) {
				displayObject.visible = true;
				if (!_controlbar.contains(displayObject)) {
					_controlbar.addChild(displayObject);
				}
				
				var doc:DisplayObjectContainer = displayObject as DisplayObjectContainer;
				if (doc && doc.getChildByName('text') is TextField && !doc.getChildByName('back') ) {
					_currentLeft += 5;
				} else if (displayObject is Slider && (displayObject as Slider).capsWidth == 0) {
					_currentLeft += 5;
				}
				
				displayObject.x = _currentLeft;	
				displayObject.y = (_height - displayObject.height) / 2;

				_currentLeft = _currentLeft + displayObject.width;								

				if (doc && doc.getChildByName('text') is TextField && !doc.getChildByName('back')) {
					_currentLeft += 5;
				} else if (displayObject is Slider && (displayObject as Slider).capsWidth == 0) {
					_currentLeft += 5;
				}
				
			}
		}
		
		
		private function placeRight(displayObject:DisplayObject):void {
			if (displayObject) {
				displayObject.visible = true;
				if (!_controlbar.contains(displayObject)) {
					_controlbar.addChild(displayObject);
				}

				var doc:DisplayObjectContainer = displayObject as DisplayObjectContainer;
				if (doc && doc.getChildByName('text') is TextField && !doc.getChildByName('back')) {
					_currentRight -= 6;
				} else if (displayObject is Slider && (displayObject as Slider).capsWidth == 0) {
					_currentRight -= 6;
				}
				
				_currentRight = _currentRight - displayObject.width;
				displayObject.x = _currentRight;
				displayObject.y = (_height - displayObject.height) / 2;

				if (doc && doc.getChildByName('text') is TextField && !doc.getChildByName('back')) {
					_currentRight -= 5;
				} else if (displayObject is Slider && (displayObject as Slider).capsWidth == 0) {
					_currentRight -= 5;
				}
			}
		}
		
		
		private function positionCenter(center:String):void {
			var centerPattern:RegExp = /\W/;
			var elements:Array = center.split(centerPattern);
			var dividers:Array = center.split(/<[^\>]*>/);
			var divider:DisplayObject = _controlbar.getButton("divider");
			var dividerOffset:Number = 0;
			if (divider) {
				dividerOffset = divider.width * (dividers.length - 1);
			}
			var elementWidth:Number = (_currentRight - _currentLeft - dividerOffset) / elements.length;
			for (var i:Number = 0; i < dividers.length; i++) {
				if (i > 0) {
					placeLeft(divider);
				}
				var spacers:Array = (dividers[i] as String).split(" ");
				for (var j:Number = 0; j < spacers.length; j++) {
					var element:DisplayObject = _controlbar.getButton(spacers[j]);
					if (element) {
						if (element is ComponentButton){
							(element as ComponentButton).resize(elementWidth, element.height);
						} else if (element is Slider) {
							(element as Slider).resize(elementWidth, element.height);
						}
						element.visible = true;
						if (!_controlbar.contains(element)) {
							_controlbar.addChild(element);
						}
						element.x = _currentLeft;	
						element.y = (_height - element.height) / 2;
					}
				}
			}
		}
	}
}