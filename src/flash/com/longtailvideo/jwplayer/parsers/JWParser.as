/**
 * Parse JWPlayer specific feed content into playlists.
 **/
package com.longtailvideo.jwplayer.parsers {
	import com.longtailvideo.jwplayer.utils.Strings;

	public class JWParser {

		/** Prefix for the JW Player namespace. **/
		private static const PREFIX:String = 'jwplayer';

		/** File extensions of all supported mediatypes. **/
		private static var extensions:Object = {
				'3g2':'video',
				'3gp':'video',
				'aac':'video',
				'f4b':'video',
				'f4p':'video',
				'f4v':'video',
				'flv':'video',
				'gif':'image',
				'jpg':'image',
				'jpeg':'image',
				'm4a':'video',
				'm4v':'video',
				'mov':'video',
				'mp3':'sound',
				'mp4':'video',
				'png':'image',
				'rbs':'sound',
				'sdp':'video',
				'swf':'image',
				'vp6':'video',
				'webm':'video',
				'ogg':'video',
				'ogv':'video'
			};
			
		/**
		 * Parse a feedentry for JWPlayer content.
		 *
		 * @param obj	The XML object to parse.
		 * @param itm	The playlistentry to amend the object to.
		 * @return		The playlistentry, amended with the JWPlayer info.
		 * @see			ASXParser
		 * @see			ATOMParser
		 * @see			RSSParser
		 * @see			SMILParser
		 * @see			XSPFParser
		 **/
		public static function parseEntry(obj:XML, itm:Object):Object {
			var sources:Array = [];
			var tracks:Array = [];
			for each (var i:XML in obj.children()) {
				if (i.namespace().prefix == JWParser.PREFIX) {
					if (i.localName().toLowerCase() == "source") {
						var source:Object = {};
						source.file = Strings.xmlAttribute(i,"file");
						source["default"] = Strings.xmlAttribute(i, "default");
						source.label = Strings.xmlAttribute(i, "label");
						source.type = Strings.xmlAttribute(i, "type");
						if(source.type.length) {
							source.type = MediaParser.getType(source.type);
						}
						if (source.file.length > 0) {
							sources.push(source);
						}
						
					}
					else if (i.localName().toLowerCase() == "track") {
						var track:Object = {};
						track.file = Strings.xmlAttribute(i,"file");
						track["default"] = Strings.xmlAttribute(i, "default");
						track.label = Strings.xmlAttribute(i, "label");
						track.kind = Strings.xmlAttribute(i, "kind");
						if (track.file.length > 0) {
							tracks.push(track);
						}
					}
					else {
						itm[i.localName()] = Strings.serialize(i.text().toString());
						if (i.localName() == "file" && itm.levels) {
							// jwplayer namespace file should override existing level (probably set in MediaParser)
							delete itm.levels;
						}
					}
				}
				if(!itm['file'] && String(itm['link']).toLowerCase().indexOf('youtube') > -1) {
					itm['file'] = itm['link'];
				}
			}
			
			if (sources.length > 0) {
				delete itm.levels;
				for (var j:Number = 0; j < sources.length; j++) {
					sources[j]["default"] = (sources[j]["default"].toString() == "true");
					sources[j].label.length == 0 ? delete sources[j].label : null;
				}
				itm.levels = sources;
			}
			
			if (tracks.length > 0) {
				delete itm.tracks;
				for (j = 0; j < tracks.length; j++) {
					tracks[j]["default"] = (tracks[j]["default"].toString() == "true");
					tracks[j].kind = tracks[j].kind.length == 0 ? "captions" : tracks[j].kind;
					tracks[j].label.length == 0 ? delete tracks[j].label : null;
				}
				itm.tracks = tracks;
			}
			
			return itm;
		}

		public static function getProvider(item:Object):String {
			if (item['type']) {
				return item['type'];
			} else if (Strings.isYouTube(item['file'])) {
				return "youtube";
			} else if (item['streamer'] && item['streamer'].indexOf('rtmp') == 0) {
				return "rtmp";
			} else if (item['streamer'] && item['streamer'].indexOf('http') == 0) {
				return "http";
			} else {
				var ext:String = Strings.extension(item['file']);
				if (extensions.hasOwnProperty(ext)) {
					return extensions[ext];
				}
			}

			return "";
		}
		
	}

}