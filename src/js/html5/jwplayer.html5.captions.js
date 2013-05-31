(function(html5) {

    var utils = jwplayer.utils,
        events = jwplayer.events,
        states = events.state,
        parsers = jwplayer.parsers,
        _css = utils.css,
        
        PLAYING = "playing",

        DOCUMENT = document,
        D_CLASS = ".jwcaptions",

        /** Some CSS constants we should use for minimization **/
        JW_CSS_ABSOLUTE = "absolute",
        JW_CSS_NONE = "none",
        JW_CSS_100PCT = "100%",
        JW_CSS_HIDDEN = "hidden";

    /** Displays closed captions or subtitles on top of the video. **/
    html5.captions = function(api, options) {
        
        var _api = api,
            _display,

        /** Dimensions of the display. **/
        _dimensions,
        
        _defaults = {
            back: true,
            color: '#FFFFFF',
            fontSize: 15
        },

        /** Default configuration options. **/
        _options = {
            fontFamily: 'Arial,sans-serif',
            fontStyle: 'normal',
            fontWeight: 'normal',
            textDecoration: 'none'
        },
        
        /** Reference to the text renderer. **/
        _renderer,
        /** Current player state. **/
        _state,
        /** Currently active captions track. **/
        _track,
        /** List with all tracks. **/
        _tracks = [],
        /** Currently selected track in the displayed track list. **/
        _selectedTrack = 0,
        /** Flag to remember fullscreen state. **/
        _fullscreen = false,
        /** Current captions file being read. **/
        _file,
        /** Event dispatcher for captions events. **/
        _eventDispatcher = new events.eventdispatcher();

        utils.extend(this, _eventDispatcher);

        function _init() {

            _display = DOCUMENT.createElement("div");
            _display.id = _api.id + "_caption";
            _display.className = "jwcaptions";

            _api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
            _api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_ERROR, _errorHandler);
            _api.jwAddEventListener(events.JWPLAYER_ERROR, _errorHandler);
            _api.jwAddEventListener(events.JWPLAYER_READY, _setup);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_TIME, _timeHandler);
            _api.jwAddEventListener(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
            _api.jwAddEventListener(events.JWPLAYER_RESIZE, _resizeHandler);
        }

        function _resizeHandler(evt) {
            _redraw(false);
        }

        /** Error loading/parsing the captions. **/
        function _errorHandler(error) {
            utils.log("CAPTIONS(" + error + ")");
        };

        /** Player jumped to idle state. **/
        function _idleHandler() {
            _state = 'idle';
            _redraw(false);
        };

        function _stateHandler(evt) {
            switch(evt.newstate) {
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
            if(event.fullscreen) {
                _fullscreenResize();
                // to fix browser fullscreen issue
                setTimeout(_fullscreenResize, 500);
            }
            else {
                _redraw(true);
            }
            
        }

        function _fullscreenResize() {
            var height = _display.offsetHeight,
                width = _display.offsetWidth;
            if(height != 0 && width != 0) {
                _renderer.resize(width, Math.round(height*0.94));
            }
        }

        /** Listen to playlist item updates. **/
        function _itemHandler(event) {
            _track = 0;
            _tracks = [];
            _renderer.update(0);

            var item = _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()],
                tracks = item['tracks'],
                captions = [],
                i = 0,
                label = "",
                defaultTrack = 0,
                file = "";

            for (i = 0; i < tracks.length; i++) {
                var kind = tracks[i].kind.toLowerCase();
                if (kind == "captions" || kind == "subtitles") {
                    captions.push(tracks[i]);
                }
            }

            _selectedTrack = 0;

            for (i = 0; i < captions.length; i++) {
                file = captions[i].file;
                if(file) {
                    if (!captions[i].label) {
                        captions[i].label = i.toString();
                       
                    }
                    _tracks.push(captions[i]);
                }
            }


            for (i = 0; i < _tracks.length; i++) {
                if (_tracks[i]["default"]) {
                    defaultTrack = i+1;
                    break;
                }
            }


            var cookies = utils.getCookies(),
                label = cookies["captionLabel"];

            if (label) {
                tracks = _getTracks();
                for (i = 0; i < tracks.length; i++) {
                    if (label == tracks[i].label) {
                        defaultTrack = i;
                        break;
                    }
                }
            }

            _renderCaptions(defaultTrack);

            _redraw(false);
            _sendEvent(events.JWPLAYER_CAPTIONS_LIST, _getTracks(), _selectedTrack);
        };

        /** Load captions. **/
        function _load(file) {
            _file = file;
            utils.ajax(file, _xmlReadHandler, _xmlFailedHandler);
        };

        function _xmlReadHandler(xmlEvent) {
            var rss = xmlEvent.responseXML.firstChild,
                loader;

            // IE9 sets the firstChild element to the root <xml> tag
            if (parsers.localName(rss) == "xml") rss = rss.nextSibling;

            if (parsers.localName(rss) == "tt") {
                loader = new jwplayer.parsers.dfxp(_loadHandler,_errorHandler);
            }
            else {
                loader = new jwplayer.parsers.srt(_loadHandler,_errorHandler);   
            }
            loader.load(_file);
        }

        function _xmlFailedHandler(xmlEvent) {
            var loader = new jwplayer.parsers.srt(_loadHandler,_errorHandler);
            loader.load(_file);
        }

        /** Captions were loaded. **/
        function _loadHandler(data) {
            _renderer.populate(data);
            if (_track < _tracks.length) {
                _tracks[_track].data = data;
            }
            _redraw(false);
        };


        /** Player started playing. **/
        function _playHandler(event) {
            _state = PLAYING;
            _redraw(false);
        };

        /** Update the interface. **/
        function _redraw(timeout) {
            if(utils.isMobile() || !_tracks.length) {
                _renderer.hide();
            } else {
                if(_state == PLAYING && _selectedTrack > 0) {
                    _renderer.show();
                    if (_fullscreen) {
                        _fullscreenHandler({fullscreen: true});
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
        };

        function _normalResize() {
            _renderer.resize();
        }

        /** Set dock buttons when player is ready. **/
        function _setup() {
        	utils.foreach(_defaults, function(rule, val) {
                if (options && options[rule.toLowerCase()] != undefined) {
                    // Fix for colors, since the player automatically converts to HEX.
                    if(rule == 'color') {
                        _options['color'] = '#'+String(options['color']).substr(-6);
                    } else {
                        _options[rule] = options[rule.toLowerCase()];
                    }
                }
                else {
                    _options[rule] = val;
                }
        	});

            // Place renderer and selector.
            _renderer = new jwplayer.html5.captions.renderer(_options,_display);
            _redraw(false);
        };


        /** Selection menu was closed. **/
        function _renderCaptions(index) {
            // Store new state and track
            if(index > 0) {
                _track = index - 1;
                _selectedTrack = index;
            } else {
                _selectedTrack = 0;
            }

            if (_track >= _tracks.length) return;

            // Load new captions
            if(_tracks[_track].data) {
                _renderer.populate(_tracks[_track].data);
            } else {
                _load(_tracks[_track].file);
            }
            _redraw(false);
        };


        /** Listen to player time updates. **/
        function _timeHandler(event) {
            _renderer.update(event.position);
        };

        function _sendEvent(type, tracks, track) {
            var captionsEvent = {type: type, tracks: tracks, track: track};
            _eventDispatcher.sendEvent(type, captionsEvent);
        };

        function _getTracks() {
            var list = new Array();
            list.push({label: "Off"});
            for (var i = 0; i < _tracks.length; i++) {
                list.push({label: _tracks[i].label});
            }
            return list;
        };

        this.element = function() {
            return _display;
        }
        
        this.getCaptionsList = function() {
            return _getTracks();
        };
        
        this.getCurrentCaptions = function() {
            return _selectedTrack;
        };
        
        this.setCurrentCaptions = function(index) {
            if (index >= 0 && _selectedTrack != index && index <= _tracks.length) {
                _renderCaptions(index);
                var tracks = _getTracks();
                utils.saveCookie("captionLabel", tracks[_selectedTrack].label);
                _sendEvent(events.JWPLAYER_CAPTIONS_CHANGED, tracks, _selectedTrack);
            }
        };
        
        _init();

    };

    _css(D_CLASS, {
        position: JW_CSS_ABSOLUTE,
        cursor: "pointer",
        width: JW_CSS_100PCT,
        height: JW_CSS_100PCT,
        overflow: JW_CSS_HIDDEN
    });

})(jwplayer.html5);
