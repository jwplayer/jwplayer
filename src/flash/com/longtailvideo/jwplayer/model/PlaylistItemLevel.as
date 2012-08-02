package com.longtailvideo.jwplayer.model {
	
	public dynamic class PlaylistItemLevel {

		public var file:String		= "";
		public var type:String		= "";
		public var bitrate:Number	= 0;
		public var width:Number		= 0;
		public var height:Number	= 0;
		public var streamer:String	= "";
		public var blacklisted:Boolean = false;
		
		/**
		 * @param file - The location of the file to play
		 * @param type - The type of file
		 * @param bitrate - The bitrate of the file
		 * @param width - The width of the file
		 * @param streamer - Item's RTMP stream location
		 */
		public function PlaylistItemLevel(file:String, type:String, bitrate:Number, width:Number, height:Number, streamer:String="") {
			this.file = file;
			this.type = type;
			this.streamer = streamer;
			this.bitrate = bitrate;
			this.width = width;
			this.height = height;
		}
		
	}
}