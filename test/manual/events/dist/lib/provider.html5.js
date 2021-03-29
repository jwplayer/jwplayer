/*!
JW Player version 8.20.0
Copyright (c) 2021, JW Player, All Rights Reserved 
https://github.com/jwplayer/jwplayer/blob/v8.20.0/README.md

This source code and its use and distribution is subject to the terms and conditions of the applicable license agreement. 
https://www.jwplayer.com/tos/

This product includes portions of other software. For the full text of licenses, see below:

JW Player Third Party Software Notices and/or Additional Terms and Conditions

**************************************************************************************************
The following software is used under Apache License 2.0
**************************************************************************************************

vtt.js v0.13.0
Copyright (c) 2021 Mozilla (http://mozilla.org)
https://github.com/mozilla/vtt.js/blob/v0.13.0/LICENSE

* * *

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.

You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and
limitations under the License.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**************************************************************************************************
The following software is used under MIT license
**************************************************************************************************

Underscore.js v1.6.0
Copyright (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative
https://github.com/jashkenas/underscore/blob/1.6.0/LICENSE

Backbone backbone.events.js v1.1.2
Copyright (c) 2010-2014 Jeremy Ashkenas, DocumentCloud
https://github.com/jashkenas/backbone/blob/1.1.2/LICENSE

Promise Polyfill v7.1.1
Copyright (c) 2014 Taylor Hakes and Forbes Lindesay
https://github.com/taylorhakes/promise-polyfill/blob/v7.1.1/LICENSE

can-autoplay.js v3.0.0
Copyright (c) 2017 video-dev
https://github.com/video-dev/can-autoplay/blob/v3.0.0/LICENSE

focus-options-polyfill v1.5.0
Copyright (c) 2018 Juan Valencia
https://github.com/calvellido/focus-options-polyfill/blob/v1.5.0/LICENSE

* * *

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**************************************************************************************************
The following software is used under W3C license
**************************************************************************************************

Intersection Observer v0.5.0
Copyright (c) 2016 Google Inc. (http://google.com)
https://github.com/w3c/IntersectionObserver/blob/v0.5.0/LICENSE.md

* * *

W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE
Status: This license takes effect 13 May, 2015.

This work is being provided by the copyright holders under the following license.

License
By obtaining and/or copying this work, you (the licensee) agree that you have read, understood, and will comply with the following terms and conditions.

Permission to copy, modify, and distribute this work, with or without modification, for any purpose and without fee or royalty is hereby granted, provided that you include the following on ALL copies of the work or portions thereof, including modifications:

The full text of this NOTICE in a location viewable to users of the redistributed or derivative work.

Any pre-existing intellectual property disclaimers, notices, or terms and conditions. If none exist, the W3C Software and Document Short Notice should be included.

Notice of any changes or modifications, through a copyright statement on the new code or document such as "This software or document includes material copied from or derived from [title and URI of the W3C document]. Copyright © [YEAR] W3C® (MIT, ERCIM, Keio, Beihang)."

Disclaimers
THIS WORK IS PROVIDED "AS IS," AND COPYRIGHT HOLDERS MAKE NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY OR FITNESS FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE SOFTWARE OR DOCUMENT WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS, TRADEMARKS OR OTHER RIGHTS.

COPYRIGHT HOLDERS WILL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF ANY USE OF THE SOFTWARE OR DOCUMENT.

The name and trademarks of copyright holders may NOT be used in advertising or publicity pertaining to the work without specific, written prior permission. Title to copyright in this work will at all times remain with copyright holders.
*/
(window["webpackJsonpjwplayer"] = window["webpackJsonpjwplayer"] || []).push([["provider.html5"],{

/***/ "./src/js/controller/tracks-helper.ts":
/*!********************************************!*\
  !*** ./src/js/controller/tracks-helper.ts ***!
  \********************************************/
/*! exports provided: createId, createLabel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createId", function() { return createId; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createLabel", function() { return createLabel; });
function createId(track, tracksCount) {
  var trackId;
  var prefix = track.kind || 'cc';

  if (track.default || track.defaulttrack) {
    trackId = 'default';
  } else {
    trackId = track._id || track.file || prefix + tracksCount;
  }

  return trackId;
}
function createLabel(track, unknownCount) {
  var label = track.label || track.name || track.language;

  if (!label) {
    label = 'Unknown CC';
    unknownCount += 1;

    if (unknownCount > 1) {
      label += ' [' + unknownCount + ']';
    }
  }

  return {
    label: label,
    unknownCount: unknownCount
  };
}

/***/ }),

/***/ "./src/js/controller/tracks-loader.ts":
/*!********************************************!*\
  !*** ./src/js/controller/tracks-loader.ts ***!
  \********************************************/
/*! exports provided: loadFile, cancelXhr */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadFile", function() { return loadFile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cancelXhr", function() { return cancelXhr; });
/* harmony import */ var parsers_captions_vttcue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! parsers/captions/vttcue */ "./src/js/parsers/captions/vttcue.js");
/* harmony import */ var _api_core_loader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../api/core-loader */ "./src/js/api/core-loader.js");
/* harmony import */ var utils_ajax__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/ajax */ "./src/js/utils/ajax.js");
/* harmony import */ var parsers_parsers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! parsers/parsers */ "./src/js/parsers/parsers.ts");
/* harmony import */ var parsers_captions_srt__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! parsers/captions/srt */ "./src/js/parsers/captions/srt.ts");
/* harmony import */ var parsers_captions_dfxp__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! parsers/captions/dfxp */ "./src/js/parsers/captions/dfxp.ts");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");







function loadFile(track, successHandler, errorHandler) {
  track.xhr = Object(utils_ajax__WEBPACK_IMPORTED_MODULE_2__["ajax"])(track.file, function (xhr) {
    xhrSuccess(xhr, track, successHandler, errorHandler);
  }, function (key, url, xhr, error) {
    errorHandler(Object(api_errors__WEBPACK_IMPORTED_MODULE_6__["composePlayerError"])(error, api_errors__WEBPACK_IMPORTED_MODULE_6__["ERROR_LOADING_CAPTIONS"]));
  });
}
function cancelXhr(tracks) {
  if (tracks) {
    tracks.forEach(function (track) {
      var xhr = track.xhr;

      if (xhr) {
        xhr.onload = null;
        xhr.onreadystatechange = null;
        xhr.onerror = null;

        if ('abort' in xhr) {
          xhr.abort();
        }
      }

      delete track.xhr;
    });
  }
}

function convertToVTTCues(cues) {
  // VTTCue is available natively or polyfilled where necessary
  return cues.map(function (cue) {
    return new parsers_captions_vttcue__WEBPACK_IMPORTED_MODULE_0__["default"](cue.begin, cue.end, cue.text);
  });
}

function xhrSuccess(xhr, track, successHandler, errorHandler) {
  var xmlRoot = xhr.responseXML ? xhr.responseXML.firstChild : null;
  var cues;
  var vttCues; // IE9 sets the firstChild element to the root <xml> tag

  if (xmlRoot) {
    if (Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_3__["localName"])(xmlRoot) === 'xml') {
      xmlRoot = xmlRoot.nextSibling;
    } // Ignore all comments


    while (xmlRoot && xmlRoot.nodeType === xmlRoot.COMMENT_NODE) {
      xmlRoot = xmlRoot.nextSibling;
    }
  }

  try {
    if (xmlRoot && Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_3__["localName"])(xmlRoot) === 'tt') {
      // parse dfxp track
      if (!xhr.responseXML) {
        throw new Error('Empty XML response');
      }

      cues = Object(parsers_captions_dfxp__WEBPACK_IMPORTED_MODULE_5__["default"])(xhr.responseXML);
      vttCues = convertToVTTCues(cues);
      delete track.xhr;
      successHandler(vttCues);
    } else {
      // parse VTT/SRT track
      var responseText = xhr.responseText;

      if (responseText.indexOf('WEBVTT') >= 0) {
        // make VTTCues from VTT track
        loadVttParser().then(function (VttParser) {
          var parser = new VttParser(window);
          vttCues = [];

          parser.oncue = function (cue) {
            vttCues.push(cue);
          };

          parser.onflush = function () {
            delete track.xhr;
            successHandler(vttCues);
          }; // Parse calls onflush internally


          parser.parse(responseText);
        }).catch(function (error) {
          delete track.xhr;
          errorHandler(Object(api_errors__WEBPACK_IMPORTED_MODULE_6__["convertToPlayerError"])(null, api_errors__WEBPACK_IMPORTED_MODULE_6__["ERROR_LOADING_CAPTIONS"], error));
        });
      } else {
        // make VTTCues from SRT track
        cues = Object(parsers_captions_srt__WEBPACK_IMPORTED_MODULE_4__["default"])(responseText);
        vttCues = convertToVTTCues(cues);
        delete track.xhr;
        successHandler(vttCues);
      }
    }
  } catch (error) {
    delete track.xhr;
    errorHandler(Object(api_errors__WEBPACK_IMPORTED_MODULE_6__["convertToPlayerError"])(null, api_errors__WEBPACK_IMPORTED_MODULE_6__["ERROR_LOADING_CAPTIONS"], error));
  }
}

function loadVttParser() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  return __webpack_require__.e(/*! require.ensure | vttparser */ "vttparser").then((function (require) {
    return __webpack_require__(/*! parsers/captions/vttparser */ "./src/js/parsers/captions/vttparser.js").default;
  }).bind(null, __webpack_require__)).catch(Object(_api_core_loader__WEBPACK_IMPORTED_MODULE_1__["chunkLoadWarningHandler"])(301131));
}

/***/ }),

/***/ "./src/js/parsers/captions/dfxp.ts":
/*!*****************************************!*\
  !*** ./src/js/parsers/captions/dfxp.ts ***!
  \*****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Dfxp; });
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");


function Dfxp(xmlDoc) {
  if (!xmlDoc) {
    parseError(306007);
  }

  var _captions = [];
  var paragraphs = xmlDoc.getElementsByTagName('p'); // Default frameRate is 30

  var frameRate = 30;
  var tt = xmlDoc.getElementsByTagName('tt');

  if (tt && tt[0]) {
    var parsedFrameRate = parseFloat(tt[0].getAttribute('ttp:frameRate') || '');

    if (!isNaN(parsedFrameRate)) {
      frameRate = parsedFrameRate;
    }
  }

  if (!paragraphs) {
    parseError(306005);
  }

  if (!paragraphs.length) {
    paragraphs = xmlDoc.getElementsByTagName('tt:p');

    if (!paragraphs.length) {
      paragraphs = xmlDoc.getElementsByTagName('tts:p');
    }
  }

  for (var i = 0; i < paragraphs.length; i++) {
    var p = paragraphs[i];
    var breaks = p.getElementsByTagName('br');

    for (var j = 0; j < breaks.length; j++) {
      var b = breaks[j];

      if (b && b.parentNode) {
        b.parentNode.replaceChild(xmlDoc.createTextNode('\r\n'), b);
      }
    }

    var rawText = p.innerHTML || p.textContent || p.text || '';
    var text = Object(utils_strings__WEBPACK_IMPORTED_MODULE_0__["trim"])(rawText).replace(/>\s+</g, '><').replace(/(<\/?)tts?:/g, '$1').replace(/<br.*?\/>/g, '\r\n');

    if (text) {
      var begin = p.getAttribute('begin') || '';
      var dur = p.getAttribute('dur') || '';
      var end = p.getAttribute('end') || '';
      var entry = {
        begin: Object(utils_strings__WEBPACK_IMPORTED_MODULE_0__["seconds"])(begin, frameRate),
        text: text
      };

      if (end) {
        entry.end = Object(utils_strings__WEBPACK_IMPORTED_MODULE_0__["seconds"])(end, frameRate);
      } else if (dur) {
        entry.end = (entry.begin || 0) + Object(utils_strings__WEBPACK_IMPORTED_MODULE_0__["seconds"])(dur, frameRate);
      }

      _captions.push(entry);
    }
  }

  if (!_captions.length) {
    parseError(306005);
  }

  return _captions;
}

function parseError(code) {
  throw new api_errors__WEBPACK_IMPORTED_MODULE_1__["PlayerError"](null, code);
}

/***/ }),

/***/ "./src/js/parsers/captions/srt.ts":
/*!****************************************!*\
  !*** ./src/js/parsers/captions/srt.ts ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Srt; });
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");

// Component that loads and parses an SRT file
function Srt(data) {
  // Trim whitespace and split the list by returns.
  var _captions = [];
  data = Object(utils_strings__WEBPACK_IMPORTED_MODULE_0__["trim"])(data);
  var list = data.split('\r\n\r\n');

  if (list.length === 1) {
    list = data.split('\n\n');
  }

  for (var i = 0; i < list.length; i++) {
    if (list[i] === 'WEBVTT') {
      continue;
    } // Parse each entry


    var entry = _entry(list[i]);

    if (entry.text) {
      _captions.push(entry);
    }
  }

  return _captions;
}
/* Parse a single captions entry. */

