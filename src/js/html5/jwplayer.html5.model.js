/**
 * jwplayer.html5 model
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var _utils = jwplayer.utils,
		_events = jwplayer.events;

	html5.model = function(config) {
		var _model = this, 
			// Video provider
			_video, 
			// HTML5 <video> tag
			_videoTag,
			// Saved settings
			_cookies = _utils.getCookies(),
			// Defaults
			_defaults = {
				width: 480,
				height: 320,
				item: 0,
				playlist: [],
				skin: undefined,
				volume: 90,
				mute: false,
				repeat: "",
				playlistsize: 0,
				playlistposition: "right",
				stretching: _utils.stretching.UNIFORM,
				autostart: false,
				debug: undefined
			};

		function _parseConfig(config) {
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
			_model.setItem(_model.config.item);
			
			_videoTag = document.createElement("video");
			_video = new html5.video(_videoTag);
			_video.addGlobalListener(_videoEventHandler);
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
		
		this.getVideo = function() {
			return _video;
		}
		
		this.seekDrag = function(state) {
			_video.seekDrag(state);
		}
		
		this.setFullscreen = function(state) {
			if (state != _model.fullscreen) {
				_model.fullscreen = state;
				_model.sendEvent(_events.JWPLAYER_FULLSCREEN, { fullscreen: state } );
			}
		}
		
		this.setPlaylist = function(playlist) {
			_model.item = -1;
			_model.playlist = playlist;
			_model.sendEvent(_events.JWPLAYER_PLAYLIST_LOADED, {
				playlist: playlist
			});
		}
		
		this.setItem = function(index) {
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
		
		this.componentConfig = function(name) {
			return {};
		}
		
		_init();
	}
})(jwplayer.html5);
