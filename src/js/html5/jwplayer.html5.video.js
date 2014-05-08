/**
 * Video tag stuff
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {

	var utils = jwplayer.utils, 
		events = jwplayer.events, 
		states = events.state,
		
		TRUE = true,
		FALSE = false;
	
	/** HTML5 video class * */
	jwplayer.html5.video = function(_videotag, _name) {
		_name = _name || '';
		var _isIE = utils.isIE(),
			_mediaEvents = {
				abort : _generalHandler,
				canplay : _canPlayHandler,
				canplaythrough : _generalHandler,
				durationchange : _durationUpdateHandler,
				emptied : _generalHandler,
				ended : _endedHandler,
				error : _errorHandler,
				loadeddata : _generalHandler,
				loadedmetadata : _canPlayHandler,
				loadstart : _generalHandler,
				pause : _playHandler,
				play : _playHandler,
				playing : _playHandler,
				progress : _progressHandler,
				ratechange : _generalHandler,
				readystatechange : _generalHandler,
				seeked : _sendSeekEvent,
				seeking : _isIE ? _bufferStateHandler : _generalHandler,
				stalled : _generalHandler,
				suspend : _generalHandler,
				timeupdate : _timeUpdateHandler,
				volumechange : _volumeHandler,
				waiting : _bufferStateHandler,
				webkitbeginfullscreen: _fullscreenBeginHandler,
				webkitendfullscreen: _fullscreenEndHandler
			},
			// DOM container
			_container,
			// Currently playing source
			_source,
			// Current duration
			_duration,
			// Current position
			_position,
			// Whether seeking is ready yet
			_canSeek,
			// Whether we have sent out the BUFFER_FULL event
			_bufferFull,
			// If we should seek on canplay
			_delayedSeek = 0,
			// If we're currently dragging the seek bar
			_dragging = FALSE,
			// Current media state
			_state = states.IDLE,
			// Save the volume state before muting
			_lastVolume,
			// Using setInterval to check buffered ranges
			_bufferInterval = -1,
			// Last sent buffer amount
			_bufferPercent = -1,
			// Whether or not we're listening to video tag events
			_attached = FALSE,
			// Quality levels
			_levels,
			// Current quality level index
			_currentQuality = -1,
			// Whether or not we're on an Android device and Not Chrome
			_isAndroid = utils.isAndroidNative(),
			// Whether or not we're on an iOS 7 device
			_isIOS7 = utils.isIOS(7),
			
			//tracks for ios
			_tracks = [],
			_usedTrack = 0,

			//selected track
			_tracksOnce = false,
			
			// post roll support
			_beforecompleted = FALSE,

			_fullscreenState = null,

			_this = utils.extend(this, new events.eventdispatcher());

		// Constructor
		function _init() {
			if (!_videotag) {
				_videotag = document.createElement("video");
			}

			_setupListeners();

			// Workaround for a Safari bug where video disappears on switch to fullscreen
			if (!_isIOS7)   {
				_videotag.controls = TRUE;
				_videotag.controls = FALSE;
			}
			
			// Enable AirPlay
			_videotag.setAttribute("x-webkit-airplay", "allow");
			
			_attached = TRUE;
		}

		function _setupListeners() {
			utils.foreach(_mediaEvents, function(evt, evtCallback) {
				_videotag.addEventListener(evt, evtCallback, FALSE);
			});
		}

		function _sendEvent(type, data) {
			if (_attached) {
				_this.sendEvent(type, data);
			}
		}

		
		function _generalHandler() {//evt) {
			//if (evt) utils.log("%s %o (%s,%s)", evt.type, evt);
		}

		function _durationUpdateHandler(evt) {
			_generalHandler(evt);
			if (!_attached) return;
			var newDuration = _round(_videotag.duration);
			if (_duration != newDuration) {
				_duration = newDuration;
			}
			if (_isAndroid && _delayedSeek > 0 && newDuration > _delayedSeek) {
				_seek(_delayedSeek);
			}
			_timeUpdateHandler();
		}

		function _timeUpdateHandler(evt) {
			_generalHandler(evt);
			_progressHandler(evt);
			if (!_attached) return;
			if (_state == states.PLAYING && !_dragging) {
				_position = _round(_videotag.currentTime);
				_sendEvent(events.JWPLAYER_MEDIA_TIME, {
					position : _position,
					duration : _duration
				});
				// Working around a Galaxy Tab bug; otherwise _duration should be > 0
//              if (_position >= _duration && _duration > 3 && !utils.isAndroid(2.3)) {
//                  _complete();
//              }
			}
		}

		function _round(number) {
			return (number * 10|0)/10;
		}

		function _canPlayHandler(evt) {
			_generalHandler(evt);
			if (!_attached) return;
			if (!_canSeek) {
				_canSeek = TRUE;
				_sendBufferFull();
			}
			if (evt.type == "loadedmetadata") {
				//fixes Chrome bug where it doesn't like being muted before video is loaded
				if (_videotag.muted) {
					_videotag.muted = FALSE;
					_videotag.muted = TRUE;
				}
				_sendEvent(events.JWPLAYER_MEDIA_META,{
					duration: _videotag.duration,
					height: _videotag.videoHeight,
					width: _videotag.videoWidth
				});
			}
		}
		
		
		
		function _progressHandler(evt) {
			_generalHandler(evt);
			if (_canSeek && _delayedSeek > 0 && !_isAndroid) {
				// Need to set a brief timeout before executing delayed seek; IE9 stalls otherwise.
				if (_isIE) setTimeout(function() {
					if (_delayedSeek > 0) {
						_seek(_delayedSeek);
					}
				}, 200);
				// Otherwise call it immediately
				else _seek(_delayedSeek);
			}
		}
		
		function _sendBufferFull() {
			if (!_bufferFull) {
				_bufferFull = TRUE;
				_sendEvent(events.JWPLAYER_MEDIA_BUFFER_FULL);
			}
		}

		function _playHandler(evt) {
			_generalHandler(evt);
			if (!_attached || _dragging) return;

			if (_videotag.paused) {
				if (_videotag.currentTime == _videotag.duration && _videotag.duration > 3) {
					// Needed as of Chrome 20
					//_complete();
				} else {
					_pause();
				}
			} else {
				if (utils.isFF() && evt.type=="play" && _state == states.BUFFERING) {
					// In FF, we get an extra "play" event on startup - we need to wait for "playing",
					// which is also handled by this function
					return;
				} else {
					_setState(states.PLAYING);

				}
			}
		}

		function _bufferStateHandler(evt) {
			_generalHandler(evt);
			if (!_attached) return;
			if (!_dragging) {
				_setState(states.BUFFERING);
			}
		}

		function _errorHandler() {//evt) {
			if (!_attached) return;
			utils.log("Error playing media: %o", _videotag.error);
			_sendEvent(events.JWPLAYER_MEDIA_ERROR, {
				message: "Error loading media: File could not be played"
			});
			_setState(states.IDLE);
		}

		function _getPublicLevels(levels) {
			var publicLevels;
			if (utils.typeOf(levels)=="array" && levels.length > 0) {
				publicLevels = [];
				for (var i=0; i<levels.length; i++) {
					var level = levels[i], publicLevel = {};
					publicLevel.label = _levelLabel(level) ? _levelLabel(level) : i;
					publicLevels[i] = publicLevel;
				}
			}
			return publicLevels;
		}
		
		function _sendLevels(levels) {
			var publicLevels = _getPublicLevels(levels);
			if (publicLevels) {
				//_sendEvent?
				_this.sendEvent(events.JWPLAYER_MEDIA_LEVELS, {
					levels: publicLevels,
					currentQuality: _currentQuality
				});
			}
		}
		
		function _levelLabel(level) {
			if (level.label) return level.label;
			else return 0;
		}
		
		_this.load = function(item) {
			if (!_attached) return;
			_delayedSeek = 0;
			_duration = item.duration ? item.duration : -1;
			_position = 0;
			
			_levels = item.sources;
			_pickInitialQuality();
			_sendLevels(_levels);
			
			_completeLoad();
		};
		
		function _pickInitialQuality() {
			if (_currentQuality < 0) {
				_currentQuality = 0;
			}
			if (_levels) {
				var cookies = utils.getCookies(),
					label = cookies.qualityLabel;
				for (var i=0; i<_levels.length; i++) {
					if (_levels[i]["default"]) {
						_currentQuality = i;
					}
					if (label && _levels[i].label == label) {
						_currentQuality = i;
						break;
					}
				}
			}

		}
		
		function _completeLoad() {
			_canSeek = FALSE;
			_bufferFull = FALSE;
			_source = _levels[_currentQuality];
			
			_setState(states.BUFFERING); 
			_videotag.src = _source.file;
			_videotag.load();
			//in ios and fullscreen, set controls true, then when it goes to normal screen the controls don't show'
			if (utils.isIOS() && _this.getFullScreen()) {
				_videotag.controls = TRUE;
			}
			_bufferInterval = setInterval(_sendBufferUpdate, 100);

			if (utils.isMobile()) {
				_sendBufferFull();
			}
		}

		_this.stop = function() {
			if (!_attached) return;
			_videotag.removeAttribute("src");
			if (!_isIE) {
				_videotag.load();
			}
			_currentQuality = -1;
			clearInterval(_bufferInterval);
			_setState(states.IDLE);
		};

		_this.play = function() {
			if (_attached && !_dragging) {
				_videotag.play();
			}
		};

		var _pause = _this.pause = function() {
			if (_attached) {
				_videotag.pause();
				_setState(states.PAUSED);
			}
		};
			
		_this.seekDrag = function(state) {
			if (!_attached) return; 
			_dragging = state;
			if (state) {
				_videotag.pause();
			} else {
				_videotag.play();
			}
		};
		
		var _seek = _this.seek = function(seekPos) {
			if (!_attached) return; 

			if (!_dragging && _delayedSeek === 0) {
				_sendEvent(events.JWPLAYER_MEDIA_SEEK, {
					position: _position,
					offset: seekPos
				});
			}

			if (_canSeek) {
				_delayedSeek = 0;
				_videotag.currentTime = seekPos;
			} else {
				_delayedSeek = seekPos;
			}
			
		};
		
		function _sendSeekEvent(evt) {
			_generalHandler(evt);
			if (!_dragging && _state != states.PAUSED) {
				_setState(states.PLAYING);
			}
		}

		var _volume = _this.volume = function(vol) {
			if (utils.exists(vol)) {
				_videotag.volume = Math.min(Math.max(0, vol / 100), 1);
				_lastVolume = _videotag.volume * 100;
			}
		};
		
		function _volumeHandler() {//evt) {
			_sendEvent(events.JWPLAYER_MEDIA_VOLUME, {
				volume: Math.round(_videotag.volume * 100)
			});
			_sendEvent(events.JWPLAYER_MEDIA_MUTE, {
				mute: _videotag.muted
			});
		}
		
		_this.mute = function(state) {
			if (!utils.exists(state)) state = !_videotag.muted;
			if (state) {
				_lastVolume = _videotag.volume * 100;
				_videotag.muted = TRUE;
			} else {
				_volume(_lastVolume);
				_videotag.muted = FALSE;
			}
		};

		/** Set the current player state * */
		function _setState(newstate) {
			// Handles a FF 3.5 issue
			if (newstate == states.PAUSED && _state == states.IDLE) {
				return;
			}
			
			// Ignore state changes while dragging the seekbar
			if (_dragging) return;

			if (_state != newstate) {
				var oldstate = _state;
				_state = newstate;
				_sendEvent(events.JWPLAYER_PLAYER_STATE, {
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
				_sendEvent(events.JWPLAYER_MEDIA_BUFFER, {
					bufferPercent: Math.round(_bufferPercent * 100)
				});
			}
			if (newBuffer >= 1) {
				clearInterval(_bufferInterval);
			}
		}
		
		function _getBuffer() {
			if (!_videotag.duration || _videotag.buffered.length === 0) {
				return 0;
			}
			return _videotag.buffered.end(_videotag.buffered.length-1) / _videotag.duration;
		}
		
		function _endedHandler(evt) {
			_generalHandler(evt);
			if (_attached) _complete();
		}
		
		function _complete() {
			if (_state != states.IDLE) {
				_currentQuality = -1;
				_beforecompleted = TRUE;
				_sendEvent(events.JWPLAYER_MEDIA_BEFORECOMPLETE);


				if (_attached) {
					_setState(states.IDLE);
					_beforecompleted = FALSE;
					_sendEvent(events.JWPLAYER_MEDIA_COMPLETE);
				}
			}
		}

		function _fullscreenBeginHandler(e) {
			_fullscreenState = true;
			_sendFullscreen(e);
			// show controls on begin fullscreen so that they are disabled properly at end
			if (utils.isIOS()) {
				_videotag.controls = FALSE;
			}
		}

		function _fullscreenEndHandler(e) {
			_fullscreenState = false;
			_sendFullscreen(e);
			if (utils.isIOS()) {
				_videotag.controls = FALSE;
			}
		}

		function _sendFullscreen(e) {
			_sendEvent('fullscreenchange', {
				target: e.target,
				jwstate: _fullscreenState
			});
		}
		
		this.addCaptions = function(tracks) {
			if (utils.isIOS() && _videotag.addTextTrack && !_tracksOnce) {
				var TextTrackCue = window.TextTrackCue;
				utils.foreach(tracks, function(index,elem) {
					if (elem.data) {
					  _usedTrack = index;
						var track = _videotag.addTextTrack(elem.kind, elem.label);//findTrack(elem.kind,elem.label);
						utils.foreach(elem.data, function(ndx, element) {
							if (ndx % 2 == 1) {
								track.addCue(new TextTrackCue(element.begin, elem.data[parseInt(ndx)+1].begin, element.text));
							}
						});
						_tracks.push(track);
						track.mode = "hidden";
					}
				});
			}
		};

		// function findTrack(kind, label) {
		//     for (var i = 0; i < _videotag.textTracks.length; i++) {
		//       if(_videotag.textTracks[i].label === label) {
		//           _usedTrack = i;
		//           return _videotag.textTracks[i];
		//         }
		//     }
		//     var track = _videotag.addTextTrack(kind,label);
		//     _usedTrack = _videotag.textTracks.length - 1;
		//     return track;
		// }
		
		this.resetCaptions = function() {
			/*
			if (_tracks.length > 0) {
				_tracksOnce = true;
			}
			_tracks = [];
			
			for (var i = 0; i < _videotag.textTracks.length; i++) {


			   while( _videotag.textTracks[i].cues && _videotag.textTracks[i].cues.length && _videotag.textTracks[i].cues.length > 0) {
				   _videotag.textTracks[i].removeCue(_videotag.textTracks[i].cues[0]);
			   }
			   
			  //_videotag.textTracks[i].mode = "disabled";
			}*/
		};


		this.fsCaptions = function(state) {//, curr) {
			if (utils.isIOS() && _videotag.addTextTrack && !_tracksOnce) {
				var ret = null;
			   
				utils.foreach(_tracks, function(index,elem) {
					if (!state && elem.mode == "showing") {
						ret = parseInt(index);
					}
					if (!state)
						elem.mode = "hidden";
				});
			   /*if (state && _tracks[0]) {
					_videotag.textTracks[0].mode = "showing";
					_videotag.textTracks[0].mode = "hidden";
					if (curr > 0) {
						_tracks[curr-1].mode = "showing";
					}
				}*/
				if (!state) {
					return ret;
				}
			}
		};
		
		this.checkComplete = function() {
			return _beforecompleted;
		};

		/**
		 * Return the video tag and stop listening to events  
		 */
		_this.detachMedia = function() {
			_attached = FALSE;
			// _canSeek = FALSE;
			return _videotag;
		};
		
		/**
		 * Begin listening to events again  
		 */
		_this.attachMedia = function(seekable) {
			_attached = TRUE;
			if (!seekable) {
				_canSeek = FALSE;
			}
			if (_beforecompleted) {
				_setState(states.IDLE);
				_sendEvent(events.JWPLAYER_MEDIA_COMPLETE);
				_beforecompleted = FALSE;
			}
		};

		_this.setContainer = function(element) {
			_container = element;
			element.appendChild(_videotag);
		};

		_this.setVisibility = function(state) {
			state = !!state;
			if (state || _isAndroid) {
				// Changing visibility to hidden on Android < 4.2 causes 
				// the pause event to be fired. This causes audio files to 
				// become unplayable. Hence the video tag is always kept 
				// visible on Android devices.
				utils.css.style(_container, {
					visibility: 'visible',
					opacity: 1
				});
			} else {
				utils.css.style(_container, {
					visibility: '',
					opacity: 0
				}); 
			}
		};

		_this.resize = function(width, height, stretching) {
			utils.stretch(stretching,
				_videotag, 
				width, height, 
				_videotag.videoWidth, _videotag.videoHeight);
		};

		_this.setControls = function(state) {
			_videotag.controls = !!state;
		};

		_this.setFullScreen = function(state) {
			state = !!state;

			// This implementation if for iOS and Android WebKit only
			// This won't get called if the player contain can go fullscreen
			if (state) {
				try {
					var enterFullscreen =
					_videotag.webkitEnterFullscreen ||
					_videotag.webkitEnterFullScreen;
					if (enterFullscreen) {
						enterFullscreen.apply(_videotag);
					}
				} catch(e) {
					//object can't go fullscreen
					return false;
				}
				return _this.getFullScreen();

			} else {
				var exitFullscreen =
				_videotag.webkitExitFullscreen ||
				_videotag.webkitExitFullScreen;
				if (exitFullscreen) {
					exitFullscreen.apply(_videotag);
				}
			}

			return state;
		};

		_this.getFullScreen = function() {
			return _fullscreenState || _videotag.webkitDisplayingFullscreen;
		};
		
		_this.audioMode = function() {
			if (!_levels) {
				return FALSE;
			}
			var type = _levels[0].type;
			return (type == "aac" || type == "mp3" || type == "vorbis");
		};

		_this.setCurrentQuality = function(quality) {
			if (_currentQuality == quality) return;
			quality = parseInt(quality, 10);
			if (quality >=0) {
				if (_levels && _levels.length > quality) {
					_currentQuality = quality;
					utils.saveCookie("qualityLabel", _levels[quality].label);
					_sendEvent(events.JWPLAYER_MEDIA_LEVEL_CHANGED, {
						currentQuality: quality,
						levels: _getPublicLevels(_levels)
					});
					var currentTime = _videotag.currentTime;
					_completeLoad();
					_this.seek(currentTime);
				}
			}
		};
		
		_this.getCurrentQuality = function() {
			return _currentQuality;
		};
		
		_this.getQualityLevels = function() {
			return _getPublicLevels(_levels);
		};
		
		_init();

	};

})(jwplayer);