function _entry(data) {
  var entry = {};
  var array = data.split('\r\n');

  if (array.length === 1) {
    array = data.split('\n');
  }

  var idx = 1;

  if (array[0].indexOf(' --> ') > 0) {
    idx = 0;
  }

  if (array.length > idx + 1 && array[idx + 1]) {
    // This line contains the start and end.
    var line = array[idx];
    var index = line.indexOf(' --> ');

    if (index > 0) {
      entry.begin = Object(utils_strings__WEBPACK_IMPORTED_MODULE_0__["seconds"])(line.substr(0, index));
      entry.end = Object(utils_strings__WEBPACK_IMPORTED_MODULE_0__["seconds"])(line.substr(index + 5)); // Remaining lines contain the text

      entry.text = array.slice(idx + 1).join('\r\n');
    }
  }

  return entry;
}

/***/ }),

/***/ "./src/js/parsers/captions/vttcue.js":
/*!*******************************************!*\
  !*** ./src/js/parsers/captions/vttcue.js ***!
  \*******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * Copyright 2013 vtt.js Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/
var VTTCue = window.VTTCue;

function findDirectionSetting(value) {
  if (typeof value !== 'string') {
    return false;
  }

  var directionSetting = {
    '': true,
    lr: true,
    rl: true
  };
  var dir = directionSetting[value.toLowerCase()];
  return dir ? value.toLowerCase() : false;
}

function findAlignSetting(value) {
  if (typeof value !== 'string') {
    return false;
  }

  var alignSetting = {
    start: true,
    middle: true,
    end: true,
    left: true,
    right: true
  };
  var align = alignSetting[value.toLowerCase()];
  return align ? value.toLowerCase() : false;
}

if (!VTTCue) {
  var autoKeyword = 'auto';

  VTTCue = function VTTCue(startTime, endTime, text) {
    var cue = this;
    /**
     * Shim implementation specific properties. These properties are not in
     * the spec.
     */
    // Lets us know when the VTTCue's data has changed in such a way that we need
    // to recompute its display state. This lets us compute its display state
    // lazily.

    cue.hasBeenReset = false;
    /**
     * VTTCue and TextTrackCue properties
     * http://dev.w3.org/html5/webvtt/#vttcue-interface
     */

    var _id = '';
    var _pauseOnExit = false;
    var _startTime = startTime;
    var _endTime = endTime;
    var _text = text;
    var _region = null;
    var _vertical = '';
    var _snapToLines = true;
    var _line = autoKeyword;
    var _lineAlign = 'start';
    var _position = autoKeyword;
    var _size = 100;
    var _align = 'middle';
    Object.defineProperty(cue, 'id', {
      enumerable: true,
      get: function get() {
        return _id;
      },
      set: function set(value) {
        _id = '' + value;
      }
    });
    Object.defineProperty(cue, 'pauseOnExit', {
      enumerable: true,
      get: function get() {
        return _pauseOnExit;
      },
      set: function set(value) {
        _pauseOnExit = !!value;
      }
    });
    Object.defineProperty(cue, 'startTime', {
      enumerable: true,
      get: function get() {
        return _startTime;
      },
      set: function set(value) {
        if (typeof value !== 'number') {
          throw new TypeError('Start time must be set to a number.');
        }

        _startTime = value;
        this.hasBeenReset = true;
      }
    });
    Object.defineProperty(cue, 'endTime', {
      enumerable: true,
      get: function get() {
        return _endTime;
      },
      set: function set(value) {
        if (typeof value !== 'number') {
          throw new TypeError('End time must be set to a number.');
        }

        _endTime = value;
        this.hasBeenReset = true;
      }
    });
    Object.defineProperty(cue, 'text', {
      enumerable: true,
      get: function get() {
        return _text;
      },
      set: function set(value) {
        _text = '' + value;
        this.hasBeenReset = true;
      }
    });
    Object.defineProperty(cue, 'region', {
      enumerable: true,
      get: function get() {
        return _region;
      },
      set: function set(value) {
        _region = value;
        this.hasBeenReset = true;
      }
    });
    Object.defineProperty(cue, 'vertical', {
      enumerable: true,
      get: function get() {
        return _vertical;
      },
      set: function set(value) {
        var setting = findDirectionSetting(value); // Have to check for false because the setting an be an empty string.

        if (setting === false) {
          throw new SyntaxError('An invalid or illegal string was specified.');
        }

        _vertical = setting;
        this.hasBeenReset = true;
      }
    });
    Object.defineProperty(cue, 'snapToLines', {
      enumerable: true,
      get: function get() {
        return _snapToLines;
      },
      set: function set(value) {
        _snapToLines = !!value;
        this.hasBeenReset = true;
      }
    });
    Object.defineProperty(cue, 'line', {
      enumerable: true,
      get: function get() {
        return _line;
      },
      set: function set(value) {
        if (typeof value !== 'number' && value !== autoKeyword) {
          throw new SyntaxError('An invalid number or illegal string was specified.');
        }

        _line = value;
        this.hasBeenReset = true;
      }
    });
    Object.defineProperty(cue, 'lineAlign', {
      enumerable: true,
      get: function get() {
        return _lineAlign;
      },
      set: function set(value) {
        var setting = findAlignSetting(value);

        if (!setting) {
          throw new SyntaxError('An invalid or illegal string was specified.');
        }

        _lineAlign = setting;
        this.hasBeenReset = true;
      }
    });
    Object.defineProperty(cue, 'position', {
      enumerable: true,
      get: function get() {
        return _position;
      },
      set: function set(value) {
        if (value < 0 || value > 100) {
          throw new Error('Position must be between 0 and 100.');
        }

        _position = value;
        this.hasBeenReset = true;
      }
    });
    Object.defineProperty(cue, 'size', {
      enumerable: true,
      get: function get() {
        return _size;
      },
      set: function set(value) {
        if (value < 0 || value > 100) {
          throw new Error('Size must be between 0 and 100.');
        }

        _size = value;
        this.hasBeenReset = true;
      }
    });
    Object.defineProperty(cue, 'align', {
      enumerable: true,
      get: function get() {
        return _align;
      },
      set: function set(value) {
        var setting = findAlignSetting(value);

        if (!setting) {
          throw new SyntaxError('An invalid or illegal string was specified.');
        }

        _align = setting;
        this.hasBeenReset = true;
      }
    });
    /**
     * Other <track> spec defined properties
     */
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/the-video-element.html#text-track-cue-display-state

    cue.displayState = undefined;
  };
  /**
   * VTTCue methods
   */


  VTTCue.prototype.getCueAsHTML = function () {
    // Assume WebVTT.convertCueToDOMTree is on the global.
    var WebVTT = window.WebVTT;
    return WebVTT.convertCueToDOMTree(window, this.text);
  };
}

/* harmony default export */ __webpack_exports__["default"] = (VTTCue);

/***/ }),

/***/ "./src/js/providers/data-normalizer.ts":
/*!*********************************************!*\
  !*** ./src/js/providers/data-normalizer.ts ***!
  \*********************************************/
/*! exports provided: qualityLevel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "qualityLevel", function() { return qualityLevel; });
function qualityLevel(level) {
  return {
    bitrate: level.bitrate,
    label: level.label,
    width: level.width,
    height: level.height
  };
}

/***/ }),

/***/ "./src/js/providers/html5.ts":
/*!***********************************!*\
  !*** ./src/js/providers/html5.ts ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var providers_data_normalizer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! providers/data-normalizer */ "./src/js/providers/data-normalizer.ts");
/* harmony import */ var environment_environment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! environment/environment */ "./src/js/environment/environment.ts");
/* harmony import */ var providers_html5_android_hls__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! providers/html5-android-hls */ "./src/js/providers/html5-android-hls.ts");
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");
/* harmony import */ var providers_video_listener_mixin__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! providers/video-listener-mixin */ "./src/js/providers/video-listener-mixin.ts");
/* harmony import */ var providers_video_actions_mixin__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! providers/video-actions-mixin */ "./src/js/providers/video-actions-mixin.ts");
/* harmony import */ var providers_video_attached_mixin__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! providers/video-attached-mixin */ "./src/js/providers/video-attached-mixin.ts");
/* harmony import */ var providers_utils_stream_type__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! providers/utils/stream-type */ "./src/js/providers/utils/stream-type.ts");
/* harmony import */ var utils_css__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! utils/css */ "./src/js/utils/css.js");
/* harmony import */ var utils_dom__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! utils/dom */ "./src/js/utils/dom.js");
/* harmony import */ var providers_default__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! providers/default */ "./src/js/providers/default.ts");
/* harmony import */ var utils_backbone_events__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! utils/backbone.events */ "./src/js/utils/backbone.events.ts");
/* harmony import */ var providers_tracks_mixin__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! providers/tracks-mixin */ "./src/js/providers/tracks-mixin.ts");
/* harmony import */ var utils_time_ranges__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! utils/time-ranges */ "./src/js/utils/time-ranges.ts");
/* harmony import */ var providers_utils_play_promise__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! providers/utils/play-promise */ "./src/js/providers/utils/play-promise.ts");
/* harmony import */ var utils_date__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! utils/date */ "./src/js/utils/date.ts");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");





















/** @module */

/**
 @enum {ErrorCode} - The HTML5 media element encountered an error.
 */
var HTML5_BASE_MEDIA_ERROR = 224000;
/**
 @enum {ErrorCode} - The HTML5 media element's src was emptied or set to the page's location.
 */

var HTML5_SRC_RESET = 224005;
/**
 @enum {ErrorCode} - The HTML5 media element encountered a network error.
 */

var HTML5_NETWORK_ERROR = 221000;
/**
 @enum {ErrorCode} - The HTML5 media element encountered an error, resulting in an attempt to recover.
 */

var HTML5_BASE_WARNING = 324000;
var clearTimeout = window.clearTimeout;
var _name = 'html5';

var noop = function noop() {
  /* noop */
};

function _setupListeners(eventsHash, videoTag) {
  Object.keys(eventsHash).forEach(function (eventName) {
    videoTag.removeEventListener(eventName, eventsHash[eventName]);
    videoTag.addEventListener(eventName, eventsHash[eventName]);
  });
}

function _removeListeners(eventsHash, videoTag) {
  Object.keys(eventsHash).forEach(function (eventName) {
    videoTag.removeEventListener(eventName, eventsHash[eventName]);
  });
}

