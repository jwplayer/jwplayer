package com.longtailvideo.jwplayer.player {
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
	import com.longtailvideo.jwplayer.model.IPlaylist;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.view.IPlayerComponents;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.events.IEventDispatcher;
	import flash.geom.Rectangle;


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
		function setupInstream(target:IPlugin):IInstreamPlayer;
		function getQualityLevels():Array;
		function getCurrentQuality():Number;
		function setCurrentQuality(index:Number):void;
		function getCaptionsList():Array;
		function getCurrentCaptions():Number;
		function setCurrentCaptions(index:Number):void;
		function getControls():Boolean;
		function getSafeRegion():Rectangle;
		function setControls(state:Boolean):void;
		function checkBeforePlay():Boolean;
		function custom10():Boolean;
		function custom11():Boolean;
		function custom12():Boolean;
		function custom13():Boolean;
		function custom20():Boolean;
		function custom21():Boolean;
		function custom22():Boolean;
		function custom23():Boolean;
		function custom30():Boolean;
		function custom31():Boolean;
		function custom32():Boolean;
		function custom33():Boolean;
		function custom40():Boolean;
		function custom41():Boolean;
		function custom42():Boolean;
		function custom43():Boolean;
		function checkBeforeComplete():Boolean;
		function setCues(cues:Array):void;
		function get token():String;
		function get edition():String;

	}
}