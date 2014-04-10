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
			// media item, state
			_item = null,
			_state = states.IDLE,
			// function to call once api and view are ready
			_readyCallback = null,
			// update timer
			_playingInterval = -1;

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
			var videoLayer = document.getElementById(_playerId + '_media');
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
				if (_readyCallback) {
					_readyCallback.apply(_this);
					//_readyCallback = null;
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

		function _dispatchEvent(type, data) {
			_this.sendEvent(type, data);
		}

		function _embedYoutubePlayer() {
			console.log('YT _embedYoutubePlayer');

			if (!_ytVideoId) {
				throw 'invalid Youtube ID';
			}

			// get video container
			var videoLayer = _getVideoLayer();

			// TODO: hide jwplayer.vid
			// videoLayer.innerHTML = '';

			videoLayer.appendChild(_element);		

			var ytConfig = {
				height: '100%',
				width: '100%',
				videoId: _ytVideoId,
				playerVars: {
					autoplay: 0,
					controls: 0
				},
				events: {
					onReady: function(event) {
						console.log('Youtube ready', event);

						_setState(states.PAUSED);

						// FIXME: show element
						setTimeout(function() {
							utils.css.style(videoLayer, {
								opacity: 1,
								visible: 'visible'
							});
							if (utils.isMobile()) {
								utils.css.style(document.querySelector('.jwcontrols'), {
									display: 'none'
								});
							}
						}, 0);
						

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
						case -1: //unstarted
						case 2: //paused
							return _setState(states.PAUSED);
						case 3: //buffering
							return _setState(states.BUFFERING);
						// case 0: //ended
						// case 5: //video cued (5)
						}
						return _setState(states.IDLE);
					},
					onPlaybackQualityChange: function(event) {
						console.log('Youtube quality change', event, event.target.getAvailableQualityLevels());
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
			_readyCallback = null;
			console.log('YT created player', _ytPlayer);
		}

		// Additional Provider Methods (not yet implemented in html5.video)

		_this.init = function(item) {
			console.log('YT init', item);
			_ytVideoId = utils.youTubeID(item.sources[0].file);
			_readyCallback = _embedYoutubePlayer;
			_readyCheck();
		};

		_this.destroy = function() {
			console.log('YT destroy');
			// TODO: remove element
			clearInterval(_playingInterval);
			_this =
			_youtube =
			_ytPlayer =
			_element =
			_item = null;
		};


		_this.getElement = function() {
			console.log('YT getElement');
			return _element; 
		};

		// Video Provider API
		_this.load = function(item) {
			console.log('YT load', item);
			_item = item;
			_setState(states.BUFFERING);

			if (!_youtube) {
				// _item will be loaded when API is ready
				return;
			}

			if (!_ytPlayer) {
				_embedYoutubePlayer();
			}
		};
		
		_this.stop = function() {
			console.log('YT stop');
			_ytPlayer.stopVideo();
			_item = null;
		};
				
		_this.play = function() {
			console.log('YT play');
			_ytPlayer.playVideo();
		}
		
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
		};

		// TODO: player must not expect tag to be video for all providers
		_this.getTag = function() {
			console.error('getTag called for Youtube');
			return document.createElement('video');
			//return _element; 
		};
		
		_this.audioMode = _alwaysReturn(false);
		_this.setCurrentQuality = noop;
		_this.getCurrentQuality = _alwaysReturn(0);
		_this.getQualityLevels = _alwaysReturn(['Auto']);
		_this.checkComplete = _alwaysReturn(false);
	};

	function _alwaysReturn(val) {
		return function() {
			return val;
		}
	}
	
	function noop() {}
	
})(window, document);
