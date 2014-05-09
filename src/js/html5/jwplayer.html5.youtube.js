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

		function _onLoadError(event) {
			console.log('Error loading Youtube iFrame API: %o', event);
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
			clearInterval(_playingInterval);
			if (state === states.PLAYING) {
				_resetViewForMobile();
				// console.log(_playerId, 'start time interval. options', _ytPlayer.getOptions());
				_playingInterval = setInterval(_timeUpdateHandler, 250);
			} else if (state === states.BUFFERING) {
				_bufferUpdate();
			}
			_dispatchEvent(events.JWPLAYER_PLAYER_STATE, change);
		}

		function _timeUpdateHandler() {
			_bufferUpdate();
			_dispatchEvent(events.JWPLAYER_MEDIA_TIME, {
				position : (_ytPlayer.getCurrentTime() * 10|0)/10,
				duration : _ytPlayer.getDuration()
			});
		}

		function _bufferUpdate() {
			var bufferPercent = (_ytPlayer && _ytPlayer.getVideoLoadedFraction) ? Math.round(_ytPlayer.getVideoLoadedFraction() * 100) : 0;
			if (_bufferPercent !== bufferPercent) {
				_bufferPercent = bufferPercent;
				_dispatchEvent(events.JWPLAYER_MEDIA_BUFFER, {
					bufferPercent: bufferPercent
				});
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
				throw 'video layer removed from DOM';
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
					onReady: function() {
						// console.log(_playerId, 'Youtube ready', event);
						_setState(states.IDLE);

						// TODO: get size from event.target or container
						// _dispatchEvent(events.JWPLAYER_MEDIA_META, {
						// 	duration: event.target.getDuration(),
						// 	width: 400,
						// 	height: 300
						// });

					},
					onStateChange: function(event) {
						// console.log(_playerId, 'Youtube state change', event);
						switch(event.data) {
						case 1: //playing
							_setState(states.PLAYING);
							return;
						case 2: //paused
							_setState(states.PAUSED);
							return;
						case 3: //buffering
							_setState(states.BUFFERING);
							//playvideo
							return;
						case -1: //unstarted
							_setState(states.IDLE);
							return;
						case 0: //ended
							_ended();
							return;
						//case 5: //video cued (5)
						}
					},
					onPlaybackQualityChange: function(event) {
						// console.log(_playerId, 'Youtube quality change', event, event.target.getAvailableQualityLevels());
						// make sure playback resumes
						event.target.playVideo();
					},
					// onPlaybackRateChange: function(event) {
						// console.log(_playerId, 'Youtube rate change', event);
					// },
					onError: function(event) {
						// console.error(_playerId, 'Youtube Error', event);
						_dispatchEvent(events.JWPLAYER_MEDIA_ERROR, {
							message: 'Youtube Player Error: '+ event.data
						});
					}
				}
			};

			//visibility fix
			// videoLayer.className = ''; // remove jwvideo
			videoLayer.style.visibility = 'visible';
			videoLayer.style.opacity = 1;

			_ytPlayer = new _youtube.Player(_element, ytConfig);
			_element = _ytPlayer.getIframe();

			_youtubeEmbedReadyCallback = null;

			_readyViewForMobile();

			// console.log(_playerId, 'YT created player', _ytPlayer, ytConfig);
		}

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

		// Additional Provider Methods (not yet implemented in html5.video)

		_this.init = function(item) {
			// console.log(_playerId, 'YT init', item);
			// load item on embed for mobile touch to start
			_this.load(item);
		};

		_this.destroy = function() {
			// console.log(_playerId, 'YT destroy');
			// TODO: remove element
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
			var url = item.sources[0].file;
			var videoId = utils.youTubeID(url);

			if (!item.image) {
				item.image = 'http://i.ytimg.com/vi/' + videoId + '/0.jpg';
			}

			_setState(states.BUFFERING);

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

			if (!_ytPlayer.getCurrentTime) {
				// console.error(_playerId, 'YT player API is not available');
				return;
			}

			var currentVideoId = _ytPlayer.getVideoData().video_id;

			if (currentVideoId !== videoId) {
				// An exception is thrown by the iframe_api - but the call works
				// it's trying to access an element of the controls which is not present
				// because we disabled control in the setup
				_ytPlayer.loadVideoById(videoId);

				// _ytPlayer.loadVideoByUrl(url);
				// _ytPlayer.cueVideoById(videoId);
				// _ytPlayer.nextVideo();

				// if player is unstarted, ready for mobile
				if (_ytPlayer.getPlayerState() === -1) {
					_readyViewForMobile();
				}

			} else {
				if (_ytPlayer.getCurrentTime() > 0) {
					// console.log(_playerId, 'seek');
					_ytPlayer.seekTo(0);
				}
				// console.log(_playerId, 'play', _ytPlayer.getPlayerState());
				_ytPlayer.playVideo();
				if (_ytPlayer.getPlayerState() === 1) {
					_setState(states.PLAYING);
				}
			}
		};
		
		_this.stop = function() {
			// console.log(_playerId, 'YT stop');
			// if (!_ytPlayer) return;
			_ytPlayer.stopVideo();
			_setState(states.IDLE);
		};
				
		_this.play = function() {
			// console.log(_playerId, 'YT play');
			_ytPlayer.playVideo();
		};
		
		_this.pause = function() {
			// console.log(_playerId, 'YT pause');
			_ytPlayer.pauseVideo();
		};

		_this.seekDrag = noop;

		_this.seek = function(position) {
			// console.log(_playerId, 'YT seek');
			_ytPlayer.seekTo(position);
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
			_container = element;
			element.appendChild(_element);
		};

		_this.getContainer = function() {
			return _container;
		};

		_this.remove = function() {
			if (_container === _element.parentNode) {
				_container.removeChild(_element);
			}
		};

		_this.setVisibility = function(state) {
			state = !!state;
			if (state) {
				// Changing visibility to hidden on Android < 4.2 causes 
				// the pause event to be fired. This causes audio files to 
				// become unplayable. Hence the video tag is always kept 
				// visible on Android devices.
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
