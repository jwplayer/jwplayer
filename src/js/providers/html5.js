import { qualityLevel } from 'providers/data-normalizer';
import { Browser, OS } from 'environment/environment';
import { isAndroidHls } from 'providers/html5-android-hls';
import { STATE_IDLE, STATE_PLAYING, STATE_STALLED, MEDIA_META, MEDIA_ERROR, MEDIA_VISUAL_QUALITY, MEDIA_TYPE,
    MEDIA_LEVELS, MEDIA_LEVEL_CHANGED, MEDIA_SEEK, STATE_LOADING } from 'events/events';
import VideoEvents from 'providers/video-listener-mixin';
import VideoAction from 'providers/video-actions-mixin';
import VideoAttached from 'providers/video-attached-mixin';
import { isDvr } from 'providers/utils/stream-type';
import { style } from 'utils/css';
import { emptyElement } from 'utils/dom';
import DefaultProvider from 'providers/default';
import Events from 'utils/backbone.events';
import Tracks from 'providers/tracks-mixin';
import endOfRange from 'utils/time-ranges';
import createPlayPromise from 'providers/utils/play-promise';
import { map } from 'utils/underscore';
import { now } from 'utils/date';
import { PlayerError, MSG_LIVE_STREAM_DOWN, MSG_CANT_PLAY_VIDEO, MSG_TECHNICAL_ERROR, MSG_BAD_CONNECTION } from 'api/errors';

/** @module */

/**
 @enum {ErrorCode} - The HTML5 media element encountered an error.
 */
const HTML5_BASE_MEDIA_ERROR = 224000;
/**
 @enum {ErrorCode} - The HTML5 media element's src was emptied or set to the page's location.
 */
const HTML5_SRC_RESET = 224005;
/**
 @enum {ErrorCode} - The HTML5 media element encountered a network error.
 */
const HTML5_NETWORK_ERROR = 221000;

