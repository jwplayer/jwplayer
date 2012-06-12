package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.*;
	import com.longtailvideo.jwplayer.player.*;
	import com.longtailvideo.jwplayer.utils.*;
	import com.longtailvideo.jwplayer.view.interfaces.*;
	
	import flash.accessibility.*;
	import flash.display.*;
	import flash.events.*;
	import flash.external.ExternalInterface;
	import flash.geom.*;
	import flash.utils.*;
	
	/**
	 * Sent when the dock begins to become visible
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ComponentEvent.JWPLAYER_COMPONENT_SHOW
	 */
	[Event(name="jwPlayerComponentShow", type="com.longtailvideo.jwplayer.events.ComponentEvent")]
	/**
	 * Sent when the dock begins to hide
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ComponentEvent.JWPLAYER_COMPONENT_HIDE
	 */
	[Event(name="jwPlayerComponentHide", type="com.longtailvideo.jwplayer.events.ComponentEvent")]
	
	public class DockComponent extends CoreComponent implements IDockComponent {


		/** Default configuration vars for this component. **/
		public var defaults:Object = { 
			iconalpha: 0.8,
			iconalphaactive: 0.5,
			iconalphaover: 1,
			margin: 8
		};
		/** Object with all the buttons in the dock. **/
		private var buttons:Vector.<DockButton>;
		/** Object with all the buttons in the dock. **/
		private var dividers:Vector.<DisplayObject>;
		/** Timeout for hiding the buttons when the video plays. **/
		private var timeout:Number;
		/** Reference to the animations handler **/
		private var animations:Animations;
		/** Tab index for accessibility options **/
		private var currentTab:Number = 400;
		/** Keep track of dock icon dimensions **/
		private var dimensions:Rectangle;
		/** If the player is showing the replay icon **/
		private var replayState:Boolean = false;
		/** Endcaps **/
		private var capLeft:DisplayObject;
		private var capRight:DisplayObject;
		


		public function DockComponent(player:IPlayer) {
			super(player, "dock");
			animations = new Animations(this);
			animations.addEventListener(Event.COMPLETE, fadeComplete);
			buttons = new Vector.<DockButton>;
			dividers = new Vector.<DisplayObject>;
			if (player.config.dock) {
				player.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
				player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_COMPLETE, playlistComplete);
				RootReference.stage.addEventListener(Event.MOUSE_LEAVE, mouseLeftStage);
				RootReference.stage.addEventListener(MouseEvent.MOUSE_MOVE, moveHandler);
				RootReference.stage.addEventListener(KeyboardEvent.KEY_DOWN, moveHandler);
				alpha = 0;
			}
			buildCaps();
			resize(0, 0);
			visible = false;
		}
		
		private function buildCaps():void {
			capLeft = getSkinElement('capLeft');
			capRight = getSkinElement('capRight');
			
			if (capLeft) addChild(capLeft);
			if (capRight) addChild(capRight);
				
		}
		
		private function namedButton(name:String):DockButton {
			if (name && buttons) {
				var found:Vector.<DockButton> = buttons.filter(
					function(itm:DockButton, index:int, vector:Vector.<DockButton>):Boolean { 
						return itm.name == name 
					});
				if (found.length > 0) return found[0];
			}
			return null;
		}
		 
		
		public function addButton(icon:*, label:String, clickHandler:*, name:String = null):MovieClip {
			if (namedButton(name)) {
				return namedButton(name);
			}
			var button:DockButton = new DockButton();
			if (name) {
				button.name = name;
			}
			var acs:AccessibilityProperties = new AccessibilityProperties();
			acs.name = (name ? name : icon.name);
			button.accessibilityProperties = acs;
			button.tabEnabled = true;
			button.tabChildren = false;
			button.tabIndex = currentTab++;
			button.setOutIcon(icon);
			button.outBackground = getSkinElement('button');
			button.overBackground = getSkinElement('buttonOver');
			button.clickFunction = clickHandler; 
			button.init();
			button.label = label;
			addChild(button);
			buttons.push(button);
			resize(getConfigParam('width'), getConfigParam('height'));
			return button;
		}
		
		
		public function removeButton(name:String):void {
            for(var i:Number=0; i < buttons.length; i++) { 
                if(buttons[i].name == name) {
                    buttons.splice(i,1);
                    removeChild(getChildAt(i));
                    break;
                }
            }
		}
		
		
		override public function resize(width:Number, height:Number):void {
			var topleft:Rectangle;
			var bottomright:Rectangle;
			
			while(dividers.length) {
				removeChild(dividers.pop());
			}
			
			if (buttons.length > 0) {
				var margin:Number = defaults.margin;
				var xStart:Number = margin + (capLeft ? capLeft.width : 0);
				var direction:Number = 1;
				var dividerWidth:Number = getSkinElement('divider') ? getSkinElement('divider').width : 0;

				for (var i:Number = 0; i < buttons.length; i++) {
					var button:DisplayObject = buttons[i] as DisplayObject;

					button.y = margin;
					button.x = xStart + (button.width + dividerWidth) * i;

					if (i < buttons.length-1) {
						var div:DisplayObject = getSkinElement('divider');
						if (div) {
							div.y = margin;
							div.x = button.x + button.width;
							addChild(div);
							dividers.push(div);
						}
					}
					

					if (!topleft || (button.x <= topleft.x && button.y <= topleft.y))
						topleft = new Rectangle(button.x, button.y, button.width, button.height);
					if (!bottomright || (button.x >= bottomright.x && button.y >= bottomright.y))
						bottomright = new Rectangle(button.x, button.y, button.width, button.height);
					
				}
				if (capLeft) {
					capLeft.x = margin;
					capLeft.y = margin;
					capLeft.visible = true;
				}				
				if (capRight) {
					capRight.x = buttons[buttons.length-1].x + buttons[buttons.length-1].width;
					capRight.y = margin;
					capRight.visible = true;
				}				
			} else {
				if (capLeft) capLeft.visible = false;				
				if (capRight) capRight.visible = false;				
			}
			if (topleft && bottomright) {
				dimensions = new Rectangle(topleft.x, topleft.y, bottomright.x - topleft.x + bottomright.width, bottomright.y - topleft.y + bottomright.height);
			} else {
				dimensions = new Rectangle();
			}
			if (_fullscreen != _player.config.fullscreen) {
				_fullscreen = _player.config.fullscreen;
				_sentShow = false;
			}
			stateHandler();
		}
		
		/** Hide the dock if the controlbar is set to be hidden on idle **/
		private function get hideOnIdle():Boolean {
			return true;
			//return String(_player.config.pluginConfig("controlbar")['idlehide']) == "true";
		}
		
		/** Start the fade timer **/
		private function startFader():void {
			if (!isNaN(timeout)) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(moveTimeout, 2000);
		}
		
		/** If the mouse leaves the stage, hide the dock **/
		private function mouseLeftStage(evt:Event=null):void {
			moveTimeout();
		}
		
		/** Show the buttons on mousemove. **/
		private function moveHandler(evt:Event = null):void {
			clearTimeout(timeout);
			if (hidden) { return; }
			
			if (player.state != PlayerState.IDLE || replayState) {
				if (!visible) {
					alpha = 0;
					visible = true;
					sendShow();
					animations.fade(1);
				}
				if (!replayState) startFader();
			}
		}
		
		
		/** Hide the buttons again when move has timed out. **/
		private function moveTimeout():void {
			if (hidden) return;
			
			sendHide();
			animations.fade(0);
			
		}

		private function fadeComplete(evt:Event):void {
			if (alpha == 0) {
				visible = false;
			}
		}

		
		private function playlistComplete(evt:PlaylistEvent):void {
			replayState = true;
			stateHandler();
		}

		/** Process state changes **/
		private function stateHandler(evt:PlayerStateEvent = undefined):void {
			switch (player.state) {
				case PlayerState.IDLE:
					clearTimeout(timeout);
					if (!hidden) {
						if (replayState) {
							moveHandler();
						}
					}
					break;
				default:
					replayState = false;
					moveHandler();
					startFader();
					break;
			}
		}
		
		public override function show():void {
			if (player.config.dock && hidden) {
				_hiding = false;
				this.visible = true;
				sendShow();
			}
		}

		public override function hide():void {
			if (player.config.dock && !hidden) {
				_hiding = true;
				this.visible = false;
				sendHide();
			}
		}

		protected override function get displayRect():Rectangle {
			if (dimensions) {
				return dimensions;
			} else {
				return super.displayRect;
			}
		}
		
	}
}

