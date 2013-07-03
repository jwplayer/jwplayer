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
			var elementWidth:Number = (_currentRight - _currentLeft);

			var time:Slider = _controlbar.getButton("time") as Slider;
			var alt:Sprite = _controlbar.getButton("alt") as Sprite;
			if (time) {
				time.resize(elementWidth, time.height);
				if (!_controlbar.contains(time)) _controlbar.addChild(time);
				time.x = _currentLeft;	
				time.y = (_height - time.height) / 2;
			}
			
			if (alt) {
				var bg:DisplayObject = alt.getChildByName('back');
				bg.width  = elementWidth;

				var text:TextField = alt.getChildByName('text') as TextField;
				text.y = (bg.height - text.height) / 2;
				
				if (!_controlbar.contains(alt)) _controlbar.addChild(alt);
				alt.x = _currentLeft;	
				alt.y = (_height - alt.height) / 2;
			}
			
			
		}
	}
}