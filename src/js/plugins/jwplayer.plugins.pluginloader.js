/**
 * Loads plugins for a player
 * @author zach
 * @version 5.6
 */
(function(jwplayer) {

	jwplayer.plugins.pluginloader = function(model, config) {
		var _plugins = {};
		var _status = jwplayer.utils.loaderstatus.NEW;
		var _loading = false;
		var _iscomplete = false;
		var _eventDispatcher = new jwplayer.events.eventdispatcher();
		jwplayer.utils.extend(this, _eventDispatcher);
		
		/*
		 * Plugins can be loaded by multiple players on the page, but all of them use
		 * the same plugin model singleton. This creates a race condition because
		 * multiple players are creating and triggering loads, which could complete
		 * at any time. We could have some really complicated logic that deals with
		 * this by checking the status when it's created and / or having the loader
		 * redispatch its current status on load(). Rather than do this, we just check
		 * for completion after all of the plugins have been created. If all plugins
		 * have been loaded by the time checkComplete is called, then the loader is
		 * done and we fire the complete event. If there are new loads, they will
		 * arrive later, retriggering the completeness check and triggering a complete
		 * to fire, if necessary.
		 */
		function _complete() {
			if (!_iscomplete) {
				_iscomplete = true;
				_status = jwplayer.utils.loaderstatus.COMPLETE;
				_eventDispatcher.sendEvent(jwplayer.events.COMPLETE);
			}
		}
		
		// This is not entirely efficient, but it's simple
		function _checkComplete() {
			if (!_iscomplete) {
				var incomplete = 0;
				for (plugin in _plugins) {
					var status = _plugins[plugin].getStatus(); 
					if (status == jwplayer.utils.loaderstatus.LOADING 
							|| status == jwplayer.utils.loaderstatus.NEW) {
						incomplete++;
					}
				}
				
				if (incomplete == 0) {
					_complete();
				}
			}
		}
		
		this.setupPlugins = function(api, config, resizer) {
			var flashPlugins = {
				length: 0,
				plugins: {}
			};
			var jsplugins = {
				length: 0,
				plugins: {}
			};
			for (var plugin in _plugins) {
				var pluginName = _plugins[plugin].getPluginName();
				if (_plugins[plugin].getFlashPath()) {
					flashPlugins.plugins[_plugins[plugin].getFlashPath()] = config.plugins[plugin];
					flashPlugins.plugins[_plugins[plugin].getFlashPath()].pluginmode = _plugins[plugin].getPluginmode();
					flashPlugins.length++;
				}
				if (_plugins[plugin].getJS()) {
					var div = document.createElement("div");
					div.id = api.id + "_" + pluginName;
					div.style.position = "absolute";
					div.style.zIndex = jsplugins.length + 10;
					jsplugins.plugins[pluginName] = _plugins[plugin].getNewInstance(api, config.plugins[plugin], div);
					jsplugins.length++;
					if (typeof jsplugins.plugins[pluginName].resize != "undefined") {
						api.onReady(resizer(jsplugins.plugins[pluginName], div, true));
						api.onResize(resizer(jsplugins.plugins[pluginName], div));
					}
				}
			}
			
			api.plugins = jsplugins.plugins;
			
			return flashPlugins;
		};
		
		this.load = function() {
			_status = jwplayer.utils.loaderstatus.LOADING;
			_loading = true;
			
			/** First pass to create the plugins and add listeners **/
			for (var plugin in config) {
				if (jwplayer.utils.exists(plugin)) {
					_plugins[plugin] = model.addPlugin(plugin);
					_plugins[plugin].addEventListener(jwplayer.events.COMPLETE, _checkComplete);
					_plugins[plugin].addEventListener(jwplayer.events.ERROR, _checkComplete);
				}
			}
			
			/** Second pass to actually load the plugins **/
			for (plugin in _plugins) {
				// Plugin object ensures that it's only loaded once
				_plugins[plugin].load();
			}
			
			_loading = false;
			
			// Make sure we're not hanging around waiting for plugins that already finished loading
			_checkComplete();
		}
		
		this.pluginFailed = function() {
			_complete();
		}
		
		this.getStatus = function() {
			return _status;
		}
		
	}
})(jwplayer);
