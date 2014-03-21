/** 
 * API to control instream playback without interrupting currently playing video
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer, undefined) {
    var html5 = jwplayer.html5, 
        _utils = jwplayer.utils, 
        _events = jwplayer.events, 
        _states = _events.state,
        _playlist = jwplayer.playlist;
    
    html5.instream = function(_api, _model, _view, _controller) {
        var _defaultOptions = {
            controlbarseekable: 'never',
            controlbarpausable: true,
            controlbarstoppable: true,
            loadingmessage: 'Loading ad',
            playlistclickable: true,
            skipoffset: null,
            tag: null
        };
        
        var _item,
            _array,
            _arrayIndex = 0,
            _optionList,
            _options = { // these are for before load
                controlbarseekable: 'never',
                controlbarpausable: false,
                controlbarstoppable: false
            },
            _skipButton,
            _video,
            _oldsrc,
            _oldsources,
            _oldpos,
            _oldstate,
            _olditem,
            _provider,
            _cbar,
            _disp,
            _dispatcher = new _events.eventdispatcher(),
            _instreamContainer,
            _fakemodel,
            _this = this,
            _shouldSeek = true,
            _completeTimeoutId = -1;

        // Listen for player resize events
        _api.jwAddEventListener(_events.JWPLAYER_RESIZE, _resize);
        _api.jwAddEventListener(_events.JWPLAYER_FULLSCREEN, _fullscreenHandler);

        /*****************************************
         *****  Public instream API methods  *****
         *****************************************/

        _this.init = function() {
            
            /** Blocking playback and show Instream Display **/
            
            // Make sure the original player's provider stops broadcasting events (pseudo-lock...)
            _video = _controller.detachMedia();

            // Create (or reuse) video media provider
            _setupProvider();

            // Initialize the instream player's model copied from main player's model
            _fakemodel = new html5.model({}, _provider);
            _fakemodel.setVolume(_model.volume);
            _fakemodel.setMute(_model.mute);

            _olditem = _model.playlist[_model.item];

            // Keep track of the original player state
            _oldsrc = _video.src ? _video.src : _video.currentSrc;
            _oldsources = _video.innerHTML;
            _oldpos = _video.currentTime;
            
            if (_controller.checkBeforePlay() || _oldpos === 0) {
                _oldstate = _states.PLAYING;
                _shouldSeek = false;
            } else if (_api.jwGetState() === _states.IDLE || _model.getVideo().checkComplete()) {
                _oldstate = _states.IDLE;
            } else {
                _oldstate = _states.PLAYING;
            }
            
            // If the player's currently playing, pause the video tag
            if (_oldstate == _states.PLAYING) {
                _video.pause();
            }

            // Instream display
            _disp = new html5.display(_this);
            _disp.forceState(_states.BUFFERING);
            // Create the container in which the controls will be placed
            _instreamContainer = document.createElement("div");
            _instreamContainer.id = _this.id + "_instream_container";
            _instreamContainer.appendChild(_disp.element());

            // Instream controlbar
            _cbar = new html5.controlbar(_this);
            _cbar.instreamMode(true);
            _instreamContainer.appendChild(_cbar.element());

            if (_api.jwGetControls()) {
                _cbar.show();
                _disp.show();
            } else {
                _cbar.hide();
                _disp.hide();
            }
            
            // Show the instream layer
            _view.setupInstream(_instreamContainer, _cbar, _disp, _fakemodel);
            
            // Resize the instream components to the proper size
            _resize();

            _this.jwInstreamSetText(_defaultOptions.loadingmessage);
        };

        /** Load an instream item and initialize playback **/
        _this.load = function(item, options) {
            if (_utils.isAndroid(2.3)) {
                errorHandler({
                    type: _events.JWPLAYER_ERROR,
                    message: 'Error loading instream: Cannot play instream on Android 2.3'
                });
                return;
            }
            _sendEvent(_events.JWPLAYER_PLAYLIST_ITEM, {index:_arrayIndex}, true);
            var playersize = _utils.bounds(document.getElementById(_api.id));
            var safe = _view.getSafeRegion();

            // Copy the playlist item passed in and make sure it's formatted as a proper playlist item
            if (_utils.typeOf(item) == "object") {
                _item = new _playlist.item(item);
                _fakemodel.setPlaylist([item]);
                _options = _utils.extend(_defaultOptions, options);
                _skipButton = new html5.adskipbutton(_api.id, playersize.height - (safe.y + safe.height) + 10, _options.skipMessage,_options.skipText);
                _skipButton.addEventListener(_events.JWPLAYER_AD_SKIPPED, _skipAd);
                _skipButton.reset(_options.skipoffset || -1);
            } else if (_utils.typeOf(item) == "array") {
                var curOpt;
                if (options) {
                    _optionList = options;
                    curOpt = options[_arrayIndex];
                }
                _options = _utils.extend(_defaultOptions, curOpt);
                _skipButton = new html5.adskipbutton(_api.id, playersize.height - (safe.y + safe.height) + 10, _options.skipMessage,_options.skipText);
                _skipButton.addEventListener(_events.JWPLAYER_AD_SKIPPED, _skipAd);
                _skipButton.reset(_options.skipoffset || -1);
                _array = item;
                
                item = _array[_arrayIndex];
                _item = new _playlist.item(item);
                _fakemodel.setPlaylist([item]);
            }
            

            if (_api.jwGetControls()) {
                _skipButton.show();
            } else {
                _skipButton.hide();
            }
            

            var skipElem = _skipButton.element();
            _instreamContainer.appendChild(skipElem);
            // Match the main player's controls state
            _fakemodel.addEventListener(_events.JWPLAYER_ERROR, errorHandler);

            // start listening for ad click
            _disp.setAlternateClickHandler(function(evt) {
                evt = evt || {};
                evt.hasControls = !!_api.jwGetControls();
                
                _sendEvent(_events.JWPLAYER_INSTREAM_CLICK, evt);

                // toggle playback after click event
                if (evt.hasControls) {
                    if (_fakemodel.state === _states.PAUSED) {
                        _this.jwInstreamPlay();
                    } else {
                        _this.jwInstreamPause();
                    }
                }
            });
            
            
            // IE 10 and 11?
            if (_utils.isIE()) {
                _video.parentElement.addEventListener('click', _disp.clickHandler);
            }
 
            _view.addEventListener(_events.JWPLAYER_AD_SKIPPED, _skipAd);
            
            // Load the instream item
            _provider.load(_fakemodel.playlist[0]);
            //_fakemodel.getVideo().addEventListener('webkitendfullscreen', _fullscreenChangeHandler, FALSE);
        };
        
        function errorHandler(evt) {
            _sendEvent(evt.type, evt);

            if (_fakemodel) {
                _api.jwInstreamDestroy(false, _this);
            }
        }
        
        /** Stop the instream playback and revert the main player back to its original state **/
        _this.jwInstreamDestroy = function(complete) {
            if (!_fakemodel) {
                return;
            }
            clearTimeout(_completeTimeoutId);
            _completeTimeoutId = -1;
            _provider.detachMedia();
                        // Re-attach the controller
            _controller.attachMedia();
            // Load the original item into our provider, which sets up the regular player's video tag
            if (_oldstate != _states.IDLE) {
                //_provider.load(_olditem, false);
                _model.getVideo().load(_olditem,false);
            } else {
               _model.getVideo().stop();
            }
            _dispatcher.resetEventListeners();

            // We don't want the instream provider to be attached to the video tag anymore

            _provider.resetEventListeners();
            _fakemodel.resetEventListeners();



            // If we added the controlbar anywhere, let's get rid of it
            if (_cbar) {
                try {
                    _cbar.element().parentNode.removeChild(_cbar.element());
                } catch(e) {}
            }
            if (_disp) {
                if (_video && _video.parentElement) _video.parentElement.removeEventListener('click', _disp.clickHandler);
                _disp.revertAlternateClickHandler();
            }
            // Let listeners know the instream player has been destroyed, and why
            _sendEvent(_events.JWPLAYER_INSTREAM_DESTROYED, {
                reason: complete ? "complete" : "destroyed"
            }, true);



            if (_oldstate == _states.PLAYING) {
                // Model was already correct; just resume playback
                _video.play();
                if (_model.playlist[_model.item] == _olditem) {
                    // We need to seek using the player's real provider, since the seek may have to be delayed
                    if (_shouldSeek) _model.getVideo().seek(_oldpos);
                }
            }

                        // Return the view to its normal state
            _view.destroyInstream(_provider.audioMode());
            _fakemodel = null;
        };
        
        /** Forward any calls to add and remove events directly to our event dispatcher **/
        
        _this.jwInstreamAddEventListener = function(type, listener) {
            _dispatcher.addEventListener(type, listener);
        } ;
        _this.jwInstreamRemoveEventListener = function(type, listener) {
            _dispatcher.removeEventListener(type, listener);
        };

        /** Start instream playback **/
        _this.jwInstreamPlay = function() {
            //if (!_item) return;
            _provider.play(true);
            _model.state = _states.PLAYING;
            _disp.show();
            // if (_api.jwGetControls()) { _disp.show();  }
        };

        /** Pause instream playback **/
        _this.jwInstreamPause = function() {
            //if (!_item) return;
            _provider.pause(true);
            _model.state = _states.PAUSED;
            if (_api.jwGetControls()) { _disp.show(); }
        };
        
        /** Seek to a point in instream media **/
        _this.jwInstreamSeek = function(position) {
            //if (!_item) return;
            _provider.seek(position);
        };
        
        /** Set custom text in the controlbar **/
        _this.jwInstreamSetText = function(text) {
            _cbar.setText(text);
        };

        _this.jwInstreamState = function() {
            //if (!_item) return;
            return _model.state;
        };
        
        /*****************************
         ****** Private methods ****** 
         *****************************/
        
        function _setupProvider() {
            //if (!_provider) {
            _provider = new html5.video(_video);
            _provider.addGlobalListener(_forward);
            _provider.addEventListener(_events.JWPLAYER_MEDIA_META, _metaHandler);
            _provider.addEventListener(_events.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
            _provider.addEventListener(_events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
            _provider.addEventListener(_events.JWPLAYER_MEDIA_ERROR, errorHandler);
            _provider.addEventListener(_events.JWPLAYER_MEDIA_TIME, function(evt) {
                if (_skipButton)
                    _skipButton.updateSkipTime(evt.position, evt.duration);
            });
            _provider.attachMedia();
            _provider.mute(_model.mute);
            _provider.volume(_model.volume);
        }
        
        function _skipAd(evt) {
            _sendEvent(evt.type, evt);
            _completeHandler();
        }
        /** Forward provider events to listeners **/        
        function _forward(evt) {
            _sendEvent(evt.type, evt);
        }
        
        function _fullscreenHandler(evt) {
            //_forward(evt);
            _resize();
            if (!evt.fullscreen && _utils.isIPad()) {
                if (_fakemodel.state === _states.PAUSED) {
                    _disp.show(true);
                }
                else if (_fakemodel.state === _states.PLAYING) {
                    _disp.hide();
                } 
            }
        }
        
        /** Handle the JWPLAYER_MEDIA_BUFFER_FULL event **/     
        function _bufferFullHandler() {
            if (_disp) {
                _disp.releaseState(_this.jwGetState());
            }
            _provider.play();
        }

        /** Handle the JWPLAYER_MEDIA_COMPLETE event **/        
        function _completeHandler() {
            if (_array && _arrayIndex + 1 < _array.length) {
                _arrayIndex++;
                var item = _array[_arrayIndex];
                _item = new _playlist.item(item);
                _fakemodel.setPlaylist([item]);
                var curOpt;
                if (_optionList) {
                    curOpt = _optionList[_arrayIndex];
                }
                _options = _utils.extend(_defaultOptions, curOpt);
                _provider.load(_fakemodel.playlist[0]);
                _skipButton.reset(_options.skipoffset||-1);
                _completeTimeoutId = setTimeout(function() {
                    _sendEvent(_events.JWPLAYER_PLAYLIST_ITEM, {index:_arrayIndex}, true);
                }, 0);
            } else {
                _completeTimeoutId = setTimeout(function() {
                    _sendEvent(_events.JWPLAYER_PLAYLIST_COMPLETE, {}, true);
                    _api.jwInstreamDestroy(true, _this);
                }, 0);
            }
        }

        /** Handle the JWPLAYER_MEDIA_META event **/        
        function _metaHandler(evt) {
            // If we're getting video dimension metadata from the provider, allow the view to resize the media
            if (evt.width && evt.height) {
                if (_disp) {
                    _disp.releaseState(_this.jwGetState());
                }
                _view.resizeMedia();
            }
        }
        
        function _sendEvent(type, data) {
            data = data || {};
            if (_defaultOptions.tag && !data.tag) {
                data.tag = _defaultOptions.tag;
            }
            _dispatcher.sendEvent(type, data);
        }
        
        // Resize handler; resize the components.
        function _resize() {
            if (_cbar) {
                _cbar.redraw();
            }
            if (_disp) {
                _disp.redraw();
            }
        }

        _this.setControls = function(mode) {
            if (mode) {
                _skipButton.show();
            } else {
                _skipButton.hide();
            }
        };
        
        /**************************************
         *****  Duplicate main html5 api  *****
         **************************************/
        
        _this.jwPlay = function() {
            if (_options.controlbarpausable.toString().toLowerCase()=="true") {
                _this.jwInstreamPlay();
            }
        };
        
        _this.jwPause = function() {
            if (_options.controlbarpausable.toString().toLowerCase()=="true") {
                _this.jwInstreamPause();
            }
        };

        _this.jwStop = function() {
            if (_options.controlbarstoppable.toString().toLowerCase()=="true") {
                _api.jwInstreamDestroy(false, _this);
                _api.jwStop();
            }
        };

        _this.jwSeek = function(position) {
            switch(_options.controlbarseekable.toLowerCase()) {
            case "never":
                return;
            case "always":
                _this.jwInstreamSeek(position);
                break;
            case "backwards":
                if (_fakemodel.position > position) {
                    _this.jwInstreamSeek(position);
                }
                break;
            }
        };
        
        _this.jwSeekDrag = function(state) { _fakemodel.seekDrag(state); };
        
        _this.jwGetPosition = function() {};
        _this.jwGetDuration = function() {};
        _this.jwGetWidth = _api.jwGetWidth;
        _this.jwGetHeight = _api.jwGetHeight;
        _this.jwGetFullscreen = _api.jwGetFullscreen;
        _this.jwSetFullscreen = _api.jwSetFullscreen;
        _this.jwGetVolume = function() {
            return _model.volume;
        };
        _this.jwSetVolume = function(vol) {
            _fakemodel.setVolume(vol);
            _api.jwSetVolume(vol);
        };
        _this.jwGetMute = function() { return _model.mute; };
        _this.jwSetMute = function(state) {
            _fakemodel.setMute(state);
            _api.jwSetMute(state);
        };
        _this.jwGetState = function() {
            if (!_fakemodel) {
                return _states.IDLE;
            }
            return _fakemodel.state;
        };
        _this.jwGetPlaylist = function() {
            return [_item];
        };
        _this.jwGetPlaylistIndex = function() {
            return 0;
        };
        _this.jwGetStretching = function() {
            return _model.config.stretching;
        };
        _this.jwAddEventListener = function(type, handler) {
            _dispatcher.addEventListener(type, handler);
        };
        _this.jwRemoveEventListener = function(type, handler) {
            _dispatcher.removeEventListener(type, handler);
        };
        _this.jwSetCurrentQuality = function() {};
        _this.jwGetQualityLevels = function() {
            return [];
        };

        // for supporting api interface in html5 display
        _this.jwGetControls = function() {
            return _api.jwGetControls();
        };

        _this.skin = _api.skin;
        _this.id = _api.id + "_instream";

        return _this;
    };
})(window.jwplayer);
