/**
 * jwplayer.html5 API
 *
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _jw = jwplayer, 
		_utils = _jw.utils, 
		_events = _jw.events, 
		_states = _events.state;
		
	html5.controller = function(model, view) {
		var _model = model,
			_view = view,
			_video = model.getVideo(),
			_controller = this,
			_eventDispatcher = new _events.eventdispatcher(_model.id, _model.config.debug);
		
		_utils.extend(this, _eventDispatcher);

		function _init() {
			_model.addGlobalListener(_forward);
			_model.addEventListener(_events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
			_model.addEventListener(_events.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
		}
		
		function _playerReady(evt) {
			_view.completeSetup();
			_controller.sendEvent(evt.type, evt);
			_controller.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_LOADED, {playlist: _model.playlist});
			_controller.sendEvent(jwplayer.events.JWPLAYER_PLAYLIST_ITEM, {index: _model.item});
			_controller.load();
		}
		
		function _forward(evt) {
			_eventDispatcher.sendEvent(evt.type, evt);
		}
		
		function _bufferFullHandler(evt) {
			_video.play();
		}

		function _load(item) {
			_stop();
			
			switch (_utils.typeOf(item)) {
			case "string":
				_model.setPlaylist(new html5.playlist({file:item}));
				_model.setItem(0);
				break;
			case "object":
			case "array":
				_model.setPlaylist(new html5.playlist(item));
				_model.setItem(0);
				break;
			case "number":
				_model.setItem(item);
				break;
			}
				
		}
		
		var _preplay, _actionOnAttach, _interruptPlay;
		
		function _play() {
			try {
				_actionOnAttach = _play;
				if (!_preplay) {
					_preplay = true;
					_eventDispatcher.sendEvent(_events.JWPLAYER_MEDIA_BEFOREPLAY);
					_preplay = false;
					if (_interruptPlay) {
						_interruptPlay = false;
						_actionOnAttach = null;
						return;
					}
				}
				
				if (_model.state == _states.IDLE) {
					_video.load(_model.playlist[_model.item]);
				} else if (_model.state == _states.PAUSED) {
					_video.play();
				}
				
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(_events.JWPLAYER_ERROR, err);
				_actionOnAttach = null;
			}
			return false;
		}

		function _stop() {
			_actionOnAttach = null;
			try {
				if (_model.state != _states.IDLE && _model.state != _states.COMPLETE) {
					_video.stop();
				}
				if (_preplay) {
					_interruptPlay = true;
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(_events.JWPLAYER_ERROR, err);
			}
			return false;

		}

		function _pause() {
			try {
				switch (_model.state) {
					case _states.PLAYING:
					case _states.BUFFERING:
						_video.pause();
						break;
					default:
						if (_preplay) {
							_interruptPlay = true;
						}
				}
				return true;
			} catch (err) {
				_eventDispatcher.sendEvent(_events.JWPLAYER_ERROR, err);
			}
			return false;

			
			if (_model.state == _states.PLAYING || _model.state == _states.BUFFERING) {
				_video.pause();
			}
		}

		function _seek(pos) {
			_video.seek(pos);
		}
		
		function _setVolume(vol) {
			_video.volume(vol);
		}
		
		function _setMute(state) {
			if (!_utils.exists(state)) state = !_model.mute;
			_video.mute(state);
		}
		
		function _setFullscreen(state) {
			_view.fullscreen(state);
		}

		function _setStretching(stretching) {
			_model.stretching = stretching;
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
			if (_model.state != _states.IDLE) {
				// Something has made an API call before the complete handler has fired.
				return;
			}
			_actionOnAttach = _completeHandler;
			switch (_model.repeat.toLowerCase()) {
				case "single":
					_play();
					break;
				case "always":
					_next();
					break;
				case "list":
					if (_model.item == _model.playlist.length - 1) {
						_load(0);
					} else {
						_next();
					}
					break;
				default:
//					_stop();
					break;
			}
		}
		
		
		// TODO: implement waitForReady; either in Controller or in API
		function _waitForReady(func) {
			return function() {
				func.apply(this, arguments);
			}
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
		
		/** Controller API / public methods **/
		this.play = _waitForReady(_play);
		this.pause = _waitForReady(_pause);
		this.seek = _waitForReady(_seek);
		this.stop = _waitForReady(_stop);
		this.load = _waitForReady(_load);
		this.next = _waitForReady(_next);
		this.prev = _waitForReady(_prev);
		this.item = _waitForReady(_item);
		this.setVolume = _waitForReady(_setVolume);
		this.setMute = _waitForReady(_setMute);
		this.setFullscreen = _waitForReady(_setFullscreen);
		this.setStretching = _waitForReady(_setStretching);
		this.detachMedia = _detachMedia; 
		this.attachMedia = _attachMedia;
		
		this.playerReady = _playerReady;
//		this.beforePlay = function() { 
//			return _preplay; 
//		}

		_init();
	}
	
})(jwplayer.html5);

