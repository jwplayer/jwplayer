define([
    'utils/helpers',
    'utils/underscore',
    'utils/backbone.events',
    'events/change-state-event',
    'events/events',
    'events/states',
    'controller/model',
    'view/adskipbutton',
    'playlist/item'
], function(utils, _, Events,
            changeStateEvent, events, states, Model, Adskipbutton, PlaylistItem) {

    var InstreamHtml5 = function(_controller, _model, _view) {

        function modelGet(attr) {
            return _model.get(attr);
        }

        var _defaultOptions = {
            controlbarseekable: 'never',
            controlbarpausable: true,
            controlbarstoppable: true,
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
            _oldProvider,
            _oldpos,
            _oldstate,
            _olditem,
            _adModel,
            _currentProvider,
            _completeTimeoutId = -1,
            _this = _.extend(this, Events);

        // Listen for player resize events
        _controller.on(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);

        /*****************************************
         *****  Public instream API methods  *****
         *****************************************/

        _this.init = function() {

            /** Blocking playback and show Instream Display **/

                // Make sure the original player's provider stops broadcasting events (pseudo-lock...)
            _oldProvider = _model.getVideo();

            // Keep track of the original player state
            _oldpos = _model.position;

            // Initialize the instream player's model copied from main player's model
            _adModel = new Model().setup({
                id: _model.id,
                volume: _model.volume,
                fullscreen: _model.fullscreen,
                mute: _model.mute
            });

            _adModel.on('fullscreenchange', _nativeFullscreenHandler);
            _olditem = _model.playlist[_model.item];

            if (_controller.checkBeforePlay() || (_oldpos === 0 && !_oldProvider.checkComplete())) {
                // make sure video restarts after preroll
                _oldpos = 0;
                _oldstate = states.PLAYING;
            } else if (_oldProvider && _oldProvider.checkComplete()) {
                // AKA  postroll
                _oldstate = states.IDLE;
            } else if (modelGet('state') === states.IDLE) {
                _oldstate = states.IDLE;
            } else {
                _oldstate = states.PLAYING;
            }

            // If the player's currently playing, pause the video tag
            if (_oldstate === states.PLAYING) {
                // pause must be called before detachMedia
                _oldProvider.pause();
            }

            // Was used to get video tag and store media state
            _oldProvider.detachMedia();

            // Show the instream layer
            _view.setupInstream(_adModel);
        };

        /** Load an instream item and initialize playback **/
        _this.load = function(item, options) {
            if (utils.isAndroid(2.3)) {
                errorHandler({
                    type: events.JWPLAYER_ERROR,
                    message: 'Error loading instream: Cannot play instream on Android 2.3'
                });
                return;
            }
            // TODO: why is this used?
            _sendEvent(events.JWPLAYER_PLAYLIST_ITEM, {
                index: _arrayIndex
            });

            // Copy the playlist item passed in and make sure it's formatted as a proper playlist item
            if (_.isArray(item)) {
                if (options) {
                    _optionList = options;
                    options = options[_arrayIndex];
                }
                _array = item;
                item = _array[_arrayIndex];
            }
            _options = _.extend({}, _defaultOptions, options);
            _item = new PlaylistItem(item);

            _adModel.setPlaylist([item]);
            // check provider after item change
            _checkProvider();

            // Show the instream layer
            _view.showInstream();

            if (_options.skipoffset) {
                _skipButton = new Adskipbutton(_options.skipMessage, _options.skipText);
                _skipButton.on(events.JWPLAYER_AD_SKIPPED, _skipAd);
                _skipButton.setWaitTime(_options.skipoffset);

                _view.controlsContainer().appendChild(_skipButton.element());
            }

            // Match the main player's controls state
            _adModel.off(events.JWPLAYER_ERROR);
            _adModel.on(events.JWPLAYER_ERROR, errorHandler);

            // start listening for ad click
            _view.clickHandler().setAlternateClickHandler(function(evt) {
                evt = evt || {};
                evt.hasControls = !!modelGet('controls');

                _sendEvent(events.JWPLAYER_INSTREAM_CLICK, evt);

                // toggle playback after click event

                if (_adModel.state === states.PAUSED) {
                    if (evt.hasControls) {
                        _this.instreamPlay();
                    }
                } else {
                    _this.instreamPause();
                }
            });

            if (utils.isMSIE()) {
                _oldProvider.parentElement.addEventListener('click', _view.clickHandler().clickHandler);
            }

            _view.on(events.JWPLAYER_AD_SKIPPED, _skipAd);

            // Load the instream item
            _adModel.loadVideo();
        };

        function errorHandler(evt) {
            _sendEvent(evt.type, evt);
        }

        /** Stop the instream playback and revert the main player back to its original state **/
        _this.instreamDestroy = function() {
            if (!_adModel) {
                return;
            }

            if (_skipButton) {
                _view.controlsContainer().removeChild(_skipButton.element());
            }

            _adModel.off('fullscreenchange', _nativeFullscreenHandler);
            clearTimeout(_completeTimeoutId);
            _completeTimeoutId = -1;

            // We don't want the instream provider to be attached to the video tag anymore
            _this.off();
            if (_currentProvider) {
                _currentProvider.detachMedia();
                _currentProvider.resetEventListeners();
                _currentProvider.destroy();
            }
            _adModel.off();

            // Return the view to its normal state
            var adsVideo = _adModel.getVideo();
            _view.destroyInstream((adsVideo) ? adsVideo.isAudioFile() : false);
            if (_view.clickHandler()) {
                if (_oldProvider && _oldProvider.parentElement) {
                    _oldProvider.parentElement.removeEventListener('click', _view.clickHandler().clickHandler);
                }
                _view.clickHandler().revertAlternateClickHandler();
            }
            _adModel = null;

            // Re-attach the controller
            _controller.attachMedia();
            // Load the original item into our provider, which sets up the regular player's video tag
            _oldProvider = _model.getVideo();
            if (_oldstate !== states.IDLE) {
                var item = _.extend({}, _olditem);
                item.starttime = _oldpos;
                _model.loadVideo(item);

            } else {
                _oldProvider.stop();
            }

            if (_oldstate === states.PLAYING) {
                // Model was already correct; just resume playback
                _oldProvider.play();
            }

        };

        /** Start instream playback **/
        _this.instreamPlay = function() {
            if (!_adModel.getVideo()) {
                return;
            }
            _adModel.getVideo().play(true);
        };

        /** Pause instream playback **/
        _this.instreamPause = function() {
            if (!_adModel.getVideo()) {
                return;
            }
            _adModel.getVideo().pause(true);
        };

        _this.instreamState = function() {
            return _adModel.state;
        };


        /*****************************
         ****** Private methods ******
         *****************************/

        function _checkProvider() {
            var provider = _adModel.getVideo();

            if (_currentProvider !== provider) {
                _currentProvider = provider;

                if (!provider) {
                    return;
                }

                provider.resetEventListeners();

                provider.addGlobalListener(_forward);
                provider.addEventListener(events.JWPLAYER_MEDIA_META, _metaHandler);
                provider.addEventListener(events.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
                provider.addEventListener(events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
                provider.addEventListener(events.JWPLAYER_MEDIA_ERROR, errorHandler);

                provider.addEventListener(events.JWPLAYER_PLAYER_STATE, stateHandler);
                provider.addEventListener(events.JWPLAYER_MEDIA_TIME, function(evt) {
                    if (_skipButton) {
                        _skipButton.updateMediaTime(evt.position, evt.duration);
                    }
                });
                provider.attachMedia();
                provider.mute(_model.mute);
                provider.volume(_model.volume);

                _adModel.on('change:state', changeStateEvent, _this);
            }
        }

        function stateHandler(evt) {
            switch (evt.newstate) {
                case states.PLAYING:
                    _model.set('state', evt.newstate);
                    _adModel.set('state', evt.newstate);
                    _this.instreamPlay();
                    break;
                case states.PAUSED:
                    _model.set('state', evt.newstate);
                    _adModel.set('state', evt.newstate);
                    _this.instreamPause();
                    break;
            }
        }

        function _skipAd() {
            _sendEvent(events.JWPLAYER_AD_SKIPPED);
            _completeHandler();
        }

        /** Forward provider events to listeners **/
        function _forward(evt) {
            _sendEvent(evt.type, evt);
        }

        function _nativeFullscreenHandler(evt) {
            _model.trigger(evt.type, evt);
            _sendEvent(events.JWPLAYER_FULLSCREEN, {
                fullscreen: evt.jwstate
            });
        }

        function _fullscreenHandler(evt) {
            // required for updating the controlbars toggle icon
            _forward(evt);
        }

        /** Handle the JWPLAYER_MEDIA_BUFFER_FULL event **/
        function _bufferFullHandler() {
            _adModel.getVideo().play();
        }

        /** Handle the JWPLAYER_MEDIA_COMPLETE event **/
        function _completeHandler() {
            if (_array && _arrayIndex + 1 < _array.length) {
                _arrayIndex++;
                var item = _array[_arrayIndex];
                _item = new PlaylistItem(item);
                _adModel.setPlaylist([item]);
                // check provider after item change
                _checkProvider();

                var curOpt;
                if (_optionList) {
                    curOpt = _optionList[_arrayIndex];
                }
                _options = _.extend({}, _defaultOptions, curOpt);
                _adModel.loadVideo();
                if (_skipButton) {
                    _skipButton.destroy();
                }
                _completeTimeoutId = setTimeout(function() {
                    _sendEvent(events.JWPLAYER_PLAYLIST_ITEM, {
                        index: _arrayIndex
                    });
                }, 0);
            } else {
                _completeTimeoutId = setTimeout(function() {
                    // this is called on every ad completion of the final video in a playlist
                    //   1) vast.js (to trigger ad_complete event)
                    //   2) display.js (to set replay icon and image)
                    _sendEvent(events.JWPLAYER_PLAYLIST_COMPLETE, {});
                    _controller.instreamDestroy();
                }, 0);
            }
        }

        /** Handle the JWPLAYER_MEDIA_META event **/
        function _metaHandler(evt) {
            // If we're getting video dimension metadata from the provider, allow the view to resize the media
            if (evt.width && evt.height) {
                //_view.releaseState();
                _view.resizeMedia();
            }
        }

        function _sendEvent(type, data) {
            data = data || {};
            if (_options.tag && !data.tag) {
                data.tag = _options.tag;
            }
            _this.trigger(type, data);
        }

        return _this;
    };

    return InstreamHtml5;
});
