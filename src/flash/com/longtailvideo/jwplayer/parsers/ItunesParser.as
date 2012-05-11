package com.longtailvideo.jwplayer.parsers {

	import com.longtailvideo.jwplayer.utils.Strings;

	/**
	 * Parse Itunes specific RSS feed content into playlists.
	 **/
	public class ItunesParser {

		/** Prefix for the iTunes namespace. **/
		private static const PREFIX:String = 'itunes';

		/**
		 * Parse a feedentry for iTunes content.
		 *
		 * @param obj	The XML object to parse.
		 * @param itm	The playlistentry to amend the object to.
		 * @return		The playlistentry, amended with the iTunes info.
		 * @see			RSSParser
		 **/
		public static function parseEntry(obj:XML, itm:Object):Object {
			for each (var i:XML in obj.children()) {
				if (i.namespace().prefix == ItunesParser.PREFIX) {
					switch (i.localName().toLowerCase()) {
						case 'author':
							itm['author'] = i.text().toString();
							break;
						case 'duration':
							itm['duration'] = Strings.seconds(i.text().toString());
							break;
						case 'summary':
							itm['description'] = i.text().toString();
							break;
						case 'keywords':
							itm['tags'] = i.text().toString();
							break;
					}
				}
			}
			return itm;
		}

	}

}