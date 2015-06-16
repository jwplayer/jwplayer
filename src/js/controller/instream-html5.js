define([
    'utils/helpers',
    'utils/underscore',
    'utils/backbone.events',
    'events/change-state-event',
    'events/events',
    'events/states',
    'controller/model',
    'playlist/item'
], function(utils, _, Events,
            changeStateEvent, events, states, Model, PlaylistItem) {

    var InstreamHtml5 = function(_controller, _model) {

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

        // Gets overridden after load
        this.options = _options;

        // Listen for player resize events
        _controller.on(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);

        /*****************************************
         *****  Public instream API methods  *****
         *****************************************/

        this.init = function() {

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

            this._adModel = _adModel;

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
        };

        /** Load an instream item and initialize playback **/
        _this.load = function(item, options) {
            // TODO: why is this used?
            _this.trigger(events.JWPLAYER_PLAYLIST_ITEM, {
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
            this.options = _options = _.extend({}, _defaultOptions, options);
            _item = new PlaylistItem(item);

            _adModel.setPlaylist([item]);
            // check provider after item change
            _checkProvider();

            // Match the main player's controls state
            _adModel.off(events.JWPLAYER_ERROR);
            _adModel.on(events.JWPLAYER_ERROR, _forward);

            // Load the instream item
            _adModel.loadVideo();
        };

        /** Stop the instream playback and revert the main player back to its original state **/
        _this.instreamDestroy = function() {
            if (!_adModel) {
                return;
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
            _adModel = null;

            // Re-attach the controller
            _controller.attachMedia();

            // Load the original item into our provider, which sets up the regular player's video tag
            //_oldProvider = _model.getVideo();

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
                provider.addEventListener(events.JWPLAYER_MEDIA_COMPLETE, _completeHandler);
                provider.addEventListener(events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
                provider.addEventListener(events.JWPLAYER_MEDIA_ERROR, _forward);

                provider.addEventListener(events.JWPLAYER_PLAYER_STATE, stateHandler);
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

        /** Forward provider events to listeners **/
        function _forward(evt) {
            _this.trigger(evt.type, evt);
        }

        function _nativeFullscreenHandler(evt) {
            _model.trigger(evt.type, evt);
            _this.trigger(events.JWPLAYER_FULLSCREEN, {
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
        var _completeHandler = this.completeHandler = function() {
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
                    _this.trigger(events.JWPLAYER_PLAYLIST_ITEM, {
                        index: _arrayIndex
                    });
                }, 0);
            } else {
                _completeTimeoutId = setTimeout(function() {
                    // this is called on every ad completion of the final video in a playlist
                    //   1) vast.js (to trigger ad_complete event)
                    //   2) display.js (to set replay icon and image)
                    _this.trigger(events.JWPLAYER_PLAYLIST_COMPLETE, {});
                    _controller.instreamDestroy();
                }, 0);
            }
        };

        return _this;
    };

    return InstreamHtml5;
});