const clearTimeout = window.clearTimeout;
const _name = 'html5';
const noop = function () {};

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

    let minDvrWindow = _playerConfig.minDvrWindow;

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
                _this.stallTime = _this.video.currentTime;
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
        },

        error() {
            const { video } = _this;
            const error = video.error;
            const errorCode = (error && error.code) || -1;
            // Error code 2 from the video element is a network error
            let code = HTML5_BASE_MEDIA_ERROR;
            let key = MSG_CANT_PLAY_VIDEO;

            if (errorCode === 1) {
                code += errorCode;
            } else if (errorCode === 2) {
                key = MSG_BAD_CONNECTION;
                code = HTML5_NETWORK_ERROR;
            } else if (errorCode === 3 || errorCode === 4) {
                code += errorCode - 1;
                if (errorCode === 4 && video.src === location.href) {
                    code = HTML5_SRC_RESET;
                }
            } else {
                key = MSG_TECHNICAL_ERROR;
            }

            _clearVideotagSource();
            _this.trigger(
                MEDIA_ERROR,
                new PlayerError(key, code, error)
            );
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
    let _beforeResumeHandler = noop;
    let _audioTracks = null;
    let _currentAudioTrackIndex = -1;
    let _staleStreamTimeout = -1;
    let _stale = false;
    let _lastEndOfBuffer = null;
    let _androidHls = false;
    let dvrEnd = null;
    let dvrPosition = null;
    let dvrUpdatedTime = 0;

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
        const seekRange = _this.getSeekRange();
        if (_this.isLive() && isDvr(seekRange.end - seekRange.start, minDvrWindow)) {
            position -= seekRange.end;
            const rangeUpdated = Math.abs(dvrEnd - seekRange.end) > 1;
            if (!dvrPosition || rangeUpdated) {
                updateDvrPosition(seekRange);
            }
            return dvrPosition;
        }
        return position;
    }

    function updateDvrPosition(seekRange) {
        dvrEnd = seekRange.end;
        dvrPosition = _videotag.currentTime - dvrEnd;
        dvrUpdatedTime = now();
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
            if (isDvr(seekableDuration, minDvrWindow)) {
                // Player interprets negative duration as DVR
                duration = -seekableDuration;
            }
        }
        return duration;
    };

    _this.getSeekRange = function() {
        const seekRange = {
            start: 0,
            end: _videotag.duration
        };

        const seekable = _videotag.seekable;

        if (seekable.length) {
            seekRange.end = _getSeekableEnd();
            seekRange.start = _getSeekableStart();
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
        if (Array.isArray(levels) && levels.length > 0) {
            publicLevels = levels.map(function(level, i) {
                return {
                    label: level.label || i
                };
            });
        }
        return publicLevels;
    }

    function setPlaylistItem(item) {
        minDvrWindow = item.minDvrWindow;
        _levels = item.sources;
        _currentQuality = _pickInitialQuality(_levels);
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
        const resumingPlayback = _videotag.paused && _videotag.played && _videotag.played.length;
        if (resumingPlayback && _this.isLive() && !isDvr(_getSeekableEnd() - _getSeekableStart(), minDvrWindow)) {
            _this.clearTracks();
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
        let start = Infinity;
        ['buffered', 'seekable'].forEach(range => {
            const timeRange = _videotag[range];
            let index = timeRange ? timeRange.length : 0;

            while (index--) {
                start = Math.min(start, timeRange.start(index));
            }
        });
        return start;
    }

    function _getSeekableEnd() {
        let end = 0;
        ['buffered', 'seekable'].forEach(range => {
            const timeRange = _videotag[range];
            let index = timeRange ? timeRange.length : 0;

            while (index--) {
                end = Math.max(end, timeRange.end(index));
            }
        });
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
        _beforeResumeHandler = noop;
        _removeListeners(MediaEvents, _videotag);
        this.removeTracksListener(_videotag.audioTracks, 'change', _audioTrackChangeHandler);
        this.removeTracksListener(_videotag.textTracks, 'change', _this.textTrackChangeHandler);
        this.off();
    };

    this.init = function(item) {
        setPlaylistItem(item);
        const source = _levels[_currentQuality];
        _androidHls = isAndroidHls(source);
        if (_androidHls) {
            // Playback rate is broken on Android HLS
            _this.supportsPlaybackRate = false;
            // Android HLS doesnt update its times correctly so it always falls in here.  Do not allow it to stall.
            MediaEvents.waiting = noop;
        }
        _this.eventsOn_();
        // the loadeddata event determines the mediaType for HLS sources
        if (_levels.length && _levels[0].type !== 'hls') {
            this.sendMediaType(_levels);
        }
        visualQuality.reason = '';
    };

    this.preload = function(item) {
        setPlaylistItem(item);
        const source = _levels[_currentQuality];
        const preload = source.preload || 'metadata';
        if (preload !== 'none') {
            _videotag.setAttribute('preload', preload);
            _setVideotagSource(source);
        }
    };

    this.load = function(item) {
        setPlaylistItem(item);
        _completeLoad(item.starttime);
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
                const isLiveNotDvr = !isDvr(seekableDuration, minDvrWindow);
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
        const seekRange = _this.getSeekRange();
        if (seekPos < 0) {
            seekPos += seekRange.start + seekRange.end;
        }
        if (!_canSeek) {
            _canSeek = !!seekRange.end;
        }
        if (_canSeek) {
            _delayedSeek = 0;
            // setting currentTime can throw an invalid DOM state exception if the video is not ready
            try {
                _this.seeking = true;
                if (_this.isLive() && isDvr(seekRange.end - seekRange.start, minDvrWindow)) {
                    const timeSinceUpdate = Math.min(12, (now() - dvrUpdatedTime) / 1000);
                    dvrPosition = seekPos - dvrEnd;
                    _seekOffset += timeSinceUpdate;
                } else {
                    _seekOffset = seekPos;
                }
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
            try {
                const enterFullscreen =
                    _videotag.webkitEnterFullscreen ||
                    _videotag.webkitEnterFullScreen;
                if (enterFullscreen) {
                    enterFullscreen.apply(_videotag);
                }

            } catch (error) {
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

                _completeLoad(_videotag.currentTime || 0);
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
            _this.trigger(
                MEDIA_ERROR,
                new PlayerError(MSG_LIVE_STREAM_DOWN, HTML5_ERROR_LIVE_STREAM_DOWN_OR_ENDED)
            );
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

/**
 *
 @enum {ErrorCode} - The HTML5 live stream is down or has ended.
 */
const HTML5_ERROR_LIVE_STREAM_DOWN_OR_ENDED = 220001;