function VideoProvider(_playerId, _playerConfig, mediaElement) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  var _this = this; // Current media state


  _this.state = events_events__WEBPACK_IMPORTED_MODULE_4__["STATE_IDLE"]; // Are we buffering due to seek, or due to playback?

  _this.seeking = false; // Value of mediaElement.currentTime on last "timeupdate" used for decode error retry workaround

  _this.currentTime = -1; // Attempt to reload video on error

  _this.retries = 0;
  _this.maxRetries = 3;
  var loadAndParseHlsMetadata = _playerConfig.loadAndParseHlsMetadata,
      minDvrWindow = _playerConfig.minDvrWindow;
  _this.loadAndParseHlsMetadata = loadAndParseHlsMetadata === undefined ? true : !!loadAndParseHlsMetadata; // Always render natively in iOS and Safari, where HLS is supported.
  // Otherwise, use native rendering when set in the config for browsers that have adequate support.
  // FF, IE & Edge are excluded due to styling/positioning drawbacks.
  // The following issues need to be addressed before we enable native rendering in Edge:
  // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8120475/
  // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12079271/

  function renderNatively(configRenderNatively) {
    if (environment_environment__WEBPACK_IMPORTED_MODULE_2__["OS"].iOS || environment_environment__WEBPACK_IMPORTED_MODULE_2__["Browser"].safari) {
      return true;
    }

    return configRenderNatively && environment_environment__WEBPACK_IMPORTED_MODULE_2__["Browser"].chrome;
  }

  var MediaEvents = {
    progress: function progress() {
      providers_video_listener_mixin__WEBPACK_IMPORTED_MODULE_5__["default"].progress.call(_this);
      checkStaleStream();
    },
    timeupdate: function timeupdate() {
      if (_this.currentTime >= 0) {
        // Reset error retries after concurrent timeupdate events
        _this.retries = 0;
      }

      _this.currentTime = _videotag.currentTime; // Keep track of position before seek in iOS fullscreen

      if (_iosFullscreenState && _timeBeforeSeek !== _videotag.currentTime) {
        setTimeBeforeSeek(_videotag.currentTime);
      }

      providers_video_listener_mixin__WEBPACK_IMPORTED_MODULE_5__["default"].timeupdate.call(_this);
      checkStaleStream();

      if (environment_environment__WEBPACK_IMPORTED_MODULE_2__["Browser"].ie) {
        checkVisualQuality();
      }
    },
    resize: checkVisualQuality,
    ended: function ended() {
      _currentQuality = -1;
      clearTimeouts();
      providers_video_listener_mixin__WEBPACK_IMPORTED_MODULE_5__["default"].ended.call(_this);
    },
    loadedmetadata: function loadedmetadata() {
      var duration = _this.getDuration();

      if (_androidHls && duration === Infinity) {
        duration = 0;
      }

      var metadata = {
        metadataType: 'media',
        duration: duration,
        height: _videotag.videoHeight,
        width: _videotag.videoWidth,
        seekRange: _this.getSeekRange()
      };

      if (_this.fairplay) {
        metadata.drm = 'fairplay';
      }

      _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_META"], metadata);

      checkVisualQuality();
    },
    durationchange: function durationchange() {
      if (_androidHls) {
        return;
      }

      providers_video_listener_mixin__WEBPACK_IMPORTED_MODULE_5__["default"].progress.call(_this);
    },
    loadeddata: function loadeddata() {
      checkStartDateTime();

      _setAudioTracks(_videotag.audioTracks);

      _checkDelayedSeek(_this.getDuration());
    },
    canplay: function canplay() {
      _canSeek = true;

      if (!_androidHls) {
        _setMediaType();
      }

      checkVisualQuality();
      providers_video_listener_mixin__WEBPACK_IMPORTED_MODULE_5__["default"].canplay.call(_this);
    },
    seeking: function seeking() {
      var timeBeforeSeek = _timeBeforeSeek;
      var offset = _seekToTime !== null ? timeToPosition(_seekToTime) : _this.getCurrentTime();
      var position = timeToPosition(timeBeforeSeek);
      _timeBeforeSeek = _seekToTime;
      _seekToTime = null;
      _delayedSeek = 0;
      _this.seeking = true;

      _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_SEEK"], {
        position: position,
        offset: offset,
        duration: _this.getDuration(),
        currentTime: timeBeforeSeek,
        seekRange: _this.getSeekRange(),
        metadata: {
          currentTime: timeBeforeSeek
        }
      });
    },
    seeked: function seeked() {
      providers_video_listener_mixin__WEBPACK_IMPORTED_MODULE_5__["default"].seeked.call(_this);

      _this.ensureMetaTracksActive();
    },
    waiting: function waiting() {
      if (_this.seeking || _this.video.seeking) {
        _this.setState(events_events__WEBPACK_IMPORTED_MODULE_4__["STATE_LOADING"]);
      } else if (_this.state === events_events__WEBPACK_IMPORTED_MODULE_4__["STATE_PLAYING"]) {
        if (_this.atEdgeOfLiveStream()) {
          _this.setPlaybackRate(1);
        }

        _this.stallTime = _this.video.currentTime;

        _this.setState(events_events__WEBPACK_IMPORTED_MODULE_4__["STATE_STALLED"]);
      }
    },
    webkitbeginfullscreen: function webkitbeginfullscreen(e) {
      _iosFullscreenState = true;

      _sendFullscreen(e);
    },
    webkitendfullscreen: function webkitendfullscreen(e) {
      _iosFullscreenState = false;

      _sendFullscreen(e);
    },
    error: function error() {
      var video = _this.video;
      var error = video.error;
      var errorCode = error && error.code || -1;

      if ((errorCode === 3 || errorCode === 4) && _this.retries < _this.maxRetries) {
        // Workaround Safari bug https://bugs.webkit.org/show_bug.cgi?id=195452
        //  and stale manifests
        _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["WARNING"], new api_errors__WEBPACK_IMPORTED_MODULE_17__["PlayerError"](null, HTML5_BASE_WARNING + errorCode - 1, error));

        _this.retries++;

        _videotag.load();

        if (_this.currentTime !== -1) {
          _canSeek = false;

          _this.seek(_this.currentTime);

          _this.currentTime = -1;
        }

        return;
      }

      var code = HTML5_BASE_MEDIA_ERROR;
      var key = api_errors__WEBPACK_IMPORTED_MODULE_17__["MSG_CANT_PLAY_VIDEO"];

      if (errorCode === 1) {
        code += errorCode;
      } else if (errorCode === 2) {
        key = api_errors__WEBPACK_IMPORTED_MODULE_17__["MSG_BAD_CONNECTION"];
        code = HTML5_NETWORK_ERROR;
      } else if (errorCode === 3 || errorCode === 4) {
        code += errorCode - 1;

        if (errorCode === 4 && video.src === location.href) {
          code = HTML5_SRC_RESET;
        }
      } else {
        key = api_errors__WEBPACK_IMPORTED_MODULE_17__["MSG_TECHNICAL_ERROR"];
      }

      _clearVideotagSource();

      _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_ERROR"], new api_errors__WEBPACK_IMPORTED_MODULE_17__["PlayerError"](key, code, error));
    }
  };
  Object.keys(providers_video_listener_mixin__WEBPACK_IMPORTED_MODULE_5__["default"]).forEach(function (eventName) {
    if (!MediaEvents[eventName]) {
      var mixinEventHandler = providers_video_listener_mixin__WEBPACK_IMPORTED_MODULE_5__["default"][eventName];

      MediaEvents[eventName] = function (e) {
        mixinEventHandler.call(_this, e);
      };
    }
  });

  Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(this, utils_backbone_events__WEBPACK_IMPORTED_MODULE_12__["default"], providers_video_actions_mixin__WEBPACK_IMPORTED_MODULE_6__["default"], providers_video_attached_mixin__WEBPACK_IMPORTED_MODULE_7__["default"], providers_tracks_mixin__WEBPACK_IMPORTED_MODULE_13__["default"], {
    renderNatively: renderNatively(_playerConfig.renderCaptionsNatively),
    eventsOn_: function eventsOn_() {
      _setupListeners(MediaEvents, _videotag);
    },
    eventsOff_: function eventsOff_() {
      _removeListeners(MediaEvents, _videotag);
    },
    detachMedia: function detachMedia() {
      providers_video_attached_mixin__WEBPACK_IMPORTED_MODULE_7__["default"].detachMedia.call(_this);
      clearTimeouts(); // Stop listening to track changes so disabling the current track doesn't update the model

      this.removeTracksListener(_videotag.textTracks, 'change', this.textTrackChangeHandler);
      this.removeTracksListener(_videotag.textTracks, 'addtrack', this.addTrackHandler);

      if (this.videoLoad) {
        _videotag.load = this.videoLoad;
      } // Prevent sideloaded tracks from showing during ad playback


      if (_shouldToggleTrackOnDetach()) {
        this.disableTextTrack();
      }
    },
    attachMedia: function attachMedia() {
      providers_video_attached_mixin__WEBPACK_IMPORTED_MODULE_7__["default"].attachMedia.call(_this);
      _canSeek = false; // If we were mid-seek when detached, we want to allow it to resume

      this.seeking = false; // In case the video tag was modified while we shared it

      _videotag.loop = false; // override load so that it's not used to reset the video tag by external JavaScript (iOS ads)

      if (environment_environment__WEBPACK_IMPORTED_MODULE_2__["OS"].iOS && !this.videoLoad) {
        var videoLoad = this.videoLoad = _videotag.load;

        _videotag.load = function () {
          if (_videotag.src === location.href) {
            if (_currentQuality === -1) {
              _currentQuality = _pickInitialQuality(_levels);
            }

            _setVideotagSource(_levels[_currentQuality]);

            if (_this.state === events_events__WEBPACK_IMPORTED_MODULE_4__["STATE_PLAYING"]) {
              _videotag.play();
            }

            _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["WARNING"], new api_errors__WEBPACK_IMPORTED_MODULE_17__["PlayerError"](null, HTML5_BASE_WARNING + 5, new Error('video.load() was called after setting video.src to empty while playing video')));

            return;
          }

          return videoLoad.call(_videotag);
        };
      } // If there was a showing sideloaded track disabled in detached, re-enable it


      if (_shouldToggleTrackOnDetach()) {
        this.enableTextTrack();
      }

      if (this.renderNatively) {
        this.setTextTracks(this.video.textTracks);
      }

      this.addTracksListener(_videotag.textTracks, 'change', this.textTrackChangeHandler);
    },
    isLive: function isLive() {
      return _videotag.duration === Infinity;
    }
  });

  var _videotag = mediaElement; // wait for maria's quality level changes to merge

  var visualQuality = {
    level: {}
  }; // Prefer the config timeout, which is allowed to be 0 and null by default

  var _staleStreamDuration = _playerConfig.liveTimeout !== null ? _playerConfig.liveTimeout : 3 * 10 * 1000;

  var _canSeek = false; // true on valid time event

  var _delayedSeek = 0;
  var _seekToTime = null;
  var _timeBeforeSeek = null;

  var _levels;

  var _currentQuality = -1;

  var _iosFullscreenState = false;
  var _beforeResumeHandler = noop;
  var _audioTracks = null;

  var _currentAudioTrackIndex = -1;

  var _staleStreamTimeout = -1;

  var _stale = false;
  var _lastEndOfBuffer = null;
  var _androidHls = false;
  var dvrEnd = null;
  var dvrPosition = null;
  var dvrUpdatedTime = 0;
  this.video = _videotag;
  this.supportsPlaybackRate = true;
  this.startDateTime = 0;

  function checkVisualQuality() {
    var level = visualQuality.level;

    if (level.width !== _videotag.videoWidth || level.height !== _videotag.videoHeight) {
      // Exit if we're not certain that the stream is audio or the level is unknown
      if (!_videotag.videoWidth && !isAudioStream() || _currentQuality === -1) {
        return;
      }

      _this.ensureMetaTracksActive();

      level.width = _videotag.videoWidth;
      level.height = _videotag.videoHeight;

      _setMediaType();

      visualQuality.reason = visualQuality.reason || 'auto';
      var mode = _levels[_currentQuality].type === 'hls' ? 'auto' : 'manual';
      level.index = _currentQuality;
      level.label = _levels[_currentQuality].label;

      _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_VISUAL_QUALITY"], {
        reason: visualQuality.reason,
        mode: mode,
        bitrate: 0,
        level: {
          width: level.width,
          height: level.height,
          index: level.index,
          label: level.label
        }
      });

      visualQuality.reason = '';
    }
  }

  function checkStartDateTime() {
    var vtag = _videotag;

    if (vtag.getStartDate) {
      var startDate = vtag.getStartDate();
      var startDateTime = startDate.getTime ? startDate.getTime() : NaN;

      if (startDateTime !== _this.startDateTime && !isNaN(startDateTime)) {
        _this.setStartDateTime(startDateTime);
      }
    }
  }

  _this.setStartDateTime = function (startDateTime) {
    _this.startDateTime = startDateTime;
    var programDateTime = new Date(startDateTime).toISOString();

    var _this$getSeekRange = _this.getSeekRange(),
        start = _this$getSeekRange.start,
        end = _this$getSeekRange.end;

    start = Math.max(0, start);
    end = Math.max(start, end + 10);
    var metadataType = 'program-date-time';
    var metadata = {
      metadataType: metadataType,
      programDateTime: programDateTime,
      start: start,
      end: end
    };

    var cue = _this.createCue(start, end, JSON.stringify(metadata));

    _this.addVTTCue({
      type: 'metadata',
      cue: cue
    });
  };

  function setTimeBeforeSeek(currentTime) {
    _timeBeforeSeek = currentTime;
  }

  _this.getCurrentTime = function () {
    return getPosition(_videotag.currentTime);
  };

  function timeToPosition(currentTime) {
    var seekRange = _this.getSeekRange();

    if (_this.isLive() && Object(providers_utils_stream_type__WEBPACK_IMPORTED_MODULE_8__["isDvr"])(seekRange.end - seekRange.start, minDvrWindow)) {
      return Math.min(0, currentTime - seekRange.end);
    }

    return currentTime;
  }

  function getPosition(currentTime) {
    var seekRange = _this.getSeekRange();

    if (_this.isLive()) {
      var rangeUpdated = !dvrPosition || Math.abs(dvrEnd - seekRange.end) > 1;

      if (rangeUpdated) {
        updateDvrPosition(seekRange);

        _this.ensureMetaTracksActive();
      }

      if (Object(providers_utils_stream_type__WEBPACK_IMPORTED_MODULE_8__["isDvr"])(seekRange.end - seekRange.start, minDvrWindow)) {
        return dvrPosition;
      }
    }

    return currentTime;
  }

  function updateDvrPosition(seekRange) {
    dvrEnd = seekRange.end;
    dvrPosition = Math.min(0, _videotag.currentTime - dvrEnd);
    dvrUpdatedTime = Object(utils_date__WEBPACK_IMPORTED_MODULE_16__["now"])();
  }

  _this.getDuration = function () {
    var duration = _videotag.duration; // Don't sent time event on Android before real duration is known

    if (_androidHls && duration === Infinity && _videotag.currentTime === 0 || isNaN(duration)) {
      return 0;
    }

    var end = _getSeekableEnd();

    if (_this.isLive() && end) {
      var seekableDuration = end - _getSeekableStart();

      if (Object(providers_utils_stream_type__WEBPACK_IMPORTED_MODULE_8__["isDvr"])(seekableDuration, minDvrWindow)) {
        // Player interprets negative duration as DVR
        duration = -seekableDuration;
      }
    }

    return duration;
  };

  _this.getSeekRange = function () {
    var seekRange = {
      start: 0,
      end: 0
    };
    var seekable = _videotag.seekable;

    if (seekable.length) {
      seekRange.end = _getSeekableEnd();
      seekRange.start = _getSeekableStart();
    } else if (Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isFinite"])(_videotag.duration)) {
      seekRange.end = _videotag.duration;
    }

    return seekRange;
  };

  _this.getLiveLatency = function () {
    var latency = null;

    var end = _getSeekableEnd();

    if (_this.isLive() && end) {
      latency = end + (Object(utils_date__WEBPACK_IMPORTED_MODULE_16__["now"])() - dvrUpdatedTime) / 1000 - _videotag.currentTime;
    }

    return latency;
  };

  function _checkDelayedSeek(duration) {
    // Don't seek when _delayedSeek is set to -1 in _completeLoad
    if (_delayedSeek && _delayedSeek !== -1 && duration && duration !== Infinity) {
      _this.seek(_delayedSeek);
    }
  } // Wait for quality levels work to merge


  function _getPublicLevels(levels) {
    var publicLevels;

    if (Array.isArray(levels) && levels.length > 0) {
      publicLevels = levels.map(function (level, i) {
        return {
          label: level.label || i
        };
      });
    }

    return publicLevels;
  }

  function setPlaylistItem(item) {
    _this.currentTime = -1;
    minDvrWindow = item.minDvrWindow;
    _levels = item.sources;
    _currentQuality = _pickInitialQuality(_levels);
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

  function _play() {
    var resumingPlayback = _videotag.paused && _videotag.played && _videotag.played.length;

    if (resumingPlayback && _this.isLive() && !Object(providers_utils_stream_type__WEBPACK_IMPORTED_MODULE_8__["isDvr"])(_getSeekableEnd() - _getSeekableStart(), minDvrWindow)) {
      _this.clearTracks();

      _videotag.load();
    }

    return _videotag.play() || Object(providers_utils_play_promise__WEBPACK_IMPORTED_MODULE_15__["default"])(_videotag);
  }

  function _completeLoad(startTime) {
    _this.currentTime = -1;
    _delayedSeek = 0;
    clearTimeouts();
    var previousSource = _videotag.src;
    var sourceElement = document.createElement('source');
    sourceElement.src = _levels[_currentQuality].file;
    var sourceChanged = sourceElement.src !== previousSource;

    if (sourceChanged) {
      _setVideotagSource(_levels[_currentQuality]); // Do not call load if src was not set. load() will cancel any active play promise.


      if (previousSource) {
        _videotag.load();
      }
    } else if (startTime === 0 && _videotag.currentTime > 0) {
      // Load event is from the same video as before
      // restart video without dispatching seek event
      _delayedSeek = -1;

      _this.seek(startTime);
    } // Check if we have already seeked the mediaElement before _completeLoad has been called


    if (startTime > 0 && _videotag.currentTime !== startTime) {
      _this.seek(startTime);
    }

    var publicLevels = _getPublicLevels(_levels);

    if (publicLevels) {
      _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_LEVELS"], {
        levels: publicLevels,
        currentQuality: _currentQuality
      });
    }

    if (_levels.length && _levels[0].type !== 'hls') {
      _setMediaType();
    }
  } // Safari has a bug where our disable of an embedded rendered track causes
  //  the track to not display when we re-attach the media. We can avoid this
  //  by only disabling the track if sideloaded in safari


  function _shouldToggleTrackOnDetach() {
    if (!environment_environment__WEBPACK_IMPORTED_MODULE_2__["Browser"].safari) {
      return true;
    }

    var track = _this.getCurrentTextTrack();

    return track && track.sideloaded;
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
    var sourceChanged = _videotag.src !== sourceElement.src;

    if (sourceChanged) {
      _videotag.src = source.file;
    }
  }

  function _clearVideotagSource() {
    if (_videotag) {
      _this.disableTextTrack();

      _videotag.removeAttribute('preload');

      _videotag.removeAttribute('src');

      Object(utils_dom__WEBPACK_IMPORTED_MODULE_10__["emptyElement"])(_videotag);
      Object(utils_css__WEBPACK_IMPORTED_MODULE_9__["style"])(_videotag, {
        objectFit: ''
      });
      _currentQuality = -1; // Don't call load in iE9/10

      if (!environment_environment__WEBPACK_IMPORTED_MODULE_2__["Browser"].msie && 'load' in _videotag) {
        _videotag.load();
      }
    }
  }

  function _getSeekableStart() {
    var start = Infinity;
    ['buffered', 'seekable'].forEach(function (range) {
      var timeRange = _videotag[range];
      var index = timeRange ? timeRange.length : 0;

      while (index--) {
        var rangeStart = Math.min(start, timeRange.start(index));

        if (Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isFinite"])(rangeStart)) {
          start = rangeStart;
        }
      }
    });
    return start;
  }

  function _getSeekableEnd() {
    var end = 0;
    ['buffered', 'seekable'].forEach(function (range) {
      var timeRange = _videotag[range];
      var index = timeRange ? timeRange.length : 0;

      while (index--) {
        var rangeEnd = Math.max(end, timeRange.end(index));

        if (Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isFinite"])(rangeEnd)) {
          end = rangeEnd;
        }
      }
    });
    return end;
  }

  this.stop = function () {
    clearTimeouts();

    _clearVideotagSource();

    this.clearTracks(); // IE/Edge continue to play a video after changing video.src and calling video.load()
    // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/5383483/ (not fixed in Edge 14)

    if (environment_environment__WEBPACK_IMPORTED_MODULE_2__["Browser"].ie) {
      _videotag.pause();
    }

    this.setState(events_events__WEBPACK_IMPORTED_MODULE_4__["STATE_IDLE"]);
  };

  this.destroy = function () {
    var addTrackHandler = _this.addTrackHandler,
        cueChangeHandler = _this.cueChangeHandler,
        textTrackChangeHandler = _this.textTrackChangeHandler;
    var textTracks = _videotag.textTracks;

    _this.off();

    if (_this.videoLoad) {
      _videotag.load = _this.videoLoad;
    }

    _beforeResumeHandler = noop;

    _removeListeners(MediaEvents, _videotag);

    _this.removeTracksListener(_videotag.audioTracks, 'change', _audioTrackChangeHandler);

    _this.removeTracksListener(textTracks, 'change', textTrackChangeHandler);

    _this.removeTracksListener(textTracks, 'addtrack', addTrackHandler);

    if (cueChangeHandler) {
      for (var i = 0, len = textTracks.length; i < len; i++) {
        textTracks[i].removeEventListener('cuechange', cueChangeHandler);
      }
    }
  };

  this.init = function (item) {
    _this.retries = 0;
    _this.maxRetries = item.adType ? 0 : 3;
    setPlaylistItem(item);
    var source = _levels[_currentQuality];
    _androidHls = Object(providers_html5_android_hls__WEBPACK_IMPORTED_MODULE_3__["isAndroidHls"])(source);

    if (_androidHls) {
      // Playback rate is broken on Android HLS
      _this.supportsPlaybackRate = false; // Android HLS doesnt update its times correctly so it always falls in here.  Do not allow it to stall.

      MediaEvents.waiting = noop;
    }

    _this.eventsOn_(); // the loadeddata event determines the mediaType for HLS sources


    if (_levels.length && _levels[0].type !== 'hls') {
      this.sendMediaType(_levels);
    }

    visualQuality.reason = '';
  };

  this.preload = function (item) {
    setPlaylistItem(item);
    var source = _levels[_currentQuality];
    var preload = source.preload || 'metadata';

    if (preload !== 'none') {
      _videotag.setAttribute('preload', preload);

      _setVideotagSource(source);
    }
  };

  this.load = function (item) {
    setPlaylistItem(item);

    _completeLoad(item.starttime);

    this.setupSideloadedTracks(item.tracks);
  };

  this.play = function () {
    _beforeResumeHandler();

    return _play();
  };

  this.pause = function () {
    clearTimeouts();

    _beforeResumeHandler = function _beforeResumeHandler() {
      var unpausing = _videotag.paused && _videotag.currentTime;

      if (unpausing && _this.isLive()) {
        var end = _getSeekableEnd();

        var seekableDuration = end - _getSeekableStart();

        var isLiveNotDvr = !Object(providers_utils_stream_type__WEBPACK_IMPORTED_MODULE_8__["isDvr"])(seekableDuration, minDvrWindow);
        var behindLiveEdge = end - _videotag.currentTime;

        if (isLiveNotDvr && end && (behindLiveEdge > 15 || behindLiveEdge < 0)) {
          // resume playback at edge of live stream
          _seekToTime = Math.max(end - 10, end - seekableDuration);

          if (!Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isFinite"])(_seekToTime)) {
            return;
          }

          setTimeBeforeSeek(_videotag.currentTime);
          _videotag.currentTime = _seekToTime;
        }
      }
    };

    _videotag.pause();
  };

  this.seek = function (seekToPosition) {
    var seekRange = _this.getSeekRange();

    var seekToTime = seekToPosition;

    if (seekToPosition < 0) {
      seekToTime += seekRange.end;
    }

    if (!_canSeek) {
      _canSeek = !!_getSeekableEnd();
    }

    if (_canSeek) {
      _delayedSeek = 0; // setting currentTime can throw an invalid DOM state exception if the video is not ready

      try {
        _this.seeking = true;

        if (_this.isLive() && Object(providers_utils_stream_type__WEBPACK_IMPORTED_MODULE_8__["isDvr"])(seekRange.end - seekRange.start, minDvrWindow)) {
          dvrPosition = Math.min(0, seekToTime - dvrEnd);

          if (seekToPosition < 0) {
            var timeSinceUpdate = Math.min(12, (Object(utils_date__WEBPACK_IMPORTED_MODULE_16__["now"])() - dvrUpdatedTime) / 1000);
            seekToTime += timeSinceUpdate;
          }
        }

        _seekToTime = seekToTime;
        setTimeBeforeSeek(_videotag.currentTime);
        _videotag.currentTime = seekToTime;
      } catch (e) {
        _this.seeking = false;
        _delayedSeek = seekToTime;
      }
    } else {
      _delayedSeek = seekToTime; // Firefox isn't firing canplay event when in a paused state
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1194624

      if (environment_environment__WEBPACK_IMPORTED_MODULE_2__["Browser"].firefox && _videotag.paused) {
        _play();
      }
    }
  };

  function _audioTrackChangeHandler() {
    var _selectedAudioTrackIndex = -1;

    var tracks = _videotag.audioTracks;

    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].enabled) {
        _selectedAudioTrackIndex = i;
        break;
      }
    }

    _setCurrentAudioTrack(_selectedAudioTrackIndex);
  }

  function _sendFullscreen(e) {
    _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["NATIVE_FULLSCREEN"], {
      target: e.target,
      jwstate: _iosFullscreenState
    });
  }

  this.setVisibility = function (state) {
    state = !!state;

    if (state || environment_environment__WEBPACK_IMPORTED_MODULE_2__["OS"].android) {
      // Changing visibility to hidden on Android < 4.2 causes
      // the pause event to be fired. This causes audio files to
      // become unplayable. Hence the video tag is always kept
      // visible on Android devices.
      Object(utils_css__WEBPACK_IMPORTED_MODULE_9__["style"])(_this.container, {
        visibility: 'visible',
        opacity: 1
      });
    } else {
      Object(utils_css__WEBPACK_IMPORTED_MODULE_9__["style"])(_this.container, {
        visibility: '',
        opacity: 0
      });
    }
  };

  this.setFullscreen = function (state) {
    state = !!state; // This implementation is for iOS and Android WebKit only
    // This won't get called if the player container can go fullscreen

    if (state) {
      try {
        var enterFullscreen = _videotag.webkitEnterFullscreen || _videotag.webkitEnterFullScreen;

        if (enterFullscreen) {
          enterFullscreen.apply(_videotag);
        }
      } catch (error) {
        // object can't go fullscreen
        return false;
      }

      return _this.getFullscreen();
    }

    var exitFullscreen = _videotag.webkitExitFullscreen || _videotag.webkitExitFullScreen;

    if (exitFullscreen) {
      exitFullscreen.apply(_videotag);
    }

    return state;
  };

  _this.getFullscreen = function () {
    return _iosFullscreenState || !!_videotag.webkitDisplayingFullscreen;
  };

  this.setCurrentQuality = function (quality) {
    if (_currentQuality === quality) {
      return;
    }

    if (quality >= 0) {
      if (_levels && _levels.length > quality) {
        _currentQuality = quality;
        visualQuality.reason = 'api';
        visualQuality.level = {};
        this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_LEVEL_CHANGED"], {
          currentQuality: quality,
          levels: _getPublicLevels(_levels)
        }); // The playerConfig is not updated automatically, because it is a clone
        // from when the provider was first initialized

        _playerConfig.qualityLabel = _levels[quality].label;

        _completeLoad(_videotag.currentTime || 0);

        _play();
      }
    }
  };

  this.setPlaybackRate = function (playbackRate) {
    // Set defaultPlaybackRate so that we do not send ratechange events when setting src
    _videotag.playbackRate = _videotag.defaultPlaybackRate = playbackRate;
  };

  this.getPlaybackRate = function () {
    return _videotag.playbackRate;
  };

  this.getCurrentQuality = function () {
    return _currentQuality;
  };

  this.getQualityLevels = function () {
    if (Array.isArray(_levels)) {
      return _levels.map(function (level) {
        return Object(providers_data_normalizer__WEBPACK_IMPORTED_MODULE_1__["qualityLevel"])(level);
      });
    }

    return [];
  };

  this.getName = function () {
    return {
      name: _name
    };
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

      _audioTracks = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["map"])(tracks, function (track) {
        var _track = {
          name: track.label || track.language,
          language: track.language
        };
        return _track;
      });
    }

    _this.addTracksListener(tracks, 'change', _audioTrackChangeHandler);

    if (_audioTracks) {
      _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["AUDIO_TRACKS"], {
        currentTrack: _currentAudioTrackIndex,
        tracks: _audioTracks
      });
    }
  }

  function _setCurrentAudioTrack(index) {
    if (_videotag && _videotag.audioTracks && _audioTracks && index > -1 && index < _videotag.audioTracks.length && index !== _currentAudioTrackIndex) {
      _videotag.audioTracks[_currentAudioTrackIndex].enabled = false;
      _currentAudioTrackIndex = index;
      _videotag.audioTracks[_currentAudioTrackIndex].enabled = true;

      _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["AUDIO_TRACK_CHANGED"], {
        currentTrack: _currentAudioTrackIndex,
        tracks: _audioTracks
      });
    }
  }

  function _getAudioTracks() {
    return _audioTracks || [];
  }

  function _getCurrentAudioTrack() {
    return _currentAudioTrackIndex;
  }

  function isAudioStream() {
    if (_videotag.readyState < 2) {
      return;
    }

    return _videotag.videoHeight === 0;
  }

  function _setMediaType() {
    var isAudio = isAudioStream();

    if (typeof isAudio !== 'undefined') {
      var mediaType = isAudio ? 'audio' : 'video';

      _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_TYPE"], {
        mediaType: mediaType
      });
    }
  } // If we're live and the buffer end has remained the same for some time, mark the stream as stale and check if the stream is over


  function checkStaleStream() {
    // Never kill a stale live stream if the timeout was configured to 0
    if (_staleStreamDuration === 0) {
      return;
    }

    var endOfBuffer = Object(utils_time_ranges__WEBPACK_IMPORTED_MODULE_14__["default"])(_videotag.buffered);

    var live = _this.isLive(); // Don't end if we have noting buffered yet, or cannot get any information about the buffer


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
      _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_ERROR"], new api_errors__WEBPACK_IMPORTED_MODULE_17__["PlayerError"](api_errors__WEBPACK_IMPORTED_MODULE_17__["MSG_LIVE_STREAM_DOWN"], HTML5_ERROR_LIVE_STREAM_DOWN_OR_ENDED));

      return true;
    }

    return false;
  }

  function clearTimeouts() {
    clearTimeout(_staleStreamTimeout);
    _staleStreamTimeout = -1;
  }
}

Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(VideoProvider.prototype, providers_default__WEBPACK_IMPORTED_MODULE_11__["default"]);

