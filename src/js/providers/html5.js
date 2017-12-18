import { qualityLevel } from 'providers/data-normalizer';
import { Browser, OS } from 'environment/environment';
import { isAndroidHls } from 'providers/html5-android-hls';
import { STATE_IDLE, MEDIA_META, MEDIA_ERROR, MEDIA_VISUAL_QUALITY, MEDIA_TYPE,
    MEDIA_LEVELS, MEDIA_LEVEL_CHANGED, MEDIA_SEEK, STATE_LOADING } from 'events/events';
import VideoEvents from 'providers/video-listener-mixin';
import VideoAction from 'providers/video-actions-mixin';
import VideoAttached from 'providers/video-attached-mixin';
import { style, transform } from 'utils/css';
import utils from 'utils/helpers';
import { emptyElement } from 'utils/dom';
import _ from 'utils/underscore';
import DefaultProvider from 'providers/default';
import Events from 'utils/backbone.events';
import Tracks from 'providers/tracks-mixin';
import endOfRange from 'utils/time-ranges';
import createPlayPromise from 'providers/utils/play-promise';

const clearTimeout = window.clearTimeout;
const MIN_DVR_DURATION = 120;
const _name = 'html5';

function _setupListeners(eventsHash, videoTag) {
    Object.keys(eventsHash).forEach(eventName => {
        videoTag.removeEventListener(eventName, eventsHash[eventName]);
        videoTag.addEventListener(eventName, eventsHash[eventName]);
    });
}

function _removeListeners(eventsHash, videoTag) {
    Object.keys(eventsHash).forEach(eventName => {
        videoTag.removeEventListener(eventName, eventsHash[eventName]);
    });
}

