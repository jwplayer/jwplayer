package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.utils.Animations;
	import com.longtailvideo.jwplayer.utils.RootReference;
	import com.longtailvideo.jwplayer.utils.Strings;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.events.MouseEvent;
	import flash.geom.Point;
	
	public class TimeSlider extends Slider {
		private var _duration:Number;
		private var _tooltip:TooltipOverlay;
		
		public function TimeSlider(name:String, skin:ISkin) {
			super(name, skin);
			
			_duration = 0;
			_tooltip = new TooltipOverlay(skin);
			_tooltip.text = Strings.digits(_duration);
			_tooltip.alpha = 0;
			_tooltip.mouseEnabled = false;
			_tooltip.mouseChildren = false;
			RootReference.stage.addChild(_tooltip);

			_clickArea.addEventListener(MouseEvent.MOUSE_OVER, overHandler);
			_clickArea.addEventListener(MouseEvent.MOUSE_OUT, outHandler);
			_clickArea.addEventListener(MouseEvent.MOUSE_MOVE, moveHandler);
			
		}
		
		public function set duration(d:Number):void {
			_duration = d;
		}
		
		public function get duration():Number {
			return _duration;
		}
		
		private function overHandler(evt:MouseEvent):void {
			_tooltip.show();
		}

		private function outHandler(evt:MouseEvent):void {
			_tooltip.hide();
		}
		
		private function moveHandler(evt:MouseEvent):void {
			RootReference.stage.setChildIndex(_tooltip, RootReference.stage.numChildren-1);
			_tooltip.x = evt.stageX;
			_tooltip.y = _rail.localToGlobal(new Point(0, 0)).y;
			_tooltip.text = Strings.digits(_duration * evt.localX / _width);
		}
	}
}