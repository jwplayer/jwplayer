package com.longtailvideo.jwplayer.view.skins {
	import flash.utils.ByteArray;

	public class DefaultSkin extends ZIPSkin {
		[Embed(source="../../../../../../../assets/flash/skin/five.zip", mimeType="application/octet-stream")]
		private var EmbeddedSkin:Class;

		public override function load(notUsed:String=""):void {
			try {
				buildSkin(new EmbeddedSkin() as ByteArray);
			} catch(e:Error) {
				sendError(e.message);
			}
		}
	}
}