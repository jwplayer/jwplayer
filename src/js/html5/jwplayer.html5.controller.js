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
		states = events.state,
		playlist = jwplayer.playlist,
		TRUE = true,
		FALSE = false;
		
	html5.controller = function(_model, _view) {
		var _ready = FALSE,
			_loadOnPlay = -1,
			_preplay = FALSE,
			_actionOnAttach,
			_stopPlaylist = FALSE,
			_interruptPlay,
			_queuedCalls = [],
			_this = utils.extend(this, new events.eventdispatcher(_model.id, _model.config.debug));

		function _init() {
			_model.addEventListener(events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
			_model.addEventListener(events.JWPLAYER_MEDIA_COMPLETE, function() {
				// Insert a small delay here so that other complete handlers can execute
				setTimeout(_completeHandler, 25);
			});
			_model.addEventListener(events.JWPLAYER_MEDIA_ERROR, function(evt) {
				// Re-dispatch media errors as general error
				var evtClone = utils.extend({}, evt);
				evtClone.type = events.JWPLAYER_ERROR;
				_this.sendEvent(evtClone.type, evtClone);
			});
		}
		
		function _video() {
			return _model.getVideo();
		}
		
		function _playerReady(evt) {
			if (!_ready) {
				
				_view.completeSetup();
				_this.sendEvent(evt.type, evt);

				if (jwplayer.utils.exists(jwplayer.playerReady)) {
					jwplayer.playerReady(evt);
				}

				_model.addGlobalListener(_forward);
				_view.addGlobalListener(_forward);

				_this.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_LOADED, {playlist: jwplayer(_model.id).getPlaylist()});
				_this.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_ITEM, {index: _model.item});
				
				_load();
				
				if (_model.autostart && !utils.isMobile()) {
					_play();
				}
				
				_ready = TRUE;
				
				while (_queuedCalls.length > 0) {
					var queuedCall = _queuedCalls.shift();
					_callMethod(queuedCall.method, queuedCall.arguments);
				}
			}
		}

		
		function _forward(evt) {
			_this.sendEvent(evt.type, evt);
		}
		
		function _bufferFullHandler() {
			_video().play();
		}

		function _load(item) {
			_stop(TRUE);
			
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
		
		function _loadPlaylist(toLoad) {
			var loader = new playlist.loader();
			loader.addEventListener(events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
				_load(evt.playlist);
			});
			loader.addEventListener(events.JWPLAYER_ERROR, function(evt) {
				_load([]);
				evt.message = "Could not load playlist: " + evt.message; 
				_forward(evt);
			});
			loader.load(toLoad);
		}
		
		function _play(state) {
			if (!utils.exists(state)) state = TRUE;
			if (!state) return _pause();
			try {
				if (_loadOnPlay >= 0) {
					_load(_loadOnPlay);
					_loadOnPlay = -1;
				}
				//_actionOnAttach = _play;
				if (!_preplay) {
					_preplay = TRUE;
					_this.sendEvent(events.JWPLAYER_MEDIA_BEFOREPLAY);
					_preplay = FALSE;
					if (_interruptPlay) {
						_interruptPlay = FALSE;
						_actionOnAttach = null;
						return;
					}
				}
				
				if (_isIdle()) {
					if (_model.playlist.length === 0) {
						return FALSE;
					}
					_video().load(_model.playlist[_model.item]);
				} else if (_model.state == states.PAUSED) {
					_video().play();
				}
				
				return TRUE;
			} catch (err) {
				_this.sendEvent(events.JWPLAYER_ERROR, err);
				_actionOnAttach = null;
			}
			return FALSE;
		}

		function _stop(internal) {
			_actionOnAttach = null;
			try {
				if (!_isIdle()) {
					_video().stop();
				} else if (!internal) {
					_stopPlaylist = TRUE;
				}
				if (_preplay) {
					_interruptPlay = TRUE;
				}
				return TRUE;
			} catch (err) {
				_this.sendEvent(events.JWPLAYER_ERROR, err);
			}
			return FALSE;

		}

		function _pause(state) {
		    _actionOnAttach = null;
			if (!utils.exists(state)) state = TRUE;
			if (!state) return _play();
			try {
				switch (_model.state) {
					case states.PLAYING:
					case states.BUFFERING:
						_video().pause();
						break;
					default:
						if (_preplay) {
							_interruptPlay = TRUE;
						}
				}
				return TRUE;
			} catch (err) {
				_this.sendEvent(events.JWPLAYER_ERROR, err);
			}
			
			return FALSE;
		}
		
		function _isIdle() {
			return (_model.state == states.IDLE);
		}
		
		function _seek(pos) {
			if (_model.state != states.PLAYING) _play(TRUE);
			_video().seek(pos);
		}

		function _setFullscreen(state) {
			_view.fullscreen(state);
		}

		function _item(index) {
			utils.css.block(_model.id + '_next');
			_load(index);
			_play();
			utils.css.unblock(_model.id + '_next');
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
			} else if (_stopPlaylist) {
				// Stop called in onComplete event listener
				_stopPlaylist = FALSE;
				return;
			}
			
			_actionOnAttach = _completeHandler;
			if (_model.repeat) {
				_next();
			} else {
				if (_model.item == _model.playlist.length - 1) {
					_loadOnPlay = 0;
					_stop(TRUE);
					setTimeout(function() {
						_this.sendEvent(events.JWPLAYER_PLAYLIST_COMPLETE);
					}, 0);
				} else {
					_next();
				}
			}
		}
		
		function _setCurrentQuality(quality) {
			_video().setCurrentQuality(quality);
		}

		function _getCurrentQuality() {
			if (_video()) return _video().getCurrentQuality();
			else return -1;
		}

		function _getQualityLevels() {
			if (_video()) return _video().getQualityLevels();
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

		function _attachMedia(seekable) {
			try {
				_model.getVideo().attachMedia(seekable);
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
			};
		}
		
		function _callMethod(func, args) {
			var _args = [], i;
			for (i=0; i < args.length; i++) {
				_args.push(args[i]);
			}
			func.apply(this, _args);
		}

		/** Controller API / public methods **/
		this.play = _waitForReady(_play);
		this.pause = _waitForReady(_pause);
		this.seek = _waitForReady(_seek);
		this.stop = function() {
			// Something has called stop() in an onComplete handler
			_stopPlaylist = TRUE;
			_waitForReady(_stop)();
		};
		this.load = _waitForReady(_load);
		this.next = _waitForReady(_next);
		this.prev = _waitForReady(_prev);
		this.item = _waitForReady(_item);
		this.setVolume = _waitForReady(_model.setVolume);
		this.setMute = _waitForReady(_model.setMute);
		this.setFullscreen = _waitForReady(_setFullscreen);
		this.detachMedia = _detachMedia; 
		this.attachMedia = _attachMedia;
		this.setCurrentQuality = _waitForReady(_setCurrentQuality);
		this.getCurrentQuality = _getCurrentQuality;
		this.getQualityLevels = _getQualityLevels;
		this.setCurrentCaptions = _waitForReady(_setCurrentCaptions);
		this.getCurrentCaptions = _getCurrentCaptions;
		this.getCaptionsList = _getCaptionsList;
		this.checkBeforePlay = function() {
            return _preplay;
        };
		this.playerReady = _playerReady;

		_init();
	};
	
})(jwplayer);

