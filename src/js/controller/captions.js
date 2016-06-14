define([
    'parsers/parsers',
    'parsers/captions/srt',
    'parsers/captions/dfxp',
    'utils/helpers'
], function(parsers, srt, dfxp, utils) {

    /** Displays closed captions or subtitles on top of the video. **/
    var Captions = function(_api, _model) {

        // Reset and load external captions on playlist item
        _model.on('change:playlistItem', _itemHandler, this);

        // Listen for captions menu index changes from the view
        _model.on('change:captionsIndex', _captionsIndexHandler, this);

        // Listen for item ready to determine which provider is in use
        _model.on('itemReady', _itemReadyHandler, this);

        // Listen for provider subtitle tracks
        //   ignoring provider "subtitlesTrackChanged" since index should be managed here
        _model.mediaController.on('subtitlesTracks', _subtitlesTracksHandler, this);

        function _subtitlesTracksHandler(e) {
            if(! e.tracks.length) {
                return;
            }
            // If we get webvtt captions, do not override with metadata captions
            _model.mediaController.off('meta', _metaHandler);

            _tracks = [];
            _tracksById = {};
            _metaCuesByTextTime = {};
            _unknownCount = 0;
            var tracks = e.tracks || [];
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                track.id = track.name;
                track.label = track.name || track.language;
                _addTrack(track);
            }
            var captionsMenu = _captionsMenu();
            this.setCaptionsList(captionsMenu);
            _selectDefaultIndex();
        }

        // Append data to subtitle tracks
        _model.mediaController.on('subtitlesTrackData', function(e) {
            var track = _tracksById[e.name];
            if (!track) {
                // Player expects that tracks were received in 'subtitlesTracks' event
                return;
            }

            track.source = e.source;
            var cues = e.captions || [];
            var sort = false;
            for (var i=0; i<cues.length; i++) {
                var cue = cues[i];
                var cueId = e.name +'_'+ cue.begin +'_'+ cue.end;
                if (!_metaCuesByTextTime[cueId]) {
                    _metaCuesByTextTime[cueId] = cue;
                    track.data.push(cue);
                    sort = true;
                }
            }
            if (sort) {
                track.data.sort(function(a, b) {
                    return a.begin - b.begin;
                });
            }
        }, this);

        // Listen for legacy Flash RTMP/MP4/608 metadata closed captions
        _model.mediaController.on('meta', _metaHandler, this);

        var _isSDK = !!_model.get('sdkplatform'),
            _item = {},
            _tracks = [],
            _tracksById = {},
            _metaCuesByTextTime = {},
            _unknownCount = 0;

        function _metaHandler (e) {
            var metadata = e.metadata;
            if (!metadata) {
                return;
            }
            if (metadata.type === 'textdata') {
                if (!metadata.text) {
                    return;
                }
                var track = _tracksById[metadata.trackid];
                if (!track) {
                    track = {
                        kind: 'captions',
                        id: metadata.trackid,
                        data: []
                    };
                    _addTrack(track);
                    var captionsMenu = _captionsMenu();
                    this.setCaptionsList(captionsMenu);
                }

                var time, cueId;

                if (metadata.useDTS) {
                    // There may not be any 608 captions when the track is first created
                    // Need to set the source so position is determined from metadata
                    if(!track.source) {
                        track.source = metadata.source || 'mpegts';
                    }
                    time = metadata.begin;
                    cueId = metadata.begin + '_' + metadata.text;
                } else {
                    time = e.position || _model.get('position');
                    cueId = '' + Math.round(time * 10) + '_' + metadata.text;
                }

                var cue = _metaCuesByTextTime[cueId];
                if (!cue) {
                    cue = {
                        begin: time,
                        text: metadata.text
                    };
                    if(metadata.end) {
                        cue.end = metadata.end;
                    }
                    _metaCuesByTextTime[cueId] = cue;
                    track.data.push(cue);
                }
            }
        }
        function _errorHandler(error) {
            utils.log('CAPTIONS(' + error + ')');
        }

        /** Listen to playlist item updates. **/
        function _itemHandler(model, item) {
            _item = item;
            _tracks = [];
            _tracksById = {};
            _metaCuesByTextTime = {};
            _unknownCount = 0;
        }

        function _itemReadyHandler(item) {
            // Clean up in case we're replaying
            _itemHandler(_model,item);

            _model.mediaController.off('meta', _metaHandler);
            _model.mediaController.off('subtitlesTracks', _subtitlesTracksHandler);

            var tracks = item.tracks,
                track, kind, isVTT, i;
            var isFlash = _model.get('provider').name === 'flash';

            var canRenderNatively = utils.isChrome() || utils.isIOS() || utils.isSafari();

            for (i = 0; i < tracks.length; i++) {
                track = tracks[i];
                isVTT = track.file && (/\.(?:web)?vtt(?:\?.*)?$/i.test(track.file));

                // let the browser handle rendering sideloaded VTT tracks natively when supported
                if(!isFlash && isVTT && !_isSDK && canRenderNatively) {
                    continue;
                }

                kind = track.kind.toLowerCase();

                if (kind === 'captions' || kind === 'subtitles') {
                    if (track.file) {
                        _addTrack(track);
                        _load(track);
                    } else if (track.data) {
                        _addTrack(track);
                    }
                }
            }

            // only listen for other captions if there are no side loaded captions
            if (!_tracks.length) {
                _model.mediaController.on('meta', _metaHandler, this);
                _model.mediaController.on('subtitlesTracks', _subtitlesTracksHandler, this);
            }
            var captionsMenu = _captionsMenu();
            this.setCaptionsList(captionsMenu);
            _selectDefaultIndex();
        }

        function _captionsIndexHandler(model, captionsMenuIndex) {
            var track = null;
            if (captionsMenuIndex !== 0) {
                track = _tracks[captionsMenuIndex-1];
            }
            model.set('captionsTrack', track);
        }

        function _addTrack(track) {
            if(typeof track.id !== 'number') {
                track.id = track.name || track.file || ('cc' + _tracks.length);
            }

            track.data = track.data || [];

            if (!track.label) {
                track.label = 'Unknown CC';
                _unknownCount++;
                if (_unknownCount > 1) {
                    track.label += ' (' + _unknownCount + ')';
                }
            }
            _tracks.push(track);
            _tracksById[track.id] = track;
        }

        function _load(track) {
            utils.ajax(track.file, function(xhr) {
                _xhrSuccess(xhr, track);
            }, _errorHandler);
        }

        function _xhrSuccess(xhr, track) {
            var rss = xhr.responseXML ? xhr.responseXML.firstChild : null;

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
                    track.data = dfxp(xhr.responseXML);
                } else {
                    track.data = srt(xhr.responseText);
                }
            } catch(error) {
                _errorHandler(error.message + ': ' + track.file);
            }
        }

        function _captionsMenu() {
            var list = [{
                id: 'off',
                label: 'Off'
            }];
            for (var i = 0; i < _tracks.length; i++) {
                list.push({
                    id: _tracks[i].id,
                    label: _tracks[i].label || 'Unknown CC'
                });
            }
            return list;
        }

        function _selectDefaultIndex() {
            var captionsMenuIndex = 0;
            var label = _model.get('captionLabel');

            // Because there is no explicit track for "Off"
            //  it is the implied zeroth track
            if (label === 'Off') {
                _model.set('captionsIndex', 0);
                return;
            }

            for (var i = 0; i < _tracks.length; i++) {
                var track = _tracks[i];
                if (label && label === track.label) {
                    captionsMenuIndex = i + 1;
                    break;
                } else if (track['default'] || track.defaulttrack || track.id === 'default') {
                    captionsMenuIndex = i + 1;
                } else if (track.autoselect) {
                    // TODO: auto select track by comparing track.language to system lang
                }
            }
            // set the index without the side effect of storing the Off label in _selectCaptions
            _setCurrentIndex(captionsMenuIndex);
        }

        function _setCurrentIndex (index) {
            if(_tracks.length) {
                _model.setVideoSubtitleTrack(index, _tracks);
            } else {
                _model.set('captionsIndex', index);
            }
        }

        this.getCurrentIndex = function() {
            return _model.get('captionsIndex');
        };

        this.getCaptionsList = function() {
            return _model.get('captionsList');
        };

        this.setCaptionsList = function(captionsMenu) {
            _model.set('captionsList', captionsMenu);
        };
    };

    return Captions;
});
