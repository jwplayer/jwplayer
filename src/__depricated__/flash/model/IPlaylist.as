package com.longtailvideo.jwplayer.model {
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
	
	/**
	 * Sent when a playlist has been loaded.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.PlaylistEvent.JWPLAYER_PLAYLIST_LOADED
	 */
	[Event(name="jwplayerPlaylistLoaded", type="com.longtailvideo.jwplayer.events.PlaylistEvent")]
	
	
	/**
	 * Sent when the playlist has been updated.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.PlaylistEvent.JWPLAYER_PLAYLIST_UPDATED
	 */
	[Event(name="jwplayerPlaylistUpdated", type="com.longtailvideo.jwplayer.events.PlaylistEvent")]
	
	
	/**
	 * Sent when the playlist's current item has changed.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.PlaylistEvent.JWPLAYER_PLAYLIST_ITEM
	 */
	[Event(name="jwplayerPlaylistItem", type="com.longtailvideo.jwplayer.events.PlaylistEvent")]
	
	
	/**
	 * Sent when an error ocurred when loading or parsing the playlist
	 *
	 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_ERROR
	 */
	[Event(name="jwplayerError", type = "com.longtailvideo.jwplayer.events.PlayerEvent")]
	
	
	/**
	 * Interface for JW Flash Media Player playlist
	 *
	 * @author Zachary Ozer
	 */
	public interface IPlaylist extends IGlobalEventDispatcher {
		/**
		 * Replaces all playlist items
		 *
		 * @param newPlaylist May be an Array of PlaylistItems or structured Objects, a PlaylistItem, or another Playlist
		 */
		function load(newPlaylist:Object):void;
		/**
		 * Gets a the PlaylistItem at the specified index.
		 *
		 * @param idx The index of the PlaylistItem to retrieve
		 * @return If a PlaylistItem is found at position <code>idx</code>, it is returned.  Otherwise, returns <code>null</code>
		 */
		function getItemAt(idx:Number):PlaylistItem;
		/**
		 * Inserts a PlaylistItem
		 *
		 * @param itm
		 * @param idx The position in which to place a playlist
		 *
		 */
		function insertItem(itm:PlaylistItem, idx:Number = -1):void;
		/**
		 * Removes an item at the requested index
		 *
		 * @param idx The index from which to remove the item
		 */
		function removeItemAt(idx:Number):void;
		/** 
		 * Returns true if the given playlist item is currently loaded in the list. 
		 **/
		function contains(item:PlaylistItem):Boolean;

		function get currentIndex():Number;
		function set currentIndex(idx:Number):void;
		function get currentItem():PlaylistItem;
		function get length():Number;
	}
}