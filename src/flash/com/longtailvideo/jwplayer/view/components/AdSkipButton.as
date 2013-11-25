package com.longtailvideo.jwplayer.view.components
{
	import com.longtailvideo.jwplayer.events.JWAdEvent;
	import com.longtailvideo.jwplayer.utils.AssetLoader;
	import com.longtailvideo.jwplayer.utils.Base64Decoder;
	import com.longtailvideo.jwplayer.utils.Logger;
	
	import flash.display.Bitmap;
	import flash.display.DisplayObject;
	import flash.display.DisplayObjectContainer;
	import flash.display.Loader;
	import flash.display.MovieClip;
	import flash.display.Sprite;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.FocusEvent;
	import flash.events.IEventDispatcher;
	import flash.events.IOErrorEvent;
	import flash.events.KeyboardEvent;
	import flash.events.MouseEvent;
	import flash.text.TextField;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	import flash.utils.ByteArray;
	import flash.utils.Dictionary;
	
	public class AdSkipButton extends Sprite implements IEventDispatcher
	{
		
		private static var _SKIP_HEIGHT:Number = 30;
		private static var _SKIP_WIDTH:Number = 80;
		protected var _loaders:Dictionary = new Dictionary();
		private static var _SKIP_ICON:String = "iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3NpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0ODkzMWI3Ny04YjE5LTQzYzMtOGM2Ni0wYzdkODNmZTllNDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDI0OTcxRkE0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDI0OTcxRjk0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NDA5ZGQxNDktNzdkMi00M2E3LWJjYWYtOTRjZmM2MWNkZDI0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjQ4OTMxYjc3LThiMTktNDNjMy04YzY2LTBjN2Q4M2ZlOWU0NiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqAZXX0AAABYSURBVHjafI2BCcAwCAQ/kr3ScRwjW+g2SSezCi0kYHpwKLy8JCLDbWaGTM+MAFzuVNXhNiTQsh+PS9QhZ7o9JuFMeUVNwjsamDma4K+3oy1cqX/hxyPAAAQwNKV27g9PAAAAAElFTkSuQmCC";
		private static var _SKIP_ICON_OVER:String = "iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3NpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0ODkzMWI3Ny04YjE5LTQzYzMtOGM2Ni0wYzdkODNmZTllNDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDI0OTcxRkU0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDI0OTcxRkQ0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NDA5ZGQxNDktNzdkMi00M2E3LWJjYWYtOTRjZmM2MWNkZDI0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjQ4OTMxYjc3LThiMTktNDNjMy04YzY2LTBjN2Q4M2ZlOWU0NiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PvgIj/QAAABYSURBVHjadI6BCcAgDAS/0jmyih2tm2lHSRZJX6hQQ3w4FP49LKraSHV3ZLDzAuAi3cwaqUhSfvft+EweznHneUdTzPGRmp5hEJFhAo3LaCnjn7blzCvAAH9YOSCL5RZKAAAAAElFTkSuQmCC";
		protected var _skipText:TextField;
		protected var _skipOffset:int;
		protected var _adTag:String;
		protected var _skipArrow:Bitmap;
		protected var _skipArrowHover:Bitmap;
		protected var _skipTime:Boolean = false;
		public function AdSkipButton(skipOffset:int,adTag:String)
		{
			_skipOffset = skipOffset;
			_adTag = adTag;
			graphics.beginFill(0x000000, .5); 
			graphics.drawRoundRect(0.5,0.5,_SKIP_WIDTH,_SKIP_HEIGHT,10,10);
			graphics.endFill();
			graphics.lineStyle(1, 0xFFFFFF,.25);
			graphics.beginFill(0xFFFFFF, 0);
			graphics.drawRoundRect(0.5,0.5,_SKIP_WIDTH,_SKIP_HEIGHT,10,10);
			graphics.endFill();
			width = _SKIP_WIDTH;
			height = _SKIP_HEIGHT;
			var skipLoader:AssetLoader = new AssetLoader();
			skipLoader.addEventListener(Event.COMPLETE, elementHandler);
			skipLoader.addEventListener(ErrorEvent.ERROR, elementError);
			var byteSrc:ByteArray = Base64Decoder.decode(_SKIP_ICON);
			skipLoader.loadBytes(byteSrc);
			_loaders[skipLoader] = "skipButtonNormal";	
			var skipHoverLoader:AssetLoader = new AssetLoader();
			skipHoverLoader.addEventListener(Event.COMPLETE, elementHandler);
			skipHoverLoader.addEventListener(ErrorEvent.ERROR, elementError);
			byteSrc = Base64Decoder.decode(_SKIP_ICON_OVER);
			skipHoverLoader.loadBytes(byteSrc);
			_loaders[skipHoverLoader] = "skipButtonHover";	
			var myFormat:TextFormat = new TextFormat();
			myFormat.align = TextFormatAlign.CENTER;
			
			myFormat.font = "_sans";
			myFormat.size = 11;
			myFormat.bold = true;
			_skipText = new TextField();
			_skipText.alpha = .75;
			_skipText.width = _SKIP_WIDTH;
				
			_skipText.defaultTextFormat = myFormat;
			_skipText.y = _SKIP_HEIGHT/2 - 17/2;
			_skipText.height = _SKIP_HEIGHT-_skipText.y;
			addChild(_skipText);
			updateSkipText(0);
		}
		
		protected function elementHandler(evt:Event):void {
			try {
				var loader:AssetLoader = evt.target as AssetLoader;
				_loaders[evt.target] == "skipButtonNormal" ?  _skipArrow = loader.loadedObject as Bitmap :  _skipArrowHover = loader.loadedObject as Bitmap;
			} catch (e:Error) {

			} 
	
		}
		
		protected function elementError(evt:ErrorEvent):void {

		}
		
		
		public function updateSkipText(currTime:Number,adTag:String = ""):void {
			if (adTag) _adTag = adTag;
			if (currTime < _skipOffset) {
				_skipText.text = "Skip ad in " + Math.ceil(_skipOffset - currTime);
				_skipText.textColor= 0x979797;
			} else if (!_skipTime) {
				_skipTime = true;
				_skipText.text = "Skip";
				var myFormat:TextFormat = new TextFormat();
				myFormat.align = TextFormatAlign.LEFT;
				addChild(_skipArrow);
				myFormat.font = "_sans";
				myFormat.size = 12;
				myFormat.bold = true;
				_skipText.setTextFormat(myFormat);
				_skipText.x = 20;
				
				_skipArrow.x = _skipText.x + _skipText.textWidth + 6;
				_skipArrow.y = _SKIP_HEIGHT/2 - _skipArrow.height/2 + 2;
				_skipArrowHover.visible = false;
				addChild(_skipArrowHover);
				_skipArrowHover.x = _skipText.x + _skipText.textWidth + 6;
				_skipArrowHover.y = _SKIP_HEIGHT/2 - _skipArrow.height/2 + 2;
				addEventListener(MouseEvent.CLICK, skipAd);
				addEventListener(MouseEvent.ROLL_OVER, mouseoverSkipAd);
				addEventListener(MouseEvent.MOUSE_OUT, mouseoutSkipAd);
				buttonMode = true;
				mouseChildren=false;
			}
		}
		
		private function mouseoverSkipAd(evt:Event):void {
			_skipArrow.visible = false;
			_skipArrowHover.visible = true;
			graphics.clear();
			graphics.beginFill(0x000000, .5); 
			graphics.drawRoundRect(0.5,0.5,_SKIP_WIDTH,_SKIP_HEIGHT,10,10);
			graphics.endFill();
			graphics.lineStyle(1,0xFFFFFF, 1); 
			graphics.beginFill(0xFFFFFF, 0);
			graphics.drawRoundRect(0.5,0.5,_SKIP_WIDTH,_SKIP_HEIGHT,10,10);
			graphics.endFill();
			_skipText.textColor = 0xE1E1E1;
			_skipText.alpha = 1.0;
		}
		
		private function mouseoutSkipAd(evt:Event):void {
			_skipArrowHover.visible = false;
			_skipArrow.visible = true;
			graphics.clear();
			graphics.beginFill(0x000000, .5); 
			graphics.drawRoundRect(0.5,0.5,_SKIP_WIDTH,_SKIP_HEIGHT,10,10);
			graphics.endFill();
			graphics.lineStyle(1, 0xFFFFFF,.25);
			graphics.beginFill(0xFFFFFF, 0);
			graphics.drawRoundRect(0.5,0.5,_SKIP_WIDTH,_SKIP_HEIGHT,10,10);
			graphics.endFill();
			_skipText.textColor =  0x979797;;
		}
		public function resize(width:Number, height:Number):void
		{
		}
		
		private function skipAd(evt:Event):void {
			var adEvent:JWAdEvent = new JWAdEvent(JWAdEvent.JWPLAYER_AD_SKIPPED);
			adEvent.tag = _adTag;
			dispatchEvent(adEvent);
		}
		
	}
}