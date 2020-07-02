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
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/class-list-ie.js":
/*!******************************!*\
  !*** ./src/class-list-ie.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function () {
  var testElement = document.createElement('_');
  testElement.classList.add('c1', 'c2'); // Polyfill for IE 10/11 and Firefox <26, where classList.add and
  // classList.remove exist but support only one argument at a time.

  if (!testElement.classList.contains('c2')) {
    var createMethod = function createMethod(method) {
      var original = DOMTokenList.prototype[method];

      DOMTokenList.prototype[method] = function (token) {
        for (var i = 0, len = arguments.length; i < len; i++) {
          token = arguments[i];
          original.call(this, token);
        }
      };
    };

    createMethod('add');
    createMethod('remove');
  }

  testElement.classList.toggle('c3', false); // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
  // support the second argument.

  if (testElement.classList.contains('c3')) {
    var _toggle = DOMTokenList.prototype.toggle;

    DOMTokenList.prototype.toggle = function (token, force) {
      if (1 in arguments && !this.contains(token) === !force) {
        return force;
      }

      return _toggle.call(this, token);
    };
  }
})();

/***/ }),

/***/ "./src/config-default.js":
/*!*******************************!*\
  !*** ./src/config-default.js ***!
  \*******************************/
/*! exports provided: defaultConfig */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "defaultConfig", function() { return defaultConfig; });
var defaultConfig = {
  autostart: true,
  width: '100%',
  aspectratio: '16:9',
  playlist: '//cdn.jwplayer.com/v2/playlists/bEhVQYdb'
};

/***/ }),

/***/ "./src/config-editor.js":
/*!******************************!*\
  !*** ./src/config-editor.js ***!
  \******************************/
/*! exports provided: getConfig, iife */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getConfig", function() { return getConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "iife", function() { return iife; });
function getConfig(editor) {
  return new Promise(function (resolve, reject) {
    try {
      var config = eval(iife(editor.getValue().replace(/^[\s\w]+=[^{]*/, '')));

      if (Object(config) === config && !Array.isArray(config)) {
        resolve(config);
      } else {
        throw new Error('Config must be an object');
      }
    } catch (error) {
      setTimeout(function () {
        reject(error);
      });
    }
  });
}
var iife = function iife(js) {
  return "(function(){\nreturn " + js.replace(/^\s+/, '') + "}());\n";
};

/***/ }),

/***/ "./src/config-url-parser.js":
/*!**********************************!*\
  !*** ./src/config-url-parser.js ***!
  \**********************************/
/*! exports provided: getPlayerConfig, parseUrlSearchParams */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPlayerConfig", function() { return getPlayerConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parseUrlSearchParams", function() { return parseUrlSearchParams; });
var jwplayer = window.jwplayer;
function getPlayerConfig(harnessConfig) {
  return new Promise(function (resolve, reject) {
    var searchOptions = parseUrlSearchParams(location.search, {});
    var dataUrlPattern = /^data:text\/plain;base64,([a-zA-Z0-9+/]+={0,2})$/;
    var playersPattern = /^(?:https?:)?\/\/content\.jwplatform\.com\/players\/([a-zA-Z0-9]{8})-([a-zA-Z0-9]{8})\.js$/;
    var librariesPattern = /^(?:https?:)?\/\/content\.jwplatform\.com\/libraries\/[a-zA-Z0-9]{8}\.js$/;
    var jsUriReferencePattern = /[a-zA-Z0-9\s_\\.\-:]+(?:\.js(?:on)?)?$/;
    var jsFilenamePattern = /^([\w\s_\/-]+\.js(?:on)?)$/;

    if (searchOptions.config && dataUrlPattern.test(searchOptions.config)) {
      // decode base64 encode config from data url
      resolve(atob(dataUrlPattern.exec(searchOptions.config)[1]));
    } else if (searchOptions.config && playersPattern.test(searchOptions.config)) {
      // load single-line player and hijack the config
      var keyMatches = playersPattern.exec(searchOptions.config);
      var playerId = "botr_" + keyMatches.slice(1, 3).join('_') + "_div"; // Add the botr element to the page to prevent document.write on script load

      var element = document.createElement('div');
      element.id = playerId;
      document.body.appendChild(element); // Decorate jwplayer() to capture the setup config

      var jwp = window.jwplayer;

      window.jwplayer = function (id) {
        if (id === playerId) {
          return {
            setup: function setup(options) {
              document.body.removeChild(element);
              window.jwplayer = jwp;
              var config = playerId + " = " + stringify(options);
              resolve(config);
            }
          };
        }

        return jwp.apply(this, Array.prototype.slice.call(arguments));
      };

      loadScript(searchOptions.config).catch(reject);
    } else if (searchOptions.config && librariesPattern.test(searchOptions.config)) {
      // load a library player and hijack the config (defaults)
      loadScript(searchOptions.config).then(function () {
        var config = "defaults = " + stringify(jwplayer.defaults);
        delete jwplayer.defaults;
        resolve(config);
      });
    } else if (searchOptions.config && jsUriReferencePattern.test(searchOptions.config)) {
      // load a custom config
      var configJsFile = searchOptions.config;

      if (!jsFilenamePattern.test(configJsFile)) {
        configJsFile += '.json';
      }

      configJsFile = configJsFile.replace(jsFilenamePattern, '../../player-configs/$1');
      fetch(configJsFile, {
        credentials: 'same-origin'
      }).then(function (response) {
        if (!response.ok) {
          throw new Error(response.status + " (" + response.statusText + ")");
        }

        return response.text();
      }).then(resolve).catch(reject);
    } else {
      // Return config passed in from storage
      resolve(harnessConfig);
    }
  });
}

