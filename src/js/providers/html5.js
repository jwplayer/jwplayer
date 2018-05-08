import { qualityLevel } from 'providers/data-normalizer';
import { Browser, OS } from 'environment/environment';
import { isAndroidHls } from 'providers/html5-android-hls';
import { STATE_IDLE, STATE_PLAYING, STATE_STALLED, MEDIA_META, MEDIA_ERROR, MEDIA_VISUAL_QUALITY, MEDIA_TYPE,
    MEDIA_LEVELS, MEDIA_LEVEL_CHANGED, MEDIA_SEEK, STATE_LOADING } from 'events/events';
import VideoEvents from 'providers/video-listener-mixin';
import VideoAction from 'providers/video-actions-mixin';
import VideoAttached from 'providers/video-attached-mixin';
import { style } from 'utils/css';
import utils from 'utils/helpers';
import { emptyElement } from 'utils/dom';
import DefaultProvider from 'providers/default';
import Events from 'utils/backbone.events';
import Tracks from 'providers/tracks-mixin';
import endOfRange from 'utils/time-ranges';
import createPlayPromise from 'providers/utils/play-promise';
import { map } from 'utils/underscore';

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
            const metadata = {
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
            checkVisualQuality();
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
            _this.trigger(MEDIA_SEEK, {
                position,
                offset
            });
        },

        seeked() {
            VideoEvents.seeked.call(_this);
        },

        waiting() {
            if (_this.seeking) {
                _this.setState(STATE_LOADING);
            } else if (_this.state === STATE_PLAYING) {
                if (_this.atEdgeOfLiveStream()) {
                    _this.setPlaybackRate(1);
                }
                _this.stallTime = _this.getCurrentTime();
                _this.setState(STATE_STALLED);
            }
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
        isLive() {
            return _videotag.duration === Infinity;
        }
    });

    const _videotag = mediaElement;
    const visualQuality = { level: {} };
    // Prefer the config timeout, which is allowed to be 0 and null by default
    const _staleStreamDuration =
        _playerConfig.liveTimeout !== null
            ? _playerConfig.liveTimeout
            : 3 * 10 * 1000;

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

    this.isSDK = !!_playerConfig.sdkplatform;
    this.video = _videotag;
    this.supportsPlaybackRate = true;

    function checkVisualQuality() {
        const level = visualQuality.level;
        if (level.width !== _videotag.videoWidth || level.height !== _videotag.videoHeight) {
            // Exit if we're not certain that the stream is audio or the level is unknown
            if ((!_videotag.videoWidth && !isAudioStream()) || _currentQuality === -1) {
                return;
            }
            level.width = _videotag.videoWidth;
            level.height = _videotag.videoHeight;
            _setMediaType();
            visualQuality.reason = visualQuality.reason || 'auto';
            visualQuality.mode = _levels[_currentQuality].type === 'hls' ? 'auto' : 'manual';
            visualQuality.bitrate = 0;
            level.index = _currentQuality;
            level.label = _levels[_currentQuality].label;
            _this.trigger(MEDIA_VISUAL_QUALITY, visualQuality);
            visualQuality.reason = '';
        }
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
        let duration = _videotag.duration;
        // Don't sent time event on Android before real duration is known
        if (_androidHls && (duration === Infinity && _videotag.currentTime === 0) || isNaN(duration)) {
            return 0;
        }
        const end = _getSeekableEnd();
        if (_this.isLive() && end) {
            const seekableDuration = end - _getSeekableStart();
            if (seekableDuration !== Infinity && seekableDuration > MIN_DVR_DURATION) {
                // Player interprets negative duration as DVR
                duration = -seekableDuration;
            }
        }
        return duration;
    };

    _this.getSeekRange = function() {
        const seekRange = {
            start: 0,
            end: _this.getDuration()
        };

        const seekable = this.video.seekable;

        if (seekable.length) {
            seekRange.end = Math.max(seekable.end(0), seekable.end(seekable.length - 1));
            seekRange.start = Math.min(seekable.start(0), seekable.start(seekable.length - 1));
        }

        return seekRange;
    };

    function _checkDelayedSeek(duration) {
        // Don't seek when _delayedSeek is set to -1 in _completeLoad
        if (_delayedSeek && _delayedSeek !== -1 && duration && duration !== Infinity) {
            _this.seek(_delayedSeek);
        }
    }

    function _getPublicLevels(levels) {
        let publicLevels;
        if (utils.typeOf(levels) === 'array' && levels.length > 0) {
            publicLevels = levels.map(function(level, i) {
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
    }

    function _pickInitialQuality(levels) {
        let currentQuality = Math.max(0, _currentQuality);
        const label = _playerConfig.qualityLabel;
        if (levels) {
            for (let i = 0; i < levels.length; i++) {
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

    function _play() {
        const resumeLive = _videotag.duration === Infinity && _videotag.paused && _videotag.played && _videotag.played.length;
        if (resumeLive) {
            _videotag.load();
        }
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

        // Check if we have already seeked the mediaElement before _completeLoad has been called
        if (startTime > 0 && _videotag.currentTime !== startTime) {
            _this.seek(startTime);
        }

        const publicLevels = _getPublicLevels(_levels);
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

        const sourceElement = document.createElement('source');
        sourceElement.src = source.file;
        const sourceChanged = (_videotag.src !== sourceElement.src);
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
            // Don't call load in iE9/10
            if (!Browser.msie && 'load' in _videotag) {
                _videotag.load();
            }
        }
    }

    function _getSeekableStart() {
        let index = _videotag.seekable ? _videotag.seekable.length : 0;
        let start = Infinity;

        while (index--) {
            start = Math.min(start, _videotag.seekable.start(index));
        }
        return start;
    }

    function _getSeekableEnd() {
        let index = _videotag.seekable ? _videotag.seekable.length : 0;
        let end = 0;

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
            // Android HLS doesnt update its times correctly so it always falls in here.  Do not allow it to stall.
            MediaEvents.waiting = utils.noop;
        }
        _this.eventsOn_();
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
            _videotag.setAttribute('preload', preload);
            _setVideotagSource(source);
        }
    };

    this.load = function(item) {
        _setLevels(item.sources);
        _completeLoad(item.starttime, item.duration || 0);
        this.setupSideloadedTracks(item.tracks);
    };

    this.play = function() {
        _beforeResumeHandler();
        return _play();
    };

    this.pause = function() {
        clearTimeouts();
        _beforeResumeHandler = function() {
            const unpausing = _videotag.paused && _videotag.currentTime;
            if (unpausing && _this.isLive()) {
                const end = _getSeekableEnd();
                const seekableDuration = end - _getSeekableStart();
                const isLiveNotDvr = seekableDuration < MIN_DVR_DURATION;
                const behindLiveEdge = end - _videotag.currentTime;
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
        let _selectedAudioTrackIndex = -1;
        for (let i = 0; i < _videotag.audioTracks.length; i++) {
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

    this.setFullscreen = function(state) {
        state = !!state;

        // This implementation is for iOS and Android WebKit only
        // This won't get called if the player container can go fullscreen
        if (state) {
            const status = utils.tryCatch(function() {
                const enterFullscreen =
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

        const exitFullscreen =
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
        if (Array.isArray(_levels)) {
            return _levels.map(level => qualityLevel(level));
        }
        return [];
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
            for (let i = 0; i < tracks.length; i++) {
                if (tracks[i].enabled) {
                    _currentAudioTrackIndex = i;
                    break;
                }
            }
            if (_currentAudioTrackIndex === -1) {
                _currentAudioTrackIndex = 0;
                tracks[_currentAudioTrackIndex].enabled = true;
            }
            _audioTracks = map(tracks, function(track) {
                const _track = {
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

    function isAudioStream() {
        // Safari will report videoHeight as 0 for HLS streams until readyState indicates that the browser has data
        return _videotag.videoHeight === 0 && !((OS.iOS || Browser.safari) && _videotag.readyState < 2);
    }

    function _setMediaType() {
        // Send mediaType when format is HLS. Other types are handled earlier by default.js.
        if (_levels[0].type === 'hls') {
            const mediaType = isAudioStream() ? 'audio' : 'video';
            _this.trigger(MEDIA_TYPE, { mediaType });
        }
    }

    // If we're live and the buffer end has remained the same for some time, mark the stream as stale and check if the stream is over
    function checkStaleStream() {
        // Never kill a stale live stream if the timeout was configured to 0
        if (_staleStreamDuration === 0) {
            return;
        }
        const endOfBuffer = endOfRange(_videotag.buffered);
        const live = _this.isLive();

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
