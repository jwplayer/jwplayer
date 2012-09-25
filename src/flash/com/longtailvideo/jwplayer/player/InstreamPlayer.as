package com.longtailvideo.jwplayer.player
{
	import com.longtailvideo.jwplayer.controller.Controller;
	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.InstreamEvent;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.ViewEvent;
	import com.longtailvideo.jwplayer.media.MediaProvider;
	import com.longtailvideo.jwplayer.media.RTMPMediaProvider;
	import com.longtailvideo.jwplayer.media.VideoMediaProvider;
	import com.longtailvideo.jwplayer.model.Color;
	import com.longtailvideo.jwplayer.model.ControlbarSeekOptions;
	import com.longtailvideo.jwplayer.model.IInstreamOptions;
	import com.longtailvideo.jwplayer.model.IPlaylist;
	import com.longtailvideo.jwplayer.model.Model;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.model.Playlist;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.parsers.JWParser;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.utils.Stretcher;
	import com.longtailvideo.jwplayer.view.IPlayerComponents;
	import com.longtailvideo.jwplayer.view.PlayerComponents;
	import com.longtailvideo.jwplayer.view.View;
	import com.longtailvideo.jwplayer.view.components.ControlbarComponent;
	import com.longtailvideo.jwplayer.view.components.DisplayComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IControlbarComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IDisplayComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IPlayerComponent;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	import com.longtailvideo.jwplayer.view.skins.DefaultSkin;
	
	import flash.display.DisplayObject;
	import flash.display.MovieClip;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.geom.Rectangle;
	import flash.utils.setTimeout;
	
	public class InstreamPlayer extends GlobalEventDispatcher implements IInstreamPlayer, IPlayer {

		// Player's MVC
		protected var _model:Model;
		protected var _view:View;
		protected var _controller:Controller;
		
		protected var _item:PlaylistItem;
		protected var _options:IInstreamOptions;
		protected var _provider:MediaProvider;
		protected var _plugin:IPlugin;
		protected var _skin:ISkin;
		
		protected var _instreamDisplay:Sprite;
		protected var _controlsLayer:Sprite;
		protected var _mediaLayer:Sprite;
		protected var _mediaMask:Sprite;
		protected var _isConfig:PlayerConfig;
		protected var _controls:PlayerComponents;
		protected var _mediaDisplayed:Boolean = false;
		protected var _playCalled:Boolean = false;
		protected var _viewSetup:Boolean = false;
		
		public function InstreamPlayer(target:IPlugin, item:PlaylistItem, options:IInstreamOptions, model:Model, view:View, controller:Controller) {
			_plugin = target;
			_item = item;
			_options = options;
			_model = model;
			_controller = controller;
			_view = view;
			
			if (!target || !item || !options || !model || !view || !controller) {
				throw new ArgumentError("InstreamPlayer must be initialized with non-null arguments");
			} 
				
			if (!_options.autoload) {
				_playCalled = true;
			}
			
			_isConfig = new PlayerConfig();
			_isConfig.setConfig({
				volume: _model.config.volume,
				mute: _model.config.mute,
				screencolor: _model.config.screencolor,
				fullscreen: _model.config.fullscreen,
				stretching: _model.config.stretching
			});
			
			_isConfig.setPluginConfig('display', _model.config.pluginConfig('display'));
			_isConfig.setPluginConfig('controlbar', _model.config.pluginConfig('controlbar'));
			
			_isConfig.screencolor = _model.config.screencolor;
			_isConfig.fullscreen = _model.config.fullscreen;
		
			if (_view.skin && _view.skin.getSkinProperties()) {
				_isConfig.setConfig(_view.skin.getSkinProperties());
				_skin = _view.skin;
			}
			
			completeInit();
			
		}
		
		protected function completeInit(evt:Event=null):void {
			
			_controls = new PlayerComponents(this);
			(_controls.display as MovieClip).name = "instream_display";

			setupProvider();

			addDisplayListeners();
			addControlbarListeners();
			
			initializeLayers();
			
			resizeHandler();
			
			_view.addEventListener(ViewEvent.JWPLAYER_RESIZE, resizeHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_REDRAW, resizeHandler);
			_model.addEventListener(MediaEvent.JWPLAYER_MEDIA_VOLUME, playerVolumeUpdated);
			_model.addEventListener(MediaEvent.JWPLAYER_MEDIA_MUTE, playerMuteUpdated);

			if (_playCalled) {
				_viewSetup = true;
				_controls.display.forceState(PlayerState.BUFFERING);
				_view.setupInstream(_instreamDisplay, _plugin);
			}

			
			_provider.load(_item);
		}
		
		protected function setupProvider():void {
			setProvider(_item);
			
			_provider.initializeMediaProvider(_isConfig);
			_provider.addGlobalListener(function(evt:Event):void {
				dispatchEvent(evt);
			});
			
			_provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL, function(evt:MediaEvent):void {
				if (_playCalled) {
					_provider.play();
					if (!_mediaDisplayed && _isConfig.stretching == Stretcher.EXACTFIT) {
						showMedia();
					}
				}
			});
			
			_provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, function(evt:MediaEvent):void {
				setTimeout(function():void { _destroy(true); }, 0);
			});
			
			_provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_META, function(evt:MediaEvent):void {
				if (evt.metadata.width && evt.metadata.height) {
					showMedia();
				}
			});
		}
		
		protected function showMedia():void {
			if (!_mediaDisplayed) {
				_mediaDisplayed = true;
				if (_provider.display) {
					_mediaLayer.visible = true;
					_mediaLayer.addChild(_provider.display);
				} else {
					_mediaLayer.visible = false;
				}
				_controls.display.releaseState();
					
			}
		}
		
		protected function addDisplayListeners():void {
			_controls.display.addEventListener(ViewEvent.JWPLAYER_VIEW_CLICK, displayClicked);
		}
		
		protected function displayClicked(evt:ViewEvent):void {
			if (getState() == PlayerState.PAUSED) {
				play();
			} else {
				dispatchEvent(new InstreamEvent(InstreamEvent.JWPLAYER_INSTREAM_CLICKED));
			}
		}

		protected function addControlbarListeners():void {
			_controls.controlbar.addEventListener(ViewEvent.JWPLAYER_VIEW_VOLUME, volumeClicked);
			_controls.controlbar.addEventListener(ViewEvent.JWPLAYER_VIEW_MUTE, muteClicked);
			_controls.controlbar.addEventListener(ViewEvent.JWPLAYER_VIEW_SEEK, seekClicked);
			_controls.controlbar.addEventListener(ViewEvent.JWPLAYER_VIEW_FULLSCREEN, fullscreenClicked);
			_controls.controlbar.addEventListener(ViewEvent.JWPLAYER_VIEW_PAUSE, pauseClicked);
			_controls.controlbar.addEventListener(ViewEvent.JWPLAYER_VIEW_PLAY, playClicked);
			_controls.controlbar.addEventListener(ViewEvent.JWPLAYER_VIEW_STOP, stopClicked);
			_view.components.playlist.addEventListener(ViewEvent.JWPLAYER_VIEW_ITEM, playlistClicked);
		}
		
		protected function volumeClicked(evt:ViewEvent):void {
			_controller.setVolume(evt.data);
		}
		
		protected function muteClicked(evt:ViewEvent):void {
			_controller.mute(evt.data);
		}

		protected function seekClicked(evt:ViewEvent):void {
			switch(_options.controlbarseekable) {
				case ControlbarSeekOptions.ALWAYS:
					seek(evt.data);
					break;
				case ControlbarSeekOptions.BACKWARDS:
					if (_provider.position > evt.data)
						seek(evt.data);
					break;
			}
		}

		protected function fullscreenClicked(evt:ViewEvent):void {
			_controller.fullscreen(evt.data);
		}
		
		protected function pauseClicked(evt:ViewEvent):void {
			if (_options.controlbarpausable) {
				pause();
			}
		}
		
		protected function playClicked(evt:ViewEvent):void {
			if (_options.controlbarpausable) {
				play();
			}
		}

		protected function stopClicked(evt:ViewEvent):void {
			if (_options.controlbarstoppable) {
				destroy();
			}
			_controller.stop();
		}
		
		protected function playlistClicked(evt:ViewEvent):void {
			if (_options.playlistclickable) {
				_destroy();
				_controller.setPlaylistIndex(evt.data);
				_controller.play();
			}
		}
		
		protected function playerVolumeUpdated(evt:MediaEvent=null):void {
			_isConfig.volume = _model.config.volume;
			if (_provider) {
				_provider.setVolume(_model.config.volume);
			}
		}		

		protected function playerMuteUpdated(evt:MediaEvent=null):void {
			_isConfig.mute = _model.config.mute;
			if (_provider) {
				_provider.mute(_model.config.mute);
			}
		}
		
		protected function initializeLayers():void {
			_instreamDisplay = new Sprite();
			_mediaLayer = new Sprite();
			_mediaMask = new Sprite();
			_controlsLayer = new Sprite();
			
			_instreamDisplay.addChild(_mediaLayer);
			_instreamDisplay.addChild(_controlsLayer);
			
			_controlsLayer.addChild(_controls.display as DisplayObject);
			_controlsLayer.addChild(_controls.controlbar as DisplayObject);

		}
		
		protected function setProvider(item:PlaylistItem):void {
			if (!item.provider) {
				item.provider = JWParser.getProvider(item);
			}
			
			/* Only accept video, http or rtmp providers for now */
			switch (item.provider) {
				case 'rtmp':
					_provider = new RTMPMediaProvider(false);
					break;
				case 'video':
					_provider = new VideoMediaProvider(false);
					break;
				default:
					throw new Error("Unsupported Instream Format; only video or rtmp are currently supported");
					break;
			}
			
		}
		
		protected function forwardEvent(event:PlayerEvent):void {
			var clone:PlayerEvent = event.clone() as PlayerEvent;
			dispatchEvent(clone);
		}
		
		public function play():Boolean {
			_playCalled = true;
			if (!_viewSetup) {
				_view.setupInstream(_instreamDisplay, _plugin);
			}
			if (_provider && _provider.state != PlayerState.PLAYING) {
				_provider.play();
			}
			return true;
		}
		
		public function pause():Boolean {
			if (_provider && _provider.state == PlayerState.PLAYING || PlayerState.BUFFERING) {
				_provider.pause();
			}
			return true;
		}
		
		public function seek(position:Number):Boolean {
			if (_provider && _provider.state != PlayerState.IDLE) {
				var newEvent:MediaEvent = new MediaEvent(MediaEvent.JWPLAYER_MEDIA_SEEK);
				newEvent.position = _provider.position;
				newEvent.offset = position;
				dispatchEvent(newEvent);
				_provider.seek(position);
			}
			return true;
		}
		
		public function destroy():void {
			_destroy();
		}
		
		protected function _destroy(complete:Boolean=false):void {
			if (!complete && _provider.state != PlayerState.IDLE) {
				_provider.stop();
			}
			_view.destroyInstream();
			_provider = null;
			removeEventListeners();
			dispatchEvent(new InstreamEvent(InstreamEvent.JWPLAYER_INSTREAM_DESTROYED, complete ? "complete" : "destroy"));
		}
		
		protected function resizeHandler(evt:ViewEvent=null):void {
			var screenColor:Color;
			var viewDisplay:IDisplayComponent = _view.components.display;
			var viewControlbar:IControlbarComponent = _view.components.controlbar;
			
			if (_model.config.screencolor) {
				screenColor = _model.config.screencolor;
			} else if (_model.config.pluginConfig('display').hasOwnProperty('backgroundcolor')) {
				screenColor = new Color(String(_model.config.pluginConfig('display')['backgroundcolor']));
			}
			
			_isConfig.width = _model.config.width;
			_isConfig.height = _model.config.height;
			_isConfig.fullscreen = _model.config.fullscreen;
			_isConfig.stretching = _model.config.stretching;
			
			_instreamDisplay.graphics.clear();
			_instreamDisplay.graphics.beginFill(0, 0);
			_instreamDisplay.graphics.drawRect(viewDisplay.x, viewDisplay.y, viewDisplay.width, viewDisplay.height);
			_instreamDisplay.graphics.endFill();
			if(_provider) {
				_provider.resize(viewDisplay.width, viewDisplay.height);
			}
			_controls.display.resize(viewDisplay.width, viewDisplay.height);
			_mediaMask = new Sprite();
			_mediaMask.graphics.beginFill(0xFF0000);
			_mediaMask.graphics.drawRect(viewDisplay.x, viewDisplay.y, viewDisplay.width, viewDisplay.height) ;
			_mediaLayer.mask = _mediaMask;
			
			if (_isConfig.pluginConfig('controlbar')['position'] == 'over' || _isConfig.fullscreen) {
				_controls.controlbar.resize(viewDisplay.width, viewDisplay.height);
			} else {
				_controls.controlbar.resize(viewControlbar.width, viewControlbar.height);
			}
			_controls.controlbar.x = viewControlbar.x;
			_controls.controlbar.y = viewControlbar.y;
			_controls.controlbar.show();
		}
		
		protected function removeEventListeners():void {
			_view.removeEventListener(ViewEvent.JWPLAYER_RESIZE, resizeHandler);
			_view.removeEventListener(ViewEvent.JWPLAYER_VIEW_REDRAW, resizeHandler);
			_model.removeEventListener(MediaEvent.JWPLAYER_MEDIA_VOLUME, playerVolumeUpdated);
			_model.removeEventListener(MediaEvent.JWPLAYER_MEDIA_MUTE, playerMuteUpdated);
			_view.components.playlist.removeEventListener(ViewEvent.JWPLAYER_VIEW_ITEM, playlistClicked);
		}
		
		public function getState():String {
			return (_provider ? _provider.state : PlayerState.IDLE);
		}
		
		public function getPosition():Number {
			return _provider.position;
		}
		
		public function getDuration():Number {
			return _item.duration;
		}
	
		/**************** IPLAYER METHODS *************/
		/**  These methods should only be called by  **/
		/**  internal player methods                 **/
		/**********************************************/
					
		public function get config():PlayerConfig {
			return _isConfig;
		}
		
		public function get state():String {
			return this.getState();
		}
		
		public function get position():Number {
			return this.getPosition();
		}
		
		public function get skin():ISkin {
			return _skin;
		}
		

		
		/********** UNSUPPORTED IPLAYER METHODS *******/
		/**    These methods should not be called    **/
		/**********************************************/
		
		public function get version():String {
			return PlayerVersion.version;
		}
		
		public function get playlist():IPlaylist {
			var pl:Playlist = new Playlist();
			pl.load([_item]);
			return pl;
		}
		
		public function get locked():Boolean {
			return false;
		}
		
		public function lock(target:IPlugin, callback:Function):void {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
		}
		
		public function unlock(target:IPlugin):Boolean {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return false;
		}
		
		public function volume(volume:Number):Boolean {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return false;
		}
		
		public function mute(state:Boolean):void {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
		}
		
		public function stop():Boolean {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return false;
		}
		
		public function load(item:*):Boolean {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return false;
		}
		
		public function playlistItem(index:Number):Boolean {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return false;
		}
		
		public function playlistNext():Boolean {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return false;
		}
		
		public function playlistPrev():Boolean {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return false;
		}
		
		public function redraw():Boolean {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return false;
		}
		
		public function fullscreen(on:Boolean):void {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
		}
		
		public function get controls():IPlayerComponents {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return null;
		}
		
		public function overrideComponent(plugin:IPlayerComponent):void {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
		}
		
		public function loadInstream(target:IPlugin, item:PlaylistItem, options:IInstreamOptions=null):IInstreamPlayer {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return null;
		}
		
		public function getQualityLevels():Array {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return null;
		}
		
		public function getCurrentQuality():Number {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return null;
		}
		
		public function setCurrentQuality(index:Number):void {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
		}
		
		public function getCaptionsList():Array {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return null;
		}
		
		public function getCurrentCaptions():Number {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
			return null;
		}
		
		public function setCurrentCaptions(index:Number):void {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
		}

		public function getControls():Boolean {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
		}
		
		public function setControls(state:Boolean):void {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
		}
		
		public function getSafeRegion():Rectangle {
			throw new Error("Unsupported IPlayer method in InstreamPlayer");
		}
		
	}
}