package com.longtailvideo.jwplayer.model {
	
	public dynamic class PlaylistItemLevel {

		public var file:String		= "";
		public var type:String		= "";
		public var streamer:String	= "";
		
		/**
		 * @param file - The location of the file to play
		 * @param type - The type of file
		 * @param def - Whether this level is the default selection
		 * @param streamer - Item's RTMP stream location
		 */
		public function PlaylistItemLevel(file:String, type:String="", def:Boolean=false, streamer:String="") {
			this.file = file;
			this.type = type;
			this["default"] = def;
			this.streamer = streamer;
		}
		
	}
}