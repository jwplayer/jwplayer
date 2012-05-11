package com.longtailvideo.jwplayer.view {
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.view.interfaces.IControlbarComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IDisplayComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IDockComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IPlaylistComponent;
	
	
	/**
	 * Interface for JW Flash Media Player visual components
	 *
	 * @author Zachary Ozer
	 */
	public interface IPlayerComponents {
		function get controlbar():IControlbarComponent;
		function get display():IDisplayComponent;
		function get dock():IDockComponent;
		function get playlist():IPlaylistComponent;
		function resize(width:Number, height:Number):void;
	}
}