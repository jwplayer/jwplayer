package com.longtailvideo.jwplayer.events {
	import com.longtailvideo.jwplayer.view.interfaces.IPlayerComponent;
	
	import flash.events.Event;
	import flash.geom.Rectangle;

	public class ComponentEvent extends PlayerEvent {
		
		/**
		 * The ComponentEvent.JWPLAYER_COMPONENT_SHOW constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerComponentShow</code> event.
		 *
		 * @eventType jwplayerComponentShow
		 */
		public static var JWPLAYER_COMPONENT_SHOW:String = "jwplayerComponentShow";
		/**
		 * The ComponentEvent.JWPLAYER_COMPONENT_HIDE constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerComponentHide</code> event.
		 *
		 * @eventType jwplayerComponentHide
		 */
		public static var JWPLAYER_COMPONENT_HIDE:String = "jwplayerComponentHide";

		public var component:IPlayerComponent;
		public var boundingRect:Rectangle;

		public function ComponentEvent(type:String, comp:IPlayerComponent, rect:Rectangle=null) {
			super(type);
			this.component = comp;
			if (rect) {
				this.boundingRect = rect;
			} else {
				this.boundingRect = new Rectangle(comp.x, comp.y, comp.width, comp.height);
			}
		}
		
		public override function clone():Event {
			return new ComponentEvent(this.type, this.component);
		}
		
		public override function toString():String {
			return '[ComponentEvent type="' + type + '"'
				+ ' component="' + component + '"'
				+ " boundingRect=" + boundingRect.toString() 
				+ " id=" + id 
				+ " client=" + client 
				+ " version=" + version
				+ "]";
		}
		
	}
}