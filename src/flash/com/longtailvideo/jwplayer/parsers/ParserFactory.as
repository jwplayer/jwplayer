package com.longtailvideo.jwplayer.parsers {
	import com.longtailvideo.jwplayer.utils.Logger;

	public class ParserFactory {
		
		public static function getParser(list:XML):IPlaylistParser {
			try {
				switch(list.localName().toString().toLowerCase()) {
//					case 'asx':
//						return new ASXParser();
//					case 'feed':
//						return new ATOMParser();
//					case 'playlist':
//						return new XSPFParser();
					case 'rss':
						return new RSSParser();
//					case 'smil':
//						return new SMILParser();
				}
			} catch (e:Error) {
				Logger.log("ParserFactory: Could not determine playlist type");
			}
			return null;
		}
		
	}
}