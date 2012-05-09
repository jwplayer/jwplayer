/**
 * jwplayer.html5 model
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _utils = jwplayer.utils,
		_events = jwplayer.events,
		UNDEF = undefined;

	html5.model = function(config) {
		var _model = this, 
			// Video provider
			_video, 
			// HTML5 <video> tag
			_videoTag,
			// Saved settings
			_cookies = _utils.getCookies(),
			// Sub-component configurations
			_componentConfigs = {};
			// Defaults
			_defaults = {
				autostart: false,
				controls: true,
				debug: UNDEF,
				height: 320,
				icons: true,
				item: 0,
				mute: false,
				playlist: [],
				playlistposition: "right",
				playlistsize: 0,
				repeat: "list",
				skin: UNDEF,
				stretching: _utils.stretching.UNIFORM,
				volume: 90,
				width: 480
			};

		function _parseConfig(config) {
			for (var i in config) {
				config[i] = _utils.strings.serialize(config[i]);
			}
			return config;
		}

		function _init() {
			_utils.extend(_model, new _events.eventdispatcher());
			_model.config = _utils.extend({}, _defaults, _cookies, _parseConfig(config));
			_utils.extend(_model, {
				id: config.id,
				state : _events.state.IDLE,
				position: 0,
				buffer: 0,
			}, _model.config);
			_setComponentConfigs();
			_model.setItem(_model.config.item);
			
			_videoTag = document.createElement("video");
			_video = new html5.video(_videoTag);
			_video.volume(_model.volume);
			_video.mute(_model.mute);
			_video.addGlobalListener(_videoEventHandler);
		}
		
		function _setComponentConfigs() {
			_componentConfigs.display = { showicons: _model.icons };
			_componentConfigs.controlbar = {};
		}

		var _eventMap = {};
		_eventMap[_events.JWPLAYER_MEDIA_MUTE] = "mute";
		_eventMap[_events.JWPLAYER_MEDIA_VOLUME] = "volume";
		_eventMap[_events.JWPLAYER_PLAYER_STATE] = "newstate->state";
		_eventMap[_events.JWPLAYER_MEDIA_BUFFER] = "bufferPercent->buffer";
		_eventMap[_events.JWPLAYER_MEDIA_TIME] = "position";
			
		function _videoEventHandler(evt) {
			var mapping = _eventMap[evt.type];
			if (mapping) {
				var split = mapping.split("->"),
					eventProp = split[0],
					stateProp = split[1] ? split[1] : eventProp;
				if (_model[stateProp] != evt[eventProp]) {
					_model[stateProp] = evt[eventProp];
					_model.sendEvent(evt.type, evt);
				}
			} else {
				_model.sendEvent(evt.type, evt);
			}
		}
		
		_model.setState = function(newstate) {
			var oldstate = _model.state;
			_model.state = newstate;
			if (newstate != oldstate) {
				_model.sendEvent(_events.JWPLAYER_PLAYER_STATE, { newstate: _model.state, oldstate: oldstate });
			}
		}
		
		_model.getVideo = function() {
			return _video;
		}
		
		_model.seekDrag = function(state) {
			_video.seekDrag(state);
		}
		
		_model.setFullscreen = function(state) {
			if (state != _model.fullscreen) {
				_model.fullscreen = state;
				_model.sendEvent(_events.JWPLAYER_FULLSCREEN, { fullscreen: state } );
			}
		}
		
		_model.setPlaylist = function(playlist) {
			_model.item = -1;
			_model.playlist = playlist;
			_model.sendEvent(_events.JWPLAYER_PLAYLIST_LOADED, {
				playlist: playlist
			});
		}
		
		_model.setItem = function(index) {
			var newItem;
			if (index == _model.playlist.length || index < -1)
				newItem = 0;
			else if (index == -1 || index > _model.playlist.length)
				newItem = _model.playlist.length - 1;
			else
				newItem = index;
			
			if (newItem != _model.item) {
				_model.item = newItem;
				_model.sendEvent(_events.JWPLAYER_PLAYLIST_ITEM, {
					"index": _model.item
				});
			}
		}
		
		_model.setVolume = function(newVol) {
			if (_model.mute && newVol > 0) _model.setMute(false);
			newVol = Math.round(newVol);
			_utils.saveCookie("volume", newVol);
			_video.volume(newVol);
		}

		_model.setMute = function(state) {
			if (!_utils.exists(state)) state = !_model.mute;
			_utils.saveCookie("mute", state);
			_video.mute(state);
		}

		_model.componentConfig = function(name) {
			return _componentConfigs[name];
		}
		
		_init();
	}
})(jwplayer.html5);