var stringify = function stringify(str) {
  return JSON.stringify(str, null, 4).replace(/(\s*)"(a-zA-Z_[a-zA-Z0-9_]*)":/g, '$1$2:');
};

function parseUrlSearchParams(url, object) {
  return (url || '').split('?').slice(1).join('').split('&').filter(function (pair) {
    return pair;
  }).reduce(function (obj, pair) {
    obj[pair.split('=')[0]] = decodeURIComponent((pair.split('=')[1] || '').replace(/\+/g, ' '));
    return obj;
  }, object || {});
}

function loadScript(url) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    script.timeout = 10000;
    script.onload = resolve;
    script.onerror = reject;
    script.src = url;
    document.head.appendChild(script);
  });
}

/***/ }),

/***/ "./src/event-groups.js":
/*!*****************************!*\
  !*** ./src/event-groups.js ***!
  \*****************************/
/*! exports provided: events */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "events", function() { return events; });
var events = {
  /** Global UI events can fire when idle, playing content, or in an ad break */
  globalUi: ['viewable', 'adBlock', 'userActive', 'userInactive', 'breakpoint', 'resize', 'fullscreen', 'float', 'controls', 'mute', 'volume', 'castAvailable', 'cast', 'relatedReady', 'videoThumbFirstFrame'],

  /** Ad break events fire during an ad break */
  adBreak: ['adBreakStart', 'adBreakEnd', 'adItem', 'adMeta', 'adStarted', 'adImpression', 'adViewableImpression', 'adPlay', 'adPause', 'adTime', 'adCompanions', 'adClick', 'adSkipped', 'adComplete', 'adError', 'adWarning'],

  /** Media events fire when idle or playing content, not in an ad break */
  media: ['levels', 'levelsChanged', 'captionsList', 'captionsChanged', 'subtitlesTracks', 'subtitlesTrackChanged', 'audioTracks', 'audioTrackChanged', 'mediaType', 'metadataCueParsed', 'meta', 'visualQuality', 'bufferChange', 'bufferFull', 'providerFirstFrame', 'providerChanged', 'providerPlayer', 'time', 'seek', 'seeked', 'fullscreenchange', 'mediaError'],

  /** Playback events fire when idle or playing content, not in an ad break */
  playback: ['ready', 'idle', 'buffer', 'play', 'pause', 'playlist', 'playlistItem', 'playlistComplete', 'beforePlay', 'beforeComplete', 'complete', 'playAttempt', 'firstFrame', 'playbackRateChanged', 'nextShown', 'destroyPlugin', 'click', 'displayClick', 'logoClick', 'nextClick', 'nextAutoAdvance', 'remove'],

  /** Error event order depends on the error type:
   *
   * A "warning" event is any non-fatal error that does not interrupt playback, but may signal some loss of functionality
   * because something did not work as expected. These events can occur at any time, depending on the source of the event.
   *
   * An "autostartNotAllowed" event is a type of warning emitted after setup (after "ready") for players set to autostart.
   * It indicates that playback was not attempted because it is not allowed by the browser without user interaction.
   *
   * "playAttemptFailed" is a type of warning that follows "playAttempt" events, when playback was prevented from starting
   * because the request to play was interrupted (possibly by a call to pause) or blocked by the browser's autoplay policy.
   *
   * An "error" event is a fatal error that interrupts the player. In these cases, the player appears in an error state,
   * because it cannot begin or continue playing the current playlist item.
   *
   * A "setupError" event is a fatal error that only occurs before setup can complete.
   * When there is a setup error, the player appears in an error state and will never fire a "ready" event.
   */
  error: ['warning', 'autostartNotAllowed', 'playAttemptFailed', 'error', 'setupError']
};

