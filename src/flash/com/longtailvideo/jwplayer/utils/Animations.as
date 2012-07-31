package com.longtailvideo.jwplayer.utils {
	import flash.display.DisplayObject;
	import flash.display.MovieClip;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.utils.Dictionary;
	
	
	/**
	 * Fired when an animation has completed
	 *
	 * @eventType flash.events.Event.COMPLETE
	 */
	[Event(name="complete", type="flash.events.Event")]
	
	public class Animations extends EventDispatcher {
		/** Target MovieClip **/
		private var _tgt:DisplayObject;
		/** Transition speed **/
		private var _spd:Number;
		/** Final Alpha **/
		private var _end:Number;
		/** X position **/
		private var _xps:Number;
		/** Y position **/
		private var _yps:Number;
		/** Text **/
		private var _str:String;
		/** The function to execute on enter_frame **/
		private var frameHandler:Function;
		/** Static reference mapping all Animation obects to their targets. **/
		private static var targetMapping:Dictionary;
		  
		
		/** Constructor 
		 * @param tgt	The Movielip to animate.
		 **/
		public function Animations(tgt:DisplayObject) {
			_tgt = tgt;
			if (!targetMapping) targetMapping = new Dictionary(true);
			if (targetMapping[_tgt]) {
				var anim:Animations = targetMapping[_tgt] as Animations;
				anim.cancelAnimation();
			}
			targetMapping[_tgt] = this; 
		}
		
		/**
		 * Fade function for MovieClip.
		 *
		 * @param end	The final alpha value.
		 * @param spd	The amount of alpha change per frame.
		 **/
		public function fade(end:Number = 1, spd:Number = 0.25):void {
			_end = end;
			if (_tgt.alpha > _end) {
				_spd = -Math.abs(spd);
			} else {
				_spd = Math.abs(spd);
			}
			frameHandler = fadeHandler;
			_tgt.addEventListener(Event.ENTER_FRAME, frameHandler);
		}
		
		
		/** The fade enterframe function. **/
		private function fadeHandler(evt:Event):void {
			if ((_tgt.alpha >= _end - _spd && _spd > 0) || (_tgt.alpha <= _end + _spd && _spd < 0)) {
				_tgt.removeEventListener(Event.ENTER_FRAME, frameHandler);
				_tgt.alpha = _end;
				if (_end == 0) {
					_tgt.visible = false;
				}
				dispatchEvent(new Event(Event.COMPLETE));
			} else {
				if (_end > 0) {
					_tgt.visible = true;
				}
				_tgt.alpha += _spd;
			}
		}
		
		
		/**
		 * Smoothly move a Movielip to a certain position.
		 *
		 * @param xps	The x destination.
		 * @param yps	The y destination.
		 * @param spd	The movement speed (1 - 2).
		 **/
		public function ease(xps:Number, yps:Number, spd:Number = 2):void {
			_spd = spd;
			if (!xps) {
				_xps = _tgt.x;
			} else {
				_xps = xps;
			}
			if (!yps) {
				_yps = _tgt.y;
			} else {
				_yps = yps;
			}
			frameHandler = easeHandler;
			_tgt.addEventListener(Event.ENTER_FRAME, easeHandler);
		}
		
		
		/** The ease enterframe function. **/
		private function easeHandler(evt:Event):void {
			if (Math.abs(_tgt.x - _xps) < 1 && Math.abs(_tgt.y - _yps) < 1) {
				_tgt.removeEventListener(Event.ENTER_FRAME, frameHandler);
				_tgt.x = _xps;
				_tgt.y = _yps;
				dispatchEvent(new Event(Event.COMPLETE));
			} else {
				_tgt.x = _xps - (_xps - _tgt.x) / _spd;
				_tgt.y = _yps - (_yps - _tgt.y) / _spd;
			}
		}

		/** Stop executing the current animation **/
		public function cancelAnimation():void {
			try {
				_tgt.removeEventListener(Event.ENTER_FRAME, frameHandler);
			} catch(e:Error) {}
		}
	}
}