define([
    'parsers/parsers',
    'parsers/captions/parsers.srt',
    'parsers/captions/parsers.dfxp',
    'utils/helpers'
], function(parsers, SrtParser, DfxpParser, utils) {

    /** Displays closed captions or subtitles on top of the video. **/
    var Captions = function(_model) {

        _model.on('change:playlistItem', _itemHandler, this);

        var _tracks = [],

            /** Counter for downloading all the tracks **/
            _dlCount = 0,
            /** Selected track still loading **/
            _waiting = -1;

        function _errorHandler(error) {
            utils.log('CAPTIONS(' + error + ')');
        }

        /** Listen to playlist item updates. **/
        function _itemHandler(model, item) {
            _tracks = [];
            _dlCount = 0;

            var tracks = item.tracks,
                captions = [],
                i,
                label,
                defaultTrack = 0,
                file = '';

            for (i = 0; i < tracks.length; i++) {
                var kind = tracks[i].kind.toLowerCase();
                if (kind === 'captions' || kind === 'subtitles') {
                    captions.push(tracks[i]);
                }
            }

            for (i = 0; i < captions.length; i++) {
                file = captions[i].file;
                if (file) {
                    if (!captions[i].label) {
                        captions[i].label = i.toString();

                    }
                    _tracks.push(captions[i]);
                    _load(_tracks[i].file, i);
                }
            }

            for (i = 0; i < _tracks.length; i++) {
                if (_tracks[i]['default']) {
                    defaultTrack = i + 1;
                    break;
                }
            }

            label = _model.get('captionLabel');

            var captionsMenu = _captionsMenu();
            if (label) {
                for (i = 0; i < captionsMenu.length; i++) {
                    if (label === captionsMenu[i].label) {
                        defaultTrack = i;
                        break;
                    }
                }
            }

            _model.set('captionsList', captionsMenu);
            _setCurrentCaptions(defaultTrack);
        }

        /** Load captions. **/
        function _load(file, index) {
            utils.ajax(file, function(xmlEvent) {
                _xmlReadHandler(xmlEvent, index);
            }, _xmlFailedHandler, true);
        }

        function _xmlReadHandler(xmlEvent, index) {
            var rss = xmlEvent.responseXML ? xmlEvent.responseXML.firstChild : null,
                parser;
            _dlCount++;
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
                parser = new DfxpParser();
            } else {
                parser = new SrtParser();
            }
            try {
                var data = parser.parse(xmlEvent.responseText);
                if (index < _tracks.length) {
                    _tracks[index].data = data;
                }
            } catch (e) {
                _errorHandler(e.message + ': ' + _tracks[index].file);
            }

            if (_dlCount === _tracks.length) {
                if (_waiting > 0) {
                    _setCurrentCaptions(_waiting);
                    _waiting = -1;
                }
            }
        }

        function _xmlFailedHandler(message) {
            _dlCount++;
            _errorHandler(message);
            if (_dlCount === _tracks.length) {
                if (_waiting > 0) {
                    _setCurrentCaptions(_waiting);
                    _waiting = -1;
                }
            }
        }

        function _setCurrentCaptions(index) {
            var captionsIndex = _selectCaptions(Math.floor(index));
            _model.set('captionsIndex', captionsIndex);
            if (captionsIndex === 0) {
                _model.set('captionsTrack', null);
            }
        }

        function _selectCaptions(index) {
            var captionsIndex = 0;
            var trackIndex = 0;
            if (index > 0) {
                captionsIndex = index;
                trackIndex = index - 1;
                if (trackIndex >= _tracks.length) {
                    captionsIndex = 0;
                }
            }
            if (captionsIndex === 0) {
                return captionsIndex;
            }

            // Load new captions
            if (_tracks[trackIndex].data) {
                _model.set('captionLabel', _tracks[trackIndex].label);
                _model.set('captionsTrack', _tracks[trackIndex].data);

            } else if (_dlCount === _tracks.length) {
                // selected captions file cannot be selected
                _errorHandler('file not loaded: ' + _tracks[trackIndex].file);
                if (captionsIndex !== 0) {
                    // turn captions off
                    captionsIndex = 0;
                }
            } else {
                _waiting = index;
            }

            return captionsIndex;
        }

        function _captionsMenu() {
            var list = [{
                label: 'Off'
            }];
            for (var i = 0; i < _tracks.length; i++) {
                list.push({
                    label: _tracks[i].label
                });
            }
            return list;
        }

        this.getCurrentCaptions = function() {
            return _model.get('captionsIndex');
        };

        this.setCurrentCaptions = function(index) {
            _setCurrentCaptions(index);
        };

        this.getCaptionsList = function() {
            return _model.get('captionsList');
        };
    };

    return Captions;
});
