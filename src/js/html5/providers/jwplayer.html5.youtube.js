(function(window, document) {

    var jwplayer = window.jwplayer,
        utils = jwplayer.utils,
        events = jwplayer.events,
        states = events.state,
        _scriptLoader = new utils.scriptloader(window.location.protocol + '//www.youtube.com/iframe_api'),
        _isMobile = utils.isMobile(),
        _isSafari = utils.isSafari();

    window.onYouTubeIframeAPIReady = function() {
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
            // function to call once _ytPlayer api is ready
            _youtubePlayerReadyCallback = null,
            // update timer
            _playingInterval = -1,
            // current Youtube state, tracked because state events fail to fire
            _youtubeState = -1,
            // post roll support
            _beforecompleted = false,
            // user must click video to initiate playback, gets set to false once playback starts
            _requiresUserInteraction = (_isMobile || _isSafari),
            // call play when quality changes to avoid video from stalling
            _playOnQualityChange = true;

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
                // if jwplayer DOM is not ready, do Youtube embed on jwplayer ready
                if (!_listeningForReady) {
                    jwplayer(_playerId).onReady(_readyCheck);
                    _listeningForReady = true;
                }
                return null;
            }
            return videoLayer;
        }

        function _readyCheck() {
            if (!!_youtube && !!_getVideoLayer()) {
                // if setItem cued up a video, this callback will handle it now
                if (_youtubeEmbedReadyCallback) {
                    _youtubeEmbedReadyCallback.apply(_this);
                }
            }
        }

        function _setState(state) {
            var change = {
                oldstate: _state,
                newstate: state
            };
            _state = state;
            clearInterval(_playingInterval);
            if (state !== states.IDLE) {
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
                position: (_ytPlayer.getCurrentTime() * 10 | 0) / 10,
                duration: _ytPlayer.getDuration()
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

        function _sendMetaEvent() {
            _dispatchEvent(events.JWPLAYER_MEDIA_META, {
                duration: _ytPlayer.getDuration(),
                width: _element.clientWidth,
                height: _element.clientHeight
            });
        }

        function _embedYoutubePlayer(videoId, playerVars) {
            if (!videoId) {
                throw {
                    name: 'YouTubeID',
                    message: 'Invalid YouTube ID'
                };
            }

            var videoLayer = _element.parentNode;
            if (!videoLayer) {
                throw {
                    name: 'YouTubeVideoLayer',
                    message: 'YouTube iFrame removed from DOM'
                };
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
                    origin: location.protocol + '//' + location.hostname
                }, playerVars),
                events: {
                    // TODO: create delegates that can be redirected to noop after video is stopped
                    onReady: _onYoutubePlayerReady,
                    onStateChange: _onYoutubeStateChange,
                    onPlaybackQualityChange: _onYoutubePlaybackQualityChange,
                    // onPlaybackRateChange: _onYoutubePlaybackRateChange,
                    onError: _onYoutubePlayerError
                }
            };

            // iFrame must be visible or it will not set up properly
            _this.setVisibility(true);

            _ytPlayer = new _youtube.Player(_element, ytConfig);
            _element = _ytPlayer.getIframe();

            _youtubeEmbedReadyCallback = null;

            _readyViewForMobile();
        }

        // Youtube Player Event Handlers
        function _onYoutubePlayerReady() {
            // If setItem was called before the player was ready, update the player now
            if (_youtubePlayerReadyCallback) {
                _youtubePlayerReadyCallback.apply(_this);
                _youtubePlayerReadyCallback = null;
            }
        }

        function _onYoutubeStateChange(event) {
            var youtubeStates = _youtube.PlayerState;
            // console.log(_playerId, 'Youtube state change', event, 'state', _getYoutubePlayerStateString(), 'data', _ytPlayer.getVideoData());
            switch (event.data) {

                case youtubeStates.UNSTARTED: // -1: //unstarted
                    return;

                case youtubeStates.ENDED: // 0: //ended (idle after playback)
                    _ended();
                    return;

                case youtubeStates.PLAYING: // 1: playing

                    // playback has started so stop blocking api.play()
                    _requiresUserInteraction = false;
                    if (_playOnQualityChange) {
                        _playOnQualityChange = false;

                        // sent meta size and duration
                        _sendMetaEvent();

                        // send levels when playback starts
                        _dispatchEvent(events.JWPLAYER_MEDIA_LEVELS, {
                            levels: _this.getQualityLevels(),
                            currentQuality: _this.getCurrentQuality()
                        });

                    }
                    _setState(states.PLAYING);
                    return;

                case youtubeStates.PAUSED: // 2: //paused
                    _setState(states.PAUSED);
                    return;

                case youtubeStates.BUFFERING: // 3: //buffering
                    _setState(states.BUFFERING);
                    return;

                case youtubeStates.CUED: // 5: //video cued (idle before playback)
                    _setState(states.IDLE);
                    return;
            }
        }

        function _onYoutubePlaybackQualityChange() {
            // This event is where the Youtube player and media is actually ready and can be played

            // make sure playback starts/resumes
            if (_playOnQualityChange) {
                _this.play();
            }
        }

        // function _onYoutubePlaybackRateChange(event) {
        // console.log(_playerId, 'Youtube rate change', event);
        // }

        function _onYoutubePlayerError() {
            //console.error('Youtube Player Error:', event.data);
            _dispatchEvent(events.JWPLAYER_MEDIA_ERROR, {
                message: 'Error loading YouTube: Video could not be played'
            });
        }

        // Mobile view helpers
        function _requiresVisibility() {
            //return _requiresUserInteraction;
            return (_isMobile || _isSafari);
        }

        function _readyViewForMobile() {
            if (_requiresVisibility()) {
                _this.setVisibility(true);
                // hide controls so use can click on iFrame
                utils.css('#' + _playerId + ' .jwcontrols', {
                    display: 'none'
                });
            }
        }

        function _resetViewForMobile() {
            utils.css('#' + _playerId + ' .jwcontrols', {
                display: ''
            });
        }

        // Internal operations

        function _stopVideo() {
            clearInterval(_playingInterval);

            if (_ytPlayer && _ytPlayer.stopVideo) {
                try {
                    // TODO: is there a way to remove listeners on _ytPlayer?
                    _ytPlayer.stopVideo();
                    _ytPlayer.clearVideo();
                } catch (e) {
                    //console.error('Error stopping YT', e);
                }
            }
        }

        function _cleanup() {
            // stop video silently
            _stopVideo();
            // remove element
            if (_element && _container && _container === _element.parentNode) {
                _container.removeChild(_element);
            }
            _youtubeEmbedReadyCallback =
                _youtubePlayerReadyCallback =
                _ytPlayer = null;
        }


        // Additional Provider Methods (not yet implemented in html5.video)

        _this.init = function(item) {
            // load item on embed for mobile touch to start
            _setItem(item);
        };

        _this.destroy = function() {
            _cleanup();
            _container =
                _element =
                _youtube =
                _this = null;
        };


        _this.getElement = function() {
            return _element;
        };

        // Video Provider API
        _this.load = function(item) {
            _setState(states.BUFFERING);

            _setItem(item);
            // start playback if api is ready
            _this.play();
        };

        function _setItem(item) {
            _youtubePlayerReadyCallback = null;
            var url = item.sources[0].file;
            var videoId = utils.youTubeID(url);

            if (!item.image) {
                item.image = 'http://i.ytimg.com/vi/' + videoId + '/0.jpg';
            }

            _this.setVisibility(true);

            if (!_ytPlayer) {
                _youtubeEmbedReadyCallback = function() {
                    _embedYoutubePlayer(videoId);
                };
                _readyCheck();
                return;
            }

            if (!_ytPlayer.getPlayerState) {
                _youtubePlayerReadyCallback = function() {
                    _this.load(item);
                };
                return;
            }

            var currentVideoId = _ytPlayer.getVideoData().video_id;

            if (currentVideoId !== videoId) {
                // console.log(_playerId, 'YT loadVideoById', videoId, 'current', currentVideoId, 'state', _getYoutubePlayerStateString(), 'data', _ytPlayer.getVideoData());
                // An exception is thrown by the iframe_api - but the call works
                // it's trying to access an element of the controls which is not present
                // because we disabled control in the setup
                if (_requiresUserInteraction) {
                    _stopVideo();
                    _ytPlayer.cueVideoById(videoId);
                } else {
                    _ytPlayer.loadVideoById(videoId);
                }

                // if player is unstarted, ready for mobile
                var youtubeState = _ytPlayer.getPlayerState();
                var youtubeStates = _youtube.PlayerState;
                if (youtubeState === youtubeStates.UNSTARTED || youtubeState === youtubeStates.CUED) {
                    _readyViewForMobile();
                }
            } else {
                // replay current video
                if (_ytPlayer.getCurrentTime() > 0) {
                    _ytPlayer.seekTo(0);
                }
                _sendMetaEvent();
            }
        }

        _this.stop = function() {
            _stopVideo();
            _setState(states.IDLE);
        };

        _this.play = function() {

            if (_requiresUserInteraction) {
                return;
            }

            if (_ytPlayer.playVideo) {
                _ytPlayer.playVideo();
            }
        };

        _this.pause = function() {
            if (_requiresUserInteraction) {
                return;
            }
            if (_ytPlayer.pauseVideo) {
                _ytPlayer.pauseVideo();
            }
        };

        _this.seek = function(position) {
            if (_requiresUserInteraction) {
                return;
            }
            if (_ytPlayer.seekTo) {
                _ytPlayer.seekTo(position);
            }

            // _sendEvent(events.JWPLAYER_MEDIA_SEEK, {
            // 	position: _position,
            // 	offset: seekPos
            // });
        };

        _this.volume = function(volume) {
            if (!_ytPlayer) return;
            // TODO: proper volume (controller should handle logic)
            _ytPlayer.setVolume(volume);
        };

        _this.mute = function(mute) {
            if (!_ytPlayer) return;
            // TODO: proper mute (controller should handle logic)
            if (mute) {
                _ytPlayer.setVolume(0);
            }
        };

        _this.detachMedia = function() {
            // temp return a video element so instream doesn't break.
            // FOR VAST: prevent instream from being initialized while casting
            return document.createElement('video');
        };

        _this.attachMedia = function() {
            if (_beforecompleted) {
                _setState(states.IDLE);
                _dispatchEvent(events.JWPLAYER_MEDIA_COMPLETE);
                _beforecompleted = false;
            }
        };

        _this.setContainer = function(element) {
            _container = element;
            element.appendChild(_element);
            _this.setVisibility(true);
        };

        _this.getContainer = function() {
            return _container;
        };

        _this.supportsFullscreen = function() {
            return !!(_container && (_container.requestFullscreen ||
                _container.requestFullScreen ||
                _container.webkitRequestFullscreen ||
                _container.webkitRequestFullScreen ||
                _container.webkitEnterFullscreen ||
                _container.webkitEnterFullScreen ||
                _container.mozRequestFullScreen ||
                _container.msRequestFullscreen));
        };

        _this.remove = function() {
            // clean everything up (this provider should be destroyed and reinstantaited after being removed)
            _cleanup();
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
                if (!_requiresVisibility()) {
                    utils.css.style(_container, {
                        opacity: 0
                    });
                }
            }
        };

        _this.resize = function(width, height, stretching) {
            return utils.stretch(stretching,
                _element,
                width, height,
                _element.clientWidth, _element.clientHeight);
        };

        _this.checkComplete = function() {
            return _beforecompleted;
        };

        _this.getCurrentQuality = function() {
            if (!_ytPlayer) return;
            if (_ytPlayer.getAvailableQualityLevels) {
                var ytQuality = _ytPlayer.getPlaybackQuality();
                var ytLevels = _ytPlayer.getAvailableQualityLevels();
                return ytLevels.indexOf(ytQuality);
            }
            return -1;
        };

        _this.getQualityLevels = function() {
            if (!_ytPlayer) return;
            var levels = [];
            if (_ytPlayer.getAvailableQualityLevels) {
                var ytLevels = _ytPlayer.getAvailableQualityLevels();
                for (var i = ytLevels.length; i--;) {
                    levels.push({
                        label: ytLevels[i]
                    });
                }
            }
            return levels;
        };

        _this.setCurrentQuality = function(quality) {
            if (!_ytPlayer) return;
            if (_ytPlayer.getAvailableQualityLevels) {
                var ytLevels = _ytPlayer.getAvailableQualityLevels();
                if (ytLevels.length) {
                    var ytQuality = ytLevels[ytLevels.length - quality - 1];
                    _ytPlayer.setPlaybackQuality(ytQuality);
                }
            }
        };
    };

    // unimplemented provider methods
    jwplayer.html5.youtube.prototype = {
        seekDrag: noop,
        setFullScreen: returnFalse,
        getFullScreen: returnFalse,
        setControls: noop,
        audioMode: returnFalse
    };

    function returnFalse() {
        return false;
    }

    function noop() {}

})(window, document);
