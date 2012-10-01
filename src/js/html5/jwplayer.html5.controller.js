/**
 * jwplayer.html5 API
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	var html5 = jwplayer.html5,
		utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state;
		
	html5.controller = function(model, view) {
		var _model = model,
			_view = view,
			_video = model.getVideo(),
			_controller = this,
			_eventDispatcher = new events.eventdispatcher(_model.id, _model.config.debug),
			_ready = false,
			_loadOnPlay = -1,
			_preplay, 
			_actionOnAttach, 
			_interruptPlay,
			_queuedCalls = [];
		
		utils.extend(this, _eventDispatcher);

		function _init() {
			_model.addEventListener(events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
			_model.addEventListener(events.JWPLAYER_MEDIA_COMPLETE, function(evt) {
				// Insert a small delay here so that other complete handlers can execute
				setTimeout(_completeHandler, 25);
			});
		}
		
		function _playerReady(evt) {
			if (!_ready) {
				_ready = true;
				
				_view.completeSetup();
				_eventDispatcher.sendEvent(evt.type, evt);

				if (jwplayer.utils.exists(window.jwplayer.playerReady)) {
					jwplayer.playerReady(evt);
				}

				_model.addGlobalListener(_forward);
				_view.addGlobalListener(_forward);

				_eventDispatcher.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_LOADED, {playlist: _model.playlist});
				_eventDispatcher.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_ITEM, {index: _model.item});
				
				_load();
				
				if (_model.autostart && !utils.isMobile()) {
					_play();
				}
				
				while (_queuedCalls.length > 0) {
					var queuedCall = _queuedCalls.shift();
					_callMethod(queuedCall.method, queuedCall.arguments);
				}
			}
		}

		
		function _forward(evt) {
			_eventDispatcher.sendEvent(evt.type, evt);
		}
		
		function _bufferFullHandler(evt) {
			_video.play();
		}

		function _load(item) {
			_stop();
			
			switch (utils.typeOf(item)) {
			case "string":
				_loadPlaylist(item);
				break;
			case "object":
			case "array":
				_model.setPlaylist(new jwplayer.playlist(item));
				break;
			case "number":
				_model.setItem(item);
				break;
			}
		}
		
		function _loadPlaylist(playlist) {
			var loader = new html5.playlistloader();
			loader.addEventListener(events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
				_load(evt.playlist);
			});
			loader.addEventListener(events.JWPLAYER_ERROR, function(evt) {
				_load([]);
				evt.message = "Could not load playlist: " + evt.message; 
				_forward(evt);
			});
			loader.load(playlist);
		}
		
		function _play(state) {
			if (!utils.exists(state)) state = true;
			if (!state) return _pause();
			try {
				if (_loadOnPlay >= 0) {
					_load(_loadOnPlay);
					_loadOnPlay = -1;
				}
				_actionOnAttach = _play;
				if (!_preplay) {
					_preplay = true;
					_eventDispatcher.sendEvent(events.JWPLAYER_MEDIA_BEFOREPLAY);
					_preplay = false;
					if (_interruptPlay) {
						_interruptPlay = false;
						_actionOnAttach = null;
						return;
					}
				}
				
				if (_isIdle()) {
					if (_model.playlist.length == 0) return false;
					_video.load(_model.playlist[_model.item]);
				} else if (_model.state == states.PAUSED) {
					_video.play();
				}
				
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, err);
				_actionOnAttach = null;
			}
			return false;
		}

		function _stop() {
			_actionOnAttach = null;
			try {
				if (!_isIdle()) {
					_video.stop();
				}
				if (_preplay) {
					_interruptPlay = true;
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, err);
			}
			return false;

		}

		function _pause(state) {
			if (!utils.exists(state)) state = true;
			if (!state) return _play();
			try {
				switch (_model.state) {
					case states.PLAYING:
					case states.BUFFERING:
						_video.pause();
						break;
					default:
						if (_preplay) {
							_interruptPlay = true;
						}
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(events.JWPLAYER_ERROR, err);
			}
			return false;

			
			if (_model.state == states.PLAYING || _model.state == states.BUFFERING) {
				_video.pause();
			}
		}
		
		function _isIdle() {
			return (_model.state == states.IDLE);
		}
		
		function _seek(pos) {
			if (_model.state != states.PLAYING) _play(true);
			_video.seek(pos);
		}
		
		function _setFullscreen(state) {
			_view.fullscreen(state);
		}

		function _setStretching(stretching) {
			_model.stretching = stretching;
			// TODO: Send stretching event
			_view.resize();
		}

		function _item(index) {
			_load(index);
			_play();
		}
		
		function _prev() {
			_item(_model.item - 1);
		}
		
		function _next() {
			_item(_model.item + 1);
		}
		
		function _completeHandler() {
			if (!_isIdle()) {
				// Something has made an API call before the complete handler has fired.
				return;
			}
			_actionOnAttach = _completeHandler;
			if (_model.repeat) {
				_next();
			} else {
				if (_model.item == _model.playlist.length - 1) {
					_loadOnPlay = 0;
					_stop();
					setTimeout(function() { _eventDispatcher.sendEvent(events.JWPLAYER_PLAYLIST_COMPLETE)}, 0);
				} else {
					_next();
				}
			}
		}
		
		function _setCurrentQuality(quality) {
			_video.setCurrentQuality(quality);
		}

		function _getCurrentQuality() {
			if (_video) return _video.getCurrentQuality();
			else return -1;
		}

		function _getQualityLevels() {
			if (_video) return _video.getQualityLevels();
			else return null;
		}

		function _setCurrentCaptions(caption) {
			_view.setCurrentCaptions(caption);
		}

		function _getCurrentCaptions() {
			return _view.getCurrentCaptions();
		}

		function _getCaptionsList() {
			return _view.getCaptionsList();
		}

		/** Used for the InStream API **/
		function _detachMedia() {
			try {
				return _model.getVideo().detachMedia();
			} catch (err) {
				return null;
			}
		}

		function _attachMedia() {
			try {
				var ret = _model.getVideo().attachMedia();
				if (typeof _actionOnAttach == "function") {
					_actionOnAttach();
				}
			} catch (err) {
				return null;
			}
		}
		
		function _waitForReady(func) {
			return function() {
				if (_ready) {
					_callMethod(func, arguments);
				} else {
					_queuedCalls.push({ method: func, arguments: arguments});
				}
			}
		}
		
		function _callMethod(func, args) {
			var _args = [];
			for (i=0; i < args.length; i++) {
				_args.push(args[i]);
			}
			func.apply(this, _args);
		}

		/** Controller API / public methods **/
		this.play = _waitForReady(_play);
		this.pause = _waitForReady(_pause);
		this.seek = _waitForReady(_seek);
		this.stop = _waitForReady(_stop);
		this.load = _waitForReady(_load);
		this.next = _waitForReady(_next);
		this.prev = _waitForReady(_prev);
		this.item = _waitForReady(_item);
		this.setVolume = _waitForReady(_model.setVolume);
		this.setMute = _waitForReady(_model.setMute);
		this.setFullscreen = _waitForReady(_setFullscreen);
		this.setStretching = _waitForReady(_setStretching);
		this.detachMedia = _detachMedia; 
		this.attachMedia = _attachMedia;
		this.setCurrentQuality = _waitForReady(_setCurrentQuality);
		this.getCurrentQuality = _getCurrentQuality;
		this.getQualityLevels = _getQualityLevels;
		this.setCurrentCaptions = _waitForReady(_setCurrentCaptions);
		this.getCurrentCaptions = _getCurrentCaptions;
		this.getCaptionsList = _getCaptionsList;
		
		this.playerReady = _playerReady;

		_init();
	}
	
})(jwplayer);