/***/ }),

/***/ "./src/events-video.js":
/*!*****************************!*\
  !*** ./src/events-video.js ***!
  \*****************************/
/*! exports provided: attachListenersToVideoElements, resetVideoElements */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "attachListenersToVideoElements", function() { return attachListenersToVideoElements; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resetVideoElements", function() { return resetVideoElements; });
var videoEvents = ['loadstart', 'progress', 'suspend', 'abort', 'error', 'emptied', 'stalled', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'playing', 'waiting', 'seeking', 'seeked', 'ended', 'durationchange', 'timeupdate', 'play', 'pause', 'ratechange', 'resize', 'volumechange'];
var videoTags = [];
var eventListeners = [];
var docCreateElement = document.createElement;
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

document.createElement = function () {
  var element = docCreateElement.apply(document, arguments);

  if (arguments[0] === 'video') {
    videoTags.push(element);
  }

  return element;
};

function attachListenersToVideoElements(genericEventHandler) {
  videoTags.forEach(function (video, i) {
    var tagListeners = eventListeners[i] || (eventListeners[i] = {}); // MutationObserver is not available in some environments (Webkit)

    if (MutationObserver) {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          genericEventHandler(video[mutation.attributeName], "video[" + i + "]." + mutation.attributeName, 'video');
        });
      });
      observer.observe(video, {
        attributes: true
      });
    }

    var load = video.load;
    var pause = video.pause;
    var play = video.play;

    video.load = function () {
      var result = load.call(this);
      genericEventHandler(result, "video[" + i + "].load()", 'video');
      return result;
    };

    video.pause = function () {
      var result = pause.call(this);
      genericEventHandler(result, "video[" + i + "].pause()", 'video');
      return result;
    };

    video.play = function () {
      var result = play.call(this);
      genericEventHandler(result, "video[" + i + "].play()", 'video');
      return result;
    };

    videoEvents.forEach(function (eventName) {
      var eventHandler = function eventHandler(event) {
        genericEventHandler({
          event: event,
          currentTime: video.currentTime,
          duration: video.duration,
          ended: video.ended,
          muted: video.muted,
          paused: video.paused,
          playbackRate: video.playbackRate,
          readyState: video.readyState,
          seeking: video.seeking,
          videoHeight: video.videoHeight,
          videoWidth: video.videoWidth,
          volume: video.volume
        }, "video[" + i + "]>" + event.type, 'video');
      };

      tagListeners[eventName] = eventHandler;
      video.addEventListener(eventName, eventHandler);
    });
  });
}
function resetVideoElements() {
  eventListeners.forEach(function (tagListeners, i) {
    var video = videoTags[i];
    Object.keys(tagListeners).forEach(function (eventName) {
      video.removeEventListener(eventName, tagListeners[eventName]);
    });
  });
  videoTags.length = 0;
  eventListeners.length = 0;
}

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _config_default__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config-default */ "./src/config-default.js");
/* harmony import */ var _config_editor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config-editor */ "./src/config-editor.js");
/* harmony import */ var _config_url_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./config-url-parser */ "./src/config-url-parser.js");
/* harmony import */ var _event_groups__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./event-groups */ "./src/event-groups.js");
/* harmony import */ var _events_video__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./events-video */ "./src/events-video.js");
/* harmony import */ var _local_storage__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./local-storage */ "./src/local-storage.js");
/* harmony import */ var _stringify__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./stringify */ "./src/stringify.js");
/* harmony import */ var _class_list_ie__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./class-list-ie */ "./src/class-list-ie.js");
/* harmony import */ var _class_list_ie__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_class_list_ie__WEBPACK_IMPORTED_MODULE_7__);








var ace = window.ace;
var jwplayer = window.jwplayer;
var performance = window.jwplayer || {};
var history = window.history || {};
jwplayer.debug = true;
var jwplayerEvents = Array.prototype.concat.apply([], Object.keys(_event_groups__WEBPACK_IMPORTED_MODULE_3__["events"]).map(function (key) {
  return _event_groups__WEBPACK_IMPORTED_MODULE_3__["events"][key];
}));
var eventLogGroups = {};
var eventFlow = 'down';
var sequenceCount = 0;

var filterEventElement = function filterEventElement() {};

function getAndSaveConfig(editor) {
  return Object(_config_editor__WEBPACK_IMPORTED_MODULE_1__["getConfig"])(editor).then(function (config) {
    var configToSave = editor.getValue().replace(/("|')\.\.\/\.\.\/\.\.\/bin-/g, '$1../bin-');

    if (configToSave && configToSave !== _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].harnessConfig) {
      _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].harnessConfig = configToSave;
    }

    return config;
  });
}

