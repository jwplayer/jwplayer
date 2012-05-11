package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.ViewEvent;
	import com.longtailvideo.jwplayer.utils.RootReference;
	
	import flash.display.DisplayObject;
	import flash.display.Sprite;
	import flash.events.MouseEvent;
	import flash.geom.ColorTransform;
	import flash.geom.Rectangle;
	
	
	public class Slider extends Sprite {
		protected var _rail:Sprite;
		protected var _buffer:Sprite;
		protected var _progress:Sprite;
		protected var _thumb:Sprite;
		protected var _capLeft:Sprite;
		protected var _capRight:Sprite;
		protected var _clickArea:Sprite;
		protected var _currentThumb:Number = 0;
		protected var _currentProgress:Number = 0;
		protected var _currentBuffer:Number = 0;
		/** Color object for frontcolor. **/
		protected var _front:ColorTransform;
		/** Color object for lightcolor. **/
		protected var _light:ColorTransform;
		/** Current width and height **/
		protected var _width:Number;
		protected var _height:Number;
		/** Currently dragging thumb **/
		protected var _dragging:Boolean;
		/** Lock state of the slider **/
		protected var _lock:Boolean;
		/** If the buffer has a percentage offset **/
		protected var _bufferOffset:Number = 0;
		
		public function Slider(rail:DisplayObject, buffer:DisplayObject, progress:DisplayObject, thumb:DisplayObject, capLeft:DisplayObject=null, capRight:DisplayObject=null) {
			super();
			
			if (!rail || !progress) {
				throw(new ArgumentError("Required slider elements missing"));
			}
			
			this.buttonMode = true;
			this.mouseChildren = true;
			
			_rail = addElement(rail, "rail", true);
			_buffer = addElement(buffer, "buffer");
			_progress = addElement(progress, "progress");
			_thumb = addElement(thumb, "thumb");
			_capLeft = addElement(capLeft, "capleft", true);
			_capRight = addElement(capRight, "capright", true);
			_clickArea = addElement(null, "clickarea", true);
			
			_clickArea.addEventListener(MouseEvent.MOUSE_DOWN, downHandler);
			_clickArea.addEventListener(MouseEvent.MOUSE_OVER, overHandler);
			_clickArea.addEventListener(MouseEvent.MOUSE_OUT, outHandler);
		}
		
		
		private function addElement(element:DisplayObject, name:String, visible:Boolean=false):Sprite {
			if (!element) {
				element = new Sprite();
			}
			element.visible = visible;
			addChild(element);
			element.name = name;
			return element as Sprite;
		}
		
		
		protected function setThumb(progress:Number):void {
			_currentThumb = progress;
		}
		
		
		public function setProgress(progress:Number):void {
			if (isNaN(progress)){
				progress = 0;
			}
			_currentProgress = progress;
			if (_progress) {
				_progress.visible = true;
			}
			setThumb(progress);
			resize(this.width, this.height);
		}
		
		/**
		 * @param buffer Percent buffered (0-100)
		 * @param offset Percent of the slider to begin buffer offset (0-100)
		 **/
		public function setBuffer(buffer:Number, offset:Number=NaN):void {
			if (!isNaN(buffer)) {
				_currentBuffer = Math.min(Math.max(buffer, 0), 100);
			}
			if (!isNaN(offset)) { 
				_bufferOffset = Math.min(Math.max(offset, 0), 100);
			}
			if (_buffer) {
				_buffer.visible = (_currentBuffer > 0);
			}
			resize(this.width, this.height);
		}
		
		public function resize(width:Number, height:Number):void {
			var scale:Number = this.scaleX;
			this.scaleX = 1;
			_width = width * scale - _capLeft.width - _capRight.width;
			_height = height;
			_capLeft.x = 0;
			_capRight.x = width - _capRight.width;
			
			var railMap:DisplayObject = _rail.getChildByName("bitmap"); 
			if (railMap) {
				railMap.width = _width;
				railMap.x = _capLeft.width;
				resizeElement(railMap);
			}
			var bufferMap:DisplayObject = _buffer.getChildByName("bitmap"); 
			if (bufferMap) {
				bufferMap.width = _width * (1 - (_bufferOffset / 100));
				bufferMap.x = _capLeft.width + _width * _bufferOffset / 100;
				resizeElement(bufferMap, _currentBuffer);
			}
			var progressMap:DisplayObject = _progress.getChildByName("bitmap"); 
			if (progressMap && !_dragging) {
				progressMap.width = _width;
				progressMap.x = _capLeft.width;
				resizeElement(progressMap, _currentProgress);
			}
			if (_thumb && !_dragging) {
				_thumb.x = _capLeft.width + (_width-_thumb.width) * _currentThumb / 100;
			}
			_clickArea.graphics.clear();
			_clickArea.graphics.beginFill(0, 0);
			_clickArea.graphics.drawRect(_capLeft.width, 0, _width, height); 
			verticalCenter();
		}
		
		
		private function resizeElement(element:DisplayObject, maskpercentage:Number=100):void {
			if (element) {
				if (_width && _height) {
					var mask:Sprite;
					if (element.mask) {
						mask = element.mask as Sprite;
					} else {
						mask = new Sprite();
						mask.name = "mask";
						addChild(mask);
						element.mask = mask;
					}
					mask.x = element.x;
					mask.graphics.clear();
					mask.graphics.beginFill(0x0000ff, 0);
					mask.graphics.drawRect(0, 0, element.width * maskpercentage / 100, element.height);
					mask.graphics.endFill();
				}
			}
		}
		
		private function verticalCenter():void {
			var maxHeight:Number = 0;
			var element:DisplayObject;
			
			for(var i:Number = 0; i < numChildren; i++) {
				element = getChildAt(i);
				if (element.height > maxHeight) maxHeight = element.height;
			}
			
			for(i = 0; i < numChildren; i++) {
				element = getChildAt(i);
				element.y = (maxHeight - element.height) / 2;
			}
		}
		
		/** Handle mouse downs. **/
		private function downHandler(evt:MouseEvent):void {
			if (_thumb && !_lock) {
				var rct:Rectangle = new Rectangle(_capLeft.width, _thumb.y, _rail.width - _thumb.width, 0);
				_thumb.startDrag(true, rct);
				_dragging = true;
				RootReference.stage.addEventListener(MouseEvent.MOUSE_UP, upHandler);
			}
		}
		
		
		/** Handle mouse releases. **/
		private function upHandler(evt:MouseEvent):void {
			RootReference.stage.removeEventListener(MouseEvent.MOUSE_UP, upHandler);
			_thumb.stopDrag();
			_dragging = false;
			var percent:Number = (_thumb.x - _capLeft.width) / (_rail.width - _thumb.width);
			dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_CLICK, percent));
			setThumb(percent * 100);
		}
		
		
		/** Handle mouseouts. **/
		private function outHandler(evt:MouseEvent):void {
			//slider.transform.colorTransform = front;
		}
		
		
		/** Handle mouseovers. **/
		private function overHandler(evt:MouseEvent):void {
			//slider.transform.colorTransform = light;
		}
		
		/** Reset the slider to its original state**/
		public function reset():void {
			setBuffer(0);
			setProgress(0);
		}
		
		public function lock():void {
			_lock = true;
		} 
		
		public function unlock():void{
			_lock = false;
		}
		
		public function get thumbVisible():Boolean {
			return _thumb.visible;
		}
		
		public function set thumbVisible(state:Boolean):void {
			_thumb.visible = state;
		}
		
		public function get capsWidth():Number {
			return _capLeft.width + _capRight.width;
		}
	}
}