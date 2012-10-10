(function(html5) {

    var utils = jwplayer.utils,
        events = jwplayer.events,
        states = events.state,
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
        }

       /** Read or write a cookie. **/
  /*       function _cookie(name,value) {
            name = 'jwplayercaptions' + name;
            if(value !== undefined) {
                var c = name+'='+value+'; expires=Wed, 1 Jan 2020 00:00:00 UTC; path=/';
                document.cookie = c;
            } else {
                // http://www.quirksmode.org/js/cookies.html
                var list = document.cookie.split(';');
                for(var i=0; i< list.length; i++) {
                    var c = list[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1,c.length);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length+1, c.length);
                    }
                }
            }
            return null;
        };
*/

        /** Error loading/parsing the captions. **/
        function _errorHandler(error) {
            utils.log("CAPTIONS(" + error + ")");
        };

        /** Player jumped to idle state. **/
        function _idleHandler() {
            _state = 'idle';
            _redraw();
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
                _redraw();
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
                captions = item['captions'],
                i = 0,
                label = "",
                file = "";

            if (captions) {
                for (i = 0; i < captions.length; i++) {
                    file = captions[i].file;
                    if(file) {
                        if (captions[i].label) {
                            _tracks.push(captions[i]);
                        }
                        else {
                            label = file.substring(file.lastIndexOf('/')+1,file.indexOf('.'));
                            _tracks.push({file: file, label: label});
                        }
                    }
                }
            }   
            
            _selectedTrack = 0;
            _redraw();
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
            if (html5.parsers.localName(rss) == "tt") {
                loader = new jwplayer.html5.parsers.dfxp(_loadHandler,_errorHandler);
            }
            else {
                loader = new jwplayer.html5.parsers.srt(_loadHandler,_errorHandler);   
            }
            loader.load(_file);
        }

        function _xmlFailedHandler(xmlEvent) {
            var loader = new jwplayer.html5.parsers.srt(_loadHandler,_errorHandler);
            loader.load(_file);
        }

        /** Captions were loaded. **/
        function _loadHandler(data) {
            _renderer.populate(data);
            _tracks[_track].data = data;
            _redraw();
        };


        /** Player started playing. **/
        function _playHandler(event) {
            _state = PLAYING;
            _redraw();
        };

        /** Update the interface. **/
        function _redraw() {
            if(!_tracks.length) {
                _renderer.hide();
            } else {
                if(_state == PLAYING && _selectedTrack > 0) {
                    _renderer.show();
                    if (_fullscreen) {
                        _fullscreenHandler({fullscreen: true});
                        return;
                    }
                    var width = _api.jwGetWidth();
                    if (_api._model && _api._model.config
                            && _api._model.config.listbar && _api._model.config.listbar.size) {
                        width = width - _api._model.config.listbar.size;
                    }
                    _renderer.resize(width, Math.round(_api.jwGetHeight()*0.94));
                } else {
                    _renderer.hide();
                }
            }
        };

        /** Set dock buttons when player is ready. **/
        function _setup() {

            for (var rule in _defaults) {
                if (options && options[rule.toLowerCase()] != undefined) {
                    // Fix for colors, since the player automatically converts to HEX.
                    if(rule == 'color') {
                        _options['color'] = '#'+String(options['color']).substr(-6);
                    } else {
                        _options[rule] = options[rule.toLowerCase()];
                    }
                }
                else {
                    _options[rule] = _defaults[rule];
                }
            }

            // Place renderer and selector.
            _renderer = new jwplayer.html5.captions.renderer(_options,_display);
            _redraw();
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
            // Load new captions
            if(_tracks[_track].data) {
                _renderer.populate(_tracks[_track].data);
            } else {
                _load(_tracks[_track].file);
            }
            _redraw();
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
            list.push({label: "(Off)"});
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
                _sendEvent(events.JWPLAYER_CAPTIONS_CHANGED, _getTracks(), _selectedTrack);
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
