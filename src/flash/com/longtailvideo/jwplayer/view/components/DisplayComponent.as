package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.*;
	import com.longtailvideo.jwplayer.model.*;
	import com.longtailvideo.jwplayer.player.*;
	import com.longtailvideo.jwplayer.utils.*;
	import com.longtailvideo.jwplayer.view.interfaces.*;
	
	import flash.display.*;
	import flash.events.*;
	import flash.external.ExternalInterface;
	import flash.geom.*;
	import flash.net.*;
	import flash.text.*;
	import flash.utils.*;

	public class DisplayComponent extends CoreComponent implements IDisplayComponent {
		protected var _icon:DisplayIcon;
		protected var _iconArea:Rectangle;
		protected var _background:MovieClip;
		protected var _overlay:Sprite;
		protected var _icons:Object;
		protected var _youtubeMask:MovieClip;
		
		protected var _bufferStateTimer:Timer;
		protected var _playStateTimer:Timer;
		protected var _previousState:String;
		protected var _textFormat:TextFormat;
		protected var _textOverFormat:TextFormat;

		protected var _errorState:Boolean = false;
		protected var _completedState:Boolean = false;
		
		/** Setting defaults **/
		protected var _bufferRotationTime:Number = 100;
		protected var _bufferRotationAngle:Number = 45;

		protected var _forced:String = "";
		
		public function DisplayComponent(player:IPlayer) {
			super(player, "display");
			addListeners();
			setupDisplayObjects();
			setupIcons();
			
			// Override defaults
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
		
		private function playlistComplete(evt:PlaylistEvent):void {
			_completedState = true;
			stateHandler();
		}
		

		private function addListeners():void {
			player.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
			player.addEventListener(PlayerEvent.JWPLAYER_ERROR, errorHandler);
			player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, itemHandler);
			player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_COMPLETE, playlistComplete);
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
			
			_textFormat = new TextFormat("_sans", fontSize ? fontSize : 15, fontColor ? fontColor.toString() : 0xCCCCCC, (fontWeight == "bold"));
			_textOverFormat = new TextFormat("_sans", fontSize ? fontSize : 15, fontOverColor ? fontOverColor.toString() : 0xFFFFFF, (fontWeight == "bold"));
			
			_youtubeMask = new MovieClip();
		}
		
		
		protected function setupIcons():void {
			_icons = {};
			setupIcon('buffer');
			setupIcon('play');
			setupIcon('error');
			setupIcon('replay');
			if (!_icons.replay) {
				_icons.replay = _icons.play;
			}
			if (!_icons.error) {
				_icons.error = setupIcon();
			}
		}
		
		
		protected function setupIcon(name:String=null):DisplayIcon {
			if (!name) {
				return new DisplayIcon({
					background: getSkinElement("background"), 
					backgroundOver: getSkinElement("backgroundOver"), 
					capLeft: getSkinElement("capLeft"), 
					capLeftOver: getSkinElement("capLeftOver"), 
					capRight: getSkinElement("capRight"),
					capRightOver: getSkinElement("capRightOver")
				}, _textFormat, _textOverFormat);
			} else {
				if (!getSkinElement(name+"Icon")) { return null; }
			
				var newIcon:DisplayIcon = new DisplayIcon({
					icon: getSkinElement(name+"Icon"),
					iconOver: getSkinElement(name+"IconOver"),
					background: getSkinElement("background"),
					backgroundOver: getSkinElement("backgroundOver"),
					capLeft: getSkinElement("capLeft"),
					capLeftOver: getSkinElement("capLeftOver"),
					capRight: getSkinElement("capRight"),
					capRightOver: getSkinElement("capRightOver")
				}, _textFormat, _textOverFormat);
			}
			_icons[name] = newIcon;
			return newIcon;
		}
		
		override public function resize(width:Number, height:Number):void {
			_background.width = width;
			_background.height = height;
			
			_youtubeMask.graphics.clear();
			_youtubeMask.graphics.beginFill(0x00AA00, 0.3);
			_youtubeMask.graphics.drawRect(0, 0, width, height - 100);
			_youtubeMask.graphics.endFill();

			positionIcon();
			stateHandler();
		}
		
		
		protected function setIcon(displayIcon:DisplayIcon):void {
			if (_fullscreen != _player.config.fullscreen) {
				_fullscreen = _player.config.fullscreen;
			}
			
			if (displayIcon) {
				var oldIcon:DisplayObject = _icon;
				_icon = displayIcon;
				if (oldIcon && oldIcon.parent == _overlay) {
					_overlay.removeChild(oldIcon);
				} 
				
				_overlay.addChild(_icon);
				if (!oldIcon) {
					_icon.alpha = 0;
				}
				new Animations(_icon).fade(1);

				positionIcon();
				_iconArea = _icon.getRect(_overlay);
			} else {
				if (_icon && _icon.parent && _icon.parent == _overlay) {
					new Animations(_icon).fade(0);
				}
				_iconArea = null;
			}
		}
		
		
		private function positionIcon():void {
			if (_icon) {
				_icon.x = Math.round((background.width - _icon.width) / 2);
				_icon.y = Math.round((background.height - _icon.height) / 2);
			}
		}
		
		protected function setDisplay(displayIcon:DisplayIcon, displayText:String = null):void {
			if (displayIcon) displayIcon.text = displayText;
			setIcon(displayIcon);
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
				clearRotation();
				clearDisplay();
				_bufferStateTimer.reset();
				_playStateTimer.reset();
				_bufferStateTimer.delay = (_icon ? 10 : 200);
				_playStateTimer.delay = (_icon ? 10 : 10);
				switch (currentState) {
					case PlayerState.BUFFERING:
						_errorState = false;
						_completedState = false;
						_bufferStateTimer.start();
						break;
					case PlayerState.PAUSED:
					case PlayerState.IDLE:
						if (_completedState) {
							setDisplay(getIcon('replay'));
						} else {
							_playStateTimer.start();
						}
						break;
				}
			}
		}
		
		protected function showBufferIcon(evt:TimerEvent):void {
			var icon:DisplayIcon = getIcon('buffer');
			icon.setRotation(_bufferRotationAngle, _bufferRotationTime);
			setDisplay(icon, '');
			
		}

		protected function showPlayIcon(evt:TimerEvent):void {
			if (_errorState) return;
			
			var icon:DisplayIcon = getIcon('play');
			if (_player.state == PlayerState.IDLE) {
				setDisplay(icon, _player.playlist.currentItem ? _player.playlist.currentItem.title : "");
			} else {
				setDisplay(icon);
			}
		}

		protected function clearRotation():void {
			getIcon('buffer').setRotation(0);
		}
		
		
		protected function errorHandler(event:PlayerEvent):void {
			setDisplay(getIcon('error'), event.message.replace(":",":\n"));
			_errorState = true;
		}
		
		
		protected function clickHandler(event:MouseEvent):void {
			dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_CLICK));
			if (currentState == PlayerState.PLAYING || currentState == PlayerState.BUFFERING) {
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_PAUSE));
			} else {
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_PLAY));
			}
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
				_hiding = true;
			}
		}
		
		/** Show the display icon **/
		public override function show():void {
			if (_overlay) {
				_overlay.visible = true;
			}
			if (_hiding) {
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
		
		protected function getIcon(name:String):DisplayIcon {
			return _icons[name];
		}
		
	}
}