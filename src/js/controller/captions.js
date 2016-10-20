define([], function() {

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

            _tracks = [];
            _tracksById = {};
            _metaCuesByTextTime = {};
            _unknownCount = 0;
            var tracks = e.tracks || [];
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                track.label = track.label || track.name || track.language;
                _addTrack(track);
            }
            var captionsMenu = _captionsMenu();
            this.setCaptionsList(captionsMenu);
            _selectDefaultIndex();
        }

        var _item = {},
            _tracks = [],
            _tracksById = {},
            _metaCuesByTextTime = {},
            _unknownCount = 0;

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

            // listen for tracks coming from the provider
            _model.mediaController.on('subtitlesTracks', _subtitlesTracksHandler, this);

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

            track.data = track.data || [];

            if (!track.label) {
                track.label = 'Unknown CC';
                _unknownCount++;
                if (_unknownCount > 1) {
                    track.label += ' (' + _unknownCount + ')';
                }
            }
            _tracks.push(track);
            _tracksById[track._id] = track;
        }

        function _captionsMenu() {
            var list = [{
                id: 'off',
                label: 'Off'
            }];
            for (var i = 0; i < _tracks.length; i++) {
                list.push({
                    id: _tracks[i]._id,
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
                } else if (track['default'] || track.defaulttrack || track._id === 'default') {
                    captionsMenuIndex = i + 1;
                } else if (track.autoselect && track.language) {
                    // auto select track by comparing track.language to browser language
                    var browserLanguage = window.navigator.language;
                    if (browserLanguage && (browserLanguage === track.language ||
                        track.language.indexOf(browserLanguage.split('-')[0]) === 0)) {
                        captionsMenuIndex = i + 1;
                    }
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
