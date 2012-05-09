/**
 * Video tag stuff
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayerhtml5) {

	var _jw = jwplayer, 
		_utils = _jw.utils, 
		_events = _jw.events, 
		_states = _events.state;
	

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
			"loadedmetadata" : _canPlayHandler,
			"loadstart" : _generalHandler,
			"pause" : _playHandler,
			"play" : _playHandler,
			"playing" : _playHandler,
			"progress" : _generalHandler,
			"ratechange" : _generalHandler,
			"readystatechange" : _generalHandler,
			"seeked" : _generalHandler,
			"seeking" : _generalHandler,
			"stalled" : _generalHandler,
			"suspend" : _generalHandler,
			"timeupdate" : _timeUpdateHandler,
			"volumechange" : _volumeHandler,
			"waiting" : _bufferStateHandler
		},
		
		_extensions = {
			"mp4": "video/mp4",
			"webm": "video/webm",
			"m3u8": "audio/x-mpegurl"
		},
		

		// Current playlist item
		_item,
		// Currently playing file
		_file,
		// Reference to the video tag
		_videotag,
		// Current duration
		_duration,
		// Current position
		_position,
		// Requested seek position
		_seekOffset,
		// Whether seeking is ready yet
		_canSeek,
		// Whether we have sent out the BUFFER_FULL event
		_bufferFull,
		// If we should seek on canplay
		_delayedSeek,
		// If we're currently dragging the seek bar
		_dragging,
		// Current media state
		_state = _states.IDLE,
		// Save the volume state before muting
		_lastVolume,
		// Using setInterval to check buffered ranges
		_bufferInterval = -1,
		// Last sent buffer amount
		_bufferPercent = -1,
		// Event dispatcher
		_eventDispatcher = new _events.eventdispatcher(),
		// Whether or not we're listening to video tag events
		_attached = false;
		
		_utils.extend(this, _eventDispatcher);

		// Constructor
		function _init(videotag) {
			_videotag = videotag;
			_setupListeners();

			// Workaround for a Safari bug where video disappears on switch to fullscreen
			_videotag.controls = true;
			_videotag.controls = false;
			
			_attached = true;
		}

		function _setupListeners() {
			for (var evt in _mediaEvents) {
				_videotag.addEventListener(evt, _mediaEvents[evt], false);
			}
		}

		function _sendEvent(type, data) {
			if (_attached) {
				_eventDispatcher.sendEvent(type, data);
			}
		}

		
		function _generalHandler(evt) {
			//console.log("%s %o (%s,%s)", evt.type, evt);
		}

		function _durationUpdateHandler(evt) {
			if (!_attached) return;
			if (_duration < 0) _duration = _videotag.duration;
			_timeUpdateHandler();
		}

		function _timeUpdateHandler(evt) {
			if (!_attached) return;
			if (_state == _states.PLAYING && !_dragging) {
				_position = _videotag.currentTime;
				_sendEvent(_events.JWPLAYER_MEDIA_TIME, {
					position : _position,
					duration : _duration
				});
				if (_position >= _duration && _duration > 0) {
					_complete();
				}
			}
		}

		function _canPlayHandler(evt) {
			if (!_attached) return;
			if (!_canSeek) {
				_canSeek = true;
				_sendBufferFull();
				if (_delayedSeek > 0) {
					_seek(_delayedSeek);
				}
			}
		}
		
		function _sendBufferFull() {
			if (!_bufferFull) {
				_bufferFull = true;
				_sendEvent(_events.JWPLAYER_MEDIA_BUFFER_FULL);
			}
		}

		function _playHandler(evt) {
			if (!_attached || _dragging) return;
			
			if (_videotag.paused) {
				//_setState(_states.PAUSED);
			} else {
				_setState(_states.PLAYING);
			}
		}

		function _bufferStateHandler(evt) {
			if (!_attached) return;
			_setState(_states.BUFFERING);
		}

		function _errorHandler(evt) {
			if (!_attached) return;
			_utils.log("Error: %o", _videotag.error);
			_setState(_states.IDLE);
		}

		function _canPlay(file) {
			var type = _extensions[_utils.strings.extension(file)];
			return (!!type && _videotag.canPlayType(type));
		}
		
		/** Selects the appropriate file out of all available options **/
		function _selectFile(item) {
			if (item.levels && item.levels.length > 0) {
				for (var i=0; i<item.levels.length; i++) {
					if (_canPlay(item.levels[i].file))
						return item.levels[i].file;
				}
			} else if (item.file && _canPlay(item.file)) {
				return item.file;
			}
			return null;
		}
		
		this.load = function(item) {
			if (!_attached) return;

			_item = item;
			_canSeek = false;
			_bufferFull = false;
			_delayedSeek = 0;
			_duration = item.duration ? item.duration : -1;
			_position = 0;
			
			_file = _selectFile(_item);
			
			if (!_file) {
				_utils.log("Could not find a file to play.");
				return;
			}
			
			_setState(_states.BUFFERING); 
			_videotag.src = _file;
			_videotag.load();
			
			_bufferInterval = setInterval(_sendBufferUpdate, 100);

			// Use native browser controls on mobile
			if (_utils.isMobile()) {
				_videotag.controls = true;
			}
			
			if (_utils.isIPod()) {
				_sendBufferFull();
			}
		}

		var _stop = this.stop = function() {
			if (!_attached) return;
			_videotag.removeAttribute("src");
			_videotag.load();
			clearInterval(_bufferInterval);
			_setState(_states.IDLE);
		}

		this.play = function() {
			if (_attached) _videotag.play();
		}

		this.pause = function() {
			if (_attached) {
				_videotag.pause();
				_setState(_states.PAUSED);
			}
		}

		this.seekDrag = function(state) {
			if (!_attached) return; 
			_dragging = state;
			if (state) _videotag.pause();
			else _videotag.play();
		}
		
		var _seek = this.seek = function(pos) {
			if (!_attached) return; 
			if (_videotag.readyState >= _videotag.HAVE_FUTURE_DATA) {
				_delayedSeek = 0;
				if (!_dragging) {
					_sendEvent(_events.JWPLAYER_MEDIA_SEEK, {
						position: _position,
						offset: pos
					});
				}
				_videotag.currentTime = pos;
			} else {
				_delayedSeek = pos;
			}
		}

		var _volume = this.volume = function(vol) {
			_videotag.volume = vol / 100;
		}
		
		function _volumeHandler(evt) {
			_sendEvent(_events.JWPLAYER_MEDIA_VOLUME, {
				volume: Math.round(_videotag.volume * 100)
			});
			_sendEvent(_events.JWPLAYER_MEDIA_MUTE, {
				mute: _videotag.muted
			});
		}
		
		this.mute = function(state) {
			if (!_utils.exists(state)) state = !_videotag.mute;
			if (state) {
				if (!_videotag.muted) {
					_lastVolume = _videotag.volume * 100;
					_videotag.muted = true;
					_volume(0);
				}
			} else {
				if (_videotag.muted) {
					_volume(_lastVolume);
					_videotag.muted = false;
				}
			}
		}

		/** Set the current player state * */
		function _setState(newstate) {
			// Handles a FF 3.5 issue
			if (newstate == _states.PAUSED && _state == _states.IDLE) {
				return;
			}
			
			// Ignore state changes while dragging the seekbar
			if (_dragging) return

			if (_state != newstate) {
				var oldstate = _state;
				_state = newstate;
				_sendEvent(_events.JWPLAYER_PLAYER_STATE, {
					oldstate : oldstate,
					newstate : newstate
				});
			}
		}
		
		function _sendBufferUpdate() {
			if (!_attached) return; 
			var newBuffer = _getBuffer();
			if (newBuffer != _bufferPercent) {
				_bufferPercent = newBuffer;
				_sendEvent(_events.JWPLAYER_MEDIA_BUFFER, {
					bufferPercent: Math.round(_bufferPercent * 100)
				});
			}
			if (newBuffer >= 1) {
				clearInterval(_bufferInterval);
			}
		}
		
		function _getBuffer() {
			if (_videotag.buffered.length == 0 || _videotag.duration == 0)
				return 0;
			else
				return _videotag.buffered.end(_videotag.buffered.length-1) / _videotag.duration;
		}
		

		function _complete() {
			//_stop();
			_setState(_states.IDLE);
			_sendEvent(_events.JWPLAYER_MEDIA_COMPLETE);
		}
		

		/**
		 * Return the video tag and stop listening to events  
		 */
		this.detachMedia = function() {
			_attached = false;
			return _videotag;
		}
		
		/**
		 * Begin listening to events again  
		 */
		this.attachMedia = function() {
			_attached = true;
		}
		
		// Provide access to video tag
		// TODO: remove; used by InStream
		this.getTag = function() {
			return _videotag;
		}

		// Call constructor
		_init(videotag);

	}

})(jwplayer.html5);