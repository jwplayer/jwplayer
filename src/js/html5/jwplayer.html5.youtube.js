(function(window, document) {
	
	var jwplayer = window.jwplayer,
		utils = jwplayer.utils,
		events = jwplayer.events,
		states = events.state,

		SCRIPT_URL = window.location.protocol + '//www.youtube.com/iframe_api',
		_scriptLoader;

	window.onYouTubeIframeAPIReady = function() {
		console.log('onYouTubeIframeAPIReady', window.YT);
		_scriptLoader = null;
    };

	jwplayer.html5.youtube = function(_playerId) {

		var _this = utils.extend(this, new events.eventdispatcher('html5.youtube')),
			// Youtube API and Player Instance
			_youtube = window.YT,
			_ytPlayer = null,
			_ytVideoId = null,
			// iFrame Container (this element will be replaced by iFrame element)
			_element = document.createElement('div'),
			// player state
			_state = states.IDLE,
			// function to call once api and view are ready
			_youtubeEmbedReadyCallback = null,
			// update timer
			_playingInterval = -1,
			// post roll support
            _beforecompleted = false;

		// Load iFrame API
		if (!_youtube && !_scriptLoader) {
			_scriptLoader = new utils.scriptloader(SCRIPT_URL);
			_scriptLoader.addEventListener(events.ERROR, _onLoadError);
			_scriptLoader.addEventListener(events.COMPLETE, _onLoadSuccess);
			_scriptLoader.load();
		}
		// setup container
		_element.id = _playerId + '_youtube';

		function _onLoadSuccess(event) {
			if (window.YT && window.YT.loaded) {
				_youtube = window.YT;
				_readyCheck(event);
			} else {
				// poll until Yo API is loaded
				setTimeout(_onLoadSuccess, 100);
			}
		}

		function _onLoadError(event) {
			console.error('Youtube script Load Error: %o', event);
		}

		var _listeningForReady = false;
		function _getVideoLayer() {
			var videoLayer = _element.parentNode;
			if (!videoLayer) {
				console.log('YT DOM not ready');
				// if DOM is not ready do embed on player ready...
				// TODO: this should happen when container is added and trigger ready when done
				if (!_listeningForReady) {
					jwplayer(_playerId).onReady(_readyCheck);
					_listeningForReady = true;
				}
				return null;
			}
			return videoLayer;
		}

		function _readyCheck(event) {
			console.log('YT _readyCheck', !!_youtube && !!_getVideoLayer(), event);
			if (!!_youtube && !!_getVideoLayer()) {
				// was not able to load item
				if (_youtubeEmbedReadyCallback) {
					_youtubeEmbedReadyCallback.apply(_this);
					//_youtubeEmbedReadyCallback = null;
				}
			}
		}

		function _setState(state) {
			var change = {
				oldstate : _state,
				newstate : state
			};
			_state = state;
			clearInterval(_playingInterval);
			if (state === states.PLAYING) {
				console.log('options', _ytPlayer.getOptions());
				_playingInterval = setInterval(_timeUpdateHandler, 250);
			}
			_dispatchEvent(events.JWPLAYER_PLAYER_STATE, change);
		}

		function _timeUpdateHandler() {
			_dispatchEvent(events.JWPLAYER_MEDIA_BUFFER, {
				bufferPercent: Math.round(_ytPlayer.getVideoLoadedFraction() * 100)
			});
            _dispatchEvent(events.JWPLAYER_MEDIA_TIME, {
                position : (_ytPlayer.getCurrentTime() * 10|0)/10,
                duration : _ytPlayer.getDuration()
            });
		}

		// TODO: checkComplete
		function _ended() {
            if (_state != states.IDLE) {
				_beforecompleted = true;
                _dispatchEvent(events.JWPLAYER_MEDIA_BEFORECOMPLETE);
                _setState(states.IDLE);
                _beforecompleted = false;
                _dispatchEvent(events.JWPLAYER_MEDIA_COMPLETE);
            }
        }

		function _dispatchEvent(type, data) {
			_this.sendEvent(type, data);
		}

		function _embedYoutubePlayer(videoId, playerVars) {
			console.log('YT _embedYoutubePlayer');

			if (!videoId) {
				throw 'invalid Youtube ID';
			}

			var ytConfig = {
				height: '100%',
				width: '100%',
				videoId: videoId,
				playerVars: playerVars || {},
				events: {
					onReady: function(event) {
						console.log('Youtube ready', event);

						_setState(states.IDLE);

						// TODO: get size from event.target or container
						// _dispatchEvent(events.JWPLAYER_MEDIA_META, {
						// 	duration: event.target.getDuration(),
						// 	width: 400,
						// 	height: 300
						// });

						// FIXME: 'playVideo' fails because of iOS's touch event requirement
						//_dispatchEvent(events.JWPLAYER_MEDIA_BUFFER_FULL);

					},
					onStateChange: function(event) {
						console.log('Youtube state change', event);
						switch(event.data) {
						case 1: //playing
							return _setState(states.PLAYING);
						case 2: //paused
							return _setState(states.PAUSED);
						case 3: //buffering
							return _setState(states.BUFFERING);
						// case 5: //video cued (5)
						case -1: //unstarted
							return _setState(states.IDLE);
						case 0: //ended
							return _ended();
						}
						return _setState(states.IDLE);
					},
					onPlaybackQualityChange: function(event) {
						console.log('Youtube quality change', event, event.target.getAvailableQualityLevels());
						// make sure playback resumes
						event.target.playVideo();
					},
					onError: function(event) {
						console.error('Youtube Error', event);
						_dispatchEvent(events.JWPLAYER_MEDIA_ERROR, {
							message: 'Youtube Player Error: '+ event.data
						});
					}
				}
			};

			_ytPlayer = new _youtube.Player(_element, ytConfig);
			_ytVideoId = videoId;
			_youtubeEmbedReadyCallback = null;
			console.log('YT created player', _ytPlayer, ytConfig);
		}

		// Additional Provider Methods (not yet implemented in html5.video)

		_this.init = function(item) {
			console.log('YT init', item);
			// load item on embed for mobile touch to start
			_this.load(item);
		};

		_this.destroy = function() {
			console.log('YT destroy');
			// TODO: remove element
			clearInterval(_playingInterval);
			_this =
			_youtube =
			_ytPlayer =
			_element = null;
		};


		_this.getElement = function() {
			console.log('YT getElement');
			return _element; 
		};

		// Video Provider API
		_this.load = function(item) {
			var url = item.sources[0].file;
			var videoId = utils.youTubeID(url);

			console.log('YT load', videoId, url, item);

			_setState(states.BUFFERING);

			if (!_youtube) {
				console.log('YT load on init');
				// load item when API is ready
				_youtubeEmbedReadyCallback = function() {
					// enabling autoplay here also throws an exception
					_embedYoutubePlayer(videoId, {
						autoplay: 0,
						controls: 0
					});
				};
				_readyCheck();
				return;
			}

			if (!_ytPlayer) {
				console.log('YT load repeat embed');
				_embedYoutubePlayer(videoId, {
					autoplay: 1,
					controls: 0
				});
				return;
			}

			if (_ytVideoId !== videoId) {
				// An exception is thrown by the iframe_api - but the call works
				// it's trying to access an element of the controls which is not present
				// because we disabled control in the setup
				_ytPlayer.loadVideoById(videoId);
				_ytVideoId = videoId;

				// _ytPlayer.loadVideoByUrl(url);
				// _ytPlayer.cueVideoById(_ytVideoId);
				// _ytPlayer.nextVideo();
				
			} else {
				_ytPlayer.seekTo(0);
				_ytPlayer.playVideo();
			}
		};
		
		_this.stop = function() {
			console.log('YT stop');
			// if (!_ytPlayer) return;
			_ytPlayer.stopVideo();
			// _ytVideoId = null;
			_setState(states.IDLE);
		};
				
		_this.play = function() {
			console.log('YT play');
			_ytPlayer.playVideo();
		};
		
		_this.pause = function() {
			console.log('YT pause');
			_ytPlayer.pauseVideo();
		};

		_this.seek = function(position) {
			console.log('YT seek');
			_ytPlayer.seekTo(position);
		};

		_this.volume = function(volume) {
			console.log('YT volume', volume);
			if (!_ytPlayer) return;
			// TODO: proper volume (controller should handle logic)
			_ytPlayer.setVolume(volume);
		};

		_this.mute = function(mute) {
			console.log('YT mute', mute);
			if (!_ytPlayer) return;
			// TODO: proper mute (controller should handle logic)
			if (mute) {
				_ytPlayer.setVolume(0);
			}
		};
		
		_this.seekDrag = noop;

		_this.detachMedia = function() {
			// temp return a video element so instream doesn't break.
			// FOR VAST: prevent instream from being initialized while casting
			console.error('detachMedia called for Youtube');
			return document.createElement('video');
		};

		_this.attachMedia = function() {
			console.error('attachMedia called for Youtube');
			if (_beforecompleted) {
                _setState(states.IDLE);
                _dispatchEvent(events.JWPLAYER_MEDIA_COMPLETE);
                _beforecompleted = false;
            }
		};

		_this.setContainer = function(element) {
			element.appendChild(_element);
		};

		_this.resize = function(width, height, stretching) {
			utils.stretch(stretching,
				_element,
				width, height,
				_element.clientWidth, _element.clientHeight);
		};

		_this.setFullScreen = _alwaysReturn(false);
		_this.getFullScreen = _alwaysReturn(false);

        this.checkComplete = function() {
            return _beforecompleted;
        };

		_this.getCurrentQuality = function() {
			var ytQuality = _ytPlayer.getPlaybackQuality();
			var ytLevels = _ytPlayer.getAvailableQualityLevels();
			return ytLevels.indexOf(ytQuality);
		};

		_this.getQualityLevels = function() {
			var levels = [];
			var ytLevels = _ytPlayer.getAvailableQualityLevels();
			for (var i=ytLevels.length; i--;) {
				levels.push({
					label: ytLevels[i]
				});
			}
			return levels;
		};

		_this.setCurrentQuality = noop;

		_this.setControls = noop;
		_this.audioMode = _alwaysReturn(false);
	};

	function _alwaysReturn(val) {
		return function() {
			return val;
		};
	}
	
	function noop() {}
	
})(window, document);
