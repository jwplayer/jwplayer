package com.longtailvideo.jwplayer.controller {
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
	import com.longtailvideo.jwplayer.model.Model;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerVersion;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.plugins.IPlugin6;
	import com.longtailvideo.jwplayer.utils.Configger;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.Strings;
	import com.longtailvideo.jwplayer.view.View;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	import com.longtailvideo.jwplayer.view.skins.DefaultSkin;
	import com.longtailvideo.jwplayer.view.skins.PNGSkin;
	import com.longtailvideo.jwplayer.view.skins.SkinProperties;
	
	import flash.display.DisplayObject;
	import flash.display.Loader;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.IOErrorEvent;
	import flash.events.TimerEvent;
	import flash.net.URLRequest;
	import flash.utils.Timer;

	/**
	 * Sent when the all of the setup steps have successfully completed.
	 *
	 * @eventType flash.events.Event.COMPLETE
	 */
	[Event(name="complete", type = "flash.events.Event")]

	/**
	 * Sent when an error occurred during player setup
	 *
	 * @eventType flash.events.ErrorEvent.ERROR
	 */
	[Event(name="error", type = "flash.events.ErrorEvent")]


	/**
	 * PlayerSetup is a helper class to Controller.  It manages the initial player startup process, firing an 
	 * Event.COMPLETE event when finished, or an ErrorEvent.ERROR if a problem occurred during setup.
	 * 
	 * @see Controller
 	 * @author Pablo Schklowsky
	 */
	public class PlayerSetup extends EventDispatcher {

		/** MVC references **/
		protected var _player:IPlayer;
		protected var _model:Model;
		protected var _view:View;
		
		/** TaskQueue **/
		protected var tasker:TaskQueue;
		
		/** User-defined configuration **/
		protected var confHash:Object;
		
		/** Playlist passed in **/
		protected var confPlaylist:Array;
		
		/** Loader to pre-cache preview image **/		
		protected var imageLoader:Loader;
		/** If the preview image doesn't load in time, continue player setup anyway **/
		protected var imageTimeout:Timer;

		
		public function PlayerSetup(player:IPlayer, model:Model, view:View) {
			_player = player;
			_model = model;
			_view = view;
		}
		
		public function setupPlayer():void {
			tasker = new TaskQueue(false);
			tasker.addEventListener(Event.COMPLETE, setupTasksComplete);
			tasker.addEventListener(ErrorEvent.ERROR, setupTasksFailed);
			
			setupTasks();
			
			tasker.runTasks();
		}
		
		protected function setupTasks():void {
			tasker.queueTask(loadConfig, loadConfigComplete);
			tasker.queueTask(loadSkin);
			tasker.queueTask(setupMediaProviders);
			tasker.queueTask(setupView);
			tasker.queueTask(loadPlugins, loadPluginsComplete);
			tasker.queueTask(loadPlaylist, loadPlaylistComplete);
			tasker.queueTask(loadPreview);
			tasker.queueTask(initPlugins);
		}
		
		protected function setupTasksComplete(evt:Event):void {
			complete();
		}
		
		protected function setupTasksFailed(evt:ErrorEvent):void {
			error(evt.text);
		}

		protected function complete():void {
			dispatchEvent(new Event(Event.COMPLETE));
		}
		
		protected function error(message:String):void {
			dispatchEvent(new ErrorEvent(ErrorEvent.ERROR, false, false, message));
		}
		
		///////////////////////
		// Tasks
		///////////////////////
		
		protected function loadConfig():void {
			var configger:Configger = new Configger();
			configger.addEventListener(Event.COMPLETE, tasker.success);
			configger.addEventListener(ErrorEvent.ERROR, tasker.failure);

			try {
				configger.loadConfig();
			} catch (e:Error) {
				error(e.message);
			}
		}

		protected function loadConfigComplete(evt:Event):void {
			confHash = (evt.target as Configger).config;
			
			if (confHash['playlist'] && confHash['playlist'] is Array) {
				confPlaylist = confHash['playlist'];
				delete confHash['playlist'];
			}
		}

		protected function loadSkin():void {
			var skin:ISkin;
			if (confHash && confHash['skin']) {
				if (Strings.extension(confHash['skin']) == "xml") {
					skin = new PNGSkin();
				} else {
					tasker.failure(new ErrorEvent(ErrorEvent.ERROR, false, false, "Skin could not be loaded: Skin not a valid file type"));
					return;
				}
			} else {
				skin = new DefaultSkin();
			}
			skin.addEventListener(ErrorEvent.ERROR, tasker.failure);
			skin.addEventListener(Event.COMPLETE, skinLoaded);
			skin.load(confHash['skin']);
		}
		
		protected function skinLoaded(event:Event=null):void {
			var skin:ISkin = event.target as ISkin;
			skin.removeEventListener(Event.COMPLETE, skinLoaded);
			skin.removeEventListener(ErrorEvent.ERROR, tasker.failure);
			skin.removeEventListener(ErrorEvent.ERROR, loadSkin);

			if (!(skin is DefaultSkin)) {
				var defaultSkin:ISkin = new DefaultSkin();
				defaultSkin.addEventListener(Event.COMPLETE, function(evt:Event):void {
					for each (var component:String in defaultSkin.components) {
						if (skin.components.indexOf(component) < 0) {
							skin.overwriteComponent(component, defaultSkin.getSkinComponent(component));						
						}
					}
					loadSkinComplete(skin);
				});
				defaultSkin.load();
			} else {
				loadSkinComplete(skin);
			}
		}
		
		protected function loadSkinComplete(skin:ISkin):void {
			var props:SkinProperties = skin.getSkinProperties();
			_model.config.setConfig(props);
			_view.skin = skin;
			_model.config.setConfig(confHash);
			Logger.setConfig(_model.config);
			tasker.success();
		}

		protected function setupMediaProviders():void {
			_model.setupMediaProviders();
			tasker.success();
		}

		protected function setupView():void {
			try {
				_view.setupView();
				tasker.success();
			} catch (e:Error) {
				tasker.failure(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error setting up the player: " + e.message));
			}
		}
		
		protected function loadPlugins():void {
			if (_model.config.plugins) {
				var loader:PluginLoader = new PluginLoader();
				loader.addEventListener(Event.COMPLETE, tasker.success);
				loader.addEventListener(ErrorEvent.ERROR, tasker.failure);
				loader.loadPlugins(_model.config.plugins);
			} else {
				tasker.success();
			}
		}
		
		protected function loadPluginsComplete(event:Event=null):void {
			if (event) {
				var loader:PluginLoader = event.target as PluginLoader;

				for (var pluginId:String in loader.plugins) {
					var plugin:DisplayObject = loader.plugins[pluginId] as DisplayObject;
					if (plugin is IPlugin) {
						try {
							_view.addPlugin(pluginId, plugin as IPlugin);
						} catch (e:Error) {
							tasker.failure(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error loading plugin: " + e.message)); 
						}
							
					}
				}
			}
			
			// Compiled in plugins go here.  Example:
			//_view.addPlugin("test", new TestPlugin());
		}

		protected function loadPlaylist():void {
			_model.playlist.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_LOADED, tasker.success);
			_model.playlist.addEventListener(PlayerEvent.JWPLAYER_ERROR, tasker.failure);

			if (confPlaylist && confPlaylist.length > 0) {
				_model.playlist.load(confPlaylist);
			} else if (_model.config.playlist) {
				_model.playlist.load(_model.config.playlist);
			} else if (_model.config.singleItem.file) {
				_model.playlist.load(_model.config.singleItem);
			} else {
				tasker.success();
			}
		}

		protected function loadPlaylistComplete(event:Event=null):void {
			_model.playlist.removeEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_LOADED, tasker.success);
			_model.playlist.removeEventListener(PlayerEvent.JWPLAYER_ERROR, tasker.failure);
		}
		
		protected function loadPreview():void {
			if (_model.playlist.length > 0 && _model.playlist.currentItem.image && !_model.config.autostart) {
				imageLoader = new Loader();
				imageTimeout = new Timer(1000, 1);
				imageTimeout.addEventListener(TimerEvent.TIMER_COMPLETE, loadPreviewTimeout);
				imageLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, loadPreviewComplete);
				imageLoader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, loadPreviewComplete);
				
				imageTimeout.start();
				imageLoader.load(new URLRequest(_model.playlist.currentItem.image));
			} else {
				tasker.success();
			}
		}
		
		protected function loadPreviewComplete(evt:Event):void {
			if (imageTimeout.running) {
				imageTimeout.stop();
				tasker.success();
			}
		}

		protected function loadPreviewTimeout(evt:TimerEvent):void {
			imageLoader.contentLoaderInfo.removeEventListener(Event.COMPLETE, loadPreviewComplete);
			imageLoader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR, loadPreviewComplete);
			tasker.success();
		}

		
		protected function initPlugins():void {
			for each (var pluginId:String in _view.loadedPlugins()) {
				try {
					var plugin:IPlugin6 = _view.getPlugin(pluginId);
					if (!PlayerVersion.versionCheck(plugin['target'])) {
						tasker.failure(new ErrorEvent(ErrorEvent.ERROR, false, false, "Error loading plugin: Incompatible player version"));
						return;
					}
					plugin.initPlugin(_player, _model.config.pluginConfig(pluginId));
				} catch (e:Error) {
					Logger.log("Error initializing plugin: " + e.message);
					if (plugin) {
						_view.removePlugin(plugin);
					}
				}
			}
			tasker.success();
		}

	}
}
