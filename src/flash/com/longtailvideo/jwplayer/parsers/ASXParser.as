package com.longtailvideo.jwplayer.parsers {

	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.utils.Strings;

	/**
	 * Parse an ASX feed and translate it to a feedarray.
	 **/
	public class ASXParser implements IPlaylistParser {

		/** Parse an ASX playlist for feeditems. **/
		public function parse(dat:XML):Array {
			var arr:Array = new Array();
			for each (var i:XML in dat.children()) {
				if (i.localName().toLowerCase() == 'entry') {
					arr.push(parseItem(i));
				}
			}
			return arr;
		}

		/** Translate ASX item to playlist item. **/
		public function parseItem(obj:XML):PlaylistItem {
			var itm:Object = new Object();
			for each (var i:XML in obj.children()) {
				if (!i.localName()) {
					break;
				}
				switch (i.localName().toLowerCase()) {
					case 'ref':
						itm['file'] = Strings.xmlAttribute(i, 'href');
						break;
					case 'title':
						itm['title'] = i.text().toString();
						break;
					case 'moreinfo':
						itm['link'] = Strings.xmlAttribute(i, 'href');
						break;
					case 'abstract':
						itm['description'] = i.text().toString();
						break;
					case 'author':
						itm['author'] = i.text().toString();
						break;
					case 'duration':
						itm['duration'] = Strings.seconds(Strings.xmlAttribute(i, 'value'));
						break;
					case 'starttime':
						itm['start'] = Strings.seconds(Strings.xmlAttribute(i, 'value'));
						break;
					case 'param':
						itm[Strings.xmlAttribute(i, 'name')] = Strings.xmlAttribute(i, 'value');
						break;
				}
			}
			itm = JWParser.parseEntry(obj, itm);
			return new PlaylistItem(itm);
		}

	}

}