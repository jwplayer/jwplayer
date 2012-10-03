package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.ViewEvent;
	import com.longtailvideo.jwplayer.utils.Animations;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.RootReference;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.DisplayObject;
	import flash.display.Sprite;
	import flash.events.MouseEvent;
	import flash.geom.ColorTransform;
	import flash.geom.Rectangle;
	
	/**
	 * Sent when the slider is clicked
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_CLICK
	 */
	[Event(name="jwPlayerViewClick", type="com.longtailvideo.jwplayer.events.ViewEvent")]

	public class Slider extends Sprite {
		protected var _rail:Sprite;
		protected var _railCapLeft:Sprite;
		protected var _railCapRight:Sprite;
		protected var _buffer:Sprite;
		protected var _bufferCapLeft:Sprite;
		protected var _bufferCapRight:Sprite;
		protected var _progress:Sprite;
		protected var _progressCapLeft:Sprite;
		protected var _progressCapRight:Sprite;
		protected var _thumb:Sprite;
		protected var _capLeft:Sprite;
		protected var _capRight:Sprite;
		protected var _clickArea:Sprite;
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
		/** Name of the slider **/
		protected var _name:String;
		/** Skin **/
		protected var _skin:ISkin;
		/** Last set dimensions **/
		protected var _lastWidth:Number = 0;
		protected var _lastHeight:Number = 0;
		/** Vertical or horizontal slider **/
		protected var _vertical:Boolean;
		/** Which skin component to get the assets from **/
		protected var _skinComponent:String;
		protected var _isLive:Boolean;
		
		public function Slider(name:String, skin:ISkin, vertical:Boolean=false, component:String="controlbar") {
			_name = name;
			_skin = skin;
			_skinComponent = component;
			_vertical = vertical;
			
			this.buttonMode = true;
			this.mouseChildren = true;
			this.live = false;
			
			var left:String = vertical ? "Top" : "Left";
			var right:String = vertical ? "Bottom" : "Right";
			
			_rail = addElement("Rail", true);
			_railCapLeft = addElement("RailCap"+left, false);
			_railCapRight = addElement("RailCap"+right, false);
			_buffer = addElement("Buffer");
			_bufferCapLeft = addElement("BufferCap"+left);
			_bufferCapRight = addElement("BufferCap"+right);
			_progress = addElement("Progress");
			_progressCapLeft = addElement("ProgressCap"+left);
			_progressCapRight = addElement("ProgressCap"+right);
			
			if (_rail.width == 0 || _progress.width == 0) {
				throw(new ArgumentError("Required slider elements missing"));
			}
			
			_thumb = addElement("Thumb");
			_capLeft = addElement("Cap"+left, true);
			_capRight = addElement("Cap"+right, true);
			_clickArea = addElement("clickarea", true);
			
			_clickArea.addEventListener(MouseEvent.MOUSE_DOWN, downHandler);
			
			if (_vertical) {
				resize(width, _capLeft.height + _capRight.height + _railCapLeft.height + _rail.height + _railCapRight.height);
			} else {
				resize(_capLeft.width + _capRight.width + _railCapLeft.width + _rail.width + _railCapRight.width, height);
			}
		}
		
		
		public function addElement(elementName:String, visible:Boolean=false):Sprite {
			var element:DisplayObject = _skin.getSkinElement(_skinComponent, _name + elementName);
			if (!element) {
				element = new Sprite();
			}
			element.visible = visible;
			addChild(element);
			element.name = _name + elementName;
			return element as Sprite;
		}
		
		
		public function setProgress(progress:Number):void {
			if (_dragging) return;
			if (isNaN(progress)) {
				progress = 0;
			}
			_currentProgress = progress / 100;
			if (_progress) {
				_progress.visible = true;
			}
			resize(_lastWidth, _lastHeight);
		}
		
		/**
		 * @param buffer Percent buffered (0-100)
		 * @param offset Percent of the slider to begin buffer offset (0-100)
		 **/
		public function setBuffer(buffer:Number, offset:Number=NaN):void {
			if (!isNaN(buffer)) {
				_currentBuffer = Math.min(Math.max(buffer, 0), 100) / 100;
			}
			if (!isNaN(offset)) { 
				_bufferOffset = Math.min(Math.max(offset, 0), 100) / 100;
			}
			if (_buffer) {
				_buffer.visible = (_currentBuffer > 0);
			}
			resize(_lastWidth, _lastHeight);
		}
		
		public function resize(width:Number, height:Number):void {
			if (width * height == 0) return;
			_lastWidth = width;
			_lastHeight = height;
			var scale:Number = _vertical ? this.scaleY : this.scaleX;
			this.scaleX = this.scaleY = 1;
			if (_vertical) {
				_height = height * scale - _capLeft.height - _capRight.height;
				_width = width;
				_capLeft.y = 0;
				_capRight.y = height - _capRight.height;
			} else {
				_width = width * scale - _capLeft.width - _capRight.width;
				_height = height;
				_capLeft.x = 0;
				_capRight.x = width - _capRight.width;
			}
			
			var offset:Number = _capLeft[dim];
			resizeSlider(1, 0, offset, _rail, _railCapLeft, _railCapRight);
			resizeSlider(_currentBuffer, _bufferOffset, offset, _buffer, _bufferCapLeft, _bufferCapRight);
			if (!_dragging) {
				resizeSlider(_currentProgress, 0, offset, _progress, _progressCapLeft, _progressCapRight);
			}

			if (_thumb && !_dragging) {
				if (_vertical) {
					 _thumb.y = (1-_currentProgress) * _height + _capLeft.height - _thumb.height/2;
				} else {
					_thumb.x = _currentProgress * _width + _capLeft.width - _thumb.width/2;
				}
			}
			
			_clickArea.graphics.clear();
			_clickArea.graphics.beginFill(0, 0);
			_clickArea.graphics.drawRect(_vertical ? 0 : offset, _vertical ? offset : 0, _width, _height); 
			center();
		}
		
		private function get dim():String {
			return _vertical ? "height" : "width";
		}

		private function get pos():String {
			return _vertical ? "y" : "x";
		}
		
		private function resizeSlider(pct:Number, offset:Number, startPosition:Number, slider:DisplayObject, capLeft:DisplayObject, capRight:DisplayObject):void {
			var size:Number = _vertical ? _height : _width;
			var scaledSize:Number = size * pct;
			var sliderSize:Number = Math.max(0, Math.round(size * (pct - offset) - capLeft[dim] - capRight[dim]));
			if (scaledSize > 0) {
				/*if (slider.alpha == 0) new Animations(slider).fade(1); else slider.visible = true;
				if (capLeft.alpha == 0) new Animations(capLeft).fade(1); else capLeft.visible = true;
				if (capRight.alpha == 0) new Animations(capRight).fade(1); else capRight.visible = true;*/
				slider.visible = capLeft.visible = capRight.visible = true;

				if (_vertical) {
					capLeft.y = startPosition + (_height - capLeft.height - capRight.height) * (1-pct);
					capRight.y = startPosition + _height - capRight.height;
					slider.y = capLeft.y + capLeft.height;
					sliderSize = capRight.y - (capLeft.y + capLeft.height);
					slider.height = sliderSize;
				} else {
					capLeft.x = startPosition + size * offset;
					resizeElement(capLeft, Math.min(scaledSize, capLeft.width));
					slider[dim] = size - capLeft.width - capRight.width;
					slider.x = capLeft.x + capLeft.width;
					resizeElement(slider, sliderSize);
					capRight.x = slider.x + sliderSize;
					resizeElement(capRight, Math.min(scaledSize - capLeft.width, capRight.width));
				}				
			} else {
/*				new Animations(slider).fade(0);
				new Animations(capLeft).fade(0);
				new Animations(capRight).fade(0);*/
				slider.visible = capLeft.visible = capRight.visible = false;
			}
		}
		
		
		private function resizeElement(element:DisplayObject, maskSize:Number):void {
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
					mask[pos] = element[pos];
					mask.graphics.clear();
					mask.graphics.beginFill(0x0000ff, 0);
					if (_vertical) {
						mask.graphics.drawRect(0, 0, element.width, Math.max(0, maskSize));
					} else {
						mask.graphics.drawRect(0, 0, Math.max(0, maskSize), element.height);
					}
					mask.graphics.endFill();
				}
			}
		}
		
		private function center():void {
			var maxDimension:Number = 0;	
			var element:DisplayObject;
			
			for(var i:Number = 0; i < numChildren; i++) {
				element = getChildAt(i);
				if (_vertical) {
					if (element.width > maxDimension) maxDimension = element.width;
				} else {
					if (element.height > maxDimension) maxDimension = element.height;
				}
			}
			
			for(i = 0; i < numChildren; i++) {
				element = getChildAt(i);
				if (_vertical) {
					element.x = (maxDimension - element.width) / 2;
				} else {
					element.y = (maxDimension - element.height) / 2;
				}
				
			}
		}
		
		/** Handle mouse downs. **/
		private function downHandler(evt:MouseEvent):void {
			if (_thumb && !_lock) {
				var rct:Rectangle;
				if (_vertical) {
					rct = new Rectangle(_thumb.x, _capLeft.height - _thumb.height/2, 0, _height);
				} else {
					rct = new Rectangle(_capLeft.width - _thumb.width/2, _thumb.y, _width, 0);
				}
				_thumb.startDrag(true, rct);
				_dragging = true;
				RootReference.stage.addEventListener(MouseEvent.MOUSE_UP, upHandler);
				RootReference.stage.addEventListener(MouseEvent.MOUSE_MOVE, moveHandler);
			}
		}
		
		private function moveHandler(evt:MouseEvent):void {
			if (_name != "timeSlider" || _dragging) {
				if (!_isLive || (name != "timeSlider")) {
					resizeSlider(thumbPercent(), 0, _capLeft[dim], _progress, _progressCapLeft, _progressCapRight);
				}
			}
		}
		
		private function thumbPercent():Number {
			if (_vertical) {
				return 1 - (_thumb.y - _capLeft.height + _thumb.height/2) / _height;
			} else { 
				return (_thumb.x - _capLeft.width + _thumb.width/2) / _width;
			}
		}
		
		/** Handle mouse releases. **/
		private function upHandler(evt:MouseEvent):void {
			RootReference.stage.removeEventListener(MouseEvent.MOUSE_UP, upHandler);
			RootReference.stage.removeEventListener(MouseEvent.MOUSE_MOVE, moveHandler);
			dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_CLICK, thumbPercent()));
			_thumb.stopDrag();
			moveHandler(evt);
			_dragging = false;
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
		
		public function set live(state:Boolean):void {
			_isLive = state;
		}
	}
}