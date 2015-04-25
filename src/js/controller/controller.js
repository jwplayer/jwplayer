define([
    'controller/controller-instream',
    'api/api-deprecate',
    'utils/underscore',
    'controller/Setup',
    'controller/captions',
    'controller/model',
    'playlist/playlist',
    'playlist/loader',
    'utils/helpers',
    'view/view',
    'utils/backbone.events',
    'events/states',
    'events/events',
    'view/errorscreen'
], function(setupInstreamMethods, deprecateInit, _, Setup, Captions,
            Model, Playlist, PlaylistLoader, utils, View, Events, states, events, errorScreen) {

    function _queue(command) {
        return function() {
            var args = Array.prototype.slice.call(arguments, 0);
            this.eventsQueue.push([command, args]);
        };
    }

    // The model stores a different state than the provider
    function normalizeState(newstate) {
        if (newstate === states.LOADING || newstate === states.STALLED) {
            return states.BUFFERING;
        }
        return newstate;
    }

    // The api should dispatch an idle event when the model's state changes to complete
    // This is to avoid conflicts with the complete event and to maintain legacy event flow
    function normalizeApiState(newstate) {
        if (newstate === states.COMPLETE) {
            return states.IDLE;
        }
        return newstate;
    }

    var Controller = function(originalContainer) {
        this.originalContainer = this.currentContainer = originalContainer;
        this.eventsQueue = [];
        _.extend(this, Events);

        this._model = new Model();
    };

    Controller.prototype = {
        play : _queue('play'),
        pause : _queue('pause'),
        setVolume : _queue('setVolume'),
        setMute : _queue('setMute'),
        seek : _queue('seek'),
        stop : _queue('stop'),
        load : _queue('load'),
        playlistNext : _queue('playlistNext'),
        playlistPrev : _queue('playlistPrev'),
        playlistItem : _queue('playlistItem'),
        setFullscreen : _queue('setFullscreen'),
        setCurrentCaptions : _queue('setCurrentCaptions'),
        setCurrentQuality : _queue('setCurrentQuality'),

        setup : function(config, _api) {
            var _model,
                _view,
                _captions,
                _setup,
                _loadOnPlay = -1,
                _preplay = false,
                _actionOnAttach,
                _stopPlaylist = false, // onComplete, should we play next item or not?
                _interruptPlay,
                _this = this;

            _model = this._model.setup(config);
            _view  = this._view  = new View(_api, _model);
            _captions = new Captions(_model);
            _setup = new Setup(_api, _model, _view);

            // Legacy, should be removed
            _this.id = this._model.id;
            // Should be removed when we replace skins.  Should be necessary for instream (_controller.skin is called)
            this.skin = _view._skin;

            _setup.on(events.JWPLAYER_READY, _playerReady, this);
            _setup.on(events.JWPLAYER_SETUP_ERROR, function(evt) {
                _this.setupError(evt.message);
            });
            _setup.start();

            // Helper function
            var _video = this._model.getVideo;

            _model.mediaController.on(events.JWPLAYER_MEDIA_COMPLETE, function() {
                // Insert a small delay here so that other complete handlers can execute
                _.defer(_completeHandler);
            });
            _model.mediaController.on(events.JWPLAYER_MEDIA_ERROR, function(evt) {
                // Re-dispatch media errors as general error
                var evtClone = _.extend({}, evt);
                evtClone.type = events.JWPLAYER_ERROR;
                this.trigger(evtClone.type, evtClone);
            }, this);

            function initMediaModel() {
                _model.mediaModel.on('change:state', function(mediaModel, state) {
                    var modelState = normalizeState(state);
                    _model.set('state', modelState);
                });
            }
            initMediaModel();
            _model.on('change:mediaModel', initMediaModel);

            function _playerReady() {
                _setup.destroy();
                _setup = null;

                _model.on('change:state', function(model, newstate, oldstate) {
                    newstate = normalizeApiState(newstate);
                    oldstate = normalizeApiState(oldstate);
                    // do not dispatch idle a second time after complete
                    if (newstate !== oldstate) {
                        // buffering, playing and paused states become:
                        // buffer, play and pause events
                        var eventType = newstate.replace(/(?:ing|d)$/, '');
                        var evt = {
                            type: eventType,
                            newstate: newstate,
                            oldstate: oldstate,
                            reason: model.mediaModel.get('state')
                        };
                        _this.trigger(eventType, evt);
                    }
                });

                // For 'onCast' callback
                _model.on('change:castState', function(model, evt) {
                    _this.trigger(events.JWPLAYER_CAST_SESSION, evt);
                });
                // For 'onFullscreen' callback
                _model.on('change:fullscreen', function(model, bool) {
                    _this.trigger(events.JWPLAYER_FULLSCREEN, {
                        fullscreen: bool
                    });
                });
                // For onItem callback
                _model.on('change:playlistItem', function(model, playlistItem) {
                    _this.trigger(events.JWPLAYER_PLAYLIST_ITEM, {
                        index: model.get('item'),
                        item: playlistItem
                    });
                });
                // For onPlaylist callback
                _model.on('change:playlist', function(model, playlist) {
                    if (playlist.length) {
                        _this.trigger(events.JWPLAYER_PLAYLIST_LOADED, {
                            playlist: playlist
                        });
                    }
                });
                _model.on('change:volume', function(model, vol) {
                    _this.trigger(events.JWPLAYER_MEDIA_VOLUME, {
                        volume: vol
                    });
                });
                _model.on('change:mute', function(model, mute) {
                    _this.trigger(events.JWPLAYER_MEDIA_MUTE, {
                        mute: mute
                    });
                });

                _model.on('change:scrubbing', function(model, state) {
                    if (state) {
                        _pause();
                    } else {
                        _play();
                    }
                });

                // For onCaptionsList and onCaptionsChange
                _model.on('change:captionsList', function(model, captionsList) {
                    _this.trigger(events.JWPLAYER_CAPTIONS_LIST, {
                        tracks: captionsList,
                        track: model.get('captionsIndex')
                    });
                });
                _model.on('change:captionsIndex', function(model, captionsIndex) {
                    _this.trigger(events.JWPLAYER_CAPTIONS_CHANGED, {
                        tracks: model.get('captions'),
                        track: captionsIndex
                    });
                });

                _model.mediaController.on('all', _this.trigger.bind(_this));
                _view.on('all', _this.trigger.bind(_this));

                this.showView(_view.element());

                // prevent video error in display on window close
                window.addEventListener('beforeunload', function() {
                    if (!_isCasting()) { // don't call stop while casting
                        _stop(true);
                    }
                });

                // Tell the api that we are loaded
                _this.trigger(events.JWPLAYER_READY, {
                    // this will be updated by Api
                    setupTime: 0
                });

                _this.trigger(events.JWPLAYER_PLAYLIST_LOADED, {
                    playlist: _model.get('playlist')
                });
                _this.trigger(events.JWPLAYER_PLAYLIST_ITEM, {
                    index: _model.get('item'),
                    item: _model.get('playlistItem')
                });
                _this.trigger(events.JWPLAYER_CAPTIONS_LIST, {
                    tracks: _model.get('captions'),
                    track: _model.get('captionsIndex')
                });

                _load();

                if (_model.get('autostart') && !utils.isMobile()) {
                    _play();
                }

                while (_this.eventsQueue.length > 0) {
                    var q = _this.eventsQueue.shift();
                    var method = q[0];
                    var args = q[1] || [];
                    _this[method].apply(_this, args);
                }
            }

            function _load(item) {
                _stop(true);

                switch (typeof item) {
                    case 'string':
                        _loadPlaylist(item);
                        break;
                    case 'object':
                        _model.setPlaylist(Playlist(item));
                        break;
                    case 'number':
                        _model.setItem(item);
                        break;
                }
            }

            function _loadPlaylist(toLoad) {
                var loader = new PlaylistLoader();
                loader.on(events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
                    _load(evt.playlist);
                });
                loader.on(events.JWPLAYER_ERROR, function(evt) {
                    _load([]);
                    evt.message = 'Could not load playlist: ' + evt.message;
                    _this.trigger.call(_this, evt.type, evt);
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
                var fromApi = !internal;

                _actionOnAttach = null;

                var status = utils.tryCatch(function() {
                    _video().stop();
                }, _this);

                if (status instanceof utils.Error) {
                    this.trigger(events.JWPLAYER_ERROR, status);
                    return false;
                }

                if (fromApi) {
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
                var state = _model.get('state');
                return (state === states.IDLE || state === states.COMPLETE);
            }

            function _seek(pos) {
                if (!_model.get('scrubbing') && _model.get('state') !== states.PLAYING) {
                    _play(true);
                }
                _video().seek(pos);
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

                var idx = _model.get('item');
                if (idx === _model.get('playlist').length - 1) {
                    // If it's the last item in the playlist
                    if (_model.get('repeat')) {
                        _next();
                    } else {
                        _model.set('state', states.COMPLETE);
                        _loadOnPlay = 0;
                        _this.trigger(events.JWPLAYER_PLAYLIST_COMPLETE, {});
                    }
                    return;
                }

                // It wasn't the last item in the playlist,
                //  so go to the next one
                _next();
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

            function _getVisualQuality() {
                if (this._model.mediaModel) {
                    return this._model.mediaModel.visualQuality;
                }
                // if quality is not implemented in the provider,
                // return quality info based on current level
                var qualityLevels = _getQualityLevels();
                if (qualityLevels) {
                    var levelIndex = _getCurrentQuality();
                    var level = qualityLevels[levelIndex];
                    if (level) {
                        return {
                            level: _.extend({
                                index: levelIndex
                            }, level),
                            mode: '',
                            reason: ''
                        };
                    }
                }
                return null;
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
                _captions.setCurrentCaptions(caption);
            }

            function _getCurrentCaptions() {
                return _captions.getCurrentCaptions();
            }

            function _getCaptionsList() {
                return _captions.getCaptionsList();
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

            function _isCasting() {
                var provider = _model.getVideo();
                if (provider) {
                    return provider.isCaster;
                }
                return false;
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

            /** Controller API / public methods **/
            this.play = _play;
            this.pause = _pause;
            this.seek = _seek;
            this.stop = _stop;
            this.load = _load;
            this.playlistNext = _next;
            this.playlistPrev = _prev;
            this.playlistItem = _item;
            this.setCurrentCaptions = _setCurrentCaptions;
            this.setCurrentQuality = _setCurrentQuality;

            this.detachMedia = _detachMedia;
            this.attachMedia = _attachMedia;
            this.getCurrentQuality = _getCurrentQuality;
            this.getQualityLevels = _getQualityLevels;
            this.setCurrentAudioTrack = _setCurrentAudioTrack;
            this.getCurrentAudioTrack = _getCurrentAudioTrack;
            this.getAudioTracks = _getAudioTracks;
            this.getCurrentCaptions = _getCurrentCaptions;
            this.getCaptionsList = _getCaptionsList;
            this.getVisualQuality = _getVisualQuality;

            // Model passthroughs
            this.setVolume = _model.setVolume;
            this.setMute = _model.setMute;
            this.seekDrag = _model.seekDrag;
            this.getProvider = function(){ return _model.get('provider'); };

            // View passthroughs
            this.getContainer = function(){ return this.currentContainer; };
            this.resize = _view.resize;
            this.getSafeRegion = _view.getSafeRegion;
            //this.forceState = _view.forceState;
            //this.releaseState = _view.releaseState;
            this.setCues = _view.addCues;
            this.setFullscreen = _view.fullscreen;
            this.addButton = function(img, tooltip, callback, id) {
                var btn;
                if (_.isObject(img)) {
                    // Handle passing in an object
                    btn = img;
                    btn.id = _.uniqueId();
                } else {
                    // Handle legacy setup
                    btn = {
                        img : img,
                        tooltip : tooltip,
                        callback : callback,
                        id : id
                    };
                }

                var dock = _model.get('dock') || [];
                dock.push(btn);
                _model.set('dock', dock);
            };

            this.removeButton = function(id) {
                var dock = _model.get('dock') || [];
                dock = _.reject(dock, _.matches({id : id}));
                _model.set('dock', dock);
            };

            this.checkBeforePlay = function() {
                return _preplay;
            };

            this.getItemQoe = function() {
                return _model._qoeItem;
            };

            this.setControls = function (mode) {
                _model.set('controls', mode);
                if (this._instreamPlayer) {
                    this._instreamPlayer.setControls(mode);
                }
            };

            this.playerDestroy = function () {
                this.stop();
                if (_view) {
                    _view.destroy();
                }
                if (_model) {
                    _model.destroy();
                }
                if (_setup) {
                    _setup.destroy();
                    _setup = null;
                }
            };

            this.isBeforePlay = this.checkBeforePlay;

            this.isBeforeComplete = function () {
                return _model.getVideo().checkComplete();
            };


            // Add in all the instream methods
            setupInstreamMethods(this, _model, _view);

            // This is here because it binds to the methods declared above
            deprecateInit(_api, this);
        },

        showView: function(viewElement){
            if(this.currentContainer.parentElement) {
                this.currentContainer.parentElement.replaceChild(viewElement, this.currentContainer);
            }
            this.currentContainer = viewElement;
        },

        setupError: function(message){
            var errorScreenElement = utils.createElement(errorScreen(message));

            var width = this._model.get('width'),
                height = this._model.get('height');

            utils.style(errorScreenElement, {
                    width: width.toString().indexOf('%') > 0 ? width : (width+ 'px'),
                    height: height.toString().indexOf('%') > 0 ? height : (height + 'px')
            });

            this.showView(errorScreenElement);
        },

        reset: function() {
            this.showView(this.originalContainer);
        }
    };

    return Controller;
});

