/**
 * Loads plugins for a player
 * @author zach
 * @version 5.6
 */
(function(jwplayer) {
	var utils = jwplayer.utils, events = jwplayer.events;

	jwplayer.plugins.pluginloader = function(model, config) {
		var _status = utils.loaderstatus.NEW,
			_loading = false,
			_iscomplete = false,
			_errorState = false,
			_errorMessage,
			_config = config,
			_eventDispatcher = new events.eventdispatcher();
		
		
		utils.extend(this, _eventDispatcher);
		
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
			if (_errorState) {
				_eventDispatcher.sendEvent(events.ERROR, {message: _errorMessage});
			} else if (!_iscomplete) {
				_iscomplete = true;
				_status = utils.loaderstatus.COMPLETE;
				_eventDispatcher.sendEvent(events.COMPLETE);
			}
		}
		
		// This is not entirely efficient, but it's simple
		function _checkComplete() {
			if (!_config) _complete();
			if (!_iscomplete && !_errorState) {
				var incomplete = 0, plugins = model.getPlugins();
				
				for (var plugin in _config) {
					var pluginName = utils.getPluginName(plugin),
						pluginObj = plugins[pluginName],
						js = pluginObj.getJS(),
						target = pluginObj.getTarget(),
						status = pluginObj.getStatus(); 
					if (status == utils.loaderstatus.LOADING || status == utils.loaderstatus.NEW) {
						incomplete++;
					} else if (js && (!target || parseFloat(target) > parseFloat(jwplayer.version))) {
						_errorState = true;
						_errorMessage = "Incompatible player version";
						_complete();
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
			},
			jsplugins = {
				length: 0,
				plugins: {}
			},

			plugins = model.getPlugins();
			
			for (var plugin in config.plugins) {
				var pluginName = utils.getPluginName(plugin),
					pluginObj = plugins[pluginName],
					flashPath = pluginObj.getFlashPath(),
					jsPlugin = pluginObj.getJS(),
					pluginURL = pluginObj.getURL();
				

				if (flashPath) {
					flashPlugins.plugins[flashPath] = utils.extend({}, config.plugins[plugin]);
					flashPlugins.plugins[flashPath].pluginmode = pluginObj.getPluginmode();
					flashPlugins.length++;
				}

				if (jsPlugin && config.plugins && config.plugins[pluginURL]) {
					var div = document.createElement("div");
					div.id = api.id + "_" + pluginName;
					div.style.position = "absolute";
					div.style.top = 0;
					div.style.zIndex = jsplugins.length + 10;
					jsplugins.plugins[pluginName] = pluginObj.getNewInstance(api, utils.extend({}, config.plugins[pluginURL]), div);
					jsplugins.length++;
					api.onReady(resizer(jsplugins.plugins[pluginName], div, true));
					api.onResize(resizer(jsplugins.plugins[pluginName], div));
				}
			}
			
			api.plugins = jsplugins.plugins;
			
			return flashPlugins;
		};
		
		this.load = function() {
			// Must be a hash map
			if (utils.exists(config) && utils.typeOf(config) != "object") {
				_checkComplete();
				return;
			}
			
			_status = utils.loaderstatus.LOADING;
			_loading = true;
			
			/** First pass to create the plugins and add listeners **/
			for (var plugin in config) {
				if (utils.exists(plugin)) {
					var pluginObj = model.addPlugin(plugin);
					pluginObj.addEventListener(events.COMPLETE, _checkComplete);
					pluginObj.addEventListener(events.ERROR, _pluginError);
				}
			}
			
			var plugins = model.getPlugins();
			
			/** Second pass to actually load the plugins **/
			for (plugin in plugins) {
				// Plugin object ensures that it's only loaded once
				plugins[plugin].load();
			}
			
			_loading = false;
			
			// Make sure we're not hanging around waiting for plugins that already finished loading
			_checkComplete();
		}
		
		var _pluginError = this.pluginFailed = function(evt) {
			if (!_errorState) {
				_errorState = true;
				_errorMessage = "File not found";
				_complete();
			}
		}
		
		this.getStatus = function() {
			return _status;
		}
		
	}
})(jwplayer);
