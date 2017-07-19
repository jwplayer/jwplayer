define([
    'utils/helpers',
    'utils/css',
    'utils/underscore',
    'events/events',
    'events/states',
    'utils/scriptloader',
    'providers/default',
    'utils/backbone.events'
], function(utils, cssUtils, _, events, states, Scriptloader, DefaultProvider, Events) {
    var _scriptLoader = new Scriptloader(window.location.protocol + '//www.youtube.com/iframe_api');
    var _isMobile = utils.isMobile();

    function YoutubeProvider(_playerId, _playerConfig) {
        this.state = states.IDLE;

        _.extend(this, Events);

        var _this = this;
        var _youtubeAPI = window.YT;
        var _youtubePlayer = null;
        var _element = document.createElement('div');
        var _container;
        var _bufferPercent = -1;
        var _listeningForReady = false;
        var _youtubeEmbedReadyCallback = null;
        var _youtubePlayerReadyCallback = null;
        var _playingInterval = -1;
        var _youtubeState = -1;
        var _requiresUserInteraction = _isMobile;

        this.setState = function(state) {
            clearInterval(_playingInterval);
            if (state !== states.IDLE && state !== states.COMPLETE) {
                // always run this interval when not idle because we can't trust events from iFrame
                _playingInterval = setInterval(_checkPlaybackHandler, 250);
                if (state === states.PLAYING) {
                    this.seeking = false;
                } else if (state === states.LOADING || state === states.STALLED) {
                    _bufferUpdate();
                }
            }

            DefaultProvider.setState.apply(this, arguments);
        };

        // Load iFrame API
        if (!_youtubeAPI && _scriptLoader && _scriptLoader.getStatus() === Scriptloader.loaderstatus.NEW) {
            _scriptLoader.on(events.COMPLETE, _onLoadSuccess);
            _scriptLoader.on(events.ERROR, _onLoadError);
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
            if (_scriptLoader) {
                _scriptLoader.off();
                _scriptLoader = null;
                // console.log('Error loading Youtube iFrame API: %o', event);
                // TODO: dispatch video error
            }
        }

        function _getVideoLayer() {
            var videoLayer = _element && _element.parentNode;
            if (!videoLayer) {
                // if jwplayer DOM is not ready, do Youtube embed on jwplayer ready
                if (!_listeningForReady) {
                    window.jwplayer(_playerId).onReady(_readyCheck);
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
            return Math.round(number * 10) / 10;
        }
        function _timeUpdateHandler() {
            _bufferUpdate();
            _this.trigger(events.JWPLAYER_MEDIA_TIME, {
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
                _this.trigger(events.JWPLAYER_MEDIA_BUFFER, {
                    bufferPercent: bufferPercent
                });
                // if (bufferPercent === 100) this.trigger(events.JWPLAYER_MEDIA_BUFFER_FULL);
            }
        }

        function _ended() {
            if (_this.state !== states.IDLE && _this.state !== states.COMPLETE) {
                _this.trigger(events.JWPLAYER_MEDIA_COMPLETE);
            }
        }

        function _sendMetaEvent() {
            _this.trigger(events.JWPLAYER_MEDIA_META, {
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
                while (i--) {
                    result = args[i].call(this, result);
                }
                return result;
            };
        }

        function _embedYoutubePlayer(videoId, playerVars) {
            if (!videoId) {
                throw new Error('invalid Youtube ID');
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
                playerVars: _.extend({
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
                    // play video on android to avoid being stuck in this state
                    if (utils.isAndroid()) {
                        _youtubePlayer.playVideo();
                    }
                    return;

                case youtubeStates.ENDED: // 0: //ended (idle after playback)
                    _ended();
                    return;

                case youtubeStates.PLAYING: // 1: playing
                    // prevent duplicate captions when using JW Player captions and YT video has yt:cc=on
                    if (_.isFunction(_youtubePlayer.unloadModule)) {
                        _youtubePlayer.unloadModule('captions');
                    }

                    // playback has started so stop blocking api.play()
                    _requiresUserInteraction = false;

                    // sent meta size and duration
                    _sendMetaEvent();

                    // send levels when playback starts
                    _this.trigger(events.JWPLAYER_MEDIA_LEVELS, {
                        levels: _this.getQualityLevels(),
                        currentQuality: _this.getCurrentQuality()
                    });

                    _this.setState(states.PLAYING);
                    return;

                case youtubeStates.PAUSED: // 2: //paused
                    _this.setState(states.PAUSED);
                    return;

                case youtubeStates.BUFFERING: // 3: //buffering
                    if (_this.seeking) {
                        _this.setState(states.LOADING);
                    } else {
                        _this.setState(states.STALLED);
                    }
                    return;

                case youtubeStates.CUED: // 5: //video cued (idle before playback)
                    _this.setState(states.IDLE);
                    // play video on android to avoid being stuck in this state
                    if (utils.isAndroid()) {
                        _youtubePlayer.playVideo();
                    }
                    return;
                default:
                    break;
            }
        }

        function _onYoutubePlaybackQualityChange() {
            // This event is where the Youtube player and media is actually ready and can be played
            // Make sure playback starts/resumes
            if (_youtubeState !== _youtubeAPI.PlayerState.ENDED) {
                _this.play();
            }

            _this.trigger(events.JWPLAYER_MEDIA_LEVEL_CHANGED, {
                currentQuality: _this.getCurrentQuality(),
                levels: _this.getQualityLevels()
            });
        }

        function _onYoutubePlayerError() {
            _this.trigger(events.JWPLAYER_MEDIA_ERROR, {
                message: 'Error loading YouTube: Video could not be played'
            });
        }

        function _readyViewForMobile() {
            if (_isMobile) {
                _this.setVisibility(true);
            }
        }
        // Internal operations

        function _stopVideo() {
            clearInterval(_playingInterval);
            if (_youtubePlayer && _youtubePlayer.stopVideo) {
                utils.tryCatch(function() {
                    _youtubePlayer.stopVideo();
                    _youtubePlayer.clearVideo();
                });
            }
        }
        // Additional Provider Methods (not yet implemented in html5.video)

        this.init = function(item) {
            // For now, we want each youtube provider to delete and start from scratch
            // this.destroy();

            // load item on embed for mobile touch to start
            _setItem(item);
        };

        this.destroy = function() {
            this.remove();
            this.off();

            _container =
                _element =
                _youtubeAPI =
                _this = null;
        };


        // Video Provider API
        this.load = function(item) {
            this.setState(states.LOADING);

            _setItem(item);
            // start playback if api is ready
            _this.play();
        };

        function _setItem(item) {
            _youtubePlayerReadyCallback = null;
            var url = item.sources[0].file;
            var videoId = utils.youTubeID(url);

            _this.volume(_playerConfig.volume);
            _this.mute(_playerConfig.mute);
            _this.setVisibility(true);

            if (!_youtubeAPI || !_youtubePlayer) {
                // wait for API to be present and jwplayer DOM to be instantiated
                _youtubeEmbedReadyCallback = function() {
                    _embedYoutubePlayer(videoId);
                };
                // make sure _youtubeAPI is set before running readyCheck
                _onLoadSuccess();
                return;
            }

            if (!_youtubePlayer.getPlayerState) {
                var onStart = function() {
                    _this.load(item);
                };
                if (_youtubePlayerReadyCallback) {
                    _youtubePlayerReadyCallback = _composeCallbacks(onStart, _youtubePlayerReadyCallback);
                } else {
                    _youtubePlayerReadyCallback = onStart;
                }
                return;
            }

            var videoData = _youtubePlayer.getVideoData();
            var currentVideoId = videoData && videoData.video_id;

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
            } else if (_youtubePlayerReadyCallback) {
                // If the _youtubePlayer isn't setup, then play when we're ready
                _youtubePlayerReadyCallback = _composeCallbacks(this.play, _youtubePlayerReadyCallback);
            } else {
                _youtubePlayerReadyCallback = this.play;
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
                this.seeking = true;
                _youtubePlayer.seekTo(position);
            }
        };

        this.volume = function(vol) {
            if (!_.isNumber(vol)) {
                return;
            }
            var volume = Math.min(Math.max(0, vol), 100);
            if (_youtubePlayer && _youtubePlayer.getVolume) {
                _youtubePlayer.setVolume(volume);
            }

        };

        this.mute = function(mute) {
            var muted = utils.exists(mute) ? !!mute : !_playerConfig.mute;
            if (_youtubePlayer && _youtubePlayer.mute) {
                if (muted) {
                    _youtubePlayer.mute();
                } else {
                    _youtubePlayer.unMute();
                }
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
                cssUtils.style(_element, {
                    display: 'block'
                });
                cssUtils.style(_container, {
                    visibility: 'visible',
                    opacity: 1
                });
            } else if (!_isMobile) {
                // hide
                cssUtils.style(_container, {
                    opacity: 0
                });
            }
        };

        this.resize = function() {
            return false;
        };

        this.getCurrentQuality = function() {
            if (!_youtubePlayer) {
                return -1;
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
                    label: _.without(ytLevels, 'auto')
                };
            }

            var qualityArray = _.map(ytLevels, function(val) {
                return {
                    label: val
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

        this.getName = YoutubeProvider.getName;
    }

    YoutubeProvider.getName = function() {
        return { name: 'youtube' };
    };

    YoutubeProvider.register = function(jwplayer) {
        jwplayer.api.registerProvider(YoutubeProvider);
    };

    return YoutubeProvider;

});
