/**
 * API for the JW Player
 * 
 * @author Pablo
 * @version 5.8
 */
(function(jwplayer) {
	var _players = [], 
		utils = jwplayer.utils, 
		events = jwplayer.events,
		states = events.state,
		
		DOCUMENT = document;
	
	var api = jwplayer.api = function(container) {
		var _this = this,
			_listeners = {},
			_stateListeners = {},
			_componentListeners = {},
			_readyListeners = [],
			_player = undefined,
			_playerReady = false,
			_queuedCalls = [],
			_instream = undefined,
			_itemMeta = {},
			_callbacks = {};
		
		_this.container = container;
		_this.id = container.id;
		
		// Player Getters
		_this.getBuffer = function() {
			return _callInternal('jwGetBuffer');
		};
		_this.getContainer = function() {
			return _this.container;
		};
				
		_this.addButton = function(icon, label, handler, id) {
			try {
				_callbacks[id] = handler;
				var handlerString = "jwplayer('" + _this.id + "').callback('" + id + "')";
				//_player.jwDockAddButton(icon, label, handlerString, id);
				_callInternal("jwDockAddButton", icon, label, handlerString, id);
			} catch (e) {
				utils.log("Could not add dock button" + e.message);
			}
		};
		_this.removeButton = function(id) { _callInternal('jwDockRemoveButton', id); },

		_this.callback = function(id) {
			if (_callbacks[id]) {
				_callbacks[id]();
			}
		};
		_this.getDuration = function() {
			return _callInternal('jwGetDuration');
		};
		_this.getFullscreen = function() {
			return _callInternal('jwGetFullscreen');
		};
		_this.getStretching = function() {
			return _callInternal('jwGetStretching');
		};
		_this.getHeight = function() {
			return _callInternal('jwGetHeight');
		};
		_this.getLockState = function() {
			return _callInternal('jwGetLockState');
		};
		_this.getMeta = function() {
			return _this.getItemMeta();
		};
		_this.getMute = function() {
			return _callInternal('jwGetMute');
		};
		_this.getPlaylist = function() {
			var playlist = _callInternal('jwGetPlaylist');
			if (_this.renderingMode == "flash") {
				utils.deepReplaceKeyName(playlist, ["__dot__","__spc__","__dsh__"], ["."," ","-"]);	
			}
			for (var i = 0; i < playlist.length; i++) {
				if (!utils.exists(playlist[i].index)) {
					playlist[i].index = i;
				}
			}
			return playlist;
		};
		_this.getPlaylistItem = function(item) {
			if (!utils.exists(item)) {
				item = _this.getCurrentItem();
			}
			return _this.getPlaylist()[item];
		};
		_this.getPosition = function() {
			return _callInternal('jwGetPosition');
		};
		_this.getRenderingMode = function() {
			return _this.renderingMode;
		};
		_this.getState = function() {
			return _callInternal('jwGetState');
		};
		_this.getVolume = function() {
			return _callInternal('jwGetVolume');
		};
		_this.getWidth = function() {
			return _callInternal('jwGetWidth');
		};
		// Player Public Methods
		_this.setFullscreen = function(fullscreen) {
			if (!utils.exists(fullscreen)) {
				_callInternal("jwSetFullscreen", !_callInternal('jwGetFullscreen'));
			} else {
				_callInternal("jwSetFullscreen", fullscreen);
			}
			return _this;
		};
		_this.setStretching = function(stretching) {
			_callInternal("jwSetStretching", stretching);
			return _this;
		};
		_this.setMute = function(mute) {
			if (!utils.exists(mute)) {
				_callInternal("jwSetMute", !_callInternal('jwGetMute'));
			} else {
				_callInternal("jwSetMute", mute);
			}
			return _this;
		};
		_this.lock = function() {
			return _this;
		};
		_this.unlock = function() {
			return _this;
		};
		_this.load = function(toLoad) {
			_callInternal("jwLoad", toLoad);
			return _this;
		};
		_this.playlistItem = function(item) {
			_callInternal("jwPlaylistItem", parseInt(item));
			return _this;
		};
		_this.playlistPrev = function() {
			_callInternal("jwPlaylistPrev");
			return _this;
		};
		_this.playlistNext = function() {
			_callInternal("jwPlaylistNext");
			return _this;
		};
		_this.resize = function(width, height) {
			if (_this.renderingMode == "html5") {
				_player.jwResize(width, height);
			} else {
				var wrapper = DOCUMENT.getElementById(_this.id + "_wrapper");
				if (wrapper) {
					wrapper.style.width = utils.styleDimension(width);
					wrapper.style.height = utils.styleDimension(height);
				}
			}
			return _this;
		};
		_this.play = function(state) {
			if (typeof state == "undefined") {
				state = _this.getState();
				if (state == states.PLAYING || state == states.BUFFERING) {
					_callInternal("jwPause");
				} else {
					_callInternal("jwPlay");
				}
			} else {
				_callInternal("jwPlay", state);
			}
			return _this;
		};
		_this.pause = function(state) {
			if (typeof state == "undefined") {
				state = _this.getState();
				if (state == states.PLAYING || state == states.BUFFERING) {
					_callInternal("jwPause");
				} else {
					_callInternal("jwPlay");
				}
			} else {
				_callInternal("jwPause", state);
			}
			return _this;
		};
		_this.stop = function() {
			_callInternal("jwStop");
			return _this;
		};
		_this.seek = function(position) {
			_callInternal("jwSeek", position);
			return _this;
		};
		_this.setVolume = function(volume) {
			_callInternal("jwSetVolume", volume);
			return _this;
		};
		_this.loadInstream = function(item, instreamOptions) {
			_instream = new api.instream(this, _player, item, instreamOptions);
			return _instream;
		};
		_this.getQualityLevels = function() {
			return _callInternal("jwGetQualityLevels");
		};
		_this.getCurrentQuality = function() {
			return _callInternal("jwGetCurrentQuality");
		};
		_this.setCurrentQuality = function(level) {
			_callInternal("jwSetCurrentQuality", level);
		};
		_this.getCaptionsList = function() {
			return _callInternal("jwGetCaptionsList");
		};
		_this.getCurrentCaptions = function() {
			return _callInternal("jwGetCurrentCaptions");
		};
		_this.setCurrentCaptions = function(caption) {
			_callInternal("jwSetCurrentCaptions", caption);
		};
		_this.getControls = function() {
			return _callInternal("jwGetControls");
		};
		_this.getSafeRegion = function() {
			return _callInternal("jwGetSafeRegion");
		};	
		_this.setControls = function(state) {
			_callInternal("jwSetControls", state);
		};
		
		var _eventMapping = {
			onBufferChange: events.JWPLAYER_MEDIA_BUFFER,
			onBufferFull: events.JWPLAYER_MEDIA_BUFFER_FULL,
			onError: events.JWPLAYER_ERROR,
			onFullscreen: events.JWPLAYER_FULLSCREEN,
			onMeta: events.JWPLAYER_MEDIA_META,
			onMute: events.JWPLAYER_MEDIA_MUTE,
			onPlaylist: events.JWPLAYER_PLAYLIST_LOADED,
			onPlaylistItem: events.JWPLAYER_PLAYLIST_ITEM,
			onPlaylistComplete: events.JWPLAYER_PLAYLIST_COMPLETE,
			onReady: events.API_READY,
			onResize: events.JWPLAYER_RESIZE,
			onComplete: events.JWPLAYER_MEDIA_COMPLETE,
			onSeek: events.JWPLAYER_MEDIA_SEEK,
			onTime: events.JWPLAYER_MEDIA_TIME,
			onVolume: events.JWPLAYER_MEDIA_VOLUME,
			onBeforePlay: events.JWPLAYER_MEDIA_BEFOREPLAY,
			onBeforeComplete: events.JWPLAYER_MEDIA_BEFORECOMPLETE,
			onDisplayClick: events.JWPLAYER_DISPLAY_CLICK,
			onControls: events.JWPLAYER_CONTROLS,
			onQualityLevels: events.JWPLAYER_MEDIA_LEVELS,
			onQualityChange: events.JWPLAYER_MEDIA_LEVEL_CHANGED,
			onCaptionsList: events.JWPLAYER_CAPTIONS_LIST,
			onCaptionsChange: events.JWPLAYER_CAPTIONS_CHANGED
		};
		
		utils.foreach(_eventMapping, function(event) {
			_this[event] = _eventCallback(_eventMapping[event], _eventListener); 
		});

		var _stateMapping = {
			onBuffer: states.BUFFERING,
			onPause: states.PAUSED,
			onPlay: states.PLAYING,
			onIdle: states.IDLE 
		};

		utils.foreach(_stateMapping, function(state) {
			_this[state] = _eventCallback(_stateMapping[state], _stateListener); 
		});
		
		function _eventCallback(event, listener) {
			return function(callback) {
				return listener(event, callback);
			};
		}

		_this.remove = function() {
			if (!_playerReady) {
				throw "Cannot call remove() before player is ready";
				return;
			}
			_remove(this);
		};
		
		function _remove(player) {
			_queuedCalls = [];
			api.destroyPlayer(player.id);
		}
		
		_this.setup = function(options) {
			if (jwplayer.embed) {
				// Destroy original API on setup() to remove existing listeners
				_remove(_this);
				var newApi = jwplayer(_this.id);
				newApi.config = options;
				return new jwplayer.embed(newApi);
			}
			return _this;
		};
		_this.registerPlugin = function(id, target, arg1, arg2) {
			jwplayer.plugins.registerPlugin(id, target, arg1, arg2);
		};
		
		/** Use this function to set the internal low-level player.  This is a javascript object which contains the low-level API calls. **/
		_this.setPlayer = function(player, renderingMode) {
			_player = player;
			_this.renderingMode = renderingMode;
		};
		
		_this.detachMedia = function() {
			if (_this.renderingMode == "html5") {
				return _callInternal("jwDetachMedia");
			}
		}

		_this.attachMedia = function() {
			if (_this.renderingMode == "html5") {
				return _callInternal("jwAttachMedia");
			}
		}

		function _stateListener(state, callback) {
			if (!_stateListeners[state]) {
				_stateListeners[state] = [];
				_eventListener(events.JWPLAYER_PLAYER_STATE, _stateCallback(state));
			}
			_stateListeners[state].push(callback);
			return _this;
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
									newstate: newstate
								});
							}
						}
					}
				}
			};
		}
		
		function _componentListener(component, type, callback) {
			if (!_componentListeners[component]) {
				_componentListeners[component] = {};
			}
			if (!_componentListeners[component][type]) {
				_componentListeners[component][type] = [];
				_eventListener(type, _componentCallback(component, type));
			}
			_componentListeners[component][type].push(callback);
			return _this;
		};
		
		function _componentCallback(component, type) {
			return function(event) {
				if (component == event.component) {
					var callbacks = _componentListeners[component][type];
					if (callbacks) {
						for (var c = 0; c < callbacks.length; c++) {
							if (typeof callbacks[c] == 'function') {
								callbacks[c].call(this, event);
							}
						}
					}
				}
			};
		}		
		
		function _addInternalListener(player, type) {
			try {
				player.jwAddEventListener(type, 'function(dat) { jwplayer("' + _this.id + '").dispatchEvent("' + type + '", dat); }');
			} catch(e) {
				utils.log("Could not add internal listener");
			}
		};
		
		function _eventListener(type, callback) {
			if (!_listeners[type]) {
				_listeners[type] = [];
				if (_player && _playerReady) {
					_addInternalListener(_player, type);
				}
			}
			_listeners[type].push(callback);
			return _this;
		};
		
		_this.dispatchEvent = function(type) {
			if (_listeners[type]) {
				var args = utils.translateEventResponse(type, arguments[1]);
				for (var l = 0; l < _listeners[type].length; l++) {
					if (typeof _listeners[type][l] == 'function') {
						_listeners[type][l].call(this, args);
					}
				}
			}
		};

		_this.dispatchInstreamEvent = function(type) {
			if (_instream) {
				_instream.dispatchEvent(type, arguments);
			}
		};

		function _callInternal() {
			if (_playerReady) {
				var funcName = arguments[0],
				args = [];
			
				for (var argument = 1; argument < arguments.length; argument++) {
					args.push(arguments[argument]);
				}
				
				if (typeof _player != "undefined" && typeof _player[funcName] == "function") {
					// Can't use apply here -- Flash's externalinterface doesn't like it.
					switch(args.length) {
						case 4:  return (_player[funcName])(args[0], args[1], args[2], args[3]);
						case 3:  return (_player[funcName])(args[0], args[1], args[2]);
						case 2:  return (_player[funcName])(args[0], args[1]);
						case 1:  return (_player[funcName])(args[0]);
						default: return (_player[funcName])();
					}
				}
				return null;
			} else {
				_queuedCalls.push(arguments);
			}
		};
		
		_this.playerReady = function(obj) {
			_playerReady = true;
			
			if (!_player) {
				_this.setPlayer(DOCUMENT.getElementById(obj.id));
			}
			_this.container = DOCUMENT.getElementById(_this.id);
			
			utils.foreach(_listeners, function(eventType) {
				_addInternalListener(_player, eventType);
			});
			
			_eventListener(events.JWPLAYER_PLAYLIST_ITEM, function(data) {
				_itemMeta = {};
			});
			
			_eventListener(events.JWPLAYER_MEDIA_META, function(data) {
				utils.extend(_itemMeta, data.metadata);
			});
			
			_this.dispatchEvent(events.API_READY);
			
			while (_queuedCalls.length > 0) {
				_callInternal.apply(this, _queuedCalls.shift());
			}
		};
		
		_this.getItemMeta = function() {
			return _itemMeta;
		};
		
		_this.getCurrentItem = function() {
			return _callInternal('jwGetPlaylistIndex');
		};
		
		/** Using this function instead of array.slice since Arguments are not an array **/
		function slice(list, from, to) {
			var ret = [];
			if (!from) {
				from = 0;
			}
			if (!to) {
				to = list.length - 1;
			}
			for (var i = from; i <= to; i++) {
				ret.push(list[i]);
			}
			return ret;
		}
		return _this
	};
	
	api.selectPlayer = function(identifier) {
		var _container;
		
		if (!utils.exists(identifier)) {
			identifier = 0;
		}
		
		if (identifier.nodeType) {
			// Handle DOM Element
			_container = identifier;
		} else if (typeof identifier == 'string') {
			// Find container by ID
			_container = DOCUMENT.getElementById(identifier);
		}
		
		if (_container) {
			var foundPlayer = api.playerById(_container.id);
			if (foundPlayer) {
				return foundPlayer;
			} else {
				// Todo: register new object
				return api.addPlayer(new api(_container));
			}
		} else if (typeof identifier == "number") {
			return _players[identifier];
		}
		
		return null;
	};
	

	api.playerById = function(id) {
		for (var p = 0; p < _players.length; p++) {
			if (_players[p].id == id) {
				return _players[p];
			}
		}
		return null;
	};
	
	api.addPlayer = function(player) {
		for (var p = 0; p < _players.length; p++) {
			if (_players[p] == player) {
				return player; // Player is already in the list;
			}
		}
		
		_players.push(player);
		return player;
	};
	
	api.destroyPlayer = function(playerId) {
		var index = -1, player;
		for (var p = 0; p < _players.length; p++) {
			if (_players[p].id == playerId) {
				index = p;
				player = _players[p];
				continue;
			}
		}
		if (index >= 0) {
			var id = player.id,
				toDestroy = DOCUMENT.getElementById(id + (player.renderingMode == "flash" ? "_wrapper" : ""));
			
			if (utils.clearCss) {
				// Clear HTML5 rules
				utils.clearCss("#"+id);
			}

//			if (!toDestroy) {
//				toDestroy = DOCUMENT.getElementById(id);	
//			}
			
			if (toDestroy) {
				var replacement = DOCUMENT.createElement('div');
				replacement.id = id;
				toDestroy.parentNode.replaceChild(replacement, toDestroy);
			}
			_players.splice(index, 1);
		}
		
		return null;
	};

	jwplayer.playerReady = function(obj) {
		var api = jwplayer.api.playerById(obj.id);

		if (api) {
			api.playerReady(obj);
		} else {
			jwplayer.api.selectPlayer(obj.id).playerReady(obj);
		}
		
	};
})(jwplayer);

