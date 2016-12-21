define([
    'api/config',
    'controller/instream-adapter',
    'utils/underscore',
    'controller/Setup',
    'controller/captions',
    'controller/model',
    'controller/storage',
    'playlist/playlist',
    'playlist/loader',
    'utils/helpers',
    'view/view',
    'utils/backbone.events',
    'events/change-state-event',
    'events/states',
    'events/events',
    'view/error'
], function(Config, InstreamAdapter, _, Setup, Captions, Model, Storage,
            Playlist, PlaylistLoader, utils, View, Events, changeStateEvent, states, events, error) {

    function _queueCommand(command) {
        return function(){
            var args = Array.prototype.slice.call(arguments, 0);

            if (!this._model.getVideo()) {
                this.eventsQueue.push([command, args]);
            } else {
                this['_'+command].apply(this, args);
            }
        };
    }

    // The model stores a different state than the provider
    function normalizeState(newstate) {
        if (newstate === states.LOADING || newstate === states.STALLED) {
            return states.BUFFERING;
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
        /** Controller API / public methods **/
        play : _queueCommand('play'),
        pause : _queueCommand('pause'),
        seek : _queueCommand('seek'),
        stop : _queueCommand('stop'),
        load : _queueCommand('load'),
        playlistNext : _queueCommand('next'),
        playlistPrev : _queueCommand('prev'),
        playlistItem : _queueCommand('item'),
        setCurrentCaptions : _queueCommand('setCurrentCaptions'),
        setCurrentQuality : _queueCommand('setCurrentQuality'),
        setFullscreen : _queueCommand('setFullscreen'),

        setup : function(options, _api) {

            var _model = this._model,
                _view,
                _captions,
                _setup,
                _preplay = false,
                _actionOnAttach,
                _stopPlaylist = false, // onComplete, should we play next item or not?
                _interruptPlay,
                _this = this,
                _xo; // Intersection Observer - used for playing video on mobile when visible

            var _video = function() { return _model.getVideo(); };

            var storage = new Storage();
            storage.track(_model);
            var config = new Config(options, storage);

            var _eventQueuedUntilReady = [];

            _model.setup(config, storage);
            _view  = this._view = new View(_api, _model);
            _setup = new Setup(_api, _model, _view, _setPlaylist);

            _setup.on(events.JWPLAYER_READY, _playerReady, this);
            _setup.on(events.JWPLAYER_SETUP_ERROR, this.setupError, this);

            _model.mediaController.on('all', _triggerAfterReady, this);
            _model.mediaController.on(events.JWPLAYER_MEDIA_COMPLETE, function() {
                // Insert a small delay here so that other complete handlers can execute
                _.defer(_completeHandler);
            });
            _model.mediaController.on(events.JWPLAYER_MEDIA_ERROR, this.triggerError, this);

            // If we attempt to load flash, assume it is blocked if we don't hear back within a second
            _model.on('change:flashBlocked', function(model, isBlocked) {
                if (!isBlocked) {
                    this._model.set('errorEvent', undefined);
                    return;
                }
                // flashThrottle indicates whether this is a throttled event or plugin blocked event
                var throttled = !!model.get('flashThrottle');
                var errorEvent  = {
                    message: throttled ? 'Click to run Flash' : 'Flash plugin failed to load'
                };
                // Only dispatch an error for Flash blocked, not throttled events
                if (!throttled) {
                    this.trigger(events.JWPLAYER_ERROR, errorEvent);
                }
                this._model.set('errorEvent', errorEvent);
            }, this);

            _model.on('change:state', changeStateEvent, this);

            _model.on('change:castState', function(model, evt) {
                _this.trigger(events.JWPLAYER_CAST_SESSION, evt);
            });
            _model.on('change:fullscreen', function(model, bool) {
                _this.trigger(events.JWPLAYER_FULLSCREEN, {
                    fullscreen: bool
                });
               if (bool && _xo) {
                   // Stop autoplay behavior when the player enters fullscreen
                   _stopObserving();
               }
            });
            _model.on('itemReady', function() {
                _this.triggerAfterReady(events.JWPLAYER_PLAYLIST_ITEM, {
                    index: _model.get('item'),
                    item: _model.get('playlistItem')
                });
            });
            _model.on('change:playlist', function(model, playlist) {
                if (playlist.length) {
                    _this.triggerAfterReady(events.JWPLAYER_PLAYLIST_LOADED, {
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
            _model.on('change:controls', function(model, mode) {
                _this.trigger(events.JWPLAYER_CONTROLS, {
                    controls: mode
                });
            });

            _model.on('change:scrubbing', function(model, state) {
                if (state) {
                    _pause();
                } else {
                    _play({ reason: 'interaction' });
                }
            });

            // For onCaptionsList and onCaptionsChange
            _model.on('change:captionsList', function(model, captionsList) {
                try {
                    _this.triggerAfterReady(events.JWPLAYER_CAPTIONS_LIST, {
                        tracks: captionsList,
                        track: _getCurrentCaptions()
                    });
                } catch (e) {
                    utils.log('Error with captionsList event:', e);
                }
            });

            _model.on('change:mediaModel', function(model) {
                model.mediaModel.on('change:state', function(mediaModel, state) {
                    var modelState = normalizeState(state);
                    model.set('state', modelState);
                });
            });

            // Ensure captionsList event is raised after playlistItem
            _captions = new Captions(_api, _model);

            function _triggerAfterReady(type, e) {
                _this.triggerAfterReady(type, e);
            }

            function _playerReady() {
                _setup = null;

                _view.on('all', _triggerAfterReady, _this);

                _this.showView(_view.element());

                // Defer triggering of events until they can be registered
                _.defer(_playerReadyNotify);
            }

            function _playerReadyNotify() {
                // Tell the api that we are loaded
                _this.trigger(events.JWPLAYER_READY, {
                    // this will be updated by Api
                    setupTime: 0
                });

                // Stop queueing certain events
                _this.triggerAfterReady = _this.trigger;

                // Send queued events
                for (var i = 0; i < _eventQueuedUntilReady.length; i++) {
                    var event = _eventQueuedUntilReady[i];
                    _this.trigger(event.type, event.args);
                }

                var related = _api.getPlugin('related');
                if (related) {
                    related.on('nextUp', _model.setNextUp, _model);
                }
                // Start playback on desktop and mobile browsers when allowed
                if (_canAutoStart()) {
                    if (utils.isMobile() && _video().video) {
                        // Only play if the video is in the viewport
                        _observeVideo(_video().video);
                    } else {
                        _autoStart();
                    }
                }
            }

            function _observeVideo(video) {
                if ('IntersectionObserver' in window &&
                    'IntersectionObserverEntry' in window &&
                    'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
                    _startObserving(video);
                } else {
                    require.ensure(['polyfills/intersection-observer'], function (require) {
                        require('polyfills/intersection-observer');
                        _startObserving(video);
                    }, 'polyfills.intersection-observer');
                }
            }

            function _startObserving(video) {
                if (!window.IntersectionObserver) {
                    return;
                }
                _xo = new window.IntersectionObserver(_toggleVideoPlayback, { threshold: 0.5 });
                _xo.observe(video);
            }

            function _stopObserving() {
                _xo.disconnect();
                _xo = undefined;
            }

            function _toggleVideoPlayback(entries) {
                if (entries && entries.length) {
                    var video = _video().video;
                    var entry = entries[0];
                    var meta = { reason: 'autostart' };

                    if (entry.target === video && entry.intersectionRatio >= 0.5) {
                        _this.play(meta);
                    } else {
                        _this.pause(meta);
                    }
                }
            }

            this.triggerAfterReady = function(type, args) {
                _eventQueuedUntilReady.push({
                    type: type,
                    args: args
                });
            };

            function _loadProvidersForPlaylist(playlist) {
                var providersManager = _model.getProviders();
                var providersNeeded = providersManager.required(playlist, _model.get('primary'));
                return providersManager.load(providersNeeded)
                    .then(function() {
                        if (!_this.getProvider()) {
                            _model.setProvider(_model.get('playlistItem'));

                            _executeQueuedEvents();
                        }
                    });
            }

            function _executeQueuedEvents() {
                while (_this.eventsQueue.length > 0) {
                    var q = _this.eventsQueue.shift();
                    var method = q[0];
                    var args = q[1] || [];
                    _this['_'+method].apply(_this, args);
                }
            }

            function _load(item) {
                if (_model.get('state') === states.ERROR) {
                    _model.set('state', states.IDLE);
                }
                _model.set('preInstreamState', 'instream-idle');

                _stop(true);

                if (_canAutoStart()) {
                    _model.once('itemReady', _autoStart);
                }
                _this.trigger('destroyPlugin', {});

                switch (typeof item) {
                    case 'string':
                        _loadPlaylist(item);
                        break;
                    case 'object':
                        var success = _setPlaylist(item);
                        if (success) {
                            _setItem(0);
                        }
                        break;
                    case 'number':
                        _setItem(item);
                        break;
                }
            }

            function _loadPlaylist(toLoad) {
                var loader = new PlaylistLoader();
                loader.on(events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
                    _load(evt.playlist);
                });
                loader.on(events.JWPLAYER_ERROR, function(evt) {
                    evt.message = 'Error loading playlist: ' + evt.message;
                    this.triggerError(evt);
                }, this);
                loader.load(toLoad);
            }

            function _getAdState() {
                return _this._instreamAdapter && _this._instreamAdapter.getState();
            }

            function _getState() {
                var adState = _getAdState();
                if (_.isString(adState)) {
                    return adState;
                }
                return _model.get('state');
            }

            function _play(meta) {
                var status;

                if (meta) {
                    _model.set('playReason', meta.reason);
                }

                if (_model.get('state') === states.ERROR) {
                    return;
                }

                var adState = _getAdState();
                if (_.isString(adState)) {
                    // this will resume the ad. _api.playAd would load a new ad
                    return _api.pauseAd(false);
                }

                if (_model.get('state') === states.COMPLETE) {
                    _stop(true);
                    _setItem(0);
                }
                if (!_preplay) {
                    _preplay = true;
                    _this.trigger(events.JWPLAYER_MEDIA_BEFOREPLAY, {'playReason': _model.get('playReason')});
                    _preplay = false;
                    if (_interruptPlay) {
                        _interruptPlay = false;
                        _actionOnAttach = null;
                        return;
                    }
                }

                // TODO: The state is idle while providers load
                if (_isIdle()) {
                    if (_model.get('playlist').length === 0) {
                        return false;
                    }

                    status = utils.tryCatch(function() {
                        // FIXME: playAttempt is not triggered until this is called. Should be on play()
                        _model.loadVideo();
                    });
                } else if (_model.get('state') === states.PAUSED) {
                    status = utils.tryCatch(function() {
                        _model.playVideo();
                    });
                }

                if (status instanceof utils.Error) {
                    _this.triggerError(status);
                    _actionOnAttach = null;
                    return false;
                }
                return true;
            }

            function _autoStart() {
                _play({ reason: 'autostart' });
            }

            function _stop(internal) {
                // Reset the autostart play
                _model.off('itemReady', _autoStart);

                var fromApi = !internal;

                _actionOnAttach = null;

                var status = utils.tryCatch(function() {
                    _model.stopVideo();
                }, _this);

                if (status instanceof utils.Error) {
                    _this.triggerError(status);
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

            function _pause(meta) {
                _actionOnAttach = null;

                if (meta) {
                    _model.set('pauseReason', meta.reason);
                    // Stop autoplay behavior if the video is paused by the user or an api call
                    if (_xo && (meta.reason === 'interaction' || meta.reason === 'external')) {
                        _stopObserving();
                    }
                }

                var adState = _getAdState();
                if (_.isString(adState)) {
                    return _api.pauseAd(true);
                }

                switch (_model.get('state')) {
                    case states.ERROR:
                        return false;
                    case states.PLAYING:
                    case states.BUFFERING:
                        var status = utils.tryCatch(function(){
                            _video().pause();
                        }, this);

                        if (status instanceof utils.Error) {
                            _this.triggerError(status);
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
                return (state === states.IDLE || state === states.COMPLETE || state === states.ERROR);
            }

            function _seek(pos, meta) {
                if (_model.get('state') === states.ERROR) {
                    return;
                }
                if (!_model.get('scrubbing') && _model.get('state') !== states.PLAYING) {
                    _play(meta);
                }
                _video().seek(pos);
            }

            function _item(index, meta) {
                _stop(true);
                if (_model.get('state') === states.ERROR) {
                    _model.set('state', states.IDLE);
                }
                _setItem(index);
                _play(meta);
            }

            function _setPlaylist(p) {
                var playlist = Playlist(p);
                playlist = Playlist.filterPlaylist(playlist, _model);

                _model.set('playlist', playlist);

                if (!_.isArray(playlist) || playlist.length === 0) {
                    _this.triggerError({
                        message: 'Error loading playlist: No playable sources found'
                    });
                    return false;
                }

                _loadProvidersForPlaylist(playlist);

                return true;
            }

            function _setItem(index) {
                _model.setItemIndex(index);
            }

            function _prev(meta) {
                _item(_model.get('item') - 1, meta || {reason: 'external'});
            }

            function _next(meta) {
                _item(_model.get('item') + 1, meta || {reason: 'external'});
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
                        _next({reason: 'repeat'});
                    } else {
                        if (_xo) {
                            // Autoplay/pause no longer needed since there's no more media to play
                            // This prevents media from replaying when a completed video scrolls into view
                            _stopObserving();
                        }
                        _model.set('state', states.COMPLETE);
                        _this.trigger(events.JWPLAYER_PLAYLIST_COMPLETE, {});
                    }
                    return;
                }

                // It wasn't the last item in the playlist,
                //  so go to the next one
                _next({reason: 'playlist'});
            }

            function _setCurrentQuality(index) {
                if (_video()) {
                    index = parseInt(index, 10) || 0;
                    _video().setCurrentQuality(index);
                }
            }

            function _getCurrentQuality() {
                if (_video()) {
                    return _video().getCurrentQuality();
                }
                return -1;
            }

            function _getConfig() {
                if (this._model) {
                    return this._model.getConfiguration();
                }
            }

            function _getVisualQuality() {
                if (this._model.mediaModel) {
                    return this._model.mediaModel.get('visualQuality');
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
                if (_video()) {
                    index = parseInt(index, 10) || 0;
                    _video().setCurrentAudioTrack(index);
                }
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

            function _setCurrentCaptions(index) {
                index = parseInt(index, 10) || 0;

                // update provider subtitle track
                _model.persistVideoSubtitleTrack(index);

                _this.trigger(events.JWPLAYER_CAPTIONS_CHANGED, {
                    tracks: _getCaptionsList(),
                    track: index
                });

            }

            function _getCurrentCaptions() {
                return _captions.getCurrentIndex();
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

            function _attachMedia() {
                // Called after instream ends
                var status = utils.tryCatch(function() {
                    _model.getVideo().attachMedia();
                });

                if (status instanceof utils.Error) {
                    utils.log('Error calling _attachMedia', status);
                    return;
                }

                if (typeof _actionOnAttach === 'function') {
                    _actionOnAttach();
                }
            }

            function _setFullscreen(state) {
                if (!_.isBoolean(state)) {
                    state = !_model.get('fullscreen');
                }

                _model.set('fullscreen', state);
                if (this._instreamAdapter && this._instreamAdapter._adModel) {
                    this._instreamAdapter._adModel.set('fullscreen', state);
                }
            }

            function _nextUp() {
                var related = _api.getPlugin('related');
                if (related) {
                    related.next();
                }
            }

            function _canAutoStart() {
                return (_model.get('autostart') && !utils.isMobile()) || _model.autoStartOnMobile();
            }

            /** Controller API / public methods **/
            this._play = _play;
            this._pause = _pause;
            this._seek = _seek;
            this._stop = _stop;
            this._load = _load;
            this._next = _next;
            this._prev = _prev;
            this._item = _item;
            this._setCurrentCaptions = _setCurrentCaptions;
            this._setCurrentQuality = _setCurrentQuality;
            this._setFullscreen = _setFullscreen;

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
            this.getConfig = _getConfig;
            this.getState = _getState;

            // Model passthroughs
            this.setVolume = _model.setVolume.bind(_model);
            this.setMute = _model.setMute.bind(_model);
            this.getProvider = function(){ return _model.get('provider'); };
            this.getWidth = function() { return _model.get('containerWidth'); };
            this.getHeight = function() { return _model.get('containerHeight'); };

            // View passthroughs
            this.getContainer = function(){ return this.currentContainer; };
            this.resize = _view.resize;
            this.getSafeRegion = _view.getSafeRegion;
            //this.forceState = _view.forceState;
            //this.releaseState = _view.releaseState;
            this.setCues = _view.addCues;
            this.setCaptions = _view.setCaptions;

            this.next = _nextUp;


            this.addButton = function(img, tooltip, callback, id, btnClass) {
                var btn = {
                    img : img,
                    tooltip : tooltip,
                    callback : callback,
                    id : id,
                    btnClass : btnClass
                };

                var dock = _model.get('dock');
                dock = (dock) ? dock.slice(0) : [];
                dock = _.reject(dock, _.matches({id : btn.id}));

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
                if (!_.isBoolean(mode)) {
                    mode = ! _model.get('controls');
                }
                _model.set('controls', mode);

                var provider = _model.getVideo();
                if (provider) {
                    provider.setControls(mode);
                }
            };

            this.playerDestroy = function () {
                this.stop();

                this.showView(this.originalContainer);

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

            this.createInstream = function() {
                this.instreamDestroy();
                this._instreamAdapter = new InstreamAdapter(this, _model, _view);
                return this._instreamAdapter;
            };

            this.skipAd = function() {
                if (this._instreamAdapter) {
                    this._instreamAdapter.skipAd();
                }
            };

            this.instreamDestroy = function() {
                if (_this._instreamAdapter) {
                    _this._instreamAdapter.destroy();
                }
            };

            _setup.start();
        },

        showView: function(viewElement){
            if (!document.documentElement.contains(this.currentContainer)) {
                // This implies the player was removed from the DOM before setup completed
                //   or a player has been "re" setup after being removed from the DOM
                this.currentContainer = document.getElementById(this._model.get('id'));
                if (!this.currentContainer) {
                    return;
                }
            }

            if (this.currentContainer.parentElement) {
                this.currentContainer.parentElement.replaceChild(viewElement, this.currentContainer);
            }
            this.currentContainer = viewElement;
        },

        triggerError: function(evt) {

            this._model.set('errorEvent', evt);
            this._model.set('state', states.ERROR);
            this._model.once('change:state', function() {
                this._model.set('errorEvent', undefined);
            }, this);

            this.trigger(events.JWPLAYER_ERROR, evt);
        },

        setupError: function(evt) {
            var message = evt.message;
            var errorElement = utils.createElement(error(this._model.get('id'), this._model.get('skin'), message));

            var width = this._model.get('width'),
                height = this._model.get('height');

            utils.style(errorElement, {
                width: width.toString().indexOf('%') > 0 ? width : (width+ 'px'),
                height: height.toString().indexOf('%') > 0 ? height : (height + 'px')
            });

            this.showView(errorElement);

            var _this = this;
            _.defer(function() {
                _this.trigger(events.JWPLAYER_SETUP_ERROR, {
                    message: message
                });
            });
        }
    };

    return Controller;
});
