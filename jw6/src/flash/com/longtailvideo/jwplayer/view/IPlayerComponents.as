package com.longtailvideo.jwplayer.view {
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.view.interfaces.IControlbarComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IDisplayComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IDockComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IPlayerComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IPlaylistComponent;
	import com.longtailvideo.jwplayer.view.components.CaptionsComponent;
	
	
	/**
	 * Interface for JW Flash Media Player visual components
	 */
	public interface IPlayerComponents {
		function get controlbar():IControlbarComponent;
		function get display():IDisplayComponent;
		function get dock():IDockComponent;
		function get playlist():IPlaylistComponent;
		function get logo():IPlayerComponent;
		function get captions():CaptionsComponent;
		function redraw():void;
	}
}