package com.longtailvideo.jwplayer.view.components
{
	import com.longtailvideo.jwplayer.events.JWAdEvent;
	import com.longtailvideo.jwplayer.utils.Strings;
	
	import flash.display.Bitmap;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.IEventDispatcher;
	import flash.events.MouseEvent;
	import flash.text.TextField;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	
	
	public class AdSkipButton extends Sprite implements IEventDispatcher
	{
		
		
		
		[Embed(source="../../../../../../../assets/skipButton.png")]
		private var SkipIcon:Class;

		
		
		[Embed(source="../../../../../../../assets/skipButtonOver.png")]
		private var SkipIconOver:Class;
		
		private static var _SKIP_HEIGHT:Number = 30;
		private static var _SKIP_WIDTH:Number = 80;

		protected var _skipTextField:TextField;
		protected var _skipText:String;
		protected var _skipMessage:String;
		protected var _skipOffset:String;
		protected var _offsetTime:Number = -1;
		protected var _hidden:Boolean = false;
		protected var _adTag:String;
		protected var _skipArrow:Bitmap;
		protected var _skipArrowHover:Bitmap;
		protected var _skipTime:Boolean = false;
		
		public function AdSkipButton(skipMessage:String, skipText:String, tag:String = null)
		{
			_skipMessage = skipMessage;
			_skipText = skipText;
			_adTag = tag;

			this.tabEnabled = false;
			graphics.beginFill(0x000000, .5); 
			graphics.drawRoundRect(0.5,0.5,_SKIP_WIDTH,_SKIP_HEIGHT,10,10);
			graphics.endFill();
			graphics.lineStyle(1, 0xFFFFFF,.25);
			graphics.beginFill(0xFFFFFF, 0);
			graphics.drawRoundRect(0.5,0.5,_SKIP_WIDTH,_SKIP_HEIGHT,10,10);
			graphics.endFill();
			width = _SKIP_WIDTH;
			height = _SKIP_HEIGHT;

			_skipArrow = new SkipIcon();
			_skipArrowHover = new SkipIconOver();
			var myFormat:TextFormat = new TextFormat();
			myFormat.align = TextFormatAlign.CENTER;
			
			myFormat.font = "_sans";
			myFormat.size = 11;
			myFormat.bold = true;
			_skipTextField = new TextField();
			_skipTextField.alpha = .75;
			_skipTextField.width = _SKIP_WIDTH;
				
			_skipTextField.defaultTextFormat = myFormat;
			_skipTextField.y = _SKIP_HEIGHT/2 - 17/2;
			_skipTextField.height = _SKIP_HEIGHT-_skipTextField.y;
			addChild(_skipTextField);
			updateSkipText(0, 0);
			
			// Prevent clicks from affecting the regular player
			addEventListener(MouseEvent.CLICK,function(evt:MouseEvent):void { evt.stopPropagation();});
		}
		

		
		private function updateOffset(pos:Number, duration:Number):void {
			try {
				if (_skipOffset.substr(-1) == "%") {
					var percent:Number = parseFloat(_skipOffset.slice(0, -1));
					if (duration && !isNaN(percent)) {
						_offsetTime = duration * percent / 100;
					}
				} else { 
					_offsetTime = Strings.seconds(_skipOffset);
				}
			} catch (e:Error) {
				_offsetTime = NaN;
			}
			if (isNaN(_offsetTime)) {
				_offsetTime = -1;
				this.visible = false;
			} else if (!_hidden) {
				this.visible = true;
			}
		}
		
		
		public function hide():void {
			_hidden = true;
			this.visible = false;
			
		}
		
		
		public function show():void {
			_hidden = false;
			this.visible = true;
		}
		
		public function updateSkipText(currTime:Number, duration:Number):void {
			updateOffset(currTime, duration);
			var myFormat:TextFormat;
			if (_offsetTime < 0) return;
			if (currTime <= _offsetTime) {

				graphics.clear();
				graphics.beginFill(0x000000, .5); 
				graphics.drawRoundRect(0.5,0.5,_SKIP_WIDTH,_SKIP_HEIGHT,10,10);
				graphics.endFill();
				graphics.lineStyle(1, 0xFFFFFF,.25);
				graphics.beginFill(0xFFFFFF, 0);
				graphics.drawRoundRect(0.5,0.5,_SKIP_WIDTH,_SKIP_HEIGHT,10,10);
				graphics.endFill();
				myFormat = new TextFormat();
				myFormat.align = TextFormatAlign.CENTER;
				
				myFormat.font = "_sans";
				myFormat.size = 11;
				myFormat.bold = true;
				_skipTextField.alpha = .75;
				_skipTextField.width = _SKIP_WIDTH;
				_skipTextField.x = 0;
				_skipTextField.setTextFormat(myFormat);
				_skipTextField.y = _SKIP_HEIGHT/2 - 17/2;
				_skipTextField.height = _SKIP_HEIGHT-_skipTextField.y;
				var re:RegExp = /xx/gi;
				_skipTextField.text = _skipMessage.replace(re, Math.ceil(_offsetTime - currTime));
				_skipTextField.textColor= 0x979797;
			} else if (!_skipTime) {

				_skipTime = true;
				_skipTextField.text = _skipText; //add the padding to put the skip icon over but keep it centered
				myFormat = new TextFormat();
				myFormat.rightMargin = 10;
				myFormat.align = TextFormatAlign.CENTER;
				addChild(_skipArrow);
				_skipArrow.visible = true;
				myFormat.font = "_sans";
				myFormat.size = 12;
				myFormat.bold = true;
				_skipTextField.setTextFormat(myFormat);

				//_skipTextField.x = 20;
				
				_skipArrow.x = _skipArrowHover.x =  (_SKIP_WIDTH - ((_SKIP_WIDTH - _skipTextField.textWidth) /2) -2);
				_skipArrow.y = _skipArrowHover.y = _SKIP_HEIGHT/2 - _skipArrow.height/2 + 2;
				_skipArrowHover.visible = false;
				addChild(_skipArrowHover);
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
			_skipTextField.textColor = 0xE1E1E1;
			_skipTextField.alpha = 1.0;
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
			_skipTextField.textColor =  0x979797;
		}
		public function resize(width:Number, height:Number):void
		{
		}
		
		public function reset(offSet:String,tag:String = null):void {
			_skipOffset = offSet;
			_adTag = tag;
			updateSkipText(0, 0);
			_skipTime = false;
			removeEventListener(MouseEvent.CLICK, skipAd);
			removeEventListener(MouseEvent.ROLL_OVER, mouseoverSkipAd);
			removeEventListener(MouseEvent.MOUSE_OUT, mouseoutSkipAd);
			if (_skipArrow) _skipArrow.visible = false;
			if (_skipArrowHover) _skipArrowHover.visible = false;
			graphics.clear();
		}
		
		private function skipAd(evt:Event):void {
			var adEvent:JWAdEvent = new JWAdEvent(JWAdEvent.JWPLAYER_AD_SKIPPED);
			adEvent.tag = _adTag;
			dispatchEvent(adEvent);

		}
		
	}
}