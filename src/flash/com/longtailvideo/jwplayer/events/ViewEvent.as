package com.longtailvideo.jwplayer.events {
	import flash.events.Event;

	public class ViewEvent extends PlayerEvent {
		
		/**
		 * The ViewEvent.JWPLAYER_RESIZE constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerResize</code> event.
		 *
		 * @eventType jwplayerResize
		 */
		public static var JWPLAYER_RESIZE:String = "jwplayerResize";

		/**
		 * The ViewEvent.JWPLAYER_VIEW_PLAY constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewPlay</code> event.
		 *
		 * @eventType jwplayerViewPlay
		 */
		public static var JWPLAYER_VIEW_PLAY:String = "jwplayerViewPlay";
		
		/**
		 * The ViewEvent.JWPLAYER_VIEW_PAUSE constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewPause</code> event.
		 *
		 * @eventType jwplayerViewPause
		 */
		public static var JWPLAYER_VIEW_PAUSE:String = "jwplayerViewPause";
		
		/**
		 * The ViewEvent.JWPLAYER_VIEW_STOP constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewStop</code> event.
		 *
		 * @eventType jwplayerViewStop
		 */
		public static var JWPLAYER_VIEW_STOP:String = "jwplayerViewStop";
		
		/**
		 * The ViewEvent.JWPLAYER_VIEW_NEXT constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewNext</code> event.
		 *
		 * @eventType jwplayerViewNext
		 */
		public static var JWPLAYER_VIEW_NEXT:String = "jwplayerViewNext";
		
		/**
		 * The ViewEvent.JWPLAYER_VIEW_PREV constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewPrev</code> event.
		 *
		 * @eventType jwplayerViewPrev
		 */
		public static var JWPLAYER_VIEW_PREV:String = "jwplayerViewPrev";
		
		/**
		 * The ViewEvent.JWPLAYER_VIEW_MUTE constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewMute</code> event.
		 *
		 * @eventType jwplayerViewMute
		 */
		public static var JWPLAYER_VIEW_MUTE:String = "jwplayerViewMute";
		
		/**
		 * The ViewEvent.JWPLAYER_VIEW_FULLSCREEN constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewFullscreen</code> event.
		 *
		 * @eventType jwplayerViewFullscreen
		 */
		public static var JWPLAYER_VIEW_FULLSCREEN:String = "jwplayerViewFullscreen";

		/**
		 * The ViewEvent.JWPLAYER_VIEW_ITEM constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewItem</code> event.
		 *
		 * @eventType jwplayerViewItem
		 */
		public static var JWPLAYER_VIEW_ITEM:String = "jwplayerViewItem";
		
		/**
		 * The ViewEvent.JWPLAYER_VIEW_VOLUME constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewVolume</code> event.
		 *
		 * @eventType jwplayerViewVolume
		 */
		public static var JWPLAYER_VIEW_VOLUME:String = "jwplayerViewVolume";
		
		/**
		 * The ViewEvent.JWPLAYER_VIEW_LOAD constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewLoad</code> event.
		 *
		 * @eventType jwplayerViewLoad
		 */
		public static var JWPLAYER_VIEW_LOAD:String = "jwplayerViewLoad";

		/**
		 * The ViewEvent.JWPLAYER_VIEW_REDRAW constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewRedraw</code> event.
		 *
		 * @eventType jwplayerViewRedraw
		 */
		public static var JWPLAYER_VIEW_REDRAW:String = "jwplayerViewRedraw";
		
		/**
		 * The ViewEvent.JWPLAYER_VIEW_SEEK constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewSeek</code> event.
		 *
		 * @eventType jwplayerViewSeek
		 */
		public static var JWPLAYER_VIEW_SEEK:String = "jwplayerViewSeek";

		/**
		 * The ViewEvent.JWPLAYER_VIEW_CLICK constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewClick</code> event.
		 *
		 * @eventType jwplayerViewClick
		 */
		public static var JWPLAYER_VIEW_CLICK:String = "jwplayerViewClick";		

		/** Sent along with REQUEST Event types. **/
		public var data:*;
		
		public function ViewEvent(type:String, data:*=null) {
			super(type);
			
			this.data = data;
		}
		
		public override function clone():Event {
			return new ViewEvent(this.type, this.data);
		}
		
		public override function toString():String {
			
			return '[ViewEvent type="' + type + '"'
				+ ' data="' + data + '"'
				+ " id=" + id 
				+ " client=" + client 
				+ " version=" + version
				+ "]";

		}
		
	}
}