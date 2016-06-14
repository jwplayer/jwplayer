define(['../utils/underscore',
        '../utils/id3Parser',
        '../utils/helpers',
        '../utils/dom'
], function(_, ID3Parser, utils, dom) {
    /**
     * Used across caterpillar, html5 and dash providers for handling text tracks actions and events
     */
    var Tracks = {
        addTracksListener: addTracksListener,
        clearTracks: clearTracks,
        disableTextTrack: disableTextTrack,
        getSubtitlesTrack: getSubtitlesTrack,
        removeTracksListener: removeTracksListener,
        setTextTracks: setTextTracks,
        setupSideloadedTracks: setupSideloadedTracks,
        setSubtitlesTrack: setSubtitlesTrack,
        textTrackChangeHandler: textTrackChangeHandler
    };

    var _textTracks = null, // subtitles and captions tracks
        _textTracksCache = null,
        _currentTextTrackIndex = -1, // captionsIndex - 1 (accounts for Off = 0 in model)
        _embeddedTrackCount = 0;

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

    function setTextTracks() {
        var tracks = this.video.textTracks;
        _currentTextTrackIndex = -1;
        if (!tracks) {
            return;
        }

        if (!_textTracks) {
            _initTextTracks();
        }

        //filter for 'subtitles' or 'captions' tracks
        if (tracks.length) {
            var i = 0, len = tracks.length;
            _embeddedTrackCount = 0;

            for (i; i < len; i++) {
                var track = tracks[i];
                if (_textTracksCache[i + track.kind]) {
                    continue;
                }
                if (track.kind === 'metadata') {
                    track.oncuechange = _cueChangeHandler.bind(this);
                    track.mode = 'showing';
                    _textTracksCache[i + track.kind] = track;

                    if (track.label === 'ID3 Metadata') {
                        _embeddedTrackCount++;
                    }
                }
                else if (track.kind === 'subtitles' || track.kind === 'captions') {
                    // By setting the track mode to 'hidden', we can determine if the 608 track has cues
                    var mode = track.mode;
                    track.mode = 'hidden';
                    if (!track.cues.length && this.getName().name === 'caterpillar' && track.label === 'Unknown CC') {
                        // There's no method to remove tracks added via: video.addTextTrack in caterpillar.
                        // This ensures the 608 captions track isn't added until it has cues
                        continue;
                    }
                    track.mode = mode;
                    _textTracks.push(track);
                    _textTracksCache[i + track.kind] = track;

                    if (track.label === 'Unknown CC') {
                        _embeddedTrackCount++;
                    }
                }
            }
        }
        this.addTracksListener(tracks, 'change', textTrackChangeHandler);
        if (_textTracks && _textTracks.length) {
            this.trigger('subtitlesTracks', {tracks: _textTracks});
        }
    }

    function setupSideloadedTracks(tracks) {
        var canRenderNatively = utils.isChrome() || utils.isIOS() || utils.isSafari();
        if (this._isSDK || !canRenderNatively || !tracks) {
            return;
        }
        // Add tracks if we're starting playback or resuming after a midroll
        if (!_tracksAlreadySideloaded.call(this,tracks)) {
            disableTextTrack();
            dom.emptyElement(this.video);
            _clearSideloadedTextTracks();
            this.itemTracks = tracks;
            _addTracks.call(this, tracks);
        }
    }

    function _tracksAlreadySideloaded(tracks) {
        // Determine if the tracks are the same and the embedded + sideloaded count = # of tracks in the controlbar
        return tracks === this.itemTracks && _textTracks &&
            _textTracks.length === (_embeddedTrackCount + this.itemTracks.length);
    }

    function _clearSideloadedTextTracks() {
        // Clear VTT textTracks
        if(!_textTracks) {
            return;
        }
        var nonVTTTracks = _.filter(_textTracks, function (track) {
            return track.label === 'Unknown CC' || track.label === 'ID3 Metadata';
        });
        _initTextTracks();
        _.each(nonVTTTracks, function (track, index) {
           _textTracksCache[index + track] = track;
        });
        _textTracks = nonVTTTracks;
    }

    function _addTracks(tracks) {
        // Adding .vtt tracks to the DOM lets the tracks API handle CC/Subtitle rendering
        if (!tracks) {
            return;
        }
        var crossoriginAnonymous = false;
        if (!_textTracks) {
            _initTextTracks();
        }
        for (var i = 0; i < tracks.length; i++) {
            var itemTrack = tracks[i];
            // only add .vtt or .webvtt files
            if (!(/\.(?:web)?vtt(?:\?.*)?$/i).test(itemTrack.file)) {
                // non-VTT tracks need to be added here so they can be displayed using the captions renderer
                _textTracks.push(itemTrack);
                _textTracksCache[i + itemTrack.kind] = track;
                continue;
            }
            // only add valid kinds https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
            if (!(/subtitles|captions|descriptions|chapters|metadata/i).test(itemTrack.kind)) {
                continue;
            }
            if (!crossoriginAnonymous) {
                // CORS applies to track loading and requires the crossorigin attribute
                if (!this.video.hasAttribute('crossorigin') && utils.crossdomain(itemTrack.file)) {
                    this.video.setAttribute('crossorigin', 'anonymous');
                    crossoriginAnonymous = true;
                }
            }
            var track = document.createElement('track');
            track.src     = itemTrack.file;
            track.kind    = itemTrack.kind;
            track.srclang = itemTrack.language || '';
            track.label   = itemTrack.label;
            track.mode    = 'disabled';
            track.id = itemTrack.default || itemTrack.defaulttrack ? 'default' : '';

            // add vtt tracks directly to the video element
            this.video.appendChild(track);
        }
    }

    function _initTextTracks() {
        _textTracks = [];
        _textTracksCache = {};
    }

    function setSubtitlesTrack (index) {
        if (!_textTracks) {
            return;
        }

        // 0 = 'Off'
        if (index === 0) {
            _.each(_textTracks, function (track) {
                track.mode = 'disabled';
            });
        }

        // Track index is 1 less than controlbar index to account for 'Off' = 0.
        // Prevent unnecessary track change events
        if (_currentTextTrackIndex === index - 1) {
            return;
        }

        // Turn off current track
        disableTextTrack();

        // Set the provider's index to the model's index, then show the selected track if it exists
        _currentTextTrackIndex = index - 1;
        if (_textTracks[_currentTextTrackIndex]) {
            _textTracks[_currentTextTrackIndex].mode = 'showing';
        }

        // Update the model index if change did not originate from controlbar or api
        this.trigger('subtitlesTrackChanged', {
            currentTrack: _currentTextTrackIndex + 1,
            tracks: _textTracks
        });
    }

    function getSubtitlesTrack() {
        return _currentTextTrackIndex;
    }

    function addTracksListener (tracks, eventType, handler) {
        handler = handler.bind(this);

        if (tracks.addEventListener) {
            tracks.addEventListener(eventType, handler);
        } else {
            tracks['on' + eventType] = handler;
        }
    }

    function removeTracksListener (tracks, eventType, handler) {
        if (!tracks) {
            return;
        }
        if (tracks.removeEventListener) {
            tracks.removeEventListener(eventType, handler);
        } else {
            tracks['on' + eventType] = null;
        }
    }

    function textTrackChangeHandler () {

        if (!_textTracks) {
            //if tracks/cues are first added after the loadeddata event...
            this.setTextTracks();
        } else {
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
    }

    function clearTracks() {
        _textTracks = null;
        _textTracksCache = null;
        _embeddedTrackCount = 0;
    }

    function disableTextTrack() {
        if (_textTracks && _textTracks[_currentTextTrackIndex]) {
            _textTracks[_currentTextTrackIndex].mode = 'disabled';
        }
    }

    return Tracks;
});