define([
    'utils/css',
    'utils/helpers',
    'utils/dom',
    'utils/underscore',
    'events/events',
    'events/states',
    'providers/default',
    'utils/backbone.events',
    'providers/tracks-mixin'
], function(cssUtils, utils, dom, _, events, states, DefaultProvider, Events, Tracks) {

    var clearTimeout = window.clearTimeout,
        STALL_DELAY = 256,
        MIN_DVR_DURATION = 120,
        _isIE = utils.isIE(),
        _isIE9 = utils.isIE(9),
        _isMSIE = utils.isMSIE(),
        _isMobile = utils.isMobile(),
        _isFirefox = utils.isFF(),
        _isAndroid = utils.isAndroidNative(),
        _isIOS7 = utils.isIOS(7),
        _isIOS8 = utils.isIOS(8),
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

        _.extend(this, Events, Tracks);

        // Overwrite the event dispatchers to block on certain occasions
        this.trigger = function(type, args) {
            if (!_attached) {
                return;
            }
            return Events.trigger.call(this, type, args);
        };

        this.setState = function(state) {
            return DefaultProvider.setState.call(this, state);
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
                loadstart: _onLoadStart,
                loadeddata: _onLoadedData, // we have video tracks (text, audio, metadata)
                loadedmetadata: _loadedMetadataHandler, // we have video dimensions
                canplay: _canPlayHandler,
                playing: _playingHandler,
                progress: _progressHandler,
                //canplaythrough: _generalHandler,

                pause: _pauseHandler,
                //ratechange: _generalHandler,
                //readystatechange: _readyStateHandler,
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
            // mobile sdk configuration
            _isSDK = !!_playerConfig.sdkplatform,
            // post roll support
            _beforecompleted = false,
            // webkit fullscreen media element state
            _fullscreenState = false,
            // function to call when resuming after pause
            _beforeResumeHandler = utils.noop,
            // MediaElement Tracks
            _audioTracks = null,
            _currentAudioTrackIndex = -1,
            _activeCuePosition = -1,
            _visualQuality = { level: {} },
            // whether playback can start on iOS
            _canPlay = false;

        // Find video tag, or create it if it doesn't exist.  View may not be built yet.
        var element = document.getElementById(_playerId);
        var _videotag = (element) ? element.querySelector('video') : undefined;

        function _setAttribute(name, value) {
            _videotag.setAttribute(name, value || '');
        }

        if (!_videotag) {
            _videotag = document.createElement('video');

            if (_isMobile) {
                _setAttribute('jw-gesture-required');
            }
        }

        _videotag.className = 'jw-video jw-reset';

        this.isSDK = _isSDK;
        this.video = _videotag;

        // prevent browser from showing second cast icon
        // https://w3c.github.io/remote-playback/
        if (_.isObject(_playerConfig.cast) && _playerConfig.cast.appid) {
            _setAttribute('disableRemotePlayback', '');
        }

        _setupListeners(_mediaEvents, _videotag);

        // Enable AirPlay
        _setAttribute('x-webkit-airplay', 'allow');
        _setAttribute('webkit-playsinline');
        _setAttribute('playsinline');

        // Enable tracks support for HLS videos
        function _onLoadedData() {
            if (!_attached) {
                return;
            }
            _setAudioTracks(_videotag.audioTracks);
            _this.setTextTracks(_videotag.textTracks);
            _setAttribute('jw-loaded', 'data');
        }

        function _onLoadStart() {
            if (!_attached) {
                return;
            }
            _setAttribute('jw-loaded', 'started');
        }

        function _clickHandler(evt) {
            _this.trigger('click', evt);
        }

        function _durationChangeHandler() {
            if (!_attached || _isAndroidHLS) {
                return;
            }
            _updateDuration(_getDuration());
            _setBuffered(_getBuffer(), _position, _duration);
        }

        function _progressHandler() {
            if (!_attached) {
                return;
            }

            _setBuffered(_getBuffer(), _position, _duration);
        }

        function _timeUpdateHandler() {
            clearTimeout(_playbackTimeout);
            _canSeek = true;
            if (!_attached) {
                return;
            }
            if (_this.state === states.STALLED) {
                _this.setState(states.PLAYING);
            } else if (_this.state === states.PLAYING) {
                _playbackTimeout = setTimeout(_checkPlaybackStalled, STALL_DELAY);
            }
            // When video has not yet started playing for androidHLS, we cannot get the correct duration
            if (_isAndroidHLS && (_videotag.duration === Infinity) && (_videotag.currentTime === 0)) {
                return;
            }
            _updateDuration(_getDuration());
            _setPosition(_videotag.currentTime);
            // buffer ranges change during playback, not just on file progress
            _setBuffered(_getBuffer(), _position, _duration);

            // send time events when playing
            if (_this.state === states.PLAYING) {
                _this.trigger(events.JWPLAYER_MEDIA_TIME, {
                    position: _position,
                    duration: _duration
                });

                _checkVisualQuality();
            }
        }

        function _checkVisualQuality() {
            var level = _visualQuality.level;
            if (level.width !== _videotag.videoWidth ||
                level.height !== _videotag.videoHeight) {
                level.width = _videotag.videoWidth;
                level.height = _videotag.videoHeight;
                _setMediaType();
                if (!level.width || !level.height || _currentQuality === -1) {
                    return;
                }
                _visualQuality.reason = _visualQuality.reason || 'auto';
                _visualQuality.mode = _levels[_currentQuality].type === 'hls' ? 'auto' : 'manual';
                _visualQuality.bitrate = 0;
                level.index = _currentQuality;
                level.label = _levels[_currentQuality].label;
                _this.trigger('visualQuality', _visualQuality);
                _visualQuality.reason = '';
            }
        }

        function _setBuffered(buffered, currentTime, duration) {
            if (duration !== 0 && (buffered !== _buffered || duration !== _duration)) {
                _buffered = buffered;
                _this.trigger(events.JWPLAYER_MEDIA_BUFFER, {
                    bufferPercent: buffered * 100,
                    position: currentTime,
                    duration: duration
                });
            }
        }

        function _setPosition(currentTime) {
            if (_duration < 0) {
                currentTime = -(_getSeekableEnd() - currentTime);
            }
            _position = currentTime;
        }
        
        function _getDuration() {
            var duration = _videotag.duration;
            var end = _getSeekableEnd();
            if (duration === Infinity && end) {
                var seekableDuration = end - _getSeekableStart();
                if (seekableDuration !== Infinity && seekableDuration > MIN_DVR_DURATION) {
                    // Player interprets negative duration as DVR
                    duration = -seekableDuration;
                }
            }
            return duration;
        }
        
        function _updateDuration(duration) {
            _duration = duration;
            if (_delayedSeek && duration && duration !== Infinity) {
                _this.seek(_delayedSeek);
            }
        }

        function _sendMetaEvent() {
            var duration = _getDuration();
            if (_isAndroidHLS && duration === Infinity) {
                duration = 0;
            }
            _this.trigger(events.JWPLAYER_MEDIA_META, {
                duration: duration,
                height: _videotag.videoHeight,
                width: _videotag.videoWidth
            });
            _updateDuration(duration);
        }

        function _canPlayHandler() {
            if (!_attached) {
                return;
            }

            _canSeek = _canPlay = true;
            if (!_isAndroidHLS) {
                _setMediaType();
            }
            if (_isIE9) {
                // In IE9, set tracks here since they are not ready
                // on load
                _this.setTextTracks(_this._textTracks);
            }
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
            _setAttribute('jw-loaded', 'meta');
            _sendMetaEvent();
        }

        function _sendBufferFull() {
            // Wait until the canplay event on iOS to send the bufferFull event
            if (!_bufferFull && (!utils.isIOS() || _canPlay)) {
                _bufferFull = true;
                _canPlay = false;
                _this.trigger(events.JWPLAYER_MEDIA_BUFFER_FULL);
            }
        }

        function _playingHandler() {
            _this.setState(states.PLAYING);
            if(!_videotag.hasAttribute('jw-played')) {
                _setAttribute('jw-played','');
            }
            if (_videotag.hasAttribute('jw-gesture-required')) {
                _videotag.removeAttribute('jw-gesture-required');
            }
            _this.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME, {});
        }

        function _pauseHandler() {
            // Sometimes the browser will fire "complete" and then a "pause" event
            if (_this.state === states.COMPLETE) {
                return;
            }

            // If "pause" fires before "complete" or before we've started playback, we still don't want to propagate it
            if (!_videotag.hasAttribute('jw-played') || _videotag.currentTime === _videotag.duration) {
                return;
            }

            _this.setState(states.PAUSED);
        }

        function _stalledHandler() {
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
            _visualQuality.reason = 'initial choice';
            _visualQuality.level = {};
            return currentQuality;
        }

        function _play() {
            var promise = _videotag.play();
            if (promise && promise.catch) {
                promise.catch(function(err) {
                    console.warn(err);
                    // User gesture required to start playback
                    if (err.name === 'NotAllowedError' && _videotag.hasAttribute('jw-gesture-required')) {
                        _undoAutoplaySetup();
                    }
                });
            } else if (_videotag.hasAttribute('jw-gesture-required')) {
                // Autoplay isn't allowed in older versions of Safari (<10) and Chrome (<53)
                _undoAutoplaySetup();
            }
        }

        function _undoAutoplaySetup() {
            if (_this.video.autoplay) {
                _this.removeAutoplayAttribute();
                _this.trigger('autoplayFailed');
            }
        }

        function _completeLoad(startTime, duration) {

            _delayedSeek = 0;
            clearTimeout(_playbackTimeout);

            var sourceElement = document.createElement('source');
            sourceElement.src = _levels[_currentQuality].file;
            var sourceChanged = (_videotag.src !== sourceElement.src);

            var loadedSrc = _videotag.getAttribute('jw-loaded');

            var hasPlayed = _videotag.hasAttribute('jw-played');

            if (sourceChanged || loadedSrc === 'none' || loadedSrc === 'started') {
                _duration = duration;
                _setVideotagSource(_levels[_currentQuality]);
                _this.setupSideloadedTracks(_this._itemTracks);
                _videotag.load();
            } else {
                // Load event is from the same video as before
                if (startTime === 0 && _videotag.currentTime > 0) {
                    // restart video without dispatching seek event
                    _delayedSeek = -1;
                    _this.seek(startTime);
                }

                _play();
            }

            _position = _videotag.currentTime;

            if (_isMobile && !hasPlayed) {
                // results in html5.controller calling video.play()
                _sendBufferFull();
                // If we're still paused, then the tag isn't loading yet due to mobile interaction restrictions.
                if(!_videotag.paused && _this.state !== states.PLAYING){
                    _this.setState(states.LOADING);
                }
            }

            //in ios and fullscreen, set controls true, then when it goes to normal screen the controls don't show'
            if (utils.isIOS() && _this.getFullScreen()) {
                _videotag.controls = true;
            }

            if (startTime > 0) {
                _this.seek(startTime);
            }
        }

        function _setVideotagSource(source) {
            _audioTracks = null;
            _currentAudioTrackIndex = -1;
            _activeCuePosition = -1;
            if (!_visualQuality.reason) {
                _visualQuality.reason = 'initial choice';
                _visualQuality.level = {};
            }
            _canSeek = false;
            _bufferFull = false;
            _isAndroidHLS = _useAndroidHLS(source);
            if (source.preload && source.preload !== _videotag.getAttribute('preload')) {
                _setAttribute('preload', source.preload);
            }

            var sourceElement = document.createElement('source');
            sourceElement.src = source.file;
            var sourceChanged = (_videotag.src !== sourceElement.src);
            if (sourceChanged) {
                _setAttribute('jw-loaded', 'none');
                _videotag.src = source.file;
            }
        }

        function _clearVideotagSource() {
            if (_videotag) {
                _this.disableTextTrack();
                _videotag.removeAttribute('preload');
                _videotag.removeAttribute('src');
                _videotag.removeAttribute('jw-loaded');
                _videotag.removeAttribute('jw-played');

                dom.emptyElement(_videotag);
                _currentQuality = -1;
                // Don't call load in iE9/10 and check for load in PhantomJS
                if (!_isMSIE && 'load' in _videotag) {
                    _videotag.load();
                }
            }
        }

        function _getSeekableStart() {
            var index = _videotag.seekable ? _videotag.seekable.length : 0;
            var start = Infinity;

            while(index--) {
                start = Math.min(start, _videotag.seekable.start(index));
            }
            return start;
        }

        function _getSeekableEnd() {
            var index = _videotag.seekable ? _videotag.seekable.length : 0;
            var end = 0;

            while(index--) {
                end = Math.max(end, _videotag.seekable.end(index));
            }
            return end;
        }

        this.stop = function() {
            clearTimeout(_playbackTimeout);
            if (!_attached) {
                return;
            }
            _clearVideotagSource();
            this.clearTracks();
            // IE/Edge continue to play a video after changing video.src and calling video.load()
            // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/5383483/ (not fixed in Edge 14)
            if (utils.isIE()) {
                _videotag.pause();
            }
            this.setState(states.IDLE);
        };


        this.destroy = function() {
            _beforeResumeHandler = utils.noop;
             _removeListeners(_mediaEvents, _videotag);
            this.removeTracksListener(_videotag.audioTracks, 'change', _audioTrackChangeHandler);
            this.removeTracksListener(_videotag.textTracks, 'change', _this.textTrackChangeHandler);
            this.remove();
            this.off();
        };

        this.init = function(item) {
            if (!_attached) {
                return;
            }
            _levels = item.sources;
            _currentQuality = _pickInitialQuality(item.sources);
            // the loadeddata event determines the mediaType for HLS sources
            if(item.sources.length && item.sources[0].type !== 'hls') {
                this.sendMediaType(item.sources);
            }

            _position = item.starttime || 0;
            _duration = item.duration || 0;
            _visualQuality.reason = '';
            _setVideotagSource(_levels[_currentQuality]);
            this.setupSideloadedTracks(item.tracks);
        };

        this.load = function(item) {
            if (!_attached) {
                return;
            }

            _setLevels(item.sources);

            if(item.sources.length && item.sources[0].type !== 'hls') {
                this.sendMediaType(item.sources);
            }
            if (!_isMobile || _videotag.hasAttribute('jw-played')) {
                // don't change state on mobile before user initiates playback
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
            _beforeResumeHandler();
            _play();
        };

        this.pause = function() {
            clearTimeout(_playbackTimeout);
            _videotag.pause();
            _beforeResumeHandler = function() {
                var unpausing = _videotag.paused && _videotag.currentTime;
                if (unpausing && _videotag.duration === Infinity) {
                    var end = _getSeekableEnd();
                    var seekableDuration = end - _getSeekableStart();
                    var isLiveNotDvr = seekableDuration < MIN_DVR_DURATION;
                    var behindLiveEdge = end - _videotag.currentTime;
                    if (isLiveNotDvr && end && (behindLiveEdge > 15 || behindLiveEdge < 0)) {
                        // resume playback at edge of live stream
                        _videotag.currentTime = Math.max(end - 10, end - seekableDuration);
                    }

                }
            };
            this.setState(states.PAUSED);
        };

        this.seek = function(seekPos) {
            if (!_attached) {
                return;
            }

            if (seekPos < 0) {
                seekPos += _getSeekableStart() + _getSeekableEnd();
            }

            if (_delayedSeek === 0) {
                this.trigger(events.JWPLAYER_MEDIA_SEEK, {
                    position: _videotag.currentTime,
                    offset: seekPos
                });
            }
            if (!_canSeek) {
                _canSeek = !!_getSeekableEnd();
            }
            if (_canSeek) {
                _delayedSeek = 0;
                // setting currentTime can throw an invalid DOM state exception if the video is not ready
                try {
                    _this.seeking = true;
                    _videotag.currentTime = seekPos;
                } catch(e) {
                    _this.seeking = false;
                    _delayedSeek = seekPos;
                }
            } else {
                _delayedSeek = seekPos;
                // Firefox isn't firing canplay event when in a paused state
                // https://bugzilla.mozilla.org/show_bug.cgi?id=1194624
                if (_isFirefox && _videotag.paused) {
                    _play();
                }
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

        function _audioTrackChangeHandler() {
            var _selectedAudioTrackIndex = -1;
            for (var i = 0; i < _videotag.audioTracks.length; i++) {
                if (_videotag.audioTracks[i].enabled) {
                    _selectedAudioTrackIndex = i;
                    break;
                }
            }
            _setCurrentAudioTrack(_selectedAudioTrackIndex);
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
            // Stop listening to track changes so disabling the current track doesn't update the model
            this.removeTracksListener(_videotag.textTracks, 'change', this.textTrackChangeHandler);
            // Prevent tracks from showing during ad playback
            this.disableTextTrack();
            _attached = false;
            return _videotag;
        };

        /**
         * Begin listening to events again
         */
        this.attachMedia = function() {
            _attached = true;
            _canSeek = false;

            // If we were mid-seek when detached, we want to allow it to resume
            this.seeking = false;

            // In case the video tag was modified while we shared it
            _videotag.loop = false;

            // If there was a showing track, re-enable it
            this.enableTextTrack();
            this.addTracksListener(_videotag.textTracks, 'change', this.textTrackChangeHandler);

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
            _clearVideotagSource();
            clearTimeout(_playbackTimeout);

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
            if (!width || !height || !_videotag.videoWidth || !_videotag.videoHeight) {
                return false;
            }
            var style = {
                objectFit: '',
                width: '',
                height: ''
            };
            if (stretching === 'uniform') {
                // snap video to edges when the difference in aspect ratio is less than 9%
                var playerAspectRatio = width / height;
                var videoAspectRatio = _videotag.videoWidth / _videotag.videoHeight;
                if (Math.abs(playerAspectRatio - videoAspectRatio) < 0.09) {
                    style.objectFit = 'fill';
                    stretching = 'exactfit';
                }
            }
            // Prior to iOS 9, object-fit worked poorly
            // object-fit is not implemented in IE or Android Browser in 4.4 and lower
            // http://caniuse.com/#feat=object-fit
            // feature detection may work for IE but not for browsers where object-fit works for images only
            var fitVideoUsingTransforms = _isIE || _isAndroid || _isIOS7 || _isIOS8;
            if (fitVideoUsingTransforms) {
                // Use transforms to center and scale video in container
                var x = - Math.floor(_videotag.videoWidth  / 2 + 1);
                var y = - Math.floor(_videotag.videoHeight / 2 + 1);
                var scaleX = Math.ceil(width  * 100 / _videotag.videoWidth)  / 100;
                var scaleY = Math.ceil(height * 100 / _videotag.videoHeight) / 100;
                if (stretching === 'none') {
                    scaleX = scaleY = 1;
                } else if (stretching === 'fill') {
                    scaleX = scaleY = Math.max(scaleX, scaleY);
                } else if (stretching === 'uniform') {
                    scaleX = scaleY = Math.min(scaleX, scaleY);
                }
                style.width  = _videotag.videoWidth;
                style.height = _videotag.videoHeight;
                style.top = style.left = '50%';
                style.margin  = 0;
                cssUtils.transform(_videotag,
                    'translate(' + x + 'px, ' + y + 'px) scale(' + scaleX.toFixed(2) + ', ' + scaleY.toFixed(2) + ')');
            }
            cssUtils.style(_videotag, style);
            return false;
        };

        this.setFullscreen = function(state) {
            state = !!state;

            // This implementation is for iOS and Android WebKit only
            // This won't get called if the player container can go fullscreen
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
            if (quality >= 0) {
                if (_levels && _levels.length > quality) {
                    _currentQuality = quality;
                    _visualQuality.reason = 'api';
                    _visualQuality.level = {};
                    this.trigger(events.JWPLAYER_MEDIA_LEVEL_CHANGED, {
                        currentQuality: quality,
                        levels: _getPublicLevels(_levels)
                    });

                    // The playerConfig is not updated automatically, because it is a clone
                    // from when the provider was first initialized
                    _playerConfig.qualityLabel = _levels[quality].label;

                    var time = _videotag.currentTime || 0;
                    var duration = _videotag.duration || 0;
                    if (duration <= 0) {
                        duration = _duration;
                    }
                    _this.setState(states.LOADING);
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

        this.getName = function() {
            return { name : _name };
        };
        this.setCurrentAudioTrack = _setCurrentAudioTrack;

        this.getAudioTracks = _getAudioTracks;

        this.getCurrentAudioTrack = _getCurrentAudioTrack;

        this.setAutoplayAttribute = function() {
            _setAttribute('autoplay');
            _videotag.muted = true;
        };

        this.removeAutoplayAttribute = function() {
            _videotag.removeAttribute('autoplay');
        };

        function _setAudioTracks(tracks) {
            _audioTracks = null;
            if (!tracks) {
                return;
            }
            if (tracks.length) {
                for (var i = 0; i < tracks.length; i++) {
                    if (tracks[i].enabled) {
                        _currentAudioTrackIndex = i;
                        break;
                    }
                }
                if(_currentAudioTrackIndex === -1) {
                    _currentAudioTrackIndex = 0;
                    tracks[_currentAudioTrackIndex].enabled = true;
                }
                _audioTracks = _.map(tracks, function(track) {
                    var _track = {
                        name: track.label || track.language,
                        language: track.language
                    };
                    return _track;
                });
            }
            _this.addTracksListener(tracks, 'change', _audioTrackChangeHandler);
            if (_audioTracks) {
                _this.trigger('audioTracks', { currentTrack: _currentAudioTrackIndex, tracks: _audioTracks });
            }
        }

        function _setCurrentAudioTrack(index) {
            if (_videotag && _videotag.audioTracks && _audioTracks &&
                index > -1 && index < _videotag.audioTracks.length && index !== _currentAudioTrackIndex) {
                _videotag.audioTracks[_currentAudioTrackIndex].enabled = false;
                _currentAudioTrackIndex = index;
                _videotag.audioTracks[_currentAudioTrackIndex].enabled = true;
                _this.trigger('audioTrackChanged', { currentTrack: _currentAudioTrackIndex,
                    tracks: _audioTracks });
            }
        }

        function _getAudioTracks() {
            return _audioTracks || [];
        }

        function _getCurrentAudioTrack() {
            return _currentAudioTrackIndex;
        }

        function _setMediaType() {
            // Send mediaType when format is HLS. Other types are handled earlier by default.js.
            if(_levels[0].type === 'hls') {
                var mediaType = 'video';
                if (_videotag.videoHeight === 0) {
                    mediaType = 'audio';
                }
                _this.trigger('mediaType', {mediaType: mediaType});
            }
        }
    }

    // Register provider
    var F = function(){};
    F.prototype = DefaultProvider;
    VideoProvider.prototype = new F();

    VideoProvider.getName = function() {
        return { name : 'html5' };
    };

    return VideoProvider;
});
