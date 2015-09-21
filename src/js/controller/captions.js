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

        // Listen for provider subtitle tracks
        //   ignoring provider "subtitlesTrackChanged" since index should be managed here
        _model.mediaController.on('subtitlesTracks', function(e) {
            if(! e.tracks.length) {
                return;
            }

            // If we get webvtt captions, do not override with metadata captions
            _model.mediaController.off('meta');

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
        }, this);

        // Append data to subtitle tracks
        _model.mediaController.on('subtitlesTrackData', function(e) {
            var track = _tracksById[e.name];
            if (!track) {
                // Player expects that tracks were received in 'subtitlesTracks' event
                return;
            }
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
        _model.mediaController.on('meta', function(e) {
            var metadata = e.metadata;
            if (!metadata) {
                return;
            }
            if (metadata.type === 'textdata') {
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
                var time = e.position || _model.get('position');
                var cueId = '' + Math.round(time * 10) + '_' + metadata.text;
                var cue = _metaCuesByTextTime[cueId];
                if (!cue) {
                    cue = {
                        begin: time,
                        text: metadata.text
                    };
                    _metaCuesByTextTime[cueId] = cue;
                    track.data.push(cue);
                }
            }
        }, this);

        var _tracks = [],
            _tracksById = {},
            _metaCuesByTextTime = {},
            _unknownCount = 0;

        function _errorHandler(error) {
            utils.log('CAPTIONS(' + error + ')');
        }

        /** Listen to playlist item updates. **/
        function _itemHandler(model, item) {
            _tracks = [];
            _tracksById = {};
            _metaCuesByTextTime = {};
            _unknownCount = 0;

            var tracks = item.tracks,
                track, kind, i;

            for (i = 0; i < tracks.length; i++) {
                track = tracks[i];
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

            var captionsMenu = _captionsMenu();
            this.setCaptionsList(captionsMenu);
            _selectDefaultIndex();
        }

        function _captionsIndexHandler(model, captionsMenuIndex) {
            if (captionsMenuIndex === 0) {
                _setCaptionsTrack(model, null);
                return;
            }
            _setCaptionsTrack(model, _tracks[captionsMenuIndex-1]);
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
            utils.ajax(track.file, function(xmlEvent) {
                _xmlReadHandler(xmlEvent, track);
            }, _xmlFailedHandler, true);
        }

        function _xmlReadHandler(xmlEvent, track) {
            var rss = xmlEvent.responseXML ? xmlEvent.responseXML.firstChild : null,
                status;

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
            if (rss && parsers.localName(rss) === 'tt') {
                status = utils.tryCatch(function() {
                    track.data = dfxp(xmlEvent.responseXML);
                });
            } else {
                status = utils.tryCatch(function() {
                    track.data = srt(xmlEvent.responseText);
                });
            }
            if (status instanceof utils.Error) {
                _errorHandler(status.message + ': ' + track.file);
            }
        }

        function _xmlFailedHandler(message) {
            _errorHandler(message);
        }

        function _setCaptionsTrack(model, track) {
            model.set('captionsTrack', track);

            if (track) {
                // update preference if an option was selected
                model.set('captionLabel', track.label);
            } else {
                model.set('captionLabel', 'Off');
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
                    label: _tracks[i].label
                });
            }
            return list;
        }

        function _selectDefaultIndex() {
            var captionsMenuIndex = 0;
            var label = _model.get('captionLabel');
            for (var i = 0; i < _tracks.length; i++) {
                var track = _tracks[i];
                if (label && label === track.label) {
                    captionsMenuIndex = i + 1;
                    break;
                } else if (track['default'] || track.defaulttrack) {
                    captionsMenuIndex = i + 1;
                } else if (track.autoselect) {
                    // TODO: auto select track by comparing track.language to system lang
                }
            }

            // set the index without the side effect of storing the Off label in _selectCaptions
            _model.set('captionsIndex', captionsMenuIndex);
        }

        this.getCurrentIndex = function() {
            return _model.get('captionsIndex');
        };

        this.getCaptionsList = function() {
            return _model.get('captionsList');
        };

        this.setCurrentIndex = function(captionsMenuIndex) {
            _api.setCurrentCaptions(captionsMenuIndex);
        };

        this.setCaptionsList = function(captionsMenu) {
            _model.set('captionsList', captionsMenu);
        };
    };

    return Captions;
});
