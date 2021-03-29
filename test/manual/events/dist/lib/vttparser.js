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
(window["webpackJsonpjwplayer"] = window["webpackJsonpjwplayer"] || []).push([["vttparser"],{

/***/ "./src/js/parsers/captions/vttparser.js":
/*!**********************************************!*\
  !*** ./src/js/parsers/captions/vttparser.js ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_request_animation_frame__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/request-animation-frame */ "./src/js/utils/request-animation-frame.ts");
/* harmony import */ var parsers_captions_vttcue__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! parsers/captions/vttcue */ "./src/js/parsers/captions/vttcue.js");
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

/*
* Source: https://github.com/mozilla/vtt.js/blob/v0.13.0/dist/vtt.js#L1718
*/

/* eslint-disable no-nested-ternary */


var timestampRegex = /^(\d+):(\d{2})(:\d{2})?\.(\d{3})/;
var integerRegex = /^-?\d+$/;
var fullLineRegex = /\r\n|\n/;
var noteRegex = /^NOTE($|[ \t])/;
var removeTimestampRegex = /^[^\sa-zA-Z-]+/;
var colonDelimRegex = /:/;
var stringDelimRegex = /\s/;
var whitespaceRegex = /^\s+/;
var arrowRegex = /-->/;
var headerRegex = /^WEBVTT([ \t].*)?$/;

var VTTParser = function VTTParser(window, decoder, syncCueParsing) {
  this.window = window;
  this.state = 'INITIAL';
  this.buffer = '';
  this.decoder = decoder || new StringDecoder();
  this.syncCueParsing = syncCueParsing;
  this.regionList = [];
  this.maxCueBatch = 1000;
};

function StringDecoder() {
  return {
    decode: function decode(data) {
      if (!data) {
        return '';
      }

      if (typeof data !== 'string') {
        throw new Error('Error - expected string data.');
      }

      return decodeURIComponent(encodeURIComponent(data));
    }
  };
} // Try to parse input as a time stamp.


function parseTimeStamp(input) {
  function computeSeconds(h, m, s, f) {
    return (h | 0) * 3600 + (m | 0) * 60 + (s | 0) + (f | 0) / 1000;
  }

  var m = input.match(timestampRegex);

  if (!m) {
    return null;
  }

  if (m[3]) {
    // Timestamp takes the form of [hours]:[minutes]:[seconds].[milliseconds]
    return computeSeconds(m[1], m[2], m[3].replace(':', ''), m[4]);
  } else if (m[1] > 59) {
    // Timestamp takes the form of [hours]:[minutes].[milliseconds]
    // First position is hours as it's over 59.
    return computeSeconds(m[1], m[2], 0, m[4]);
  } // Timestamp takes the form of [minutes]:[seconds].[milliseconds]


  return computeSeconds(0, m[1], m[2], m[4]);
} // A settings object holds key/value pairs and will ignore anything but the first
// assignment to a specific key.


function Settings() {
  this.values = Object.create(null);
}

Settings.prototype = {
  // Only accept the first assignment to any key.
  set: function set(k, v) {
    if (!this.get(k) && v !== '') {
      this.values[k] = v;
    }
  },
  // Return the value for a key, or a default value.
  // If 'defaultKey' is passed then 'dflt' is assumed to be an object with
  // a number of possible default values as properties where 'defaultKey' is
  // the key of the property that will be chosen; otherwise it's assumed to be
  // a single value.
  get: function get(k, dflt, defaultKey) {
    if (defaultKey) {
      return this.has(k) ? this.values[k] : dflt[defaultKey];
    }

    return this.has(k) ? this.values[k] : dflt;
  },
  // Check whether we have a value for a key.
  has: function has(k) {
    return k in this.values;
  },
  // Accept a setting if its one of the given alternatives.
  alt: function alt(k, v, a) {
    for (var n = 0; n < a.length; ++n) {
      if (v === a[n]) {
        this.set(k, v);
        break;
      }
    }
  },
  // Accept a setting if its a valid (signed) integer.
  integer: function integer(k, v) {
    if (integerRegex.test(v)) {
      // integer
      this.set(k, parseInt(v, 10));
    }
  },
  // Accept a setting if its a valid percentage.
  percent: function percent(k, v) {
    v = parseFloat(v);

    if (v >= 0 && v <= 100) {
      this.set(k, v);
      return true;
    }

    return false;
  }
}; // Helper function to parse input into groups separated by 'groupDelim', and
// interprete each group as a key/value pair separated by 'keyValueDelim'.

function parseOptions(input, callback, keyValueDelim, groupDelim) {
  var groups = groupDelim ? input.split(groupDelim) : [input];

  for (var i = 0; i <= groups.length; i += 1) {
    if (typeof groups[i] !== 'string') {
      continue;
    }

    var kv = groups[i].split(keyValueDelim);

    if (kv.length !== 2) {
      continue;
    }

    var k = kv[0];
    var v = kv[1];
    callback(k, v);
  }
}

var defaults = new parsers_captions_vttcue__WEBPACK_IMPORTED_MODULE_1__["default"](0, 0, 0); // 'middle' was changed to 'center' in the spec: https://github.com/w3c/webvtt/pull/244
// Chrome and Safari don't yet support this change, but FF does

var center = defaults.align === 'middle' ? 'middle' : 'center';

function parseCue(input, cue, regionList) {
  // Remember the original input if we need to throw an error.
  var oInput = input; // 4.1 WebVTT timestamp

  function consumeTimeStamp() {
    var ts = parseTimeStamp(input);

    if (ts === null) {
      throw new Error('Malformed timestamp: ' + oInput);
    } // Remove time stamp from input.


    input = input.replace(removeTimestampRegex, '');
    return ts;
  } // 4.4.2 WebVTT cue settings


  function consumeCueSettings(inputInner, cueInner) {
    var settings = new Settings();
    parseOptions(inputInner, function (k, v) {
      switch (k) {
        case 'region':
          // Find the last region we parsed with the same region id.
          for (var i = regionList.length - 1; i >= 0; i--) {
            if (regionList[i].id === v) {
              settings.set(k, regionList[i].region);
              break;
            }
          }

          break;

        case 'vertical':
          settings.alt(k, v, ['rl', 'lr']);
          break;

        case 'line':
          {
            var vals = v.split(',');
            var vals0 = vals[0];
            settings.integer(k, vals0);

            if (settings.percent(k, vals0)) {
              settings.set('snapToLines', false);
            }

            settings.alt(k, vals0, ['auto']);

            if (vals.length === 2) {
              settings.alt('lineAlign', vals[1], ['start', center, 'end']);
            }

            break;
          }

        case 'position':
          {
            var _vals = v.split(',');

            settings.percent(k, _vals[0]);

            if (_vals.length === 2) {
              settings.alt('positionAlign', _vals[1], ['start', center, 'end', 'line-left', 'line-right', 'auto']);
            }

            break;
          }

        case 'size':
          settings.percent(k, v);
          break;

        case 'align':
          settings.alt(k, v, ['start', center, 'end', 'left', 'right']);
          break;

        default:
      }
    }, colonDelimRegex, stringDelimRegex); // Apply default values for any missing fields.

    cueInner.region = settings.get('region', null);
    cueInner.vertical = settings.get('vertical', '');
    var line = settings.get('line', 'auto');

    if (line === 'auto' && defaults.line === -1) {
      // set numeric line number for Safari
      line = -1;
    }

    cueInner.line = line;
    cueInner.lineAlign = settings.get('lineAlign', 'start');
    cueInner.snapToLines = settings.get('snapToLines', true);
    cueInner.size = settings.get('size', 100);
    cueInner.align = settings.get('align', center);
    var position = settings.get('position', 'auto');

    if (position === 'auto' && defaults.position === 50) {
      // set numeric position for Safari
      position = cueInner.align === 'start' || cueInner.align === 'left' ? 0 : cueInner.align === 'end' || cueInner.align === 'right' ? 100 : 50;
    }

    cueInner.position = position;
  }

  function skipWhitespace() {
    input = input.replace(whitespaceRegex, '');
  } // 4.1 WebVTT cue timings.


  skipWhitespace();
  cue.startTime = consumeTimeStamp(); // (1) collect cue start time

  skipWhitespace();

  if (input.substr(0, 3) !== '-->') {
    // (3) next characters must match '-->'
    throw new Error('Malformed time stamp (time stamps must be separated by \'-->\'): ' + oInput);
  }

  input = input.substr(3);
  skipWhitespace();
  cue.endTime = consumeTimeStamp(); // (5) collect cue end time
  // 4.1 WebVTT cue settings list.

  skipWhitespace();
  consumeCueSettings(input, cue);
}

VTTParser.prototype = {
  parse: function parse(data, flushing) {
    var self = this; // If there is no data then we won't decode it, but will just try to parse
    // whatever is in buffer already. This may occur in circumstances, for
    // example when flush() is called.

    if (data) {
      // Try to decode the data that we received.
      self.buffer += self.decoder.decode(data, {
        stream: true
      });
    }

    function collectNextLine() {
      var buffer = self.buffer;
      var pos = 0;

      while (pos < buffer.length && buffer[pos] !== '\r' && buffer[pos] !== '\n') {
        ++pos;
      }

      var line = buffer.substr(0, pos); // Advance the buffer early in case we fail below.

      if (buffer[pos] === '\r') {
        ++pos;
      }

      if (buffer[pos] === '\n') {
        ++pos;
      }

      self.buffer = buffer.substr(pos);
      return line;
    } // 3.2 WebVTT metadata header syntax
    // function parseHeader(input) {
    //     parseOptions(input, function (k, v) {
    //         switch (k) {
    //             case 'Region':
    //                 // 3.3 WebVTT region metadata header syntax
    //                 console.log('parse region', v);
    //                 // parseRegion(v);
    //                 break;
    //             default:
    //         }
    //     }, colonDelimRegex);
    // }


    function errorHandler() {
      // If we are currently parsing a cue, report what we have.
      if (self.state === 'CUETEXT' && self.cue && self.oncue) {
        self.oncue(self.cue);
      }

      self.cue = null; // Enter BADWEBVTT state if header was not parsed correctly otherwise
      // another exception occurred so enter BADCUE state.

      self.state = self.state === 'INITIAL' ? 'BADWEBVTT' : 'BADCUE';
    }

    var line; // 5.1 WebVTT file parsing.

    try {
      if (self.state === 'INITIAL') {
        // We can't start parsing until we have the first line.
        if (!fullLineRegex.test(self.buffer)) {
          return this;
        }

        line = collectNextLine();
        var m = line.match(headerRegex);

        if (!m || !m[0]) {
          throw new Error('Malformed WebVTT signature.');
        }

        self.state = 'HEADER';
      }
    } catch (e) {
      errorHandler();
      return this;
    }

    var alreadyCollectedLine = false;
    var currentCueBatch = 0;

    function processBuffer() {
      try {
        while (self.buffer && (currentCueBatch <= self.maxCueBatch || self.syncCueParsing)) {
          // We can't parse a line until we have the full line.
          if (!fullLineRegex.test(self.buffer)) {
            self.flush();
            return this;
          }

          if (!alreadyCollectedLine) {
            line = collectNextLine();
          } else {
            alreadyCollectedLine = false;
          }

          switch (self.state) {
            case 'HEADER':
              // 13-18 - Allow a header (metadata) under the WEBVTT line.
              if (colonDelimRegex.test(line)) {// parseHeader(line);
              } else if (!line) {
                // An empty line terminates the header and starts the body (cues).
                self.state = 'ID';
              }

              break;

            case 'NOTE':
              // Ignore NOTE blocks.
              if (!line) {
                self.state = 'ID';
              }

              break;

            case 'ID':
              // Check for the start of NOTE blocks.
              if (noteRegex.test(line)) {
                self.state = 'NOTE';
                break;
              } // 19-29 - Allow any number of line terminators, then initialize new cue values.


              if (!line) {
                break;
              }

              self.cue = new parsers_captions_vttcue__WEBPACK_IMPORTED_MODULE_1__["default"](0, 0, '');
              self.state = 'CUE'; // 30-39 - Check if self line contains an optional identifier or timing data.

              if (!arrowRegex.test(line)) {
                self.cue.id = line;
                break;
              }

            // Process line as start of a cue.

            /* falls through*/

            case 'CUE':
              // 40 - Collect cue timings and settings.
              try {
                parseCue(line, self.cue, self.regionList);
              } catch (e) {
                // In case of an error ignore rest of the cue.
                self.cue = null;
                self.state = 'BADCUE';
                break;
              }

              self.state = 'CUETEXT';
              break;

            case 'CUETEXT':
              {
                var hasSubstring = arrowRegex.test(line); // 34 - If we have an empty line then report the cue.
                // 35 - If we have the special substring '-->' then report the cue,
                // but do not collect the line as we need to process the current
                // one as a new cue.

                if (!line || hasSubstring && (alreadyCollectedLine = true)) {
                  // We are done parsing self cue.
                  if (self.oncue) {
                    currentCueBatch += 1;
                    self.oncue(self.cue);
                  }

                  self.cue = null;
                  self.state = 'ID';
                  break;
                }

                if (self.cue.text) {
                  self.cue.text += '\n';
                }

                self.cue.text += line;
                break;
              }

            case 'BADCUE':
              // BADCUE
              // 54-62 - Collect and discard the remaining cue.
              if (!line) {
                self.state = 'ID';
              }

              break;

            default:
          }
        }

        currentCueBatch = 0;

        if (self.buffer) {
          Object(utils_request_animation_frame__WEBPACK_IMPORTED_MODULE_0__["requestAnimationFrame"])(processBuffer);
        } else if (!flushing) {
          self.flush();
          return this;
        }
      } catch (e) {
        errorHandler(e);
        return this;
      }
    } // Immediately process some cues


    processBuffer();
  },
  flush: function flush() {
    var self = this;

    try {
      // Finish decoding the stream.
      self.buffer += self.decoder.decode(); // Synthesize the end of the current cue or region.

      if (self.cue || self.state === 'HEADER') {
        self.buffer += '\n\n';
        self.parse(undefined, true);
      } // If we've flushed, parsed, and we're still on the INITIAL state then
      // that means we don't have enough of the stream to parse the first
      // line.


      if (self.state === 'INITIAL') {
        throw new Error('Malformed WebVTT signature.');
      }
    } catch (e) {
      throw e;
    }

    if (self.onflush) {
      self.onflush();
    }

    return this;
  }
};
/* harmony default export */ __webpack_exports__["default"] = (VTTParser);

/***/ })

}]);
//# sourceMappingURL=vttparser.c57b7bef86dba4bab5ae.map