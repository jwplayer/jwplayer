(function(jwplayer) {

    var utils = jwplayer.utils,
        _ = jwplayer._,
        events = jwplayer.events,
        states = events.state,
        clearInterval = window.clearInterval,
        DefaultProvider = jwplayer.html5.DefaultProvider,
        _isIE = utils.isMSIE(),
        _isMobile = utils.isMobile(),
        _isSafari = utils.isSafari(),
        _isAndroid = utils.isAndroidNative(),
        _isIOS7 = utils.isIOS(7);


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

    function _round(number) {
        return Math.floor(number*10) / 10;
    }

    function VideoProvider(_playerId) {

        // Current media state
        this.state = states.IDLE;

        var _dispatcher = new jwplayer.events.eventdispatcher('provider.' + this.name);
        utils.extend(this, _dispatcher);

        var _this = this,
            _mediaEvents = {
                abort: _generalHandler,
                canplay: _canPlayHandler,
                canplaythrough: _generalHandler,
                click : _onClickHandler,
                durationchange: _durationUpdateHandler,
                emptied: _generalHandler,
                ended: _endedHandler,
                error: _errorHandler,
                loadeddata: _generalHandler,
                loadedmetadata: _canPlayHandler,
                loadstart: _generalHandler,
                pause: _playHandler,
                play: _playHandler,
                playing: _playHandler,
                progress: _progressHandler,
                ratechange: _generalHandler,
                readystatechange: _generalHandler,
                seeked: _sendSeekEvent,
                seeking: _isIE ? _bufferStateHandler : _generalHandler,
                stalled: _generalHandler,
                suspend: _generalHandler,
                timeupdate: _timeUpdateHandler,
                volumechange: _volumeHandler,
                waiting: _bufferStateHandler,
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
            // If we're currently dragging the seek bar
            _dragging = false,
            // Save the volume state before muting
            _lastVolume,
            // Using setInterval to check buffered ranges
            _bufferInterval = -1,
            // Last sent buffer amount
            _bufferPercent = -1,
            // Whether or not we're listening to video tag events
            _attached = false,
            // Quality levels
            _levels,
            // Current quality level index
            _currentQuality = -1,

            // post roll support
            _beforecompleted = false,

            _fullscreenState = false;

        // Overwrite the event dispatchers to block on certain occasions
        this.sendEvent = function() {
            if (!_attached) { return; }

            _dispatcher.sendEvent.apply(this, arguments);
        };


        // Find video tag, or create it if it doesn't exist
        var element = document.getElementById(_playerId);
        var _videotag = element.querySelector('video');
        _videotag = _videotag || document.createElement('video');

        _setupListeners(_mediaEvents, _videotag);

        // Workaround for a Safari bug where video disappears on switch to fullscreen
        if (!_isIOS7) {
            _videotag.controls = true;
            _videotag.controls = false;
        }

        // Enable AirPlay
        _videotag.setAttribute('x-webkit-airplay', 'allow');
        _videotag.setAttribute('webkit-playsinline', '');


        _attached = true;


        function _generalHandler() {
            //if (evt) {
            //    utils.log('%s %o (%s,%s)', evt.type, evt);
            //}
        }

        function _onClickHandler() {
            _this.sendEvent(events.JWPLAYER_PROVIDER_CLICK);
        }

        function _durationUpdateHandler(evt) {
            _generalHandler(evt);
            if (!_attached) { return; }
            var newDuration = _round(_videotag.duration);
            if (_duration !== newDuration) {
                _duration = newDuration;
            }
            if (_isAndroid && _delayedSeek > 0 && newDuration > _delayedSeek) {
                _this.seek(_delayedSeek);
            }
            _timeUpdateHandler();
        }

        function _timeUpdateHandler(evt) {
            _generalHandler(evt);
            _progressHandler(evt);

            if (!_attached) { return; }
            if (_this.state === states.PLAYING && !_dragging) {
                _position = _round(_videotag.currentTime);
                // do not allow _durationUpdateHandler to update _canSeek before _canPlayHandler does
                if (evt) {
                    _canSeek = true;
                }
                _this.sendEvent(events.JWPLAYER_MEDIA_TIME, {
                    position: _position,
                    duration: _duration
                });
                // Working around a Galaxy Tab bug; otherwise _duration should be > 0
                //              if (_position >= _duration && _duration > 3 && !utils.isAndroid(2.3)) {
                //                  _complete();
                //              }
            }
        }

        function sendMetaEvent() {
            _this.sendEvent(events.JWPLAYER_MEDIA_META, {
                duration: _videotag.duration,
                height: _videotag.videoHeight,
                width: _videotag.videoWidth
            });
        }

        function _canPlayHandler(evt) {
            _generalHandler(evt);

            if (!_attached) {
                return;
            }

            if (!_canSeek) {
                _canSeek = true;
                _sendBufferFull();
            }
            if (evt.type === 'loadedmetadata') {
                //fixes Chrome bug where it doesn't like being muted before video is loaded
                if (_videotag.muted) {
                    _videotag.muted = false;
                    _videotag.muted = true;
                }
                sendMetaEvent();
            }
        }

        function _progressHandler(evt) {
            _generalHandler(evt);
            if (_canSeek && _delayedSeek > 0 && !_isAndroid) {
                // Need to set a brief timeout before executing delayed seek; IE9 stalls otherwise.
                if (_isIE) {
                    setTimeout(function() {
                        if (_delayedSeek > 0) {
                            _this.seek(_delayedSeek);
                        }
                    }, 200);
                } else {
                    // Otherwise call it immediately
                    _this.seek(_delayedSeek);
                }
            }
        }

        function _sendBufferFull() {
            if (!_bufferFull) {
                _bufferFull = true;
                _this.sendEvent(events.JWPLAYER_MEDIA_BUFFER_FULL);
            }
        }

        function _playHandler(evt) {
            _generalHandler(evt);
            if (!_attached || _dragging) {
                return;
            }

            if (_videotag.paused) {
                if (_videotag.currentTime === _videotag.duration && _videotag.duration > 3) {
                    // Needed as of Chrome 20
                    //_complete();
                } else {
                    _this.pause();
                }
            } else {
                if (utils.isFF() && evt.type === 'play' && _this.state === states.BUFFERING) {
                    // In FF, we get an extra "play" event on startup - we need to wait for "playing",
                    // which is also handled by this function
                    return;
                } else {
                    _this.setState(states.PLAYING);
                }
            }
        }

        function _bufferStateHandler(evt) {
            _generalHandler(evt);
            if (!_attached) {
                return;
            }
            if (!_dragging) {
                _this.setState(states.BUFFERING);
            }
        }

        function _errorHandler() { //evt) {
            if (!_attached) {
                return;
            }
            utils.log('Error playing media: %o %s', _videotag.error, _videotag.src || _source.file);
            _this.sendEvent(events.JWPLAYER_MEDIA_ERROR, {
                message: 'Error loading media: File could not be played'
            });
            _this.setState(states.IDLE);
        }

        function _getPublicLevels(levels) {
            var publicLevels;
            if (utils.typeOf(levels) === 'array' && levels.length > 0) {
                publicLevels = [];
                for (var i = 0; i < levels.length; i++) {
                    var level = levels[i],
                        publicLevel = {};
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
            if (level.label) {
                return level.label;
            }

            return 0;
        }

        function _pickInitialQuality() {
            if (_currentQuality < 0) {
                _currentQuality = 0;
            }
            if (_levels) {
                var cookies = utils.getCookies(),
                    label = cookies.qualityLabel;
                for (var i = 0; i < _levels.length; i++) {
                    if (_levels[i]['default']) {
                        _currentQuality = i;
                    }
                    if (label && _levels[i].label === label) {
                        _currentQuality = i;
                        break;
                    }
                }
            }

        }

        function _forceVideoLoad() {
            // These browsers will not replay videos without reloading them
            return (_isMobile || _isSafari);
        }

        function _completeLoad(startTime, duration) {

            _source = _levels[_currentQuality];

            clearInterval(_bufferInterval);
            _bufferInterval = setInterval(_sendBufferUpdate, 100);

            _delayedSeek = 0;

            var sourceChanged = (_videotag.src !== _source.file);
            if (sourceChanged || _forceVideoLoad()) {
                if (!_isMobile) {
                    // don't change state on mobile because a touch event may be required to start playback
                    _this.setState(states.BUFFERING);
                }
                _canSeek = false;
                _bufferFull = false;
                _duration = duration ? duration : -1;
                _videotag.src = _source.file;
                _videotag.load();
            } else {
                // Load event is from the same video as before
                if (startTime === 0) {
                    // restart video without dispatching seek event
                    _delayedSeek = -1;
                    _this.seek(startTime);
                }
                // meta event is usually triggered by load, and is needed for googima to work on replay
                sendMetaEvent();
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

        this.stop = function() {
            if (!_attached) { return; }
            clearInterval(_bufferInterval);
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
        };

        this.load = function(item) {
            if (!_attached) {
                return;
            }

            _levels = item.sources;
            _pickInitialQuality();
            _sendLevels(_levels);

            _completeLoad(item.starttime || 0, item.duration);
        };

        this.play = function() {
            if (_attached && !_dragging) {
                _videotag.play();
            }
        };

        this.pause = function() {
            if (_attached) {
                _videotag.pause();
                this.setState(states.PAUSED);
            }
        };

        this.seekDrag = function(state) {
            if (!_attached) {
                return;
            }
            _dragging = state;
            if (state) {
                _videotag.pause();
            } else {
                _videotag.play();
            }
        };

        this.seek = function(seekPos) {
            if (!_attached) {
                return;
            }

            if (!_dragging && _delayedSeek === 0) {
                this.sendEvent(events.JWPLAYER_MEDIA_SEEK, {
                    position: _position,
                    offset: seekPos
                });
            }

            if (_canSeek) {
                _delayedSeek = 0;
                // handle readystate issue
                try {
                    _videotag.currentTime = seekPos;
                } catch (e) {
                    _delayedSeek = seekPos;
                }

            } else {
                _delayedSeek = seekPos;
            }

        };

        function _sendSeekEvent(evt) {
            _generalHandler(evt);
            if (!_dragging && _this.state !== states.PAUSED) {
                _this.setState(states.PLAYING);
            }
        }

        this.volume = function(vol) {
            if (utils.exists(vol)) {
                _videotag.volume = Math.min(Math.max(0, vol / 100), 1);
                _lastVolume = _videotag.volume * 100;
            }
        };

        function _volumeHandler() {
            _this.sendEvent(events.JWPLAYER_MEDIA_VOLUME, {
                volume: Math.round(_videotag.volume * 100)
            });
            _this.sendEvent(events.JWPLAYER_MEDIA_MUTE, {
                mute: _videotag.muted
            });
        }

        this.mute = function(state) {
            if (!utils.exists(state)) { state = !_videotag.muted; }

            if (state) {
                _lastVolume = _videotag.volume * 100;
                _videotag.muted = true;
            } else {
                this.volume(_lastVolume);
                _videotag.muted = false;
            }
        };

        /** Set the current player state * */
        this.setState = function(newstate) {
            // Handles a FF 3.5 issue
            if (newstate === states.PAUSED && this.state === states.IDLE) {
                return;
            }

            // Ignore state changes while dragging the seekbar
            if (_dragging) { return; }

            DefaultProvider.setState.apply(this, arguments);
        };

        function _sendBufferUpdate() {
            if (!_attached) { return; }
            var newBuffer = _getBuffer();

            if (newBuffer >= 1) {
                clearInterval(_bufferInterval);
            }

            if (newBuffer !== _bufferPercent) {
                _bufferPercent = newBuffer;
                _this.sendEvent(events.JWPLAYER_MEDIA_BUFFER, {
                    bufferPercent: Math.round(_bufferPercent * 100)
                });
            }
        }

        function _getBuffer() {
            var buffered = _videotag.buffered;
            if (!buffered || !_videotag.duration || buffered.length === 0) {
                return 0;
            }
            return buffered.end(buffered.length-1) / _videotag.duration;
        }

        function _endedHandler(evt) {
            _generalHandler(evt);
            if (_attached) {
                _complete();
            }
        }

        function _complete() {
            if (_this.state !== states.IDLE) {
                clearInterval(_bufferInterval);
                _currentQuality = -1;
                _beforecompleted = true;
                _this.sendEvent(events.JWPLAYER_MEDIA_BEFORECOMPLETE);


                if (_attached) {
                    _this.setState(states.IDLE);
                    _beforecompleted = false;
                    _this.sendEvent(events.JWPLAYER_MEDIA_COMPLETE);
                }
            }
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
            _this.sendEvent('fullscreenchange', {
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
            clearInterval(_bufferInterval);
            _attached = false;
            // _canSeek = false;
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

            // This is after a postroll completes
            if (_beforecompleted) {
                this.setState(states.IDLE);
                this.sendEvent(events.JWPLAYER_MEDIA_COMPLETE);
                _beforecompleted = false;
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

            clearInterval(_bufferInterval);

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

        this.resize = function(width, height, stretching) {
            return utils.stretch(stretching,
                _videotag,
                width, height,
                _videotag.videoWidth, _videotag.videoHeight);
        };

        this.setControls = function(state) {
            _videotag.controls = !!state;
        };

        this.supportsFullscreen = _.constant(true);

        this.setFullScreen = function(state) {
            state = !!state;

            // This implementation is for iOS and Android WebKit only
            // This won't get called if the player contain can go fullscreen
            if (state) {
                try {
                    var enterFullscreen =
                        _videotag.webkitEnterFullscreen ||
                        _videotag.webkitEnterFullScreen;
                    if (enterFullscreen) {
                        enterFullscreen.apply(_videotag);
                    }
                } catch (e) {
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

        this.isAudioFile = function() {
            if (!_levels) {
                return false;
            }
            var type = _levels[0].type;
            return (type === 'oga' || type === 'aac' || type === 'mp3' || type === 'vorbis');
        };

        this.setCurrentQuality = function(quality) {
            if (_currentQuality === quality) {
                return;
            }
            quality = parseInt(quality, 10);
            if (quality >= 0) {
                if (_levels && _levels.length > quality) {
                    _currentQuality = quality;
                    utils.saveCookie('qualityLabel', _levels[quality].label);
                    this.sendEvent(events.JWPLAYER_MEDIA_LEVEL_CHANGED, {
                        currentQuality: quality,
                        levels: _getPublicLevels(_levels)
                    });
                    var time = _round(_videotag.currentTime);
                    var duration = _round(_videotag.duration);
                    if (duration <= 0) {
                        duration = _duration;
                    }
                    _completeLoad(time, duration);
                }
            }
        };

        this.getCurrentQuality = function() {
            return _currentQuality;
        };

        this.getQualityLevels = function() {
            return _getPublicLevels(_levels);
        };

    }

    // Register provider
    var F = function(){};
    F.prototype = DefaultProvider;
    VideoProvider.prototype = new F();
    VideoProvider.supports = _.constant(true);

    jwplayer.html5.VideoProvider = VideoProvider;

})(jwplayer);
