package com.longtailvideo.jwplayer.controller {
	import com.longtailvideo.jwplayer.media.MediaProvider;
	import com.longtailvideo.jwplayer.utils.AssetLoader;
	
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.EventDispatcher;

	/**
	 * Sent when the plugin loader has loaded all valid plugins.
	 *
	 * @eventType flash.events.Event.COMPLETE
	 */
	[Event(name="complete", type = "flash.events.Event")]

	/**
	 * Sent when an error occured during plugin loading.
	 *
	 * @eventType flash.events.ErrorEvent.ERROR
	 */
	[Event(name="error", type = "flash.events.ErrorEvent")]

	/**
	 * This class loads external MediaProvider swfs.  
	 */
	public class MediaProviderLoader extends EventDispatcher {
		
		private var repository:String = "http://providers.longtailvideo.com/5/";

		public var loadedSource:MediaProvider;

		/**
		 * Loads a SWF file whose document class extends MediaProvider.
		 */
		public function loadSource(url:String):void {
			var newLoader:AssetLoader = new AssetLoader();
			newLoader.addEventListener(Event.COMPLETE, loadHandler);
			newLoader.addEventListener(ErrorEvent.ERROR, loadHandler);
			if (url.substr(url.length-4, 4) == ".swf") {
				newLoader.load(url);
			} else {
				newLoader.load(repository + url + '.swf');
			}
		}
		
		private function loadHandler(evt:Event):void {
			var loader:AssetLoader = evt.target as AssetLoader;
			try {
				loadedSource = loader.loadedObject as MediaProvider;
				if (loadedSource) {
					dispatchEvent(new Event(Event.COMPLETE));
				} else {
					dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "Loaded file is not a valid media provider."));
				}
			} catch (e:Error) {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, e.message));
			}
		}
		
		private function loadError(evt:ErrorEvent):void {
			dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, evt.text));
		}

	}
}