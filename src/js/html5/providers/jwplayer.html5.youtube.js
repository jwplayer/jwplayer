(function(jwplayer) {

    var utils = jwplayer.utils,
        _ = jwplayer._,
        events = jwplayer.events,
        states = events.state,
        DefaultProvider = jwplayer.html5.DefaultProvider,
        _scriptLoader = new utils.scriptloader(window.location.protocol + '//www.youtube.com/iframe_api'),
        _isMobile = utils.isMobile();

    function YoutubeProvider(_playerId) {

        this.state = states.IDLE;

        var _this = utils.extend(this, new jwplayer.events.eventdispatcher('provider.' + this.name)),
            // Youtube API and Player Instance
            _youtubeAPI = window.YT,
            _youtubePlayer = null,
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
            // this is where we keep track of the volume
            _lastVolume,
            // post roll support
            _beforecompleted = false,
            // user must click video to initiate playback, gets set to false once playback starts
            _requiresUserInteraction = _isMobile;

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
        if (!_youtubeAPI && _scriptLoader) {
            _scriptLoader.addEventListener(events.COMPLETE, _onLoadSuccess);
            _scriptLoader.addEventListener(events.ERROR, _onLoadError);
            _scriptLoader.load();
        }

        // setup container
        _element.id = _playerId + '_youtube';

        function _onLoadSuccess() {
            if (window.YT && window.YT.loaded) {
                _youtubeAPI = window.YT;
                _readyCheck();
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
            if (_youtubeAPI && _getVideoLayer()) {
                // if setItem cued up a video, this callback will handle it now
                if (_youtubeEmbedReadyCallback) {
                    _youtubeEmbedReadyCallback.apply(_this);
                }
            }
        }

        function _checkPlaybackHandler() {
            // return if player is not initialized and ready
            if (!_youtubePlayer || !_youtubePlayer.getPlayerState) {
                return;
            }
            // manually check for state changes since API fails to do so
            var youtubeState = _youtubePlayer.getPlayerState();
            if (youtubeState !== null &&
                youtubeState !== undefined &&
                youtubeState !== _youtubeState) {
                _onYoutubeStateChange({
                    data: youtubeState
                });
            }
            // handle time and buffer updates
            var youtubeStates = _youtubeAPI.PlayerState;
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
                position: _round(_youtubePlayer.getCurrentTime()),
                duration: _youtubePlayer.getDuration()
            });
        }

        function _bufferUpdate() {
            var bufferPercent = 0;
            if (_youtubePlayer && _youtubePlayer.getVideoLoadedFraction) {
                bufferPercent = Math.round(_youtubePlayer.getVideoLoadedFraction() * 100);
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
                duration: _youtubePlayer.getDuration(),
                width: _element.clientWidth,
                height: _element.clientHeight
            });
        }

        // Returns a function that is the composition of a list of functions, each
        // consuming the return value of the function that follows.
        function _composeCallbacks() {
            var args = arguments;
            var start = args.length - 1;
            return function() {
                var i = start;
                var result = args[start].apply(this, arguments);
                while (i--) { result = args[i].call(this, result); }
                return result;
            };
        }

        function _embedYoutubePlayer(videoId, playerVars) {
            if (!videoId) {
                throw 'invalid Youtube ID';
            }

            var videoLayer = _element.parentNode;
            if (!videoLayer) {
                // setContainer() hasn't been run yet
                return;
            }

            var ytConfig = {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: utils.extend({
                    html5: 1,
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

            _youtubePlayer = new _youtubeAPI.Player(_element, ytConfig);
            _element = _youtubePlayer.getIframe();

            _youtubeEmbedReadyCallback = null;

            _readyViewForMobile();

            _volumeHandler();
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
            var youtubeStates = _youtubeAPI.PlayerState;
            _youtubeState = event.data;

            switch (_youtubeState) {

                case youtubeStates.UNSTARTED: // -1: //unstarted
                    return;

                case youtubeStates.ENDED: // 0: //ended (idle after playback)
                    _ended();
                    return;

                case youtubeStates.PLAYING: // 1: playing
                
                    //prevent duplicate captions when using JW Player captions and YT video has yt:cc=on
                    if (_.isFunction(_youtubePlayer.unloadModule)) {
                        _youtubePlayer.unloadModule('captions');
                    }

                    // playback has started so stop blocking api.play()
                    _requiresUserInteraction = false;

                    // sent meta size and duration
                    _sendMetaEvent();

                    // send levels when playback starts
                    _this.sendEvent(events.JWPLAYER_MEDIA_LEVELS, {
                        levels: _this.getQualityLevels(),
                        currentQuality: _this.getCurrentQuality()
                    });

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
            if (_youtubeState !== _youtubeAPI.PlayerState.ENDED) {
                _this.play();
            }

            _this.sendEvent(events.JWPLAYER_MEDIA_LEVEL_CHANGED, {
                currentQuality: _this.getCurrentQuality(),
                levels: _this.getQualityLevels()
            });
        }

        function _onYoutubePlayerError() {
            _this.sendEvent(events.JWPLAYER_MEDIA_ERROR, {
                message: 'Error loading YouTube: Video could not be played'
            });
        }

        function _readyViewForMobile() {
            if (_isMobile) {
                _this.setVisibility(true);
                // hide controls so user can click on iFrame
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
            if (_youtubePlayer && _youtubePlayer.stopVideo) {
                try {
                    _youtubePlayer.stopVideo();
                    _youtubePlayer.clearVideo();
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
            this.remove();

            _container =
                _element =
                _youtubeAPI =
                _this = null;
        };


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
                item.image = '//i.ytimg.com/vi/' + videoId + '/0.jpg';
            }

            _this.setVisibility(true);

            if (!_youtubeAPI || !_youtubePlayer) {
                // wait for API to be present and jwplayer DOM to be instantiated
                _youtubeEmbedReadyCallback = function() {
                    _embedYoutubePlayer(videoId);
                };
                _readyCheck();
                return;
            }

            if (!_youtubePlayer.getPlayerState) {
                var onStart = function() {
                    _volumeHandler();
                    _this.load(item);
                };
                if (_youtubePlayerReadyCallback) {
                    _youtubePlayerReadyCallback = _composeCallbacks(onStart, _youtubePlayerReadyCallback);
                } else {
                    _youtubePlayerReadyCallback = onStart;
                }
                return;
            }

            var currentVideoId = _youtubePlayer.getVideoData().video_id;

            if (currentVideoId !== videoId) {
                // An exception is thrown by the iframe_api - but the call works
                // it's trying to access an element of the controls which is not present
                // because we disabled control in the setup
                if (_requiresUserInteraction) {
                    _stopVideo();
                    _youtubePlayer.cueVideoById(videoId);
                } else {
                    _youtubePlayer.loadVideoById(videoId);
                }

                // if player is unstarted, ready for mobile
                var youtubeState = _youtubePlayer.getPlayerState();
                var youtubeStates = _youtubeAPI.PlayerState;
                if (youtubeState === youtubeStates.UNSTARTED || youtubeState === youtubeStates.CUED) {
                    _readyViewForMobile();
                }
            } else {
                // replay current video
                if (_youtubePlayer.getCurrentTime() > 0) {
                    _youtubePlayer.seekTo(0);
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
            if (_youtubePlayer && _youtubePlayer.playVideo) {
                _youtubePlayer.playVideo();
            } else {    // If the _youtubePlayer isn't setup, then play when we're ready
                if (_youtubePlayerReadyCallback) {
                    _youtubePlayerReadyCallback = _composeCallbacks(this.play, _youtubePlayerReadyCallback);
                } else {
                    _youtubePlayerReadyCallback = this.play;
                }
            }
        };

        this.pause = function() {
            if (_requiresUserInteraction) {
                return;
            }
            if (_youtubePlayer.pauseVideo) {
                _youtubePlayer.pauseVideo();
            }
        };

        this.seek = function(position) {
            if (_requiresUserInteraction) {
                return;
            }
            if (_youtubePlayer.seekTo) {
                _youtubePlayer.seekTo(position);
            }
        };

        this.volume = function(volume) {
            if (!_youtubePlayer || !_youtubePlayer.getVolume) {
                return;
            }
            if (utils.exists(volume)) {
                _lastVolume = Math.min(Math.max(0, volume), 100);
                _youtubePlayer.setVolume(_lastVolume);
            }
        };

        function _volumeHandler() {
            if (!_youtubePlayer || !_youtubePlayer.getVolume) {
                return;
            }
            _this.sendEvent(events.JWPLAYER_MEDIA_VOLUME, {
                volume: Math.round(_youtubePlayer.getVolume())
            });
            _this.sendEvent(events.JWPLAYER_MEDIA_MUTE, {
                mute: _youtubePlayer.isMuted()
            });
        }

        this.mute = function(state) {
            if (!_youtubePlayer || !_youtubePlayer.getVolume) {
                return;
            }
            if (!utils.exists(state)) {
                state = !_youtubePlayer.isMuted();
            }

            if (state) {
                _lastVolume = _youtubePlayer.getVolume();
                _youtubePlayer.mute();
            } else {
                this.volume(_lastVolume);
                _youtubePlayer.unMute();
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

        this.setContainer = function(parent) {
            _container = parent;
            parent.appendChild(_element);
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
            _stopVideo();

            // remove element
            if (_element && _container && _container === _element.parentNode) {
                _container.removeChild(_element);
            }

            _youtubeEmbedReadyCallback =
                _youtubePlayerReadyCallback =
                    _youtubePlayer = null;
        };

        this.setVisibility = function(state) {
            state = !!state;
            if (state) {
                // show
                utils.css.style(_element, {
                    display: 'block'
                });
                utils.css.style(_container, {
                    visibility: 'visible',
                    opacity: 1
                });
            } else {
                // hide
                if (!_isMobile) {
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
            if (!_youtubePlayer) {
                return;
            }
            if (_youtubePlayer.getAvailableQualityLevels) {
                var ytQuality = _youtubePlayer.getPlaybackQuality();
                var ytLevels = _youtubePlayer.getAvailableQualityLevels();
                return ytLevels.indexOf(ytQuality);
            }
            return -1;
        };

        this.getQualityLevels = function() {
            if (!_youtubePlayer) {
                return;
            }

            if (!_.isFunction(_youtubePlayer.getAvailableQualityLevels)) {
                return [];
            }

            var ytLevels = _youtubePlayer.getAvailableQualityLevels();

            // If the result is ['auto', 'low'], we prefer to return ['low']
            if (ytLevels.length === 2 && _.contains(ytLevels, 'auto')) {
                return {
                    label : _.without(ytLevels, 'auto')
                };
            }

            var qualityArray = _.map(ytLevels, function(val) {
                return {
                    label : val
                };
            });

            // We expect them in decreasing order
            return qualityArray.reverse();
        };

        this.setCurrentQuality = function(quality) {
            if (!_youtubePlayer) {
                return;
            }
            if (_youtubePlayer.getAvailableQualityLevels) {
                var ytLevels = _youtubePlayer.getAvailableQualityLevels();
                if (ytLevels.length) {
                    var ytQuality = ytLevels[ytLevels.length - quality - 1];
                    _youtubePlayer.setPlaybackQuality(ytQuality);
                }
            }
        };
    }

    // Clear up the memory, this is called by Google
    window.onYouTubeIframeAPIReady = function() {
        _scriptLoader = null;
    };

    function supports(source) {
        return (utils.isYouTube(source.file, source.type));
    }

    // Required configs
    var F = function(){};
    F.prototype = DefaultProvider;
    YoutubeProvider.prototype = new F();
    YoutubeProvider.supports = supports;

    jwplayer.html5.YoutubeProvider = YoutubeProvider;

})(jwplayer);
