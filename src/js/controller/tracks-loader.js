import VTTCue from 'parsers/captions/vttcue';
import { chunkLoadErrorHandler } from '../api/core-loader';
import utils from 'utils/helpers';
import { localName } from 'parsers/parsers';
import srt from 'parsers/captions/srt';
import dfxp from 'parsers/captions/dfxp';

export function loadFile(track, successHandler, errorHandler) {
    track.xhr = utils.ajax(track.file, function(xhr) {
        xhrSuccess(xhr, track, successHandler, errorHandler);
    }, errorHandler);
}

export function cancelXhr(tracks) {
    if (tracks) {
        tracks.forEach(track => {
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

export function convertToVTTCues(cues) {
    // VTTCue is available natively or polyfilled where necessary
    return cues.map(cue => new VTTCue(cue.begin, cue.end, cue.text));
}

function xhrSuccess(xhr, track, successHandler, errorHandler) {
    var xmlRoot = xhr.responseXML ? xhr.responseXML.firstChild : null;
    var cues;
    var vttCues;

    // IE9 sets the firstChild element to the root <xml> tag
    if (xmlRoot) {
        if (localName(xmlRoot) === 'xml') {
            xmlRoot = xmlRoot.nextSibling;
        }
        // Ignore all comments
        while (xmlRoot.nodeType === xmlRoot.COMMENT_NODE) {
            xmlRoot = xmlRoot.nextSibling;
        }
    }

    try {
        if (xmlRoot && localName(xmlRoot) === 'tt') {
            // parse dfxp track
            cues = dfxp(xhr.responseXML);
            vttCues = convertToVTTCues(cues);
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
                vttCues = convertToVTTCues(cues);
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
