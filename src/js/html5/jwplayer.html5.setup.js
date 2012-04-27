/**
 * This class is responsible for setting up the player and triggering the PLAYER_READY event, or an JWPLAYER_ERROR event
 * 
 * The order of the player setup is as follows:
 * 
 * 1. parse config
 * 2. load skin (async)
 * 3. load external playlist (async)
 * 4. load preview image (requires 3)
 * 5. initialize components (requires 2)
 * 6. initialize plugins (requires 5)
 * 7. ready
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, _utils = _jw.utils, _events = _jw.events,
	
		PARSE_CONFIG = "config",
		LOAD_SKIN = "skin",
		LOAD_PLAYLIST = "playlist",
		LOAD_PREVIEW = "preview",
		SETUP_COMPONENTS = "components",
		INIT_PLUGINS = "plugins",
		SEND_READY = "ready";

	html5.setup = function(model, view, controller) {
		var _model = model, 
			_view = view,
			_controller = controller,
			_completed = {},
			_depends = {},
			_skin,
			_eventDispatcher = new _events.eventdispatcher(),
			_errorState = false,
			_queue = [];
			
		function _initQueue() {
			_addTask(PARSE_CONFIG, _parseConfig);
			_addTask(LOAD_SKIN, _loadSkin, PARSE_CONFIG);
			_addTask(LOAD_PLAYLIST, _loadPlaylist, PARSE_CONFIG);
			_addTask(LOAD_PREVIEW, _loadPreview, LOAD_PLAYLIST);
			_addTask(SETUP_COMPONENTS, _setupComponents, LOAD_SKIN);
			_addTask(INIT_PLUGINS, _initPlugins, SETUP_COMPONENTS + "," + LOAD_PLAYLIST);
			_addTask(SEND_READY, _sendReady, INIT_PLUGINS);
		}
		
		function _addTask(name, method, depends) {
			_queue.push({name:name, method:method, depends:depends});
		}

		function _nextTask() {
			for (var i=0; i < _queue.length; i++) {
				var task = _queue[i];
				if (_allComplete(task.depends)) {
					_queue.splice(i, 1);
					try {
						task.method();
						_nextTask();
					} catch(error) {
						_error(error.message);
					}
					return;
				}
			}
			if (_queue.length > 0 && !_errorState) {
				// Still waiting for a dependency to come through; wait a little while.
				setTimeout(_nextTask, 500);
			}
		}
		
		function _allComplete(dependencies) {
			if (!dependencies) return true;
			var split = dependencies.split(",");
			for (var i=0; i<split.length; i++) {
				if (!_completed[split[i]])
					return false;
			}
			return true;
		}

		function _taskComplete(name) {
			_completed[name] = true;
		}
		
		function _parseConfig() {
			_taskComplete(PARSE_CONFIG);
		}
		
		function _loadSkin() {
			_skin = new html5.skin();
			_skin.load(_model.config.skin, _skinLoaded);
		}
		
		function _skinLoaded(skin) {
			_taskComplete(LOAD_SKIN);
		}
		
		function _loadPlaylist() {
			switch(_utils.typeOf(_model.config.playlist)) {
			case "string":
				var loader = new html5.playlistloader();
				loader.addEventListener(_events.JWPLAYER_PLAYLIST_LOADED, _playlistLoaded);
				loader.addEventListener(_events.JWPLAYER_ERROR, _playlistError);
				loader.load(_model.config.playlist);
				break;
			case "array":
				_model.playlist = new html5.playlist(_model.config.playlist);
				_taskComplete(LOAD_PLAYLIST);
			}
		}
		
		function _playlistLoaded(evt) {
			_model.playlist = evt.playlist;
			_taskComplete(LOAD_PLAYLIST);
		}

		function _playlistError(evt) {
			_error(evt.message);
		}
		
		function _loadPreview() {
			var preview = _model.playlist[_model.item].image; 
			if (preview) {
				var img = new Image();
				img.addEventListener('load', _previewLoaded, false);
				// If there was an error, continue anyway
				img.addEventListener('error', _previewLoaded, false);
				img.src = preview; 
			}
		}
		
		function _previewLoaded(evt) {
			_taskComplete(LOAD_PREVIEW);
		}

		function _setupComponents() {
			_view.setup(_skin);
			_taskComplete(SETUP_COMPONENTS);
		}

		function _initPlugins() {
			_taskComplete(INIT_PLUGINS);
		}

		function _sendReady() {
			_eventDispatcher.sendEvent(_events.JWPLAYER_READY);
			_taskComplete(SEND_READY);
		}
		
		function _error(message) {
			_errorState = true;
			_eventDispatcher.sendEvent(_events.JWPLAYER_ERROR, {message: message});		
		}
		
		_utils.extend(this, _eventDispatcher);
		
		this.start = _nextTask;
		
		_initQueue();
	}

})(jwplayer.html5);

