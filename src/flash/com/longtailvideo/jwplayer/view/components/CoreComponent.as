package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.ComponentEvent;
	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.model.Color;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.view.interfaces.IPlayerComponent;
	
	import flash.display.DisplayObject;
	import flash.display.MovieClip;
	import flash.events.Event;
	import flash.geom.Rectangle;

	public class CoreComponent extends MovieClip implements IGlobalEventDispatcher, IPlayerComponent {

		private var _dispatcher:IGlobalEventDispatcher;
		protected var _player:IPlayer;
		protected var _name:String;
		protected var _hiding:Boolean = false;
		protected var _fullscreen:Boolean = false;
		
		protected var _sentShow:Boolean = false;
		protected var _sentHide:Boolean = false;
		protected var _playerReady:Boolean = false;
		protected var _showOnReady:Boolean =  false;

		public function CoreComponent(player:IPlayer, name:String) {
			_dispatcher = new GlobalEventDispatcher();
			_player = player;
			_name = name;
			super();
			_player.addEventListener(PlayerEvent.JWPLAYER_READY, readyHandler);
		}
		
		protected function readyHandler(evt:PlayerEvent):void {
			_playerReady = true;
			if (_showOnReady) {
				sendShow();
			}
		}
		
		public function hide():void {
			if (!_hiding) {
				_hiding = true;
				this.visible = false;
				sendHide();
			}
		}
		
		public function show():void {
			if (_hiding) { 
				_hiding = false;
				this.visible = true;
				sendShow();
			}
		}
		
		protected function sendShow():void {
			if (!_sentShow) {
				if (_playerReady) {
					dispatchEvent(new ComponentEvent(ComponentEvent.JWPLAYER_COMPONENT_SHOW, this, displayRect));
					_sentShow = true;
					_sentHide = false;
				} else {
					_showOnReady = true;
				}
			}
		}
		
		protected function sendHide():void {
			if (!_sentHide) {
				dispatchEvent(new ComponentEvent(ComponentEvent.JWPLAYER_COMPONENT_HIDE, this, displayRect));
				_sentShow = false;
				_sentHide = true;
			}
		}		
		
		public function resize(width:Number, height:Number):void {
			_fullscreen = _player.config.fullscreen;
		}
		
		protected function get player():IPlayer {
			return _player;
		}

		protected function getSkinElement(element:String):DisplayObject {
			return player.skin.getSkinElement(_name,element);
		}
		
		protected function getConfigParam(param:String):* {
			return player.config.pluginConfig(_name)[param];
		}
		
		protected function setConfigParam(param:String, value:*):void {
			player.config.pluginConfig(_name)[param] = value;
		}
		
		///////////////////////////////////////////		
		// Font style related helper getters
		///////////////////////////////////////////		
		
		protected function get backgroundColor():Color {
			return getConfigParam("backgroundcolor") ? new Color(String(getConfigParam("backgroundcolor"))) : null;
		}

		protected function get fontColor():Color {
			return getConfigParam("fontcolor") ? new Color(String(getConfigParam("fontcolor"))) : null;
		}
		
		protected function get fontSize():Number {
			return getConfigParam("fontsize") ? Number(getConfigParam("fontsize")) : 0;
		}
		
		protected function get fontFace():String {
			return getConfigParam("font");
		}
		
		protected function get fontWeight():String { 
			return getConfigParam("fontweight") ? String(getConfigParam("fontweight")).toLowerCase() : "";
		}
		
		protected function get fontStyle():String {
			return getConfigParam("fontstyle") ? String(getConfigParam("fontstyle")).toLowerCase() : "";
		}
		
		/** Whether or not the component has been hidden. **/
		protected function get hidden():Boolean {
			return _hiding;
		}
		
		protected function get displayRect():Rectangle {
			if (this.parent) {
				return this.getBounds(this.parent);
			} else {
				return new Rectangle(0, 0, 0, 0);
			}
		}
		
		///////////////////////////////////////////		
		/// IGlobalEventDispatcher implementation
		///////////////////////////////////////////		
		/**
		 * @inheritDoc
		 */
		public function addGlobalListener(listener:Function):void {
			_dispatcher.addGlobalListener(listener);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function removeGlobalListener(listener:Function):void {
			_dispatcher.removeGlobalListener(listener);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public override function dispatchEvent(event:Event):Boolean {
			_dispatcher.dispatchEvent(event);
			return super.dispatchEvent(event);
		}
	}
}