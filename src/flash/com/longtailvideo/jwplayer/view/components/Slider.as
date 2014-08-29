package com.longtailvideo.jwplayer.view.components {
    import com.longtailvideo.jwplayer.events.ViewEvent;
    import com.longtailvideo.jwplayer.utils.RootReference;
    import com.longtailvideo.jwplayer.view.interfaces.ISkin;
    
    import flash.display.Bitmap;
    import flash.display.DisplayObject;
    import flash.display.Sprite;
    import flash.events.MouseEvent;
    import flash.geom.ColorTransform;
    import flash.geom.Rectangle;

    // CONFIG::debugging {
	// 	import com.demonsters.debugger.MonsterDebugger;
	// }

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
		/** Rectangle used to constrain thumb dragging **/
		protected var _dragRect:Rectangle;
		/** Currently dragging thumb **/
		protected var _dragging:Boolean;

		/** If the buffer has a percentage offset **/
		protected var _bufferOffset:Number = 0;
		/** Name of the slider **/
		protected var _name:String;
		/** Skin **/
		protected var _skin:ISkin;
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

			// _thumb.alpha = 0.5;

			// center thumb
			if (_thumb.numChildren) {
				var bmp:Bitmap = _thumb.getChildAt(0) as Bitmap;
				if (bmp) {
					bmp[pos] = -thumbOffset;
				}
			}

			_clickArea.addEventListener(MouseEvent.MOUSE_DOWN, downHandler);
			_clickArea.addEventListener(MouseEvent.CLICK,function(evt:MouseEvent):void { evt.stopPropagation();});
			_dragRect = new Rectangle(0, 0, 0, 0);
			
			if (_vertical) {
				resize(this.width, _capLeft.height + _railCapLeft.height + _rail.height + _railCapRight.height + _capRight.height);
			} else {
				resize(_capLeft.width + _railCapLeft.width + _rail.width + _railCapRight.width + _capRight.width, this.height);
			}
		}
		
		protected function addElement(elementName:String, visible:Boolean=false):Sprite {
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
			// MonsterDebugger.trace(this, _name +(_vertical?'V':'')+' progress: '+ progress);
			if (_dragging) return;
			if (isNaN(progress)) {
				progress = 0;
			}
			_currentProgress = progress / 100;
			if (_progress) {
				_progress.visible = true;
			}
			redraw();
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
			// redraw buffer
			resizeSlider(thumbAdjust(_currentBuffer), thumbAdjust(_bufferOffset), _capLeft[dim], _capRight[dim], _buffer, _bufferCapLeft, _bufferCapRight);
		}

		public function resize(width:Number, height:Number):void {
			if (width * height == 0) return;

			_clickArea.graphics.clear();
			
			var scale:Number = _vertical ? this.scaleY : this.scaleX;
			this.scaleX = this.scaleY = 1;
			if (_vertical) {
				_height = height * scale;
				_width = width;
				_capLeft.y = 0;
				_capRight.y = height - _capRight.height;
			} else {
				_width = width * scale;
				_height = height;
				_capLeft.x = 0;
				_capRight.x = width - _capRight.width;
			}

			_clickArea.graphics.beginFill(0, 0);
			_clickArea.graphics.drawRect(0, 0, _width, _height);

			// skins with thumbs should extend over caps, skins without a thumb should not
			var offset:Number = thumbOffset;
			var size:Number = fullSize;
			if (offset < 1) {
				size -= _capLeft[dim] + _capRight[dim];
				_dragRect[pos] = _capLeft[dim];
			} else {
				_dragRect[pos] = offset;
			}
			_dragRect[dim] = size - offset*2;

			// MonsterDebugger.trace(this, _name +(_vertical?'V':'')+ ' resize: '+ _width +'x'+ _height +' thumbOffset '+ thumbOffset);
			// MonsterDebugger.trace(this, _name +(_vertical?'V':'')+ ' cap left: '+ _capLeft[dim] +' thumb offset: '+ thumbOffset +' thumb dim: '+ _thumb[dim]);
			
			redraw();
		}

		public function redraw():void {
			var padding:Number = _capLeft[dim];
			var paddingEnd:Number = _capRight[dim];
			resizeSlider(1, 0, padding, paddingEnd, _rail, _railCapLeft, _railCapRight);
			resizeSlider(thumbAdjust(_currentBuffer), thumbAdjust(_bufferOffset), padding, paddingEnd, _buffer, _bufferCapLeft, _bufferCapRight);
			
			if (!_dragging) {
				resizeSlider(thumbAdjust(_currentProgress), 0, padding, paddingEnd, _progress, _progressCapLeft, _progressCapRight);
				if (_thumb) {
				var offset:Number = thumbOffset;
				var size:Number = fullSize;
				if (offset < 1) {
					offset = _capLeft[dim];
					//size = - caps
				}
				if (_vertical) {
					_thumb.y = (1-_currentProgress) * (size-thumbOffset*2) + offset;
				} else {
					_thumb.x = _currentProgress * (size-thumbOffset*2) + offset;
				}
			}
			}

			// MonsterDebugger.trace(this, _name +(_vertical?'V':'')+' redraw: '+_currentProgress +' _thumb[pos]='+ _thumb[pos] +
			//		 ' min: '+ (1 * (_height-thumbOffset*2) + thumbOffset) +' max: '+ (0 * (fullSize-thumbOffset*2) + thumbOffset));

			// MonsterDebugger.trace(this, _name +(_vertical?'V':'')+ ' redraw '+ _capLeft[dim] +'['+ _railCapLeft[dim] +'-'+ _rail[dim] +'-'+ _railCapRight[dim] +']'+ _capRight[dim] +' '+ fullSize +'<'+ this[dim]);

			center();
		}
		
		private function get dim():String {
			return _vertical ? "height" : "width";
		}

		private function get pos():String {
			return _vertical ? "y" : "x";
		}

		private function get fullSize():Number {
			return _vertical ? _height : _width;
		}
		
		private function get thumbOffset():Number {
			return Math.round(_thumb[dim]/2);
		}

		private function resizeSlider(pct:Number, bufferOffsetPct:Number, startPosition:Number, endPadding:Number, slider:DisplayObject, capLeft:DisplayObject, capRight:DisplayObject):void {
			var size:Number = fullSize - startPosition - endPadding;
			var scaledSize:Number = Math.round(size * pct);
			if (scaledSize > 0) {
				var sliderSize:Number;
				slider.visible = capLeft.visible = capRight.visible = true;
				if (_vertical) {
					capLeft.y = startPosition + Math.round((size - capLeft.height - capRight.height) * (1-pct));
					capRight.y = startPosition + size - capRight.height;
					slider.y = capLeft.y + capLeft.height;
					sliderSize = capRight.y - capLeft.y - capLeft.height;
					slider.height = sliderSize;
				} else {
					capLeft.x = startPosition;
					resizeElement(capLeft, Math.min(scaledSize, capLeft.width));
					slider[dim] = size - capLeft.width - capRight.width;
					slider.x  = capLeft.x + capLeft.width;
					sliderSize = Math.round(Math.max(0, size * (pct - bufferOffsetPct) - capLeft[dim] - capRight[dim]));
					resizeElement(slider, sliderSize);
					capRight.x = slider.x + sliderSize;
					resizeElement(capRight, Math.min(scaledSize - capLeft.width, capRight.width));
				}				
			} else {
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
			
			// find max dimension
			for(var i:Number = 0; i < numChildren; i++) {
				element = getChildAt(i);
				if (_vertical) {
					if (element.width > maxDimension) maxDimension = element.width;
				} else {
					if (element.height > maxDimension) maxDimension = element.height;
				}
			}

			// set drag center
			if (_vertical) {
				_dragRect.x = (maxDimension - _thumb.width)/2;
			}

			// center in max
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
			// MonsterDebugger.trace(this, _name +(_vertical?'V':'')+' drag rect='+ _dragRect.toString());
			if (_thumb) {
				_thumb.startDrag(true, _dragRect);
				_dragging = true;
				RootReference.stage.addEventListener(MouseEvent.MOUSE_UP, upHandler);
				RootReference.stage.addEventListener(MouseEvent.MOUSE_MOVE, mouseMoveHandler);
			}
		}
		
		private function mouseMoveHandler(evt:MouseEvent):void {
			if (_dragging || _name != "timeSlider" || !_isLive) {
				// MonsterDebugger.trace(this, _name +(_vertical?'V':'')+' mouseMoveHandler '+_thumb[pos]);
				resizeSlider(thumbAdjust(thumbPercent()), 0, _capLeft[dim], _capRight[dim], _progress, _progressCapLeft, _progressCapRight);
			}
		}

		private function thumbAdjust(input:Number):Number {
			// take a number between 0-1, and adjust it so that the slider drawn will land under the center of the thumb
			if (input > 0 && input < 1) {
				var offset:Number = thumbOffset;
				if (!_thumb.visible || offset < 1) {
					return input;
				}
				var normalizedOffset:Number = offset / fullSize;
				var output:Number;
				if (_vertical) {
					output = input / (1+normalizedOffset);
					// MonsterDebugger.trace(this, _name +(_vertical?'V':'')+' thumb adjust '+ 
					// 	input.toFixed(3)+'/'+(1+normalizedOffset).toFixed(3) +'='+ output.toFixed(3));
				} else {
					output = input / (1+normalizedOffset) + normalizedOffset;
					// MonsterDebugger.trace(this, _name +(_vertical?'V':'')+' thumb adjust '+
					// 	input.toFixed(3)+'/'+(1+normalizedOffset).toFixed(3) +'+'+ normalizedOffset.toFixed(3) +'='+ output.toFixed(3));
				}
				return output;
			}
			return input;
		}

		private function thumbPercent():Number {
			return sliderPercent(_thumb[pos]);
		}

		protected function sliderPercent(pixels:Number):Number {
			var percent:Number;
			var offset:Number = _thumb.visible ? thumbOffset : 0;
			if (offset < 1) {
				offset = _capLeft[dim];
			}

			var size:Number = fullSize - offset*2;
			
			pixels -= offset;

			if (_vertical) {
				percent = 1 - pixels/size;
			} else {
				percent = pixels/size;
			}
			return Math.max(Math.min(1, percent), 0);
		}
		
		/** Handle mouse releases. **/
		private function upHandler(evt:MouseEvent):void {
			_thumb.stopDrag();
			mouseMoveHandler(evt);
			_dragging = false;
			RootReference.stage.removeEventListener(MouseEvent.MOUSE_UP, upHandler);
			RootReference.stage.removeEventListener(MouseEvent.MOUSE_MOVE, mouseMoveHandler);
			dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_CLICK, thumbPercent()));

		}
		
		/** Reset the slider to its original state**/
		public function reset():void {
			setBuffer(0);
			setProgress(0);
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