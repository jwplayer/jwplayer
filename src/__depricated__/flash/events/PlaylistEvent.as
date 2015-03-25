package com.longtailvideo.jwplayer.events {
	import com.longtailvideo.jwplayer.model.IPlaylist;
	
	import flash.events.Event;
	
	public class PlaylistEvent extends PlayerEvent {
		

		public static const JWPLAYER_PLAYLIST_LOADED:String = "jwplayerPlaylistLoaded";

		public static const JWPLAYER_PLAYLIST_UPDATED:String = "jwplayerPlaylistUpdated";

		public static const JWPLAYER_PLAYLIST_ITEM:String = "jwplayerPlaylistItem";

		public static const JWPLAYER_PLAYLIST_COMPLETE:String = "jwplayerPlaylistComplete";
		
		private var _playlist:IPlaylist;
		
		public function PlaylistEvent(type:String, playlist:IPlaylist) {
			_playlist = playlist;
			super(type);
		}

		public override function toString():String {
			return '[PlaylistEvent type="' + type + '"'
				+ ' index="' + _playlist.currentIndex + '"' 
				+ ' id="' + id + '"'
				+ ' client="' + client + '"'
				+ ' version="' + version + '"'
				+ ' message="' + message + '"]';
		}
		
		public override function clone() : Event {
			return new PlaylistEvent(this.type, _playlist);
		}
		
	}
}