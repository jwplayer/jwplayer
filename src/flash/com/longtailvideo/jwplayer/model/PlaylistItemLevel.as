package com.longtailvideo.jwplayer.model {
	
	public dynamic class PlaylistItemLevel {

		public var file:String		= "";
		public var type:String		= "";
		public var bitrate:Number	= 0;
		public var width:Number		= 0;
		public var height:Number	= 0;
		public var streamer:String	= "";
		
		/**
		 * @param file - The location of the file to play
		 * @param type - The type of file
		 * @param bitrate - The bitrate of the file
		 * @param width - The width of the file
		 * @param streamer - Item's RTMP stream location
		 */
		public function PlaylistItemLevel(file:String, type:String="", bitrate:Number=0, width:Number=0, height:Number=0, streamer:String="") {
			this.file = file;
			this.type = type;
			this.streamer = streamer;
			this.bitrate = isNaN(bitrate) ? 0 : bitrate;
			this.width = isNaN(width) ? 0 : width;
			this.height = isNaN(height) ? 0 : height;
		}
		
	}
}