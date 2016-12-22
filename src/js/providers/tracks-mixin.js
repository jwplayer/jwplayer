define(['utils/underscore',
    'utils/id3Parser',
    'utils/helpers',
    'controller/tracks-loader',
    'controller/tracks-helper'
], function(_, ID3Parser, utils, tracksLoader, tracksHelper) {
    /**
     * Used across all providers for loading tracks and handling browser track-related events
     */
    var Tracks = {
        _itemTracks: null,
        _textTracks: null,
        _tracksById: null,
        _cuesByTrackId: null,
        _cachedVTTCues: null,
        _metaCuesByTextTime: null,
        _currentTextTrackIndex: -1,
        _unknownCount: 0,
        _activeCuePosition: null,
        _initTextTracks: _initTextTracks,
        addTracksListener: addTracksListener,
        clearTracks: clearTracks,
        disableTextTrack: disableTextTrack,
        enableTextTrack: enableTextTrack,
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
        addVTTCuesToTrack: addVTTCuesToTrack,
        renderNatively: false
    };

    function setTextTracks(tracks) {
        this._currentTextTrackIndex = -1;

        if (!tracks) {
            return;
        }

        if (!this._textTracks) {
            this._initTextTracks();
        } else {
            // Remove the 608 captions track that was mutated by the browser
            this._textTracks = _.reject(this._textTracks, function(track) {
                if ((this.renderNatively && track._id === 'nativecaptions')) {
                    delete this._tracksById[track._id];
                    return true;
                }
            }, this);

            // Remove the ID3 track from the cache
            delete this._tracksById.nativemetadata;
        }

        // filter for 'subtitles' or 'captions' tracks
        if (tracks.length) {
            var i = 0, len = tracks.length;

            for (i; i < len; i++) {
                var track = tracks[i];
                if (!track._id) {
                    if (track.kind === 'captions' || track.kind === 'metadata') {
                        track._id = 'native' + track.kind;
                        if (!track.label && track.kind === 'captions') {
                            // track label is read only in Safari
                            // 'captions' tracks without a label need a name in order for the cc menu to work
                            var labelInfo = tracksHelper.createLabel(track, this._unknownCount);
                            track.name = labelInfo.label;
                            this._unknownCount = labelInfo.unknownCount;
                        }
                    } else {
                        track._id = tracksHelper.createId(track, this._textTracks.length);
                    }
                    if (this._tracksById[track._id]) {
                        // tracks without unique ids must not be marked as "inuse"
                        continue;
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

        if (this.renderNatively) {
            // Only bind and set this.textTrackChangeHandler once so that removeEventListener works
            this.textTrackChangeHandler = this.textTrackChangeHandler || textTrackChangeHandler.bind(this);
            this.addTracksListener(this.video.textTracks, 'change', this.textTrackChangeHandler);

            if (utils.isEdge() || utils.isFF()) {
                // Listen for TextTracks added to the videotag after the onloadeddata event in Edge and Firefox
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

        if (!this.renderNatively) {
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

        if (this.renderNatively) {
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
            label = cueData.type === 'captions' ? 'Unknown CC' : 'ID3 Metadata',
            vttCue = cueData.cue;

        if (!track) {
            var itemTrack = {
                kind: cueData.type,
                _id: trackId,
                label: label,
                embedded: true
            };

            track = _createTrack.call(this, itemTrack);

            if (this.renderNatively || track.kind === 'metadata') {
                this.setTextTracks(this.video.textTracks);
            } else {
                addTextTracks.call(this, [track]);
            }
        }
        if(_cacheVTTCue.call(this, track, vttCue)) {
            if (this.renderNatively || track.kind === 'metadata') {
                _addCueToTrack(track, vttCue);
            } else {
                track.data.push(vttCue);
            }
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
        if (this.renderNatively || metadataTrack) {
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
        if (this.renderNatively) {
            // Removing listener first to ensure that removing cues does not trigger it unnecessarily
            this.removeTracksListener(this.video.textTracks, 'change', this.textTrackChangeHandler);
            _removeCues.call(this, this.video.textTracks);
        }
    }

    function disableTextTrack() {
        if (this._textTracks) {
            var track = this._textTracks[this._currentTextTrackIndex];
            if (track) {
                // FF does not remove the active cue from the dom when the track is hidden, so we must disable it
                track.mode = 'disabled';
                if (track.embedded || track._id === 'nativecaptions') {
                    track.mode = 'hidden';
                }
            }
        }
    }

    function enableTextTrack() {
        if (this._textTracks) {
            var track = this._textTracks[this._currentTextTrackIndex];
            if (track) {
                track.mode = 'showing';
            }
        }
    }

    function textTrackChangeHandler() {
        var textTracks = this.video.textTracks;
        var inUseTracks = _.filter(textTracks, function (track)  {
            return (track.inuse || !track._id) && _kindSupported(track.kind);
        });
        if (!this._textTracks || _tracksModified.call(this, inUseTracks)) {
            this.setTextTracks(textTracks);
            return;
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
        if (!this.renderNatively && this._textTracks && this._textTracks.length) {
            this.trigger('subtitlesTracks', {tracks: this._textTracks});
        }
    }

    function addVTTCuesToTrack(track, vttCues) {
        if (!this.renderNatively) {
            return;
        }

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
                // Set to disabled before hidden to ensure active cues disappear
                track.mode = 'disabled';
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
        this._cachedVTTCues = {};
        this._unknownCount = 0;
    }

    function _createTrack(itemTrack) {
        var track;
        var labelInfo = tracksHelper.createLabel(itemTrack, this._unknownCount);
        var label = labelInfo.label;
        this._unknownCount = labelInfo.unknownCount;

        if (this.renderNatively || itemTrack.kind === 'metadata') {
            var tracks = this.video.textTracks;
            // TextTrack label is read only, so we'll need to create a new track if we don't
            // already have one with the same label
            track = _.findWhere(tracks, {'label': label});

            if (track) {
                track.kind = itemTrack.kind;
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
            track._id = tracksHelper.createId(itemTrack, this._textTracks.length);
        }

        return track;
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

    function _cacheVTTCue(track, vttCue) {
        var trackKind = track.kind;
        if(!this._cachedVTTCues[track._id]) {
            this._cachedVTTCues[track._id] = {};
        }
        var cachedCues = this._cachedVTTCues[track._id],
            cacheKey;

        switch (trackKind) {
            case 'captions':
                // VTTCues should have unique start and end times, even in cases where there are multiple
                // active cues. This is safer than ensuring text is unique, which may be violated on seek.
                // Captions within .05s of each other are treated as unique to account for
                // quality switches where start/end times are slightly different.
                cacheKey = Math.floor(vttCue.startTime * 20);
                var cacheValue = Math.floor(vttCue.endTime * 20);
                var cueExists = cachedCues[cacheKey] || cachedCues[cacheKey + 1] || cachedCues[cacheKey - 1];

                if (cueExists && Math.abs(cueExists - cacheValue) <= 1) {
                    return false;
                }

                cachedCues[cacheKey] = cacheValue;
                return true;
            case 'metadata':
                var text = vttCue.data ? new Uint8Array(vttCue.data).join('') : vttCue.text;
                cacheKey = vttCue.startTime + text;
                if (cachedCues[cacheKey]) {
                    return false;
                }

                cachedCues[cacheKey] = vttCue.endTime;
                return true;
        }
    }

    function _tracksModified(inUseTracks) {
        // Need to add new textTracks coming from the video tag
        if (inUseTracks.length > this._textTracks.length) {
            return true;
        }

        // Tracks may have changed in Safari after an ad
        for (var i = 0; i < inUseTracks.length; i++) {
            var track = inUseTracks[i];
            if (!track._id || !this._tracksById[track._id]) {
                return true;
            }
        }

        return false;
    }


    function _errorHandler(error) {
        utils.log('CAPTIONS(' + error + ')');
    }

    return Tracks;
});
