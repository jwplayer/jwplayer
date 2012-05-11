package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.ComponentEvent;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
	import com.longtailvideo.jwplayer.events.ViewEvent;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.utils.Draw;
	import com.longtailvideo.jwplayer.utils.Strings;
	import com.longtailvideo.jwplayer.view.interfaces.IDisplayComponent;
	import com.longtailvideo.jwplayer.view.skins.PNGSkin;
	
	import flash.display.Bitmap;
	import flash.display.DisplayObject;
	import flash.display.MovieClip;
	import flash.display.Sprite;
	import flash.events.MouseEvent;
	import flash.events.TimerEvent;
	import flash.geom.ColorTransform;
	import flash.geom.Rectangle;
	import flash.net.URLRequest;
	import flash.net.navigateToURL;
	import flash.text.GridFitType;
	import flash.text.TextField;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	import flash.utils.Timer;
	import flash.utils.clearInterval;
	import flash.utils.setInterval;

	/**
	 * Sent when the display icon begins to become visible
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ComponentEvent.JWPLAYER_COMPONENT_SHOW
	 */
	[Event(name="jwPlayerComponentShow", type="com.longtailvideo.jwplayer.events.ComponentEvent")]
	/**
	 * Sent when the display icon begins to hide
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ComponentEvent.JWPLAYER_COMPONENT_HIDE
	 */
	[Event(name="jwPlayerComponentHide", type="com.longtailvideo.jwplayer.events.ComponentEvent")]
	
	public class DisplayComponent extends CoreComponent implements IDisplayComponent {
		protected var _icon:DisplayObject;
		protected var _iconArea:Rectangle;
		protected var _background:MovieClip;
		protected var _overlay:Sprite;
		protected var _text:TextField;
		protected var _textBack:Sprite;
		protected var _icons:Object;
		protected var _rotateInterval:Number;
		protected var _bufferIcon:Sprite;
		protected var _rotate:Boolean = true;
		protected var _youtubeMask:MovieClip;
		
		protected var _bufferRotationTime:Number = 100;
		protected var _bufferRotationAngle:Number = 15;
		
		protected var _bufferStateTimer:Timer;
		protected var _playStateTimer:Timer;
		protected var _previousState:String;
		
		protected var _forced:String = "";
		
		public function DisplayComponent(player:IPlayer) {
			super(player, "display");
			addListeners();
			setupDisplayObjects();
			setupIcons();
			if (!isNaN(getConfigParam('bufferrotation'))) _bufferRotationAngle = Number(getConfigParam('bufferrotation'));
			if (!isNaN(getConfigParam('bufferinterval'))) _bufferRotationTime = Number(getConfigParam('bufferinterval'));
			
			_bufferStateTimer = new Timer(50, 1);
			_bufferStateTimer.addEventListener(TimerEvent.TIMER_COMPLETE, showBufferIcon);
			
			_playStateTimer = new Timer(50, 1);
			_playStateTimer.addEventListener(TimerEvent.TIMER_COMPLETE, showPlayIcon);
		}
		
		
		private function itemHandler(evt:PlaylistEvent):void {
			_playStateTimer.delay = (_icon ? 10 : 50);
			_playStateTimer.start();
			if (background) {
				if (_player.playlist.currentItem && _player.playlist.currentItem.provider == "youtube") {
					background.mask = _youtubeMask;
				} else {
					background.mask = null;
				}
			}
		}
		

		private function addListeners():void {
			player.addEventListener(MediaEvent.JWPLAYER_MEDIA_MUTE, stateHandler);
			player.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
			player.addEventListener(PlayerEvent.JWPLAYER_ERROR, errorHandler);
			player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, itemHandler);
			addEventListener(MouseEvent.CLICK, clickHandler);
			this.buttonMode = true;
		}
		
		
		private function setupDisplayObjects():void {
			_background = new MovieClip();
			background.name = "background";
			addChildAt(background, 0);
			background.graphics.beginFill(0, 0);
			background.graphics.drawRect(0, 0, 1, 1);
			background.graphics.endFill();
			
			_overlay = new Sprite();
			_overlay.name = "overlay";
			addChildAt(_overlay, 1);
			
			_textBack = new Sprite();
			_textBack.name = "textBackground";
			_textBack.graphics.beginFill(0, 0.8);
			_textBack.graphics.drawRect(0, 0, 1, 1);
			_textBack.visible = false;
			_overlay.addChild(_textBack);

			_text = new TextField();
			text.gridFitType = GridFitType.NONE;
			text.defaultTextFormat = new TextFormat("_sans", null, 0xFFFFFF);
			_overlay.addChild(text);
			
			_youtubeMask = new MovieClip();
		}
		
		
		protected function setupIcons():void {
			_icons = {};
			setupIcon('buffer');
			setupIcon('play');
			setupIcon('mute');
		}
		
		
		/**
		 * Takes in an icon from a PNG skin and rearranges its children so that it's centered around 0, 0 
		 */
		protected function centerIcon(icon:Sprite):void {
			if (icon) {
				for (var i:Number=0; i < icon.numChildren; i++) {
					icon.getChildAt(i).x = -Math.round(icon.getChildAt(i).width)/2;
					icon.getChildAt(i).y = -Math.round(icon.getChildAt(i).height)/2;
				}
			}
		}
		
		protected function setupIcon(name:String):void {
			var iconElement:Sprite = getSkinElement(name + 'Icon') as Sprite;
			var iconOver:Sprite = getSkinElement(name + 'IconOver') as Sprite;

			if (!iconElement) { return; }
			
			if (_player.skin is PNGSkin) {
				if (iconElement.getChildByName("bitmap")) {
					centerIcon(iconElement);
					iconElement.name = 'out';
				}
				if (iconOver && iconOver.getChildByName("bitmap")) {
					centerIcon(iconOver);
					iconOver.name = 'over';
				}
			}
			
			if (name == "buffer") {
				if (player.skin is PNGSkin) {
					if (iconElement is MovieClip && (iconElement as MovieClip).totalFrames > 1) {
						// Buffer is already animated; no need to rotate.
						_rotate = false;
					} else {
						try {
							_bufferIcon = iconElement;
							var bufferBitmap:Bitmap = _bufferIcon.getChildByName('bitmap') as Bitmap;
							if (bufferBitmap) {
								Draw.smooth(bufferBitmap);
							} else {
								centerIcon(iconElement);
							}
						} catch (e:Error) {
							_rotate = false;
						}
					}
				} else {
					_rotate = false;
				}
			}
			
			var back:Sprite = getSkinElement('background') as Sprite;
			if (back) {
				if (_player.skin is PNGSkin) centerIcon(back);
			} else {
				back = new Sprite();
			}

			if (iconOver && player.skin is PNGSkin && name != "buffer") {
				iconOver.visible = false;
				back.addChild(iconOver);
				back.addEventListener(MouseEvent.MOUSE_OVER, overHandler);
				back.addEventListener(MouseEvent.MOUSE_OUT, outHandler);
			}
			back.addChild(iconElement);
			if (player.skin is PNGSkin && !iconElement.getChildByName("bitmap")) {
				if (name != "buffer" || !_rotate) {
					centerIcon(back);
				}
			} else {
				back.x = back.y = iconElement.x = iconElement.y = 0;
			}
			_icons[name] = back;

		}
		
		protected function overHandler(evt:MouseEvent):void {
			var button:Sprite = _icon as Sprite;
			if (button) {
				setIconHover(button, true);
			}
		}

		protected function outHandler(evt:MouseEvent):void {
			var button:Sprite = _icon as Sprite;
			if (button) {
				setIconHover(button, false);
			}
		}
		
		protected function setIconHover(icon:Sprite, state:Boolean):void {
			var over:DisplayObject = icon.getChildByName('over'); 
			var out:DisplayObject = icon.getChildByName('out'); 
			
			if (over && out) {
				over.visible = state;
				out.visible = !state;
			}		
		}
		
		override public function resize(width:Number, height:Number):void {
			_background.width = width;
			_background.height = height;
			
			_youtubeMask.graphics.clear();
			_youtubeMask.graphics.beginFill(0x00AA00, 0.3);
			_youtubeMask.graphics.drawRect(0, 0, width, height - 100);
			_youtubeMask.graphics.endFill();

			positionIcon();
			positionText();
			stateHandler();
		}
		
		
		public function setIcon(displayIcon:DisplayObject):void {
			var sendShowEvent:Boolean = false;
			var sendHideEvent:Boolean = false;
			try {
				if (_icon && _icon.parent == _overlay) { 
					_overlay.removeChild(_icon);
					_icon = null;
					sendHideEvent = !_hiding;
				} else {
					sendShowEvent = !_hiding;
				}
			} catch (err:Error) {
			}
			if (_fullscreen != _player.config.fullscreen) {
				_fullscreen = _player.config.fullscreen;
				sendShowEvent = true;
			}
			if (displayIcon && _player.config.icons && (getConfigParam("icons") === true || typeof(getConfigParam("icons")) == "undefined")) {
				if (displayIcon is Sprite) {
					setIconHover(displayIcon as Sprite, false);
				}
				_icon = displayIcon;
				_overlay.addChild(_icon);
				positionIcon();
				_iconArea = _icon.getRect(_overlay);

				if (sendShowEvent) {
					sendShow();
				}
			} else {
				if (sendHideEvent) {
					sendHide();
				}
				_iconArea = null;
			}
		}
		
		
		private function positionIcon():void {
			if (_icon) {
				_icon.x = background.scaleX / 2;
				_icon.y = background.scaleY / 2;
			}
		}
		
		
		public function setText(displayText:String):void {
			if (_icon is Sprite && (_icon as Sprite).getChildByName('txt') is TextField) {
				((_icon as Sprite).getChildByName('txt') as TextField).text = displayText ? displayText : '';
				text.text = '';
			} else {
				text.text = displayText ? displayText : '';
			}
			positionText();
		}
		
		
		private function positionText():void {
			if (text.text) {
				text.visible = true;
				_textBack.visible = true;
				if (text.width > background.scaleX * .75) {
					text.width = background.scaleX * .75;
					text.wordWrap = true;
				} else {
					text.autoSize = TextFormatAlign.CENTER;
				}
				text.x = (background.scaleX - text.textWidth) / 2;
				if (_icon && contains(_icon)) {
					text.y = _icon.y + (_icon.height/2) + 10;
				} else {
					text.y = (background.scaleY - text.textHeight) / 2;
				}
				_textBack.y = text.y - 2;
				_textBack.width = getConfigParam('width');
				_textBack.height = text.height + 4;
			} else {
				text.visible = false;
				_textBack.visible = false;
			}
		}
		
		
		protected function setDisplay(displayIcon:DisplayObject, displayText:String = null):void {
			setIcon(displayIcon);
			setText(displayText != null ? displayText : text.text);
		}
		
		
		protected function clearDisplay():void {
			setDisplay(null, '');
		}
		
		protected function get currentState():String {
			return (_forced ? _forced : (_player ? _player.state : PlayerState.IDLE));
		}
		
		protected function stateHandler(event:PlayerEvent = null):void {
			if (_previousState != currentState || !(event is PlayerStateEvent)) {
				_previousState = currentState;
				//TODO: Handle mute button in error state
				clearRotation();
				_bufferStateTimer.reset();
				_playStateTimer.reset();
				_bufferStateTimer.delay = (_icon ? 10 : 200);
				_playStateTimer.delay = (_icon ? 10 : 10);
				switch (currentState) {
					case PlayerState.BUFFERING:
						_bufferStateTimer.start();
						break;
					case PlayerState.PAUSED:
					case PlayerState.IDLE:
						_playStateTimer.start();
						break;
					default:
						if ( player.config.mute && getConfigParam("showmute") ) {
							setDisplay(_icons['mute']);
						} else {
							clearDisplay();
						}
				}
			}
		}
		
		protected function showBufferIcon(evt:TimerEvent):void {
			setDisplay(_icons['buffer'], '');
			if (_rotate){
				startRotation();
			}
		}

		protected function showPlayIcon(evt:TimerEvent):void {
			setDisplay(_icons['play']);
		}

		protected function startRotation():void {
			if (!_rotateInterval && (_bufferRotationAngle % 360) != 0) {
				_rotateInterval = setInterval(updateRotation, _bufferRotationTime);
			}
		}
		
		
		protected function updateRotation():void {
			if (_bufferIcon) _bufferIcon.rotation += _bufferRotationAngle;
		}
		
		
		protected function clearRotation():void {
			if (_bufferIcon) _bufferIcon.rotation = 0;
			if (_rotateInterval) {
				clearInterval(_rotateInterval);
				_rotateInterval = undefined;
			}
		}
		
		
		protected function errorHandler(event:PlayerEvent):void {
			setDisplay(null, event.message);
		}
		
		
		protected function clickHandler(event:MouseEvent):void {
			dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_CLICK));
			if(_player.config.displayclick == 'link') {
				var link:String = _player.playlist.currentItem.link;
				if(link) {
					navigateToURL(new URLRequest(Strings.cleanLink(link)),_player.config.linktarget);
				}
			} else if (currentState == PlayerState.PLAYING || currentState == PlayerState.BUFFERING) {
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_PAUSE));
			} else {
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_PLAY));
			}
		}
		
		
		protected function get text():TextField {
			return _text;
		}
		
		
		protected function get background():MovieClip {
			return _background;
		}
		
		
		/** Hide the display icon **/
		public override function hide():void {
			if (_overlay) {
				_overlay.visible = false;
			}
			if (!_hiding) {
				if (_icon) {
					sendHide();
				}
				_hiding = true;
			}
		}
		
		/** Show the display icon **/
		public override function show():void {
			if (_overlay) {
				_overlay.visible = true;
			}
			if (_hiding) {
				if (_icon) {
					sendShow();
				}
				_hiding = false;
			}
		}
		
		public function forceState(forcedState:String):void {
			switch(forcedState) {
				case PlayerState.BUFFERING:
				case PlayerState.PAUSED:
				case PlayerState.IDLE:
				case PlayerState.PLAYING:
					_forced = forcedState;
					stateHandler();
					break;
				default:
					_forced = "";
			}
			
		}
		
		public function releaseState():void {
			_forced = "";
			stateHandler();
		}
		
		protected override function get displayRect():Rectangle {
			return _iconArea ? _iconArea : super.displayRect;
		}
		
	}
}