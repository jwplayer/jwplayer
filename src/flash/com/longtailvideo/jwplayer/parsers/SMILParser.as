package com.longtailvideo.jwplayer.parsers {

	import com.longtailvideo.jwplayer.utils.Strings;

	/**
	 * Parse the application and list of levels from an RTMP SMIL manifest.
	 **/
	public class SMILParser {


		/** Retrieve the RTMP application from SMIL file. **/
		public static function parseApplication(xml:XML):String {
			var base:String = '';
			try { 
				base = Strings.xmlAttribute(xml.children()[0].children()[0],'base');
			} catch (error:Error) {}
			return base;
		};


		/** Parse an SMIL playlist for feeditems. **/
		public static function parseLevels(xml:XML):Array {
			var levels:Array = [];
			var bitrates:Boolean = true;
			try {
				var parent:XML = xml.children()[1].children()[0];
				// Switch with multiple levels found
				if (parent.localName().toLowerCase() == 'switch') {
					for each (var i:XML in parent.children()) {
						var level:Object = {};
						var id:String = Strings.xmlAttribute(i,'src');
						var bitrate:Number = Number(Strings.xmlAttribute(i,'system-bitrate'));
						var width:Number = Number(Strings.xmlAttribute(i,'width'));
						var height:Number = Number(Strings.xmlAttribute(i,'height'));
						var label:String = Strings.xmlAttribute(i,'title');
						// Include the label attribute
						if(id) {
							level.id = id;
							level.label = String(i);
							if(bitrate) { 
								level.bitrate = Math.round(bitrate/1024);
								level.label = level.bitrate + 'kbps';
							} else { 
								bitrates = false;
							}
							if(width) { 
								level.width = width;
								level.label = width + 'px';
							}
							if(height) { 
								level.height = height;
								level.label = height + 'p';
							}
							if (label) level.label = label;
							levels.push(level);
						}
					}
					
				// Only a single file found
				} else if(Strings.xmlAttribute(parent,'src')) {
					levels.push({id:Strings.xmlAttribute(parent,'src')});
				}
			} catch (error:Error) {}
			return levels;
		};


	}
}