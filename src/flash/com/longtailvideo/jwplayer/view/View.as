package com.longtailvideo.jwplayer.view {
	import com.longtailvideo.jwplayer.events.CaptionsEvent;
	import com.longtailvideo.jwplayer.events.CastEvent;
	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
	import com.longtailvideo.jwplayer.events.ViewEvent;
	import com.longtailvideo.jwplayer.model.Model;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.plugins.IPlugin6;
	import com.longtailvideo.jwplayer.plugins.PluginConfig;
	import com.longtailvideo.jwplayer.utils.Animations;
	import com.longtailvideo.jwplayer.utils.Draw;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.RootReference;
	import com.longtailvideo.jwplayer.utils.Stretcher;
	import com.longtailvideo.jwplayer.view.components.ControlbarComponent;
	import com.longtailvideo.jwplayer.view.components.DockComponent;
	import com.longtailvideo.jwplayer.view.components.LogoComponent;
	import com.longtailvideo.jwplayer.view.components.PlaylistComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IPlayerComponent;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	import flash.display.DisplayObject;
	import flash.display.DisplayObjectContainer;
	import flash.display.Loader;
	import flash.display.MovieClip;
	import flash.display.Stage;
	import flash.display.StageAlign;
	import flash.display.StageDisplayState;
	import flash.display.StageScaleMode;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.FocusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.KeyboardEvent;
	import flash.events.MouseEvent;
	import flash.events.TimerEvent;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	import flash.net.URLRequest;
	import flash.system.LoaderContext;
	import flash.text.TextField;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	import flash.ui.Mouse;
	import flash.utils.Timer;
	import flash.utils.clearTimeout;
	import flash.utils.setTimeout;

	public class View extends GlobalEventDispatcher {
		protected var _player:IPlayer;
		protected var _model:Model;
		protected var _skin:ISkin;
		protected var _components:IPlayerComponents;
		protected var _fullscreen:Boolean = false;
		protected var _preserveAspect:Boolean = false;
		protected var _normalScreen:Rectangle;

		protected var _root:MovieClip;

		protected var _maskedLayers:MovieClip;
		protected var _mediaLayer:MovieClip;
		protected var _mediaFade:Animations;
		protected var _imageLayer:MovieClip;
		protected var _imageFade:Animations;
		protected var _playlist:IPlayerComponent;
		protected var _playlistLayer:MovieClip;
		protected var _componentsLayer:MovieClip;
		protected var _pluginsLayer:MovieClip;
		protected var _plugins:Object;
		protected var _allPlugins:Vector.<IPlugin>;
		
		protected var _instreamLayer:MovieClip;
		protected var _instreamPlugin:IPlugin;
		protected var _instreamAnim:Animations;
		protected var _instreamControls:IPlayerComponents;

		protected var _displayMasker:MovieClip;
		
		protected var _image:Loader;
		//protected var _logo:LogoComponent;

		protected var layoutManager:PlayerLayoutManager;

		protected var currentLayer:Number = 0;
		protected var cbLayer:Number = 0;

		// Delay between IDLE state and when the preview image is shown
		private var imageDelay:Timer = new Timer(100, 1);

		// Delay between non-IDLE state and when the media layer is shown
		private var mediaDelay:Timer = new Timer(100, 1);

		// Keep track of the last thumbnail image
		private var _lastImage:String;
		
		// Timeout for fading controls
		private var _fadingOut:uint;
		
		// Set to true during the player's completed state
		private var _completeState:Boolean;
		
		private var _currPos:Number = 0;
		private var _duration:Number = -1;
		
		// Timer for poster image. Fixes chromes cache issues
		private var _imageTimer:Timer;
		// Current image url being loaded
		private var _imageUrl:String;
		// Indicator for whether the image has been loaded
		private var _imageLoaded:Boolean = false;
		// Indicates whether the instream player is being displayed
		private var _instreamMode:Boolean = false;
		private var _canCast:Boolean = false;

		public function View(player:IPlayer, model:Model) {
			_player = player;
			_model = model;
			RootReference.stage.scaleMode = StageScaleMode.NO_SCALE;
			RootReference.stage.stage.align = StageAlign.TOP_LEFT;

			if (RootReference.stage.stageWidth > 0) {
				resizeStage();
			} else {
				RootReference.stage.addEventListener(Event.RESIZE, resizeStage);
				RootReference.stage.addEventListener(Event.ADDED_TO_STAGE, resizeStage);
			}

			_root = new MovieClip();
			_root.tabIndex = 0;
			_root.focusRect = false;
			_normalScreen = new Rectangle();
		}


		protected function resizeStage(evt:Event=null):void {
			try {
				RootReference.stage.removeEventListener(Event.RESIZE, resizeStage);
				RootReference.stage.removeEventListener(Event.ADDED_TO_STAGE, resizeStage);
			} catch(err:Error) {
				Logger.log("Can't add stage resize handlers: " + err.message);
			}

		}


		public function get skin():ISkin {
			return _skin;
		}
		
		public function get playlist():IPlayerComponent {
			return _playlist;
		}


		public function set skin(skn:ISkin):void {
			_skin = skn;
		}


		public function setupView():void {
			RootReference.stage.addChildAt(_root, 0);
			_root.visible = false;
		
			setupLayers();
			createComponents();
			setupComponents();

			RootReference.stage.addEventListener(Event.RESIZE, resizeHandler);
			RootReference.stage.addEventListener(FocusEvent.FOCUS_OUT, keyFocusOutHandler);
			RootReference.stage.addEventListener(FocusEvent.FOCUS_IN, keyFocusInHandler);
			RootReference.stage.addEventListener(Event.MOUSE_LEAVE, moveTimeout);
			RootReference.stage.addEventListener(MouseEvent.MOUSE_MOVE, moveHandler);
			RootReference.stage.addEventListener(KeyboardEvent.KEY_DOWN, keyboardHandler);
			addComponentListeners();

			_model.addEventListener(MediaEvent.JWPLAYER_MEDIA_LOADED, mediaLoaded);
			_model.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, itemHandler);
			_model.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_COMPLETE, completeHandler);
			_model.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
			_model.addEventListener(MediaEvent.JWPLAYER_MEDIA_ERROR, errorHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER, mediaHandler);
			_player.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, mediaHandler);
			_player.addEventListener(CastEvent.JWPLAYER_CAST_AVAILABLE, _castAvailable);
			layoutManager = new PlayerLayoutManager(_player);
			setupRightClick();

			stateHandler();

			redraw();
		}
		
		protected function addComponentListeners():void {
			components.controlbar.addEventListener(MouseEvent.MOUSE_OVER, preventFade);
			components.controlbar.addEventListener(MouseEvent.MOUSE_OUT, resumeFade);
			components.dock.addEventListener(MouseEvent.MOUSE_OVER, preventFade);
			components.dock.addEventListener(MouseEvent.MOUSE_OUT, resumeFade);
			components.logo.addEventListener(MouseEvent.MOUSE_OVER, preventFade);
			components.logo.addEventListener(MouseEvent.MOUSE_OUT, resumeFade);
			components.captions.addEventListener(CaptionsEvent.JWPLAYER_CAPTIONS_CHANGED, forward);
			components.captions.addEventListener(CaptionsEvent.JWPLAYER_CAPTIONS_LIST, forward);
		}
		
		protected var _preventFade:Boolean = false;

		private function mediaHandler(evt:MediaEvent):void {
			_currPos = evt.position;
			_duration = evt.duration;
		}
		
		private function _castAvailable(evt:CastEvent):void {
			_canCast = evt.available;
			if (_canCast) {
				showControls();
			}
		}

		protected function preventFade(evt:Event=null):void {
			_preventFade = true;
		}
		
		protected function resumeFade(evt:Event=null):void {
			if (_model.media.display) _preventFade = false;
		}
		
		protected function keyFocusOutHandler(evt:FocusEvent):void {
			var ev:ViewEvent = new ViewEvent(ViewEvent.JWPLAYER_VIEW_TAB_FOCUS, false);
			dispatchEvent(ev);
			_components.display.focusHandler(false);
		}

		protected function keyFocusInHandler(evt:FocusEvent):void {
			//ignore if its coming from sharing text input field, which needs focus
			if (evt.target is flash.text.TextField) {
				return;
			}
			var ev:ViewEvent = new ViewEvent(ViewEvent.JWPLAYER_VIEW_TAB_FOCUS, true);
			dispatchEvent(ev);
			if (_model.state == PlayerState.PLAYING) {
				showControls();
				startFader();
			} else {
				_components.display.focusHandler(true);
			}
		}
		
		
		protected function setupRightClick():void {
			var menu:RightclickMenu = new RightclickMenu(_player, _root);
			menu.addGlobalListener(forward);
		}

		public function completeView(isError:Boolean=false, errorMsg:String=""):void {
			if (!isError) {
				_root.visible = true;
			} else {
				// Make this asynchronous; fixes an issue in IE9/Flash 11.4+
				setTimeout(function():void {
					var errorMessage:TextField = new TextField();
					errorMessage.defaultTextFormat = new TextFormat("_sans", 15, 0xffffff, false, false, false, null, null, TextFormatAlign.CENTER);
					errorMessage.text = errorMsg.replace(":", ":\n");
					errorMessage.width = RootReference.stage.stageWidth - 300;
					errorMessage.height = errorMessage.textHeight + 10;
					errorMessage.autoSize = TextFieldAutoSize.CENTER;
	
					errorMessage.x = (RootReference.stage.stageWidth - errorMessage.textWidth) / 2;
					errorMessage.y = (RootReference.stage.stageHeight - errorMessage.textHeight) / 2;
					RootReference.stage.addChild(errorMessage);
				}, 0);
			}
		}


		protected function setupLayers():void {
			_maskedLayers = setupLayer("masked", currentLayer++);
			
			_mediaLayer = setupLayer("media", 0, _maskedLayers);
			_mediaLayer.alpha = 0;
			_mediaFade = new Animations(_mediaLayer);

			_imageLayer = setupLayer("image", 0, _maskedLayers);
			_image = new Loader();
			_image.contentLoaderInfo.addEventListener(Event.COMPLETE, imageComplete);
			_image.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, imageError);
			_imageLayer.addChild(_image);
			_imageLayer.alpha = 0;
			_imageFade = new Animations(_imageLayer);
			
			_imageTimer = new Timer(1000,1);
			_imageTimer.addEventListener(TimerEvent.TIMER_COMPLETE, _imageTimerHandler);

			imageDelay.addEventListener(TimerEvent.TIMER_COMPLETE, showImage);
			mediaDelay.addEventListener(TimerEvent.TIMER_COMPLETE, showMedia);
			
			_componentsLayer = setupLayer("components", currentLayer++);
			_playlistLayer = setupLayer("playlist", currentLayer++);
			_pluginsLayer = setupLayer("plugins", currentLayer++);
			_plugins = {};
			_allPlugins = new Vector.<IPlugin>;
			
			_instreamLayer = setupLayer("instream", currentLayer++);
			_instreamLayer.alpha = 0;
			_instreamLayer.visible = false;
			_instreamAnim = new Animations(_instreamLayer);
			_instreamAnim.addEventListener(Event.COMPLETE, instreamAnimationComplete);
		}

		protected function setupLayer(name:String, index:Number, parent:DisplayObjectContainer=null):MovieClip {
			var layer:MovieClip = new MovieClip();
			parent ? parent.addChildAt(layer,index) : _root.addChildAt(layer, index);
			layer.name = name;
			layer.x = 0;
			layer.y = 0;
			return layer;
		}

		protected function setupDisplayMask():void {
			_displayMasker = new MovieClip();
			_displayMasker.graphics.beginFill(0x000000, 1);
			_displayMasker.graphics.drawRect(0, 0, _player.config.width, _player.config.height);
			_displayMasker.graphics.endFill();

			_maskedLayers.mask = _displayMasker;
		}

		protected function createComponents():void {
			_components = new PlayerComponents(_player);
		}

		protected function setupComponents():void {
			var n:Number = 0;
			setupComponent(_components.captions, n++);
			setupComponent(_components.display, n++);
			_playlist = _components.playlist;
			_playlistLayer.addChild(_playlist as DisplayObject);
			setupComponent(_components.logo, n++);
			setupComponent(_components.controlbar, n++);
			cbLayer = n;
			setupComponent(_components.dock, n++);
		}


		protected function setupComponent(component:*, index:Number):void {
			if (component is IGlobalEventDispatcher) { (component as IGlobalEventDispatcher).addGlobalListener(forward); }
			if (component is DisplayObject) { _componentsLayer.addChildAt(component as DisplayObject, index); }
		}


		protected function resizeHandler(event:Event):void {
			_fullscreen = (RootReference.stage.displayState == StageDisplayState.FULL_SCREEN);
			if (_model.media.display) _preventFade = false;
			if (_model.fullscreen != _fullscreen) {
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_FULLSCREEN, _fullscreen));
			}
            var size:Object = {
                width:  RootReference.stage.stageWidth,
                height: RootReference.stage.stageHeight
            };
            if (size.width && size.height) {
                redraw();
                dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_RESIZE, size));
            }
		}


		public function fullscreen(mode:Boolean=true):void {
			try {
				RootReference.stage.displayState = mode ? StageDisplayState.FULL_SCREEN : StageDisplayState.NORMAL;
			} catch (e:Error) {
				Logger.log("Could not enter fullscreen mode: " + e.message);
			}
		}

		private var _controlbarMargin:Number = -1;

		/** Redraws the plugins and player components **/
		public function redraw():void {
			layoutManager.resize(RootReference.stage.stageWidth, RootReference.stage.stageHeight);
			
			if (audioMode) {
				if (_controlbarMargin < 0) _controlbarMargin = _model.config.pluginConfig('controlbar').margin;
				_model.config.pluginConfig('controlbar').margin = 0;
				_components.controlbar.audioMode(true);
				_components.controlbar.resize(_player.config.width, _player.config.height);
				_components.display.hide();
				_components.dock.hide();
				_components.logo.hide(true);
				_components.captions.hide();
				hideImage();
				_mediaFade.fade(0);
				_components.redraw();
				return;
			} else {
				if (_controlbarMargin > 0) {
					_model.config.pluginConfig('controlbar').margin = _controlbarMargin;
					_controlbarMargin = -1;
				}
				if (!_model.config.controls) {
					_components.display.hide();
					_components.dock.hide();
					_components.controlbar.hide();
				} else {
					_components.display.show();
					if (_completeState) _components.dock.show();
				}
				_components.controlbar.audioMode(false);
				_components.logo.show();
				showMedia();
			}
			
			_components.redraw();
			if (!_fullscreen) {
				_normalScreen.width = _player.config.width;
				_normalScreen.height = _player.config.height;
			} 

			resizeMasker();

			_imageLayer.x = _mediaLayer.x = _components.display.x;
			_imageLayer.y = _mediaLayer.y = _components.display.y;

			if (_preserveAspect) {
				if(!_fullscreen && _player.config.stretching != Stretcher.EXACTFIT) {
					_preserveAspect = false;
				}
			} else {
				if (_fullscreen && _player.config.stretching == Stretcher.EXACTFIT) {
					_preserveAspect = true;
				}
			}

			resizeImage(_player.config.width, _player.config.height);
			resizeMedia(_player.config.width, _player.config.height);

			_instreamLayer.graphics.clear();
			_instreamLayer.graphics.beginFill(0);
			_instreamLayer.graphics.drawRect(0, 0, _player.config.width, _player.config.height);
			_instreamLayer.graphics.endFill();

			for each (var plug:IPlugin in _allPlugins) {
				var plugDisplay:DisplayObject = plug as DisplayObject;
				if (plug && plugDisplay) {
					var cfg:PluginConfig = _player.config.pluginConfig(plug.id);
					if (cfg['visible']) {
						plugDisplay.visible = true;
						plugDisplay.x = cfg['x'];
						plugDisplay.y = cfg['y'];
						try {
							plug.resize(cfg.width, cfg.height);
						} catch (e:Error) {
							Logger.log("There was an error resizing plugin '" + plug.id + "': " + e.message);
						}
					} else {
						plugDisplay.visible = false;
					}
				}
			}

		}

		protected function resizeMedia(width:Number, height:Number):void {
			// Don't need to resize the media if width/height are 0 (i.e. player is hidden in the DOM)
			if (width * height == 0) return;
			
			if (_mediaLayer.numChildren > 0 && _model.media.display) {
				if (_preserveAspect && _model.media.stretchMedia) {
					if (_fullscreen && _player.config.stretching == Stretcher.EXACTFIT) {
						_model.media.resize(_normalScreen.width, _normalScreen.height);
						Stretcher.stretch(_mediaLayer, width, height, Stretcher.UNIFORM);
					} else {
						_model.media.resize(width, height);
						_mediaLayer.scaleX = _mediaLayer.scaleY = 1;
						_mediaLayer.x = _mediaLayer.y = 0;
					}
				} else {
					_model.media.resize(width, height);
					_mediaLayer.x = _mediaLayer.y = 0;
				}
				_mediaLayer.x += _components.display.x;
				_mediaLayer.y += _components.display.y;
			}
		}

		protected function resizeImage(width:Number, height:Number):void {
			if (_imageLayer.numChildren > 0) {
				try {
					_image.width = _image.contentLoaderInfo.width;
					_image.height = _image.contentLoaderInfo.height;
				} catch(e:Error) {
					// Resize image later
					return;
				}
				if (_preserveAspect) {
					if (_fullscreen && _player.config.stretching == Stretcher.EXACTFIT) {
						Stretcher.stretch(_image, _normalScreen.width, _normalScreen.height, _player.config.stretching);
						Stretcher.stretch(_imageLayer, width, height, Stretcher.UNIFORM);
					} else {
						Stretcher.stretch(_image, width, height, _player.config.stretching);
						Stretcher.stretch(_imageLayer, width, height, Stretcher.NONE);
						_imageLayer.x = _imageLayer.y = 0;
					}
				} else {
					Stretcher.stretch(_image, width, height, _player.config.stretching);
					_imageLayer.x = _imageLayer.y = 0;
				}
				_imageLayer.x += _components.display.x;
				_imageLayer.y += _components.display.y;
			}
			
		}

		protected function resizeMasker():void {
			if (_displayMasker == null)
				setupDisplayMask();

			_displayMasker.graphics.clear();
			_displayMasker.graphics.beginFill(0, 1);
			_displayMasker.graphics.drawRect(_components.display.x, _components.display.y, _player.config.width, _player.config.height);
			_displayMasker.graphics.endFill();
		}


		public function get components():IPlayerComponents {
			return _components;
		}

		public function addPlugin(id:String, plugin:IPlugin):void {
			if (!(plugin is IPlugin6)) {
				throw new Error("Incompatible plugin version");
			}
			try {
				_allPlugins.push(plugin);
				var plugDO:DisplayObject = plugin as DisplayObject;
				if (!_plugins[id] && plugDO != null) {
					_plugins[id] = plugDO;
					_pluginsLayer.addChild(plugDO);
				}
				if (_player.config.pluginIds.indexOf(id) < 0) {
					_player.config.plugins += "," + id;
				}
			} catch (e:Error) {
				dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, e.message));
			}
		}


		public function removePlugin(plugin:IPlugin):void {
			var id:String = plugin.id.toLowerCase();
			if (id && _plugins[id] is IPlugin) {
				_pluginsLayer.removeChild(_plugins[id]);
				delete _plugins[id];
			}
		}


		public function loadedPlugins():Array {
			var list:Array = [];
			for (var pluginId:String in _plugins) {
				if (_plugins[pluginId] is IPlugin) {
					list.push(pluginId);
				}
			}
			return list;
		}


		public function getPlugin(id:String):IPlugin6 {
			return _plugins[id] as IPlugin6;
		}

			

		public function bringPluginToFront(id:String):void {
			var plugin:IPlugin = getPlugin(id);
			_pluginsLayer.setChildIndex(plugin as DisplayObject, _pluginsLayer.numChildren - 1);
		}


		protected function mediaLoaded(evt:MediaEvent):void {
			var disp:DisplayObject = _model.media.display;
			if (!disp || disp.parent != _mediaLayer) {
				while (_mediaLayer.numChildren) {
					_mediaLayer.removeChildAt(0);
				}
				if (disp) {
					_mediaLayer.addChild(disp);
					resizeMedia(_player.config.width, _player.config.height);					
				}
			}
		}


		protected function itemHandler(evt:PlaylistEvent):void {
			_currPos = 0;
			_duration = -1;
			if (_model.playlist.currentItem && _model.playlist.currentItem.image) {
				if (_lastImage != _model.playlist.currentItem.image) {
					_lastImage = _model.playlist.currentItem.image;
					// reset timer and imageLoaded for new playlist item
					_imageLoaded = false;
					_imageTimer.reset();
					loadImage(_lastImage);
				}
			} else {
				_lastImage = undefined;
				_image.visible = false;
			}
		}


		protected function loadImage(url:String):void {
			_imageUrl = url;
			_image.visible = true;
			
			// Only start timer once. 
			//Don't want to keep retrying if image doesn't load after cachebuster
			if (!_imageTimer.currentCount) {
				_imageTimer.start();
			}
			_image.load(new URLRequest(url), new LoaderContext(true));
		}
	
		// If the image doesn't load in 1 second (Chrome cache issue)
		private function _imageTimerHandler(evt:TimerEvent):void {
			// attempt to stop caching by adding a cachebuster to the url
			var buster:Number = Math.round(Math.random() * 100000);
			if (_imageUrl.indexOf("?") == -1) {
				_imageUrl += ("?busted=" + buster);
			}
			else {
				var params:Array = _imageUrl.split("?");
				_imageUrl = params[0] + "?busted=" + buster + "&" + params[1];
			}
			
			loadImage(_imageUrl);	
		}
		
		
		protected function imageComplete(evt:Event):void {
			if (_image) {
				_imageLoaded = true;
				// stop the timer if it is running since image was successfully loaded
				if (_imageTimer.running) {
					_imageTimer.stop();
				}
				Draw.smooth(_image);
				resizeImage(_player.config.width, _player.config.height);
				if (_model.state != PlayerState.PLAYING && _model.state != PlayerState.PAUSED) { 
					showImage();
				}
			}
		}
	
		
		protected function imageError(evt:ErrorEvent):void {
			Logger.log('Error loading preview image: '+evt.text);
		}

		
		protected function showImage(evt:TimerEvent=null):void {
			if (!audioMode) {
//				_imageLayer.alpha = 0;
				_imageFade.fade(1);
				_mediaFade.cancelAnimation();
				_mediaFade.fade(0);
			}
		}
		
		protected function hideImage():void {
			_imageFade.fade(0);
		}

		protected function showMedia(evt:TimerEvent = null):void {
			if (_model.media.display && !audioMode && _player.state != PlayerState.IDLE) {
				_mediaFade.fade(1);
				_imageFade.cancelAnimation();
				_imageLayer.alpha = 0;
				components.controlbar.hideFullscreen(false);
			} else {
				showImage();
				components.controlbar.hideFullscreen(true);
				if (_model.state != PlayerState.IDLE) showControls();
			} 
		}
		
		protected function stateHandler(evt:PlayerStateEvent=null):void {
			imageDelay.reset();
			mediaDelay.reset();
			switch (_model.state) {
				case PlayerState.IDLE:
					hideControls();
					components.dock.show();
					components.logo.show();
					components.controlbar.hideFullscreen(false);
					imageDelay.start();
					break;
				case PlayerState.BUFFERING:
					if (!_model.media.display) {
						showControls();
						_preventFade = true;
					}
					_completeState = false;
					hideControls();
					break;
				case PlayerState.PAUSED:
					showControls();
					Mouse.show();
					break;
				case PlayerState.PLAYING:
					hideControls();
					mediaDelay.start();
					break;
			}
		}

		protected function errorHandler(evt:MediaEvent):void {
			components.controlbar.hide(audioMode);
		}
		
		protected function completeHandler(evt:PlaylistEvent):void {
			_completeState = true;
			fullscreen(false);
			if (_model.config.controls && !audioMode) {
				_components.dock.show();
			}
			loadImage(_model.playlist.getItemAt(0).image);
		}
		
		protected function forward(evt:Event):void {
			if (evt is PlayerEvent)
				dispatchEvent(evt);
		}
		
		public function setupInstream(instreamDisplay:DisplayObject, controls:IPlayerComponents, plugin:IPlugin):void {
			_instreamAnim.cancelAnimation();
			_instreamPlugin = plugin;
			_instreamControls = controls;
			if (instreamDisplay) {
				_instreamLayer.addChild(instreamDisplay);
			}
			_components.controlbar.hideOverlays();
			_mediaLayer.visible = false;
			_componentsLayer.visible = false;
			(_playlist as PlaylistComponent).removeClickHandler();

			try {
				var pluginDO:DisplayObject = plugin as DisplayObject;
				if (pluginDO) {
					_pluginsLayer.removeChild(pluginDO);
					_instreamLayer.addChild(pluginDO);
				}
			} catch(e:Error) {
				Logger.log("Could not add instream plugin to display stack");
			}
			
			_instreamAnim.fade(1);
			_instreamMode = true;

			// For midrolls and postrolls we want to ensure controlbar knows to fadeout
			setTimeout(moveTimeout, 2000);
		}
		
	
		
		public function destroyInstream():void {
			if (_instreamPlugin && _instreamPlugin is DisplayObject) {
				_pluginsLayer.addChild(_instreamPlugin as DisplayObject);
			}
			(_playlist as PlaylistComponent).addClickHandler();
			_mediaLayer.visible = true;
			_componentsLayer.visible = true;
			
			while (_instreamLayer.numChildren > 0) {
				_instreamLayer.removeChildAt(0);
			}

			_instreamAnim.fade(0);
			_instreamMode = false;
		}
		
		public function hideInstream():void {
			_instreamAnim.fade(0);
		}
		
		protected function instreamAnimationComplete(evt:Event):void {
			if (_instreamLayer.alpha == 0) {
				while(_instreamLayer.numChildren > 0) {
					_instreamLayer.removeChildAt(0);
				}
				_instreamPlugin = null;
			}
		}
		
		protected function get audioMode():Boolean {
			var plConfig:PluginConfig = _model.config.pluginConfig('playlist');
			if (PlayerLayoutManager.testPosition(plConfig.position) == PlayerLayoutManager.BOTTOM) {
				return RootReference.stage.stageHeight <= (40 + plConfig.size);
			} else {
				return RootReference.stage.stageHeight <= 40;
			}
		}
		
		/** Show controls on mousemove and restart the countdown. **/
		private function moveHandler(evt:Event=null):void {
			Mouse.show();
			if (_instreamMode || _player.state != PlayerState.IDLE && _player.state != PlayerState.PAUSED) {
				if (evt is MouseEvent) {
					var mouseEvent:MouseEvent = evt as MouseEvent;
					if (!(_components.display as DisplayObject).getRect(RootReference.stage).containsPoint(new Point(mouseEvent.stageX, mouseEvent.stageY))) {
						hideControls();
						return;
					}
				}
				startFader();
			}
		}
		
		private function keyboardHandler(evt:KeyboardEvent):void {
			// If controls are disabled don't allow keyboard shortcuts
			if (! _model.config.controls) {
				return;
			}

			showControls();
			startFader();
			if (evt.keyCode == 32 || evt.keyCode == 13) {
				if (_instreamMode) {
					_instreamControls.controlbar.dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_PLAY));
				} else {
					if (_player.state == PlayerState.PLAYING || _player.state == PlayerState.BUFFERING) {
						dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_PAUSE));
					} else {
						dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_PLAY));
					}
				}
			}
			if (evt.keyCode == 39) {
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_SEEK, _currPos + 5));
			}

			if (evt.keyCode == 37) {
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_SEEK, _currPos - 5));
			}
			var newvol:Number;
			if (evt.keyCode == 38) {
				newvol = _player.config.volume + 10;
				// change the volume
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_VOLUME, (newvol > 100 ? 100 : newvol)));
				// update the slider
				dispatchEvent(new MediaEvent(MediaEvent.JWPLAYER_MEDIA_VOLUME));
			}
			if (evt.keyCode == 40) {
				newvol = _player.config.volume - 10;
				// change the volume
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_VOLUME, (newvol < 0 ? 0 : newvol)));
				// update the slider
				dispatchEvent(new MediaEvent(MediaEvent.JWPLAYER_MEDIA_VOLUME));
			}
			if (evt.keyCode == 77) {
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_MUTE, !_player.config.mute));
			}
			if (evt.keyCode == 70) {
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_FULLSCREEN, !_player.config.fullscreen));
			}
			if (evt.keyCode >= 48 && evt.keyCode <= 59) {
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_SEEK, Math.round(_duration * ((evt.keyCode - 48)/10))));
			}

		}
		
		/** Hide controls again when move has timed out. **/
		private function moveTimeout(evt:Event=null):void {
		clearTimeout(_fadingOut);
			if (_instreamMode || _player.state == PlayerState.PLAYING) Mouse.hide();
			if (_instreamMode || _player.state != PlayerState.PAUSED) hideControls();
		}
		
		private function hideControls():void {
			if (_canCast || _preventFade) {
				return;
			}

			_components.controlbar.hide();
			if (_instreamControls) {
				_instreamControls.controlbar.hide();
			}

			if (_player.state != PlayerState.IDLE) {
				_components.dock.hide();
				_components.logo.hide(audioMode);
			}
		}
		
		private function showControls():void {
			if (_model.config.controls || audioMode) {
				_components.controlbar.show();
				_components.dock.show();
				if (_instreamControls) {
					_instreamControls.controlbar.show();
	}
			}
			if (!audioMode) {
				_components.logo.show();
			}
		}

		/** If the mouse leaves the stage, hide the controlbar if position is 'over' **/
		private function startFader():void {
			stopFader();

			if (!isNaN(_fadingOut)) {
				clearTimeout(_fadingOut);
			}
			_fadingOut = setTimeout(moveTimeout, 2000);
		}

		private function stopFader():void {
			showControls();
			if (!isNaN(_fadingOut)) {
				clearTimeout(_fadingOut);
				Mouse.show();
			}
		}
		
		public function setControls(newstate:Boolean):void {
			var oldstate:Boolean = _model.config.controls;
			if (newstate != oldstate) {
				_model.config.controls = newstate;
				stateHandler();
				redraw();
				dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_CONTROLS, newstate));
				// Reverting changes for setControls in ads (due to regressions in mobile)
				if (_instreamMode) {
					if (newstate) {
						_instreamControls.controlbar.show();
						_instreamControls.display.show();
					}
					else {
						_instreamControls.controlbar.hide();
						_instreamControls.display.hide();
					}
				}
			}
		}
		
		public function getSafeRegion():Rectangle {
			var bounds:Rectangle = new Rectangle();
			var logo:LogoComponent = _components.logo as LogoComponent;
			var dock:DockComponent = _components.dock as DockComponent;
			var dockShowing:Boolean = (dock.numButtons > 0);
			var cb:ControlbarComponent = _components.controlbar as ControlbarComponent;
			var logoTop:Boolean = (logo.position.indexOf("top") == 0);
			var logoShowing:Boolean = (logo.height > 0);
			
			if (_model.config.controls) {
				bounds.x = 0;
				bounds.y = Math.round(Math.max(dockShowing ? dock.getBounds(_componentsLayer).bottom : 0, (logoTop && logoShowing) ? logo.getBounds(_componentsLayer).bottom : 0));
				bounds.width = Math.round(_components.display.width);
				bounds.height = Math.round((logoTop ? cb.getBounds(_componentsLayer).top : (logoShowing ? logo.getBounds(_componentsLayer).top : 0) ) - bounds.y);
			}
			
			return bounds;
		}
		
		public function setCues(cues:Array):void {
			_components.controlbar.setCues(cues);
		}
	}
}
