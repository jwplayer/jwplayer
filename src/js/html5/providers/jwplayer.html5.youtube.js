(function(window, document) {
	
	var jwplayer = window.jwplayer,
		utils = jwplayer.utils,
		events = jwplayer.events,
		states = events.state,
		_scriptLoader = new utils.scriptloader(window.location.protocol + '//www.youtube.com/iframe_api');

	window.onYouTubeIframeAPIReady = function() {
		// console.log('onYouTubeIframeAPIReady', window.YT);
		_scriptLoader = null;
    };

	jwplayer.html5.youtube = function(_playerId) {

		var _this = utils.extend(this, new events.eventdispatcher('html5.youtube')),
			// Youtube API and Player Instance
			_youtube = window.YT,
			_ytPlayer = null,
			// iFrame Container (this element will be replaced by iFrame element)
			_element = document.createElement('div'),
			// view container
			_container,
			// player state
			_state = states.IDLE,
			_bufferPercent = -1,
			// only add player ready listener once 
			_listeningForReady = false,
			// function to call once api and view are ready
			_youtubeEmbedReadyCallback = null,
			// update timer
			_playingInterval = -1,
			// current Youtube state, tracked because state events fail to fire
			_youtubeState = -1,
			// post roll support
			_beforecompleted = false;

		// Load iFrame API
		if (!_youtube && _scriptLoader) {
			_scriptLoader.addEventListener(events.COMPLETE, _onLoadSuccess);
			_scriptLoader.addEventListener(events.ERROR, _onLoadError);
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

		function _onLoadError() {
			// console.log('Error loading Youtube iFrame API: %o', event);
			// TODO: dispatch video error
		}

		function _getVideoLayer() {
			var videoLayer = _element.parentNode;
			if (!videoLayer) {
				// console.log(_playerId, 'YT DOM not ready');
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

		function _readyCheck() {
			// console.log(_playerId, 'YT _readyCheck', !!_youtube && !!_getVideoLayer(), event);
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
			if (state === states.IDLE) {
				clearInterval(_playingInterval);
			} else {
				// always run this interval when not idle because we can't trust events from iFrame
				_playingInterval = setInterval(_checkPlaybackHandler, 250);
				if (state === states.PLAYING) {
					_resetViewForMobile();
				} else if (state === states.BUFFERING) {
					_bufferUpdate();
				}
			}
			_dispatchEvent(events.JWPLAYER_PLAYER_STATE, change);
		}

		function _checkPlaybackHandler() {
			// return if player is not initialized and ready
			if (!_ytPlayer || !_ytPlayer.getPlayerState) {
				return;
			}
			// manually check for state changes since API fails to do so
			var youtubeState = _ytPlayer.getPlayerState();
			if (youtubeState !== null &&
				youtubeState !== undefined &&
				youtubeState !== _youtubeState) {
				// console.log('manual state update', 'state', _getYoutubePlayerStateString());
				_youtubeState = youtubeState;
				_onYoutubeStateChange({
					data: youtubeState
				});
			}
			// handle time and buffer updates
			var youtubeStates = _youtube.PlayerState;
			if (youtubeState === youtubeStates.PLAYING) {
				_timeUpdateHandler();
			} else if (youtubeState === youtubeStates.BUFFERING) {
				_bufferUpdate();
			}
			
		}

		// function _getYoutubePlayerStateString() {
		// 	var state = _ytPlayer.getPlayerState();
		// 	var states = _youtube.PlayerState;
		// 	for (var name in states) {
		// 		if (states[name] === state) {
		// 			return name;
		// 		}
		// 	}
		// 	return 'unknown';
		// }

		function _timeUpdateHandler() {
			_bufferUpdate();
			_dispatchEvent(events.JWPLAYER_MEDIA_TIME, {
				position : (_ytPlayer.getCurrentTime() * 10|0)/10,
				duration : _ytPlayer.getDuration()
			});
		}

		function _bufferUpdate() {
			var bufferPercent = 0;
			if (_ytPlayer && _ytPlayer.getVideoLoadedFraction) {
				bufferPercent = Math.round(_ytPlayer.getVideoLoadedFraction() * 100);
			}
			if (_bufferPercent !== bufferPercent) {
				_bufferPercent = bufferPercent;
				_dispatchEvent(events.JWPLAYER_MEDIA_BUFFER, {
					bufferPercent: bufferPercent
				});
				//if (bufferPercent === 100) _dispatchEvent(events.JWPLAYER_MEDIA_BUFFER_FULL);
			}
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
			// console.log(_playerId, 'YT _embedYoutubePlayer');

			if (!videoId) {
				throw 'invalid Youtube ID';
			}

			var videoLayer = _element.parentNode;
			if (!videoLayer) {
				throw 'Youtube iFrame removed from DOM';
			}

			var ytConfig = {
				height: '100%',
				width: '100%',
				videoId: videoId,
				playerVars: utils.extend({
					autoplay: 0,
					controls: 0,
					showinfo: 0,
					rel: 0,
					modestbranding: 0,
					playsinline: 1,
					origin: location.protocol+'//'+location.hostname
				}, playerVars),
				events: {
					onReady: _onYoutubePlayerReady,
					onStateChange: _onYoutubeStateChange,
					onPlaybackQualityChange: _onYoutubePlaybackQualityChange,
					// onPlaybackRateChange: _onYoutubePlaybackRateChange,
					onError: _onYoutubePlayerError
				}
			};

			//visibility fix
			// videoLayer.className = ''; // remove jwvideo
			// videoLayer.style.visibility = 'visible';
			// videoLayer.style.opacity = 1;
			_this.setVisibility(true);

			_ytPlayer = new _youtube.Player(_element, ytConfig);
			_element = _ytPlayer.getIframe();

			_youtubeEmbedReadyCallback = null;

			_readyViewForMobile();

			// console.log(_playerId, 'YT created player', _ytPlayer, ytConfig);
		}

		// Youtube Player Event Handlers
		function _onYoutubePlayerReady() {
			// console.log(_playerId, 'Youtube ready', event, 'state', _getYoutubePlayerStateString(), 'data', _ytPlayer.getVideoData());
			_setState(states.IDLE);

			// TODO: get size from event.target or container
			// _dispatchEvent(events.JWPLAYER_MEDIA_META, {
			// 	duration: event.target.getDuration(),
			// 	width: 400,
			// 	height: 300
			// });

			// _sendLevels 
			// _dispatchEvent(events.JWPLAYER_MEDIA_LEVELS, {
			// 	levels: _this.getQualityLevels(),
			// 	currentQuality: _this.getCurrentQuality()
			// });
		}

		function _onYoutubeStateChange(event) {
			var youtubeStates = _youtube.PlayerState;
			// console.log(_playerId, 'Youtube state change', event, 'state', _getYoutubePlayerStateString(), 'data', _ytPlayer.getVideoData());
			switch(event.data) {
			case youtubeStates.UNSTARTED:// -1: //unstarted
				_setState(states.IDLE);
				return;
			case youtubeStates.ENDED:// 0: //ended
				_ended();
				return;
			case youtubeStates.PLAYING: // 1: playing
				_setState(states.PLAYING);
				return;
			case youtubeStates.PAUSED:// 2: //paused
				_setState(states.PAUSED);
				return;
			case youtubeStates.BUFFERING:// 3: //buffering
				_setState(states.BUFFERING);
				//playvideo
				return;
			case youtubeStates.CUED:// 5: //video cued (5)
				// paused at start
				_setState(states.PAUSED); //_setState(states.IDLE);
				// call play?
				return;
			}
		}

		function _onYoutubePlaybackQualityChange(event) {
			// console.log(_playerId, 'Youtube quality change', event, event.target.getAvailableQualityLevels());
			// make sure playback resumes
			event.target.playVideo();
		}

		// function _onYoutubePlaybackRateChange(event) {
			// console.log(_playerId, 'Youtube rate change', event);
		// }

		function _onYoutubePlayerError(event) {
			// console.error(_playerId, 'Youtube Error', event);
			_dispatchEvent(events.JWPLAYER_MEDIA_ERROR, {
				message: 'Youtube Player Error: '+ event.data
			});
		}

		// Mobile view helpers
		function _readyViewForMobile() {
			if (utils.isMobile()) {
				_this.setVisibility(true);
				// hide controls so use can click on iFrame
				utils.css('#'+ _playerId + ' .jwcontrols', {
					display: 'none'
				});
			}
		}

		function _resetViewForMobile() {
			if (utils.isMobile()) {
				utils.css('#'+ _playerId + ' .jwcontrols', {
					display: ''
				});
			}
		}

		// Internal operations

		function _stopVideo() {
			clearInterval(_playingInterval);
			if (_ytPlayer && _ytPlayer.stopVideo) {
				// console.log(_playerId, 'YT stop internal', 'state', _getYoutubePlayerStateString(), 'data', _ytPlayer.getVideoData());
				try {
					_ytPlayer.stopVideo();
					_ytPlayer.clearVideo();
				} catch(e) {
					console.error('Error stopping YT', e);
				}
			}
		}


		// Additional Provider Methods (not yet implemented in html5.video)

		_this.init = function(item) {
			// console.log(_playerId, 'YT init', item);
			// load item on embed for mobile touch to start
			_setItem(item);
		};

		_this.destroy = function() {
			// console.log(_playerId, 'YT destroy');
			// remove element
			if (_container === _element.parentNode) {
				_container.removeChild(_element);
			}
			clearInterval(_playingInterval);
			_this =
			_youtube =
			_ytPlayer =
			_element = null;
		};


		_this.getElement = function() {
			// console.log(_playerId, 'YT getElement');
			return _element; 
		};

		// Video Provider API
		_this.load = function(item) {
			_setState(states.BUFFERING);
			_setItem(item);
			// start playback if api is ready
			if (_ytPlayer.playVideo) {
				_ytPlayer.playVideo();
			}
		};

		function _setItem(item) {
			var url = item.sources[0].file;
			var videoId = utils.youTubeID(url);

			if (!item.image) {
				item.image = 'http://i.ytimg.com/vi/' + videoId + '/0.jpg';
			}

			_this.setVisibility(true);

			if (!_youtube) {
				// console.log(_playerId, 'YT load on init');
				// load item when API is ready
				_youtubeEmbedReadyCallback = function() {
					// enabling autoplay here also throws an exception
					_embedYoutubePlayer(videoId);
				};
				_readyCheck();
				return;
			}

			if (!_ytPlayer) {
				// console.log(_playerId, 'YT load repeat embed');
				_embedYoutubePlayer(videoId, {
					autoplay: 1
				});
				return;
			}

			if (!_ytPlayer.getPlayerState) {
				console.error(_playerId, 'YT player API is not available');
				return;
			}

			var currentVideoId = _ytPlayer.getVideoData().video_id;

			if (currentVideoId !== videoId) {
				// console.log(_playerId, 'YT loadVideoById', videoId, 'current', currentVideoId, 'state', _getYoutubePlayerStateString(), 'data', _ytPlayer.getVideoData());
				// An exception is thrown by the iframe_api - but the call works
				// it's trying to access an element of the controls which is not present
				// because we disabled control in the setup
				_ytPlayer.loadVideoById(videoId);

				// _ytPlayer.loadVideoByUrl(url);
				// _ytPlayer.cueVideoById(videoId);
				// _ytPlayer.nextVideo();

				// if player is unstarted, ready for mobile
				var youtubeState = _ytPlayer.getPlayerState();
				var youtubeStates = _youtube.PlayerState;
				if (youtubeState === youtubeStates.UNSTARTED || youtubeState === youtubeStates.CUED) {
					_readyViewForMobile();
				}
			} else {
				if (_ytPlayer.getCurrentTime() > 0) {
					// console.log(_playerId, 'seek first then...');
					_ytPlayer.seekTo(0);
				}
				// console.log(_playerId, 'just play', 'state', _getYoutubePlayerStateString());
			}
		}
		
		_this.stop = function() {
			// console.log(_playerId, 'YT stop');
			_stopVideo();
			_setState(states.IDLE);
		};
				
		_this.play = function() {
			// console.log(_playerId, 'YT play', 'state', _getYoutubePlayerStateString());
			_ytPlayer.playVideo();
		};
		
		_this.pause = function() {
			// console.log(_playerId, 'YT pause', 'state', _getYoutubePlayerStateString());
			_ytPlayer.pauseVideo();
		};

		_this.seekDrag = noop;

		_this.seek = function(position) {
			// console.log(_playerId, 'YT seek');
			_ytPlayer.seekTo(position);

			// _sendEvent(events.JWPLAYER_MEDIA_SEEK, {
			// 	position: _position,
			// 	offset: seekPos
			// });
		};

		_this.volume = function(volume) {
			// console.log(_playerId, 'YT volume', volume);
			if (!_ytPlayer) return;
			// TODO: proper volume (controller should handle logic)
			_ytPlayer.setVolume(volume);
		};

		_this.mute = function(mute) {
			// console.log(_playerId, 'YT mute', mute);
			if (!_ytPlayer) return;
			// TODO: proper mute (controller should handle logic)
			if (mute) {
				_ytPlayer.setVolume(0);
			}
		};
		
		_this.detachMedia = function() {
			// temp return a video element so instream doesn't break.
			// FOR VAST: prevent instream from being initialized while casting
			// console.error(_playerId, 'detachMedia called for Youtube');
			return document.createElement('video');
		};

		_this.attachMedia = function() {
			// console.error(_playerId, 'attachMedia called for Youtube');
			if (_beforecompleted) {
				_setState(states.IDLE);
				_dispatchEvent(events.JWPLAYER_MEDIA_COMPLETE);
				_beforecompleted = false;
			}
		};

		_this.setContainer = function(element) {
			// console.log('add YT to DOM');
			_container = element;
			element.appendChild(_element);
			_this.setVisibility(true);
		};

		_this.getContainer = function() {
			return _container;
		};

		_this.supportsFullscreen = function() {
			return !utils.isIPad();
		};
	
		_this.remove = function() {
			// stop video silently
			_stopVideo();
			// don't remove, just hide so we can reuse player
			utils.css.style(_element, {
				display: 'none'
			});
			// if (_container === _element.parentNode) {
			// 	// console.log('hide YT in DOM');
			// 	_container.removeChild(_element);
			// }
		};

		_this.setVisibility = function(state) {
			state = !!state;
			if (state) {
				// Changing visibility to hidden on Android < 4.2 causes 
				// the pause event to be fired. This causes audio files to 
				// become unplayable. Hence the video tag is always kept 
				// visible on Android devices.
				utils.css.style(_element, {
					display: 'block'
				});
				utils.css.style(_container, {
					visibility: 'visible',
					opacity: 1
				});
			} else {
				if (!utils.isMobile()) {
					utils.css.style(_container, {
						opacity: 0
					}); 
				}
			}
		};

		_this.resize = function(width, height, stretching) {
			// TODO: look into Youtube resize method
			//_container
			utils.stretch(stretching,
				_element,
				width, height,
				_element.clientWidth, _element.clientHeight);
		};

		_this.setFullScreen =
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
