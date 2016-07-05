define(['../utils/underscore',
    '../utils/id3Parser',
    '../utils/helpers',
    '../parsers/parsers',
    '../parsers/captions/srt',
    '../parsers/captions/dfxp'
], function(_, ID3Parser, utils, parsers, srt, dfxp) {
    /**
     * Used across all providers for loading tracks and handling browser track-related events
     */
    var Tracks = {
        _textTracks: null,
        _tracksById: null,
        _cuesByTrackId: null,
        _metaCuesByTextTime: null,
        _currentTextTrackIndex: -1,
        _unknownCount: 0,
        _renderNatively: false,
        _activeCuePosition: null,
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
        addCuesToTrack: addCuesToTrack,
        addCaptionsCue: addCaptionsCue,
        addVTTCue: addVTTCue
    };

    function setTextTracks(tracks) {
        this._currentTextTrackIndex = -1;

        if (!tracks) {
            return;
        }

        if (!this._textTracks) {
            _initTextTracks.call(this);
        }

        // filter for 'subtitles' or 'captions' tracks
        if (tracks.length) {
            var i = 0, len = tracks.length;

            for (i; i < len; i++) {
                var track = tracks[i];
                if (!track._id) {
                    track._id = createTrackId.call(this, track);
                    track.inuse = true;
                }
                if (!track.inuse || this._tracksById[track._id]) {
                    continue;
                }
                // setup TextTrack
                if (track.kind === 'metadata') {
                    track.mode = 'showing';
                    track.oncuechange = _cueChangeHandler.bind(this);
                    this._tracksById[track._id] = track;
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
                    if (this._cuesByTrackId[track._id] && !this._cuesByTrackId[track._id].loaded) {
                        var cues = this._cuesByTrackId[track._id].cues;
                        while((cue = cues.pop())) {
                            track.addCue(cue);
                        }
                        track.mode = mode;
                        this._cuesByTrackId[track._id].loaded = true;
                    }

                    _addTrackToList.call(this, track);
                }
            }
        }

        if (this._textTracks) {
            if (this._renderNatively) {
                this.addTracksListener(this._textTracks, 'change', textTrackChangeHandler.bind(this));
            }
            if (this._textTracks.length) {
                this.trigger('subtitlesTracks', {tracks: this._textTracks});
            }
        }
    }

    function setupSideloadedTracks(tracks) {
        this._renderNatively = _nativeRenderingSupported(this.getName().name);
        if (this.isSDK || !tracks) {
            return;
        }

        if (!_tracksAlreadySideloaded.call(this, tracks)) {
            // Add tracks if we're starting playback or resuming after a midroll
            if (this._renderNatively) {
                disableTextTrack.call(this);
                _clearSideloadedTextTracks.call(this);
            }
            this.itemTracks = tracks;
            addTextTracks.call(this, tracks);
        }
    }

    function getSubtitlesTrack() {
        return this._currentTextTrackIndex;
    }

    function setSubtitlesTrack(menuIndex) {
        if (!this._textTracks) {
            return;
        }

        // 0 = 'Off'
        if (menuIndex === 0) {
            _.each(this._textTracks, function (track) {
                track.mode = 'disabled';
            });
        }

        // Track index is 1 less than controlbar index to account for 'Off' = 0.
        // Prevent unnecessary track change events
        if (this._currentTextTrackIndex === menuIndex - 1) {
            return;
        }

        // Turn off current track
        disableTextTrack.call(this);

        // Set the provider's index to the model's index, then show the selected track if it exists
        this._currentTextTrackIndex = menuIndex - 1;

        if (this._renderNatively) {
            if (this._textTracks[this._currentTextTrackIndex]) {
                this._textTracks[this._currentTextTrackIndex].mode = 'showing';
            }

            // Update the model index since the track change may have come from a browser event
            this.trigger('subtitlesTrackChanged', {
                currentTrack: this._currentTextTrackIndex + 1,
                tracks: this._textTracks
            });
        }
    }

    function addCaptionsCue(cueData) {
        if (!cueData.text) {
            return;
        }
        var trackId = cueData.trackid.toString();
        var track = this._tracksById && this._tracksById[trackId];
        if (!track) {
            this._renderNatively = _nativeRenderingSupported(this.getName().name);
            track = {
                kind: 'captions',
                _id: trackId,
                data: []
            };
            addTextTracks.call(this, [track]);
            this.trigger('subtitlesTracks', {tracks: this._textTracks});
        }

        var time, cueId;

        if (cueData.useDTS) {
            // There may not be any 608 captions when the track is first created
            // Need to set the source so position is determined from metadata
            if(!track.source) {
                track.source = cueData.source || 'mpegts';
            }

        }
        time = cueData.begin;
        cueId = cueData.begin + '_' + cueData.text;

        var cue = this._metaCuesByTextTime[cueId];
        if (!cue) {
            cue = {
                begin: time,
                text: cueData.text
            };
            if(cueData.end) {
                cue.end = cueData.end;
            }
            this._metaCuesByTextTime[cueId] = cue;
            var vttCue = _convertToVTTCues([cue])[0];
            track.data.push(vttCue);
        }
    }

    function addVTTCue(cueData) {

        var trackId = 'native' + cueData.type,
            track = this._tracksById[trackId],
            label = cueData.type === 'captions' ? 'Unknown CC' : 'ID3 Metadata';

        if (!track) {
            this._renderNatively = _nativeRenderingSupported(this.getName().name);
            var itemTrack = {
                kind: cueData.type,
                _id: trackId,
                label: label,
                embedded: true
            };
            track = _createTrack.call(this, itemTrack);
            this.setTextTracks(this.video.textTracks);
        }
        track.addCue(cueData.cue);
    }

    function addCuesToTrack(cueData) {
        // convert cues coming from the flash provider into VTTCues, then append them to track
        var track = this._tracksById[cueData.name];
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
            if (!this._metaCuesByTextTime[cueId]) {
                this._metaCuesByTextTime[cueId] = cue;
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
        if (!tracks) {
            return;
        }

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
        this._textTracks = null;
        this._tracksById = null;
        this._cuesByTrackId = null;
        this._metaCuesByTextTime = null;
        this._unknownCount = 0;
        this._activeCuePosition = null;
        if (this._renderNatively) {
            _removeCues.call(this, this.video.textTracks);
        }
        this._renderNatively = false;
    }

    function disableTextTrack() {
        if (this._textTracks && this._textTracks[this._currentTextTrackIndex]) {
            this._textTracks[this._currentTextTrackIndex].mode = 'disabled';
        }
    }

    function textTrackChangeHandler() {

        if (!this._textTracks || this.video.textTracks.length > this._textTracks.length) {
            // If the video element has more tracks than we have internally..
            this.setTextTracks.call(this, this.video.textTracks);
        }
        // if a caption/subtitle track is showing, find its index
        var _selectedTextTrackIndex = -1, i = 0;
        for (i; i < this._textTracks.length; i++) {
            if (this._textTracks[i].mode === 'showing') {
                _selectedTextTrackIndex = i;
                break;
            }
        }
        this.setSubtitlesTrack.call(this, _selectedTextTrackIndex + 1);
    }

    function addTextTracks(tracks) {
        if (!tracks) {
            return;
        }

        if (!this._textTracks) {
            _initTextTracks.call(this);
        }

        this._renderNatively = _nativeRenderingSupported(this.getName().name);

        for (var i = 0; i < tracks.length; i++) {
            var itemTrack = tracks[i];
            // only add valid kinds https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
            if (this._renderNatively && !(/subtitles|captions|descriptions|chapters|metadata/i).test(itemTrack.kind)) {
                continue;
            }
            var track = _createTrack.call(this, itemTrack);
            _addTrackToList.call(this, track);
            if (itemTrack.file) {
                _parseTrack.call(this, itemTrack, track);
            }
        }

        // We can setup the captions menu now since we're not rendering textTracks natively
        if (!this._renderNatively && this._textTracks && this._textTracks.length) {
            this.trigger('subtitlesTracks', {tracks: this._textTracks});
        }
    }

    function createTrackId(track) {
        var trackId;
        var prefix = track.kind || 'cc';
        if (track.default || track.defaulttrack) {
            trackId = 'default';
        } else {
            trackId = track._id || track.name || track.file || (prefix + this._textTracks.length);
        }
        return trackId;
    }

    //////////////////////
    ////// PRIVATE METHODS
    //////////////////////

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

    function _nativeRenderingSupported(providerName) {
        return providerName.indexOf('flash') === -1 && (utils.isChrome() || utils.isIOS() || utils.isSafari());
    }

    function _initTextTracks() {
        this._textTracks = [];
        this._tracksById = {};
        this._metaCuesByTextTime = {};
        this._cuesByTrackId = {};
        this._unknownCount = 0;
        this._renderNatively = false;
    }

    function _createTrack(itemTrack) {
        var track;
        if (this._renderNatively) {
            var tracks = this.video.textTracks;
            track = _.findWhere(tracks, {'_id': itemTrack.file});
            if (track) {
                track.kind = itemTrack.kind;
                track.label = itemTrack.label;
                track.default = itemTrack.default;
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

        if (!track._id) {
            track._id = createTrackId.call(this, itemTrack);
        }

        track.label = track.label || track.name || track.language;

        if (!track.label) {
            track.label = 'Unknown CC';
            this._unknownCount++;
            if (this._unknownCount > 1) {
                track.label += ' [' + this._unknownCount + ']';
            }
        }

        return track;
    }

    function _addTrackToList(track) {
        this._textTracks.push(track);
        this._tracksById[track._id] = track;
    }

    function _parseTrack(itemTrack, track) {
        utils.ajax(itemTrack.file, function(xhr) {
            _xhrSuccess.call(this, xhr, track);
        }.bind(this), _errorHandler);
    }

    function _tracksAlreadySideloaded(tracks) {
        // Determine if the currently chosen track is removed and disabled
        var textTracks = this._textTracks;
        var index = this._currentTextTrackIndex;
        var disabled = false;
        if (textTracks && textTracks[index]) {
            disabled = textTracks[index].mode === 'disabled';
        }
        // Determine if the tracks are the same and the embedded + sideloaded count = # of tracks in the controlbar
        return tracks === this.itemTracks && textTracks && textTracks.length >= tracks.length && !disabled;
    }

    function _clearSideloadedTextTracks() {
        // Clear VTT textTracks
        if (!this._textTracks) {
            return;
        }
        var nonSideloadedTracks = _.filter(this._textTracks, function (track) {
            return track.embedded || track.groupid === 'subs';
        });
        _initTextTracks.call(this);
        _.each(nonSideloadedTracks, function (track) {
            this._tracksById[track._id] = track;
        });
        this._textTracks = nonSideloadedTracks;
    }

    function _addVTTCuesToTrack(track, vttCues) {
        if (this._renderNatively) {
            var textTrack = this._tracksById[track._id];
            // the track may not be on the video tag yet
            if (!textTrack) {

                if (!this._cuesByTrackId) {
                    this._cuesByTrackId = {};
                }
                this._cuesByTrackId[track._id] = { cues: vttCues, loaded: false};
                return;
            }
            // Cues already added
            if (this._cuesByTrackId[track._id] && this._cuesByTrackId[track._id].loaded) {
                return;
            }

            var cue;
            this._cuesByTrackId[track._id] = { cues: vttCues, loaded: true };

            while((cue = vttCues.pop())) {
                textTrack.addCue(cue);
            }
        } else {
            track.data = vttCues;
        }
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
                if (this._renderNatively) {
                    track.addCue(cue);
                } else {
                    track.data = track.data || [];
                    track.data.push(cue);
                }
            }.bind(this);

            parser.onparsingerror = function(error) {
                _errorHandler(error);
            };

            parser.onflush = function() {
                // TODO: event saying track is done being parsed
            };

            parser.parse(srcContent);
            parser.flush();
        }.bind(this), 'vttparser');
    }

    function _cueChangeHandler(e) {
        var activeCues = e.currentTarget.activeCues;
        if (!activeCues || !activeCues.length) {
            return;
        }

        // Get the most recent start time. Cues are sorted by start time in ascending order by the browser
        var startTime = activeCues[activeCues.length - 1].startTime;
        //Prevent duplicate meta events for the same list of cues since the cue change handler fires once
        // for each activeCue in Safari
        if (this._activeCuePosition === startTime) {
            return;
        }
        var dataCues = [];

        _.each(activeCues, function(cue) {
            if (cue.startTime < startTime) {
                return;
            }
            if (cue.data || cue.value) {
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
        this._activeCuePosition = startTime;
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
                    _addVTTCuesToTrack.call(this, track, vttCues);
                }.bind(this));
            } else {
                // parse VTT/SRT track
                status = utils.tryCatch(function () {
                    var responseText = xhr.responseText;
                    if (responseText.indexOf('WEBVTT') >= 0) {
                        // make VTTCues from VTT track
                        _parseCuesFromText.call(this, xhr.responseText, track);
                    } else {
                        // make VTTCues from SRT track
                        var cues = srt(xhr.responseText);
                        var vttCues = _convertToVTTCues(cues);
                        _addVTTCuesToTrack.call(this, track, vttCues);
                    }
                }.bind(this));
            }
        } catch (error) {
            if (status instanceof utils.Error) {
                _errorHandler(status.message + ': ' + track.file);
            }
        }
    }

    function _errorHandler(error) {
        utils.log('CAPTIONS(' + error + ')');
    }

    return Tracks;
});