VideoProvider.getName = function () {
  return {
    name: 'html5'
  };
};

/* harmony default export */ __webpack_exports__["default"] = (VideoProvider);
/**
 *
 @enum {ErrorCode} - The HTML5 live stream is down or has ended.
 */

var HTML5_ERROR_LIVE_STREAM_DOWN_OR_ENDED = 220001;

/***/ }),

/***/ "./src/js/providers/tracks-mixin.ts":
/*!******************************************!*\
  !*** ./src/js/providers/tracks-mixin.ts ***!
  \******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var controller_tracks_loader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! controller/tracks-loader */ "./src/js/controller/tracks-loader.ts");
/* harmony import */ var controller_tracks_helper__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! controller/tracks-helper */ "./src/js/controller/tracks-helper.ts");
/* harmony import */ var providers_utils_id3Parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! providers/utils/id3Parser */ "./src/js/providers/utils/id3Parser.js");
/* harmony import */ var environment_environment__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! environment/environment */ "./src/js/environment/environment.ts");
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");






var Tracks = {
  _itemTracks: null,
  _textTracks: null,
  _currentTextTrackIndex: -1,
  _tracksById: null,
  _cuesByTrackId: null,
  _cachedVTTCues: null,
  _metaCuesByTextTime: null,
  _unknownCount: 0,
  _activeCues: null,
  _cues: null,
  textTrackChangeHandler: null,
  addTrackHandler: null,
  cueChangeHandler: null,
  renderNatively: false,
  _initTextTracks: function _initTextTracks() {
    this._textTracks = [];
    this._tracksById = {};
    this._metaCuesByTextTime = {};
    this._cuesByTrackId = {};
    this._cachedVTTCues = {};
    this._cues = {};
    this._activeCues = {};
    this._unknownCount = 0;
  },
  addTracksListener: function addTracksListener(tracks, eventType, handler) {
    if (!tracks) {
      return;
    } // Always remove existing listener


    this.removeTracksListener(tracks, eventType, handler);

    if (this.instreamMode) {
      return;
    }

    if (tracks.addEventListener) {
      tracks.addEventListener(eventType, handler);
    } else {
      tracks['on' + eventType] = handler;
    }
  },
  removeTracksListener: function removeTracksListener(tracks, eventType, handler) {
    if (!tracks) {
      return;
    }

    if (tracks.removeEventListener && handler) {
      tracks.removeEventListener(eventType, handler);
    } else {
      tracks['on' + eventType] = null;
    }
  },
  clearTracks: function clearTracks() {
    var _this = this;

    Object(controller_tracks_loader__WEBPACK_IMPORTED_MODULE_0__["cancelXhr"])(this._itemTracks);
    var _tracksById = this._tracksById;

    if (_tracksById) {
      Object.keys(_tracksById).forEach(function (trackId) {
        if (trackId.indexOf('nativemetadata') === 0) {
          var metadataTrack = _tracksById[trackId];

          if (_this.cueChangeHandler) {
            metadataTrack.removeEventListener('cuechange', _this.cueChangeHandler);
          }

          _removeCues(_this.renderNatively, [metadataTrack], true);
        }
      });
    }

    this._itemTracks = null;
    this._textTracks = null;
    this._tracksById = null;
    this._cuesByTrackId = null;
    this._metaCuesByTextTime = null;
    this._unknownCount = 0;
    this._currentTextTrackIndex = -1;
    this._activeCues = {};
    this._cues = {};

    if (this.renderNatively) {
      var _tracks = this.video.textTracks;

      if (this.textTrackChangeHandler) {
        // Removing listener first to ensure that removing cues does not trigger it unnecessarily
        this.removeTracksListener(_tracks, 'change', this.textTrackChangeHandler);
      }

      _removeCues(this.renderNatively, _tracks, true);
    }
  },
  clearMetaCues: function clearMetaCues() {
    var _this2 = this;

    var _tracksById = this._tracksById,
        _cachedVTTCues = this._cachedVTTCues;

    if (_tracksById && _cachedVTTCues) {
      Object.keys(_tracksById).forEach(function (trackId) {
        if (trackId.indexOf('nativemetadata') === 0) {
          var metadataTrack = _tracksById[trackId];

          _removeCues(_this2.renderNatively, [metadataTrack], false);

          metadataTrack.mode = 'hidden';
          metadataTrack.inuse = true;

          if (metadataTrack._id) {
            _cachedVTTCues[metadataTrack._id] = {};
          }
        }
      });
    }
  },
  clearCueData: function clearCueData(trackId) {
    // Clear track cues to prevent duplicates
    var _cachedVTTCues = this._cachedVTTCues;

    if (_cachedVTTCues && _cachedVTTCues[trackId]) {
      _cachedVTTCues[trackId] = {};

      if (this._tracksById) {
        this._tracksById[trackId].data = [];
      }
    }
  },
  disableTextTrack: function disableTextTrack() {
    var track = this.getCurrentTextTrack();

    if (track) {
      // FF does not remove the active cue from the dom when the track is hidden, so we must disable it
      track.mode = 'disabled'; // IOS native captions does not remove the active cue from the dom when the track is disabled, so we must hide it

      var _trackId = track._id;

      if (_trackId && isNativeCaptionsOrSubtitles(_trackId) || this.renderNatively && environment_environment__WEBPACK_IMPORTED_MODULE_3__["OS"].iOS) {
        track.mode = 'hidden';
      }
    }
  },
  enableTextTrack: function enableTextTrack() {
    var track = this.getCurrentTextTrack();

    if (track) {
      track.mode = 'showing';
    }
  },
  getCurrentTextTrack: function getCurrentTextTrack() {
    if (this._textTracks) {
      return this._textTracks[this._currentTextTrackIndex];
    }
  },
  getSubtitlesTrack: function getSubtitlesTrack() {
    return this._currentTextTrackIndex;
  },
  addTextTracks: function addTextTracks(tracksArray) {
    var _this3 = this;

    var textTracks = [];

    if (!tracksArray) {
      return textTracks;
    }

    if (!this._textTracks) {
      this._initTextTracks();
    }

    tracksArray.forEach(function (itemTrack) {
      // only add valid and supported kinds https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
      if (itemTrack.includedInManifest || itemTrack.kind && !isCaptionsOrSubtitles(itemTrack.kind)) {
        return;
      }

      var textTrackAny = _this3._createTrack(itemTrack);

      _this3._addTrackToList(textTrackAny);

      textTracks.push(textTrackAny);

      if (itemTrack.file) {
        itemTrack.data = [];
        Object(controller_tracks_loader__WEBPACK_IMPORTED_MODULE_0__["loadFile"])(itemTrack, function (vttCues) {
          textTrackAny.sideloaded = true;

          _this3.addVTTCuesToTrack(textTrackAny, vttCues);
        }, function (error) {
          _this3.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["WARNING"], error);
        });
      }
    });

    if (this._textTracks && this._textTracks.length) {
      this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["SUBTITLES_TRACKS"], {
        tracks: this._textTracks
      });
    }

    return textTracks;
  },
  setTextTracks: function setTextTracks(tracks) {
    var _this4 = this;

    this._currentTextTrackIndex = -1;

    if (!tracks) {
      return;
    }

    if (!this._textTracks) {
      this._initTextTracks();
    } else {
      var _tracksById = this._tracksById;
      this._activeCues = {};
      this._cues = {}; // Remove the 608 captions track that was mutated by the browser

      this._unknownCount = 0;
      this._textTracks = this._textTracks.filter(function (track) {
        var trackId = track._id;

        if (_this4.renderNatively && trackId && isNativeCaptionsOrSubtitles(trackId)) {
          delete _tracksById[trackId];
          return false;
        } else if (track.name && track.name.indexOf('Unknown') === 0) {
          _this4._unknownCount++;
        }

        if (trackId.indexOf('nativemetadata') === 0 && track.inBandMetadataTrackDispatchType === 'com.apple.streaming') {
          // Remove the ID3 track from the cache
          delete _tracksById[trackId];
        }

        return true;
      }, this);
    } // filter for 'subtitles' or 'captions' tracks


    if (tracks.length) {
      var i = 0;
      var len = tracks.length;
      var _tracksById2 = this._tracksById;
      var _cuesByTrackId = this._cuesByTrackId;

      for (i; i < len; i++) {
        var _track = tracks[i];

        var _trackId2 = _track._id || '';

        if (!_trackId2) {
          if (_track.inuse === false && isCaptionsOrSubtitles(_track.kind) && this.renderNatively) {
            // ignore native captions tracks from previous items that no longer can be re-used
            _track._id = 'native' + _track.kind + i;
            continue;
          }

          if (isCaptionsOrSubtitles(_track.kind) || _track.kind === 'metadata') {
            _trackId2 = _track._id = 'native' + _track.kind + i;

            if (!_track.label && _track.kind === 'captions') {
              // track label is read only in Safari
              // 'captions' tracks without a label need a name in order for the cc menu to work
              var labelInfo = Object(controller_tracks_helper__WEBPACK_IMPORTED_MODULE_1__["createLabel"])(_track, this._unknownCount);
              _track.name = labelInfo.label;
              this._unknownCount = labelInfo.unknownCount;
            }
          } else {
            _trackId2 = _track._id = Object(controller_tracks_helper__WEBPACK_IMPORTED_MODULE_1__["createId"])(_track, this._textTracks ? this._textTracks.length : 0);
          }

          if (_tracksById2[_trackId2]) {
            // tracks without unique ids must not be marked as "inuse"
            continue;
          }

          _track.inuse = true;
        }

        if (!_track.inuse || _tracksById2[_trackId2]) {
          continue;
        } // setup TextTrack


        if (_track.kind === 'metadata') {
          // track mode needs to be "hidden", not "showing", so that cues don't display as captions in Firefox
          _track.mode = 'hidden';

          var _handler = this.cueChangeHandler = this.cueChangeHandler || cueChangeHandler.bind(this);

          _track.removeEventListener('cuechange', _handler);

          _track.addEventListener('cuechange', _handler);

          _tracksById2[_trackId2] = _track;
        } else if (isCaptionsOrSubtitles(_track.kind)) {
          var mode = _track.mode;
          var cue = void 0; // By setting the track mode to 'hidden', we can determine if the track has cues

          _track.mode = 'hidden';

          if ((!_track.cues || !_track.cues.length) && _track.embedded) {
            // There's no method to remove tracks added via: video.addTextTrack.
            // This ensures the 608 captions track isn't added to the CC menu until it has cues
            continue;
          }

          if (mode !== 'disabled' || isNativeCaptionsOrSubtitles(_trackId2)) {
            _track.mode = mode;
          } // Parsed cues may not have been added to this track yet


          if (_cuesByTrackId[_trackId2] && !_cuesByTrackId[_trackId2].loaded) {
            var _cues2 = _cuesByTrackId[_trackId2].cues;

            while (cue = _cues2.shift()) {
              _addCueToTrack(this.renderNatively, _track, cue);
            }

            _track.mode = mode;
            _cuesByTrackId[_trackId2].loaded = true;
          }

          this._addTrackToList(_track);
        }
      }
    }

    if (this.renderNatively) {
      this.addTrackListeners(tracks);
    }

    if (this._textTracks && this._textTracks.length) {
      this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["SUBTITLES_TRACKS"], {
        tracks: this._textTracks
      });
    }
  },
  addTrackListeners: function addTrackListeners(tracks) {
    // Only bind and set this.textTrackChangeHandler once so that removeEventListener works
    var handler = this.textTrackChangeHandler = this.textTrackChangeHandler || textTrackChangeHandler.bind(this);
    this.removeTracksListener(tracks, 'change', handler);
    this.addTracksListener(tracks, 'change', handler);

    if (environment_environment__WEBPACK_IMPORTED_MODULE_3__["Browser"].edge || environment_environment__WEBPACK_IMPORTED_MODULE_3__["Browser"].firefox) {
      // Listen for TextTracks added to the videotag after the onloadeddata event in Edge and Firefox,
      // NOT Safari! Handling this event in Safari 12 and lower results in captions not rendering after
      // instream or live restart (JW8-10815, JW8-11006)
      handler = this.addTrackHandler = this.addTrackHandler || addTrackHandler.bind(this);
      this.removeTracksListener(tracks, 'addtrack', handler);
      this.addTracksListener(tracks, 'addtrack', handler);
    }
  },
  setupSideloadedTracks: function setupSideloadedTracks(itemTracks) {
    // Add tracks if we're starting playback or resuming after a midroll
    if (!this.renderNatively) {
      return;
    } // Determine if the tracks are the same and the embedded + sideloaded count = # of tracks in the controlbar


    itemTracks = itemTracks || null;
    var alreadyLoaded = itemTracks === this._itemTracks;

    if (!alreadyLoaded) {
      Object(controller_tracks_loader__WEBPACK_IMPORTED_MODULE_0__["cancelXhr"])(this._itemTracks);
    }

    this._itemTracks = itemTracks;

    if (!itemTracks) {
      return;
    }

    if (!alreadyLoaded) {
      this.disableTextTrack();

      this._clearSideloadedTextTracks();

      this.addTextTracks(itemTracks);
    }
  },
  setSubtitlesTrack: function setSubtitlesTrack(menuIndex) {
    if (!this.renderNatively) {
      if (this.setCurrentSubtitleTrack) {
        this.setCurrentSubtitleTrack(menuIndex - 1);
      }

      return;
    }

    if (!this._textTracks) {
      return;
    } // 0 = 'Off'


    if (menuIndex === 0) {
      this._textTracks.forEach(function (track) {
        track.mode = track.embedded ? 'hidden' : 'disabled';
      });
    } // Track index is 1 less than controlbar index to account for 'Off' = 0.
    // Prevent unnecessary track change events


    if (this._currentTextTrackIndex === menuIndex - 1) {
      return;
    } // Turn off current track


    this.disableTextTrack(); // Set the provider's index to the model's index, then show the selected track if it exists

    this._currentTextTrackIndex = menuIndex - 1;
    var track = this.getCurrentTextTrack();

    if (track) {
      track.mode = 'showing';
    } // Update the model index since the track change may have come from a browser event


    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["SUBTITLES_TRACK_CHANGED"], {
      currentTrack: this._currentTextTrackIndex + 1,
      tracks: this._textTracks
    });
  },
  createCue: function createCue(start, end, content) {
    var MetaCue = window.VTTCue || window.TextTrackCue; // Set a minimum duration for the cue
    // VTTCues must have a duration for "cuechange" to be dispatched

    var cueEnd = Math.max(end || 0, start + 0.25);
    return new MetaCue(start, cueEnd, content);
  },
  addVTTCue: function addVTTCue(cueData, cacheKey) {
    if (!this._tracksById) {
      this._initTextTracks();
    }

    var trackId = cueData.track ? cueData.track : 'native' + cueData.type;
    var track = this._tracksById[trackId];
    var label = cueData.type === 'captions' ? 'Unknown CC' : 'ID3 Metadata';
    var vttCue = cueData.cue;

    if (!track) {
      var _itemTrack = {
        kind: cueData.type,
        _id: trackId,
        label: label,
        'default': false
      };

      if (this.renderNatively || _itemTrack.kind === 'metadata') {
        track = this._createTrack(_itemTrack);
        track.embedded = true;
        this.setTextTracks(this.video.textTracks);
      } else {
        track = this.addTextTracks([_itemTrack])[0];
      }
    }

    if (this._cacheVTTCue(track, vttCue, cacheKey)) {
      var useTrackCueHelper = this.renderNatively || track.kind === 'metadata';

      if (useTrackCueHelper) {
        _addCueToTrack(useTrackCueHelper, track, vttCue);
      } else {
        track.data.push(vttCue);
      }

      return vttCue;
    }

    return null;
  },
  addVTTCuesToTrack: function addVTTCuesToTrack(track, vttCues) {
    if (!this.renderNatively) {
      return;
    }

    var trackId = track._id;
    var _tracksById = this._tracksById;
    var _cuesByTrackId = this._cuesByTrackId;
    var textTrack = _tracksById[trackId]; // the track may not be on the video tag yet

    if (!textTrack) {
      if (!_cuesByTrackId) {
        _cuesByTrackId = this._cuesByTrackId = {};
      }

      _cuesByTrackId[trackId] = {
        cues: vttCues,
        loaded: false
      };
      return;
    } // Cues already added


    if (_cuesByTrackId[trackId] && _cuesByTrackId[trackId].loaded) {
      return;
    }

    var cue;
    _cuesByTrackId[trackId] = {
      cues: vttCues,
      loaded: true
    };

    while (cue = vttCues.shift()) {
      _addCueToTrack(this.renderNatively, textTrack, cue);
    }
  },
  parseNativeID3Cues: function parseNativeID3Cues(cues, previousCues) {
    var lastCue = cues[cues.length - 1];

    if (previousCues && previousCues.length === cues.length && (lastCue._parsed || cuesMatch(previousCues[previousCues.length - 1], lastCue))) {
      return;
    }

    var dataCueSets = [];
    var parsedDataCueSets = [];
    var dataCueSetIndex = -1;
    var startTime = -1;
    var previousStart = -1;

    for (var i = 0; i < cues.length; i++) {
      var cue = cues[i];

      if (!cue._extended && !!(cue.data || cue.value)) {
        if (cue.startTime !== startTime || cue.endTime === null) {
          previousStart = startTime;
          startTime = cue.startTime;
          var previousSet = dataCueSets[dataCueSetIndex];
          dataCueSets[++dataCueSetIndex] = [];
          parsedDataCueSets[dataCueSetIndex] = []; // increase id3 cue duration to a minimum of 0.25s up to next id3 cue start to ensure
          // "cuechange" event is fired and it is added to activeCues when currentTime intersects cue range

          var gap = startTime - previousStart;

          if (previousSet && gap > 0) {
            // eslint-disable-next-line max-depth
            for (var j = 0; j < previousSet.length; j++) {
              var previousCue = previousSet[j];
              previousCue.endTime = startTime;
              previousCue._extended = true;
            }
          }
        }

        dataCueSets[dataCueSetIndex].push(cue);

        if (!cue._parsed) {
          parsedDataCueSets[dataCueSetIndex].push(cue);

          if (cue.endTime - startTime < 0.25) {
            cue.endTime = startTime + 0.25;
          }

          cue._parsed = true;
        }
      }
    }

    for (var _i = 0; _i < parsedDataCueSets.length; _i++) {
      if (parsedDataCueSets[_i].length) {
        var event = getId3CueMetaEvent(parsedDataCueSets[_i]);
        this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_META_CUE_PARSED"], event);
      }
    }
  },
  triggerActiveCues: function triggerActiveCues(currentActiveCues, previousActiveCues) {
    var _this5 = this;

    var dataCues = currentActiveCues.filter(function (cue) {
      // Prevent duplicate meta events for cues that were active in the previous "cuechange" event
      if (previousActiveCues && previousActiveCues.some(function (prevCue) {
        return cuesMatch(cue, prevCue);
      })) {
        return false;
      }

      if (cue.data) {
        return true;
      }

      var event = cue.text ? getTextCueMetaEvent(cue) : null;

      if (event) {
        if (event.metadataType === 'emsg') {
          event.metadata = event.metadata || {};
          event.metadata.messageData = cue.value;
        }

        _this5.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_META"], event);
      } else if (cue.value) {
        return true;
      }

      return false;
    });

    if (dataCues.length) {
      var event = getId3CueMetaEvent(dataCues);
      this.trigger(events_events__WEBPACK_IMPORTED_MODULE_4__["MEDIA_META"], event);
    }
  },
  ensureMetaTracksActive: function ensureMetaTracksActive() {
    // Safari sometimes disables metadata tracks after seeking. It does this without warning,
    // breaking API metadata event functionality.
    // Ensure metadata tracks are enabled in "hidden" mode.
    var tracks = this.video.textTracks;
    var len = tracks.length;

    for (var i = 0; i < len; i++) {
      var _track2 = tracks[i];

      if (_track2.kind === 'metadata' && _track2.mode === 'disabled') {
        _track2.mode = 'hidden';
      }
    }
  },
  _cacheVTTCue: function _cacheVTTCue(track, vttCue, cacheKey) {
    var trackKind = track.kind;
    var trackId = track._id;
    var _cachedVTTCues = this._cachedVTTCues;

    if (!_cachedVTTCues[trackId]) {
      _cachedVTTCues[trackId] = {};
    }

    var cachedCues = _cachedVTTCues[trackId];
    var cacheKeyTime;

    switch (trackKind) {
      case 'captions':
      case 'subtitles':
        {
          // VTTCues should have unique start and end times, even in cases where there are multiple
          // active cues. This is safer than ensuring text is unique, which may be violated on seek.
          // Captions within .05s of each other are treated as unique to account for
          // quality switches where start/end times are slightly different.
          cacheKeyTime = cacheKey || Math.floor(vttCue.startTime * 20);
          var cacheLine = '_' + (vttCue.line || 'auto');
          var cacheValue = Math.floor(vttCue.endTime * 20);
          var cueExists = cachedCues[cacheKeyTime + cacheLine] || cachedCues[cacheKeyTime + 1 + cacheLine] || cachedCues[cacheKeyTime - 1 + cacheLine];

          if (cueExists && Math.abs(cueExists - cacheValue) <= 1) {
            return false;
          }

          cachedCues[cacheKeyTime + cacheLine] = cacheValue;
          return true;
        }

      case 'metadata':
        {
          var text = vttCue.data ? new Uint8Array(vttCue.data).join('') : vttCue.text;
          cacheKeyTime = cacheKey || vttCue.startTime + text;

          if (cachedCues[cacheKeyTime]) {
            return false;
          }

          cachedCues[cacheKeyTime] = vttCue.endTime;
          return true;
        }

      default:
        return false;
    }
  },
  _addTrackToList: function _addTrackToList(track) {
    this._textTracks.push(track);

    this._tracksById[track._id] = track;
  },
  _createTrack: function _createTrack(itemTrack) {
    var track;
    var labelInfo = Object(controller_tracks_helper__WEBPACK_IMPORTED_MODULE_1__["createLabel"])(itemTrack, this._unknownCount);
    var label = labelInfo.label;
    this._unknownCount = labelInfo.unknownCount;

    if (this.renderNatively || itemTrack.kind === 'metadata') {
      var _tracks2 = this.video.textTracks; // TextTrack label is read only, so we'll need to create a new track if we don't
      // already have one with the same label

      track = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_5__["findWhere"])(_tracks2, {
        label: label
      });

      if (!track) {
        track = this.video.addTextTrack(itemTrack.kind, label, itemTrack.language || '');
      }

      track.default = itemTrack.default;
      track.mode = 'disabled';
      track.inuse = true;
    } else {
      track = itemTrack;
      track.data = track.data || [];
    }

    if (!track._id) {
      track._id = Object(controller_tracks_helper__WEBPACK_IMPORTED_MODULE_1__["createId"])(itemTrack, this._textTracks ? this._textTracks.length : 0);
    }

    return track;
  },
  _clearSideloadedTextTracks: function _clearSideloadedTextTracks() {
    // Clear VTT textTracks
    if (!this._textTracks) {
      return;
    }

    var nonSideloadedTracks = this._textTracks.filter(function (track) {
      return track.embedded || track.groupid === 'subs';
    });

    this._initTextTracks();

    var _tracksById = this._tracksById;
    nonSideloadedTracks.forEach(function (track) {
      _tracksById[track._id] = track;
    });
    this._textTracks = nonSideloadedTracks;
  }
};

