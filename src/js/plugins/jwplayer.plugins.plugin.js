/**
 * Internal plugin model
 * @author zach
 * @version 5.8
 */
(function(plugins) {
	var utils = jwplayer.utils, events = jwplayer.events, UNDEFINED = "undefined";
	
	plugins.pluginmodes = {
		FLASH: 0,
		JAVASCRIPT: 1,
		HYBRID: 2
	}
	
	plugins.plugin = function(url) {
		var _status = utils.loaderstatus.NEW,
			_flashPath,
			_js,
			_target,
			_completeTimeout;
		
		var _eventDispatcher = new events.eventdispatcher();
		utils.extend(this, _eventDispatcher);
		
		function getJSPath() {
			switch (utils.getPluginPathType(url)) {
				case utils.pluginPathType.ABSOLUTE:
					return url;
				case utils.pluginPathType.RELATIVE:
					return utils.getAbsolutePath(url, window.location.href);
//				case utils.pluginPathType.CDN:
//					_status = utils.loaderstatus.COMPLETE;
//					var pluginName = utils.getPluginName(url);
//					var pluginVersion = utils.getPluginVersion(url);
					//var repo = (window.location.href.indexOf("https://") == 0) ? _repo.replace("http://", "https://secure") : _repo;
//					return repo + "/" + jwplayer.version.split(".")[0] + "/" + pluginName + "/" 
//							+ pluginName + (pluginVersion !== "" ? ("-" + pluginVersion) : "") + ".js";
			}
		}
		
		function completeHandler(evt) {
			_completeTimeout = setTimeout(function(){
				_status = utils.loaderstatus.COMPLETE;
				_eventDispatcher.sendEvent(events.COMPLETE);		
			}, 1000);
		}
		
		function errorHandler(evt) {
			_status = utils.loaderstatus.ERROR;
			_eventDispatcher.sendEvent(events.ERROR);
		}
		
		this.load = function() {
			if (_status == utils.loaderstatus.NEW) {
				if (url.lastIndexOf(".swf") > 0) {
					_flashPath = url;
					_status = utils.loaderstatus.COMPLETE;
					_eventDispatcher.sendEvent(events.COMPLETE);
					return;
				} else if (utils.getPluginPathType(url) == utils.pluginPathType.CDN) {
					_status = utils.loaderstatus.COMPLETE;
					_eventDispatcher.sendEvent(events.COMPLETE);
					return;
				}
				_status = utils.loaderstatus.LOADING;
				var _loader = new utils.scriptloader(getJSPath());
				// Complete doesn't matter - we're waiting for registerPlugin 
				_loader.addEventListener(events.COMPLETE, completeHandler);
				_loader.addEventListener(events.ERROR, errorHandler);
				_loader.load();
			}
		}
		
		this.registerPlugin = function(id, target, arg1, arg2) {
			if (_completeTimeout){
				clearTimeout(_completeTimeout);
				_completeTimeout = undefined;
			}
			_target = target;
			if (arg1 && arg2) {
				_flashPath = arg2;
				_js = arg1;
			} else if (typeof arg1 == "string") {
				_flashPath = arg1;
			} else if (typeof arg1 == "function") {
				_js = arg1;
			} else if (!arg1 && !arg2) {
				_flashPath = id;
			}
			_status = utils.loaderstatus.COMPLETE;
			_eventDispatcher.sendEvent(events.COMPLETE);
		}
		
		this.getStatus = function() {
			return _status;
		}
		
		this.getPluginName = function() {
			return utils.getPluginName(url);
		}
		
		this.getFlashPath = function() {
			if (_flashPath) {
				switch (utils.getPluginPathType(_flashPath)) {
					case utils.pluginPathType.ABSOLUTE:
						return _flashPath;
					case utils.pluginPathType.RELATIVE:
						if (url.lastIndexOf(".swf") > 0) {
							return utils.getAbsolutePath(_flashPath, window.location.href);
						}
						return utils.getAbsolutePath(_flashPath, getJSPath());
//					case utils.pluginPathType.CDN:
//						if (_flashPath.indexOf("-") > -1){
//							return _flashPath+"h";
//						}
//						return _flashPath+"-h";
				}
			}
			return null;
		}
		
		this.getJS = function() {
			return _js;
		}
		
		this.getTarget = function() {
			return _target;
		}

		this.getPluginmode = function() {
			if (typeof _flashPath != UNDEFINED
			 && typeof _js != UNDEFINED) {
			 	return plugins.pluginmodes.HYBRID;
			 } else if (typeof _flashPath != UNDEFINED) {
			 	return plugins.pluginmodes.FLASH;
			 } else if (typeof _js != UNDEFINED) {
			 	return plugins.pluginmodes.JAVASCRIPT;
			 }
		}
		
		this.getNewInstance = function(api, config, div) {
			return new _js(api, config, div);
		}
		
		this.getURL = function() {
			return url;
		}
	}
	
})(jwplayer.plugins);
