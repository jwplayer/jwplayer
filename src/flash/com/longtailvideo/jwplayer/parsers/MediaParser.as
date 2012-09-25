package com.longtailvideo.jwplayer.parsers {

	import com.longtailvideo.jwplayer.utils.Strings;

	/**
	 * Parse a MRSS group into a playlistitem (used in RSS and ATOM).
	 **/
	public class MediaParser {

		/** Prefix for the JW Player namespace. **/
		private static const PREFIX:String = 'media';

		/**
		 * Parse a feeditem for Yahoo MediaRSS extensions.
		 * The 'content' and 'group' elements can nest other MediaRSS elements.
		 *
		 * @param obj	The entire MRSS XML object.
		 * @param itm	The playlistentry to amend the object to.
		 * @return		The playlistentry, amended with the MRSS info.
		 * @see			ATOMParser
		 * @see			RSSParser
		 **/
		public static function parseGroup(obj:XML, itm:Object):Object {
			var ytp:Boolean = false;
			var captions:Array = [];
			for each (var i:XML in obj.children()) {
				if (i.namespace().prefix == MediaParser.PREFIX) {
					switch (i.localName().toLowerCase()) {
						case 'content':
							if (!ytp) {
								itm['file'] = Strings.xmlAttribute(i, 'url');
							}
							if (i.@duration.length() > 0) {
								itm['duration'] = Strings.seconds(Strings.xmlAttribute(i, 'duration'));
							}
							if (i.@start.length() > 0) {
								itm['start'] = Strings.seconds(Strings.xmlAttribute(i, 'start'));
							}
							if (i.children().length() > 0) {
								itm = MediaParser.parseGroup(i, itm);
							}
							if (i.@width.length() > 0 || i.@bitrate.length() > 0 || i.@url.length() > 0) {
								if (!itm.levels) {
									itm.levels = new Array();
								}
								itm.levels.push({
									width:Strings.xmlAttribute(i, 'width'),
									bitrate:Strings.xmlAttribute(i, 'bitrate'),
									file:Strings.xmlAttribute(i, 'url')
								});
							}
							break;
						case 'title':
							itm['title'] = i.text().toString();
							break;
						case 'description':
							itm['description'] = i.text().toString();
							break;
						case 'keywords':
							itm['tags'] = i.text().toString();
							break;
						case 'thumbnail':
							itm['image'] = Strings.xmlAttribute(i, 'url');
							break;
						case 'credit':
							itm['author'] = i.text().toString();
							break;
						case 'player':
							if (i.@url.indexOf('youtube.com') > 0) {
								ytp = true;
								itm['file'] = Strings.xmlAttribute(i, 'url');
							}
							break;
						case 'group':
							itm = MediaParser.parseGroup(i, itm);
							break;
						case 'subtitle': 
							var entry:Object = {};
							entry.file = Strings.xmlAttribute(i, 'url');
							if (Strings.xmlAttribute(i, 'lang').length > 0) {
								entry.label = ISO639.label(Strings.xmlAttribute(i, 'lang'));
							}
							captions.push(entry);		
					}
				}
			}
			if(captions.length > 0) {
				itm['captions'] = captions;
			}
			return itm;
		}

	}

}