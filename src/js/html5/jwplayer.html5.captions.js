(function(jwplayer) {

    var html5 = jwplayer.html5,
        utils = jwplayer.utils,
        events = jwplayer.events,
        states = events.state,
        parsers = jwplayer.parsers,
        _css = utils.css,
        _nonChromeAndroid = utils.isAndroid(4, true),
        PLAYING = 'playing',

        D_CLASS = '.jwcaptions',

        /** Some CSS constants we should use for minimization **/
        JW_CSS_ABSOLUTE = 'absolute',
        JW_CSS_NONE = 'none',
        JW_CSS_100PCT = '100%',
        JW_CSS_HIDDEN = 'hidden',
        JW_CSS_NORMAL = 'normal',
        JW_CSS_WHITE = '#FFFFFF';

    /** Displays closed captions or subtitles on top of the video. **/
    html5.captions = function(api, options) {

        var _api = api,
            _display,
            _defaults = {
                back: true,
                color: JW_CSS_WHITE,
                fontSize: 15,
                fontFamily: 'Arial,sans-serif',
                fontOpacity: 100,
                backgroundColor: '#000',
                backgroundOpacity: 100,
                // if back == false edgeStyle defaults to 'uniform',
                // otherwise it's 'none'
                edgeStyle: null,
                windowColor: JW_CSS_WHITE,
                windowOpacity: 0
            },

            /** Default configuration options. **/
            _options = {
                fontStyle: JW_CSS_NORMAL,
                fontWeight: JW_CSS_NORMAL,
                textDecoration: JW_CSS_NONE
            },

            /** Reference to the text renderer. **/
            _renderer,
            /** Current player state. **/
            _state,
            /** Currently active captions track. **/
            _track,
            /** List with all tracks. **/
            _tracks = [],
            /**counter for downloading all the tracks**/
            _dlCount = 0,

            _waiting = -1,
            /** Currently selected track in the displayed track list. **/
            _selectedTrack = 0,
            /** Flag to remember fullscreen state. **/
            _fullscreen = false,
            /** Event dispatcher for captions events. **/
            _eventDispatcher = new events.eventdispatcher();

        utils.extend(this, _eventDispatcher);

        function _init() {

            _display = document.createElement('div');
            _display.id = _api.id + '_caption';
            _display.className = 'jwcaptions';

            _api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
            _api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_ERROR, _errorHandler);
            _api.jwAddEventListener(events.JWPLAYER_ERROR, _errorHandler);
            _api.jwAddEventListener(events.JWPLAYER_READY, _setup);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_TIME, _timeHandler);
            _api.jwAddEventListener(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
            _api.jwAddEventListener(events.JWPLAYER_RESIZE, _resizeHandler);
        }

        function _resizeHandler() {
            _redraw(false);
        }

        /** Error loading/parsing the captions. **/
        function _errorHandler(error) {
            utils.log('CAPTIONS(' + error + ')');
        }

        /** Player jumped to idle state. **/
        function _idleHandler() {
            _state = 'idle';
            _redraw(false);
            //_renderer.update(0);
        }

        function _stateHandler(evt) {
            switch (evt.newstate) {
                case states.IDLE:
                    _idleHandler();
                    break;
                case states.PLAYING:
                    _playHandler();
                    break;
            }
        }

        function _fullscreenHandler(event) {
            _fullscreen = event.fullscreen;
            if (event.fullscreen) {
                _fullscreenResize();
                // to fix browser fullscreen issue
                setTimeout(_fullscreenResize, 500);
            } else {
                _redraw(true);
            }

        }

        function _fullscreenResize() {
            var height = _display.offsetHeight,
                width = _display.offsetWidth;
            if (height !== 0 && width !== 0) {
                _renderer.resize(width, Math.round(height * 0.94));
            }
        }

        /** Listen to playlist item updates. **/
        function _itemHandler() {
            _track = 0;
            _tracks = [];
            _renderer.update(0);
            _dlCount = 0;

            var item = _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()],
                tracks = item.tracks,
                captions = [],
                i = 0,
                label = '',
                defaultTrack = 0,
                file = '',
                cookies;

            for (i = 0; i < tracks.length; i++) {
                var kind = tracks[i].kind.toLowerCase();
                if (kind === 'captions' || kind === 'subtitles') {
                    captions.push(tracks[i]);
                }
            }

            _selectedTrack = 0;
            if (_nonChromeAndroid) {
                return;
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

            cookies = utils.getCookies();
            label = cookies.captionLabel;

            if (label) {
                tracks = _getTracks();
                for (i = 0; i < tracks.length; i++) {
                    if (label === tracks[i].label) {
                        defaultTrack = i;
                        break;
                    }
                }
            }
            if (defaultTrack > 0) {
                _renderCaptions(defaultTrack);
            }
            _redraw(false);
            _sendEvent(events.JWPLAYER_CAPTIONS_LIST, _getTracks(), _selectedTrack);
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
                parser = new jwplayer.parsers.dfxp();
            } else {
                parser = new jwplayer.parsers.srt();
            }
            try {
                var data = parser.parse(xmlEvent.responseText);
                if (_track < _tracks.length) {
                    _tracks[index].data = data;
                }
                _redraw(false);
            } catch (e) {
                _errorHandler(e.message + ': ' + _tracks[index].file);
            }

            if (_dlCount === _tracks.length) {
                if (_waiting > 0) {
                    _renderCaptions(_waiting);
                    _waiting = -1;
                }
                sendAll();
            }
        }

        function _xmlFailedHandler(message) {
            _dlCount++;
            _errorHandler(message);
            if (_dlCount === _tracks.length) {
                if (_waiting > 0) {
                    _renderCaptions(_waiting);
                    _waiting = -1;
                }
                sendAll();
            }
        }


        function sendAll() {

            var data = [];
            for (var i = 0; i < _tracks.length; i++) {
                data.push(_tracks[i]);
            }
            _eventDispatcher.sendEvent(events.JWPLAYER_CAPTIONS_LOADED, {
                captionData: data
            });
        }

        /** Player started playing. **/
        function _playHandler() {
            _state = PLAYING;
            _redraw(false);
        }

        /** Update the interface. **/
        function _redraw(timeout) {
            if (!_tracks.length) {
                _renderer.hide();
            } else {
                if (_state === PLAYING && _selectedTrack > 0) {
                    _renderer.show();
                    if (_fullscreen) {
                        _fullscreenHandler({
                            fullscreen: true
                        });
                        return;
                    }
                    _normalResize();
                    if (timeout) {
                        setTimeout(_normalResize, 500);
                    }
                } else {
                    _renderer.hide();
                }
            }
        }

        function _normalResize() {
            _renderer.resize();
        }

        /** Setup captions when player is ready. **/
        function _setup() {
            utils.foreach(_defaults, function(rule, val) {
                if (options) {
                    if (options[rule] !== undefined) {
                        val = options[rule];
                    } else if (options[rule.toLowerCase()] !== undefined) {
                        val = options[rule.toLowerCase()];
                    }
                }
                _options[rule] = val;
            });

            // Place renderer and selector.
            _renderer = new jwplayer.html5.captions.renderer(_options, _display);
            _redraw(false);
        }


        /** Selection menu was closed. **/
        function _renderCaptions(index) {
            // Store new state and track
            if (index > 0) {
                _track = index - 1;
                _selectedTrack = Math.floor(index);
            } else {
                _selectedTrack = 0;
                _redraw(false);
                return;
            }

            if (_track >= _tracks.length) {
                return;
            }

            // Load new captions
            if (_tracks[_track].data) {
                _renderer.populate(_tracks[_track].data);
            } else if (_dlCount === _tracks.length) {
                _errorHandler('file not loaded: ' + _tracks[_track].file);
                if (_selectedTrack !== 0) {
                    _sendEvent(events.JWPLAYER_CAPTIONS_CHANGED, _tracks, 0);
                }
                _selectedTrack = 0;
            } else {
                _waiting = index;
            }
            _redraw(false);
        }


        /** Listen to player time updates. **/
        function _timeHandler(event) {
            _renderer.update(event.position);
        }

        function _sendEvent(type, tracks, track) {
            var captionsEvent = {
                type: type,
                tracks: tracks,
                track: track
            };
            _eventDispatcher.sendEvent(type, captionsEvent);
        }

        function _getTracks() {
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

        this.element = function() {
            return _display;
        };

        this.getCaptionsList = function() {
            return _getTracks();
        };

        this.getCurrentCaptions = function() {
            return _selectedTrack;
        };

        this.setCurrentCaptions = function(index) {
            if (index >= 0 && _selectedTrack !== index && index <= _tracks.length) {
                _renderCaptions(index);
                var tracks = _getTracks();
                utils.saveCookie('captionLabel', tracks[_selectedTrack].label);
                _sendEvent(events.JWPLAYER_CAPTIONS_CHANGED, tracks, _selectedTrack);
            }
        };

        _init();
    };

    _css(D_CLASS, {
        position: JW_CSS_ABSOLUTE,
        cursor: 'pointer',
        width: JW_CSS_100PCT,
        height: JW_CSS_100PCT,
        overflow: JW_CSS_HIDDEN
    });

})(jwplayer);
