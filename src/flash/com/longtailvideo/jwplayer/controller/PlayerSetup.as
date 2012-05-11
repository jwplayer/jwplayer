package com.longtailvideo.jwplayer.controller {
	import com.jeroenwijering.events.PluginInterface;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.events.PlaylistEvent;
	import com.longtailvideo.jwplayer.model.Model;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.plugins.PluginConfig;
	import com.longtailvideo.jwplayer.plugins.V4Plugin;
	import com.longtailvideo.jwplayer.utils.Configger;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.Strings;
	import com.longtailvideo.jwplayer.view.View;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	import com.longtailvideo.jwplayer.view.skins.DefaultSkin;
	import com.longtailvideo.jwplayer.view.skins.PNGSkin;
	import com.longtailvideo.jwplayer.view.skins.SWFSkin;
	import com.longtailvideo.jwplayer.view.skins.SkinProperties;
	import com.longtailvideo.jwplayer.view.skins.ZIPSkin;
	
	import flash.display.DisplayObject;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.TimerEvent;
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
		
		/** JSON Playlist passed in **/
		protected var confPlaylist:Array;
		
		public function PlayerSetup(player:IPlayer, model:Model, view:View) {
			_player = player;
			_model = model;
			_view = view;
		}
		
		public function setupPlayer():void {
			tasker = new TaskQueue(false);
			tasker.addEventListener(Event.COMPLETE, setupTasksComplete);
			tasker.addEventListener(ErrorEvent.ERROR, setupTasksFailed);
			
			tasker.queueTask(loadConfig, loadConfigComplete);
			tasker.queueTask(loadSkin, loadSkinComplete);
			tasker.queueTask(setupMediaProviders);
			tasker.queueTask(setupView);
			tasker.queueTask(loadPlugins, loadPluginsComplete);
			tasker.queueTask(loadPlaylist, loadPlaylistComplete);
			tasker.queueTask(initPlugins);
			
			tasker.runTasks();
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

		protected function loadSkin(evt:ErrorEvent=null):void {
			var skin:ISkin;
			if (confHash && confHash['skin'] && evt == null) {
				if (Strings.extension(confHash['skin']) == "swf") {
					skin = new SWFSkin();
				} else if (Strings.extension(confHash['skin']) == "zip") {
					skin = new ZIPSkin();
				} else if (Strings.extension(confHash['skin']) == "xml") {
					skin = new PNGSkin();
				} else {
					Logger.log("Could not load skin " + confHash['skin']);
				}
			}
			if (skin) {
				// If this step fails, load the default skin instead
				skin.addEventListener(ErrorEvent.ERROR, loadSkin);
			} else {
				if (evt) { 
					Logger.log("Error loading skin: " + evt.text);
					(evt.target as EventDispatcher).removeEventListener(ErrorEvent.ERROR, loadSkin);
				}
				skin = new DefaultSkin();
				skin.addEventListener(ErrorEvent.ERROR, tasker.failure);
			}
			skin.addEventListener(Event.COMPLETE, tasker.success);
			skin.load(confHash['skin']);
		}
		
		protected function loadSkinComplete(event:Event=null):void {
			if (event) {
				var skin:ISkin = event.target as ISkin;
				skin.removeEventListener(Event.COMPLETE, tasker.success);
				skin.removeEventListener(ErrorEvent.ERROR, tasker.failure);
				skin.removeEventListener(ErrorEvent.ERROR, loadSkin);

				var props:SkinProperties = skin.getSkinProperties();
				_model.config.setConfig(props);
				_model.config.setConfig(confHash);
				_view.skin = skin;
			} else {
				_model.config.setConfig(confHash);
			}
			Logger.setConfig(_model.config);
		}

		protected function setupMediaProviders():void {
			_model.setupMediaProviders();
			tasker.success();
		}

		protected function setupView():void {
			try {
				_view.setupView();
			} catch (e:Error) {
				tasker.failure(new ErrorEvent(ErrorEvent.ERROR, false, false, "View setup failed: " + e.message));
			}
			tasker.success();
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
						_view.addPlugin(pluginId, plugin as IPlugin);
					} else if (plugin is PluginInterface) {
						if ( (plugin as Object).hasOwnProperty('config') ) {
							var loadedConf:Object = (plugin as Object).config;
							var pluginConf:PluginConfig = _model.config.pluginConfig(pluginId);
							for (var i:String in loadedConf) {
								if (!pluginConf.hasOwnProperty(i)) pluginConf[i] = loadedConf[i];
							}
							pluginConf['width'] = _player.controls.display.width;
							pluginConf['height'] = _player.controls.display.height;
							pluginConf['visible'] = true;
						}
						_view.addPlugin(pluginId, new V4Plugin(plugin as PluginInterface, pluginId));
					}
				}
			}
			
			// Compiled in plugins go here.  Example:
			// _view.addPlugin("test", new TestPlugin());
		}

		protected function loadPlaylist():void {
			_model.playlist.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_LOADED, tasker.success);
			_model.playlist.addEventListener(PlayerEvent.JWPLAYER_ERROR, tasker.failure);

			if (confPlaylist && confPlaylist.length > 0) {
				_model.playlist.load(confPlaylist);
			} else if (_model.config.playlistfile) {
				_model.playlist.load(_model.config.playlistfile);
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

		protected function initPlugins():void {
			for each (var pluginId:String in _view.loadedPlugins()) {
				try {
					var plugin:IPlugin = _view.getPlugin(pluginId);
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