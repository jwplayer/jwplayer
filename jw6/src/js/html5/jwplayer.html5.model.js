/**
 * jwplayer.html5 model
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	var utils = jwplayer.utils,
		events = jwplayer.events,
		UNDEF = undefined,
		TRUE = true,
		FALSE = false;

	html5.model = function(config, video) {
		var _model = this, 
			// Video provider
			_video, 
			// HTML5 <video> tag
			_videoTag,
			// Saved settings
			_cookies = utils.getCookies(),
			// Sub-component configurations
			_componentConfigs = {
				controlbar: {},
				display: {}
			},
			// Defaults
			_defaults = {
				autostart: FALSE,
				controls: TRUE,
				debug: UNDEF,
				fullscreen: FALSE,
				height: 320,
				mobilecontrols: FALSE,
				mute: FALSE,
				playlist: [],
				playlistposition: "none",
				playlistsize: 180,
				playlistlayout: "extended",
				repeat: FALSE,
				skin: UNDEF,
				stretching: utils.stretching.UNIFORM,
				width: 480,
				volume: 90
			};

		function _parseConfig(config) {
			utils.foreach(config, function(i, val) {
				config[i] = utils.serialize(val);
			});
			return config;
		}

		function _init() {
			utils.extend(_model, new events.eventdispatcher());
			_model.config = _parseConfig(utils.extend({}, _defaults, _cookies, config));
			utils.extend(_model, {
				id: config.id,
				state : events.state.IDLE,
				duration: -1,
				position: 0,
				buffer: 0
			}, _model.config);
			// This gets added later
			_model.playlist = [];
			_model.setItem(0);
			
			if (video) {
				_video = video;
				_videoTag = _video.getTag();
			} else {
				_videoTag = document.createElement("video");
				_video = new html5.video(_videoTag);
			}
			_video.volume(_model.volume);
			_video.mute(_model.mute);
			_video.addGlobalListener(_videoEventHandler);
		}
		
		var _eventMap = {};
		_eventMap[events.JWPLAYER_MEDIA_MUTE] = "mute";
		_eventMap[events.JWPLAYER_MEDIA_VOLUME] = "volume";
		_eventMap[events.JWPLAYER_PLAYER_STATE] = "newstate->state";
		_eventMap[events.JWPLAYER_MEDIA_BUFFER] = "bufferPercent->buffer";
		_eventMap[events.JWPLAYER_MEDIA_TIME] = "position,duration";
			
		function _videoEventHandler(evt) {
			var mappings = (_eventMap[evt.type] ? _eventMap[evt.type].split(",") : []), i, _sendEvent;
			if (mappings.length > 0) {
				for (i=0; i<mappings.length; i++) {
					var mapping = mappings[i],
						split = mapping.split("->"),
						eventProp = split[0],
						stateProp = split[1] ? split[1] : eventProp;
						
					if (_model[stateProp] != evt[eventProp]) {
						_model[stateProp] = evt[eventProp];
						_sendEvent = true;
					}
				}
				if (_sendEvent) {
					_model.sendEvent(evt.type, evt);
				}
			} else {
				_model.sendEvent(evt.type, evt);
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
				_model.sendEvent(events.JWPLAYER_FULLSCREEN, { fullscreen: state } );
			}
		}
		
		// TODO: make this a synchronous action; throw error if playlist is empty
		_model.setPlaylist = function(playlist) {
			_model.playlist = utils.filterPlaylist(playlist);
			if (_model.playlist.length == 0) {
				_model.sendEvent(events.JWPLAYER_ERROR, { message: "Error loading playlist: No playable sources found" });
			} else {
				_model.sendEvent(events.JWPLAYER_PLAYLIST_LOADED, {
					playlist: jwplayer(_model.id).getPlaylist()
				});
				_model.item = -1;
				_model.setItem(0);
			}
		}

		_model.setItem = function(index) {
            var newItem;
            var repeat = false;
            if (index == _model.playlist.length || index < -1) {
                newItem = 0;
                repeat = true;
            }
            else if (index == -1 || index > _model.playlist.length)
                newItem = _model.playlist.length - 1;
            else
                newItem = index;
            
            if (repeat  || newItem != _model.item) {
                _model.item = newItem;
                _model.sendEvent(events.JWPLAYER_PLAYLIST_ITEM, {
                    "index": _model.item
                });
            }
        }
        
		_model.setVolume = function(newVol) {
			if (_model.mute && newVol > 0) _model.setMute(FALSE);
			newVol = Math.round(newVol);
			if (!_model.mute) {
				utils.saveCookie("volume", newVol);
			}
			_videoEventHandler({type:events.JWPLAYER_MEDIA_VOLUME, volume: newVol});
			_video.volume(newVol);
		}

		_model.setMute = function(state) {
			if (!utils.exists(state)) state = !_model.mute;
			utils.saveCookie("mute", state);
			_videoEventHandler({type:events.JWPLAYER_MEDIA_MUTE, mute: state});
			_video.mute(state);
		}

		_model.componentConfig = function(name) {
			return _componentConfigs[name];
		}
		
		_init();
	}
})(jwplayer.html5);