function textTrackChangeHandler() {
  var textTracks = this.video.textTracks;
  var inUseTracks = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_5__["filter"])(textTracks, function (track) {
    return (track.inuse || !track._id) && isCaptionsOrSubtitles(track.kind);
  });

  if (!this._textTracks || _tracksModified.call(this, inUseTracks)) {
    this.setTextTracks(textTracks);
    return;
  } // If a caption/subtitle track is showing, find its index


  var selectedTextTrackIndex = -1;

  for (var i = 0; i < this._textTracks.length; i++) {
    if (this._textTracks[i].mode === 'showing') {
      selectedTextTrackIndex = i;
      break;
    }
  } // Notifying the model when the index changes keeps the current index in sync in iOS Fullscreen mode


  if (selectedTextTrackIndex !== this._currentTextTrackIndex) {
    this.setSubtitlesTrack(selectedTextTrackIndex + 1);
  }
}

function _tracksModified(inUseTracks) {
  var _textTracks = this._textTracks;
  var _tracksById = this._tracksById; // Need to add new textTracks coming from the video tag

  if (inUseTracks.length > _textTracks.length) {
    return true;
  } // Tracks may have changed in Safari after an ad


  for (var i = 0; i < inUseTracks.length; i++) {
    var _track3 = inUseTracks[i];

    if (!_track3._id || !_tracksById[_track3._id]) {
      return true;
    }
  }

  return false;
} // Used in MS Edge to get tracks from the videotag as they're added


