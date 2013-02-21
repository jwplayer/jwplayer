/**
 * InStream API 
 * 
 * @author Pablo
 * @version 5.9
 */
(function(jwplayer) {
	var events = jwplayer.events,
		utils = jwplayer.utils,
		states = events.state;
	
	jwplayer.api.instream = function(api, player, item, options) {
		
		var _api = api,
			_player = player,
			_item = item,
			_options = options,
			_listeners = {},
			_stateListeners = {},
			_this = this;
		
		function _init() {
		   	_api.callInternal("jwLoadInstream", item, options ? options : {});
		}

		/*
		
		function _addInternalListener(player, type) {
			_player.jwInstreamAddEventListener(type, 'function(dat) { jwplayer("' + _api.id + '").dispatchInstreamEvent("' + type + '", dat); }');
		};

		function _eventListener(type, callback) {
			if (!_listeners[type]) {
				_listeners[type] = [];
				_addInternalListener(_player, type);
			}
			_listeners[type].push(callback);
			return this;
		};

		function _stateListener(state, callback) {
			if (!_stateListeners[state]) {
				_stateListeners[state] = [];
				_eventListener(events.JWPLAYER_PLAYER_STATE, _stateCallback(state));
			}
			_stateListeners[state].push(callback);
			return this;
		};

		function _stateCallback(state) {
			return function(args) {
				var newstate = args.newstate, oldstate = args.oldstate;
				if (newstate == state) {
					var callbacks = _stateListeners[newstate];
					if (callbacks) {
						for (var c = 0; c < callbacks.length; c++) {
							if (typeof callbacks[c] == 'function') {
								callbacks[c].call(this, {
									oldstate: oldstate,
									newstate: newstate,
									type: args.type
								});
							}
						}
					}
				}
			};
		}
		
		_this.dispatchEvent = function(type, calledArguments) {
			if (_listeners[type]) {
				var args = utils.translateEventResponse(type, calledArguments[1]);
				for (var l = 0; l < _listeners[type].length; l++) {
					if (typeof _listeners[type][l] == 'function') {
						_listeners[type][l].call(this, args);
					}
				}
			}
		}
		
		
		_this.onError = function(callback) {
			return _eventListener(events.JWPLAYER_ERROR, callback);
		};
		_this.onFullscreen = function(callback) {
			return _eventListener(events.JWPLAYER_FULLSCREEN, callback);
		};
		_this.onMeta = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_META, callback);
		};
		_this.onMute = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_MUTE, callback);
		};
		_this.onComplete = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_COMPLETE, callback);
		};
		_this.onSeek = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_SEEK, callback);
		};
		_this.onTime = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_TIME, callback);
		};
		_this.onVolume = function(callback) {
			return _eventListener(events.JWPLAYER_MEDIA_VOLUME, callback);
		};
		// State events
		_this.onBuffer = function(callback) {
			return _stateListener(states.BUFFERING, callback);
		};
		_this.onPause = function(callback) {
			return _stateListener(states.PAUSED, callback);
		};
		_this.onPlay = function(callback) {
			return _stateListener(states.PLAYING, callback);
		};
		_this.onIdle = function(callback) {
			return _stateListener(states.IDLE, callback);
		};
		// Instream events
		_this.onInstreamClick = function(callback) {
			return _eventListener(events.JWPLAYER_INSTREAM_CLICK, callback);
		};
		_this.onInstreamDestroyed = function(callback) {
			return _eventListener(events.JWPLAYER_INSTREAM_DESTROYED, callback);
		};
		*/
		
		_this.play = function(state) {
			_player.jwInstreamPlay(state);
		};
		_this.pause = function(state) {
			_player.jwInstreamPause(state);
		};
		_this.destroy = function() {
			_player.jwInstreamDestroy();
		};
		/*
		_this.seek = function(pos) {
			_player.jwInstreamSeek(pos);
		};
		_this.getState = function() {
			return _player.jwInstreamGetState();
		}
		_this.getDuration = function() {
			return _player.jwInstreamGetDuration();
		}
		_this.getPosition = function() {
			return _player.jwInstreamGetPosition();
		}

		*/
		
		_init();
		
		
	}
	
})(jwplayer);

