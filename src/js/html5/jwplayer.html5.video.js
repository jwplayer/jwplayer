/**
 * Video tag stuff
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayerhtml5) {

	var _utils = jwplayer.utils;

	/** HTML5 video class * */
	jwplayerhtml5.video = function(videotag) {

		var _mediaEvents = {
			"abort" : _generalHandler,
			"canplay" : _canPlayHandler,
			"canplaythrough" : _generalHandler,
			"durationchange" : _durationUpdateHandler,
			"emptied" : _generalHandler,
			"ended" : _generalHandler,
			"error" : _errorHandler,
			"loadeddata" : _generalHandler,
			"loadedmetadata" : _generalHandler,
			"loadstart" : _generalHandler,
			"pause" : _playHandler,
			"play" : _playHandler,
			"playing" : _generalHandler,
			"progress" : _generalHandler,
			"ratechange" : _generalHandler,
			"readystatechange" : _generalHandler,
			"seeked" : _generalHandler,
			"seeking" : _generalHandler,
			"stalled" : _generalHandler,
			"suspend" : _generalHandler,
			"timeupdate" : _timeUpdateHandler,
			"volumechange" : _volumeHandler,
			"waiting" : _generalHandler
		},

		// Reference to the video tag
		_video,
		// Whether seeking is ready yet
		_canSeek,
		// If we should seek on canplay
		_delayedSeek,
		// Current media state
		_state = jwplayer.events.state.IDLE,
		// Save the volume state before muting
		_lastVolume = 0,
		// Using setInterval to check buffered ranges
		_bufferInterval = -1,
		// Last sent buffer amount
		_bufferPercent = -1,
		// Event dispatcher
		_eventDispatcher = new jwplayer.events.eventdispatcher();

		_utils.extend(this, _eventDispatcher);

		// Constructor
		function _init(videotag) {
			_video = videotag;
			_setupListeners();
		}

		function _setupListeners() {
			for (var evt in _mediaEvents) {
				_video.addEventListener(evt, _mediaEvents[evt], false);
			}
		}

		function _sendEvent(type, data) {
			_eventDispatcher.sendEvent(type, data);
		}

		
		function _generalHandler(evt) {
			//console.log("%s %o (%s,%s)", evt.type, evt);
		}

		function _durationUpdateHandler(evt) {
			_duration = _video.duration;
			_timeUpdateHandler();
		}

		function _timeUpdateHandler(evt) {
			if (_state == jwplayer.events.state.PLAYING) {
				_sendEvent(jwplayer.events.JWPLAYER_MEDIA_TIME, {
					position : _video.currentTime,
					duration : _duration
				});
				if (_video.currentTime >= _duration) {
					_complete();
				}
			}
		}

		function _canPlayHandler(evt) {
			_canSeek = true;
			_generalHandler(evt);
			if (_delayedSeek > 0) {
				_seek(_delayedSeek);
			}
		}

		function _playHandler(evt) {
			if (_video.paused) {
				_setState(jwplayer.events.state.PAUSED);
			} else {
				_setState(jwplayer.events.state.PLAYING);
			}
		}

		function _errorHandler(evt) {
			console.log("Error: %o", _video.error);
			_generalHandler(evt);
		}

		this.load = function(videoURL) {
			_canSeek = false;
			_delayedSeek = 0;
			_duration = 0;
			_video.src = videoURL;
			_video.load();
			
			_bufferInterval = setInterval(_sendBufferUpdate, 100);
			// _video.pause();
		}

		var _stop = this.stop = function() {
			// _video.src = "";
			_video.removeAttribute("src");
			_video.load();
			_video.style.opacity = 0;
			clearInterval(_bufferInterval);
			_setState(jwplayer.events.state.IDLE);
		}

		this.play = function() {
			_video.style.opacity = 1;
			_video.play();
		}

		this.pause = function() {
			_video.pause();
		}

		var _seek = this.seek = function(pos) {
			if (_canSeek) {
				_delayedSeek = 0;
				// _video.play();
				_video.currentTime = pos;
			} else {
				_delayedSeek = pos;
			}
		}

		var _volume = this.volume = function(vol) {
			if (_video.muted) _video.muted = false;
			_video.volume = vol / 100;

		}
		
		function _volumeHandler(evt) {
			_sendEvent(jwplayer.events.JWPLAYER_MEDIA_VOLUME, {
				volume: Math.round(_video.volume * 100)
			});
			_sendEvent(jwplayer.events.JWPLAYER_MEDIA_MUTE, {
				mute: _video.muted
			});
		}
		
		this.mute = function(state) {
			if (!_utils.exists(state)) state = !_video.mute;
			if (state) {
				_lastVolume = _video.volume * 100;
				_volume(0);
				_video.muted = true;
			} else {
				_volume(_lastVolume);
			}
		}

		/** Set the current player state * */
		function _setState(newstate) {
			// Handles a FF 3.5 issue
			if (newstate == jwplayer.events.state.PAUSED && _state == jwplayer.events.state.IDLE) {
				return;
			}

			if (_state != newstate) {
				var oldstate = _state;
				_state = newstate;
				_sendEvent(jwplayer.events.JWPLAYER_PLAYER_STATE, {
					oldstate : oldstate,
					newstate : newstate
				});
			}
		}
		
		function _sendBufferUpdate() {
			var newBuffer = _getBuffer();
			if (newBuffer != _bufferPercent) {
				_bufferPercent = newBuffer;
				_sendEvent(jwplayer.events.JWPLAYER_MEDIA_BUFFER, {
					bufferPercent: Math.round(_bufferPercent * 100)
				});
			}
			if (newBuffer >= 1) {
				clearInterval(_bufferInterval);
			}
		}
		
		function _getBuffer() {
			if (_video.buffered.length == 0 || _video.duration == 0)
				return 0;
			else
				return _video.buffered.end(_video.buffered.length-1) / _video.duration;
		}
		

		function _complete() {
			_stop();
			_sendEvent(jwplayer.events.JWPLAYER_MEDIA_COMPLETE);
		}
		
		// Provide access to video tag
		// TODO: remove
		this.getTag = function() {
			return videotag;
		}

		// Call constructor
		_init(videotag);

	}

})(jwplayer.html5);