define(['../utils/underscore',
    '../utils/id3Parser',
    '../utils/helpers',
    '../utils/nativerenderingsupported',
    '../controller/tracksLoader'
], function(_, ID3Parser, utils, nativeRenderingSupported, tracksLoader) {
    /**
     * Used across all providers for loading tracks and handling browser track-related events
     */
    var Tracks = {
        _itemTracks: null,
        _textTracks: null,
        _tracksById: null,
        _cuesByTrackId: null,
        _metaCuesByTextTime: null,
        _currentTextTrackIndex: -1,
        _unknownCount: 0,
        _renderNatively: false,
        _activeCuePosition: null,
        _initTextTracks: _initTextTracks,
        addTracksListener: addTracksListener,
        clearTracks: clearTracks,
        disableTextTrack: disableTextTrack,
        getSubtitlesTrack: getSubtitlesTrack,
        removeTracksListener: removeTracksListener,
        addTextTracks: addTextTracks,
        setTextTracks: setTextTracks,
        setupSideloadedTracks: setupSideloadedTracks,
        setSubtitlesTrack: setSubtitlesTrack,
        textTrackChangeHandler: null,
        addTrackHandler: null,
        addCuesToTrack: addCuesToTrack,
        addCaptionsCue: addCaptionsCue,
        addVTTCue: addVTTCue,
        addVTTCuesToTrack: addVTTCuesToTrack
    };

    function setTextTracks(tracks) {
        this._currentTextTrackIndex = -1;

        if (!tracks) {
            return;
        }

        if (!this._textTracks) {
            this._initTextTracks();
        }

        // filter for 'subtitles' or 'captions' tracks
        if (tracks.length) {
            var i = 0, len = tracks.length;

            for (i; i < len; i++) {
                var track = tracks[i];
                if (!track._id) {
                    if (track.kind === 'captions' || track.kind === 'metadata') {
                        track._id = 'native' + track.kind;
                    } else {
                        track._id = createTrackId.call(this, track);
                    }
                    track.inuse = true;
                }
                if (!track.inuse || this._tracksById[track._id]) {
                    continue;
                }
                // setup TextTrack
                if (track.kind === 'metadata') {
                    // track mode needs to be "hidden", not "showing", so that cues don't display as captions in Firefox
                    track.mode = 'hidden';
                    track.oncuechange = _cueChangeHandler.bind(this);
                    this._tracksById[track._id] = track;
                }
                else if (_kindSupported(track.kind)) {
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
                        while ((cue = cues.shift())) {
                            _addCueToTrack(track, cue);
                        }
                        track.mode = mode;
                        this._cuesByTrackId[track._id].loaded = true;
                    }

                    _addTrackToList.call(this, track);
                }
            }
        }

        if (this._renderNatively) {
            // Only bind and set this.textTrackChangeHandler once so that removeEventListener works
            this.textTrackChangeHandler = this.textTrackChangeHandler || textTrackChangeHandler.bind(this);
            this.addTracksListener(this.video.textTracks, 'change', this.textTrackChangeHandler);

            if (utils.isEdge()) {
                // Listen for TextTracks added to the videotag after the onloadeddata event in Edge
                this.addTrackHandler = this.addTrackHandler || addTrackHandler.bind(this);
                this.addTracksListener(this.video.textTracks, 'addtrack', this.addTrackHandler);
            }
        }

        if (this._textTracks.length) {
            this.trigger('subtitlesTracks', {tracks: this._textTracks});
        }
    }

    function setupSideloadedTracks(itemTracks) {
        // Add tracks if we're starting playback or resuming after a midroll
        this._renderNatively = nativeRenderingSupported(this.getName().name);

        if (!this._renderNatively) {
            return;
        }
        // Determine if the tracks are the same and the embedded + sideloaded count = # of tracks in the controlbar
        var alreadyLoaded = itemTracks === this._itemTracks;
        if (!alreadyLoaded) {
            tracksLoader.cancelXhr(this._itemTracks);
        }
        this._itemTracks = itemTracks;
        if (!itemTracks) {
            return;
        }

        if (!alreadyLoaded) {
            this.disableTextTrack();
            _clearSideloadedTextTracks.call(this);
            this.addTextTracks(itemTracks);
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
                track.mode = track.embedded ? 'hidden' : 'disabled';
            });
        }

        // Track index is 1 less than controlbar index to account for 'Off' = 0.
        // Prevent unnecessary track change events
        if (this._currentTextTrackIndex === menuIndex - 1) {
            return;
        }

        // Turn off current track
        this.disableTextTrack();

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
        if (!cueData.text || !cueData.begin || !cueData.end) {
            return;
        }
        var trackId = cueData.trackid.toString();
        var track = this._tracksById && this._tracksById[trackId];
        if (!track) {
            track = {
                kind: 'captions',
                _id: trackId,
                data: []
            };
            this.addTextTracks([track]);
            this.trigger('subtitlesTracks', {tracks: this._textTracks});
        }

        var cueId;

        if (cueData.useDTS) {
            // There may not be any 608 captions when the track is first created
            // Need to set the source so position is determined from metadata
            if (!track.source) {
                track.source = cueData.source || 'mpegts';
            }

        }
        cueId = cueData.begin + '_' + cueData.text;

        var cue = this._metaCuesByTextTime[cueId];
        if (!cue) {
            cue = {
                begin: cueData.begin,
                end: cueData.end,
                text: cueData.text
            };
            this._metaCuesByTextTime[cueId] = cue;
            var vttCue = tracksLoader.convertToVTTCues([cue])[0];
            track.data.push(vttCue);
        }
    }

    function addVTTCue(cueData) {
        if (!this._tracksById) {
            this._initTextTracks();
        }

        var trackId = 'native' + cueData.type,
            track = this._tracksById[trackId],
            label = cueData.type === 'captions' ? 'Unknown CC' : 'ID3 Metadata';

        if (!track) {
            var itemTrack = {
                kind: cueData.type,
                _id: trackId,
                label: label,
                embedded: true
            };
            track = _createTrack.call(this, itemTrack);
            if (this._renderNatively || track.kind === 'metadata') {
                this.setTextTracks(this.video.textTracks);
            } else {
                track.data = [];
                addTextTracks.call(this, [track]);
            }
        }

        if (this._renderNatively || track.kind === 'metadata') {
            _addCueToTrack(track, cueData.cue);
        } else {
            track.data.push(cueData.cue);
        }
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
        var vttCues = tracksLoader.convertToVTTCues(cuesToConvert);
        Array.prototype.push.apply(track.data, vttCues);
    }

    function addTracksListener(tracks, eventType, handler) {
        if (!tracks) {
            return;
        }
        // Always remove existing listener
        removeTracksListener(tracks, eventType, handler);

        if (this.instreamMode) {
            return;
        }

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
        tracksLoader.cancelXhr(this._itemTracks);
        var metadataTrack = this._tracksById && this._tracksById.nativemetadata;
        if (this._renderNatively || metadataTrack) {
            _removeCues.call(this, this.video.textTracks);
            if(metadataTrack) {
               metadataTrack.oncuechange = null;
            }
        }
        this._itemTracks = null;
        this._textTracks = null;
        this._tracksById = null;
        this._cuesByTrackId = null;
        this._metaCuesByTextTime = null;
        this._unknownCount = 0;
        this._activeCuePosition = null;
        if (this._renderNatively) {
            // Removing listener first to ensure that removing cues does not trigger it unnecessarily
            this.removeTracksListener(this.video.textTracks, 'change', this.textTrackChangeHandler);
            _removeCues.call(this, this.video.textTracks);
        }
    }

    function disableTextTrack() {
        if (this._textTracks) {
            var track = this._textTracks[this._currentTextTrackIndex];
            if (track) {
                track.mode = track.embedded ? 'hidden' : 'disabled';
            }
        }
    }

    function textTrackChangeHandler() {
        var textTracks = this.video.textTracks;
        var inUseTracks = _.filter(textTracks, function (track)  {
            return (track.inuse || !track._id) && _kindSupported(track.kind);
        });
        if (!this._textTracks || inUseTracks.length > this._textTracks.length) {
            // If the video element has more tracks than we have internally..
            this.setTextTracks(textTracks);
        }
        // If a caption/subtitle track is showing, find its index
        var selectedTextTrackIndex = -1, i = 0;
        for (i; i < this._textTracks.length; i++) {
            if (this._textTracks[i].mode === 'showing') {
                selectedTextTrackIndex = i;
                break;
            }
        }
        // Notifying the model when the index changes keeps the current index in sync in iOS Fullscreen mode
        if (selectedTextTrackIndex !== this._currentTextTrackIndex) {
            this.setSubtitlesTrack(selectedTextTrackIndex + 1);
        }
    }

    // Used in MS Edge to get tracks from the videotag as they're added
    function addTrackHandler() {
        this.setTextTracks(this.video.textTracks);
    }

    function addTextTracks(tracksArray) {
        if (!tracksArray) {
            return;
        }

        if (!this._textTracks) {
            this._initTextTracks();
        }

        this._renderNatively = nativeRenderingSupported(this.getName().name);

        for (var i = 0; i < tracksArray.length; i++) {
            var itemTrack = tracksArray[i];
            // only add valid and supported kinds https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
            if (itemTrack.kind && !_kindSupported(itemTrack.kind)) {
                continue;
            }
            var textTrackAny = _createTrack.call(this, itemTrack);
            _addTrackToList.call(this, textTrackAny);
            if (itemTrack.file) {
                itemTrack.data = [];
                tracksLoader.loadFile(itemTrack,
                    this.addVTTCuesToTrack.bind(this, textTrackAny),
                    _errorHandler);
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
            trackId = track._id|| track.name || track.file || track.label || (prefix + this._textTracks.length);
        }
        return trackId;
    }

    function addVTTCuesToTrack(track, vttCues) {
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

            while((cue = vttCues.shift())) {
                _addCueToTrack(textTrack, cue);
            }
        } else {
            track.data = vttCues;
        }
    }

    //////////////////////
    ////// PRIVATE METHODS
    //////////////////////

    function _addCueToTrack(track, vttCue) {
        if (!utils.isEdge() || !window.TextTrackCue) {
            track.addCue(vttCue);
            return;
        }
        // There's no support for the VTTCue interface in Edge / IE11.
        // We need to convert VTTCue to TextTrackCue before adding them to the TextTrack
        // This unfortunately removes positioning properties from the cues
        var textTrackCue = new window.TextTrackCue(vttCue.startTime, vttCue.endTime, vttCue.text);
        track.addCue(textTrackCue);
    }

    function _removeCues(tracks) {
        if (tracks.length) {
            _.each(tracks, function(track) {
                // Cues are inaccessible if the track is disabled. While hidden,
                // we can remove cues while the track is in a non-visible state
                track.mode = 'hidden';
                for (var i = track.cues.length; i--;) {
                    track.removeCue(track.cues[i]);
                }
                if (!track.embedded) {
                    track.mode = 'disabled';
                }
                track.inuse = false;
            });
        }
    }

    function _kindSupported(kind) {
        return kind === 'subtitles' || kind === 'captions';
    }

    function _initTextTracks() {
        this._textTracks = [];
        this._tracksById = {};
        this._metaCuesByTextTime = {};
        this._cuesByTrackId = {};
        this._unknownCount = 0;
    }

    function _createTrack(itemTrack) {
        var track;
        var label = _createLabel.call(this, itemTrack);
        if (this._renderNatively || itemTrack.kind === 'metadata') {
            var tracks = this.video.textTracks;
            // TextTrack label is read only, so we'll need to create a new track if we don't
            // already have one with the same label
            track = _.findWhere(tracks, {'label': label});

            if (track) {
                track.kind = itemTrack.kind;
                track.label = label;
                track.language = itemTrack.language || '';
            } else {
                track = this.video.addTextTrack(itemTrack.kind, label, itemTrack.language || '');
            }
            track.default = itemTrack.default;
            track.mode    = 'disabled';
            track.inuse = true;
        } else {
            track = itemTrack;
            track.data = track.data || [];
        }

        if (!track._id) {
            track._id = createTrackId.call(this, itemTrack);
        }

        return track;
    }

    function _createLabel(track) {
        var label = track.label || track.name || track.language;
        if (!label) {
            label = 'Unknown CC';
            this._unknownCount++;
            if (this._unknownCount > 1) {
                label += ' [' + this._unknownCount + ']';
            }
        }
        return label;
    }

    function _addTrackToList(track) {
        this._textTracks.push(track);
        this._tracksById[track._id] = track;
    }

    function _clearSideloadedTextTracks() {
        // Clear VTT textTracks
        if (!this._textTracks) {
            return;
        }
        var nonSideloadedTracks = _.filter(this._textTracks, function (track) {
            return track.embedded || track.groupid === 'subs';
        });
        this._initTextTracks();
        _.each(nonSideloadedTracks, function (track) {
            this._tracksById[track._id] = track;
        });
        this._textTracks = nonSideloadedTracks;
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

    function _errorHandler(error) {
        utils.log('CAPTIONS(' + error + ')');
    }

    return Tracks;
});