function addTrackHandler(e) {
  var track = e.track;

  if (track && track._id) {
    return;
  }

  this.setTextTracks(this.video.textTracks);
}

function cueChangeHandler(e) {
  var track = e.target;
  var activeCues = track.activeCues,
      cues = track.cues;
  var trackId = track._id;
  var _cues = this._cues;
  var _activeCues = this._activeCues;

  if (cues && cues.length) {
    var _previousCues = _cues[trackId];
    _cues[trackId] = Array.prototype.slice.call(cues);
    this.parseNativeID3Cues(cues, _previousCues);
  } else {
    delete _cues[trackId];
  }

  if (activeCues && activeCues.length) {
    var _previousActiveCues = _activeCues[trackId];

    var _currentActiveCues = _activeCues[trackId] = Array.prototype.slice.call(activeCues);

    this.triggerActiveCues(_currentActiveCues, _previousActiveCues);
  } else {
    delete _activeCues[trackId];
  }
} // ////////////////////
// //// PRIVATE METHODS
// ////////////////////


function _addCueToTrack(renderNatively, track, vttCue) {
  // IE/Edge will throw an exception if cues are not inserted in time order: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/13183203/
  if (environment_environment__WEBPACK_IMPORTED_MODULE_3__["Browser"].ie) {
    var cue = vttCue;

    if (renderNatively || track.kind === 'metadata') {
      // There's no support for the VTTCue interface in IE/Edge.
      // We need to convert VTTCue to TextTrackCue before adding them to the TextTrack
      // This unfortunately removes positioning properties from the cues
      cue = new window.TextTrackCue(vttCue.startTime, vttCue.endTime, vttCue.text);

      if (vttCue.value) {
        cue.value = vttCue.value;
      }
    }

    insertCueInOrder(track, cue);
  } else {
    try {
      track.addCue(vttCue);
    } catch (error) {
      console.error(error);
    }
  }
}

