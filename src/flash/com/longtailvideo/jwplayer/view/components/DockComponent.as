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
	
	public class DockComponent extends CoreComponent implements IDockComponent {
		/** Default configuration vars for this component. **/
		private var settings:Object;
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
		/** Current dimensions **/
		private var _width:Number;
		private var _height:Number;
		
		public function DockComponent(player:IPlayer) {
			super(player, "dock");
			animations = new Animations(this);
			animations.addEventListener(Event.COMPLETE, fadeComplete);
			buttons = new Vector.<DockButton>;
			dividers = new Vector.<DisplayObject>;
			if (player.config.dock) {
				player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_COMPLETE, playlistComplete);
				alpha = 0;
			}
			settings = {
				iconalpha: !isNaN(getConfigParam("iconalpha")) ? getConfigParam("iconalpha") : 0.75,
				iconalphaactive: !isNaN(getConfigParam("iconalphaactive")) ? getConfigParam("iconalphaactive") : 0.5,
				iconalphaover: !isNaN(getConfigParam("iconalphaover")) ? getConfigParam("iconalphaover") : 1,
				margin: !isNaN(getConfigParam("margin")) ? getConfigParam("margin") : 8
			};
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
		 
		
		public function addButton(icon:*, label:String, clickHandler:*, name:String = null):IDockButton {
			if (namedButton(name)) {
				return namedButton(name);
			}
			var bounds:Rectangle = new Rectangle(localToGlobal(new Point(settings.margin, 0)).x, 0, _width - settings.margin, 0);
			var button:DockButton = new DockButton(_player.skin, bounds);
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
			button.setAlphas(Number(settings.iconalpha), Number(settings.iconalphaover), Number(settings.iconalphaactive));
			button.outBackground = getSkinElement('button');
			button.overBackground = getSkinElement('buttonOver') ? getSkinElement('buttonOver') : getSkinElement('button');
			button.activeBackground = getSkinElement('buttonActive') ? getSkinElement('buttonActive') : getSkinElement('button');
			button.clickFunction = clickHandler;
			button.label = label;
			button.init();
			addChild(button);
			buttons.push(button);
			resize(getConfigParam('width'), getConfigParam('height'));
			return button;
		}
		
		
		public function removeButton(name:String):void {
			var found:DockButton = namedButton(name) 
			if (found) {
				removeChild(found);
				buttons.splice(buttons.indexOf(found), 1);
			}
			resize(_width, _height);
			
		}
		
		override public function resize(width:Number, height:Number):void {
			_width = width;
			_height = height;
			var topleft:Rectangle;
			var bottomright:Rectangle;
			
			while(dividers.length) {
				removeChild(dividers.pop());
			}
			
			if (buttons.length > 0) {
				var margin:Number = settings.margin;
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
			}
		}
		
		/** Hide the dock if the controlbar is set to be hidden on idle **/
		private function get hideOnIdle():Boolean {
			return true;
		}
		
		private function fadeComplete(evt:Event):void {
			if (alpha == 0) {
				visible = false;
			}
		}

		
		private function playlistComplete(evt:PlaylistEvent):void {
			replayState = true;
		}

		public override function show():void {
			if (player.config.dock) {
				animations.fade(1, 0.5);
			}
		}

		public override function hide():void {
			if (player.config.dock) {
				for each (var button:DockButton in buttons) {
					button.hide();
				}
				animations.fade(0, 0.5);
			}
		}

		protected override function get displayRect():Rectangle {
			if (dimensions) {
				return dimensions;
			} else {
				return super.displayRect;
			}
		}
		
		public function get numButtons():Number {
			return buttons ? buttons.length : 0;
		}
		
	}
}

