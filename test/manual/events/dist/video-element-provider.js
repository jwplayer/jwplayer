/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/providers/video-element-provider.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/providers/video-element-provider.ts":
/*!*************************************************!*\
  !*** ./src/providers/video-element-provider.ts ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var jwplayer = window.jwplayer;
var PROVIDER_NAME = 'headless-video-element'; // Provider events not implemented in the example:
// "bandwidthEstimate" (We're letting the browser handle network activity here)
// "levelsChanged" (also "levels" is just stubbed)
// "metadataCueParsed" and "meta" events (emsg, id3, program-date-time...) (See html5.ts)
// "subtitlesTracks" and "subtitlesTrackChanged" (See html5.ts and tracks-mixin)
// "audioTracks" and "audioTrackChanged" (See html5.ts)
// The ImplementedProvider interface matches internal providers
// These changes reflect the interface required for any provider registered with jwplayer

var VideoElementProvider = /*#__PURE__*/function () {
  VideoElementProvider.supports = function supports(source) {
    if (source.type === 'custom-type') {
      return true;
    }

    var video = VideoElementProvider.video = VideoElementProvider.video || document.createElement('video');
    var mimeType = source.mimeType || {
      aac: 'audio/mp4',
      mp4: 'video/mp4',
      f4v: 'video/mp4',
      m4v: 'video/mp4',
      mov: 'video/mp4',
      mp3: 'audio/mpeg',
      mpeg: 'audio/mpeg',
      ogv: 'video/ogg',
      ogg: 'video/ogg',
      oga: 'video/ogg',
      vorbis: 'video/ogg',
      webm: 'video/webm',
      f4a: 'video/aac',
      m3u8: 'application/vnd.apple.mpegurl',
      m3u: 'application/vnd.apple.mpegurl',
      hls: 'application/vnd.apple.mpegurl'
    }[source.type];
    return !!(video && video.canPlayType && video.canPlayType(mimeType));
  };

  VideoElementProvider.getName = function getName() {
    return {
      name: PROVIDER_NAME
    };
  };

  VideoElementProvider.isLive = function isLive(duration) {
    return duration === Infinity;
  };

  VideoElementProvider.isDvr = function isDvr(seekableDuration, minDvrWindow) {
    return seekableDuration !== Infinity && Math.abs(seekableDuration) >= minDvrWindow;
  };

  function VideoElementProvider(playerId, config, mediaElement) {
    var _this = this;

    // Add event listener methods used by the player to this instance
    // See src/js/utils/backbone.events.ts
    var backboneEvents = jwplayer(playerId).Events;
    Object.assign(this, backboneEvents); // This video element comes from a pool managed by the player for dealing with autoplay policy
    // and ads playback, but you could also use or create your own.

    this.videoElement = mediaElement;
    this.name = PROVIDER_NAME;
    this.state = 'idle';
    this.supportsPlaybackRate = true;
    this.item = null;
    this.container = null;
    this.config = config;
    this.seeking = false;
    this.seekFromTime = null;
    this.seekToTime = null;
    this.stallTime = null;
    this.videoElement.setAttribute('controls', '');
    this.visualQuality = {
      reason: 'initial choice',
      mode: 'auto',
      bitrate: 0,
      level: {
        width: 0,
        height: 0,
        index: 0,
        label: ''
      }
    }; // Update state and trigger jwplayer events in response to changes on the video element

    var videoEventCallbacks = {
      click: function click(evt) {
        this.trigger('click', evt);
      },
      loadedmetadata: function loadedmetadata() {
        this.trigger('meta', {
          metadataType: 'media',
          duration: this.getDuration(),
          height: this.videoElement.videoHeight,
          width: this.videoElement.videoWidth,
          seekRange: this.getSeekRange()
        });
      },
      loadeddata: function loadeddata() {
        if (this.videoElement.getStartDate) {} // Get 'program-date-time' from this.videoElement.getStartDate() in Safari
        // Get 'audioTracks' from this.videoElement.audioTracks;

      },
      durationchange: function durationchange() {
        this.listenerDictionary.progress.call(this);
      },
      canplay: function canplay() {
        var mediaType = this.videoElement.videoHeight === 0 ? 'audio' : 'video';
        this.trigger('mediaType', {
          mediaType: mediaType
        });
        this.trigger('bufferFull');
      },
      play: function play() {
        if (!this.videoElement.paused && this.state !== 'playing') {
          this.setState('loading');
        }
      },
      playing: function playing() {
        this.trigger('providerFirstFrame');
        this.setState('playing');
      },
      pause: function pause() {
        if (this.state === 'complete' || this.videoElement.ended || this.videoElement.error || this.videoElement.currentTime === this.videoElement.duration) {
          return;
        }

        this.setState('paused');
      },
      timeupdate: function timeupdate() {
        var duration = this.getDuration();

        if (isNaN(duration)) {
          return;
        }

        var currentTime = this.videoElement.currentTime;

        if (!this.seeking && !this.videoElement.paused && (this.state === 'stalled' || this.state === 'loading') && this.stallTime !== currentTime) {
          this.stallTime = -1;
          this.listenerDictionary.playing.call(this);
        }

        var position = this.getCurrentTime();
        var seekRange = this.getSeekRange();
        var timeEvent = {
          position: position,
          duration: duration,
          currentTime: currentTime,
          seekRange: seekRange,
          metadata: {
            currentTime: currentTime
          }
        };
        var latency = this.getLiveLatency();

        if (latency !== null) {
          timeEvent.latency = latency;
        }

        if (this.seekToTime === null) {
          this.seekFromTime = currentTime;
        } // only emit time events when playing or seeking


        if (this.state === 'playing' || this.seeking) {
          this.trigger('time', timeEvent);
        }
      },
      ratechange: function ratechange() {
        this.trigger('ratechange', {
          playbackRate: this.videoElement.playbackRate
        });
      },
      seeking: function seeking() {
        var offset = this.seekToTime !== null ? this.timeToPosition(this.seekToTime) : this.getCurrentTime();
        var position = this.timeToPosition(this.seekFromTime || 0);
        this.seekFromTime = this.seekToTime;
        this.seekToTime = null;
        this.seeking = true;
        this.trigger('seek', {
          position: position,
          offset: offset
        });
      },
      seeked: function seeked() {
        if (!this.seeking) {
          return;
        }

        this.seeking = false;
        this.trigger('seeked');
      },
      progress: function progress() {
        var duration = this.getDuration();
        var buffered = this.videoElement.buffered;

        if (duration <= 0 || duration === Infinity || !buffered || buffered.length === 0) {
          return;
        }

        var bufferPercent = 100 * Math.min(Math.max(buffered.end(buffered.length - 1) / duration, 0), 1);
        this.trigger('bufferChange', {
          bufferPercent: bufferPercent,
          position: this.getCurrentTime(),
          duration: duration,
          currentTime: this.videoElement.currentTime,
          seekRange: this.getSeekRange()
        });
      },
      waiting: function waiting() {
        if (this.seeking) {
          this.setState('loading');
        } else if (this.state === 'playing') {
          if (this.atEdgeOfLiveStream()) {
            this.setPlaybackRate(1);
          }

          this.stallTime = this.videoElement.currentTime;
          this.setState('stalled');
        }
      },
      resize: function resize() {
        var videoElement = this.videoElement;
        var videoWidth = videoElement.videoWidth,
            videoHeight = videoElement.videoHeight; // Trigger 'visualQuality' when videoWidth or videoHeight changes

        var level = this.visualQuality.level;

        if (level.width !== videoWidth || level.height !== videoHeight) {
          var visualQuality = {
            level: {
              width: videoWidth,
              height: videoHeight,
              index: 0,
              // TODO: level index
              label: '' // TODO: levels

            },
            bitrate: 0,
            mode: 'auto',
            // TODO: 'manual' for mp4 levels
            reason: 'auto' // TODO: 'initial choice' for first resize after loading new item

          };
          this.visualQuality = visualQuality;
          this.trigger('visualQuality', visualQuality);
        }
      },
      volumechange: function volumechange() {
        this.trigger('volume', {
          volume: Math.round(this.videoElement.volume * 100)
        });
        this.trigger('mute', {
          mute: this.videoElement.muted
        });
      },
      ended: function ended() {
        if (this.state !== 'idle' && this.state !== 'complete') {
          this.trigger('complete');
        }
      },
      error: function error(sourceError) {
        this.videoElement.removeAttribute('src');
        this.videoElement.load();
        var error = {
          code: 290000,
          // Unknown Provider Error
          sourceError: sourceError
        };
        this.trigger('mediaError', error);
      }
    };
    this.listenerDictionary = {};
    Object.keys(videoEventCallbacks).forEach(function (eventName) {
      _this.listenerDictionary[eventName] = videoEventCallbacks[eventName].bind(_this);
    });
  }

  var _proto = VideoElementProvider.prototype;

  _proto.getName = function getName() {
    return VideoElementProvider.getName();
  };

  _proto.attachMedia = function attachMedia() {
    var _this2 = this;

    this.seeking = false;
    this.seekFromTime = null;
    this.seekToTime = null; // Reset video element settings

    this.videoElement.loop = false; // Add video element event listeners

    var listenerDictionary = this.listenerDictionary;
    Object.keys(listenerDictionary).forEach(function (eventName) {
      _this2.videoElement.removeEventListener(eventName, listenerDictionary[eventName]);

      _this2.videoElement.addEventListener(eventName, listenerDictionary[eventName]);
    });
  };

  _proto.detachMedia = function detachMedia() {
    var _this3 = this;

    if (!this.videoElement) {
      return;
    }

    var listenerDictionary = this.listenerDictionary;
    Object.keys(listenerDictionary).forEach(function (eventName) {
      _this3.videoElement.removeEventListener(eventName, listenerDictionary[eventName]);
    });
  };

  _proto.init = function init(item) {
    this.item = item;
    this.state = 'idle';
    this.attachMedia();
  };

  _proto.preload = function preload(item) {
    this.item = item; // TODO: convert sources array to "levels"

    if (item.image) {
      this.videoElement.setAttribute('poster', item.image);
    }

    this.setVideoSource(item.sources[0]);
    this.videoElement.load();
  };

  _proto.load = function load(item) {
    // TODO: Load side loaded item.tracks
    this.item = item;
    var previousSource = this.videoElement.src;
    this.setVideoSource(item.sources[0]);
    var sourceChanged = previousSource !== this.videoElement.src;

    if (sourceChanged) {
      // Do not call load if src was not set. load() will cancel any active play promise.
      if (previousSource) {
        this.videoElement.load();
      }
    } else if (item.starttime === 0 && this.videoElement.currentTime > 0) {
      // Load event is from the same video as before
      // restart video without dispatching seek event
      this.seek(item.starttime);
    } // Check if we have already seeked the mediaElement before _completeLoad has been called


    if (item.starttime > 0 && this.videoElement.currentTime !== item.starttime) {
      this.seek(item.starttime);
    } // TODO: convert sources array to "levels"


    this.trigger('levels', {
      levels: [{
        label: '0'
      }],
      currentQuality: 0
    });
  };

  _proto.volume = function volume(vol) {
    this.videoElement.volume = Math.min(Math.max(0, vol / 100), 1);
  };

  _proto.mute = function mute(state) {
    this.videoElement.muted = !!state;
  };

  _proto.resize = function resize(width, height, stretching) {
    var _this$videoElement = this.videoElement,
        videoWidth = _this$videoElement.videoWidth,
        videoHeight = _this$videoElement.videoHeight;

    if (!width || !height || !videoWidth || !videoHeight) {
      return;
    }

    this.videoElement.style.objectFit = '';

    if (stretching === 'uniform') {
      // Snap video to edges when the difference in aspect ratio is less than 9% and perceivable
      var playerAspectRatio = width / height;
      var videoAspectRatio = videoWidth / videoHeight;
      var edgeMatch = Math.abs(playerAspectRatio - videoAspectRatio);

      if (edgeMatch < 0.09 && edgeMatch > 0.0025) {
        this.videoElement.style.objectFit = 'fill';
      }
    }
  };

  _proto.getContainer = function getContainer() {
    return this.container;
  };

  _proto.setContainer = function setContainer(element) {
    this.container = element;

    if (element && this.videoElement.parentNode !== element) {
      element.appendChild(this.videoElement);
    }
  };

  _proto.removeFromContainer = function removeFromContainer() {
    var container = this.container,
        videoElement = this.videoElement;
    this.container = null;

    if (container && container === videoElement.parentNode) {
      container.removeChild(videoElement);
    }
  };

  _proto.remove = function remove() {
    var container = this.container;
    var video = this.videoElement;
    this.stop();
    this.destroy();

    if (container) {
      container.removeChild(video);
    }
  };

  _proto.stop = function stop() {
    this.seeking = false;

    if (this.videoElement) {
      this.videoElement.removeAttribute('preload');
      this.videoElement.removeAttribute('src');
      this.videoElement.load();
    }

    this.setState('idle');
  };

  _proto.destroy = function destroy() {
    this.off();
    this.detachMedia();
    this.item = null;
    this.seeking = false;
    this.container = null; // @ts-ignore

    this.config = null; // @ts-ignore

    this.videoElement = null;
  };

  _proto.supportsFullscreen = function supportsFullscreen() {
    return true;
  };

  _proto.setVisibility = function setVisibility(state) {
    state = !!state;

    if (this.container) {
      this.container.style.opacity = state ? '1' : '0';
    }
  };

  _proto.play = function play() {
    return this.videoElement.play();
  };

  _proto.pause = function pause() {
    this.videoElement.pause();
  };

  _proto.seek = function seek(toPosition) {
    var seekRange = this.getSeekRange();

    if (toPosition < 0) {
      this.seekToTime = toPosition + seekRange.end;
    } else {
      this.seekToTime = toPosition;
    }

    if (!this.getSeekableEnd()) {
      // Can't seek without seekable range, trigger playback
      // TODO: Defer seeking until seekable range updates
      this.item.starttime = this.seekToTime;
      this.play();
      return;
    }

    this.seeking = true;
    this.seekFromTime = this.videoElement.currentTime;
    this.videoElement.currentTime = this.seekToTime;
  };

  _proto.getPlaybackRate = function getPlaybackRate() {
    return this.videoElement.playbackRate;
  };

  _proto.setPlaybackRate = function setPlaybackRate(playbackRate) {
    this.videoElement.playbackRate = this.videoElement.defaultPlaybackRate = playbackRate;
  };

  _proto.getCurrentQuality = function getCurrentQuality() {
    return 0;
  };

  _proto.setCurrentQuality = function setCurrentQuality(qualityLevel) {};

  _proto.getQualityLevels = function getQualityLevels() {
    return [{
      bitrate: 0,
      label: '0',
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight
    }];
  };

  _proto.setCurrentAudioTrack = function setCurrentAudioTrack(at) {};

  _proto.getCurrentAudioTrack = function getCurrentAudioTrack() {
    return 0;
  };

  _proto.getAudioTracks = function getAudioTracks() {
    return [];
  };

  _proto.getFullscreen = function getFullscreen() {
    // Only return true if the video element itself is fullscreen (not the app/page/player)
    return false;
  };

  _proto.setFullscreen = function setFullscreen(isFullscreen) {// Request for the video element to go fullscreen, because the player is unable (iOS)
  };

  _proto.getCurrentTime = function getCurrentTime() {
    var currentTime = this.videoElement.currentTime;
    var seekRange = this.getSeekRange();

    if (VideoElementProvider.isLive(this.videoElement.duration)) {
      if (VideoElementProvider.isDvr(seekRange.end - seekRange.start, Math.max(this.config.minDvrWindow, 30))) {
        return currentTime - seekRange.end;
      }
    }

    return currentTime;
  };

  _proto.getDuration = function getDuration() {
    var duration = this.videoElement.duration; // Don't sent time event on Android before real duration is known

    if (isNaN(duration)) {
      return 0;
    }

    var end = this.getSeekableEnd();

    if (VideoElementProvider.isLive(this.videoElement.duration) && end) {
      var seekableDuration = end - this.getSeekableStart();

      if (VideoElementProvider.isDvr(seekableDuration, Math.max(this.config.minDvrWindow, 30))) {
        // Player interprets negative duration as DVR
        duration = -seekableDuration;
      }
    }

    return duration;
  };

  _proto.getSeekRange = function getSeekRange() {
    var seekRange = {
      start: 0,
      end: 0
    };
    var seekable = this.videoElement.seekable;

    if (seekable.length) {
      seekRange.end = this.getSeekableEnd();
      seekRange.start = this.getSeekableStart();
    } else if (isFinite(this.videoElement.duration)) {
      seekRange.end = this.videoElement.duration;
    }

    return seekRange;
  };

  _proto.getSeekableStart = function getSeekableStart() {
    var _this4 = this;

    var start = Infinity;
    ['buffered', 'seekable'].forEach(function (range) {
      var timeRange = _this4.videoElement[range];
      var index = timeRange ? timeRange.length : 0;

      while (index--) {
        var rangeStart = Math.min(start, timeRange.start(index));

        if (isFinite(rangeStart)) {
          start = rangeStart;
        }
      }
    });
    return start;
  };

  _proto.getSeekableEnd = function getSeekableEnd() {
    var _this5 = this;

    var end = 0;
    ['buffered', 'seekable'].forEach(function (range) {
      var timeRange = _this5.videoElement[range];
      var index = timeRange ? timeRange.length : 0;

      while (index--) {
        var rangeEnd = Math.max(end, timeRange.end(index));

        if (isFinite(rangeEnd)) {
          end = rangeEnd;
        }
      }
    });
    return end;
  };

  _proto.timeToPosition = function timeToPosition(time) {
    if (VideoElementProvider.isLive(this.videoElement.duration)) {
      var seekRange = this.getSeekRange();

      if (VideoElementProvider.isDvr(seekRange.end - seekRange.start, Math.max(this.config.minDvrWindow, 30))) {
        return Math.min(0, time - seekRange.end);
      }
    }

    return time;
  };

  _proto.atEdgeOfLiveStream = function atEdgeOfLiveStream() {
    if (!VideoElementProvider.isLive(this.videoElement.duration)) {
      return false;
    } // currentTime doesn't always get to the end of the buffered range


    var timeFudge = 2;
    var buffered = this.videoElement.buffered;
    var endOfRange = buffered && buffered.length ? buffered.end(buffered.length - 1) : 0;
    return endOfRange - this.videoElement.currentTime <= timeFudge;
  };

  _proto.getLiveLatency = function getLiveLatency() {
    var latency = null;
    var end = this.getSeekableEnd();

    if (VideoElementProvider.isLive(this.videoElement.duration) && end) {
      latency = end - this.videoElement.currentTime;
    }

    return latency;
  };

  _proto.setVideoSource = function setVideoSource(source) {
    var preload = source.preload || 'metadata';

    if (this.videoElement.getAttribute('preload') !== preload) {
      this.videoElement.setAttribute('preload', preload);
    }

    var sourceElement = document.createElement('source');
    sourceElement.src = source.file;
    var sourceChanged = this.videoElement.src !== sourceElement.src;

    if (sourceChanged) {
      this.videoElement.src = source.file;
    }
  };

  return VideoElementProvider;
}();

jwplayer.api.registerProvider(VideoElementProvider);

/***/ })

/******/ });
//# sourceMappingURL=video-element-provider.js.map