package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.*;
	import com.longtailvideo.jwplayer.model.*;
	import com.longtailvideo.jwplayer.player.*;
	import com.longtailvideo.jwplayer.plugins.*;
	import com.longtailvideo.jwplayer.utils.*;
	import com.longtailvideo.jwplayer.view.interfaces.*;
	
	import flash.accessibility.*;
	import flash.display.*;
	import flash.events.*;
	import flash.geom.*;
	import flash.text.*;
	import flash.utils.*;


	/**
	 * Sent when the user interface requests that the player play the currently loaded media
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_PLAY
	 */
	[Event(name="jwPlayerViewPlay", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user interface requests that the player pause the currently playing media
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_PAUSE
	 */
	[Event(name="jwPlayerViewPause", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user interface requests that the player stop the currently playing media
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_STOP
	 */
	[Event(name="jwPlayerViewStop", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user interface requests that the player play the next item in its playlist
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_NEXT
	 */
	[Event(name="jwPlayerViewNext", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user interface requests that the player play the previous item in its playlist
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_PREV
	 */
	[Event(name="jwPlayerViewPrev", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user interface requests that the player navigate to the playlist item's <code>link</code> property
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_LINK
	 */
	[Event(name="jwPlayerViewLink", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user clicks the "mute" or "unmute" controlbar button
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_MUTE
	 */
	[Event(name="jwPlayerViewMute", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user clicks the "mute" or "unmute" controlbar button
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_HD
	 */
	[Event(name="jwPlayerViewHD", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user clicks the "fullscreen" or "end fullscreen" button
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_FULLSCREEN
	 */
	[Event(name="jwPlayerViewFullscreen", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user clicks the volume slider
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_VOLUME
	 */
	[Event(name="jwPlayerViewVolume", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	/**
	 * Sent when the user clicks to seek to a point in the video
	 *
	 * @eventType com.longtailvideo.jwplayer.events.ViewEvent.JWPLAYER_VIEW_SEEK
	 */
	[Event(name="jwPlayerViewSeek", type="com.longtailvideo.jwplayer.events.ViewEvent")]
	
	public class ControlbarComponent extends CoreComponent implements IControlbarComponent {
		protected var _buttons:Object = {};
		protected var _customButtons:Array = [];
//		protected var _removedButtons:Array = [];
		protected var _dividers:Array;
		protected var _dividerElements:Object;
		protected var _defaultLayout:String = "[play|prev next|elapsed][time][duration|hd cc|mute volume|fullscreen]";
		protected var _currentLayout:String;
		protected var _layoutManager:ControlbarLayoutManager;
		protected var _width:Number;
		protected var _height:Number;
		protected var _timeSlider:Slider;
		protected var _volSlider:Slider;
		protected var _audioMode:Boolean = false;
		protected var _levels:Array;
		protected var _currentQuality:Number = 0;
		protected var _hdOverlay:TooltipMenu;
		protected var _captions:Array;
		protected var _currentCaptions:Number = 0;
		protected var _ccOverlay:TooltipMenu;
		protected var _volumeOverlay:TooltipOverlay;
		protected var _fullscreenOverlay:TooltipOverlay;
		
		protected var _mouseOverButton:Boolean = false;
		

		protected var _bgColorSheet:Sprite;

		protected var animations:Animations;
		protected var _fadingOut:Number;
		
		public function ControlbarComponent(player:IPlayer) {
			super(player, "controlbar");
			animations = new Animations(this);
			if (getConfigParam('position') == "over" && hideOnIdle) {
				alpha = 0;
				visible = false;
			}
			_layoutManager = new ControlbarLayoutManager(this);
			_dividers = [];
			_dividerElements = {
				'divider': setupDivider('divider') 
			};
			setupBackground();
			setupDefaultButtons();
			setupOverlays();
			addEventListeners();
			updateControlbarState();
			setTime(0, 0);
			updateVolumeSlider();
		}
		
		private function setupDivider(name:String):Object {
			return {
				copies: [],
				index: 0
			};	
		}

		private function addEventListeners():void {
			player.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
			player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_LOADED, playlistHandler);
			player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, playlistHandler);
			player.addEventListener(MediaEvent.JWPLAYER_MEDIA_MUTE, stateHandler);
			player.addEventListener(MediaEvent.JWPLAYER_MEDIA_VOLUME, updateVolumeSlider);
			player.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER, mediaHandler);
			player.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, mediaHandler);
			player.addEventListener(MediaEvent.JWPLAYER_MEDIA_LEVELS, levelsHandler);
			player.addEventListener(MediaEvent.JWPLAYER_MEDIA_LEVEL_CHANGED, levelChanged);
			player.addEventListener(CaptionsEvent.JWPLAYER_CAPTIONS_LIST, captionsHandler);
			player.addEventListener(CaptionsEvent.JWPLAYER_CAPTIONS_CHANGED, captionChanged);
			player.addEventListener(PlayerEvent.JWPLAYER_LOCKED, lockHandler);
			player.addEventListener(PlayerEvent.JWPLAYER_UNLOCKED, lockHandler);
		}


		private function lockHandler(evt:PlayerEvent):void {
			if (_player.locked) {
				if (_timeSlider) _timeSlider.lock();
				if (_volSlider) _volSlider.lock();
			} else {
				if (_timeSlider) _timeSlider.unlock();
				if (_volSlider) _volSlider.unlock();
			}
		}


		private function playlistHandler(evt:PlaylistEvent):void {
			if (_timeSlider) _timeSlider.reset();
			updateControlbarState();
			redraw();
		}

		private function get hideOnIdle():Boolean {
			return String(getConfigParam('idlehide')) == "true";
		}
		
		private function get maxWidth():Number {
			return getConfigParam('maxwidth') ? Number(getConfigParam('maxwidth')) : 800;			
		}
		
		private function stateHandler(evt:PlayerEvent=null):void {
			updateControlbarState();
			redraw();
		}


		/*
		private function parseStructuredLayout(structuredLayout:Object):String {
			var layoutString:String = "";
			getTextField('elapsed').visible = false;
			getTextField('duration').visible = false;
			for each (var position:String in ['left','center','right']) {
				layoutString += "[";
				var layout:Array = structuredLayout[position] as Array;
				if (layout) {
					var lastWasDivider:Boolean = true;					
					for each (var item:Object in layout) {
						if (item['type'] == "divider") { 
							if (item['element']) {
								layoutString += "<" + item['element'] + ">";
								if (!_dividerElements[item['element']]) {
									_dividerElements[item['element']] = setupDivider(item['element']);
								}
							} else if (item['width'] > 0) { 
								layoutString += "<"+item['width']+">";
							} else {
								layoutString += "|";
							}
							lastWasDivider = true;
						} else {
							if (item['type'] == "text") {
								getTextField(item['name']).visible = true;
							}
							if (!lastWasDivider) layoutString += " ";
							layoutString += item['name'];
							lastWasDivider = false;
						}
					}
				}
				layoutString += "]";
			}
			return layoutString;
		}
		*/

		private function updateControlbarState():void {
			var newLayout:String = _defaultLayout;
/*			var controlbarLayout:Object = _player.skin.getSkinProperties().layout['controlbar'];
			if (controlbarLayout) {
				newLayout = parseStructuredLayout(controlbarLayout);
			}
*/			removeInactive(newLayout);
/*			newLayout = newLayout.replace("blank", _customButtons.join("|"));
			newLayout = removeButtonFromLayout("blank", newLayout);
			for each (var removed:String in _removedButtons) {
				newLayout = removeButtonFromLayout(removed, newLayout);
			}
*/
			if (player.state == PlayerState.PLAYING) {
				newLayout = newLayout.replace('play', 'pause');
				hideButton('play');
			} else if (player.state == PlayerState.IDLE) {
				if (_timeSlider) {
					_timeSlider.reset();
					_timeSlider.thumbVisible = false;
					if (_player.playlist.currentItem) {
						setTime(0, _player.playlist.currentItem.duration);
					}
				}
				hideButton('pause');
			} else {
				hideButton('pause');
			}
//			var forced:Boolean = Boolean(getConfigParam('forcenextprev'));
			var multiList:Boolean = player.playlist.length > 1;
			var playlistShowing:Boolean = (player.config.fullscreen == false && player.config.playlistposition.toLowerCase() != "none");
			if (!(multiList && !playlistShowing)) {
				newLayout = newLayout.replace(/\|?(prev|next)/g, "");
				hideButton('prev');
				hideButton('next');
			}
			if (player.config.mute) {
				newLayout = newLayout.replace("mute", "unmute");
				hideButton("mute");
			} else {
				hideButton("unmute");
			}
			if (player.config.fullscreen) {
				newLayout = newLayout.replace("fullscreen", "normalscreen");
				hideButton("fullscreen");
			} else {
				hideButton("normalscreen");
			}
			
			if (!_levels || _levels.length < 2) {
				newLayout = newLayout.replace(/\|?hd/g, "");
				hideButton('hd');
			}

			if (!_captions || _captions.length < 2) {
				newLayout = newLayout.replace(/\|?cc/g, "");
				hideButton('cc');
			}
			_currentLayout = removeInactive(newLayout);
		}


		private function removeInactive(layout:String):String {
			var buttons:Array = _defaultLayout.match(/\W*([A-Za-z0-9]+?)\W/g);
			for (var i:Number = 0; i < buttons.length; i++) {
				var button:String = (buttons[i] as String).replace(/\W/g, "");
				if (!_buttons[button]) {
					layout = removeButtonFromLayout(button, layout);
				}
			}
			return layout;
		}


		private function removeButtonFromLayout(button:String, layout:String):String {
			layout = layout.replace(button, "");
			layout = layout.replace(/\|+/g, "|");
			return layout;
		}


		private function mediaHandler(evt:MediaEvent):void {
			var scrubber:Slider = _timeSlider;
			switch (evt.type) {
				case MediaEvent.JWPLAYER_MEDIA_BUFFER:
				case MediaEvent.JWPLAYER_MEDIA_TIME:
					if (scrubber) {
						scrubber.setProgress(evt.position / evt.duration * 100);
						scrubber.thumbVisible = (evt.duration > 0);
						if (evt.bufferPercent > 0) {
							var offsetPercent:Number = (evt.offset / evt.duration) * 100;
							scrubber.setBuffer(evt.bufferPercent / (1-offsetPercent/100), offsetPercent);
						}
						if (evt.position > 0) { setTime(evt.position, evt.duration); }
					}
					break;
				default:
					scrubber.reset();
					break;
			}
		}


		private function updateVolumeSlider(evt:MediaEvent=null):void {
			var volume:Slider = _volSlider;
			if (volume) {
				if (!_player.config.mute) {
					volume.setBuffer(100);
					volume.setProgress(_player.config.volume);
					volume.thumbVisible = true;
				} else {
					volume.reset();
					volume.thumbVisible = false;
				}
			}
		}


		private function setTime(position:Number, duration:Number):void {
			if (position < 0) {
				position = 0;
			}
			if (duration < 0) {
				duration = 0;
			}
			
			var redrawNeeded:Boolean = false;
			
			var newElapsed:String = Strings.digits(position);
			var elapsedText:TextField = getTextField('elapsed');
			if (elapsedText) {
				if (newElapsed.length != elapsedText.text.length) redrawNeeded = true;
				elapsedText.text = newElapsed;	
			}
			
			
			var newDuration:String = Strings.digits(duration);
			var durationField:TextField = getTextField('duration');
			if (durationField) {
				if (newDuration.length != elapsedText.text.length) redrawNeeded = true;
				durationField.text = newDuration;
			} 
			
			var timeSlider:TimeSlider = getSlider('time') as TimeSlider;
			if (timeSlider) {
				timeSlider.duration = duration;
				timeSlider.live = (duration <= 0);
			}
			
			if (redrawNeeded) redraw();
		}


		private function setupBackground():void {
			var back:DisplayObject = getSkinElement("background");
			var capLeft:DisplayObject = getSkinElement("capLeft");
			var capRight:DisplayObject = getSkinElement("capRight");
			//var shade:DisplayObject = getSkinElement("shade");

			if (!back) {
				var newBackground:Sprite = new Sprite();
				newBackground.name = "background";
				newBackground.graphics.beginFill(0, 0);
				newBackground.graphics.drawRect(0, 0, 1, 1);
				newBackground.graphics.endFill();
				back = newBackground as DisplayObject;
			}

			if (!capLeft) { capLeft = new Sprite(); }
			if (!capRight) { capRight = new Sprite(); }
			
			_bgColorSheet = new Sprite(); 
			if (backgroundColor) {
				_bgColorSheet.graphics.beginFill(backgroundColor.color, 1);
				_bgColorSheet.graphics.drawRect(0, 0, 1, 1);
				_bgColorSheet.graphics.endFill();
			}
			addChildAt(_bgColorSheet, 0);
			
			
			_buttons['background'] = back;
			addChild(back);
			_height = back.height;
			player.config.pluginConfig("controlbar")['size'] = back.height;

			if (capLeft) {
				_buttons['capLeft'] = capLeft;
				addChild(capLeft);
			}

			if (capRight) {
				_buttons['capRight'] = capRight;
				addChild(capRight);
			}

		}


		private function setupDefaultButtons():void {
			addComponentButton('play', ViewEvent.JWPLAYER_VIEW_PLAY);
			addComponentButton('pause', ViewEvent.JWPLAYER_VIEW_PAUSE);
			addComponentButton('prev', ViewEvent.JWPLAYER_VIEW_PREV);
			addComponentButton('next', ViewEvent.JWPLAYER_VIEW_NEXT);
			addComponentButton('stop', ViewEvent.JWPLAYER_VIEW_STOP);
			addComponentButton('hd', null);
			addComponentButton('cc', null);
			addComponentButton('fullscreen', ViewEvent.JWPLAYER_VIEW_FULLSCREEN, true);
			addComponentButton('normalscreen', ViewEvent.JWPLAYER_VIEW_FULLSCREEN, false);
			addComponentButton('unmute', ViewEvent.JWPLAYER_VIEW_MUTE, false);
			addComponentButton('mute', ViewEvent.JWPLAYER_VIEW_MUTE, true);
			addTextField('elapsed');
			addTextField('duration');
			addSlider('time', ViewEvent.JWPLAYER_VIEW_CLICK, seekHandler);
			_timeSlider = getSlider('time');
			addSlider('volume', ViewEvent.JWPLAYER_VIEW_CLICK, volumeHandler);
			_volSlider = getSlider('volume');
			if (_buttons.hd) {
				_buttons.hd.addEventListener(MouseEvent.MOUSE_OVER, showHdOverlay);
			}
			if (_buttons.cc) {
				_buttons.cc.addEventListener(MouseEvent.MOUSE_OVER, showCcOverlay);
			}
			if (_buttons.mute && _volSlider) {
				_buttons.mute.addEventListener(MouseEvent.MOUSE_OVER, showVolumeOverlay);
				if (_buttons.unmute) {
					_buttons.unmute.addEventListener(MouseEvent.MOUSE_OVER, showVolumeOverlay);
				}
			}
			if (_buttons.fullscreen) {
				_buttons.fullscreen.addEventListener(MouseEvent.MOUSE_OVER, showFullscreenOverlay);
				_buttons.fullscreen.addEventListener(MouseEvent.CLICK, hideFullscreenOverlay);
				if (_buttons.normalscreen) {
					_buttons.normalscreen.addEventListener(MouseEvent.MOUSE_OVER, showFullscreenOverlay);
					_buttons.normalscreen.addEventListener(MouseEvent.CLICK, hideFullscreenOverlay);
				}

			}
		}
		
		private function setupOverlays():void {
			_hdOverlay = new TooltipMenu('HD', _player.skin, hdOption);
			_hdOverlay.name = "hdOverlay";
			createOverlay(_hdOverlay, _buttons.hd);

			_ccOverlay = new TooltipMenu('CC', _player.skin, ccOption);
			_ccOverlay.name = "ccOverlay";
			createOverlay(_ccOverlay, _buttons.cc);

			if (_volSlider) {
				_volumeOverlay = new TooltipOverlay(_player.skin);
				_volumeOverlay.name = "volumeOverlay";
				_volumeOverlay.addChild(_volSlider);
				createOverlay(_volumeOverlay, _buttons.mute);
				if(_buttons.unmute) {
					createOverlay(_volumeOverlay, _buttons.unmute);
				}
			}
			
			_fullscreenOverlay = new TooltipOverlay(_player.skin);
			_fullscreenOverlay.text = "Fullscreen";
			_fullscreenOverlay.name = "fullscreenOverlay";
			createOverlay(_fullscreenOverlay, _buttons.fullscreen);
		}
		
		private function createOverlay(overlay:TooltipOverlay, button:DisplayObject):void {
			if (button && overlay) {
				var fadeTimer:Timer = new Timer(500, 1);
				
				overlay.alpha = 0;
				overlay.addEventListener(MouseEvent.MOUSE_MOVE, function(evt:Event):void { fadeTimer.reset(); });
				overlay.addEventListener(MouseEvent.MOUSE_OUT, function(evt:Event):void { overlayOutHandler(fadeTimer); });
				button.addEventListener(MouseEvent.MOUSE_OUT, function(evt:Event):void { _mouseOverButton = false; fadeTimer.start(); });
				button.addEventListener(MouseEvent.MOUSE_OVER, function(evt:Event):void { fadeTimer.reset(); _mouseOverButton = true; });
				RootReference.stage.addChild(overlay);
				fadeTimer.addEventListener(TimerEvent.TIMER_COMPLETE, function(evt:Event):void { overlay.hide(); }); 
			}
		}
		
		private function overlayOutHandler(timer:Timer):void {
			timer.start();
			var buttonTimer:Timer = new Timer(200,1);
			buttonTimer.addEventListener(TimerEvent.TIMER_COMPLETE, function(evt:Event):void { overlayOutTimerHandler(timer); });
			buttonTimer.start();
		}
		
		private function overlayOutTimerHandler(timer:Timer):void {
			if (_mouseOverButton) {
				timer.reset();
			}	
		}

		private function hdOption(level:Number):void {
			if (_levels && level >=0 && _levels.length > level) {
				_player.setCurrentQuality(level);
			}
			_hdOverlay.hide();
		}

		private function ccOption(caption:Number):void {
			if (_captions && caption >=0 && _captions.length > caption) {
				_player.setCurrentCaptions(caption);
			}
			_ccOverlay.hide();
		}

		private function showHdOverlay(evt:MouseEvent):void {
			if (_audioMode) return;
			if (_hdOverlay && _levels && _levels.length > 1) _hdOverlay.show();
			hideCcOverlay();
			hideVolumeOverlay();
			hideFullscreenOverlay();
		}
		
		private function showCcOverlay(evt:MouseEvent):void {
			if (_ccOverlay && _captions && _captions.length > 1) _ccOverlay.show();
			hideHdOverlay();
			hideVolumeOverlay();
			hideFullscreenOverlay();
		}

		private function hideHdOverlay(evt:MouseEvent=null):void {
			if (_hdOverlay && !evt) {
				_hdOverlay.hide();
			}
		}

		private function hideCcOverlay(evt:MouseEvent=null):void {
			if (_ccOverlay && !evt) {
				_ccOverlay.hide();
			}
		}

		private function levelsHandler(evt:MediaEvent):void {
			_levels = evt.levels;
			if (_levels.length > 1) {
				_hdOverlay.clearOptions();
				for (var i:Number=0; i < _levels.length; i++) {
					_hdOverlay.addOption(_levels[i].label, i);
				}
			}
			levelChanged(evt);
		}

		private function levelChanged(evt:MediaEvent):void {
			_currentQuality = evt.currentQuality;
			if (_levels.length > 1) {
				_hdOverlay.setActive(evt.currentQuality);
			}
			updateControlbarState();
			redraw();
		}

		private function captionsHandler(evt:CaptionsEvent):void {
			_captions = evt.tracks;
			if (_captions.length > 1) {
				_ccOverlay.clearOptions();
				for (var i:Number=0; i < _captions.length; i++) {
					_ccOverlay.addOption(_captions[i].label, i);
				}
			}
			captionChanged(evt);
		}
		
		private function captionChanged(evt:CaptionsEvent):void {
			if (!_captions) return;
			_currentCaptions = evt.currentTrack;
			if (_captions.length > 1) {
				_ccOverlay.setActive(evt.currentTrack);
			}
			updateControlbarState();
			redraw();
		}
		
		private function addComponentButton(name:String, event:String, eventData:*=null):void {
			var button:ComponentButton = new ComponentButton();
			button.name = name;
			button.setOutIcon(getSkinElement(name + "Button"));
			button.setOverIcon(getSkinElement(name + "ButtonOver"));
			button.clickFunction = function():void {
				if (event) {
					forward(new ViewEvent(event, eventData));
				}
			}
			if (getSkinElement(name + "Button") || getSkinElement(name + "ButtonOver")) {
				button.init();
				addButtonDisplayObject(button, name);
			}
		}


		private function addSlider(name:String, event:String, callback:Function, margin:Number=0):void {
			try {
				var slider:Slider = (name == "time") ? new TimeSlider(name+"Slider", _player.skin, this) : new Slider(name, _player.skin, true, "tooltip");
				slider.addEventListener(event, callback);
				slider.name = name;
				slider.tabEnabled = false;
				_buttons[name] = slider;
				_defaultLayout = removeButtonFromLayout("volume", _defaultLayout);
			} catch (e:Error) {
				Logger.log("Could not create " + name + "slider");
			}
		}


		private function addTextField(name:String):void {
			var textFormat:TextFormat = new TextFormat();
			
			textFormat.color = fontColor ? fontColor.color : 0xEEEEEE;
			
			textFormat.size = fontSize ? fontSize : 11;
			textFormat.font = "_sans";
			textFormat.bold = (!fontWeight || fontWeight == "bold");
			
			var textField:TextField = new TextField();
			textField.defaultTextFormat = textFormat;
			textField.selectable = false;
			textField.autoSize = TextFieldAutoSize.LEFT;
			textField.name = 'text';

			var textContainer:Sprite = new Sprite();
			textContainer.name = name;
			
			var textBackground:DisplayObject = getSkinElement(name + 'Background'); 
			if (textBackground) {
				textBackground.name = 'back';
				textBackground.x = textBackground.y = 0;
				textContainer.addChild(textBackground);
			}
			textContainer.addChild(textField);
			addChild(textContainer);
			_buttons[name] = textContainer;
		}


		private function forward(evt:ViewEvent):void {
			dispatchEvent(evt);
		}

		private function showFullscreenOverlay(evt:MouseEvent):void {
			if (_audioMode) return;
			if (_fullscreenOverlay) _fullscreenOverlay.show();
			hideHdOverlay();
			hideCcOverlay();
			hideVolumeOverlay();
		}
		
		private function hideFullscreenOverlay(evt:MouseEvent=null):void {
			if (_fullscreenOverlay) {
				_fullscreenOverlay.hide();
			}
		}

		private function showVolumeOverlay(evt:MouseEvent):void {
			if (_audioMode) return;
			if (_volumeOverlay) _volumeOverlay.show();
			hideHdOverlay();
			hideCcOverlay();
			hideFullscreenOverlay();
		}
		
		private function hideVolumeOverlay(evt:MouseEvent=null):void {
			if (_volumeOverlay && !evt) {
				_volumeOverlay.hide();
			}
		}

		private function volumeHandler(evt:ViewEvent):void {
			var volume:Number = Math.round(evt.data * 100);
			volume = volume < 10 ? 0 : volume;
			if (!_player.locked) {
				var volumeEvent:MediaEvent = new MediaEvent(MediaEvent.JWPLAYER_MEDIA_VOLUME);
				volumeEvent.volume = volume;
				updateVolumeSlider(volumeEvent);
			}
			dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_VOLUME, volume));
		}


		private function seekHandler(evt:ViewEvent):void {
			var duration:Number = 0;
			try {
				duration = player.playlist.currentItem.duration;
			} catch (err:Error) {
			}
			var percent:Number = Math.round(duration * evt.data);
			dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_SEEK, percent));
			_timeSlider.live = (duration <= 0);
		}

		private function addButtonDisplayObject(icon:ComponentButton, name:String, handler:Function=null):MovieClip {
			var acs:AccessibilityProperties = new AccessibilityProperties();
			acs.name = name;
			if (icon) {
				icon.name = name;
				_buttons[name] = icon;
				icon.accessibilityProperties = acs;
				return icon as ComponentButton;
			}
			return null;
		}

/*
		protected function addButton(icon:DisplayObject, name:String, handler:Function=null):MovieClip {
			if (_customButtons.indexOf(name) < 0) {
				_customButtons.push(name);
			}
			if (_removedButtons.indexOf(name) >= 0) {
				_removedButtons.splice(_removedButtons.indexOf(name), 1);
			}
			icon.x = icon.y = 0;
			var button:ComponentButton = new ComponentButton();
			button.name = name;
			button.clickFunction = handler;
			var outBackground:DisplayObject = getSkinElement("blankButton");
			if (outBackground) {
				var outImage:Sprite = new Sprite();
				var outIcon:DisplayObject = icon;
				var outOffset:Number = Math.round((outBackground.height - outIcon.height) / 2);
				outBackground.width = outIcon.width + 2 * outOffset;
				outImage.addChild(outBackground);
				outImage.addChild(outIcon);
				outIcon.x = outIcon.y = outOffset;
				button.setOutIcon(outImage);

				button.init();
				return addButtonDisplayObject(button, name);
			}
			return null;
		}


		protected function removeButton(name:String):void {
			if (_buttons[name] is DisplayObject && this.contains(_buttons[name] as DisplayObject)) {
				removeChild(_buttons[name]);
				_buttons[name] = null;
				_defaultLayout = removeButtonFromLayout(name, _defaultLayout);
				_currentLayout = removeButtonFromLayout(name, _currentLayout);
				if (_removedButtons.indexOf(name) < 0) {
					_removedButtons.push(name);
				}
				redraw();
			}
		}
*/

		private function hideButton(name:String, state:Boolean = true):void {
			var button:DisplayObject = _buttons[name];
			if (button && contains(button)) {
				_buttons[name].visible = !state;
				removeChild(button);
			}
		}

		public function getButton(buttonName:String):DisplayObject {
			if (_dividerElements[buttonName]) {
				var dividerInfo:Object = _dividerElements[buttonName];
				if (dividerInfo.index >= dividerInfo.copies.length) {
					dividerInfo.copies.push(getSkinElement(buttonName));
				}
				var divider:DisplayObject = dividerInfo.copies[dividerInfo.index++] as DisplayObject;
				return divider;
			} else {
				return _buttons[buttonName];
			}
		}
		
		private function getTextField(textName:String):TextField {
			var textContainer:Sprite = getButton(textName) as Sprite;
			if (textContainer) {
				return textContainer.getChildByName('text') as TextField;
			}
			return null;
		}


		public function getSlider(sliderName:String):Slider {
			return getButton(sliderName) as Slider;
		}


		override public function resize(width:Number, height:Number):void {
			if (getConfigParam('position') == "none") {
				visible = false;
				return;
			}
			
			if (getConfigParam('position') == 'over' || _player.config.fullscreen == true) {
				var margin:Number = getConfigParam('margin') == null ? 8 : getConfigParam('margin');
				var maxMargin:Number = (maxWidth && width > maxWidth) ? (width - maxWidth) / 2 : 0;
				x = (maxMargin ? maxMargin : margin) + player.config.pluginConfig('display')['x'];
				y = height - background.height - margin + player.config.pluginConfig('display')['y'];
				_width = width - 2 * (maxMargin ? maxMargin : margin);
				_bgColorSheet.visible = false;
			} else {
				_width = width;
				_bgColorSheet.visible = true;
			}

			//shade.width = _width;

			var backgroundWidth:Number = _width;

			backgroundWidth -= capLeft.width;
			capLeft.x = 0;

			backgroundWidth -= capRight.width;
			capRight.x = _width - capRight.width;

			background.width = backgroundWidth;
			background.x = capLeft.width;
			setChildIndex(capLeft, numChildren - 1);
			setChildIndex(capRight, numChildren - 1);
			
			_bgColorSheet.width = _width;
			_bgColorSheet.height = background.height;

			if (_fullscreen != _player.config.fullscreen) {
				_fullscreen = _player.config.fullscreen;
				//stopFader();
			}
			
			stateHandler();
			redraw();
		}


		private function redraw():void {
			if (_player.config.height <= 40 || _player.config.fullscreen) {
				_currentLayout = _currentLayout.replace("fullscreen", "");
				hideButton('fullscreen', true);
			} else {
				hideButton('fullscreen', false);
			}
			clearDividers();
			alignTextFields();
			_layoutManager.resize(_width, _height);

			positionOverlay(_hdOverlay, getButton('hd'));
			positionOverlay(_ccOverlay, getButton('cc'));
			positionOverlay(_volumeOverlay, player.config.mute ? getButton('unmute') : getButton('mute'));
			positionOverlay(_fullscreenOverlay, player.config.fullscreen ? getButton('normalscreen') : getButton('fullscreen'));
			
		}


		private function positionOverlay(overlay:TooltipOverlay, button:DisplayObject):void {
			if (button && overlay) {
				RootReference.stage.setChildIndex(overlay, RootReference.stage.numChildren-1);
				var buttonPosition:Point = button.localToGlobal(new Point(button.width / 2, 0)); 
				var cbBounds:Rectangle = this.getBounds(RootReference.root);

				overlay.offsetX = 0;
				overlay.x = buttonPosition.x;
				overlay.y = cbBounds.y;

				
				var overlayBounds:Rectangle = overlay.getBounds(RootReference.root);


				if (overlayBounds.right >= cbBounds.right) {
					overlay.offsetX -= cbBounds.right - overlayBounds.right;
				} else if (overlayBounds.left < cbBounds.left) {
					overlay.offsetX += cbBounds.left + overlayBounds.left;
				}
				

			}
			
		}
		
		private function hideOverlays():void {
			hideVolumeOverlay();
			hideHdOverlay();
			hideCcOverlay();
			hideFullscreenOverlay();
			if (_timeSlider is TimeSlider) (_timeSlider as TimeSlider).hide();
		}
		
		private function clearDividers():void {
			for each (var dividerInfo:Object in _dividerElements) {
				dividerInfo.index = 0;
				for (var i:Number=0; i < dividerInfo.copies.length; i++) {
					var divider:DisplayObject = dividerInfo.copies[i] as DisplayObject;
					if (divider && divider.parent) {
						divider.parent.removeChild(divider);
					}
				} 
			}
		}
		
		private function alignTextFields():void {
			for each(var fieldName:String in ['elapsed','duration']) {
				var textContainer:Sprite = getButton(fieldName) as Sprite;
				textContainer.tabEnabled = false;
				textContainer.buttonMode = false;
				var textField:TextField = getTextField(fieldName);
				var textBackground:DisplayObject = textContainer.getChildByName('back');
				
				if (textField && textBackground) {
					textBackground.width = textField.textWidth + 10; 
					textBackground.height = background.height; 
					textField.x = (textBackground.width - textField.width) / 2; 
					textField.y = (textBackground.height - textField.height) / 2;
				}
			} 
		}


		public function get layout():String {
			return _currentLayout.replace(/\|/g, "<divider>");
		}

		override public function show():void {
			if (getConfigParam('position') == "over") {
//				_hiding = false;
//				this.visible = true;
				animations.fade(1, .5);
			}
		}
		
		public function audioMode(state:Boolean):void {
			_audioMode = state;
			stateHandler();
			(_timeSlider as TimeSlider).audioMode(state);
			if (state) show();
			//moveTimeout();
		}
		
		override public function hide():void {
			if (getConfigParam('position') == "over" && !_audioMode) {
//				_hiding = true;
//				this.visible = false;
				animations.fade(0, .5);
				hideOverlays();
			}
		}

		private function get background():DisplayObject {
			if (_buttons['background']) {
				return _buttons['background'];
			}
			return (new Sprite());
		}


		private function get capLeft():DisplayObject {
			if (_buttons['capLeft']) {
				return _buttons['capLeft'];
			}
			return (new Sprite());
		}


		private function get capRight():DisplayObject {
			if (_buttons['capRight']) {
				return _buttons['capRight'];
			}
			return (new Sprite());
		}
		
	}
}
 