function VideoProvider(_playerId, _playerConfig, mediaElement) {
    // Current media state
    this.state = STATE_IDLE;

    // Are we buffering due to seek, or due to playback?
    this.seeking = false;

    // Always render natively in iOS and Safari, where HLS is supported.
    // Otherwise, use native rendering when set in the config for browsers that have adequate support.
    // FF, IE & Edge are excluded due to styling/positioning drawbacks.
    // The following issues need to be addressed before we enable native rendering in Edge:
    // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8120475/
    // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12079271/
    function renderNatively (configRenderNatively) {
        if (OS.iOS || Browser.safari) {
            return true;
        }
        return configRenderNatively && Browser.chrome;
    }

    const _this = this;

    const MediaEvents = {
        progress() {
            VideoEvents.progress.call(_this);
            checkStaleStream();
        },
        
        timeupdate() {
            if (_positionBeforeSeek !== _videotag.currentTime) {
                _setPositionBeforeSeek(_videotag.currentTime);
                VideoEvents.timeupdate.call(_this);
            }
            checkStaleStream();
            if (Browser.ie) {
                checkVisualQuality();
            }
        },

        resize: checkVisualQuality,

        ended() {
            _currentQuality = -1;
            clearTimeouts();
            VideoEvents.ended.call(_this);
        },

        loadedmetadata() {
            let duration = _this.getDuration();
            if (_androidHls && duration === Infinity) {
                duration = 0;
            }
            var metadata = {
                duration: duration,
                height: _videotag.videoHeight,
                width: _videotag.videoWidth
            };
            _this.trigger(MEDIA_META, metadata);
            checkVisualQuality();
        },

        durationchange() {
            if (_androidHls) {
                return;
            }
            VideoEvents.progress.call(_this);
        },

        loadeddata() {
            VideoEvents.loadeddata.call(_this);
            _setAudioTracks(_videotag.audioTracks);
            _checkDelayedSeek(_this.getDuration());
        },

        canplay() {
            _canSeek = true;
            if (!_androidHls) {
                _setMediaType();
            }
            if (Browser.ie && Browser.version.major === 9) {
                // In IE9, set tracks here since they are not ready
                // on load
                _this.setTextTracks(_this._textTracks);
            }
            VideoEvents.canplay.call(_this);
        },

        seeking() {
            const offset = _seekOffset !== null ? _seekOffset : _this.getCurrentTime();
            const position = _positionBeforeSeek;
            _setPositionBeforeSeek(offset);
            _seekOffset = null;
            _delayedSeek = 0;
            _this.seeking = true;
            _videotag.removeEventListener('waiting', setLoadingState);
            _videotag.addEventListener('waiting', setLoadingState);
            _this.trigger(MEDIA_SEEK, {
                position,
                offset
            });
        },

        seeked() {
            _videotag.removeEventListener('waiting', setLoadingState);
            VideoEvents.seeked.call(_this);
        },

        webkitbeginfullscreen(e) {
            _fullscreenState = true;
            _sendFullscreen(e);
        },

        webkitendfullscreen(e) {
            _fullscreenState = false;
            _sendFullscreen(e);
        }
    };
    Object.keys(VideoEvents).forEach(eventName => {
        if (!MediaEvents[eventName]) {
            const mixinEventHandler = VideoEvents[eventName];
            MediaEvents[eventName] = (e) => {
                mixinEventHandler.call(_this, e);
            };
        }
    });

    Object.assign(this, Events, VideoAction, VideoAttached, Tracks, {
        renderNatively: renderNatively(_playerConfig.renderCaptionsNatively),
        eventsOn_() {
            _setupListeners(MediaEvents, _videotag);
        },
        eventsOff_() {
            _removeListeners(MediaEvents, _videotag);
        },
        detachMedia() {
            VideoAttached.detachMedia.call(_this);
            clearTimeouts();
            // Stop listening to track changes so disabling the current track doesn't update the model
            this.removeTracksListener(_videotag.textTracks, 'change', this.textTrackChangeHandler);
            // Prevent tracks from showing during ad playback
            this.disableTextTrack();
            return _videotag;
        },
        attachMedia() {
            VideoAttached.attachMedia.call(_this);
            _canSeek = false;
            // If we were mid-seek when detached, we want to allow it to resume
            this.seeking = false;
            // In case the video tag was modified while we shared it
            _videotag.loop = false;
            // If there was a showing track, re-enable it
            this.enableTextTrack();
            if (this.renderNatively) {
                this.setTextTracks(this.video.textTracks);
            }
            this.addTracksListener(_videotag.textTracks, 'change', this.textTrackChangeHandler);
        },
        stalledHandler(checkStartTime) {
            // Android HLS doesnt update its times correctly so it always falls in here.  Do not allow it to stall.
            if (_androidHls) {
                return;
            }
            VideoAttached.stalledHandler.call(_this, checkStartTime);
        },
        isLive() {
            return _videotag.duration === Infinity;
        }
    });

    const _videotag = _this.video = mediaElement;
    const visualQuality = { level: {} };
    const _staleStreamDuration = 3 * 10 * 1000;

    let _canSeek = false; // true on valid time event
    let _delayedSeek = 0;
    let _seekOffset = null;
    let _positionBeforeSeek = null;
    let _levels;
    let _currentQuality = -1;
    let _fullscreenState = false;
    let _beforeResumeHandler = utils.noop;
    let _audioTracks = null;
    let _currentAudioTrackIndex = -1;
    let _staleStreamTimeout = -1;
    let _stale = false;
    let _lastEndOfBuffer = null;
    let _androidHls = false;

    function _setAttribute(name, value) {
        _videotag.setAttribute(name, value || '');
    }

    _videotag.className = 'jw-video jw-reset';

    this.isSDK = !!_playerConfig.sdkplatform;
    this.video = _videotag;
    this.supportsPlaybackRate = true;

    _setupListeners(MediaEvents, _videotag);

    _setAttribute('disableRemotePlayback', '');
    _setAttribute('webkit-playsinline');
    _setAttribute('playsinline');

    function checkVisualQuality() {
        const level = visualQuality.level;
        if (level.width !== _videotag.videoWidth || level.height !== _videotag.videoHeight) {
            level.width = _videotag.videoWidth;
            level.height = _videotag.videoHeight;
            _setMediaType();
            if (!level.width || !level.height || _currentQuality === -1) {
                // Audio only or default bitrate estimate
                _this.trigger('bandwidthEstimate', {
                    bandwidthEstimate: 120000
                });
                return;
            }
            visualQuality.reason = visualQuality.reason || 'auto';
            visualQuality.mode = _levels[_currentQuality].type === 'hls' ? 'auto' : 'manual';
            visualQuality.bitrate = 0;
            _this.trigger('bandwidthEstimate', {
                // An extremely crude estimate of bandwidth based on video pixels displayed
                // Not even close to platform served manifest bitrate values
                /**
                 width	height	bitrate	pixels	bit/pixel
                 320	180	    350000	57600	6.076388889
                 480	270	    520000	129600	4.012345679
                 720	406	    640000	292320	2.1893815
                 1280	720	    1420000	921600	1.540798611
                 1920	1080	2750000	2073600	1.326195988
                 */
                bandwidthEstimate: level.width * level.height * 1.5
            });
            level.index = _currentQuality;
            level.label = _levels[_currentQuality].label;
            _this.trigger(MEDIA_VISUAL_QUALITY, visualQuality);
            visualQuality.reason = '';
        }
    }

    function setLoadingState() {
        _this.setState(STATE_LOADING);
    }

    function _setPositionBeforeSeek(position) {
        _positionBeforeSeek = _convertTime(position);
    }

    _this.getCurrentTime = function() {
        return _convertTime(_videotag.currentTime);
    };

    function _convertTime(position) {
        if (_this.getDuration() < 0) {
            position -= _getSeekableEnd();
        }
        return position;
    }

    _this.getDuration = function() {
        var duration = _videotag.duration;
        // Don't sent time event on Android before real duration is known
        if (_androidHls && (duration === Infinity && _videotag.currentTime === 0) || isNaN(duration)) {
            return 0;
        }
        var end = _getSeekableEnd();
        if (_this.isLive() && end) {
            var seekableDuration = end - _getSeekableStart();
            if (seekableDuration !== Infinity && seekableDuration > MIN_DVR_DURATION) {
                // Player interprets negative duration as DVR
                duration = -seekableDuration;
            }
        }
        return duration;
    };

    function _checkDelayedSeek(duration) {
        // Don't seek when _delayedSeek is set to -1 in _completeLoad
        if (_delayedSeek && _delayedSeek !== -1 && duration && duration !== Infinity) {
            _this.seek(_delayedSeek);
        }
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
        _currentQuality = _pickOptimalQuality(levels);
    }

    function _pickInitialQuality(levels) {
        var currentQuality = Math.max(0, _currentQuality);
        var label = _playerConfig.qualityLabel;
        if (levels) {
            for (var i = 0; i < levels.length; i++) {
                if (levels[i].default) {
                    currentQuality = i;
                }
                if (label && levels[i].label === label) {
                    return i;
                }
            }
        }
        visualQuality.reason = 'initial choice';

        if (!visualQuality.level.width || !visualQuality.level.height) {
            visualQuality.level = {};
        }
        return currentQuality;
    }

    function _pickOptimalQuality(levels) {
        const Mbps = _playerConfig.bandwidthEstimate / Math.pow(1024, 2);
        const { maxWidth, maxHeight } = resolutionRangeFromMbps(Mbps);
        const levelsInRange = levels.filter(level => level.height <= maxHeight && level.width <= maxWidth);
        if (!levelsInRange || levelsInRange.length === 0) {
            return _pickInitialQuality(levels);
        }
        levelsInRange.sort((a, b) => b.height - a.height);
        return levels.indexOf(levelsInRange[0]);
    }

    function resolutionRangeFromMbps(Mbps) {
        let maxWidth = 640;
        let maxHeight = 360;

        if (Mbps > 0.5 && Mbps < 0.7) {
            maxHeight = 480;
        } else if (Mbps >= 0.7 && Mbps < 1) {
            maxWidth = 800;
            maxHeight = 480;
        } else if (Mbps >= 1 && Mbps < 1.3) {
            maxWidth = 800;
            maxHeight = 600;
        } else if (Mbps >= 1.3 && Mbps < 2) {
            maxWidth = 1024;
            maxHeight = 768;
        } else if (Mbps >= 2 && Mbps < 2.3) {
            maxWidth = 1280;
            maxHeight = 720;
        } else if (Mbps >= 2.3 && Mbps < 4) {
            maxWidth = 2048;
            maxHeight = 1024;
        } else if (Mbps >= 4) {
            maxWidth = 2048;
            maxHeight = 1152;
        }
        return { maxWidth: maxWidth, maxHeight: maxHeight };
    }

    function _play() {
        return _videotag.play() || createPlayPromise(_videotag);
    }

    function _completeLoad(startTime) {
        _delayedSeek = 0;
        clearTimeouts();

        const previousSource = _videotag.src;
        const sourceElement = document.createElement('source');
        sourceElement.src = _levels[_currentQuality].file;
        const sourceChanged = (sourceElement.src !== previousSource);

        if (sourceChanged) {
            _setVideotagSource(_levels[_currentQuality]);
            // Do not call load if src was not set. load() will cancel any active play promise.
            if (previousSource) {
                _videotag.load();
            }

        } else if (startTime === 0 && _videotag.currentTime > 0) {
            // Load event is from the same video as before
            // restart video without dispatching seek event
            _delayedSeek = -1;
            _this.seek(startTime);
        }

        if (startTime > 0) {
            _this.seek(startTime);
        }

        var publicLevels = _getPublicLevels(_levels);
        if (publicLevels) {
            _this.trigger(MEDIA_LEVELS, {
                levels: publicLevels,
                currentQuality: _currentQuality
            });
        }
        if (_levels.length && _levels[0].type !== 'hls') {
            _this.sendMediaType(_levels);
        }
    }

    function _setVideotagSource(source) {
        _audioTracks = null;
        _currentAudioTrackIndex = -1;
        if (!visualQuality.reason) {
            visualQuality.reason = 'initial choice';
            visualQuality.level = {};
        }
        _canSeek = false;

        var sourceElement = document.createElement('source');
        sourceElement.src = source.file;
        var sourceChanged = (_videotag.src !== sourceElement.src);
        if (sourceChanged) {
            _videotag.src = source.file;
        }
    }

    function _clearVideotagSource() {
        if (_videotag) {
            _this.disableTextTrack();
            _videotag.removeAttribute('preload');
            _videotag.removeAttribute('src');
            emptyElement(_videotag);
            style(_videotag, {
                objectFit: ''
            });
            _currentQuality = -1;
            // Don't call load in iE9/10 and check for load in PhantomJS
            if (!Browser.msie && 'load' in _videotag) {
                _videotag.load();
            }
        }
    }

    function _getSeekableStart() {
        var index = _videotag.seekable ? _videotag.seekable.length : 0;
        var start = Infinity;

        while (index--) {
            start = Math.min(start, _videotag.seekable.start(index));
        }
        return start;
    }

    function _getSeekableEnd() {
        var index = _videotag.seekable ? _videotag.seekable.length : 0;
        var end = 0;

        while (index--) {
            end = Math.max(end, _videotag.seekable.end(index));
        }
        return end;
    }

    this.stop = function() {
        clearTimeouts();
        _clearVideotagSource();
        this.clearTracks();
        // IE/Edge continue to play a video after changing video.src and calling video.load()
        // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/5383483/ (not fixed in Edge 14)
        if (Browser.ie) {
            _videotag.pause();
        }
        this.setState(STATE_IDLE);
    };

    this.destroy = function() {
        _beforeResumeHandler = utils.noop;
        _removeListeners(MediaEvents, _videotag);
        this.removeTracksListener(_videotag.audioTracks, 'change', _audioTrackChangeHandler);
        this.removeTracksListener(_videotag.textTracks, 'change', _this.textTrackChangeHandler);
        this.off();
    };

    this.init = function(item) {
        _setLevels(item.sources);
        const source = _levels[_currentQuality];
        _androidHls = isAndroidHls(source);        
        if (_androidHls) {
            // Playback rate is broken on Android HLS
            _this.supportsPlaybackRate = false;
        }
        // the loadeddata event determines the mediaType for HLS sources
        if (_levels.length && _levels[0].type !== 'hls') {
            this.sendMediaType(_levels);
        }
        visualQuality.reason = '';
    };

    this.preload = function(item) {
        _setLevels(item.sources);
        const source = _levels[_currentQuality];
        const preload = source.preload || 'metadata';
        if (preload !== 'none') {
            _setAttribute('preload', preload);
            _setVideotagSource(source);
        }
    };

    this.load = function(item) {
        _setLevels(item.sources);
        _completeLoad(item.starttime || 0, item.duration || 0);
        this.setupSideloadedTracks(item.tracks);        
    };

    this.play = function() {
        _beforeResumeHandler();
        return _play();
    };

    this.pause = function() {
        clearTimeouts();
        _beforeResumeHandler = function() {
            var unpausing = _videotag.paused && _videotag.currentTime;
            if (unpausing && _this.isLive()) {
                var end = _getSeekableEnd();
                var seekableDuration = end - _getSeekableStart();
                var isLiveNotDvr = seekableDuration < MIN_DVR_DURATION;
                var behindLiveEdge = end - _videotag.currentTime;
                if (isLiveNotDvr && end && (behindLiveEdge > 15 || behindLiveEdge < 0)) {
                    // resume playback at edge of live stream
                    _seekOffset = Math.max(end - 10, end - seekableDuration);
                    _setPositionBeforeSeek(_videotag.currentTime);
                    _videotag.currentTime = _seekOffset;
                }

            }
        };
        _videotag.pause();
    };

    this.seek = function(seekPos) {
        if (seekPos < 0) {
            seekPos += _getSeekableStart() + _getSeekableEnd();
        }
        if (!_canSeek) {
            _canSeek = !!_getSeekableEnd();
        }
        if (_canSeek) {
            _delayedSeek = 0;
            // setting currentTime can throw an invalid DOM state exception if the video is not ready
            try {
                _this.seeking = true;
                _seekOffset = seekPos;
                _setPositionBeforeSeek(_videotag.currentTime);
                _videotag.currentTime = seekPos;
            } catch (e) {
                _this.seeking = false;
                _delayedSeek = seekPos;
            }
        } else {
            _delayedSeek = seekPos;
            // Firefox isn't firing canplay event when in a paused state
            // https://bugzilla.mozilla.org/show_bug.cgi?id=1194624
            if (Browser.firefox && _videotag.paused) {
                _play();
            }
        }
    };

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

    function _sendFullscreen(e) {
        _this.trigger('fullscreenchange', {
            target: e.target,
            jwstate: _fullscreenState
        });
    }

    this.setVisibility = function(state) {
        state = !!state;
        if (state || OS.android) {
            // Changing visibility to hidden on Android < 4.2 causes
            // the pause event to be fired. This causes audio files to
            // become unplayable. Hence the video tag is always kept
            // visible on Android devices.
            style(_this.container, {
                visibility: 'visible',
                opacity: 1
            });
        } else {
            style(_this.container, {
                visibility: '',
                opacity: 0
            });
        }
    };

    this.resize = function(width, height, stretching) {
        if (!width || !height || !_videotag.videoWidth || !_videotag.videoHeight) {
            return;
        }
        const styles = {
            objectFit: '',
            width: '',
            height: ''
        };
        if (stretching === 'uniform') {
            // snap video to edges when the difference in aspect ratio is less than 9%
            const playerAspectRatio = width / height;
            const videoAspectRatio = _videotag.videoWidth / _videotag.videoHeight;
            if (Math.abs(playerAspectRatio - videoAspectRatio) < 0.09) {
                styles.objectFit = 'fill';
                stretching = 'exactfit';
            }
        }
        // Prior to iOS 9, object-fit worked poorly
        // object-fit is not implemented in IE or Android Browser in 4.4 and lower
        // http://caniuse.com/#feat=object-fit
        // feature detection may work for IE but not for browsers where object-fit works for images only
        const fitVideoUsingTransforms = Browser.ie || (OS.iOS && OS.version.major < 9) || Browser.androidNative;
        if (fitVideoUsingTransforms) {
            // Use transforms to center and scale video in container
            const x = -Math.floor(_videotag.videoWidth / 2 + 1);
            const y = -Math.floor(_videotag.videoHeight / 2 + 1);
            let scaleX = Math.ceil(width * 100 / _videotag.videoWidth) / 100;
            let scaleY = Math.ceil(height * 100 / _videotag.videoHeight) / 100;
            if (stretching === 'none') {
                scaleX = scaleY = 1;
            } else if (stretching === 'fill') {
                scaleX = scaleY = Math.max(scaleX, scaleY);
            } else if (stretching === 'uniform') {
                scaleX = scaleY = Math.min(scaleX, scaleY);
            }
            styles.width = _videotag.videoWidth;
            styles.height = _videotag.videoHeight;
            styles.top = styles.left = '50%';
            styles.margin = 0;
            transform(_videotag,
                'translate(' + x + 'px, ' + y + 'px) scale(' + scaleX.toFixed(2) + ', ' + scaleY.toFixed(2) + ')');
        }
        style(_videotag, styles);
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
                // object can't go fullscreen
                return false;
            }
            return _this.getFullScreen();
        }

        var exitFullscreen =
            _videotag.webkitExitFullscreen ||
            _videotag.webkitExitFullScreen;
        if (exitFullscreen) {
            exitFullscreen.apply(_videotag);
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
                visualQuality.reason = 'api';
                visualQuality.level = {};
                this.trigger(MEDIA_LEVEL_CHANGED, {
                    currentQuality: quality,
                    levels: _getPublicLevels(_levels)
                });

                // The playerConfig is not updated automatically, because it is a clone
                // from when the provider was first initialized
                _playerConfig.qualityLabel = _levels[quality].label;

                const time = _videotag.currentTime || 0;
                const duration = _this.getDuration();
                _completeLoad(time, duration);
                _play();
            }
        }
    };

    this.setPlaybackRate = function(playbackRate) {
        // Set defaultPlaybackRate so that we do not send ratechange events when setting src
        _videotag.playbackRate = _videotag.defaultPlaybackRate = playbackRate;
    };

    this.getPlaybackRate = function() {
        return _videotag.playbackRate;
    };

    this.getCurrentQuality = function() {
        return _currentQuality;
    };

    this.getQualityLevels = function() {
        return _.map(_levels, level => qualityLevel(level));
    };

    this.getName = function() {
        return { name: _name };
    };
    this.setCurrentAudioTrack = _setCurrentAudioTrack;

    this.getAudioTracks = _getAudioTracks;

    this.getCurrentAudioTrack = _getCurrentAudioTrack;

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
            if (_currentAudioTrackIndex === -1) {
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
        if (_levels[0].type === 'hls') {
            var mediaType = 'video';
            if (_videotag.videoHeight === 0) {
                mediaType = 'audio';
            }
            _this.trigger(MEDIA_TYPE, { mediaType: mediaType });
        }
    }

    // If we're live and the buffer end has remained the same for some time, mark the stream as stale and check if the stream is over
    function checkStaleStream() {
        var endOfBuffer = endOfRange(_videotag.buffered);
        var live = _this.isLive();

        // Don't end if we have noting buffered yet, or cannot get any information about the buffer
        if (live && endOfBuffer && _lastEndOfBuffer === endOfBuffer) {
            if (_staleStreamTimeout === -1) {
                _staleStreamTimeout = setTimeout(function () {
                    _stale = true;
                    checkStreamEnded();
                }, _staleStreamDuration);
            }
        } else {
            clearTimeouts();
            _stale = false;
        }

        _lastEndOfBuffer = endOfBuffer;
    }

    function checkStreamEnded() {
        if (_stale && _this.atEdgeOfLiveStream()) {
            _this.trigger(MEDIA_ERROR, {
                message: 'The live stream is either down or has ended'
            });
            return true;
        }

        return false;
    }

    function clearTimeouts() {
        clearTimeout(_staleStreamTimeout);
        _staleStreamTimeout = -1;
    }
}

Object.assign(VideoProvider.prototype, DefaultProvider);

VideoProvider.getName = function() {
    return { name: 'html5' };
};

export default VideoProvider;