function getEventGroup(eventName) {
  for (var key in _event_groups__WEBPACK_IMPORTED_MODULE_3__["events"]) {
    if (_event_groups__WEBPACK_IMPORTED_MODULE_3__["events"][key].indexOf(eventName) > -1) {
      return key;
    }
  }

  return 'unknown';
}

function getPlaybackMode(eventGroup, currentMode) {
  if (eventGroup === 'playback' || eventGroup === 'media') {
    return 'player';
  }

  if (eventGroup === 'adBreak') {
    return 'ads';
  }

  return currentMode;
}

function padStart(str, content, length) {
  if (str.length >= length) {
    return content;
  }

  return new Array(1 + length - str.length).join(' ') + content;
}

function createEventSequenceElement(inMode) {
  var element = document.createElement('div');
  element.classList.add('sequence', "mode-" + inMode);
  element.setAttribute('data-sequence', "" + sequenceCount++);
  return element;
}

function appendSequenceElement(container, element) {
  var firstSequenceElement = container.querySelector('.sequence');

  if (eventFlow === 'down' || !firstSequenceElement) {
    container.appendChild(element);
  } else {
    container.insertBefore(element, firstSequenceElement);
  }
}

function appendData(div, inEvent, group, data) {
  if (group === 'adRequest' || group === 'adBreak' || inEvent === 'time' || inEvent === 'meta' || inEvent === 'metadataCueParsed') {
    var pre = document.createElement('pre');
    pre.classList.add('group-quickPeek');
    pre.textContent = padStart(inEvent, JSON.stringify(['currentTime', 'metadataType', 'adBreakId', 'adPlayId'].reduce(function (obj, prop) {
      obj[prop] = data[prop];
      return obj;
    }, {}), null, 0), 20);
    div.appendChild(pre);
  }
}

function appendEvent(container, inEvent, inEventGroup, mode, data) {
  var div = document.createElement('div');
  div.classList.add('group-' + inEventGroup, 'event-' + inEvent, 'pre');
  div.textContent = textContentGrouped(inEvent);
  appendData(div, inEvent, inEventGroup, data);
  div.setAttribute('title', mode + " " + inEventGroup + " event \"" + inEvent + "\"");
  div.setAttribute('tabindex', '0');

  div.onclick = div.onkeyup = function (e) {
    if (e && e.keyCode && e.keyCode !== 13) {
      return;
    }

    console.log(data);
    div.textContent = (div.expanded = !div.expanded) ? textContentExpanded(inEvent, [data]) : textContentGrouped(inEvent);

    if (e) {
      e.preventDefault();
    }

    return [data];
  };

  filterEventElement(div);
  container.appendChild(div);

  if (inEvent === 'javascriptError') {
    div.setAttribute('title', div.textContent);
    div.onclick();
  }

  return div;
}

function incrementEvent(group, inEvent, inEventGroup, div, data) {
  group[inEvent]++;
  div.textContent = textContentGrouped(inEvent, group);
  appendData(div, div.textContent, inEventGroup, data);
  var logPreviousEvents = div.onclick;

  div.onclick = div.onkeyup = function (e) {
    if (e && e.keyCode && e.keyCode !== 13) {
      return;
    }

    var allData = logPreviousEvents();
    allData.push(data);
    console.log(data);
    div.textContent = div.expanded ? textContentExpanded(inEvent, allData) : textContentGrouped(inEvent, group);

    if (e) {
      e.preventDefault();
    }

    return allData;
  };

  if (inEvent === 'javascriptError' && !div.expanded) {
    div.onclick();
  }
}

function textContentGrouped(inEvent, group) {
  if (group) {
    return inEvent + " (" + group[inEvent] + ")";
  }

  return inEvent;
}

function textContentExpanded(inEvent, allData) {
  return inEvent + " (" + allData.map(function (item, i) {
    return (allData.length > 1 ? "[" + i + "] = " : '') + Object(_stringify__WEBPACK_IMPORTED_MODULE_6__["stringify"])(item, null, 4);
  }).join('\n') + ")";
}