function insertCueInOrder(track, vttCue) {
  var temp = []; // If the track mode is 'disabled', track.cues will be null; set it to hidden so that we can access.

  var mode = track.mode;
  track.mode = 'hidden';
  var cues = track.cues;

  if (cues) {
    for (var i = cues.length - 1; i >= 0; i--) {
      if (cues[i].startTime > vttCue.startTime) {
        temp.unshift(cues[i]);
        track.removeCue(cues[i]);
      } else {
        break;
      }
    }
  }

  try {
    track.addCue(vttCue);
    temp.forEach(function (cue) {
      return track.addCue(cue);
    });
  } catch (error) {
    console.error(error);
  } // Restore the original track state


  track.mode = mode;
}

function _removeCues(renderNatively, tracks, removeCustomAttributes) {
  if (tracks && tracks.length) {
    Object(utils_underscore__WEBPACK_IMPORTED_MODULE_5__["each"])(tracks, function (track) {
      var trackId = track._id || '';

      if (removeCustomAttributes) {
        track._id = undefined;
      } // Let IE, Edge and Safari handle cleanup of non-sideloaded text tracks for native rendering


      if ((environment_environment__WEBPACK_IMPORTED_MODULE_3__["Browser"].ie || environment_environment__WEBPACK_IMPORTED_MODULE_3__["Browser"].safari) && renderNatively && /^(native|subtitle|cc)/.test(trackId)) {
        return;
      } // Cues are inaccessible if the track is disabled. While hidden,
      // we can remove cues while the track is in a non-visible state
      // Set to disabled before hidden to ensure active cues disappear


      if (!environment_environment__WEBPACK_IMPORTED_MODULE_3__["Browser"].ie || track.mode !== 'disabled') {
        // Avoid setting the track to disabled if it is already so. This prevents an exception when trying
        // to set the mode on Edge
        track.mode = 'disabled';
        track.mode = 'hidden';
      }

      if (track.cues) {
        for (var i = track.cues.length; i--;) {
          track.removeCue(track.cues[i]);
        }
      }

      if (!track.embedded) {
        track.mode = 'disabled';
      }

      track.inuse = false;
    });
  }
}

function isCaptionsOrSubtitles(kind) {
  return kind === 'captions' || kind === 'subtitles';
}

function isNativeCaptionsOrSubtitles(trackId) {
  return /^native(?:captions|subtitles)/.test(trackId);
}

function getTextCueMetaEvent(cue) {
  var metadata;

  try {
    metadata = JSON.parse(cue.text);
  } catch (e) {
    return null;
  }

  var event = {
    metadataType: metadata.metadataType,
    metadataTime: cue.startTime,
    metadata: metadata
  };

  if (metadata.programDateTime) {
    event.programDateTime = metadata.programDateTime;
  }

  return event;
}

function getId3CueMetaEvent(dataCues) {
  var metadata = Object(providers_utils_id3Parser__WEBPACK_IMPORTED_MODULE_2__["parseID3"])(dataCues);
  var metadataTime = dataCues[0].startTime;
  return {
    metadataType: 'id3',
    metadataTime: metadataTime,
    metadata: metadata
  };
}

function cuesMatch(cue1, cue2) {
  return cue1.startTime === cue2.startTime && cue1.endTime === cue2.endTime && cue1.text === cue2.text && cue1.data === cue2.data && JSON.stringify(cue1.value) === JSON.stringify(cue2.value);
}

/* harmony default export */ __webpack_exports__["default"] = (Tracks);

/***/ }),

/***/ "./src/js/providers/utils/id3Parser.js":
/*!*********************************************!*\
  !*** ./src/js/providers/utils/id3Parser.js ***!
  \*********************************************/
/*! exports provided: utf8ArrayToStr, syncSafeInt, parseID3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "utf8ArrayToStr", function() { return utf8ArrayToStr; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "syncSafeInt", function() { return syncSafeInt; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parseID3", function() { return parseID3; });
var friendlyNames = {
  TIT2: 'title',
  TT2: 'title',
  WXXX: 'url',
  TPE1: 'artist',
  TP1: 'artist',
  TALB: 'album',
  TAL: 'album'
};
function utf8ArrayToStr(array, startingIndex) {
  // Based on code by Masanao Izumo <iz@onicos.co.jp>
  // posted at http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt
  var len = array.length;
  var c;
  var char2;
  var char3;
  var out = '';
  var i = startingIndex || 0;

  while (i < len) {
    c = array[i++]; // If the character is 3 (END_OF_TEXT) or 0 (NULL) then skip it

    if (c === 0x00 || c === 0x03) {
      continue;
    }

    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;

      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode((c & 0x1F) << 6 | char2 & 0x3F);
        break;

      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode((c & 0x0F) << 12 | (char2 & 0x3F) << 6 | (char3 & 0x3F) << 0);
        break;

      default:
    }
  }

  return out;
}

function utf16BigEndianArrayToStr(array, startingIndex) {
  var lastDoubleByte = array.length - 1;
  var out = '';
  var i = startingIndex || 0;

  while (i < lastDoubleByte) {
    if (array[i] === 254 && array[i + 1] === 255) {// Byte order mark
    } else {
      out += String.fromCharCode((array[i] << 8) + array[i + 1]);
    }

    i += 2;
  }

  return out;
}

function syncSafeInt(sizeArray) {
  var size = arrayToInt(sizeArray);
  return size & 0x0000007F | (size & 0x00007F00) >> 1 | (size & 0x007F0000) >> 2 | (size & 0x7F000000) >> 3;
}

function arrayToInt(array) {
  var sizeString = '0x';

  for (var i = 0; i < array.length; i++) {
    if (array[i] < 16) {
      sizeString += '0';
    }

    sizeString += array[i].toString(16);
  }

  return parseInt(sizeString);
}

function parseID3(activeCues) {
  if (activeCues === void 0) {
    activeCues = [];
  }

  return activeCues.reduce(function (data, cue) {
    if (!('value' in cue)) {
      // Cue is not in Safari's key/data format
      if ('data' in cue && cue.data instanceof ArrayBuffer) {
        // EdgeHTML 13.10586 cue point format - contains raw data in an ArrayBuffer.
        var oldCue = cue;
        var array = new Uint8Array(oldCue.data);
        var arrayLength = array.length;
        cue = {
          value: {
            key: '',
            data: ''
          }
        };
        var i = 10;

        while (i < 14 && i < array.length) {
          if (array[i] === 0) {
            break;
          }

          cue.value.key += String.fromCharCode(array[i]);
          i++;
        } // If the first byte is 3 (END_OF_TEXT) or 0 (NULL) then skip it


        var startPos = 19;
        var firstByte = array[startPos];

        if (firstByte === 0x03 || firstByte === 0x00) {
          firstByte = array[++startPos];
          arrayLength--;
        }

        var infoDelimiterPosition = 0; // Find info/value pair delimiter if present.
        // If first byte shows theres utf 16 encoding, there is no info since info cannot be utf 16 encoded

        if (firstByte !== 0x01 && firstByte !== 0x02) {
          for (var j = startPos + 1; j < arrayLength; j++) {
            if (array[j] === 0x00) {
              infoDelimiterPosition = j - startPos;
              break;
            }
          }
        }

        if (infoDelimiterPosition > 0) {
          var info = utf8ArrayToStr(array.subarray(startPos, startPos += infoDelimiterPosition), 0);

          if (cue.value.key === 'PRIV') {
            if (info === 'com.apple.streaming.transportStreamTimestamp') {
              var ptsIs33Bit = syncSafeInt(array.subarray(startPos, startPos += 4)) & 0x00000001;
              var transportStreamTimestamp = syncSafeInt(array.subarray(startPos, startPos += 4)) + (ptsIs33Bit ? 0x100000000 : 0);
              cue.value.data = transportStreamTimestamp;
            } else {
              cue.value.data = utf8ArrayToStr(array, startPos + 1);
            }

            cue.value.info = info;
          } else {
            cue.value.info = info;
            cue.value.data = utf8ArrayToStr(array, startPos + 1);
          }
        } else {
          var encoding = array[startPos];

          if (encoding === 1 || encoding === 2) {
            cue.value.data = utf16BigEndianArrayToStr(array, startPos + 1);
          } else {
            cue.value.data = utf8ArrayToStr(array, startPos + 1);
          }
        }
      }
    } // These friendly names mapping provides compatibility with our implementation prior to 7.3


    if (friendlyNames.hasOwnProperty(cue.value.key)) {
      data[friendlyNames[cue.value.key]] = cue.value.data;
    }
    /* The meta event includes a metadata object with flattened cue key/data pairs
     * If a cue also includes an info field, then create a collection of info/data pairs for the cue key
     *   TLEN: 03:50                                        // key: "TLEN", data: "03:50"
     *   WXXX: {"artworkURL":"http://domain.com/cover.jpg"} // key: "WXXX", info: "artworkURL" ...
     */


    if (cue.value.info) {
      var collection = data[cue.value.key];

      if (collection !== Object(collection)) {
        collection = {};
        data[cue.value.key] = collection;
      }

      collection[cue.value.info] = cue.value.data;
    } else {
      data[cue.value.key] = cue.value.data;
    }

    return data;
  }, {});
}

/***/ }),

/***/ "./src/js/providers/utils/play-promise.ts":
/*!************************************************!*\
  !*** ./src/js/providers/utils/play-promise.ts ***!
  \************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return createPlayPromise; });
// These properties must be redefined because they are readonly on DOMException
function createPlayPromise(video) {
  return new Promise(function (resolve, reject) {
    if (video.paused) {
      return reject(playPromiseError('NotAllowedError', 0, 'play() failed.'));
    }

    var removeEventListeners = function removeEventListeners() {
      video.removeEventListener('play', playListener);
      video.removeEventListener('playing', listener);
      video.removeEventListener('pause', listener);
      video.removeEventListener('abort', listener);
      video.removeEventListener('error', listener);
    };

    var playListener = function playListener() {
      video.addEventListener('playing', listener);
      video.addEventListener('abort', listener);
      video.addEventListener('error', listener);
      video.addEventListener('pause', listener);
    };

    var listener = function listener(e) {
      removeEventListeners();

      if (e.type === 'playing') {
        resolve();
      } else {
        var message = "The play() request was interrupted by a \"" + e.type + "\" event.";

        if (e.type === 'error') {
          return reject(playPromiseError('NotSupportedError', 9, message));
        }

        return reject(playPromiseError('AbortError', 20, message));
      }
    };

    video.addEventListener('play', playListener);
  });
}

function playPromiseError(name, code, message) {
  var error = new Error(message);
  error.name = name;
  error.code = code;
  return error;
}

/***/ }),

