package com.longtailvideo.jwplayer.parsers {

	import com.longtailvideo.jwplayer.model.PlaylistItemLevel;
	import com.longtailvideo.jwplayer.utils.Strings;

	/**
	 * Parse an RTMP Loadbalancing SMIL feed and translate it to a list of levels.
	 **/
	public class LoadbalanceParser {

		/** Parse an SMIL playlist for feeditems. **/
		public static function parse(dat:XML):Array {
			var array:Array = new Array();
			var meta:XML = dat.children()[0].children()[0];
			var streamer:String = Strings.xmlAttribute(meta,'base');
			var switchOrVideo:XML = dat.children()[1].children()[0];
			if (switchOrVideo.localName().toLowerCase() == 'switch') {
				for each (var i:XML in switchOrVideo.children()) {
					var level:PlaylistItemLevel = new PlaylistItemLevel(
						Strings.xmlAttribute(i, 'src'),
						Number(Strings.xmlAttribute(i,'system-bitrate'))/1000,
						Number(Strings.xmlAttribute(i,'width')),
						streamer
					);
					array.push(level);
				}
			} else {
				array.push({
					file:Strings.xmlAttribute(switchOrVideo, 'src'),
					streamer:streamer
				});
			}
			return array;
		};

	}

}