function getPageEventsLoggerListeners() {
  var logContainer = document.querySelector('#event-log');
  var inEventGroup = '';
  var inMode = 'player';
  var inEvent = '';
  var lastEvent = '';
  var lastMode = 'player';
  var lastGroup;

  var genericEventHandler = function genericEventHandler(e, type, eventGroup) {
    inEventGroup = eventGroup;
    inMode = getPlaybackMode(eventGroup, lastMode);
    inEvent = type;
    performance.mark(inMode);
    performance.mark(inEvent);

    if (lastEvent && lastEvent !== inEvent) {
      performance.measure(lastEvent, lastEvent, inEvent);
    }

    var group = eventLogGroups[inMode];

    if (!group || group !== lastGroup) {
      var beforeReadyElement = createEventSequenceElement(inMode);
      appendSequenceElement(logContainer, beforeReadyElement);
      group = eventLogGroups[inMode] = {
        mode: inMode,
        eventGroup: inEventGroup,
        event: inEvent,
        container: logContainer,
        eventElement: beforeReadyElement
      };
      lastGroup = lastGroup || group;
    }

    if (inEventGroup === 'globalUi') {
      if (group.lastUiEvent === inEvent) {
        incrementEvent(group, inEvent, inEventGroup, group.preUi, e);
      } else {
        group[inEvent] = 1;
        group.lastUiEvent = inEvent;
        group.preUi = appendEvent(group.eventElement, inEvent, inEventGroup, inMode, e);
      }

      return;
    }

    if (inEventGroup === 'video') {
      if (/>(?:timeupdate|seeking)$/.test(inEvent)) {
        if (group.lastVideoEvent === inEvent) {
          incrementEvent(group, inEvent, inEventGroup, group.preVideo, e);
        } else {
          var eventElement = createEventSequenceElement(inMode);
          group[inEvent] = 1;
          group.eventElement = eventElement;
          group.lastVideoEvent = inEvent;
          group.preVideo = appendEvent(group.eventElement, inEvent, inEventGroup, inMode, e);
          appendSequenceElement(group.container, eventElement);
        }

        return;
      }

      group.lastVideoEvent = null;
    }

    if (lastEvent === inEvent && inEvent.substr(0, 4) !== 'meta') {
      incrementEvent(group, inEvent, inEventGroup, group.pre, e);
    } else {
      var _eventElement = createEventSequenceElement(inMode);

      group[inEvent] = 1;
      group.eventElement = _eventElement;
      group.lastEventGroup = inEventGroup;
      group.pre = appendEvent(_eventElement, inEvent, inEventGroup, inMode, e);
      appendSequenceElement(group.container, _eventElement);
    }

    lastEvent = inEvent;
    lastMode = inMode;
    lastGroup = group;
    group.lastUiEvent = null;
  };

  var firstEventHander = function firstEventHander(e) {
    genericEventHandler(e, e.type, getEventGroup(e.type));
  };

  function errorToJSONPolyfill() {
    if (!('toJSON' in Error.prototype)) {
      Object.defineProperty(Error.prototype, 'toJSON', {
        value: function value() {
          return {
            message: this.message
          };
        },
        configurable: true,
        writable: true
      });
    }
  }

  window.addEventListener('error', function (event) {
    errorToJSONPolyfill();
    firstEventHander({
      type: 'javascriptError',
      error: event.error,
      event: event
    });
  });
  window.addEventListener('unhandledrejection', function (event) {
    errorToJSONPolyfill();
    firstEventHander({
      type: 'unhandledPromiseRejection',
      error: event.error || event.reason,
      event: event
    });
  });
  setupButton(document.querySelector('#clear-events'), function () {
    Array.prototype.slice.call(logContainer.querySelectorAll('div')).forEach(function (element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    });
  });
  setupButton(document.querySelector('#event-flow-direction'), function () {
    eventFlow = eventFlow === 'down' ? 'up' : 'down';
    var dir = eventFlow === 'down' ? -1 : 1;
    var elements = document.querySelectorAll('.sequence');
    var sorted = [].slice.call(elements).sort(function (a, b) {
      return dir * (parseInt(b.getAttribute('data-sequence')) - parseInt(a.getAttribute('data-sequence')));
    });
    var temp = document.createDocumentFragment();
    sorted.forEach(function (el) {
      return temp.appendChild(el);
    });
    document.querySelector('#event-log').appendChild(temp);
    this.innerHTML = {
      down: '&#x23EC;',
      up: '&#x23EB;'
    }[eventFlow];
  });
  return jwplayerEvents.reduce(function (val, key) {
    val[key] = firstEventHander;
    return val;
  }, Object.create({
    genericEventHandler: genericEventHandler
  }));
}

function runSetup(editor) {
  Object(_config_editor__WEBPACK_IMPORTED_MODULE_1__["getConfig"])(editor).then(resize).then(function (config) {
    // Version new setup configs in storage and setup
    var setupConfig = editor.getValue();

    if (_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].setupConfig !== setupConfig) {
      _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].setupConfig = setupConfig;
    }

    setup(config);
  }).catch(function (error) {
    console.warn('Error parsing config. Falling back to default setup.', error);
    jwplayer('player').remove();
  });
}

