package com.longtailvideo.jwplayer.view.skins {
	import flash.events.Event;
	import flash.utils.ByteArray;

	public class DefaultSkin extends PNGSkin {
		[Embed(source="../../../../../../../assets/six.xml", mimeType="application/octet-stream")]
		private var EmbeddedSkin:Class;
		
		public override function load(notUsed:String=""):void {
			loadComplete(new Event(Event.COMPLETE));
		}
		protected override function loadComplete(notUsed:Event):void {
			try {
				var skin:ByteArray = (new EmbeddedSkin() as ByteArray);
				_skinXML = XML(skin);
				parseSkin();
			} catch (e:Error) {
				sendError(e.message);
			}
		}
	}
}