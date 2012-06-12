/**
 * A button from within the dock.
 **/
package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.model.Color;
	import com.longtailvideo.jwplayer.view.interfaces.IDockButton;
	
	import flash.display.*;
	import flash.events.*;
	import flash.geom.ColorTransform;
	import flash.text.TextField;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	
	public class DockButton extends ComponentButton implements IDockButton {
		/** Background over state **/
		private var _outBackground:DisplayObject;
		/** Background over state **/
		private var _overBackground:DisplayObject;
		/** Background active state **/
		private var _activeBackground:DisplayObject;
		/** Mouse-over label text **/
		private var _label:String;
		/** Active state **/
		private var _active:Boolean = false;
		/** Icon alpha for out state **/
		private var _outAlpha:Number = 1;
		/** Icon alpha for out state **/
		private var _overAlpha:Number = 1;
		/** Icon alpha for out state **/
		private var _activeAlpha:Number = 1;
		
		/** Constructor **/
		public function DockButton():void {
		}
		
		
		/** Sets up the button **/
		override public function init():void {
			if (!_overBackground && !_outBackground) {
				setupBackground();
				setBackground(_outBackground);
			} else if (_outBackground){
				setBackground(_outBackground);
			} else if (!_background) {
				var backgroundSprite:Sprite = new Sprite();
				backgroundSprite.graphics.clear();
				backgroundSprite.graphics.beginFill(0, 0.55);
				backgroundSprite.graphics.drawRect(0, 0, 50, 50);
				backgroundSprite.graphics.endFill();
				setBackground(backgroundSprite);
			}
			super.init();
			mouseChildren = false;
			buttonMode = true;
		}
		
		
		/** Draws the dock icon background if one doesn't exist **/
		private function setupBackground ():void {
			var defaultBG:Sprite = new Sprite();
			defaultBG.graphics.clear();
			defaultBG.graphics.beginFill(0, .55);
			defaultBG.graphics.drawRect(0, 0, 50, 50);
			defaultBG.graphics.endFill();
			
			_outBackground = defaultBG;
			_overBackground = defaultBG;
			_activeBackground = defaultBG;
		}
		
		public function setAlphas(out:Number, over:Number, active:Number):void {
			if (!isNaN(out)) _outAlpha = out;
			if (!isNaN(over)) _overAlpha = over;
			if (!isNaN(active)) _activeAlpha = active;
			_outIcon.alpha = _outAlpha;
			
		}
		
		/** When mousing out, update the button state **/
		override protected function outHandler(evt:MouseEvent=null):void {
			if (_active) return;
			
			_outIcon.alpha = _outAlpha;
			setBackground(_outBackground);
		}
		
		
		/** When rolling over, update the button state **/
		override protected function overHandler(evt:MouseEvent):void {
			if (_active) return;

			_outIcon.alpha = _overAlpha;
			setBackground(_overBackground);
		}
		
		
		override protected function clickHandler(evt:MouseEvent):void {
			super.clickHandler(evt);
		}
			
		
		public function set outBackground(outBackground:DisplayObject):void {
			_outBackground = outBackground;
		}
		
		
		public function set overBackground(overBackground:DisplayObject):void {
			_overBackground = overBackground;
		}
		
		public function set activeBackground(activeBackground:DisplayObject):void {
			_activeBackground = activeBackground;
		}
		
		
		public function set label(text:String):void {
			_label = text;
		}
		
		public function set active(state:Boolean):void {
			_active = state;
			buttonMode = !state;
			if (state) {
				_outIcon.alpha = _activeAlpha;
				setBackground(_activeBackground);
			} else {
				outHandler();
			}
		}
		
		public function get active():Boolean {
			return _active;
		}
	}
}