function resize(config) {
  var width = config.width || 640;
  document.body.style.minWidth = /%$/.test(width) ? '' : width + "px";
  return config;
}

function setup(config) {
  var eventLoggerHandlers = getPageEventsLoggerListeners();
  var genericEventHandler = eventLoggerHandlers.genericEventHandler;
  Object(_events_video__WEBPACK_IMPORTED_MODULE_4__["resetVideoElements"])();
  jwplayer('player').setup(config).on('all', function (type, e) {
    var handler = eventLoggerHandlers[type];

    if (!handler) {
      console.error("Event \"" + type + "\" not defined in events list.", e); // Run 'firstEventHander' on this event to add it to the log

      var firstEventHander = eventLoggerHandlers.ready;
      firstEventHander(e);
    } else {
      handler.call(this, e);
    }
  }).on('ready', function () {
    genericEventHandler({
      userAgent: window.navigator.userAgent,
      environment: jwplayer('player').getEnvironment()
    }, 'info:environment', getEventGroup('info:environment'));
  });
  Object(_events_video__WEBPACK_IMPORTED_MODULE_4__["attachListenersToVideoElements"])(genericEventHandler);
}

function getConfigForEditor(configJs) {
  return (configJs || JSON.stringify(_config_default__WEBPACK_IMPORTED_MODULE_0__["defaultConfig"], null, 4)).replace(/("|')(\.\.\/)+bin-/g, '$1../../../bin-');
}

function setupEditor(savedConfig) {
  var configInput = document.querySelector('#player-config');
  configInput.value = getConfigForEditor(savedConfig);
  var editor = ace.edit(configInput);
  editor.getSession().setMode('ace/mode/javascript');
  editor.setTheme('ace/theme/twilight');
  var options = {
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: false,
    maxLines: 1
  };
  editor.setOptions(options);

  editor.expand = function () {
    var lineHeight = editor.getFontSize() + 5;
    var availableHeight = (document.documentElement.clientHeight, window.innerHeight || 0) - 100;
    options.maxLines = Math.min(Math.max(5, Math.floor(availableHeight / lineHeight)), 150);
    editor.setOptions(options);
    editor.focus();
  };

  editor.contract = function () {
    options.maxLines = 1;
    editor.setOptions(options);
  };

  var focusTimeout;
  var saveTimeout;
  editor.on('focus', function () {
    // Save the config when it's changed (in focus)
    editor.off('change');
    editor.on('change', function () {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(function () {
        getAndSaveConfig(editor).then(function () {
          // If the change is valid clear any config params in the url and save
          if (history.pushState && Object(_config_url_parser__WEBPACK_IMPORTED_MODULE_2__["parseUrlSearchParams"])(location.search, {}).config) {
            history.pushState(editor.getValue(), '', "" + location.origin + location.pathname);
          }
        }).catch(function () {
          /* noop */
        });
      }, 500);
    });
    clearTimeout(focusTimeout);
    focusTimeout = setTimeout(editor.expand);
  });
  editor.on('blur', function () {
    editor.off('change');
    clearTimeout(focusTimeout);

    if (editor.pinned) {
      return;
    }

    focusTimeout = setTimeout(editor.contract, 250);
  });
  editor.commands.addCommand({
    name: 'Run',
    exec: runSetup,
    bindKey: {
      mac: 'cmd-enter',
      win: 'ctrl-enter'
    }
  }); // When navigating, setup the player according to the current location.search params or local storage

  window.onpopstate = function () {
    Object(_config_url_parser__WEBPACK_IMPORTED_MODULE_2__["getPlayerConfig"])(_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].setupConfig || _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].harnessConfig).then(function (configText) {
      editor.setValue(configText);
      clearTimeout(saveTimeout);
      runSetup(editor);
    });
  };

  return editor;
}

function setupControls(editor) {
  var controls = document.querySelector('#config-controls');

  controls.onclick = function (event) {
    if (event.target === controls) {
      editor.expand();
    }
  };

  setupSetup(document.querySelector('#setup'), editor);
  setupConfigNav(document.querySelector('#setup-prev'), document.querySelector('#setup-next'), editor);
  setupPin(document.querySelector('#pin-config'), editor);
  setupCopy(document.querySelector('#copy-config'), editor);
  setupPermalink(document.querySelector('#permalink-config'), editor);
  setupDownload(document.querySelector('#download-config'), editor);
}

function setupSetup(button, editor) {
  button.onclick = function () {
    runSetup(editor);
  };
}

