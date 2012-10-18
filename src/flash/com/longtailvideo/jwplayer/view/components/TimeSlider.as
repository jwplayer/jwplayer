package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.utils.Animations;
	import com.longtailvideo.jwplayer.utils.RootReference;
	import com.longtailvideo.jwplayer.utils.Strings;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.DisplayObject;
	import flash.events.MouseEvent;
	import flash.geom.Point;
	
	public class TimeSlider extends Slider {
		private var _duration:Number;
		private var _tooltip:TooltipOverlay;
		private var _audioMode:Boolean = false;
		private var _controlbar:DisplayObject;
		
		public function TimeSlider(name:String, skin:ISkin, controlbar:DisplayObject) {
			super(name, skin);
			
			_controlbar = controlbar;
			
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
			if (!_audioMode) _tooltip.show();
		}

		private function outHandler(evt:MouseEvent = null):void {
			hide();
		}
		
		private function moveHandler(evt:MouseEvent):void {
			RootReference.stage.setChildIndex(_tooltip, RootReference.stage.numChildren-1);
			_tooltip.x = evt.stageX;
			_tooltip.y = _controlbar.getBounds(RootReference.stage).y;
			_tooltip.text = Strings.digits(_duration * (evt.localX - _capLeft.width) / _width);
		}
		
		public function audioMode(state:Boolean):void {
			_audioMode = state;
			if (_audioMode) outHandler();
		}
		
		public function hide():void {
			_tooltip.hide();
		}
	}
}