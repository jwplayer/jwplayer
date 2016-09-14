define([
    'utils/underscore',
    'utils/helpers',
    'parsers/parsers',
    'parsers/captions/srt',
    'parsers/captions/dfxp',
    'parsers/captions/vttcue'
], function(_, utils, parsers, srt, dfxp, VTTCue) {
    var tracksLoader = {};

    tracksLoader.loadFile = function(track, successHandler, errorHandler) {
        track.xhr = utils.ajax(track.file, function(xhr) {
            xhrSuccess.call(tracksLoader, xhr, track, successHandler, errorHandler);
        }, errorHandler);
    };

    tracksLoader.cancelXhr = function(tracks) {
        _.each(tracks, function(track) {
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
    };

    tracksLoader.convertToVTTCues = function(cues) {
        // VTTCue is available natively or polyfilled where necessary
        // TODO: if there's no window object, polyfill this
        var vttCues = _.map(cues, function (cue) {
            return new VTTCue(cue.begin, cue.end, cue.text);
        });
        return vttCues;
    };

    function xhrSuccess(xhr, track, successHandler, errorHandler) {
        var xmlRoot = xhr.responseXML ? xhr.responseXML.firstChild : null;
        var cues, vttCues;

        // IE9 sets the firstChild element to the root <xml> tag
        if (xmlRoot) {
            if (parsers.localName(xmlRoot) === 'xml') {
                xmlRoot = xmlRoot.nextSibling;
            }
            // Ignore all comments
            while (xmlRoot.nodeType === xmlRoot.COMMENT_NODE) {
                xmlRoot = xmlRoot.nextSibling;
            }
        }

        try {
            if (xmlRoot && parsers.localName(xmlRoot) === 'tt') {
                // parse dfxp track
                cues = dfxp(xhr.responseXML);
                vttCues = this.convertToVTTCues(cues);
                delete track.xhr;
                successHandler(vttCues);
            } else {
                // parse VTT/SRT track
                var responseText = xhr.responseText;

                // TODO: parse SRT with using vttParser and deprecate srt module
                if (responseText.indexOf('WEBVTT') >= 0) {
                    // make VTTCues from VTT track
                    parseCuesFromText(responseText, track, successHandler, errorHandler);
                } else {
                    // make VTTCues from SRT track
                    cues = srt(responseText);
                    vttCues = this.convertToVTTCues(cues);
                    delete track.xhr;
                    successHandler(vttCues);
                }
            }
        } catch (error) {
            delete track.xhr;
            errorHandler(error);
        }
    }

    function parseCuesFromText(text, track, successHandler, errorHandler) {
        require.ensure(['../parsers/captions/vttparser'], function (require) {
            var VTTParser = require('../parsers/captions/vttparser');
            var parser = new VTTParser(window);
            var vttCues = [];
            parser.oncue = function(cue) {
                vttCues.push(cue);
            };

            parser.onflush = function() {
                delete track.xhr;
                successHandler(vttCues);
            };

            try {
                parser.parse(text).flush();
            } catch(error) {
                delete track.xhr;
                errorHandler(error);
            }

        }, 'vttparser');
    }

    return tracksLoader;
});