/***/ "./src/js/providers/utils/stream-type.ts":
/*!***********************************************!*\
  !*** ./src/js/providers/utils/stream-type.ts ***!
  \***********************************************/
/*! exports provided: isDvr, streamType */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isDvr", function() { return isDvr; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "streamType", function() { return streamType; });
/** @module */

/**
 * It's DVR if the duration is not Infinity and above the minDvrWindow, Live otherwise.
 * @param {number} duration - The duration or seekable range of a stream in seconds.
 * @param {number} minDvrWindow - The duration threshold beyond which a stream should be treated as DVR instead of Live.
 * @returns {boolean} DVR or not.
 */
function isDvr(duration, minDvrWindow) {
  return duration !== Infinity && Math.abs(duration) >= Math.max(validMinDvrWindow(minDvrWindow), 0);
}
/**
 * Determine the adaptive type.
 * @param {number} duration - The duration or seekable range of a stream in seconds. Can be positive or negative.
 * Positive or non-infinite values will result in a return value of 'VOD'. Infinite values always return 'LIVE'.
 * @param {number} minDvrWindow - The duration threshold beyond which a stream should be treated as DVR instead of Live.
 * minDvrWindow should always be positive.
 * @returns {StreamType} The stream type.
 */

function streamType(duration, minDvrWindow) {
  var _streamType = 'VOD';

  if (duration === Infinity) {
    _streamType = 'LIVE';
  } else if (duration < 0) {
    _streamType = isDvr(duration, validMinDvrWindow(minDvrWindow)) ? 'DVR' : 'LIVE';
  }

  return _streamType;
}

function validMinDvrWindow(minDvrWindow) {
  return minDvrWindow === undefined ? 120 : Math.max(minDvrWindow, 0);
}

/***/ }),

/***/ "./src/js/providers/video-actions-mixin.ts":
/*!*************************************************!*\
  !*** ./src/js/providers/video-actions-mixin.ts ***!
  \*************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var environment_environment__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! environment/environment */ "./src/js/environment/environment.ts");
/* harmony import */ var utils_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/css */ "./src/js/utils/css.js");
/* harmony import */ var utils_time_ranges__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/time-ranges */ "./src/js/utils/time-ranges.ts");



var VideoActionsMixin = {
  container: null,
  volume: function volume(vol) {
    this.video.volume = Math.min(Math.max(0, vol / 100), 1);
  },
  mute: function mute(state) {
    this.video.muted = !!state;

    if (!this.video.muted) {
      // Remove muted attribute once user unmutes so the video element doesn't get
      // muted by the browser when the src changes or on replay
      this.video.removeAttribute('muted');
    }
  },
  resize: function resize(width, height, stretching) {
    var video = this.video;
    var videoWidth = video.videoWidth,
        videoHeight = video.videoHeight;

    if (!width || !height || !videoWidth || !videoHeight) {
      return;
    }

    var styles = {
      objectFit: '',
      width: '',
      height: ''
    };

    if (stretching === 'uniform') {
      // Snap video to edges when the difference in aspect ratio is less than 9% and perceivable
      var playerAspectRatio = width / height;
      var videoAspectRatio = videoWidth / videoHeight;
      var edgeMatch = Math.abs(playerAspectRatio - videoAspectRatio);

      if (edgeMatch < 0.09 && edgeMatch > 0.0025) {
        styles.objectFit = 'fill';
        stretching = 'exactfit';
      }
    } // Prior to iOS 9, object-fit worked poorly
    // object-fit is not implemented in IE or Android Browser in 4.4 and lower
    // http://caniuse.com/#feat=object-fit
    // feature detection may work for IE but not for browsers where object-fit works for images only


    var fitVideoUsingTransforms = environment_environment__WEBPACK_IMPORTED_MODULE_0__["Browser"].ie || environment_environment__WEBPACK_IMPORTED_MODULE_0__["OS"].iOS && environment_environment__WEBPACK_IMPORTED_MODULE_0__["OS"].version.major < 9 || environment_environment__WEBPACK_IMPORTED_MODULE_0__["Browser"].androidNative;

    if (fitVideoUsingTransforms) {
      if (stretching !== 'uniform') {
        styles.objectFit = 'contain';
        var aspectPlayer = width / height;
        var aspectVideo = videoWidth / videoHeight; // Use transforms to center and scale video in container

        var scaleX = 1;
        var scaleY = 1;

        if (stretching === 'none') {
          if (aspectPlayer > aspectVideo) {
            scaleX = scaleY = Math.ceil(videoHeight * 100 / height) / 100;
          } else {
            scaleX = scaleY = Math.ceil(videoWidth * 100 / width) / 100;
          }
        } else if (stretching === 'fill') {
          if (aspectPlayer > aspectVideo) {
            scaleX = scaleY = aspectPlayer / aspectVideo;
          } else {
            scaleX = scaleY = aspectVideo / aspectPlayer;
          }
        } else if (stretching === 'exactfit') {
          if (aspectPlayer > aspectVideo) {
            scaleX = aspectPlayer / aspectVideo;
            scaleY = 1;
          } else {
            scaleX = 1;
            scaleY = aspectVideo / aspectPlayer;
          }
        }

        Object(utils_css__WEBPACK_IMPORTED_MODULE_1__["transform"])(video, "matrix(" + scaleX.toFixed(2) + ", 0, 0, " + scaleY.toFixed(2) + ", 0, 0)");
      } else {
        styles.top = styles.left = styles.margin = '';
        Object(utils_css__WEBPACK_IMPORTED_MODULE_1__["transform"])(video, '');
      }
    }

    Object(utils_css__WEBPACK_IMPORTED_MODULE_1__["style"])(video, styles);
  },
  getContainer: function getContainer() {
    return this.container;
  },
  setContainer: function setContainer(element) {
    this.container = element;

    if (this.video.parentNode !== element) {
      element.appendChild(this.video);
    }
  },
  removeFromContainer: function removeFromContainer() {
    var container = this.container,
        video = this.video;
    this.container = null;

    if (container && container === video.parentNode) {
      container.removeChild(video);
    }
  },
  remove: function remove() {
    this.stop();
    this.destroy();
    this.removeFromContainer();
  },
  atEdgeOfLiveStream: function atEdgeOfLiveStream() {
    if (!this.isLive()) {
      return false;
    } // currentTime doesn't always get to the end of the buffered range


    var timeFudge = 2;
    return Object(utils_time_ranges__WEBPACK_IMPORTED_MODULE_2__["default"])(this.video.buffered) - this.video.currentTime <= timeFudge;
  }
};
/* harmony default export */ __webpack_exports__["default"] = (VideoActionsMixin);

/***/ }),

/***/ "./src/js/providers/video-attached-mixin.ts":
/*!**************************************************!*\
  !*** ./src/js/providers/video-attached-mixin.ts ***!
  \**************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var VideoAttachedMixin = {
  eventsOn_: function eventsOn_() {// noop
  },
  eventsOff_: function eventsOff_() {// noop
  },
  attachMedia: function attachMedia() {
    this.eventsOn_();
  },
  detachMedia: function detachMedia() {
    return this.eventsOff_();
  }
};
/* harmony default export */ __webpack_exports__["default"] = (VideoAttachedMixin);

/***/ }),

/***/ "./src/js/providers/video-listener-mixin.ts":
/*!**************************************************!*\
  !*** ./src/js/providers/video-listener-mixin.ts ***!
  \**************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");
/* harmony import */ var utils_math__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/math */ "./src/js/utils/math.ts");


var VideoListenerMixin = {
  canplay: function canplay() {
    // If we're not rendering natively text tracks will be provided from another source - don't duplicate them here
    if (this.renderNatively) {
      this.setTextTracks(this.video.textTracks);
    }

    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["MEDIA_BUFFER_FULL"]);
  },
  play: function play() {
    this.stallTime = -1;

    if (!this.video.paused && this.state !== events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_PLAYING"]) {
      this.setState(events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_LOADING"]);
    }
  },
  loadedmetadata: function loadedmetadata() {
    var metadata = {
      metadataType: 'media',
      duration: this.getDuration(),
      height: this.video.videoHeight,
      width: this.video.videoWidth,
      seekRange: this.getSeekRange()
    };
    var drmUsed = this.drmUsed;

    if (drmUsed) {
      metadata.drm = drmUsed;
    }

    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["MEDIA_META"], metadata);
  },
  timeupdate: function timeupdate() {
    var currentTime = this.video.currentTime;
    var position = this.getCurrentTime();
    var duration = this.getDuration();

    if (isNaN(duration)) {
      return;
    }

    if (!this.seeking && !this.video.paused && (this.state === events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_STALLED"] || this.state === events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_LOADING"]) && this.stallTime !== currentTime) {
      this.stallTime = -1;
      this.setState(events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_PLAYING"]);
      this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["PROVIDER_FIRST_FRAME"]);
    }

    var timeEventObject = {
      position: position,
      duration: duration,
      currentTime: currentTime,
      seekRange: this.getSeekRange(),
      metadata: {
        currentTime: currentTime
      }
    };
    var latency = this.getLiveLatency();

    if (latency !== null) {
      timeEventObject.latency = latency;

      if (this.getTargetLatency) {
        var targetLatency = this.getTargetLatency();

        if (targetLatency !== null) {
          timeEventObject.targetLatency = targetLatency;
        }
      }
    } // only emit time events when playing or seeking


    if (this.state === events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_PLAYING"] || this.seeking && this.state !== events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_IDLE"]) {
      this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["MEDIA_TIME"], timeEventObject);
    }
  },
  click: function click(evt) {
    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["CLICK"], evt);
  },
  volumechange: function volumechange() {
    var video = this.video;
    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["MEDIA_VOLUME"], {
      volume: Math.round(video.volume * 100)
    });
    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["MEDIA_MUTE"], {
      mute: video.muted
    });
  },
  seeking: function seeking() {
    // TODO: Use trigger(MEDIA_SEEK) implementation from html5 removed from hlsjs/shaka providers
    if (this.state === events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_LOADING"]) {
      // Ignore seeks performed by shaka-player and hls.js to jump initial buffer gap before play
      var bufferStart = this.video.buffered.length ? this.video.buffered.start(0) : -1;

      if (this.video.currentTime === bufferStart) {
        return;
      }
    } else if (this.state === events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_IDLE"]) {
      return;
    }

    this.seeking = true;
  },
  seeked: function seeked() {
    if (!this.seeking) {
      return;
    }

    this.seeking = false;
    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["MEDIA_SEEKED"]);
  },
  playing: function playing() {
    // When stalling, STATE_PLAYING is only set on timeupdate
    // because Safari and Firefox will fire "playing" before playback recovers from stalling
    if (this.stallTime === -1) {
      // Here setting STATE_PLAYING ensures a quick recovery from STATE_LOADING after seeking
      this.setState(events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_PLAYING"]);
    }

    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["PROVIDER_FIRST_FRAME"]);
  },
  pause: function pause() {
    // Sometimes the browser will fire "complete" and then a "pause" event
    if (this.state === events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_COMPLETE"]) {
      return;
    }

    if (this.video.ended) {
      return;
    }

    if (this.video.error) {
      return;
    } // If "pause" fires before "complete", we still don't want to propagate it


    if (this.video.currentTime === this.video.duration) {
      return;
    }

    this.setState(events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_PAUSED"]);
  },
  progress: function progress() {
    var dur = this.getDuration();

    if (dur <= 0 || dur === Infinity) {
      return;
    }

    var buf = this.video.buffered;

    if (!buf || buf.length === 0) {
      return;
    }

    var buffered = Object(utils_math__WEBPACK_IMPORTED_MODULE_1__["between"])(buf.end(buf.length - 1) / dur, 0, 1);
    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["MEDIA_BUFFER"], {
      bufferPercent: buffered * 100,
      position: this.getCurrentTime(),
      duration: dur,
      currentTime: this.video.currentTime,
      seekRange: this.getSeekRange()
    });
  },
  ratechange: function ratechange() {
    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["MEDIA_RATE_CHANGE"], {
      playbackRate: this.video.playbackRate
    });
  },
  ended: function ended() {
    if (this.state !== events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_IDLE"] && this.state !== events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_COMPLETE"]) {
      this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["MEDIA_COMPLETE"]);
    }
  }
};
/* harmony default export */ __webpack_exports__["default"] = (VideoListenerMixin);

/***/ }),

/***/ "./src/js/utils/time-ranges.ts":
/*!*************************************!*\
  !*** ./src/js/utils/time-ranges.ts ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return endOfRange; });
function endOfRange(timeRanges) {
  if (!timeRanges || !timeRanges.length) {
    return 0;
  }

  return timeRanges.end(timeRanges.length - 1);
}

/***/ })

}]);
//# sourceMappingURL=provider.html5.c57b7bef86dba4bab5ae.map