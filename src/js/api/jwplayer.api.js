/**
 * API for the JW Player
 * 
 * @author Pablo
 * @version 5.8
 */
(function(jwplayer, undefined) {
	var _players = [], 
		utils = jwplayer.utils, 
		events = jwplayer.events,
		states = events.state,
		DOCUMENT = document;

	function addFocusBorder(container) {
		container.className = container.className + ' jw-tab-focus';
	}

	function removeFocusBorder(container) {
		container.className = container.className.replace(/ *jw-tab-focus */g, ' ');
	}

	var _internalFuncsToGenerate = [
		'getBuffer',
		'getCaptionsList',
		'getControls',
		'getCurrentCaptions',
		'getCurrentQuality',
		'getDuration',
		'getFullscreen',
		'getHeight',
		'getLockState',
		'getMute',
		'getPlaylistIndex',
		'getSafeRegion',
		'getPosition',
		'getQualityLevels',
		'getState',
		'getVolume',
		'getWidth',
		'isBeforeComplete',
		'isBeforePlay',
		'releaseState'
	];

	var _chainableInternalFuncs = [
		'playlistNext',
		'stop',

		// The following pass an argument to function
		'forceState',
		'playlistPrev',
		'seek',
		'setCurrentCaptions',
		'setControls',
		'setCurrentQuality',
		'setVolume'
	];

	var _eventMapping = {
		onBufferChange: events.JWPLAYER_MEDIA_BUFFER,
		onBufferFull: events.JWPLAYER_MEDIA_BUFFER_FULL,
		onError: events.JWPLAYER_ERROR,
		onSetupError: events.JWPLAYER_SETUP_ERROR,
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
		onCaptionsChange: events.JWPLAYER_CAPTIONS_CHANGED,
		onAdError: events.JWPLAYER_AD_ERROR,
		onAdClick: events.JWPLAYER_AD_CLICK,
		onAdImpression: events.JWPLAYER_AD_IMPRESSION,
		onAdTime: events.JWPLAYER_AD_TIME,
		onAdComplete: events.JWPLAYER_AD_COMPLETE,
		onAdCompanions: events.JWPLAYER_AD_COMPANIONS,
		onAdSkipped: events.JWPLAYER_AD_SKIPPED,
		onAdPlay: events.JWPLAYER_AD_PLAY,
		onAdPause: events.JWPLAYER_AD_PAUSE,
		onAdMeta: events.JWPLAYER_AD_META,
		onCast: events.JWPLAYER_CAST_SESSION
	};

	var _stateMapping = {
		onBuffer: states.BUFFERING,
		onPause: states.PAUSED,
		onPlay: states.PLAYING,
		onIdle: states.IDLE
	};

	var api = jwplayer.api = function(container) {
		var _this = this,
			_listeners = {},
			_stateListeners = {},
			_player,
			_playerReady = false,
			_queuedCalls = [],
			_instream,
			_itemMeta = {},
			_callbacks = {};

		_this.container = container;
		_this.id = container.id;

		_this.setup = function(options) {
			if (jwplayer.embed) {
				// Destroy original API on setup() to remove existing listeners
				var fallbackDiv = DOCUMENT.getElementById(_this.id);
				if (fallbackDiv) {
					options["fallbackDiv"] = fallbackDiv;
				}
				_remove(_this);
				var newApi = jwplayer(_this.id);
				newApi.config = options;
				var embedder = new jwplayer.embed(newApi);
				embedder.embed();
				return newApi;
			}
			return _this;
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
		_this.removeButton = function(id) {
			_callInternal('jwDockRemoveButton', id);
		};

		_this.callback = function(id) {
			if (_callbacks[id]) {
				_callbacks[id]();
			}
		};

		_this.getMeta = function() {
			return _this.getItemMeta();
		};
		_this.getPlaylist = function() {
			var playlist = _callInternal('jwGetPlaylist');
			if (_this.renderingMode == "flash") {
				utils.deepReplaceKeyName(playlist, ["__dot__","__spc__","__dsh__","__default__"], ["."," ","-","default"]);
			}
			return playlist;
		};
		_this.getPlaylistItem = function(item) {
			if (!utils.exists(item)) {
				item = _this.getPlaylistIndex();
			}
			return _this.getPlaylist()[item];
		};
		_this.getRenderingMode = function() {
			return _this.renderingMode;
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
			_callInternal("jwInstreamDestroy");
			if (jwplayer(_this.id).plugins.googima) {
				_callInternal("jwDestroyGoogima");
			}
			_callInternal("jwLoad", toLoad);
			return _this;
		};
		_this.playlistItem = function(item) {
			_callInternal("jwPlaylistItem", parseInt(item, 10));
			return _this;
		};
		_this.resize = function(width, height) {
			if (_this.renderingMode !== "flash") {
				_callInternal("jwResize", width, height);
			} else {
				var wrapper = DOCUMENT.getElementById(_this.id + "_wrapper"),
					aspect = DOCUMENT.getElementById(_this.id + "_aspect");
				if (aspect) {
					aspect.style.display = 'none';
				}
				if (wrapper) {
					wrapper.style.display = "block";
					wrapper.style.width = utils.styleDimension(width);
					wrapper.style.height = utils.styleDimension(height);
				}
			}
			return _this;
		};
		_this.play = function(state) {
			if (state === undefined) {
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
			if (state === undefined) {
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
		_this.createInstream = function() {
			return new api.instream(this, _player);
		};
		_this.setInstream = function(instream) {
			_instream = instream;
			return instream;
		};
		_this.loadInstream = function(item, options) {
			_instream = _this.setInstream(_this.createInstream()).init(options);
            _instream.loadItem(item);
            return _instream;
		};
		_this.destroyPlayer = function () {
			_callInternal ("jwPlayerDestroy");
		};
		_this.playAd = function(ad) {
			var plugins = jwplayer(_this.id).plugins;
			if (plugins.vast) {
				plugins.vast.jwPlayAd(ad);
			}
			else  {
				_callInternal("jwPlayAd",ad);
			}
		};
		_this.pauseAd = function() {
			var plugins = jwplayer(_this.id).plugins;
			if (plugins.vast) {
				plugins.vast.jwPauseAd();
			}
			else {
				_callInternal("jwPauseAd");
			}
		};


		// Take a mapping of function names to event names and setup listeners
		function initializeMapping(mapping, listener) {
			utils.foreach(mapping, function(name, value) {
				_this[name] = function(callback) {
					return listener(value, callback);
				}
			});
		}

		initializeMapping(_stateMapping, _stateListener);
		initializeMapping(_eventMapping, _eventListener);


		// given a name "getBuffer", it adds to jwplayer.api a function which internally triggers jwGetBuffer
		function generateInternalFunction(chainable, index, name) {
			var internalName = 'jw' + name.charAt(0).toUpperCase() + name.slice(1);

			_this[name] = function() {
				var value = _callInternal.apply(this, [internalName].concat(Array.prototype.slice.call(arguments, 0)) );
				return (chainable ? _this : value);
			}
		};
		utils.foreach(_internalFuncsToGenerate, generateInternalFunction.bind({}, false));
		utils.foreach(_chainableInternalFuncs,  generateInternalFunction.bind({}, true));


		_this.remove = function() {
			if (!_playerReady) {
				throw "Cannot call remove() before player is ready";
			}
			_remove(this);
		};

		function _remove(player) {
			_queuedCalls = [];
			api.destroyPlayer(player.id);
		}

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
		};

		_this.attachMedia = function(seekable) {
			if (_this.renderingMode == "html5") {
				return _callInternal("jwAttachMedia", seekable);
			}
		};

		function _stateListener(state, callback) {
			if (!_stateListeners[state]) {
				_stateListeners[state] = [];
				_eventListener(events.JWPLAYER_PLAYER_STATE, _stateCallback(state));
			}
			_stateListeners[state].push(callback);
			return _this;
		}

		function _stateCallback(state) {
			return function(args) {
				var newstate = args.newstate, oldstate = args.oldstate;
				if (newstate == state) {
					var callbacks = _stateListeners[newstate];
					if (callbacks) {
						for (var c = 0; c < callbacks.length; c++) {
							var fn = callbacks[c];
							if (typeof fn == 'function') {
								fn.call(this, {
									oldstate: oldstate,
									newstate: newstate
								});
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
		}

		function _eventListener(type, callback) {
			if (!_listeners[type]) {
				_listeners[type] = [];
				if (_player && _playerReady) {
					_addInternalListener(_player, type);
				}
			}
			_listeners[type].push(callback);
			return _this;
		}

		_this.removeEventListener = function(type, callback) {
			var listeners = _listeners[type];
			if (listeners) {
				for (var l = listeners.length; l--;) {
					if (listeners[l] === callback) {
						listeners.splice(l, 1);
					}
				}
			}
		};

		_this.dispatchEvent = function(type) {
			var listeners = _listeners[type];
			if (listeners) {
				listeners = listeners.slice(0); //copy array
				var args = utils.translateEventResponse(type, arguments[1]);
				for (var l = 0; l < listeners.length; l++) {
					var fn = listeners[l];
					if (typeof fn === 'function') {
						try {
							if (type === events.JWPLAYER_PLAYLIST_LOADED) {
								utils.deepReplaceKeyName(args.playlist, ["__dot__","__spc__","__dsh__","__default__"], ["."," ","-","default"]);
							}
							fn.call(this, args);
						} catch(e) {
							utils.log("There was an error calling back an event handler");
						}
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
				if (_player) {
					var args = Array.prototype.slice.call(arguments, 0),
						funcName = args.shift();
					if (typeof _player[funcName] === 'function') {
						// Can't use apply here -- Flash's externalinterface doesn't like it.
						//return func.apply(player, args);
						switch(args.length) {
							case 6:  return _player[funcName](args[0], args[1], args[2], args[3], args[4], args[5]);
							case 5:  return _player[funcName](args[0], args[1], args[2], args[3], args[4]);
							case 4:  return _player[funcName](args[0], args[1], args[2], args[3]);
							case 3:  return _player[funcName](args[0], args[1], args[2]);
							case 2:  return _player[funcName](args[0], args[1]);
							case 1:  return _player[funcName](args[0]);
						}
						return _player[funcName]();
					}
				}
				return null;
			}
			_queuedCalls.push(arguments);
		}

		_this.callInternal = _callInternal;

		_this.playerReady = function(obj) {
			_playerReady = true;

			if (!_player) {
				_this.setPlayer(DOCUMENT.getElementById(obj.id));
			}
			_this.container = DOCUMENT.getElementById(_this.id);

			utils.foreach(_listeners, function(eventType) {
				_addInternalListener(_player, eventType);
			});

			_eventListener(events.JWPLAYER_PLAYLIST_ITEM, function() {
				_itemMeta = {};
			});

			_eventListener(events.JWPLAYER_MEDIA_META, function(data) {
				utils.extend(_itemMeta, data.metadata);
			});

            _eventListener(events.JWPLAYER_VIEW_TAB_FOCUS, function(data) {
                var container = this.getContainer();
                if (data.hasFocus === true) {
                    addFocusBorder(container);
                }
                else {
                    removeFocusBorder(container);
                }
            });

			_this.dispatchEvent(events.API_READY);

			while (_queuedCalls.length > 0) {
				_callInternal.apply(this, _queuedCalls.shift());
			}
		};

		_this.getItemMeta = function() {
			return _itemMeta;
		};

		return _this;
	};

	jwplayer.playerReady = function(obj) {
		var api = jwplayer.api.playerById(obj.id);

		if (!api) {
			jwplayer.api.selectPlayer(obj.id).playerReady(obj);
			return;
		}

		api.playerReady(obj);
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
				if (player.renderingMode == "html5") {
					player.destroyPlayer();
				}
				var replacement = DOCUMENT.createElement('div');
				replacement.id = id;
				toDestroy.parentNode.replaceChild(replacement, toDestroy);
			}
			_players.splice(index, 1);
		}

		return null;
	};
})(window.jwplayer);
