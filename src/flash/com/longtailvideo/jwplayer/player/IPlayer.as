package com.longtailvideo.jwplayer.player {
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
	import com.longtailvideo.jwplayer.model.IInstreamOptions;
	import com.longtailvideo.jwplayer.model.IPlaylist;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.view.IPlayerComponents;
	import com.longtailvideo.jwplayer.view.interfaces.IPlayerComponent;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.events.IEventDispatcher;


	/**
	 * Interface for JW Flash Media Player
	 *
	 * @author Zachary Ozer
	 */
	public interface IPlayer extends IEventDispatcher, IGlobalEventDispatcher {
		/**
		 * The player's current configuration
		 */
		function get config():PlayerConfig;
		/**
		 * Player version getter
		 */
		function get version():String;
		/**
		 * Reference to player's skin.  If no skin has been loaded, returns null.
		 */
		function get skin():ISkin;
		/**
		 * The current player state
		 */
		function get state():String;
		/**
		 * The player's playlist
		 */
		function get playlist():IPlaylist;
		/**
		 * Set to true when the player is in a locked state.
		 */
		function get locked():Boolean;
		/**
		 * Request that the player enter the locked state.  When the Player is locked, the currently playing stream is
		 * paused, and no new playback-related commands will be honored until <code>unlock</code> is
		 * called.
		 *
		 * @param target Reference to plugin requesting the player lock
		 * @param callback The function to be executed once a lock is aquired.
		 */
		function lock(target:IPlugin, callback:Function):void;
		/**
		 * Unlocks the player.  If the player was buffering or playing when it was locked, playback will resume.
		 *
		 * @param target Reference to the requesting plugin.
		 * @return <code>true</code>, if <code>target</code> had previously requested player locking.
		 *
		 */
		function unlock(target:IPlugin):Boolean;
		function volume(volume:Number):Boolean;
		function mute(state:Boolean):void;
		function play():Boolean;
		function pause():Boolean;
		function stop():Boolean;
		function seek(position:Number):Boolean;
		function load(item:*):Boolean;
		function playlistItem(index:Number):Boolean;
		function playlistNext():Boolean;
		function playlistPrev():Boolean;
		/** Force a redraw of the player **/
		function redraw():Boolean;
		function fullscreen(on:Boolean):void;
		function get controls():IPlayerComponents;
		function overrideComponent(plugin:IPlayerComponent):void;
		function loadInstream(target:IPlugin, item:PlaylistItem, options:IInstreamOptions=null):IInstreamPlayer;
	}
}