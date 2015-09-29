define([
    'utils/css',
    'utils/helpers',
    'utils/stretching',
    'utils/underscore',
    'events/events',
    'events/states',
    'providers/default',
    'utils/backbone.events'
], function(cssUtils, utils, stretchUtils, _, events, states, DefaultProvider, Events) {

    var clearTimeout = window.clearTimeout,
        STALL_DELAY = 256,
        _isIE = utils.isMSIE(),
        _isMobile = utils.isMobile(),
        _isSafari = utils.isSafari(),
        _isAndroid = utils.isAndroidNative(),
        _isIOS7 = utils.isIOS(7),
        _name = 'html5';


    function _setupListeners(eventsHash, videoTag) {
        utils.foreach(eventsHash, function(evt, evtCallback) {
            videoTag.addEventListener(evt, evtCallback, false);
        });
    }

    function _removeListeners(eventsHash, videoTag) {
        utils.foreach(eventsHash, function(evt, evtCallback) {
            videoTag.removeEventListener(evt, evtCallback, false);
        });
    }

    function _useAndroidHLS(source) {
        if (source.type === 'hls') {
            //when androidhls is not set to false, allow HLS playback on Android 4.1 and up
            if (source.androidhls !== false) {
                var isAndroidNative = utils.isAndroidNative;
                if (isAndroidNative(2) || isAndroidNative(3) || isAndroidNative('4.0')) {
                    return false;
                } else if (utils.isAndroid()) { //utils.isAndroidNative()) {
                    // skip canPlayType check
                    // canPlayType returns '' in native browser even though HLS will play
                    return true;
                }
            } else if (utils.isAndroid()) {
                return false;
            }
        }
        return null;
    }

    function VideoProvider(_playerId, _playerConfig) {

        // Current media state
        this.state = states.IDLE;

        // Are we buffering due to seek, or due to playback?
        this.seeking = false;

        _.extend(this, Events);

        // Overwrite the event dispatchers to block on certain occasions
        this.trigger = function(type, args) {
            if (!_attached) {
                return;
            }
            return Events.trigger.call(this, type, args);
        };

        var _this = this,
            _mediaEvents = {
                //abort: _generalHandler,
                click : _clickHandler,
                durationchange: _durationChangeHandler,
                //emptied: _generalHandler,
                ended: _endedHandler,
                error: _errorHandler,

                //play: _onPlayHandler, // play is attempted, but hasn't necessarily started
                //loadstart: _generalHandler,
                //loadeddata: _onLoadedData, // we have duration
                loadedmetadata: _loadedMetadataHandler, // we have video dimensions
                canplay: _canPlayHandler,
                playing: _playingHandler,
                progress: _progressHandler,
                //canplaythrough: _generalHandler,

                //pause: _pauseHandler,
                //ratechange: _generalHandler,
                //readystatechange: _generalHandler,
                seeked: _seekedHandler,
                //seeking: _seekingHandler,
                //stalled: _stalledHandler,
                //suspend: _generalHandler,
                timeupdate: _timeUpdateHandler,
                volumechange: _volumeChangeHandler,
                //waiting: _stalledHandler,

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
            _canSeek = false,
            // Whether we have sent out the BUFFER_FULL event
            _bufferFull,
            // If we should seek on canplay
            _delayedSeek = 0,
            // Using setInterval to check buffered ranges
            _playbackTimeout = -1,
            // Last sent buffer amount
            _buffered = -1,
            // Whether or not we're listening to video tag events
            _attached = true,
            // Quality levels
            _levels,
            // Current quality level index
            _currentQuality = -1,

            // android hls doesn't update currentTime so we want to skip the stall check since it always fails
            _isAndroidHLS = null,

            // post roll support
            _beforecompleted = false,

            _fullscreenState = false;

        // Find video tag, or create it if it doesn't exist.  View may not be built yet.
        var element = document.getElementById(_playerId);
        var _videotag = (element) ? element.querySelector('video') : undefined;
        _videotag = _videotag || document.createElement('video');
        _videotag.className = 'jw-video jw-reset';

        _setupListeners(_mediaEvents, _videotag);


        // Workaround for a Safari bug where video disappears on switch to fullscreen
        if (!_isIOS7) {
            _videotag.controls = true;
            _videotag.controls = false;
        }

        // Enable AirPlay
        _videotag.setAttribute('x-webkit-airplay', 'allow');
        _videotag.setAttribute('webkit-playsinline', '');

        function _clickHandler(evt) {
            _this.trigger('click', evt);
        }

        function _durationChangeHandler() {
            if (!_attached) {
                return;
            }

            _setBuffered(_getBuffer(), _position, _videotag.duration);
            _setDuration(_videotag.duration);
        }

        function _progressHandler() {
            if (!_attached) {
                return;
            }

            _setBuffered(_getBuffer(), _position, _duration);
        }

        function _timeUpdateHandler() {
            if (!_attached) {
                return;
            }
            _canSeek = true;
            clearTimeout(_playbackTimeout);
            if (_this.state === states.STALLED) {
                _this.setState(states.PLAYING);
            } else if (_this.state === states.PLAYING) {
                _playbackTimeout = setTimeout(_checkPlaybackStalled, STALL_DELAY);
            }

            _setDuration(_videotag.duration);
            _setPosition(_videotag.currentTime);

            // send time events when playing
            if (_this.state === states.PLAYING) {
                _this.trigger(events.JWPLAYER_MEDIA_TIME, {
                    position: _position,
                    duration: _duration
                });
            }
        }

        function _setBuffered(buffered, currentTime, duration) {
            if (buffered !== _buffered || duration !== _duration) {
                _buffered = buffered;
                _this.trigger(events.JWPLAYER_MEDIA_BUFFER, {
                    bufferPercent: buffered * 100,
                    position: currentTime,
                    duration: duration
                });
            }
        }

        function _setPosition(currentTime) {
            _position = currentTime;
        }

        function _setDuration(duration) {
            _duration = duration;
            if (_delayedSeek > 0 && _duration > _delayedSeek) {
                _this.seek(_delayedSeek);
            }
        }

        function _sendMetaEvent() {
            _this.trigger(events.JWPLAYER_MEDIA_META, {
                duration: _videotag.duration,
                height: _videotag.videoHeight,
                width: _videotag.videoWidth
            });
            _setDuration(_videotag.duration);
        }

        function _canPlayHandler() {
            if (!_attached) {
                return;
            }

            _canSeek = true;
            _sendBufferFull();
        }

        function _loadedMetadataHandler() {
            if (!_attached) {
                return;
            }

            //fixes Chrome bug where it doesn't like being muted before video is loaded
            if (_videotag.muted) {
                _videotag.muted = false;
                _videotag.muted = true;
            }
            _sendMetaEvent();
        }

        function _sendBufferFull() {
            if (!_bufferFull) {
                _bufferFull = true;
                _this.trigger(events.JWPLAYER_MEDIA_BUFFER_FULL);
            }
        }

        function _playingHandler() {
            if (!_attached) {
                return;
            }
            _this.setState(states.PLAYING);
            _this.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME, {});
        }

        function _stalledHandler() {
            if (!_attached) {
                return;
            }

            // Android HLS doesnt update its times correctly so it always falls in here.  Do not allow it to stall.
            if (_isAndroidHLS) {
                return;
            }

            if (_videotag.paused || _videotag.ended) {
                return;
            }

            // A stall after loading/error, should just stay loading/error
            if (_this.state === states.LOADING || _this.state === states.ERROR) {
                return;
            }

            // During seek we stay in paused state
            if (_this.seeking) {
                return;
            }

            _this.setState(states.STALLED);
        }

        function _errorHandler() {
            if (!_attached) {
                return;
            }

            utils.log('Error playing media: %o %s', _videotag.error, _videotag.src || _source.file);
            _this.trigger(events.JWPLAYER_MEDIA_ERROR, {
                message: 'Error loading media: File could not be played'
            });
        }

        function _getPublicLevels(levels) {
            var publicLevels;
            if (utils.typeOf(levels) === 'array' && levels.length > 0) {
                publicLevels = _.map(levels, function(level, i) {
                    return {
                        label: level.label || i
                    };
                });
            }
            return publicLevels;
        }

        function _setLevels(levels) {
            _levels = levels;
            _currentQuality = _pickInitialQuality(levels);
            var publicLevels = _getPublicLevels(levels);
            if (publicLevels) {
                //_trigger?
                _this.trigger(events.JWPLAYER_MEDIA_LEVELS, {
                    levels: publicLevels,
                    currentQuality: _currentQuality
                });
            }
        }

        function _pickInitialQuality(levels) {
            var currentQuality = Math.max(0, _currentQuality);
            var label = _playerConfig.qualityLabel;
            if (levels) {
                for (var i = 0; i < levels.length; i++) {
                    if (levels[i]['default']) {
                        currentQuality = i;
                    }
                    if (label && levels[i].label === label) {
                        return i;
                    }
                }
            }
            return currentQuality;
        }

        function _forceVideoLoad() {
            // These browsers will not replay videos without reloading them
            return (_isMobile || _isSafari);
        }

        function _completeLoad(startTime, duration) {

            _source = _levels[_currentQuality];

            _delayedSeek = 0;
            clearTimeout(_playbackTimeout);

            var sourceChanged = (_videotag.src !== _source.file);
            if (sourceChanged || _forceVideoLoad()) {
                _duration = duration;
                _setVideotagSource();
                _videotag.load();
            } else {
                // Load event is from the same video as before
                if (startTime === 0) {
                    // restart video without dispatching seek event
                    _delayedSeek = -1;
                    _this.seek(startTime);
                }
                // meta event is usually triggered by load, and is needed for googima to work on replay
                _sendMetaEvent();
                _videotag.play();
            }

            _position = _videotag.currentTime;

            if (_isMobile) {
                // results in html5.controller calling video.play()
                _sendBufferFull();
            }

            //in ios and fullscreen, set controls true, then when it goes to normal screen the controls don't show'
            if (utils.isIOS() && _this.getFullScreen()) {
                _videotag.controls = true;
            }

            if (startTime > 0) {
                _this.seek(startTime);
            }
        }

        function _setVideotagSource() {
            _canSeek = false;
            _bufferFull = false;
            _isAndroidHLS = _useAndroidHLS(_source);
            _videotag.src = _source.file;
            // set preload from the source, or default to metadata
            _videotag.setAttribute('preload', _source.preload || 'metadata');
        }

        this.stop = function() {
            if (!_attached) {
                return;
            }
            clearTimeout(_playbackTimeout);
            _videotag.removeAttribute('src');
            if (!_isIE) {
                _videotag.load();
            }
            _currentQuality = -1;
            this.setState(states.IDLE);
        };


        this.destroy = function() {
             _removeListeners(_mediaEvents, _videotag);

            this.remove();
            this.off();
        };

        this.init = function(item) {
            if (!_attached) {
                return;
            }

            _levels = item.sources;
            _currentQuality = _pickInitialQuality(item.sources);
            this.sendMediaType(item.sources);

            _source = _levels[_currentQuality];
            _position = item.starttime || 0;
            _duration = item.duration || 0;
            _setVideotagSource(item);
        };

        this.load = function(item) {
            if (!_attached) {
                return;
            }

            _setLevels(item.sources);
            this.sendMediaType(item.sources);

            if (!_isMobile) {
                // don't change state on mobile because a touch event may be required to start playback
                _this.setState(states.LOADING);
            }
            _completeLoad(item.starttime || 0, item.duration || 0);
        };

        this.play = function() {
            if (_this.seeking) {
                _this.setState(states.LOADING);
                _this.once(events.JWPLAYER_MEDIA_SEEKED, _this.play);
                return;
            }
            _videotag.play();
        };

        this.pause = function() {
            clearTimeout(_playbackTimeout);
            _videotag.pause();
            this.setState(states.PAUSED);
        };

        this.seek = function(seekPos) {
            if (!_attached) {
                return;
            }

            if (_delayedSeek === 0) {
                this.trigger(events.JWPLAYER_MEDIA_SEEK, {
                    position: _videotag.currentTime,
                    offset: seekPos
                });
            }

            if (_canSeek) {
                _delayedSeek = 0;
                // handle readystate issue
                var status = utils.tryCatch(function() {
                    _this.seeking = true;
                    _videotag.currentTime = seekPos;
                });
                if (status instanceof utils.Error) {
                    _delayedSeek = seekPos;
                }
            } else {
                _delayedSeek = seekPos;
            }
        };

        function _seekedHandler() {
            _this.seeking = false;
            _this.trigger(events.JWPLAYER_MEDIA_SEEKED);
        }

        this.volume = function(vol) {
            // volume must be 0.0 - 1.0
            vol = utils.between(vol/100, 0, 1);

            _videotag.volume = vol;
        };

        function _volumeChangeHandler() {
            _this.trigger('volume', {
                volume: Math.round(_videotag.volume * 100)
            });
            _this.trigger('mute', {
                mute: _videotag.muted
            });
        }

        this.mute = function(state) {
            _videotag.muted = !!state;
        };

        function _checkPlaybackStalled() {
            if (!_attached) {
                return;
            }

            // Browsers, including latest chrome, do not always report Stalled events in a timely fashion
            if (_videotag.currentTime === _position) {
                _stalledHandler();
            }
        }

        function _getBuffer() {
            var buffered = _videotag.buffered;
            var duration = _videotag.duration;
            if (!buffered || buffered.length === 0 || duration <= 0 || duration === Infinity) {
                return 0;
            }
            return utils.between(buffered.end(buffered.length-1) / duration, 0, 1);
        }

        function _endedHandler() {
            if (!_attached) {
                return;
            }
            if (_this.state !== states.IDLE && _this.state !== states.COMPLETE) {
                clearTimeout(_playbackTimeout);
                _currentQuality = -1;
                _beforecompleted = true;

                _this.trigger(events.JWPLAYER_MEDIA_BEFORECOMPLETE);
                // This event may trigger the detaching of the player
                //  In that case, playback isn't complete until the player is re-attached
                if (!_attached) {
                    return;
                }

                _playbackComplete();
            }
        }

        function _playbackComplete() {
            clearTimeout(_playbackTimeout);
            _this.setState(states.COMPLETE);
            _beforecompleted = false;
            _this.trigger(events.JWPLAYER_MEDIA_COMPLETE);

        }

        function _fullscreenBeginHandler(e) {
            _fullscreenState = true;
            _sendFullscreen(e);
            // show controls on begin fullscreen so that they are disabled properly at end
            if (utils.isIOS()) {
                _videotag.controls = false;
            }
        }

        function _fullscreenEndHandler(e) {
            _fullscreenState = false;
            _sendFullscreen(e);
            if (utils.isIOS()) {
                _videotag.controls = false;
            }
        }

        function _sendFullscreen(e) {
            _this.trigger('fullscreenchange', {
                target: e.target,
                jwstate: _fullscreenState
            });
        }

        this.checkComplete = function() {
            return _beforecompleted;
        };

        /**
         * Return the video tag and stop listening to events
         */
        this.detachMedia = function() {
            clearTimeout(_playbackTimeout);
            _attached = false;
            return _videotag;
        };

        /**
         * Begin listening to events again
         */
        this.attachMedia = function(seekable) {
            _attached = true;
            if (!seekable) {
                _canSeek = false;
            }

            // In case the video tag was modified while we shared it
            _videotag.loop = false;

            // This is after a postroll completes
            if (_beforecompleted) {
                _playbackComplete();
            }
        };

        this.setContainer = function(element) {
            _container = element;
            element.appendChild(_videotag);
        };

        this.getContainer = function() {
            return _container;
        };

        this.remove = function() {
            // stop video silently
            if (_videotag) {
                _videotag.removeAttribute('src');
                if (!_isIE) {
                    _videotag.load();
                }
            }

            clearTimeout(_playbackTimeout);

            _currentQuality = -1;

            // remove
            if (_container === _videotag.parentNode) {
                _container.removeChild(_videotag);
            }
        };

        this.setVisibility = function(state) {
            state = !!state;
            if (state || _isAndroid) {
                // Changing visibility to hidden on Android < 4.2 causes
                // the pause event to be fired. This causes audio files to
                // become unplayable. Hence the video tag is always kept
                // visible on Android devices.
                cssUtils.style(_container, {
                    visibility: 'visible',
                    opacity: 1
                });
            } else {
                cssUtils.style(_container, {
                    visibility: '',
                    opacity: 0
                });
            }
        };

        this.resize = function(width, height, stretching) {
            return stretchUtils.stretch(stretching,
                _videotag,
                width, height,
                _videotag.videoWidth, _videotag.videoHeight);
        };

        this.setFullscreen = function(state) {
            state = !!state;

            // This implementation is for iOS and Android WebKit only
            // This won't get called if the player contain can go fullscreen
            if (state) {
                var status = utils.tryCatch(function() {
                    var enterFullscreen =
                        _videotag.webkitEnterFullscreen ||
                        _videotag.webkitEnterFullScreen;
                    if (enterFullscreen) {
                        enterFullscreen.apply(_videotag);
                    }

                });

                if (status instanceof utils.Error) {
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
            return _fullscreenState || !!_videotag.webkitDisplayingFullscreen;
        };

        this.setCurrentQuality = function(quality) {
            if (_currentQuality === quality) {
                return;
            }
            quality = parseInt(quality, 10);
            if (quality >= 0) {
                if (_levels && _levels.length > quality) {
                    _currentQuality = quality;
                    this.trigger(events.JWPLAYER_MEDIA_LEVEL_CHANGED, {
                        currentQuality: quality,
                        levels: _getPublicLevels(_levels)
                    });
                    var time = _videotag.currentTime || 0;
                    var duration = _videotag.duration;
                    if (duration <= 0) {
                        duration = _duration;
                    }
                    _this.setState(states.LOADING);
                    _completeLoad(time, duration || 0);
                }
            }
        };

        this.getCurrentQuality = function() {
            return _currentQuality;
        };

        this.getQualityLevels = function() {
            return _getPublicLevels(_levels);
        };

        this.getName = function() {
            return { name : _name };
        };
    }

    // Register provider
    var F = function(){};
    F.prototype = DefaultProvider;
    VideoProvider.prototype = new F();

    return VideoProvider;

});
