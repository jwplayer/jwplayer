package com.longtailvideo.jwplayer.view.interfaces {
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
	

	/**
	 * Sent when the user requests the player skip to the given playlist index
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_ITEM
	 */
	[Event(name="jwPlayerViewItem", type = "com.longtailvideo.jwplayer.events.ViewEvent")]

	public interface IPlaylistComponent extends IPlayerComponent {
	}
}