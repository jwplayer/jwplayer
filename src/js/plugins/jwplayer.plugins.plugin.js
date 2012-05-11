/**
 * Internal plugin model
 * @author zach
 * @version 5.8
 */
(function(jwplayer) {
	jwplayer.plugins.pluginmodes = {
		FLASH: "FLASH",
		JAVASCRIPT: "JAVASCRIPT",
		HYBRID: "HYBRID"
	}
	
	jwplayer.plugins.plugin = function(url) {
		var _repo = "http://plugins.longtailvideo.com"
		var _status = jwplayer.utils.loaderstatus.NEW;
		var _flashPath;
		var _js;
		var _completeTimeout;
		
		var _eventDispatcher = new jwplayer.events.eventdispatcher();
		jwplayer.utils.extend(this, _eventDispatcher);
		
		function getJSPath() {
			switch (jwplayer.utils.getPluginPathType(url)) {
				case jwplayer.utils.pluginPathType.ABSOLUTE:
					return url;
				case jwplayer.utils.pluginPathType.RELATIVE:
					return jwplayer.utils.getAbsolutePath(url, window.location.href);
				case jwplayer.utils.pluginPathType.CDN:
					var pluginName = jwplayer.utils.getPluginName(url);
					var pluginVersion = jwplayer.utils.getPluginVersion(url);
					var repo = (window.location.href.indexOf("https://") == 0) ? _repo.replace("http://", "https://secure") : _repo;
					return repo + "/" + jwplayer.version.split(".")[0] + "/" + pluginName + "/" 
							+ pluginName + (pluginVersion !== "" ? ("-" + pluginVersion) : "") + ".js";
			}
		}
		
		function completeHandler(evt) {
			_completeTimeout = setTimeout(function(){
				_status = jwplayer.utils.loaderstatus.COMPLETE;
				_eventDispatcher.sendEvent(jwplayer.events.COMPLETE);		
			}, 1000);
		}
		
		function errorHandler(evt) {
			_status = jwplayer.utils.loaderstatus.ERROR;
			_eventDispatcher.sendEvent(jwplayer.events.ERROR);
		}
		
		this.load = function() {
			if (_status == jwplayer.utils.loaderstatus.NEW) {
				if (url.lastIndexOf(".swf") > 0) {
					_flashPath = url;
					_status = jwplayer.utils.loaderstatus.COMPLETE;
					_eventDispatcher.sendEvent(jwplayer.events.COMPLETE);
					return;
				}
				_status = jwplayer.utils.loaderstatus.LOADING;
				var _loader = new jwplayer.utils.scriptloader(getJSPath());
				// Complete doesn't matter - we're waiting for registerPlugin 
				_loader.addEventListener(jwplayer.events.COMPLETE, completeHandler);
				_loader.addEventListener(jwplayer.events.ERROR, errorHandler);
				_loader.load();
			}
		}
		
		this.registerPlugin = function(id, arg1, arg2) {
			if (_completeTimeout){
				clearTimeout(_completeTimeout);
				_completeTimeout = undefined;
			}
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
			_status = jwplayer.utils.loaderstatus.COMPLETE;
			_eventDispatcher.sendEvent(jwplayer.events.COMPLETE);
		}
		
		this.getStatus = function() {
			return _status;
		}
		
		this.getPluginName = function() {
			return jwplayer.utils.getPluginName(url);
		}
		
		this.getFlashPath = function() {
			if (_flashPath) {
				switch (jwplayer.utils.getPluginPathType(_flashPath)) {
					case jwplayer.utils.pluginPathType.ABSOLUTE:
						return _flashPath;
					case jwplayer.utils.pluginPathType.RELATIVE:
						if (url.lastIndexOf(".swf") > 0) {
							return jwplayer.utils.getAbsolutePath(_flashPath, window.location.href);
						}
						return jwplayer.utils.getAbsolutePath(_flashPath, getJSPath());
					case jwplayer.utils.pluginPathType.CDN:
						if (_flashPath.indexOf("-") > -1){
							return _flashPath+"h";
						}
						return _flashPath+"-h";
				}
			}
			return null;
		}
		
		this.getJS = function() {
			return _js;
		}

		this.getPluginmode = function() {
			if (typeof _flashPath != "undefined"
			 && typeof _js != "undefined") {
			 	return jwplayer.plugins.pluginmodes.HYBRID;
			 } else if (typeof _flashPath != "undefined") {
			 	return jwplayer.plugins.pluginmodes.FLASH;
			 } else if (typeof _js != "undefined") {
			 	return jwplayer.plugins.pluginmodes.JAVASCRIPT;
			 }
		}
		
		this.getNewInstance = function(api, config, div) {
			return new _js(api, config, div);
		}
		
		this.getURL = function() {
			return url;
		}
	}
	
})(jwplayer);
