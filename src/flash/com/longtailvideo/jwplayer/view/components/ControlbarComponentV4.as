package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.ComponentEvent;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
	import com.longtailvideo.jwplayer.events.ViewEvent;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.plugins.PluginConfig;
	import com.longtailvideo.jwplayer.utils.Animations;
	import com.longtailvideo.jwplayer.utils.DisplayObjectUtils;
	import com.longtailvideo.jwplayer.utils.Draw;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.RootReference;
	import com.longtailvideo.jwplayer.utils.Stacker;
	import com.longtailvideo.jwplayer.utils.Strings;
	import com.longtailvideo.jwplayer.view.PlayerLayoutManager;
	import com.longtailvideo.jwplayer.view.interfaces.IControlbarComponent;
	
	import flash.accessibility.AccessibilityProperties;
	import flash.display.DisplayObject;
	import flash.display.MovieClip;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.KeyboardEvent;
	import flash.events.MouseEvent;
	import flash.geom.ColorTransform;
	import flash.geom.Rectangle;
	import flash.text.TextField;
	import flash.ui.Mouse;
	import flash.utils.clearTimeout;
	import flash.utils.getDefinitionByName;
	import flash.utils.getQualifiedClassName;
	import flash.utils.setTimeout;
	
	public class ControlbarComponentV4 extends CoreComponent implements IControlbarComponent {
		/** Reference to the original skin **/
		private var skin:*;
		/** A list with all controls. **/
		private var stacker:Stacker;
		/** Timeout for hiding the  **/
		private var hiding:Number;
		/** When scrubbing, icon shouldn't be set. **/
		private var scrubber:MovieClip;
		/** Color object for frontcolor. **/
		private var front:ColorTransform;
		/** Color object for lightcolor. **/
		private var light:ColorTransform;
		/** The actions for all controlbar buttons. **/
		private var BUTTONS:Object;
		/** The actions for all sliders **/
		private var SLIDERS:Object = {timeSlider: ViewEvent.JWPLAYER_VIEW_SEEK,
				volumeSlider: ViewEvent.JWPLAYER_VIEW_VOLUME};
		/** The button to clone for all custom buttons. **/
		private var clonee:MovieClip;
		/** Saving the block state of the controlbar. **/
		private var blocking:Boolean;
		/** Controlbar config **/
		private var controlbarConfig:PluginConfig;
		/** Animations handler **/
		private var animations:Animations;
		/** Last inserted button **/
		private var lastInsert:MovieClip;

		public function ControlbarComponentV4(player:IPlayer) {
			super(player, "controlbar");
			animations = new Animations(this);
			controlbarConfig = _player.config.pluginConfig("controlbar");
			if (controlbarConfig['position'] == "over" && hideOnIdle) {
				alpha = 0;
			}
			
			if (!controlbarConfig['margin']) controlbarConfig['margin'] = 0;	
			// TODO: Remove Link button
			BUTTONS = {playButton: ViewEvent.JWPLAYER_VIEW_PLAY,
					pauseButton: ViewEvent.JWPLAYER_VIEW_PAUSE,
					stopButton: ViewEvent.JWPLAYER_VIEW_STOP,
					prevButton: ViewEvent.JWPLAYER_VIEW_PREV,
					nextButton: ViewEvent.JWPLAYER_VIEW_NEXT,
					fullscreenButton: ViewEvent.JWPLAYER_VIEW_FULLSCREEN,
					normalscreenButton: ViewEvent.JWPLAYER_VIEW_FULLSCREEN,
					muteButton: ViewEvent.JWPLAYER_VIEW_MUTE,
					unmuteButton: ViewEvent.JWPLAYER_VIEW_MUTE};
			skin = _player.skin.getSWFSkin().getChildByName('controlbar') as Sprite;
			if (!skin) {
				var clip:DisplayObject = Draw.clone(_player.skin.getSWFSkin()['controlbar'], false);
				if (clip is Sprite) {
					skin = clip as Sprite;
				}
				stacker = new Stacker(skin);
			} else {
				stacker = new Stacker(skin as MovieClip);
			}
			skin.x = 0;
			skin.y = 0;
			skin.tabChildren = this.tabChildren = true;
			skin.tabEnabled = this.tabEnabled = false;
			addChild(skin);
			_player.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, timeHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_MUTE, muteHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_VOLUME, volumeHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER, timeHandler);
			_player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_LOADED, itemHandler);
			_player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_UPDATED, itemHandler);
			_player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, itemHandler);
			RootReference.stage.addEventListener(Event.MOUSE_LEAVE, mouseLeftStage);
			RootReference.stage.addEventListener(MouseEvent.MOUSE_MOVE, moveHandler);
			RootReference.stage.addEventListener(KeyboardEvent.KEY_DOWN, moveHandler);
			try {
				getSkinComponent("linkButton").visible = false;
			} catch (e:Error) {}
			
			setButtons();
			setColors();
			itemHandler();
			muteHandler();
			stateHandler();
			timeHandler();
			volumeHandler();
		}


		/**
		 * Add a new button to the control
		 *
		 * @param icn	A graphic to show as icon
		 * @param nam	Name of the button
		   getSkinComponent('* @param hdl	The function to call when clicking the Button').
		 **/
		public function addButton(icon:DisplayObject, name:String, handler:Function=null):MovieClip {
			var btn:MovieClip;
			if (getSkinComponent('linkButton') && getSkinElementChild('linkButton', 'back')) {
				btn = Draw.clone(getSkinComponent('linkButton') as MovieClip) as MovieClip;
				btn.name = name + 'Button';
				btn.visible = true;
				btn.tabEnabled = true;
				var acs:AccessibilityProperties = new AccessibilityProperties();
				acs.name = name;
				btn.accessibilityProperties = acs;
				skin.addChild(btn);
				var off:Number = Math.round((btn.height - icon.height) / 2);
				Draw.clear(btn['icon']);
				btn['icon'].addChild(icon);
				icon.x = icon.y = 0;
				btn['icon'].x = btn['icon'].y = off;
				btn['back'].width = icon.width + 2 * off;
				btn.buttonMode = true;
				btn.mouseChildren = false;
				btn.addEventListener(MouseEvent.CLICK, handler);
				if (front) {
					btn['icon'].transform.colorTransform = front;
					btn.addEventListener(MouseEvent.MOUSE_OVER, overHandler);
					btn.addEventListener(MouseEvent.MOUSE_OUT, outHandler);
				}
				if (lastInsert) {
					stacker.insert(btn, lastInsert);
				} else {
					stacker.insert(btn, getSkinComponent('linkButton') as MovieClip);
				}
				lastInsert = btn;
			}
			return btn;
		}


		public function removeButton(name:String):void {
			var button:DisplayObject = getSkinComponent(name);
			if (button) {
				button.visible = false;
				stacker.rearrange();
				skin.removeChild(getSkinComponent(name));
			}
		}

		override public function resize(width:Number, height:Number):void {
			if (!(PlayerLayoutManager.testPosition(controlbarConfig['position']) || controlbarConfig['position'] == "over")) {
				skin.visible = false;
				return;
			}

			var wid:Number = width;
			var margin:Number = controlbarConfig['margin'];

			if (controlbarConfig['position'] == 'over' || _player.config.fullscreen == true) {
				x = margin + player.config.pluginConfig('display')['x'];
				y = height - skin.height - margin + player.config.pluginConfig('display')['y'];
				wid = width - 2 * margin;
			}

			try {
				getSkinComponent('fullscreenButton').visible = false;
				getSkinComponent('normalscreenButton').visible = false;
				if (RootReference.stage['displayState'] && _player.config.height > 40) {
					if (_player.config.fullscreen) {
						getSkinComponent('fullscreenButton').visible = false;
						getSkinComponent('normalscreenButton').visible = true;
					} else {
						getSkinComponent('fullscreenButton').visible = true;
						getSkinComponent('normalscreenButton').visible = false;
					}
				}
			} catch (err:Error) {
			}
			stacker.rearrange(wid);
			//stopFader();
			stateHandler();
			fixTime();
			if (!_player.config.fullscreen) {
				Mouse.show();
			}
			if (_fullscreen != _player.config.fullscreen) {
				_fullscreen = _player.config.fullscreen;
				_sentShow = false;
			}
			if (visible && alpha > 0) {
				sendShow();
			}
		}


		public function getButton(buttonName:String):DisplayObject {
			return null;
		}


		/** Hide the controlbar **/
		public function block(stt:Boolean):void {
			blocking = stt;
			timeHandler();
		}
		
		/** Handle clicks from all buttons. **/
		private function clickHandler(evt:MouseEvent):void {
			var act:String = BUTTONS[evt.target.name];
			var data:Object = null;
			if (blocking != true || act == ViewEvent.JWPLAYER_VIEW_FULLSCREEN || act == ViewEvent.JWPLAYER_VIEW_MUTE) {
				switch (act) {
					case ViewEvent.JWPLAYER_VIEW_FULLSCREEN:
						data = Boolean(!_player.config.fullscreen);
						break;
					case ViewEvent.JWPLAYER_VIEW_PAUSE:
						data = Boolean(_player.state == PlayerState.IDLE || _player.state == PlayerState.PAUSED);
						break;
					case ViewEvent.JWPLAYER_VIEW_MUTE:
						data = Boolean(!_player.config.mute);
						break;
				}
				var event:ViewEvent = new ViewEvent(act, data);
				dispatchEvent(event);
			}
		}


		/** Handle mouse presses on sliders. **/
		private function downHandler(evt:MouseEvent):void {
			if (!_player.locked) {
				scrubber = MovieClip(evt.target);
				if (blocking != true || scrubber.name == 'volumeSlider') {
					var rct:Rectangle = new Rectangle(scrubber.rail.x, scrubber.icon.y, scrubber.rail.width - scrubber.icon.width, 0);
					scrubber.icon.startDrag(true, rct);
					stage.addEventListener(MouseEvent.MOUSE_UP, upHandler);
				} else {
					scrubber = null;
				}
			}
		}


		/** Handle a change in the current item **/
		private function itemHandler(evt:PlaylistEvent=null):void {
			try {
				if (getConfigParam('forcenextprev') || (_player.playlist && _player.playlist.length > 1 && _player.config.playlist.toLowerCase() == "none")) {
					getSkinComponent('prevButton').visible = getSkinComponent('nextButton').visible = true;
				} else {
					getSkinComponent('prevButton').visible = getSkinComponent('nextButton').visible = false;
				}
			} catch (err:Error) {
			}
			timeHandler();
			stacker.rearrange();
			fixTime();
		}

		/** Show a mute icon if playing. **/
		private function muteHandler(evt:MediaEvent=null):void {
			if (_player.config.mute == true) {
				try {
					getSkinComponent('muteButton').visible = false;
					getSkinComponent('unmuteButton').visible = true;
				} catch (err:Error) {
				}
				try {
					getSkinElementChild('volumeSlider', 'mark').visible = false;
					getSkinElementChild('volumeSlider', 'icon').x = getSkinElementChild('volumeSlider', 'rail').x;
				} catch (err:Error) {
				}
			} else {
				try {
					getSkinComponent('muteButton').visible = true;
					getSkinComponent('unmuteButton').visible = false;
				} catch (err:Error) {
				}
				try {
					getSkinElementChild('volumeSlider', 'mark').visible = true;
					volumeHandler();
				} catch (err:Error) {
				}
			}
		}


		/** Handle mouseouts from all buttons **/
		private function outHandler(evt:MouseEvent):void {
			if (front && evt.target['icon']) {
				evt.target['icon'].transform.colorTransform = front;
			} else {
				evt.target.gotoAndPlay('out');
			}
		}


		/** Handle clicks from all buttons **/
		private function overHandler(evt:MouseEvent):void {
			if (front && evt.target['icon']) {
				evt.target['icon'].transform.colorTransform = light;
			} else {
				evt.target.gotoAndPlay('over');
			}
		}


		/** Clickhandler for all buttons. **/
		private function setButtons():void {
			var dispObj:DisplayObject;
			for (var btn:String in BUTTONS) {
				dispObj = getSkinComponent(btn) 
				if (dispObj) {
					dispObj.addEventListener(MouseEvent.CLICK, clickHandler);
					dispObj.addEventListener(MouseEvent.MOUSE_OVER, overHandler);
					dispObj.addEventListener(MouseEvent.MOUSE_OUT, outHandler);
					if (dispObj is MovieClip) {
						(dispObj as MovieClip).mouseChildren = false;
						(dispObj as MovieClip).buttonMode = true;
					}
				}
			}
			for (var sld:String in SLIDERS) {
				dispObj =getSkinComponent(sld) 
				if (dispObj) {
					getSkinComponent(sld).addEventListener(MouseEvent.MOUSE_DOWN, downHandler);
					getSkinComponent(sld).addEventListener(MouseEvent.MOUSE_OVER, overHandler);
					getSkinComponent(sld).addEventListener(MouseEvent.MOUSE_OUT, outHandler);
					if (dispObj is MovieClip) {
						(dispObj as MovieClip).mouseChildren = false;
						(dispObj as MovieClip).tabEnabled = false;
						(dispObj as MovieClip).buttonMode = true;
					}
				}
			}
		}
		
		/** Init the colors. **/
		private function setColors():void {
			if (_player.config.backcolor && getSkinElementChild('playButton', 'icon')) {
				var clr:ColorTransform = new ColorTransform();
				clr.color = _player.config.backcolor.color;
				getSkinComponent('back').transform.colorTransform = clr;
			}
			if (_player.config.frontcolor) {
				try {
					front = new ColorTransform();
					front.color = _player.config.frontcolor.color;
					for (var btn:String in BUTTONS) {
						if (getSkinComponent(btn)) {
							getSkinElementChild(btn, 'icon').transform.colorTransform = front;
						}
					}
					for (var sld:String in SLIDERS) {
						if (getSkinComponent(sld)) {
							getSkinElementChild(sld, 'icon').transform.colorTransform = front;
							getSkinElementChild(sld, 'mark').transform.colorTransform = front;
							getSkinElementChild(sld, 'rail').transform.colorTransform = front;
						}
					}
					(getSkinComponent('elapsedText') as TextField).textColor = front.color;
					(getSkinComponent('totalText') as TextField).textColor = front.color;
				} catch (err:Error) {
				}
			}
			if (_player.config.lightcolor) {
				light = new ColorTransform();
				light.color = _player.config.lightcolor.color;
			} else {
				light = front;
			}
			if (light) {
				try {
					getSkinElementChild('timeSlider', 'done').transform.colorTransform = light;
					getSkinElementChild('volumeSlider', 'mark').transform.colorTransform = light;
				} catch (err:Error) {
				}
			}
		}

		
		private function get fadeOnTimeout():Boolean {
			return controlbarConfig['position'] == 'over' || (_player.config.fullscreen && controlbarConfig['position'] != 'none');
		}
		
		private function get hideOnIdle():Boolean {
			return String(controlbarConfig['idlehide']) == "true";
		}
		
		private function startFader():void {
			if (fadeOnTimeout && !hidden) {
				if (!isNaN(hiding)) {
					clearTimeout(hiding);
				}
				hiding = setTimeout(moveTimeout, 2000);
			}
		}
		
		private function stopFader():void {
			if (hidden) return;
			
			if (alpha == 0) {
				sendShow();
				animations.fade(1, 0.5);
			}
			if (!isNaN(hiding)) {
				clearTimeout(hiding);
				Mouse.show();
			}
		}
		
		/** Show above controlbar on mousemove and restart the countdown. **/
		private function moveHandler(evt:Event=null):void {
			stopFader();
			if (_player.state == PlayerState.BUFFERING || _player.state == PlayerState.PLAYING || hideOnIdle) {
				startFader();
			}
		}
		
		/** Hide above controlbar again when move has timed out. **/
		private function moveTimeout(evt:Event=null):void {
			if (!hidden) {
				if (alpha > 0) {
					sendHide();
					animations.fade(0, 0.5);
				}
				if (_player.config.fullscreen) {
					Mouse.hide();
				}
			}
		}
		
		/** If the mouse leaves the stage, hide the controlbar if position is 'over' **/
		private function mouseLeftStage(evt:Event=null):void {
			if (fadeOnTimeout && !hidden) {
				if (_player.state == PlayerState.BUFFERING || _player.state == PlayerState.PLAYING || hideOnIdle) {
					sendHide();
					animations.fade(0);
				}
			}
		}
		

		private function stateHandler(evt:PlayerEvent=null):void {
			switch(_player.state) {
				case PlayerState.BUFFERING:
				case PlayerState.PLAYING:
					if (getSkinComponent('playButton')) {
						getSkinComponent('playButton').visible = false;
						getSkinComponent('pauseButton').visible = true;
						startFader();
					}
					break;
				case PlayerState.IDLE:
					timeHandler();
				case PlayerState.PAUSED:
					if (getSkinComponent('playButton')) {
						getSkinComponent('playButton').visible = true;
						getSkinComponent('pauseButton').visible = false;
					}
					if (hideOnIdle) {
						mouseLeftStage();
					} else {
						stopFader();
					}
					break;
			}
		}

		/** Process time updates given by the model. **/
		private function timeHandler(evt:MediaEvent=null):void {
			var dur:Number = 0;
			var pos:Number = 0;
			if (evt) {
				if (evt.duration >= 0) {
					dur = evt.duration;
				}
				if (evt.position >= 0) {
					pos = evt.position;
				}
			} else if (_player.playlist.length > 0 && _player.playlist.currentItem) {
				if (_player.playlist.currentItem.duration >= 0) {
					dur = _player.playlist.currentItem.duration;
				}
			}
			var pct:Number = pos / dur;
			if (isNaN(pct)) {
				pct = 1;
			}
			try {
				(getSkinComponent('elapsedText') as TextField).text = Strings.digits(pos);
				(getSkinComponent('totalText') as TextField).text = Strings.digits(dur);
			} catch (err:Error) {
				Logger.log(err);
			}
			try {
				var xps:Number = Math.round(pct * (getSkinElementChild('timeSlider', 'rail').width - getSkinElementChild('timeSlider', 'icon').width));
				bufferHandler(evt);
				if (dur > 0) {
					getSkinElementChild('timeSlider', 'icon').visible = _player.state != PlayerState.IDLE;
					getSkinElementChild('timeSlider', 'mark').visible = _player.state != PlayerState.IDLE;
					if (!scrubber || scrubber.name != 'timeSlider') {
						getSkinElementChild('timeSlider', 'icon').x = xps;
						getSkinElementChild('timeSlider', 'done').width = xps;
					}
					getSkinElementChild('timeSlider', 'done').visible = _player.state != PlayerState.IDLE;
				} else {
					if (_player.state != PlayerState.PLAYING) {
						getSkinElementChild('timeSlider', 'icon').visible = false;
						getSkinElementChild('timeSlider', 'mark').visible = false;
						getSkinElementChild('timeSlider', 'done').visible = false;
					}
				}
			} catch (err:Error) {
			}
		}


		private function bufferHandler(evt:MediaEvent):void {
			if (!evt || evt.bufferPercent < 0)
				return;

			var mark:DisplayObject = getSkinElementChild('timeSlider', 'mark');
			var railWidth:Number = getSkinElementChild('timeSlider', 'rail').width;
			var markWidth:Number = _player.state == PlayerState.IDLE ? 0 : Math.round(evt.bufferPercent / 100 * railWidth);
			var offset:Number = evt.offset / evt.duration;

			try {
				mark.x = evt.duration > 0 ? Math.round(railWidth * offset) : 0;
				mark.width = markWidth;
				mark.visible = _player.state != PlayerState.IDLE;
			} catch (e:Error) {
				Logger.log(e);
			}
		}


		/** Fix the timeline display. **/
		private function fixTime():void {
			try {
				var scp:Number = getSkinComponent('timeSlider').scaleX;
				getSkinComponent('timeSlider').scaleX = 1;
				getSkinElementChild('timeSlider', 'icon').x = scp * getSkinElementChild('timeSlider', 'icon').x;
				getSkinElementChild('timeSlider', 'mark').x = scp * getSkinElementChild('timeSlider', 'mark').x;
				getSkinElementChild('timeSlider', 'mark').width = scp * getSkinElementChild('timeSlider', 'mark').width;
				getSkinElementChild('timeSlider', 'rail').width = scp * getSkinElementChild('timeSlider', 'rail').width;
				getSkinElementChild('timeSlider', 'done').x = scp * getSkinElementChild('timeSlider', 'done').x;
				getSkinElementChild('timeSlider', 'done').width = scp * getSkinElementChild('timeSlider', 'done').width;
			} catch (err:Error) {
			}
		}


		/** Handle mouse releases on sliders. **/
		private function upHandler(evt:MouseEvent):void {
			var mpl:Number = 0;
			var sliderType:String = scrubber.name;

			RootReference.stage.removeEventListener(MouseEvent.MOUSE_UP, upHandler);
			scrubber.icon.stopDrag();
			if (sliderType == 'timeSlider' && _player.playlist && _player.playlist.currentItem) {
				mpl = _player.playlist.currentItem.duration;
			} else if (sliderType == 'volumeSlider') {
				mpl = 100;
			}
			var pct:Number = (scrubber.icon.x - scrubber.rail.x) / (scrubber.rail.width - scrubber.icon.width) * mpl;
			pct = pct < 10 ? 0 : pct;
			
			scrubber = null;
			if (sliderType == 'volumeSlider') {
				var volumeEvent:MediaEvent = new MediaEvent(MediaEvent.JWPLAYER_MEDIA_VOLUME);
				volumeEvent.volume = Math.round(pct);
				volumeHandler(volumeEvent);
			}
			dispatchEvent(new ViewEvent(SLIDERS[sliderType], Math.round(pct)));
		}


		/** Reflect the new volume in the controlbar **/
		private function volumeHandler(evt:MediaEvent=null):void {
			try {
				var vsl:MovieClip = getSkinComponent('volumeSlider') as MovieClip;
				vsl.mark.width = _player.config.volume * (vsl.rail.width - vsl.icon.width / 2) / 100;
				vsl.icon.x = vsl.mark.x + _player.config.volume * (vsl.rail.width - vsl.icon.width) / 100;
			} catch (err:Error) {
			}
		}


		private function getSkinComponent(element:String):DisplayObject {
			var component:DisplayObject = skin.getChildByName(element) as DisplayObject;
			if (component) {
				return component;
			} else if (skin[element]) {
				return Draw.clone(skin[element], false);
			}
			return null;
		}


		private function getSkinElementChild(element:String, child:String):DisplayObject {
			var clip:DisplayObject = (skin.getChildByName(element) as MovieClip).getChildByName(child);
			if (clip) {
				return clip;
			} else if (skin[element] is DisplayObject) {
				clip = Draw.clone(skin[element], false);
				return clip;
			} else {
				return null;
			}
		}
		
		override public function show():void {
			if (getConfigParam('position') != "none" && _hiding) {
				_hiding = false;
				this.visible = true;
				sendShow();
			}
		}
		
		override public function hide():void {
			if (getConfigParam('position') != "none" && !_hiding) {
				_hiding = true;
				this.visible = false;
				sendHide();
			}
		}

		protected override function get displayRect():Rectangle {
			if (this.parent && getConfigParam('position') == "over" || _fullscreen) {
				return getBounds(this.parent);
			} else {
				return new Rectangle(0, 0, 0, 0);
			}
		}

	}
}