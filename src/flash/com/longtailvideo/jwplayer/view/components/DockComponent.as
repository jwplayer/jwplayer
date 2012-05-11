package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.ComponentEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.utils.Animations;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.RootReference;
	import com.longtailvideo.jwplayer.view.interfaces.IDockComponent;
	import com.longtailvideo.jwplayer.view.skins.SWFSkin;
	
	import flash.accessibility.AccessibilityProperties;
	import flash.display.DisplayObject;
	import flash.display.MovieClip;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.KeyboardEvent;
	import flash.events.MouseEvent;
	import flash.geom.Rectangle;
	import flash.utils.clearTimeout;
	import flash.utils.setTimeout;
	
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


		/** Default configuration vars for this plugin. **/
		public var defaults:Object = { align: 'right' };
		/** Object with all the buttons in the dock. **/
		private var buttons:Array;
		/** Timeout for hiding the buttons when the video plays. **/
		private var timeout:Number;
		/** Reference to the animations handler **/
		private var animations:Animations;
		/** Tab index for accessibility options **/
		private var currentTab:Number = 400;
		/** Keep track of dock icon dimensions **/
		private var dimensions:Rectangle;


		public function DockComponent(player:IPlayer) {
			super(player, "dock");
			animations = new Animations(this);
			buttons = new Array();
			if (player.config.dock) {
				player.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
				RootReference.stage.addEventListener(Event.MOUSE_LEAVE, mouseLeftStage);
				RootReference.stage.addEventListener(MouseEvent.MOUSE_MOVE, moveHandler);
				RootReference.stage.addEventListener(KeyboardEvent.KEY_DOWN, moveHandler);
				if (hideOnIdle) {
					alpha = 0;
				}
			} else {
				visible = false;
			}
		}
		
		
		public function addButton(icon:DisplayObject, text:String, clickHandler:Function, name:String = null):MovieClip {
			var button:DockButton = new DockButton();
			if (name) {
				button.name = name;
			}
			if (_player.skin is SWFSkin) {
				button.colorize = true;
			}
			var acs:AccessibilityProperties = new AccessibilityProperties();
			acs.name = (name ? name : icon.name);
			button.accessibilityProperties = acs;
			button.tabEnabled = true;
			button.tabChildren = false;
			button.tabIndex = currentTab++;
			button.setOutIcon(icon);
			button.outBackground = getSkinElement("button") as Sprite;
			button.overBackground = getSkinElement("buttonOver") as Sprite;
			button.assetColor = fontColor ? fontColor : player.config.backcolor;
			button.outColor = player.config.frontcolor;
			button.overColor = player.config.lightcolor;
			button.clickFunction = clickHandler;
			button.init();
			button.text = text;
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
			if (buttons.length > 0) {
				var margin:Number = 10;
				var xStart:Number = width - buttons[0].width - margin;
				var usedHeight:Number = margin;
				var direction:Number = -1;
				if (getConfigParam('position') == 'left') {
					direction = 1;
					xStart = margin;
				}
				for (var i:Number = 0; i < buttons.length; i++) {
					var row:Number = Math.floor(usedHeight / height);
					var button:DisplayObject = buttons[i] as DisplayObject;
					if ((usedHeight + button.height + margin) > ((row + 1) * height)){
						usedHeight = ((row + 1) * height) + margin;
						row = Math.floor(usedHeight / height);
					}
					button.y = usedHeight % height;
					button.x = xStart + (button.width + margin) * row * direction;
					
					if (!topleft || (button.x <= topleft.x && button.y <= topleft.y))
						topleft = new Rectangle(button.x, button.y, button.width, button.height);
					if (!bottomright || (button.x >= bottomright.x && button.y >= bottomright.y))
						bottomright = new Rectangle(button.x, button.y, button.width, button.height);
					
					usedHeight += button.height + margin;
					if(button is DockButton) {
					    (button as DockButton).centerText();
					}
				}
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
			return String(_player.config.pluginConfig("controlbar")['idlehide']) == "true";
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
			
			if (player.state == PlayerState.BUFFERING || player.state == PlayerState.PLAYING || hideOnIdle) {
				startFader();
				if (alpha < 1) {
					sendShow();
					animations.fade(1);
				}
			}
		}
		
		
		/** Hide the buttons again when move has timed out. **/
		private function moveTimeout():void {
			if (hidden) return;
			
			if (player.state == PlayerState.BUFFERING || player.state == PlayerState.PLAYING || hideOnIdle) {
				sendHide();
				animations.fade(0);
			}
		}


        /** Button handler for JS API. **/
        public function setButton(name:String, click:String=null, out:String=null, over:String=null):void { 
            // check if the button already exists
            var index:Number = -1;
            for(var i:Number=0; i < buttons.length; i++) {
                if(buttons[i].name == name) {
                    index = i;
                    break;
                }
            }
            // new button
            if(index == -1) {
                if(!out) { return; }
                var back:DisplayObject = getSkinElement("button") as DisplayObject;
                currentTab++;
                var button:DockJSButton = new DockJSButton(name, back, currentTab);
                button.setClickFunction(click);
                button.loadOutIcon(out);
                if (over) { button.loadOverIcon(over); }
                addChild(button);
                buttons.push(button);
                resize(getConfigParam('width'), getConfigParam('height'));
            // update button
            } else if(click) {
                buttons[index].setClickFunction(click);
                if(out) { buttons[index].loadOutIcon(out); }
                if (over) { buttons[index].loadOverIcon(over); }
            // remove button
            } else {
                removeChild(getChildAt(index));
                buttons.splice(index,1);
            }
        };


		/** Process state changes **/
		private function stateHandler(evt:PlayerStateEvent = undefined):void {
			switch (player.state) {
				case PlayerState.PLAYING:
				case PlayerState.BUFFERING:
					startFader();
					break;
				default:
					clearTimeout(timeout);
					if (!hidden) {
						if (hideOnIdle) {
							moveTimeout();
						} else {
							sendShow();
							animations.fade(1);
						}
					}
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

