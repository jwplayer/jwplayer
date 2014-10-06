package com.longtailvideo.jwplayer.utils {
	import flash.display.Loader;
	import flash.display.LoaderInfo;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.HTTPStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.SecurityErrorEvent;
	import flash.net.URLLoader;
	import flash.net.URLLoaderDataFormat;
	import flash.net.URLRequest;
	import flash.system.ApplicationDomain;
	import flash.system.LoaderContext;
	import flash.system.SecurityDomain;
	import flash.utils.ByteArray;


	/**
	 * Sent when the loader has completed loading.  AssetLoader's <code>loadedObject</code> now contains the loaded content.
	 *
	 * @eventType flash.events.Event.COMPLETE
	 */
	[Event(name="complete", type="flash.events.Event")]

	/**
	 * Sent when an error occurred loading or casting the content
	 *
	 * @eventType flash.events.ErrorEvent.ERROR
	 */
	[Event(name="error", type="flash.events.ErrorEvent")]

	public class AssetLoader extends EventDispatcher {
		private const _loaderExtensions:Array = ["swf", "png", "gif", "jpg", "jpeg"];
        private var _overrideContext:LoaderContext;
		private var _loader:Loader;
		private var _urlLoader:URLLoader;
		private var _errorState:Boolean;
		private var LoadedClass:Class;
		public var loadedObject:*;

        public function AssetLoader(loaderContext:LoaderContext = null) {
            _overrideContext = loaderContext;
        }

		public function load(location:String, expectedClass:Class=null, forceLoader:Boolean=false):void {
			_errorState = false;
			
			LoadedClass = expectedClass;

			var ext:String = Strings.extension(location);

			if (forceLoader || _loaderExtensions.indexOf(ext.toLowerCase()) >= 0) {
				useLoader(location);
			} else {
				useURLLoader(location);
			}
		}

		public function loadBytes(byteArray:ByteArray):void {
			loader.loadBytes(byteArray);
		}


		protected function useLoader(location:String):void {
			if (RootReference.root.loaderInfo.url.indexOf('http') == 0) {
				var context:LoaderContext = _overrideContext || new LoaderContext(true, ApplicationDomain.currentDomain, SecurityDomain.currentDomain);
				loader.load(new URLRequest(location), context);
			} else {
				try {
					loader.load(new URLRequest(location));
				} catch(e:Error) {
					dispatchEvent(new SecurityErrorEvent(SecurityErrorEvent.SECURITY_ERROR, false, false, e.message));
				}
			}
		}


		protected function loadComplete(evt:Event):void {
			try {
				if (LoadedClass) {
					loadedObject = (evt.target as LoaderInfo).content as LoadedClass;
				} else {
					loadedObject = (evt.target as LoaderInfo).content;
				}
				dispatchEvent(new Event(Event.COMPLETE));
			} catch (e:Error) {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, e.message));
			}
		}


		protected function loadStatus(evt:HTTPStatusEvent):void {
			switch (evt.status) {
				case 400:
					loadError(new ErrorEvent(ErrorEvent.ERROR, false, false, "Bad request."));
					break;
				case 401:
					loadError(new ErrorEvent(ErrorEvent.ERROR, false, false, "Request not authorize."));
					break;
				case 403:
					loadError(new ErrorEvent(ErrorEvent.ERROR, false, false, "File could not be loaded due to server permissions."));
					break;
				case 404:
					loadError(new ErrorEvent(ErrorEvent.ERROR, false, false, "File not found."));
					break;
				case 500:
					loadError(new ErrorEvent(ErrorEvent.ERROR, false, false, "Internal server error."));
					break;
				case 503:
					loadError(new ErrorEvent(ErrorEvent.ERROR, false, false, "Service unavailable."));
					break;
			}
		}

		protected function loadError(evt:ErrorEvent):void {
			if (evt is SecurityErrorEvent) {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "Crossdomain loading denied."));
			} else {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, "File not found."));
			}
			_errorState = true;
		}


		protected function get loader():Loader {
			if (!_loader) {
				_loader = new Loader();
				_loader.contentLoaderInfo.addEventListener(Event.COMPLETE, loadComplete);
				_loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, loadError);
				_loader.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR, loadError);
			}
			return _loader;
		}


		protected function useURLLoader(location:String):void {
			urlLoader.load(new URLRequest(location));
		}


		protected function urlLoadComplete(evt:Event):void {
			try {
				if (LoadedClass) {
					loadedObject = LoadedClass((evt.target as URLLoader).data);
				} else {
					loadedObject = (evt.target as URLLoader).data;
				}
				dispatchEvent(new Event(Event.COMPLETE));
			} catch (e:Error) {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, e.message));
			}
		}


		protected function get urlLoader():URLLoader {
			if (!_urlLoader) {
				_urlLoader = new URLLoader();
				_urlLoader.dataFormat = URLLoaderDataFormat.BINARY;
				_urlLoader.addEventListener(Event.COMPLETE, urlLoadComplete);
				_urlLoader.addEventListener(IOErrorEvent.IO_ERROR, loadError);
				_urlLoader.addEventListener(HTTPStatusEvent.HTTP_STATUS, loadStatus);
				_urlLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, loadError);
			}
			return _urlLoader;
		}
		
		public override function dispatchEvent(event:Event):Boolean {
			if (!_errorState) {
				return super.dispatchEvent(event);
			} else {
				return false;
			}
		}
	}
}