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
		private var imageLoader:Loader;
		private var imageMask:Sprite;
		private var vttPath:String;
		private var loadedVTT:String;
		private var loadedImage:String;
		private var cues:Array;
		private var spriteDimensions:Rectangle;
		private var container:Sprite;
		
		public function TooltipThumbnails(skin:ISkin) {
			spriteDimensions = new Rectangle();
			
			container = new Sprite();
			addChild(container);
			
			vttLoader = new AssetLoader();
			vttLoader.addEventListener(Event.COMPLETE, loadComplete);
			vttLoader.addEventListener(ErrorEvent.ERROR, loadError);
			
			imageLoader = new Loader();
			imageLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, imageLoaded);
			
			container.addChild(imageLoader);

			imageMask = new Sprite();
			container.addChild(imageMask);
		}
		
		public function load(vttFile:String):void {
			loadedImage = null;
			spriteDimensions = new Rectangle();
			if (vttFile && vttFile != loadedVTT) {
				loadedVTT = vttFile;
				imageLoader.visible = true;
				vttPath = loadedVTT.split("?")[0].split("/").slice(0, -1).join("/");
				vttLoader.load(loadedVTT, String);
			} else {
				loadedVTT = null;
			}
		}
		
		private function loadComplete(evt:Event):void {
			try {
				cues = SRT.parseCaptions(vttLoader.loadedObject as String, true);
				updateTimeline(0);
			} catch(e:Error) {
				cues = null;
				Logger.log("Could not load thumbnails");
			}
		}

		private function loadError(evt:ErrorEvent):void {
			Logger.log("Could not load thumbnails");
		}
		
		public function updateTimeline(seconds:Number):void {
			var i = 0;
			if (!cues) return; 

			while(i < cues.length && seconds > cues[i].end) {
				i++;
			}
			if (i == cues.length) i--;
			if (cues[i].text) {
				loadImage(cues[i].text);
			}
		}
		
		private function loadImage(url:String, preload:Boolean=false):void {
			if (url.indexOf("://") < 0) url = vttPath ? vttPath + "/" + url : url;
			var hashIndex = url.indexOf("#xywh");
			var imageLocation:String;
			if (hashIndex > 0) {
				var regEx:RegExp = /(.+)\#xywh=(\d+),(\d+),(\d+),(\d+)/;
				var thumbParams = regEx.exec(url);
				imageLocation = thumbParams[1];
				spriteDimensions = new Rectangle(
					thumbParams[2],
					thumbParams[3],
					thumbParams[4],
					thumbParams[5]
				);

				imageLoader.x = -spriteDimensions.x;
				imageLoader.y = -spriteDimensions.y;

				if (spriteDimensions.width != imageMask.width || spriteDimensions.height != imageMask.height) {
					imageMask.graphics.clear();
					imageMask.graphics.beginFill(0x00ff00);
					imageMask.graphics.drawRect(0, 0, spriteDimensions.width, spriteDimensions.height);
					imageLoader.mask = imageMask;
				}
				
				url = imageLocation;
				
			}
			
			if (url != loadedImage) {
				loadedImage = url;
				imageLoader.load(new URLRequest(loadedImage));
			}
		}

		private function imageLoaded(evt:Event=null):void {
			//while(container.numChildren) container.removeChildAt(0);
			if (!container.contains(imageLoader)) container.addChild(imageLoader);
			if (!spriteDimensions.width);
			spriteDimensions = new Rectangle(0, 0, imageLoader.content.width, imageLoader.content.height);
			dispatchEvent(new Event(Event.COMPLETE));
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