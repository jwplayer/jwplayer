package com.longtailvideo.jwplayer.parsers {
	import com.longtailvideo.jwplayer.utils.Logger;

	public class ParserFactory {
		
		public static function getParser(list:XML):IPlaylistParser {
			try {
				switch(list.localName().toString().toLowerCase()) {
//					case 'asx':
//						return new ASXParser();
//						break;
//					case 'feed':
//						return new ATOMParser();
//						break;
//					case 'playlist':
//						return new XSPFParser();
//						break;
					case 'rss':
						return new RSSParser();
						break;
//					case 'smil':
//						return new SMILParser();
//						break;
				}
			} catch (e:Error) {
				Logger.log("ParserFactory: Could not determine playlist type");
				return null;
			}
			
			return null;
		}
		
	}
}