function setupConfigNav(buttonPrev, buttonNext, editor) {
  _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].setupUpdated = function (version) {
    buttonPrev.disabled = !version || version === 1 || !_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].getSetupVersion(version - 1);
    buttonNext.disabled = !_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].getSetupVersion(version + 1);
  };

  var changeSetupVersion = function changeSetupVersion(version) {
    var setupConfig = _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].getSetupVersion(version);

    if (setupConfig) {
      _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].setupVersion = version;
    }

    _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].setupUpdated(version);
    editor.setValue(setupConfig);
    editor.clearSelection(); // getConfig(editor).then(setup);
  };

  buttonPrev.onclick = function () {
    changeSetupVersion(_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].setupVersion - 1);
  };

  buttonNext.onclick = function () {
    changeSetupVersion(_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].setupVersion + 1);
  };

  _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].setupUpdated(_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].setupVersion);
}

function setupPin(button, editor) {
  _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].defineProperty('pinConfig', true);

  var updatePin = function updatePin() {
    button.classList.toggle('disabled', !editor.pinned);

    if (editor.pinned) {
      editor.expand();
    } else {
      editor.contract();
    }
  };

  button.onclick = function () {
    editor.pinned = _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].pinConfig = !editor.pinned;
    updatePin();
  };

  editor.pinned = !!_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].pinConfig;
  updatePin();
}

function setupDownload(button, editor) {
  button.onclick = function () {
    var config = editor.getValue();
    var nameMatch = config.match(/(\w+)\s*=/);
    button.setAttribute('download', (nameMatch ? nameMatch[1] : 'config') + '.js');
    button.setAttribute('href', 'data:application/xml;charset=utf-8,' + Object(_config_editor__WEBPACK_IMPORTED_MODULE_1__["iife"])(config));
  };
}

function setupCopy(button, editor) {
  button.onclick = function () {
    // copy to clipboard
    var textarea = document.createElement('textarea');
    textarea.value = editor.getValue();
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };
}

function setupPermalink(button, editor) {
  button.onclick = function () {
    var base64Config = encodeURIComponent("data:text/plain;base64," + btoa(editor.getValue()));
    history.pushState(null, '', "" + location.origin + location.pathname + "?config=" + base64Config);
  };
}

function setupButton(button, callback) {
  button.onclick = callback;
}

function updateToggle(element, groupClass, enabled) {
  element.classList.toggle('disabled', !enabled);
  document.querySelector('#event-log').classList.toggle(groupClass + '-disabled', !enabled);
}

function setupLogFilters() {
  Array.prototype.slice.call(document.querySelectorAll('#group-toggles .toggle')).forEach(function (element) {
    var groupClass = element.className.replace(/^.*\b(group-\w+)\b.*$/, '$1');
    var toggleName = groupClass + '-toggle';
    _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].defineProperty(toggleName);
    var enabled = _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"][toggleName];
    enabled = enabled === null ? !element.classList.contains('disabled') : JSON.parse(enabled);
    updateToggle(element, groupClass, enabled);

    element.onclick = function () {
      enabled = _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"][toggleName] = !enabled;
      updateToggle(element, groupClass, enabled);
    };
  });
  var filterTimeout = -1;
  var inputFilterField = document.querySelector('#input-filter');

  var updateFilter = function updateFilter() {
    var filter = function (textInput) {
      _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].eventsFilter = textInput;
      inputFilterField.setCustomValidity('');
      var regexParts = /^\/(.+)\/(g?i?m?s?u?y?)$/.exec(textInput);

      if (regexParts) {
        try {
          var regex = new RegExp(regexParts[1], regexParts[2]);
          return function (input) {
            return regex.test(input);
          };
        } catch (error) {
          /* Invalid Regular Expression */
          inputFilterField.setCustomValidity('Invalid Regular Expression');
          return function () {
            return true;
          };
        }
      }

      return function (input) {
        return !textInput || input.toLowerCase().indexOf(textInput.toLowerCase()) > -1;
      };
    }(inputFilterField.value);

    filterEventElement = function filterEventElement(element) {
      element.classList.toggle('filter-not-matched', !filter(element.textContent));
    };

    Array.prototype.slice.call(document.querySelectorAll('.sequence > .pre')).forEach(filterEventElement);
  };

  if (_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].eventsFilter) {
    inputFilterField.value = _local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].eventsFilter;
    updateFilter(_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].eventsFilter);
  }

  inputFilterField.addEventListener('keyup', function () {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(updateFilter);
  });
}

if (!('mark' in performance)) {
  performance.mark = function ()
  /* name */
  {};
}

if (!('measure' in performance)) {
  performance.measure = function ()
  /* name, startMark, endMark */
  {};
}

