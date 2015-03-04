/** 
 * API to control instream playback without interrupting currently playing video
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
    var html5 = jwplayer.html5,
        _utils = jwplayer.utils,
        _ = jwplayer._,
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
            _array, // the copied in playlist
            _arrayIndex = 0,
            _optionList,
            _options = { // these are for before load
                controlbarseekable: 'never',
                controlbarpausable: false,
                controlbarstoppable: false
            },
            _skipButton,
            _video,
            _oldpos,
            _oldstate,
            _olditem,
            _adModel,
            _provider,
            _cbar,
            _instreamDisplay,
            _instreamContainer,
            _completeTimeoutId = -1,
            _this = _utils.extend(this, new _events.eventdispatcher());

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
            _adModel = new html5.model({}, _provider);
            _adModel.setVolume(_model.volume);
            _adModel.setFullscreen(_model.fullscreen);
            _adModel.setMute(_model.mute);
            _adModel.addEventListener('fullscreenchange',_nativeFullscreenHandler);
            _olditem = _model.playlist[_model.item];

            // Keep track of the original player state
            _oldpos = _video.currentTime;

            if ( _controller.checkBeforePlay() || (_oldpos === 0 && !_model.getVideo().checkComplete()) ) {
                // make sure video restarts after preroll
                _oldpos = 0;
                _oldstate = _states.PLAYING;
            } else if (_model.getVideo().checkComplete()) {
                 // AKA  postroll
                 _oldstate = _states.IDLE;
             }  else if (_api.jwGetState() === _states.IDLE) {
                _oldstate = _states.IDLE;
            } else {
                _oldstate = _states.PLAYING;
            }

            // If the player's currently playing, pause the video tag
            if (_oldstate === _states.PLAYING) {
                _video.pause();
            }

            // Instream display
            _instreamDisplay = new html5.display(_this);
            _instreamDisplay.forceState(_states.BUFFERING);
            // Create the container in which the controls will be placed
            _instreamContainer = document.createElement('div');
            _instreamContainer.id = _this.id + '_instream_container';
            _utils.css.style(_instreamContainer, {
                width: '100%',
                height: '100%'
            });

            _instreamContainer.appendChild(_instreamDisplay.element());

            // Instream controlbar
            var cbarConfig = {
                fullscreen : _model.fullscreen
            };
            _cbar = new html5.controlbar(_this, cbarConfig);
            _cbar.instreamMode(true);
            _instreamContainer.appendChild(_cbar.element());

            if (_api.jwGetControls()) {
                _cbar.show();
                _instreamDisplay.show();
            } else {
                _cbar.hide();
                _instreamDisplay.hide();
            }

            // Show the instream layer
            _view.setupInstream(_instreamContainer, _cbar, _instreamDisplay, _adModel);

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
            _sendEvent(_events.JWPLAYER_PLAYLIST_ITEM, {
                index: _arrayIndex
            }, true);

            var instreamLayer = _instreamContainer.parentNode;
            var bottom = 10 + _utils.bounds(instreamLayer).bottom - _utils.bounds(_cbar.element()).top;

            // Copy the playlist item passed in and make sure it's formatted as a proper playlist item
            if (_.isArray(item)) {
                if (options) {
                    _optionList = options;
                    options = options[_arrayIndex];
                }
                _array = item;
                item = _array[_arrayIndex];
            }
            _options = _utils.extend(_defaultOptions, options);
            _item = new _playlist.item(item);
            _adModel.setPlaylist([item]);
            _skipButton = new html5.adskipbutton(_api.id, bottom, _options.skipMessage, _options.skipText);
            _skipButton.addEventListener(_events.JWPLAYER_AD_SKIPPED, _skipAd);
            _skipButton.reset(_options.skipoffset || -1);


            if (_api.jwGetControls()) {
                _skipButton.show();
            } else {
                _skipButton.hide();
            }


            var skipElem = _skipButton.element();
            _instreamContainer.appendChild(skipElem);
            // Match the main player's controls state
            _adModel.addEventListener(_events.JWPLAYER_ERROR, errorHandler);

            // start listening for ad click
            _instreamDisplay.setAlternateClickHandler(function(evt) {
                evt = evt || {};
                evt.hasControls = !!_api.jwGetControls();

                _sendEvent(_events.JWPLAYER_INSTREAM_CLICK, evt);

                // toggle playback after click event

                if (_adModel.state === _states.PAUSED) {
                    if (evt.hasControls) {
                        _this.jwInstreamPlay();
                    }
                } else {
                    _this.jwInstreamPause();
                }
            });

            if (_utils.isMSIE()) {
                _video.parentElement.addEventListener('click', _instreamDisplay.clickHandler);
            }

            _view.addEventListener(_events.JWPLAYER_AD_SKIPPED, _skipAd);

            // Load the instream item
            _provider.load(_adModel.playlist[0]);
            //_fakemodel.getVideo().addEventListener('webkitendfullscreen', _fullscreenChangeHandler, FALSE);
        };

        function errorHandler(evt) {
            _sendEvent(evt.type, evt);

            if (_adModel) {
                _api.jwInstreamDestroy(false, _this);
            }
        }

        /** Stop the instream playback and revert the main player back to its original state **/
        _this.jwInstreamDestroy = function(complete) {
            if (!_adModel) {
                return;
            }
            _adModel.removeEventListener('fullscreenchange',_nativeFullscreenHandler);
            clearTimeout(_completeTimeoutId);
            _completeTimeoutId = -1;
            _provider.detachMedia();
            // Re-attach the controller
            _controller.attachMedia();
            // Load the original item into our provider, which sets up the regular player's video tag
            if (_oldstate !== _states.IDLE) {
                var item = _utils.extend({}, _olditem);
                item.starttime = _oldpos;
                _model.getVideo().load(item);

            } else {
                _model.getVideo().stop();
            }
            _this.resetEventListeners();

            // We don't want the instream provider to be attached to the video tag anymore

            _provider.resetEventListeners();
            _adModel.resetEventListeners();



            // If we added the controlbar anywhere, let's get rid of it
            if (_cbar) {
                try {
                    _cbar.element().parentNode.removeChild(_cbar.element());
                } catch (e) {}
            }
            if (_instreamDisplay) {
                if (_video && _video.parentElement) {
                    _video.parentElement.removeEventListener('click', _instreamDisplay.clickHandler);
                }
                _instreamDisplay.revertAlternateClickHandler();
            }
            // Let listeners know the instream player has been destroyed, and why
            _sendEvent(_events.JWPLAYER_INSTREAM_DESTROYED, {
                reason: complete ? 'complete' : 'destroyed'
            }, true);



            if (_oldstate === _states.PLAYING) {
                // Model was already correct; just resume playback
                _video.play();
            }

            // Return the view to its normal state
            _view.destroyInstream(_provider.isAudioFile());
            _adModel = null;
        };

        /** Forward any calls to add and remove events directly to our event dispatcher **/

        _this.jwInstreamAddEventListener = function(type, listener) {
            _this.addEventListener(type, listener);
        };
        _this.jwInstreamRemoveEventListener = function(type, listener) {
            _this.removeEventListener(type, listener);
        };

        /** Start instream playback **/
        _this.jwInstreamPlay = function() {
            //if (!_item) return;
            _provider.play(true);
            _model.state = _states.PLAYING;
            _instreamDisplay.show();
            
            // if (_api.jwGetControls()) { _disp.show();  }
        };

        /** Pause instream playback **/
        _this.jwInstreamPause = function() {
            //if (!_item) return;
            _provider.pause(true);
            _model.state = _states.PAUSED;
            if (_api.jwGetControls()) {
                _instreamDisplay.show();
                _cbar.show();
            }
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
            return _adModel.state;
        };

        /*****************************
         ****** Private methods ******
         *****************************/

        function _setupProvider() {
            var Provider = jwplayer.html5.chooseProvider({});
            
            _provider = new Provider(_model.id);

            _provider.addGlobalListener(_forward);
            _provider.addEventListener(_events.JWPLAYER_MEDIA_META, _metaHandler);
            _provider.addEventListener(_events.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
            _provider.addEventListener(_events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
            _provider.addEventListener(_events.JWPLAYER_MEDIA_ERROR, errorHandler);

            _provider.addEventListener(_events.JWPLAYER_PLAYER_STATE, stateHandler);
            _provider.addEventListener(_events.JWPLAYER_MEDIA_TIME, function(evt) {
                if (_skipButton) {
                    _skipButton.updateSkipTime(evt.position, evt.duration);
                }
            });
            _provider.attachMedia();
            _provider.mute(_model.mute);
            _provider.volume(_model.volume);
        }

        function stateHandler(evt) {
            if (evt.newstate === _adModel.state) {
                return;
            }
            _adModel.state = evt.newstate;
            switch(_adModel.state) {
                case _states.PLAYING:
                    _this.jwInstreamPlay();
                    break;
                case _states.PAUSED:
                    _this.jwInstreamPause();
                    break;
                
            }
        }

        function _skipAd(evt) {
            _sendEvent(evt.type, evt);
            _completeHandler();
        }
        /** Forward provider events to listeners **/
        function _forward(evt) {
            _sendEvent(evt.type, evt);
        }
        
        function _nativeFullscreenHandler(evt) {
            _model.sendEvent(evt.type,evt);
            _sendEvent(_events.JWPLAYER_FULLSCREEN, {fullscreen:evt.jwstate});
        }
        function _fullscreenHandler(evt) {
            // required for updating the controlbars toggle icon
            _forward(evt);
            if (!_adModel) {
                return;
            }
            _resize();
            if (!evt.fullscreen && _utils.isIPad()) {
                if (_adModel.state === _states.PAUSED) {
                    _instreamDisplay.show(true);
                } else if (_adModel.state === _states.PLAYING) {
                    _instreamDisplay.hide();
                }
            }
        }

        /** Handle the JWPLAYER_MEDIA_BUFFER_FULL event **/
        function _bufferFullHandler() {
            if (_instreamDisplay) {
                _instreamDisplay.releaseState(_this.jwGetState());
            }
            _provider.play();
        }

        /** Handle the JWPLAYER_MEDIA_COMPLETE event **/
        function _completeHandler() {
            if (_array && _arrayIndex + 1 < _array.length) {
                _arrayIndex++;
                var item = _array[_arrayIndex];
                _item = new _playlist.item(item);
                _adModel.setPlaylist([item]);
                var curOpt;
                if (_optionList) {
                    curOpt = _optionList[_arrayIndex];
                }
                _options = _utils.extend(_defaultOptions, curOpt);
                _provider.load(_adModel.playlist[0]);
                _skipButton.reset(_options.skipoffset || -1);
                _completeTimeoutId = setTimeout(function() {
                    _sendEvent(_events.JWPLAYER_PLAYLIST_ITEM, {
                        index: _arrayIndex
                    }, true);
                }, 0);
            } else {
                _completeTimeoutId = setTimeout(function() {
                    // this is called on every ad completion of the final video in a playlist
                    //   1) vast.js (to trigger ad_complete event)
                    //   2) display.js (to set replay icon and image)
                    _sendEvent(_events.JWPLAYER_PLAYLIST_COMPLETE, {}, true);
                    _api.jwInstreamDestroy(true, _this);
                }, 0);
            }
        }

        /** Handle the JWPLAYER_MEDIA_META event **/
        function _metaHandler(evt) {
            // If we're getting video dimension metadata from the provider, allow the view to resize the media
            if (evt.width && evt.height) {
                if (_instreamDisplay) {
                    _instreamDisplay.releaseState(_this.jwGetState());
                }
                _view.resizeMedia();
            }
        }

        function _sendEvent(type, data) {
            data = data || {};
            if (_defaultOptions.tag && !data.tag) {
                data.tag = _defaultOptions.tag;
            }
            _this.sendEvent(type, data);
        }

        // Resize handler; resize the components.
        function _resize() {
            if (_cbar) {
                _cbar.redraw();
            }
            if (_instreamDisplay) {
                _instreamDisplay.redraw();
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
            if (_options.controlbarpausable.toString().toLowerCase() === 'true') {
                _this.jwInstreamPlay();
            }
        };

        _this.jwPause = function() {
            if (_options.controlbarpausable.toString().toLowerCase() === 'true') {
                _this.jwInstreamPause();
            }
        };

        _this.jwStop = function() {
            if (_options.controlbarstoppable.toString().toLowerCase() === 'true') {
                _api.jwInstreamDestroy(false, _this);
                _api.jwStop();
            }
        };

        _this.jwSeek = function(position) {
            switch (_options.controlbarseekable.toLowerCase()) {
                case 'never':
                    return;
                case 'always':
                    _this.jwInstreamSeek(position);
                    break;
                case 'backwards':
                    if (_adModel.position > position) {
                        _this.jwInstreamSeek(position);
                    }
                    break;
            }
        };

        _this.jwSeekDrag = function(state) {
            _adModel.seekDrag(state);
        };

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
            _adModel.setVolume(vol);
            _api.jwSetVolume(vol);
        };
        _this.jwGetMute = function() {
            return _model.mute;
        };
        _this.jwSetMute = function(state) {
            _adModel.setMute(state);
            _api.jwSetMute(state);
        };
        _this.jwGetState = function() {
            if (!_adModel) {
                return _states.IDLE;
            }
            return _adModel.state;
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
            _this.addEventListener(type, handler);
        };
        _this.jwRemoveEventListener = function(type, handler) {
            _this.removeEventListener(type, handler);
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
        _this.id = _api.id + '_instream';

        return _this;
    };
})(window.jwplayer);
