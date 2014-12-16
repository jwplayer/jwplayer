package com.longtailvideo.jwplayer.player
{
	import com.longtailvideo.jwplayer.controller.Controller;
	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.InstreamEvent;
	import com.longtailvideo.jwplayer.events.JWAdEvent;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
	import com.longtailvideo.jwplayer.events.ViewEvent;
	import com.longtailvideo.jwplayer.media.MediaProvider;
	import com.longtailvideo.jwplayer.media.RTMPMediaProvider;
	import com.longtailvideo.jwplayer.media.SoundMediaProvider;
	import com.longtailvideo.jwplayer.media.VideoMediaProvider;
	import com.longtailvideo.jwplayer.model.Color;
	import com.longtailvideo.jwplayer.model.ControlbarSeekOptions;
	import com.longtailvideo.jwplayer.model.IInstreamOptions;
	import com.longtailvideo.jwplayer.model.IPlaylist;
	import com.longtailvideo.jwplayer.model.InstreamOptions;
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
	import com.longtailvideo.jwplayer.view.components.AdSkipButton;
	import com.longtailvideo.jwplayer.view.interfaces.IDisplayComponent;
	import com.longtailvideo.jwplayer.view.interfaces.IPlayerComponent;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.DisplayObject;
	import flash.display.MovieClip;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.external.ExternalInterface;
	import flash.geom.Rectangle;
	import flash.utils.setTimeout;
	
	public class InstreamPlayer extends GlobalEventDispatcher implements IInstreamPlayer, IPlayer {

		public static const UNSUPPORTED_ERROR:String = "Unsupported IPlayer method in InstreamPlayer";
		private static var _SKIP_HEIGHT:Number = 30;
		private static var _SKIP_WIDTH:Number = 80;
		// Player's MVC
		protected var _model:Model;
		protected var _view:View;
		protected var _controller:Controller;
		
		protected var _item:PlaylistItem;
		protected var _options:IInstreamOptions;
		protected var _provider:MediaProvider;
		protected var _plugin:IPlugin;
		protected var _skin:ISkin;
		protected var _state:String;
		protected var _instreamDisplay:Sprite;
		protected var _controlsLayer:Sprite;
		protected var _mediaLayer:Sprite;
		protected var _mediaMask:Sprite;
		protected var _isConfig:PlayerConfig;
		protected var _controls:PlayerComponents;
		protected var _mediaDisplayed:Boolean = false;
		protected var _clickUrl:String = "";
		protected var _skipButton:AdSkipButton;
		protected var _items:Array;
		protected var _optionsList:Array;
		protected var _itemNdx:Number = 0;
		protected var _viewSetup:Boolean = false;
		protected var _playerLocked:Boolean = false;
		
		public var jsListeners:Object = {};
		
		public function InstreamPlayer(target:IPlugin, model:Model, view:View, controller:Controller) {
			
			_plugin = target;
			_model = model;
			_controller = controller;
			_view = view;
			
			if (!target || !model || !view || !controller) {
				throw new ArgumentError("InstreamPlayer must be initialized with non-null arguments");
			}
		}
		
		public function init():void {
			lock(_plugin, _lockCallback);

			_isConfig = new PlayerConfig();
			_isConfig.setConfig({
				volume: _model.config.volume,
				mute: _model.config.mute,
				screencolor: _model.config.screencolor,
				fullscreen: _model.config.fullscreen,
				stretching: _model.config.stretching,
				base: _model.config.base
			});
			
			_isConfig.setPluginConfig('display', _model.config.pluginConfig('display'));
			_isConfig.setPluginConfig('controlbar', _model.config.pluginConfig('controlbar'));
			
			_isConfig.screencolor = _model.config.screencolor;
			_isConfig.fullscreen = _model.config.fullscreen;
		
			if (_view.skin && _view.skin.getSkinProperties()) {
				_isConfig.setConfig(_view.skin.getSkinProperties());
				_skin = _view.skin;
			}
			
			_controls = new PlayerComponents(this);
			(_controls.display as MovieClip).name = "instream_display";
			
			addControlbarListeners();
			initializeLayers();
			
			resizeHandler();
			
			_view.addEventListener(ViewEvent.JWPLAYER_RESIZE, resizeHandler);
			_view.addEventListener(ViewEvent.JWPLAYER_VIEW_REDRAW, resizeHandler);
			_model.addEventListener(MediaEvent.JWPLAYER_MEDIA_VOLUME, playerVolumeUpdated);
			_model.addEventListener(MediaEvent.JWPLAYER_MEDIA_MUTE, playerMuteUpdated);
			

			_setupView();
			
			//default options
			_options = new InstreamOptions();
			
			_controls.display.forceState(PlayerState.BUFFERING);
			setText(_options.loadingmessage);
		}
		
		public function loadItem(item:Object, options:Object=null):void {
			_options.update(options);
			_skipButton = new AdSkipButton(options.skipMessage,options.skipText);
			_skipButton.addEventListener(JWAdEvent.JWPLAYER_AD_SKIPPED, skipHandler);
			_instreamDisplay.addChild(_skipButton);
			var safe:Rectangle = getSafeRegion();
			if (_skipButton.visible) 
				_skipButton.visible = _model.config.controls;
			_skipButton.x = config.width - (10 + _SKIP_WIDTH);
			_skipButton.y = safe.y + safe.height - (10 + _SKIP_HEIGHT);
			var ev:PlaylistEvent = new PlaylistEvent(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, null);
			dispatchEvent(ev);
			_item = new PlaylistItem(item);
			if (_playerLocked) {
				beginPlayback(_item);
			}
		}
		
		public function loadArray(items:Array, options:Array=null):void {
			_items = items;
			_optionsList = options;
			_itemNdx = 0;
			loadItem(items[_itemNdx], options[_itemNdx]);
		}
		
		public function getOptions():IInstreamOptions {
			return _options;
		}
		
		private function _lockCallback():void {
			_playerLocked = true;
			if (_item && (!_provider || _provider.item !== _item)) {
				beginPlayback(_item);
			}
		}
		
		private function beginPlayback(item:PlaylistItem):void {
			// activate ad interface
			addDisplayListeners();
			
			_skipButton.reset(_options.skipoffset);
			setupProvider(item);
			_provider.load(item);
		}
		
		private function continuePlayback(item:PlaylistItem):void {
			_provider.load(item);
		}
		
		private function skipHandler(evt:JWAdEvent):void {
			var ev:JWAdEvent = new JWAdEvent(JWAdEvent.JWPLAYER_AD_SKIPPED);
			ev.tag = _options.tag;
			if (_items && _items.length > 0) {
				ev.currentAd = _itemNdx + 1;
				ev.totalAds = _items.length;
			}
			dispatchEvent(ev);
			_completeHandler(null);
		}
		
		private function stateHandler(evt:PlayerStateEvent):void {
			_state = evt.newstate;
			switch (_state) {
				case PlayerState.PLAYING:
					break;
				case PlayerState.PAUSED:
					if (getControls()) {
						_controls.controlbar.show();
					}
					break;
			}
		}
		protected function setupProvider(item:PlaylistItem):void {
			setProvider(item);
			_provider.initializeMediaProvider(_isConfig);
			
			_provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_ERROR, _errorHandler);
			
			_provider.addGlobalListener(eventForwarder);
			_provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL, bufferFullHandler);
			_provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, timeHandler);
			_provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
			_provider.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
			_provider.addEventListener(MediaEvent.JWPLAYER_MEDIA_META,metaHandler);
		}

		private function bufferFullHandler(evt:MediaEvent):void {
			_provider.play();
			if (!_mediaDisplayed && (_isConfig.stretching == Stretcher.EXACTFIT || _provider is SoundMediaProvider)) {
				showMedia();
			}
		}
		
		private function metaHandler(evt:MediaEvent):void {
			if (evt.metadata.width && evt.metadata.height) { //_provider sound
				showMedia();
			}
		}
		
		private function eventForwarder(evt:Event):void {
			dispatchEvent(evt);
		}
		
		private function timeHandler(evt:MediaEvent):void {
			_skipButton.updateSkipText(evt.position, evt.duration);
		}
		
		private function _errorHandler(evt:PlayerEvent):void {
			if (evt.type == MediaEvent.JWPLAYER_MEDIA_ERROR) {
				// Translate media error into player error.
				dispatchEvent(new PlayerEvent(PlayerEvent.JWPLAYER_ERROR, (evt as MediaEvent).message));
			} else {
				dispatchEvent(evt);
			}
			_destroy();
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
		
		protected function skipAd(event:Event):void {
			destroy();
		}
		
		protected function addDisplayListeners():void {
			_controls.display.addEventListener(ViewEvent.JWPLAYER_VIEW_CLICK, displayClicked);
		}
		
		protected function displayClicked(evt:ViewEvent):void {
			var state:String = getState();
			if (state == PlayerState.PAUSED) {
				if (getControls()) {
					play();
				}
			} else {
				var event:InstreamEvent = new InstreamEvent(InstreamEvent.JWPLAYER_INSTREAM_CLICKED);
				event.hasControls = getControls();
				dispatchEvent(event);
				_view.fullscreen(false);
				if (_clickUrl) ExternalInterface.call('function(url) { window.open(url, "_blank"); }', _clickUrl);
				pause();
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
			_controls.controlbar.setInstreamMode(true);
		}
		
		protected function volumeClicked(evt:ViewEvent):void {
			_controller.setVolume(evt.data);
		}
		
		protected function muteClicked(evt:ViewEvent):void {
			_controller.mute(evt.data);
		}

		protected function seekClicked(evt:ViewEvent):void {
			switch(_options.controlbarseekable) {
				case ControlbarSeekOptions.NEVER:
					return;
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
		
		protected function _completeHandler(evt:MediaEvent):void {
			var newEvent:PlaylistEvent;
			if (_items && _items.length > _itemNdx+1) {
				_itemNdx++;
				var single:Object = _items[_itemNdx];
				var opt:Object = _optionsList[_itemNdx];
				newEvent = new PlaylistEvent(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM,null);
				dispatchEvent(newEvent);
				_options.update(opt);
				_mediaDisplayed = false;
				_item = new PlaylistItem(single);
				if (_skipButton) _skipButton.reset(opt.skipoffset ? opt.skipoffset : "-1");
				if (_playerLocked) {
					continuePlayback(_item);
				}
			} else {
				newEvent = new PlaylistEvent(PlaylistEvent.JWPLAYER_PLAYLIST_COMPLETE,null);
				dispatchEvent(newEvent);
				setTimeout(function():void { 
					_destroy(evt ? true : false); 
				}, 0);
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
			_provider = getProvider(item.provider);
		}
		
		private function getProvider(type:String):MediaProvider {
			switch (type) {
				case 'rtmp':
					return new RTMPMediaProvider(false);
				case 'video':
					return new VideoMediaProvider(false);
				case 'sound':
					return new SoundMediaProvider();
			}
			throw new Error("Unsupported Instream Format; only video or rtmp are currently supported");
		}

		public function play():Boolean {
			_setupView();
			if (_provider) {
				if (_provider.state == PlayerState.PLAYING || _provider.state == PlayerState.BUFFERING) {
					_provider.pause();
				} else {
					_provider.play();
				}
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
		
		public function setText(text:String=""):void {
			_controls.controlbar.setText(text);
		}
		
		public function setClick(url:String=""):void {
			_clickUrl = url;
		}
		
		public function hide():void {
			removeEventListeners();
			_view.hideInstream();
		}
		
		protected function _setupView():void {
			if (!_viewSetup) {
				_view.setupInstream(this,_instreamDisplay, _controls, _plugin);
				_viewSetup = true;
			}
		}
		 
		protected function _destroy(complete:Boolean=false):void {
			removeEventListeners();
			if (!complete && _provider && _provider.state != PlayerState.IDLE) {
				_provider.stop();
			}
			_view.destroyInstream();
			_provider = null;

			_controls.controlbar.setInstreamMode(false);
			unlock(_plugin);
			dispatchEvent(new InstreamEvent(InstreamEvent.JWPLAYER_INSTREAM_DESTROYED, complete ? "complete" : "destroy"));
		}
		
		protected function resizeHandler(evt:ViewEvent=null):void {
			var screenColor:Color;
			var viewDisplay:IDisplayComponent = _view.components.display;
			
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
			
			_controls.controlbar.resize(viewDisplay.width, viewDisplay.height);
			var safe:Rectangle = getSafeRegion();
			if (_skipButton) {
				_skipButton.visible = _model.config.controls;
				_skipButton.x = config.width - (10 + _SKIP_WIDTH);
				_skipButton.y = safe.y + safe.height - (10 + _SKIP_HEIGHT);
			}

		}
		
		protected function removeEventListeners():void {
			_view.removeEventListener(ViewEvent.JWPLAYER_RESIZE, resizeHandler);
			_view.removeEventListener(ViewEvent.JWPLAYER_VIEW_REDRAW, resizeHandler);
			_model.removeEventListener(MediaEvent.JWPLAYER_MEDIA_VOLUME, playerVolumeUpdated);
			_model.removeEventListener(MediaEvent.JWPLAYER_MEDIA_MUTE, playerMuteUpdated);
			_view.components.playlist.removeEventListener(ViewEvent.JWPLAYER_VIEW_ITEM, playlistClicked);
            if (_skipButton) {
                _skipButton.removeEventListener(JWAdEvent.JWPLAYER_AD_SKIPPED, skipHandler);
            }
			if (_provider) {
				_provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_ERROR, _errorHandler);
				_provider.removeEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
				_provider.removeGlobalListener(eventForwarder);
				_provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL, bufferFullHandler);
				_provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, timeHandler);
				_provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
				_provider.removeEventListener(MediaEvent.JWPLAYER_MEDIA_META,metaHandler);
			}
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
		
		public function getIndex():Number {
			return _itemNdx;
		}
		
		public function getControls():Boolean {
			return _model.config.controls;
		}
		
		public function get version():String {
			return PlayerVersion.version;
		}
		
		public function get playlist():IPlaylist {
			var pl:Playlist = new Playlist();
			pl.load([_item]); //
			return pl;
		}
		
		public function get locked():Boolean {
			return _controller.locking;
		}
		
		public function lock(target:IPlugin, callback:Function):void {
			_controller.lockPlayback(target, callback);
		}
		
		public function unlock(target:IPlugin):Boolean {
			_playerLocked = false;
			return _controller.unlockPlayback(target);
		}

		public function setControls(state:Boolean):void {
			if (_skipButton) {
				state ? _skipButton.show() : _skipButton.hide();
			}
		}
		
		public function getSafeRegion(includeCB:Boolean = true):Rectangle {
			return _view.getSafeRegion(includeCB);
		}
		
		public function get edition():String {
			return _model.edition;
		}
		
		public function get token():String {
			return _model.token;
		}
		
		/********** UNSUPPORTED IPLAYER METHODS *******/
		/**    These methods should not be called    **/
		/**********************************************/
		
		public function volume(volume:Number):Boolean {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function mute(state:Boolean):void {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function stop():Boolean {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function load(item:*):Boolean {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function playlistItem(index:Number):Boolean {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function playlistNext():Boolean {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function playlistPrev():Boolean {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function redraw():Boolean {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function fullscreen(on:Boolean):void {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function get controls():IPlayerComponents {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function overrideComponent(plugin:IPlayerComponent):void {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function setupInstream(target:IPlugin):IInstreamPlayer {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function getQualityLevels():Array {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function getCurrentQuality():Number {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function setCurrentQuality(index:Number):void {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function getAudioTracks():Array {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function getCurrentAudioTrack():Number {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function setCurrentAudioTrack(index:Number):void {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		
		
		public function getCaptionsList():Array {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function getCurrentCaptions():Number {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function setCurrentCaptions(index:Number):void {
			throw new Error(UNSUPPORTED_ERROR);
		}

		public function checkBeforePlay():Boolean {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function checkBeforeComplete():Boolean {
			throw new Error(UNSUPPORTED_ERROR);
		}
		
		public function setCues(cues:Array):void {
			throw new Error(UNSUPPORTED_ERROR);
		}

	}
}