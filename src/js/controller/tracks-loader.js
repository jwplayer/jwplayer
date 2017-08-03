import VTTCue from 'parsers/captions/vttcue';
import { chunkLoadErrorHandler } from '../api/core-loader';

define([
    'utils/underscore',
    'utils/helpers',
    'parsers/parsers',
    'parsers/captions/srt',
    'parsers/captions/dfxp'
], function(_, utils, parsers, srt, dfxp) {
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
        var cues;
        var vttCues;

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
                if (responseText.indexOf('WEBVTT') >= 0) {
                    // make VTTCues from VTT track
                    loadVttParser().then(VTTParser => {
                        var parser = new VTTParser(window);
                        vttCues = [];
                        parser.oncue = function(cue) {
                            vttCues.push(cue);
                        };

                        parser.onflush = function() {
                            delete track.xhr;
                            successHandler(vttCues);
                        };

                        // Parse calls onflush internally
                        parser.parse(responseText);
                    }).catch(error => {
                        delete track.xhr;
                        errorHandler(error);
                    });
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

    function loadVttParser() {
        return require.ensure(['parsers/captions/vttparser'], function (require) {
            return require('parsers/captions/vttparser').default;
        }, chunkLoadErrorHandler, 'vttparser');
    }

    return tracksLoader;
});
