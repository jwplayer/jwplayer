package com.longtailvideo.jwplayer.view.skins {
	import flash.display.DisplayObject;
	import flash.display.Loader;
	import flash.display.LoaderInfo;
	import flash.display.MovieClip;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	
	import mx.core.MovieClipLoaderAsset;

	public class DefaultSkin extends SWFSkin {
		[Embed(source="../../../../../../../assets/flash/skin/five.swf")]
		private var EmbeddedSkin:Class;

		public override function load(notUsed:String=""):void {
			var skinObj:MovieClipLoaderAsset = new EmbeddedSkin() as MovieClipLoaderAsset;
			try {
				var embeddedLoader:Loader = Loader(skinObj.getChildAt(0));
				embeddedLoader.contentLoaderInfo.addEventListener(Event.INIT, loadComplete);
				embeddedLoader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, loadError);
			} catch (e:Error) {
				sendError(e.message);
			}
		}

		protected override function loadComplete(evt:Event):void {
			try {
				var loader:LoaderInfo = LoaderInfo(evt.target);
				var skinClip:MovieClip = MovieClip(loader.content);
				overwriteSkin(skinClip.getChildByName('player'));
				loader.removeEventListener(Event.INIT, loadComplete);
				loader.removeEventListener(IOErrorEvent.IO_ERROR, loadError);
				dispatchEvent(new Event(Event.COMPLETE));
			} catch (e:Error) {
				sendError("DefaultSkin: " + e.message);
			}
		}

		protected override function loadError(evt:ErrorEvent):void {
			sendError("DefaultSkin: " + evt.text);
		}

	}
}