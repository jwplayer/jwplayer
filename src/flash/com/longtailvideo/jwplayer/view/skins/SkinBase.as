package com.longtailvideo.jwplayer.view.skins {
	import com.longtailvideo.jwplayer.utils.Draw;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.DisplayObject;
	import flash.display.DisplayObjectContainer;
	import flash.display.Sprite;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.text.TextField;
	import flash.display.MovieClip;
	
	/**
	 * Send when the skin is ready
	 *
	 * @eventType flash.events.Event.COMPLETE
	 */
	[Event(name="complete", type = "flash.events.Event")]
	
	/**
	 * Send when an error occurred loading the skin
	 *
	 * @eventType flash.events.ErrorEvent.ERROR
	 */
	[Event(name="error", type = "flash.events.ErrorEvent")]
	
	public class SkinBase extends EventDispatcher implements ISkin {
		protected var _skin:Sprite;
		
		public function SkinBase() {
			_skin = new Sprite();
		}
		
		public function load(url:String=null):void {
			dispatchEvent(new Event(Event.COMPLETE));
		}
		
		public function hasComponent(component:String):Boolean {
			return _skin.getChildByName(component) is DisplayObjectContainer;
		}
		
		public function componentChildren(component:String):Object {
			var toReturn:Object = {};
			var comp:DisplayObjectContainer = DisplayObjectContainer(_skin.getChildByName(component));
			
			if (!comp) return toReturn;
			
			for(var i:Number = 0; i < _skin.numChildren; i++) {
				var child:DisplayObject = _skin.getChildAt(i);
				toReturn[child.name] = child;
			}
			
			return toReturn; 
		
		}
		
		public function getSkinElement(component:String, element:String):DisplayObject {
			var result:DisplayObject;
			var comp:DisplayObjectContainer = _skin.getChildByName(component) as DisplayObjectContainer;
			if (comp) {
				result = comp.getChildByName(element);
			}
			return result;
		}
		
		public function addSkinElement(component:String, name:String, element:DisplayObject):void {
			if (name)
				element.name = name;
			
			var comp:DisplayObjectContainer = _skin.getChildByName(component) as DisplayObjectContainer;
			
			if (!comp) {
				comp = new Sprite();
				comp.name = component;
				_skin.addChild(comp);
			}
			
			if (comp.getChildByName(element.name)) {
				comp.removeChild(comp.getChildByName(element.name));
			}
			comp.addChild(element);
		}
		
		public function getSkinProperties():SkinProperties {
			return new SkinProperties();
		}
		
		/**
		 * Dispatch an ErrorEvent.ERROR with a message
		 * @param message The message to dispatch
		 */
		protected function sendError(message:String):void {
			dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, message));
		}
		
		public function getSWFSkin():Sprite {
			return null;
		}
	
	}
}

