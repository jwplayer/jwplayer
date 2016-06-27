define(['../utils/underscore',
    '../utils/id3Parser',
    '../utils/helpers',
    '../controller/captions',
    '../parsers/parsers',
    '../parsers/captions/srt',
    '../parsers/captions/dfxp'
], function(_, ID3Parser, utils, dom, Captions, parsers, srt, dfxp) {
    /**
     * Used across all providers for loading tracks and handling browser track-related events
     */
    var Tracks = {
        addTracksListener: addTracksListener,
        clearTracks: clearTracks,
        disableTextTrack: disableTextTrack,
        getSubtitlesTrack: getSubtitlesTrack,
        removeTracksListener: removeTracksListener,
        addTextTracks: addTextTracks,
        setTextTracks: setTextTracks,
        setupSideloadedTracks: setupSideloadedTracks,
        setSubtitlesTrack: setSubtitlesTrack,
        textTrackChangeHandler: textTrackChangeHandler,
        addCuesToTrack: addCuesToTrack
    };

    var _textTracks = null, // subtitles and captions tracks
        _tracksById = null,
        _cuesByTrackId = null,
        _metaCuesByTextTime = null,
        _currentTextTrackIndex = -1, // captionsIndex - 1 (accounts for Off = 0 in model)
        _unknownCount = 0,
        _renderNatively = false;

    function setTextTracks(tracks) {
        _currentTextTrackIndex = -1;

        if (!tracks) {
            return;
        }

        if (!_textTracks) {
            _initTextTracks();
        }

        // filter for 'subtitles' or 'captions' tracks
        if (tracks.length) {
            var i = 0, len = tracks.length;

            for (i; i < len; i++) {
                var track = tracks[i];
                if (!track.inuse || _tracksById[track._id]) {
                    continue;
                }
                // setup TextTrack
                if (track.kind === 'metadata') {
                    track.oncuechange = _cueChangeHandler.bind(this);
                    track.mode = 'showing';
                    _tracksById[track.kind] = track;
                }
                else if (track.kind === 'subtitles' || track.kind === 'captions') {
                    var mode = track.mode,
                        cue;

                    // By setting the track mode to 'hidden', we can determine if the track has cues
                    track.mode = 'hidden';

                    if (!track.cues.length && track.embedded) {
                        // There's no method to remove tracks added via: video.addTextTrack.
                        // This ensures the 608 captions track isn't added to the CC menu until it has cues
                        continue;
                    }

                    track.mode = mode;

                    // Parsed cues may not have been added to this track yet
                    if (_cuesByTrackId[track._id] && !_cuesByTrackId[track._id].loaded) {
                        var cues = _cuesByTrackId[track._id].cues;
                        while((cue = cues.pop())) {
                            track.addCue(cue);
                        }
                        track.mode = mode;
                        _cuesByTrackId[track._id].loaded = true;
                    }

                    _addTrackToList(track);
                }
            }
        }

        if (_renderNatively) {
            this.addTracksListener(_textTracks, 'change', textTrackChangeHandler);
        }

        if (_textTracks.length) {
            this.trigger('subtitlesTracks', {tracks: _textTracks});
        }
    }

    function setupSideloadedTracks(tracks) {
        _renderNatively = _renderNatively || _nativeRenderingSupported(this.getName().name);
        if (this.isSDK || !tracks) {
            return;
        }

        if (!_tracksAlreadySideloaded.call(this, tracks)) {
            // Add tracks if we're starting playback or resuming after a midroll
            if (_renderNatively) {
                disableTextTrack();
                _clearSideloadedTextTracks();
            }
            this.itemTracks = tracks;
            addTextTracks.call(this, tracks);
        }
    }

    function setSubtitlesTrack(menuIndex) {
        if (!_textTracks) {
            return;
        }

        // 0 = 'Off'
        if (menuIndex === 0) {
            _.each(_textTracks, function (track) {
                track.mode = 'disabled';
            });
        }

        // Track index is 1 less than controlbar index to account for 'Off' = 0.
        // Prevent unnecessary track change events
        if (_currentTextTrackIndex === menuIndex - 1) {
            return;
        }

        // Turn off current track
        disableTextTrack();

        // Set the provider's index to the model's index, then show the selected track if it exists
        _currentTextTrackIndex = menuIndex - 1;

        if (_renderNatively) {
            if (_textTracks[_currentTextTrackIndex]) {
                _textTracks[_currentTextTrackIndex].mode = 'showing';
            }

            // Update the model index since the track change may have come from a browser event
            this.trigger('subtitlesTrackChanged', {
                currentTrack: _currentTextTrackIndex + 1,
                tracks: _textTracks
            });
        }
    }

    function getSubtitlesTrack() {
        return _currentTextTrackIndex;
    }

    function addCuesToTrack(cueData) {
        // convert cues coming from the flash provider into VTTCues, then append them to track
        var track = _tracksById[cueData.name];
        if (!track) {
            return;
        }

        track.source = cueData.source;
        var cues = cueData.captions || [],
            cuesToConvert = [],
            sort = false;
        for (var i=0; i<cues.length; i++) {
            var cue = cues[i];
            var cueId = cueData.name +'_'+ cue.begin +'_'+ cue.end;
            if (!_metaCuesByTextTime[cueId]) {
                _metaCuesByTextTime[cueId] = cue;
                cuesToConvert.push(cue);
                sort = true;
            }
        }
        if (sort) {
            cuesToConvert.sort(function(a, b) {
                return a.begin - b.begin;
            });
        }
        var vttCues = _convertToVTTCues(cuesToConvert);
        Array.prototype.push.apply(track.data, vttCues);
    }

    function addTracksListener(tracks, eventType, handler) {
        handler = handler.bind(this);

        if (tracks.addEventListener) {
            tracks.addEventListener(eventType, handler);
        } else {
            tracks['on' + eventType] = handler;
        }
    }

    function removeTracksListener(tracks, eventType, handler) {
        if (!tracks) {
            return;
        }
        if (tracks.removeEventListener) {
            tracks.removeEventListener(eventType, handler);
        } else {
            tracks['on' + eventType] = null;
        }
    }

    function clearTracks() {
        _textTracks = null;
        _tracksById = null;
        _cuesByTrackId = null;
        _metaCuesByTextTime = null;
        _unknownCount = 0;
        if (_renderNatively) {
            _removeCues(this.video.textTracks);
        }
        _renderNatively = false;
    }

    function _removeCues(tracks) {
        if (tracks.length) {
            _.each(tracks, function(track) {
                // Cues are inaccessible if the track is disabled. While hidden,
                // we can remove cues while the track is in a non-visible state
                track.mode = 'hidden';
                while (track.cues.length) {
                    track.removeCue(track.cues[0]);
                }
                track.mode = 'disabled';
                track.inuse = false;
            });
        }
    }

    function disableTextTrack() {
        if (_textTracks && _textTracks[_currentTextTrackIndex]) {
            _textTracks[_currentTextTrackIndex].mode = 'disabled';
        }
    }

    function textTrackChangeHandler() {

        if (!_textTracks || this.video.textTracks.length > _textTracks.length) {
            // If the video element has more tracks than we have internally..
            this.setTextTracks(this.video.textTracks);
        }
        // if a caption/subtitle track is showing, find its index
        var _selectedTextTrackIndex = -1, i = 0;
        for (i; i < _textTracks.length; i++) {
            if (_textTracks[i].mode === 'showing') {
                _selectedTextTrackIndex = i;
                break;
            }
        }
        this.setSubtitlesTrack(_selectedTextTrackIndex + 1);
    }

    function _cueChangeHandler(e) {
        var activeCues = e.currentTarget.activeCues;
        if (!activeCues || !activeCues.length) {
            return;
        }

        // Get the most recent start time. Cues are sorted by start time in ascending order by the browser
        var startTime = activeCues[activeCues.length - 1].startTime;

        var dataCues = [];

        _.each(activeCues, function(cue) {
            if (cue.startTime < startTime) {
                return;
            }
            if (cue.data) {
                dataCues.push(cue);
            } else if (cue.text) {
                this.trigger('meta', {
                    metadataTime: startTime,
                    metadata: JSON.parse(cue.text)
                });
            }
        }, this);

        if (dataCues.length) {
            var id3Data = ID3Parser.parseID3(dataCues);
            this.trigger('meta', {
                metadataTime: startTime,
                metadata: id3Data
            });
        }
    }

    function _tracksAlreadySideloaded(tracks) {
        // Determine if the tracks are the same and the embedded + sideloaded count = # of tracks in the controlbar
        return tracks === this.itemTracks && _textTracks && _textTracks.length >= tracks.length;
    }

    function _clearSideloadedTextTracks() {
        // Clear VTT textTracks
        if (!_textTracks) {
            return;
        }
        var nonSideloadedTracks = _.filter(_textTracks, function (track) {
            return track.embedded || track.groupid === 'subs';
        });
        _initTextTracks();
        _.each(nonSideloadedTracks, function (track) {
           _tracksById[track._id] = track;
        });
        _textTracks = nonSideloadedTracks;
    }

    function _initTextTracks() {
        _textTracks = [];
        _tracksById = {};
        _metaCuesByTextTime = {};
        _cuesByTrackId = {};
        _unknownCount = 0;
        _renderNatively = false;
    }

    function addTextTracks(tracks) {
        if (!tracks) {
            return;
        }

        if (!_textTracks) {
            _initTextTracks();
        }

        _renderNatively = _nativeRenderingSupported(this.getName().name);

        for (var i = 0; i < tracks.length; i++) {
            var itemTrack = tracks[i];
            var track = _createTrack.call(this, itemTrack);
            _addTrackToList(track);
            if (itemTrack.file) {
                _parseTrack(itemTrack, track);
            }
        }

        // We can setup the captions menu now since we're not rendering textTracks natively
        if(!_renderNatively && _textTracks.length) {
            this.trigger('subtitlesTracks', {tracks: _textTracks});
        }
    }

    function _addTrackToList(track) {
        _textTracks.push(track);
        _tracksById[track._id] = track;
    }

    function _parseTrack(itemTrack, track) {
        utils.ajax(itemTrack.file, function(xhr) {
            _xhrSuccess(xhr, track);
        }, _errorHandler);
    }

    function _xhrSuccess(xhr, track) {
        var rss = xhr.responseXML ? xhr.responseXML.firstChild : null;
        var status;

        // IE9 sets the firstChild element to the root <xml> tag
        if (rss) {
            if (parsers.localName(rss) === 'xml') {
                rss = rss.nextSibling;
            }
            // Ignore all comments
            while (rss.nodeType === rss.COMMENT_NODE) {
                rss = rss.nextSibling;
            }
        }
        try {
            if (rss && parsers.localName(rss) === 'tt') {
                // parse dfxp track
                status = utils.tryCatch(function () {
                    var cues = dfxp(xhr.responseXML);
                    var vttCues = _convertToVTTCues(cues);
                    _addVTTCuesToTrack(track, vttCues);
                });
            } else {
                // parse VTT/SRT track
                status = utils.tryCatch(function () {
                    var responseText = xhr.responseText;
                    if (responseText.indexOf('WEBVTT') >= 0) {
                        // make VTTCues from VTT track
                        _parseCuesFromText(xhr.responseText, track);
                    } else {
                        // make VTTCues from SRT track
                        var cues = srt(xhr.responseText);
                        var vttCues = _convertToVTTCues(cues);
                        _addVTTCuesToTrack(track, vttCues);
                    }
                });
            }
        } catch (error) {
            if (status instanceof utils.Error) {
                _errorHandler(status.message + ': ' + track.file);
            }
        }
    }

    function _addVTTCuesToTrack(track, vttCues) {
        if (_renderNatively) {
            var textTrack = _tracksById[track._id];
            // the track may not be on the video tag yet
            if (!textTrack) {

                if (!_cuesByTrackId) {
                    _cuesByTrackId = {};
                }
                _cuesByTrackId[track._id] = { cues: vttCues, loaded: false};
                return;
            }
            // Cues already added
            if (_cuesByTrackId[track._id] && _cuesByTrackId[track._id].loaded) {
                return;
            }

            var cue;
            _cuesByTrackId[track._id] = { cues: vttCues, loaded: true };

            while((cue = vttCues.pop())) {
                textTrack.addCue(cue);
            }
        } else {
            track.data = vttCues;
        }
    }

    function _createTrack(itemTrack) {
        var track;
        if (_renderNatively) {
            var tracks = this.video.textTracks;
            track = _.findWhere(tracks, {'inuse': false});
            if (track) {
                track.kind = itemTrack.kind;
                track.label = itemTrack.label;
                track.language = itemTrack.language || '';
            } else {
                track = this.video.addTextTrack(itemTrack.kind, itemTrack.label, itemTrack.language || '');
            }
            track.mode    = 'disabled';
            track.inuse = true;
        } else {
            track = itemTrack;
            track.data = track.data || [];
        }

        track._id = itemTrack.default || itemTrack.defaulttrack ? 'default' : '';
        if (!track._id) {
            track._id = itemTrack.name || itemTrack.file || ('cc' + _textTracks.length);
        }

        track.label = track.label || track.name || track.language;

        if (!track.label) {
            track.label = 'Unknown CC';
            _unknownCount++;
            if (_unknownCount > 1) {
                track.label += ' [' + _unknownCount + ']';
            }
        }

        return track;
    }

    function _convertToVTTCues(cues) {
        // VTTCue is available natively or polyfilled everywhere except IE/Edge, which has TextTrackCue
        var VTTCue = window.VTTCue || window.TextTrackCue;
        var vttCues = _.map(cues, function (cue) {
            return new VTTCue(cue.begin, cue.end, cue.text);
        });
        return vttCues;
    }

    function _parseCuesFromText(srcContent, track) {
        require.ensure(['../parsers/captions/vttparser'], function (require) {
            var VTTParser = require('../parsers/captions/vttparser');
            var parser = new VTTParser(window);
            parser.oncue = function(cue) {
                if (_renderNatively) {
                    track.addCue(cue);
                } else {
                    track.data.push(cue);
                }
            };

            parser.onparsingerror = function(error) {
                _errorHandler(error);
            };

            parser.onflush = function() {
                // TODO: event saying track is done being parsed
            };

            parser.parse(srcContent);
            parser.flush();
        }, 'vttparser');
    }

    function _errorHandler(error) {
        utils.log('CAPTIONS(' + error + ')');
    }

    function _nativeRenderingSupported(providerName) {
        return providerName.indexOf('flash') === -1 && (utils.isChrome() || utils.isIOS() || utils.isSafari());
    }

    return Tracks;
});