var editorPromise = Object(_config_url_parser__WEBPACK_IMPORTED_MODULE_2__["getPlayerConfig"])(_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].harnessConfig).then(function (configText) {
  return setupEditor(configText);
}).catch(function (error) {
  console.error('Error loading js config', error);
  return setupEditor(_local_storage__WEBPACK_IMPORTED_MODULE_5__["storage"].harnessConfig);
});
editorPromise.then(function (editor) {
  runSetup(editor);
  setupControls(editor);
});
setupLogFilters();

/***/ }),

/***/ "./src/local-storage.js":
/*!******************************!*\
  !*** ./src/local-storage.js ***!
  \******************************/
/*! exports provided: NAMESPACE, storage */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NAMESPACE", function() { return NAMESPACE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "storage", function() { return storage; });
var localStorage = window.localStorage || {};
var NAMESPACE = '';
var storage = Object.create({
  getSetupVersion: function getSetupVersion(version) {
    try {
      return localStorage.getItem(NAMESPACE + "setup_v" + version);
    } catch (error) {
      return null;
    }
  },
  defineProperty: function defineProperty(property, serialize) {
    var nsProperty = NAMESPACE + property;
    Object.defineProperty(this, property, {
      get: function get() {
        try {
          if (serialize) {
            return JSON.parse(localStorage.getItem(nsProperty));
          }

          return localStorage.getItem(nsProperty);
        } catch (error) {
          return null;
        }
      },
      set: function set(value) {
        try {
          if (serialize) {
            localStorage.setItem(nsProperty, JSON.stringify(value));
          } else {
            localStorage.setItem(nsProperty, value);
          }
        } catch (error) {
          /* noop */
        }
      }
    });
  }
});
storage.defineProperty('harnessConfig');
storage.defineProperty('eventsFilter');
storage.defineProperty('setupVersion', true);
Object.defineProperty(storage, 'setupConfig', {
  get: function get() {
    var version = storage.setupVersion;

    if (!version) {
      return null;
    }

    return storage.getSetupVersion(version);
  },
  set: function set(value) {
    var version = storage.setupVersion || 0;

    if (isNaN(version++)) {
      version = 1;
    }

    try {
      localStorage.setItem(NAMESPACE + "setup_v" + version, value);
      localStorage.setupVersion = version;
      localStorage.removeItem(NAMESPACE + "setup_v" + (version - 20));

      if (storage.setupUpdated) {
        storage.setupUpdated(version);
      }
    } catch (error) {
      console.error(error);
    }
  }
});

/***/ }),

/***/ "./src/stringify.js":
/*!**************************!*\
  !*** ./src/stringify.js ***!
  \**************************/
/*! exports provided: stringify */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "stringify", function() { return stringify; });
var Uint8Array = window.Uint8Array;
var TimeRanges = window.TimeRanges;
function stringify(value, replacer, space) {
  try {
    return truncate(JSON.stringify(value, replacer || stringifyReplacer(value), space), 100000);
  } catch (error) {
    return "[" + error + "]";
  }
}

function truncate(str, length) {
  return (str && str.length) > length ? str.substr(0, length) + '\n... Event truncated due to length (see console for complete output)' : str;
}

function stringifyReplacer(parentValue) {
  var references = [];
  var safeResults = [];
  var complexity = 0;
  return function stringifyKeyValue(key, value) {
    if (typeof value === 'object') {
      if (value === null || value instanceof Date || value instanceof RegExp) {
        return value;
      }

      if (!!Uint8Array && value instanceof Uint8Array) {
        // Stub values of Arrays with more than 1000 items
        var str = '' + value;
        str = str.length > 40 ? str.substr(0, 40) + '...(see console)' : str;
        return "Uint8Array(" + value.length + ") [" + str + "]";
      }

      if (!!TimeRanges && value instanceof TimeRanges) {
        var ranges = [];

        for (var i = 0; i < value.length; i++) {
          ranges[i] = "start(" + i + ") = " + value.start(i) + " end(" + i + ") = " + value.end(i);
        }

        return "TimeRanges(" + value.length + ") [" + ranges + "]";
      }

      if (value === parentValue && complexity > 0) {
        return '<parent object>';
      }

      var referenceIndex = references.indexOf(value);

      if (referenceIndex !== -1) {
        // Duplicate reference found
        var safe = safeResults[referenceIndex];

        if (safe) {
          return safe;
        }

        try {
          // Test for circular references
          JSON.stringify(value);
        } catch (error) {
          return safeResults[referenceIndex] = '<' + value + '...(see console)>';
        }

        safeResults[referenceIndex] = value;
      }

      if (complexity++ > 10000) {
        return '<complexity exceeded>';
      }

      references.push(value);
      return value;
    }

    if (typeof value === 'function') {
      return "" + value;
    }

    return value;
  };
}

/***/ })

/******/ });
//# sourceMappingURL=index.js.map