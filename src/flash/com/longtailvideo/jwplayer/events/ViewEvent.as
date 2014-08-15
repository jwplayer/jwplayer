package com.longtailvideo.jwplayer.events {
	import flash.events.Event;

	public class ViewEvent extends PlayerEvent {
		public static var JWPLAYER_VIEW_CUSTOM10:String = "jwplayerViewCustom10";
		public static var JWPLAYER_VIEW_CUSTOM11:String = "jwplayerViewCustom11";
		public static var JWPLAYER_VIEW_CUSTOM12:String = "jwplayerViewCustom12";
		public static var JWPLAYER_VIEW_CUSTOM13:String = "jwplayerViewCustom13";
		public static var JWPLAYER_VIEW_CUSTOM20:String = "jwplayerViewCustom20";
		public static var JWPLAYER_VIEW_CUSTOM21:String = "jwplayerViewCustom21";
		public static var JWPLAYER_VIEW_CUSTOM22:String = "jwplayerViewCustom22";
		public static var JWPLAYER_VIEW_CUSTOM23:String = "jwplayerViewCustom23";
		public static var JWPLAYER_VIEW_CUSTOM30:String = "jwplayerViewCustom30";
		public static var JWPLAYER_VIEW_CUSTOM31:String = "jwplayerViewCustom31";
		public static var JWPLAYER_VIEW_CUSTOM32:String = "jwplayerViewCustom32";
		public static var JWPLAYER_VIEW_CUSTOM33:String = "jwplayerViewCustom33";
		public static var JWPLAYER_VIEW_CUSTOM40:String = "jwplayerViewCustom40";
		public static var JWPLAYER_VIEW_CUSTOM41:String = "jwplayerViewCustom41";
		public static var JWPLAYER_VIEW_CUSTOM42:String = "jwplayerViewCustom42";
		public static var JWPLAYER_VIEW_CUSTOM43:String = "jwplayerViewCustom43";
		
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
		 * The ViewEvent.JWPLAYER_VIEW_HD constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewHD</code> event.
		 *
		 * @eventType jwplayerViewHD
		 */
		public static var JWPLAYER_VIEW_HD:String = "jwplayerViewHD";

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

		/**
		 * The ViewEvent.JWPLAYER_CONTROLS constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewControls</code> event.
		 *
		 * @eventType jwplayerViewControls
		 */
		public static var JWPLAYER_CONTROLS:String = "jwplayerViewControls";

		
		/**
		 * The ViewEvent.JWPLAYER_VIEW_TAB_FOCUS constant defines the value of the
		 * <code>type</code> property of the event object
		 * for a <code>jwplayerViewTabFocus</code> event.
		 *
		 * @eventType jwplayerViewTabFocus
		 */
		public static var JWPLAYER_VIEW_TAB_FOCUS:String = "jwplayerViewTabFocus";
		
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