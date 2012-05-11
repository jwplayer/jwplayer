package com.longtailvideo.jwplayer.parsers {

	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.utils.Strings;

	/**
	 * Parse an XSPF feed and translate it to a feedarray.
	 **/
	public class XSPFParser implements IPlaylistParser {

		/** Parse an XSPF playlist for feeditems. **/
		public function parse(dat:XML):Array {
			var arr:Array = new Array();
			for each (var i:XML in dat.children()) {
				if (i.localName().toLowerCase() == 'tracklist') {
					for each (var j:XML in i.children()) {
						arr.push(parseItem(j));
					}
				}
			}
			return arr;
		}

		/** Translate XSPF item to playlist item. **/
		public function parseItem(obj:XML):PlaylistItem {
			var itm:Object = new Object();
			for each (var i:XML in obj.children()) {
				if (!i.localName()) {
					break;
				}
				switch (i.localName().toLowerCase()) {
					case 'location':
						itm['file'] = i.text().toString();
						break;
					case 'title':
						itm['title'] = i.text().toString();
						break;
					case 'annotation':
						itm['description'] = i.text().toString();
						break;
					case 'info':
						itm['link'] = i.text().toString();
						break;
					case 'image':
						itm['image'] = i.text().toString();
						break;
					case 'creator':
						itm['author'] = i.text().toString();
						break;
					case 'duration':
						itm['duration'] = Strings.seconds(i.text());
						break;
					case 'meta':
						itm[Strings.xmlAttribute(i, 'rel')] = i.text().toString();
						break;
					case 'extension':
						for each (var ext:XML in i.children()) {
							itm[ext.localName().toLowerCase()] = ext.text().toString();
						}
						break;
				}
			}
			itm = JWParser.parseEntry(obj, itm);
			return new PlaylistItem(itm);
		}

	}

}