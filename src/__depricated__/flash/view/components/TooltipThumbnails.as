package com.longtailvideo.jwplayer.view.components
{
	import com.longtailvideo.jwplayer.parsers.SRT;
	import com.longtailvideo.jwplayer.utils.AssetLoader;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.DisplayObject;
	import flash.display.Loader;
	import flash.display.Sprite;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.geom.Rectangle;
	import flash.net.URLRequest;
	
	/**
	 * Sent when the image has completed loading.
	 *
	 * @eventType flash.events.Event.COMPLETE
	 */
	[Event(name="complete", type="flash.events.Event")]

	
	public class TooltipThumbnails extends Sprite {
		private var vttLoader:AssetLoader;
		private var vttPath:String;
		private var loadedVTT:String;
		private var cues:Array;
		private var spriteDimensions:Rectangle;
		private var container:Sprite;
		private var loaderHash:Object;
		private var _url:String;
		private var _imageLoader:Loader;
		
		public function TooltipThumbnails(skin:ISkin) {
			spriteDimensions = new Rectangle();
			
			container = new Sprite();
			addChild(container);
		}
		
		public function load(vttFile:String):void {
			if (vttFile) {
				if (vttFile != loadedVTT) {
					loadedVTT = vttFile;
					vttPath = loadedVTT.split("?")[0].split("/").slice(0, -1).join("/");
					if (vttLoader) {
						vttLoader.removeEventListener(Event.COMPLETE, loadComplete);
						vttLoader.removeEventListener(ErrorEvent.ERROR, loadError);
					}
					vttLoader = new AssetLoader();
					vttLoader.addEventListener(Event.COMPLETE, loadComplete);
					vttLoader.addEventListener(ErrorEvent.ERROR, loadError);
					vttLoader.load(loadedVTT, String);
				}
			} else {
				_url = null;
				loaderHash = {};
				cues = null;
				loadedVTT = null;
				if (vttLoader) {
					vttLoader.removeEventListener(Event.COMPLETE, loadComplete);
					vttLoader.removeEventListener(ErrorEvent.ERROR, loadError);
					vttLoader = null;
				}
				if (_imageLoader) {
					_imageLoader.contentLoaderInfo.removeEventListener(Event.COMPLETE, imageLoaded);
				}
				while (container.numChildren > 0) {
					container.removeChildAt(0);
				}
			}
		}
		
		private function loadComplete(evt:Event):void {
			try {
				cues = SRT.parseCaptions(vttLoader.loadedObject as String, true);
			} catch(e:Error) {
				cues = null;
				Logger.log("Could not load thumbnails");
				return;
			}
			_url = null;
			loaderHash = {};
			updateTimeline(0);
		}

		private function loadError(evt:ErrorEvent):void {
			loadedVTT = null;
			Logger.log("Could not load thumbnails");
		}
		
		public function updateTimeline(seconds:Number):void {
			if (!cues) return; 
			
			var i:Number = 0; 
			while(i < cues.length && seconds > cues[i].end) {
				i++;
			}
			if (i == cues.length) i--;
			if (cues[i].text) {
				loadImage(cues[i].text);
			}
		}
		
		private function loadImage(url:String):void {
			// only load image if it's different from the last one
			if (url && url !== _url) {
				if (url.indexOf("://") < 0) {
					url = vttPath ? vttPath + "/" + url : url;
				}
				var hashIndex:Number = url.indexOf("#xywh");
				if (hashIndex > 0) {
					var regEx:RegExp = /(.+)\#xywh=(\d+),(\d+),(\d+),(\d+)/;
					var thumbParams:Array = regEx.exec(url);
					url = thumbParams[1];
					spriteDimensions.x = parseFloat(thumbParams[2]);
					spriteDimensions.y = parseFloat(thumbParams[3]);
					spriteDimensions.width = parseFloat(thumbParams[4]);
					spriteDimensions.height = parseFloat(thumbParams[5]);
				} else {
					spriteDimensions.x =
					spriteDimensions.y =
					spriteDimensions.width =
					spriteDimensions.height = 0;
				}
				while (container.numChildren > 0) {
					container.removeChildAt(0);
				}
				var imageLoader:Loader = loaderHash[url] as Loader;
				if (!imageLoader) {
					imageLoader = new Loader();
					imageLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, imageLoaded);
					loaderHash[url] = imageLoader;
					imageLoader.load(new URLRequest(url));
				} else if (imageLoader.content) {
					updateSprite(imageLoader);
				} else {
					imageLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, imageLoaded);
				}
				if (_imageLoader && _imageLoader != imageLoader) {
					// ignore previous loader 
					_imageLoader.contentLoaderInfo.removeEventListener(Event.COMPLETE, imageLoaded);
				}
				_imageLoader = imageLoader;
			}
			_url = url;
		}

		private function imageLoaded(evt:Event=null):void {
			var imageLoader:Loader = evt.currentTarget.loader as Loader;
			imageLoader.contentLoaderInfo.removeEventListener(Event.COMPLETE, imageLoaded);
			updateSprite(imageLoader);
			dispatchEvent(new Event(Event.COMPLETE));
		}
		
		private function updateSprite(imageLoader:Loader):void {
			if (spriteDimensions.width === 0) {
				spriteDimensions.width = imageLoader.content.width;
				spriteDimensions.height = imageLoader.content.height;
			} else {
				imageLoader.x = -spriteDimensions.x;
				imageLoader.y = -spriteDimensions.y;
				var imageMask:Sprite = imageLoader.mask as Sprite;
				if (!imageMask) {
					imageMask = new Sprite();
				}
				imageMask.graphics.clear();
				imageMask.graphics.beginFill(0x00ff00);
				imageMask.graphics.drawRect(0, 0, spriteDimensions.width, spriteDimensions.height);
				imageLoader.mask = imageMask;
				container.addChild(imageMask);
			}
			container.addChild(imageLoader);
		}
	
		public override function get width():Number {
			return spriteDimensions.width;	
		}
		
		public override function get height():Number {
			return spriteDimensions.height;
		}
		
		public override function getBounds(targetCoordinateSpace:DisplayObject):Rectangle {
			return spriteDimensions;
		}

	}
	
}
