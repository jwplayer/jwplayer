package com.longtailvideo.jwplayer.parsers {

	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.utils.Strings;

	/**
	 * Parse an ATOM feed and translate it to a feedarray.
	 **/
	public class ATOMParser implements IPlaylistParser {

		/** Parse an RSS playlist for feeditems. **/
		public function parse(dat:XML):Array {
			var arr:Array = new Array();
			for each (var i:XML in dat.children()) {
				if (i.localName().toLowerCase() == 'entry') {
					arr.push(parseItem(i));
				}
			}
			return arr;
		}

		/** Translate ATOM item to playlist item. **/
		public function parseItem(obj:XML):PlaylistItem {
			var itm:Object = new Object();
			for each (var i:XML in obj.children()) {
				switch (i.localName().toLowerCase()) {
					case 'author':
						itm['author'] = i.children()[0].text().toString();
						break;
					case 'title':
						itm['title'] = i.text().toString();
						break;
					case 'summary':
						itm['description'] = i.text().toString();
						break;
					case 'link':
						if (Strings.xmlAttribute(i, 'rel') == 'alternate') {
							itm['link'] = Strings.xmlAttribute(i, 'href');
						} else if (Strings.xmlAttribute(i, 'rel') == 'enclosure') {
							itm['file'] = Strings.xmlAttribute(i, 'href');
						}
						break;
					case 'published':
						itm['date'] = i.text().toString();
						break;
				}
			}
			itm = MediaParser.parseGroup(obj, itm);
			itm = JWParser.parseEntry(obj, itm);
			return new PlaylistItem(itm);
		}

	}

}