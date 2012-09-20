package com.longtailvideo.jwplayer.parsers {
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.utils.Strings;

	/**
	 * Parse an RSS feed and translate it to a feedarray.
	 **/
	public class RSSParser implements IPlaylistParser {

		/** Parse an RSS playlist for feeditems. **/
		public function parse(dat:XML):Array {
			var arr:Array = new Array();
			for each (var i:XML in dat.children()) {
				if (i.localName().toLowerCase() == 'channel') {
					for each (var j:XML in i.children()) {
						if (j.localName().toLowerCase() == 'item') {
							arr.push(parseItem(j));
						}
					}
				}
			}
			return arr;
		}

		/** Translate RSS item to playlist item. **/
		public function parseItem(obj:XML):PlaylistItem {
			var itm:Object = new Object();
			for each (var i:XML in obj.children()) {
				switch (i.localName().toLowerCase()) {
					case 'enclosure':
						itm['file'] = Strings.xmlAttribute(i, 'url');
						break;
					case 'title':
						itm['title'] = i.text().toString();
						break;
					case 'guid':
						itm['mediaid'] = i.text().toString();
						break;
					case 'pubdate':
						itm['date'] = i.text().toString();
						break;
					case 'description':
						itm['description'] = i.text().toString();
						break;
					case 'link':
						itm['link'] = i.text().toString();
						break;
					case 'category':
						if (itm['tags']) {
							itm['tags'] += i.text().toString();
						} else {
							itm['tags'] = i.text().toString();
						}
						break;
				}
			}
			// itm = ItunesParser.parseEntry(obj, itm);
			itm = MediaParser.parseGroup(obj, itm);
			itm = JWParser.parseEntry(obj, itm);
			return new PlaylistItem(itm);
		}

	}

}