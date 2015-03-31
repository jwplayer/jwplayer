define([
    'api/internal-api',
    'underscore',
    'controller/Setup',
    'controller/model',
    'playlist/playlist',
    'playlist/loader',
    'utils/helpers',
    'view/view',
    'utils/backbone.events',
    'events/states',
    'events/events'
], function(setupInternalApi, _, Setup, Model, Playlist, PlaylistLoader, utils, View, Events, states, events) {

    var Controller = function(config, _api) {

        var _ready = false,
            _model,
            _view,
            _setup,
            _loadOnPlay = -1,
            _preplay = false,
            _actionOnAttach,
            _stopPlaylist = false, // onComplete, should we play next item or not?
            _interruptPlay,
            _queuedCalls = [],
            _this = _.extend(this, Events);

        _model = this._model = new Model(config);
        _view  = this._view  = new View(_api, _model);
        _setup = this._setup = new Setup(_model, _view);

        // Legacy, should be removed
        _this.id = this._model.id;
        // Should be removed when we replace skins.  Should be necessary for instream (_controller.skin is called)
        this.skin = _view._skin;

        _setup.addEventListener(events.JWPLAYER_READY, _playerReady);
        _setup.addEventListener(events.JWPLAYER_ERROR, _setupErrorHandler);
        _setup.start();

        // Helper function
        var _video = this._model.getVideo;

        _model.addEventListener(events.JWPLAYER_MEDIA_BUFFER_FULL, _bufferFullHandler);
        _model.addEventListener(events.JWPLAYER_MEDIA_COMPLETE, function() {
            // Insert a small delay here so that other complete handlers can execute
            setTimeout(_completeHandler, 25);
        });
        _model.addEventListener(events.JWPLAYER_MEDIA_ERROR, function(evt) {
            // Re-dispatch media errors as general error
            var evtClone = _.extend({}, evt);
            evtClone.type = events.JWPLAYER_ERROR;
            _this.trigger(evtClone.type, evtClone);
        });

        function _setupErrorHandler(evt) {
            _this.trigger(events.JWPLAYER_SETUP_ERROR, evt);
        }

        function _playerReady(evt) {
            if (_ready) {
                return;
            }

            _view.completeSetup();
            _this.trigger(evt.type, evt);

            // Tell the api that we are loaded
            _api.playerReady(evt);

            _model.addGlobalListener(_forward);
            _view.addGlobalListener(_forward);

            // TODO: send copies of these objects to public listeners
            var playlist = _model.get('playlist');
            var item = _model.get('item');

            _this.trigger(events.JWPLAYER_PLAYLIST_LOADED, {
                playlist: playlist
            });
            _this.trigger(events.JWPLAYER_PLAYLIST_ITEM, {
                index: item
            });

            _load();

            if (_model.get('autostart') && !utils.isMobile()) {
                _play();
            }

            _ready = true;

            while (_queuedCalls.length > 0) {
                var queuedCall = _queuedCalls.shift();
                _callMethod(queuedCall.method, queuedCall.arguments);
            }
        }

        function _forward(evt) {
            _this.trigger(evt.type, evt);
        }

        function _bufferFullHandler() {
            _model.playVideo();
        }

        function _load(item) {
            _stop(true);

            switch (utils.typeOf(item)) {
                case 'string':
                    _loadPlaylist(item);
                    break;
                case 'object':
                case 'array':
                    _model.setPlaylist(Playlist(item));
                    break;
                case 'number':
                    _model.setItem(item);
                    break;
            }
        }

        function _loadPlaylist(toLoad) {
            var loader = new PlaylistLoader();
            loader.addEventListener(events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
                _load(evt.playlist);
            });
            loader.addEventListener(events.JWPLAYER_ERROR, function(evt) {
                _load([]);
                evt.message = 'Could not load playlist: ' + evt.message;
                _forward(evt);
            });
            loader.load(toLoad);
        }

        function _play(state) {
            var status;
            if (state === false) {
                return _pause();
            }

            if (_loadOnPlay >= 0) {
                _load(_loadOnPlay);
                _loadOnPlay = -1;
            }
            //_actionOnAttach = _play;
            if (!_preplay) {
                _preplay = true;
                _this.trigger(events.JWPLAYER_MEDIA_BEFOREPLAY, {});
                _preplay = false;
                if (_interruptPlay) {
                    _interruptPlay = false;
                    _actionOnAttach = null;
                    return;
                }
            }

            if (_isIdle()) {
                if (_model.get('playlist').length === 0) {
                    return false;
                }

                status = utils.tryCatch(function() {
                    _model.loadVideo();
                });
            } else if (_model.get('state') === states.PAUSED) {
                status = utils.tryCatch(function() {
                    _model.playVideo();
                });
            }

            if (status instanceof utils.Error) {
                _this.trigger(events.JWPLAYER_ERROR, status);
                _actionOnAttach = null;
                return false;
            }
            return true;
        }

        function _stop(internal) {
            _actionOnAttach = null;

            var status = utils.tryCatch(function() {
                _video().stop();
            }, _this);

            if (status instanceof utils.Error) {
                this.trigger(events.JWPLAYER_ERROR, status);
                return false;
            }

            if (!internal) {
                _stopPlaylist = true;
            }

            if (_preplay) {
                _interruptPlay = true;
            }

            return true;
        }

        function _pause(state) {
            _actionOnAttach = null;
            if (!utils.exists(state)) {
                state = true;
            } else if (!state) {
                return _play();
            }
            switch (_model.get('state')) {
                case states.PLAYING:
                case states.BUFFERING:
                    var status = utils.tryCatch(function(){
                        _video().pause();
                    }, this);

                    if (status instanceof utils.Error) {
                        _this.trigger(events.JWPLAYER_ERROR, status);
                        return false;
                    }
                    break;
                default:
                    if (_preplay) {
                        _interruptPlay = true;
                    }
            }
            return true;
        }

        function _isIdle() {
            return (_model.get('state') === states.IDLE);
        }

        function _seek(pos) {
            if (!_model.get('dragging') && _model.get('state') !== states.PLAYING) {
                _play(true);
            }
            _video().seek(pos);
        }

        function _setFullscreen(state) {
            _view.fullscreen(state);
        }

        function _item(index) {
            _load(index);
            _play();
        }

        function _prev() {
            _item(_model.get('item') - 1);
        }

        function _next() {
            _item(_model.get('item') + 1);
        }

        function _completeHandler() {
            if (!_isIdle()) {
                // Something has made an API call before the complete handler has fired.
                return;
            } else if (_stopPlaylist) {
                // Stop called in onComplete event listener
                _stopPlaylist = false;
                return;
            }

            _actionOnAttach = _completeHandler;
            if (_model.get('repeat')) {
                _next();
            } else {
                if (_model.get('item') === _model.get('playlist').length - 1) {
                    _loadOnPlay = 0;
                    _stop(true);
                    setTimeout(function() {
                        _this.trigger(events.JWPLAYER_PLAYLIST_COMPLETE, {});
                    }, 0);
                } else {
                    _next();
                }
            }
        }

        function _setCurrentQuality(quality) {
            _video().setCurrentQuality(quality);
        }

        function _getCurrentQuality() {
            if (_video()) {
                return _video().getCurrentQuality();
            }
            return -1;
        }

        function _getQualityLevels() {
            if (_video()) {
                return _video().getQualityLevels();
            }
            return null;
        }

        function _setCurrentAudioTrack(index) {
            _video().setCurrentAudioTrack(index);
        }

        function _getCurrentAudioTrack() {
            if (_video()) {
                return _video().getCurrentAudioTrack();
            }
            return -1;
        }

        function _getAudioTracks() {
            if (_video()) {
                return _video().getAudioTracks();
            }
            return null;
        }
        function _setCurrentCaptions(caption) {
            _view.setCurrentCaptions(caption);
        }

        function _getCurrentCaptions() {
            return _view.getCurrentCaptions();
        }

        function _getCaptionsList() {
            return _view.getCaptionsList();
        }

        /** Used for the InStream API **/
        function _detachMedia() {
            var provider = _model.getVideo();
            if (provider) {
                var video = provider.detachMedia();
                if (video instanceof HTMLVideoElement) {
                    return video;
                }
            }
            return null;
        }

        function _attachMedia(seekable) {
            // Called after instream ends
            var status = utils.tryCatch(function() {
                _model.getVideo().attachMedia(seekable);
            });

            if (status instanceof utils.Error) {
                utils.log('Error calling detachMedia', status);
                return;
            }

            if (typeof _actionOnAttach === 'function') {
                _actionOnAttach();
            }
        }

        function _waitForReady(func) {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0);
                if (_ready) {
                    _callMethod(func, args);
                } else {
                    _queuedCalls.push({
                        method: func,
                        arguments: args
                    });
                }
            };
        }

        function _callMethod(func, args) {
            func.apply(this, args);
        }



        /** Controller API / public methods **/
        this.play = _waitForReady(_play);
        this.pause = _waitForReady(_pause);
        this.seek = _waitForReady(_seek);
        this.stop = function() {
            // Something has called stop() in an onComplete handler
            if (_isIdle()) {
                _stopPlaylist = true;
            }
            _waitForReady(_stop)();
        };
        this.load = _waitForReady(_load);
        this.next = _waitForReady(_next);
        this.prev = _waitForReady(_prev);
        this.item = _waitForReady(_item);
        this.setVolume = _waitForReady(_model.setVolume);
        this.setMute = _waitForReady(_model.setMute);
        this.setFullscreen = _waitForReady(_setFullscreen);
        this.detachMedia = _detachMedia;
        this.attachMedia = _attachMedia;
        this.setCurrentQuality = _waitForReady(_setCurrentQuality);
        this.getCurrentQuality = _getCurrentQuality;
        this.getQualityLevels = _getQualityLevels;
        this.setCurrentAudioTrack = _setCurrentAudioTrack;
        this.getCurrentAudioTrack = _getCurrentAudioTrack;
        this.getAudioTracks = _getAudioTracks;
        this.setCurrentCaptions = _waitForReady(_setCurrentCaptions);
        this.getCurrentCaptions = _getCurrentCaptions;
        this.getCaptionsList = _getCaptionsList;
        this.getProvider = function(){ return _model.get('provider'); };
        this.checkBeforePlay = function() {
            return _preplay;
        };

        this.getItemQoe = function() {
            return _model._qoeItem;
        };

        this.playerReady = _playerReady;

        // Add in all the jwGet____ methods
        setupInternalApi(this, _model, _view);
    };

    return Controller;

});
