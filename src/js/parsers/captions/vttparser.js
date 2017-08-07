/* eslint-disable no-nested-ternary */
/*
* Source: https://github.com/mozilla/vtt.js/blob/master/dist/vtt.js#L1716
*/

import { requestAnimationFrame } from 'utils/request-animation-frame';
import VTTCue from 'parsers/captions/vttcue';

const timestampRegex = /^(\d+):(\d{2})(:\d{2})?\.(\d{3})/;
const integerRegex = /^-?\d+$/;
const fullLineRegex = /\r\n|\n/;
const noteRegex = /^NOTE($|[ \t])/;
const removeTimestampRegex = /^[^\sa-zA-Z-]+/;
const colonDelimRegex = /:/;
const stringDelimRegex = /\s/;
const whitespaceRegex = /^\s+/;
const arrowRegex = /-->/;
const headerRegex = /^WEBVTT([ \t].*)?$/;

const VTTParser = function(window, decoder) {
    this.window = window;
    this.state = 'INITIAL';
    this.buffer = '';
    this.decoder = decoder || new StringDecoder();
    this.regionList = [];
    this.maxCueBatch = 1000;
};

function StringDecoder() {
    return {
        decode: function(data) {
            if (!data) {
                return '';
            }
            if (typeof data !== 'string') {
                throw new Error('Error - expected string data.');
            }
            return decodeURIComponent(encodeURIComponent(data));
        }
    };
}

// Try to parse input as a time stamp.
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
    }
    // Timestamp takes the form of [minutes]:[seconds].[milliseconds]
    return computeSeconds(0, m[1], m[2], m[4]);
}

// A settings object holds key/value pairs and will ignore anything but the first
// assignment to a specific key.
function Settings() {
    this.values = Object.create(null);
}

Settings.prototype = {
    // Only accept the first assignment to any key.
    set: function(k, v) {
        if (!this.get(k) && v !== '') {
            this.values[k] = v;
        }
    },
    // Return the value for a key, or a default value.
    // If 'defaultKey' is passed then 'dflt' is assumed to be an object with
    // a number of possible default values as properties where 'defaultKey' is
    // the key of the property that will be chosen; otherwise it's assumed to be
    // a single value.
    get: function(k, dflt, defaultKey) {
        if (defaultKey) {
            return this.has(k) ? this.values[k] : dflt[defaultKey];
        }
        return this.has(k) ? this.values[k] : dflt;
    },
    // Check whether we have a value for a key.
    has: function(k) {
        return k in this.values;
    },
    // Accept a setting if its one of the given alternatives.
    alt: function(k, v, a) {
        for (var n = 0; n < a.length; ++n) {
            if (v === a[n]) {
                this.set(k, v);
                break;
            }
        }
    },
    // Accept a setting if its a valid (signed) integer.
    integer: function(k, v) {
        if (integerRegex.test(v)) { // integer
            this.set(k, parseInt(v, 10));
        }
    },
    // Accept a setting if its a valid percentage.
    percent: function(k, v) {
        v = parseFloat(v);
        if (v >= 0 && v <= 100) {
            this.set(k, v);
            return true;
        }
        return false;
    }
};

// Helper function to parse input into groups separated by 'groupDelim', and
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

var defaults = new VTTCue(0, 0, 0);
// 'middle' was changed to 'center' in the spec: https://github.com/w3c/webvtt/pull/244
// Chrome and Safari don't yet support this change, but FF does
var center = defaults.align === 'middle' ? 'middle' : 'center';

function parseCue(input, cue, regionList) {
    // Remember the original input if we need to throw an error.
    var oInput = input;
    // 4.1 WebVTT timestamp
    function consumeTimeStamp() {
        var ts = parseTimeStamp(input);
        if (ts === null) {
            throw new Error('Malformed timestamp: ' + oInput);
        }
        // Remove time stamp from input.
        input = input.replace(removeTimestampRegex, '');
        return ts;
    }

    // 4.4.2 WebVTT cue settings
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
                case 'line': {
                    const vals = v.split(',');
                    const vals0 = vals[0];
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
                case 'position': {
                    const vals = v.split(',');
                    settings.percent(k, vals[0]);
                    if (vals.length === 2) {
                        settings.alt('positionAlign', vals[1], ['start', center, 'end', 'line-left', 'line-right', 'auto']);
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
        }, colonDelimRegex, stringDelimRegex);

        // Apply default values for any missing fields.
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
    }

    // 4.1 WebVTT cue timings.
    skipWhitespace();
    cue.startTime = consumeTimeStamp(); // (1) collect cue start time
    skipWhitespace();
    if (input.substr(0, 3) !== '-->') { // (3) next characters must match '-->'
        throw new Error('Malformed time stamp (time stamps must be separated by \'-->\'): ' +
            oInput);
    }
    input = input.substr(3);
    skipWhitespace();
    cue.endTime = consumeTimeStamp(); // (5) collect cue end time

    // 4.1 WebVTT cue settings list.
    skipWhitespace();
    consumeCueSettings(input, cue);
}

VTTParser.prototype = {
    parse: function (data, flushing) {
        var self = this;

        // If there is no data then we won't decode it, but will just try to parse
        // whatever is in buffer already. This may occur in circumstances, for
        // example when flush() is called.
        if (data) {
            // Try to decode the data that we received.
            self.buffer += self.decoder.decode(data, { stream: true });
        }

        function collectNextLine() {
            var buffer = self.buffer;
            var pos = 0;
            while (pos < buffer.length && buffer[pos] !== '\r' && buffer[pos] !== '\n') {
                ++pos;
            }
            var line = buffer.substr(0, pos);
            // Advance the buffer early in case we fail below.
            if (buffer[pos] === '\r') {
                ++pos;
            }
            if (buffer[pos] === '\n') {
                ++pos;
            }
            self.buffer = buffer.substr(pos);
            return line;
        }

        // 3.2 WebVTT metadata header syntax
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
            self.cue = null;
            // Enter BADWEBVTT state if header was not parsed correctly otherwise
            // another exception occurred so enter BADCUE state.
            self.state = self.state === 'INITIAL' ? 'BADWEBVTT' : 'BADCUE';
        }

        // 5.1 WebVTT file parsing.
        try {
            var line;
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
                while (self.buffer && currentCueBatch <= self.maxCueBatch) {
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
                            if (colonDelimRegex.test(line)) {
                                // parseHeader(line);
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
                            }
                            // 19-29 - Allow any number of line terminators, then initialize new cue values.
                            if (!line) {
                                break;
                            }
                            self.cue = new VTTCue(0, 0, '');
                            self.state = 'CUE';
                            // 30-39 - Check if self line contains an optional identifier or timing data.
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
                            var hasSubstring = arrowRegex.test(line);
                            // 34 - If we have an empty line then report the cue.
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
                        case 'BADCUE': // BADCUE
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
                    requestAnimationFrame(processBuffer);
                } else if (!flushing) {
                    self.flush();
                    return this;
                }
            } catch (e) {
                errorHandler(e);
                return this;
            }
        }

        // Immediately process some cues
        processBuffer();
    },
    flush: function () {
        var self = this;
        try {
            // Finish decoding the stream.
            self.buffer += self.decoder.decode();
            // Synthesize the end of the current cue or region.
            if (self.cue || self.state === 'HEADER') {
                self.buffer += '\n\n';
                self.parse(undefined, true);
            }
            // If we've flushed, parsed, and we're still on the INITIAL state then
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

export default VTTParser;
