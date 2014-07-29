(function(jwplayer) {

    var utils = jwplayer.utils,
        events = jwplayer.events,
        states = events.state,
        DefaultProvider = jwplayer.html5.DefaultProvider,
        _scriptLoader = new utils.scriptloader(window.location.protocol + '//www.youtube.com/iframe_api'),
        _isMobile = utils.isMobile(),
        _isSafari = utils.isSafari();

    function YoutubeProvider(_playerId) {

        this.state = states.IDLE;

        var _this = utils.extend(this, new jwplayer.events.eventdispatcher('provider.' + this.name)),
            // Youtube API and Player Instance
            _youtube = window.YT,
            _ytPlayer = null,
            // iFrame Container (this element will be replaced by iFrame element)
            _element = document.createElement('div'),
            // view container
            _container,
            // player state
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

        this.setState = function(state) {
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

            DefaultProvider.setState.apply(this, arguments);
        };

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
            _scriptLoader = null;
            // console.log('Error loading Youtube iFrame API: %o', event);
            // TODO: dispatch video error
        }

        function _getVideoLayer() {
            var videoLayer = _element && _element.parentNode;
            if (!videoLayer) {
                // if jwplayer DOM is not ready, do Youtube embed on jwplayer ready
                if (!_listeningForReady) {
                    jwplayer(_playerId).onReady(_readyCheck);
                    _listeningForReady = true;
                }
                return false;
            }
            return videoLayer;
        }

        function _readyCheck() {
            if (_youtube && _getVideoLayer()) {
                // if setItem cued up a video, this callback will handle it now
                if (_youtubeEmbedReadyCallback) {
                    _youtubeEmbedReadyCallback.apply(_this);
                }
            }
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


        function _round(number) {
            return Math.round(number*10)/10;
        }
        function _timeUpdateHandler() {
            _bufferUpdate();
            _this.sendEvent(events.JWPLAYER_MEDIA_TIME, {
                position: _round(_ytPlayer.getCurrentTime()),
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
                _this.sendEvent(events.JWPLAYER_MEDIA_BUFFER, {
                    bufferPercent: bufferPercent
                });
                //if (bufferPercent === 100) this.sendEvent(events.JWPLAYER_MEDIA_BUFFER_FULL);
            }
        }

        function _ended() {
            if (_this.state !== states.IDLE) {
                _beforecompleted = true;
                _this.sendEvent(events.JWPLAYER_MEDIA_BEFORECOMPLETE);
                _this.setState(states.IDLE);
                _beforecompleted = false;
                _this.sendEvent(events.JWPLAYER_MEDIA_COMPLETE);
            }
        }

        function _sendMetaEvent() {
            _this.sendEvent(events.JWPLAYER_MEDIA_META, {
                duration: _ytPlayer.getDuration(),
                width: _element.clientWidth,
                height: _element.clientHeight
            });
        }

        function _embedYoutubePlayer(videoId, playerVars) {
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
                    origin: location.protocol + '//' + location.hostname
                }, playerVars),
                events: {
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

            switch (event.data) {

                case youtubeStates.UNSTARTED: // -1: //unstarted
                    _this.setState(states.BUFFERING);
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
                        _this.sendEvent(events.JWPLAYER_MEDIA_LEVELS, {
                            levels: _this.getQualityLevels(),
                            currentQuality: _this.getCurrentQuality()
                        });

                    }
                    _this.setState(states.PLAYING);
                    return;

                case youtubeStates.PAUSED: // 2: //paused
                    _this.setState(states.PAUSED);
                    return;

                case youtubeStates.BUFFERING: // 3: //buffering
                    _this.setState(states.BUFFERING);
                    return;

                case youtubeStates.CUED: // 5: //video cued (idle before playback)
                    _this.setState(states.IDLE);
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

        function _onYoutubePlayerError() {
            _this.sendEvent(events.JWPLAYER_MEDIA_ERROR, {
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
                    _ytPlayer.stopVideo();
                    _ytPlayer.clearVideo();
                } catch (e) {
                    //console.error('Error stopping YT', e);
                }
            }
        }
        // Additional Provider Methods (not yet implemented in html5.video)

        this.init = function(item) {
            // For now, we want each youtube provider to delete and start from scratch
            //this.destroy();

            // load item on embed for mobile touch to start
            _setItem(item);
        };

        this.destroy = function() {
            _cleanup();
            _container =
                _element =
                _youtube =
                _this = null;
        };

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


        // Video Provider API
        this.load = function(item) {
            this.setState(states.BUFFERING);

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

            if (!_youtube) {
                // load item when API is ready
                _youtubeEmbedReadyCallback = function() {
                    // enabling autoplay here also throws an exception
                    _embedYoutubePlayer(videoId);
                };
                _readyCheck();
                return;
            }

            if (!_ytPlayer) {
                _embedYoutubePlayer(videoId, {
                    autoplay: _requiresUserInteraction ? 0 : 1
                });
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

        this.stop = function() {
            _stopVideo();
            this.setState(states.IDLE);
        };

        this.play = function() {
            if (_requiresUserInteraction) {
                return;
            }
            if (_ytPlayer.playVideo) {
                _ytPlayer.playVideo();
            }
        };

        this.pause = function() {
            if (_requiresUserInteraction) {
                return;
            }
            if (_ytPlayer.pauseVideo) {
                _ytPlayer.pauseVideo();
            }
        };

        this.seek = function(position) {
            if (_requiresUserInteraction) {
                return;
            }
            if (_ytPlayer.seekTo) {
                _ytPlayer.seekTo(position);
            }
        };

        this.volume = function(volume) {
            if (!_ytPlayer) {
                return;
            }
            // TODO: proper volume (controller should handle logic)
            _ytPlayer.setVolume(volume);
        };

        this.mute = function(mute) {
            if (!_ytPlayer) {
                return;
            }
            // TODO: proper mute (controller should handle logic)
            if (mute) {
                _ytPlayer.setVolume(0);
            }
        };

        this.detachMedia = function() {
            // temp return a video element so instream doesn't break.
            // FOR VAST: prevent instream from being initialized while casting

            return document.createElement('video');
        };

        this.attachMedia = function() {
            if (_beforecompleted) {
                this.setState(states.IDLE);
                this.sendEvent(events.JWPLAYER_MEDIA_COMPLETE);
                _beforecompleted = false;
            }
        };

        this.setContainer = function(element) {
            _container = element;
            element.appendChild(_element);
            this.setVisibility(true);
        };

        this.getContainer = function() {
            return _container;
        };

        this.supportsFullscreen = function() {
            return !!(_container && (_container.requestFullscreen ||
                _container.requestFullScreen ||
                _container.webkitRequestFullscreen ||
                _container.webkitRequestFullScreen ||
                _container.webkitEnterFullscreen ||
                _container.webkitEnterFullScreen ||
                _container.mozRequestFullScreen ||
                _container.msRequestFullscreen));
        };

        this.remove = function() {
            // clean everything up (this provider should be destroyed and reinstantaited after being removed)
            _cleanup();
        };

        this.setVisibility = function(state) {
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

        this.resize = function(width, height, stretching) {
            return utils.stretch(stretching,
                _element,
                width, height,
                _element.clientWidth, _element.clientHeight);
        };

        this.checkComplete = function() {
            return _beforecompleted;
        };

        this.getCurrentQuality = function() {
            if (!_ytPlayer) {
                return;
            }
            if (_ytPlayer.getAvailableQualityLevels) {
                var ytQuality = _ytPlayer.getPlaybackQuality();
                var ytLevels = _ytPlayer.getAvailableQualityLevels();
                return ytLevels.indexOf(ytQuality);
            }
            return -1;
        };

        this.getQualityLevels = function() {
            if (!_ytPlayer) {
                return;
            }
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

        this.setCurrentQuality = function(quality) {
            if (!_ytPlayer) {
                return;
            }
            if (_ytPlayer.getAvailableQualityLevels) {
                var ytLevels = _ytPlayer.getAvailableQualityLevels();
                if (ytLevels.length) {
                    var ytQuality = ytLevels[ytLevels.length - quality - 1];
                    _ytPlayer.setPlaybackQuality(ytQuality);
                }
            }
        };
    }

    // Clear up the memory, this is called by Google
    window.onYouTubeIframeAPIReady = function() {
        _scriptLoader = null;
    };

    function supports(source) {
        return (source.type === 'youtube' || utils.isYouTube(source.file));
    }

    // Required configs
    YoutubeProvider.prototype = DefaultProvider;
    YoutubeProvider.supports = supports;

    jwplayer.html5.YoutubeProvider = YoutubeProvider;

})(jwplayer);
