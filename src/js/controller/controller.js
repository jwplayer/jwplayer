import setConfig from '../api/set-config';
import instances from '../api/players';
import { Browser, OS } from 'environment/environment';
import ApiQueueDecorator from '../api/api-queue';

define([
    'controller/instream-adapter',
    'utils/underscore',
    'controller/Setup',
    'controller/captions',
    'controller/model',
    'playlist/playlist',
    'playlist/loader',
    'utils/helpers',
    'view/view',
    'utils/backbone.events',
    'events/change-state-event',
    'events/states',
    'events/events',
    'view/error',
    'controller/events-middleware',
], function(InstreamAdapter, _, Setup, Captions, Model,
            Playlist, PlaylistLoader, utils, View, Events, changeStateEvent, states, events, viewError, eventsMiddleware) {

    // The model stores a different state than the provider
    function normalizeState(newstate) {
        if (newstate === states.LOADING || newstate === states.STALLED) {
            return states.BUFFERING;
        }
        return newstate;
    }

    const Controller = function() {};

    Object.assign(Controller.prototype, {
        setup(config, _api, originalContainer, eventListeners, commandQueue) {
            const _this = this;
            const _model = _this._model = new Model();

            let _view;
            let _captions;
            let _setup;
            let _preplay = false;
            let _actionOnAttach;
            let _stopPlaylist = false;
            let _interruptPlay;
            let _preloaded = false;

            _this.originalContainer = _this.currentContainer = originalContainer;
            _this._events = eventListeners;


            const _eventQueuedUntilReady = [];

            _model.setup(config);
            _view = this._view = new View(_api, _model);

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
                const throttled = !!model.get('flashThrottle');
                const errorEvent = {
                    message: throttled ? 'Click to run Flash' : 'Flash plugin failed to load'
                };
                // Only dispatch an error for Flash blocked, not throttled events
                if (!throttled) {
                    this.trigger(events.JWPLAYER_ERROR, errorEvent);
                }
                this._model.set('errorEvent', errorEvent);
            }, this);

            _model.on('change:state', changeStateEvent, this);

            _model.on('change:duration', function(model, duration) {
                const minDvrWindow = model.get('minDvrWindow');
                const streamType = utils.streamType(duration, minDvrWindow);
                model.setStreamType(streamType);
            });

            _model.on('change:castState', function(model, evt) {
                _this.trigger(events.JWPLAYER_CAST_SESSION, evt);
            });
            _model.on('change:fullscreen', function(model, bool) {
                _this.trigger(events.JWPLAYER_FULLSCREEN, {
                    fullscreen: bool
                });
                if (bool) {
                    // Stop autoplay behavior when the player enters fullscreen
                    model.set('playOnViewable', false);
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
                    const eventData = {
                        playlist: playlist
                    };
                    const feedData = _model.get('feedData');
                    if (feedData) {
                        const eventFeedData = Object.assign({}, feedData);
                        delete eventFeedData.playlist;
                        eventData.feedData = eventFeedData;
                    }
                    _this.triggerAfterReady(events.JWPLAYER_PLAYLIST_LOADED, eventData);
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

            _model.on('change:playbackRate', function(model, rate) {
                _this.trigger(events.JWPLAYER_PLAYBACK_RATE_CHANGED, {
                    playbackRate: rate,
                    position: model.get('position')
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
                _this.triggerAfterReady(events.JWPLAYER_CAPTIONS_LIST, {
                    tracks: captionsList,
                    track: _model.get('captionsIndex') || 0
                });
            });

            _model.on('change:mediaModel', function(model) {
                model.mediaModel.on('change:state', function(mediaModel, state) {
                    model.set('state', normalizeState(state));
                });
            });

            // Ensure captionsList event is raised after playlistItem
            _captions = new Captions(_model);

            function _video() {
                return _model.getVideo();
            }

            function _triggerAfterReady(type, e) {
                _this.triggerAfterReady(type, e);
            }

            function triggerControls(model, enable) {
                _this.trigger(events.JWPLAYER_CONTROLS, {
                    controls: enable
                });
            }

            _model.on('change:viewSetup', function(model, viewSetup) {
                if (viewSetup) {
                    const mediaElement = this.currentContainer.querySelector('video, audio');
                    _this.showView(_view.element());
                    if (mediaElement) {
                        const mediaContainer = _model.get('mediaContainer');
                        mediaContainer.appendChild(mediaElement);
                    }
                }
            }, this);

            function _playerReady() {
                _setup = null;

                _view.on('all', _triggerAfterReady, _this);

                const related = _api.getPlugin('related');
                if (related) {
                    related.on('nextUp', (nextUp) => {
                        _model.set('nextUp', nextUp);
                    });
                }

                // Fire 'ready' once the view has resized so that player width and height are available
                // (requires the container to be in the DOM)
                _view.once(events.JWPLAYER_RESIZE, _playerReadyNotify);

                _view.init();
            }

            function _playerReadyNotify() {
                _model.change('visibility', _updateViewable);
                _model.on('change:controls', triggerControls);

                // Tell the api that we are loaded
                _this.trigger(events.JWPLAYER_READY, {
                    // this will be updated by Api
                    setupTime: 0
                });

                // Stop queueing certain events
                _this.triggerAfterReady = _this.trigger;

                // Send queued events
                for (let i = 0; i < _eventQueuedUntilReady.length; i++) {
                    const event = _eventQueuedUntilReady[i];
                    _preplay = (event.type === events.JWPLAYER_MEDIA_BEFOREPLAY);
                    _this.trigger(event.type, event.args);
                    _preplay = false;
                }

                _checkAutoStart();

                _model.change('viewable', viewableChange);
                _model.change('viewable', _checkPlayOnViewable);
                _model.once('change:autostartFailed change:autostartMuted change:mute', function(model) {
                    model.off('change:viewable', _checkPlayOnViewable);
                });
            }

            function _updateViewable(model, visibility) {
                if (!_.isUndefined(visibility)) {
                    _model.set('viewable', Math.round(visibility));
                }
            }

            function _checkAutoStart() {
                if (!apiQueue) {
                    // this player has been destroyed
                    return;
                }
                if (!OS.mobile && _model.get('autostart') === true) {
                    // Autostart immediately if we're not mobile and not waiting for the player to become viewable first
                    _autoStart();
                }
                apiQueue.flush();
            }

            function viewableChange(model, viewable) {
                _this.trigger('viewable', {
                    viewable: viewable
                });
                if (shouldPreload(model, viewable)) {
                    const item = model.get('playlistItem');

                    model.getVideo().preload(item);
                    _preloaded = true;
                }
            }

            function _checkPlayOnViewable(model, viewable) {
                if (model.get('playOnViewable')) {
                    if (viewable) {
                        _autoStart();
                    } else if (OS.mobile) {
                        _this.pause({ reason: 'autostart' });
                    }
                }
            }

            // Should only attempt to preload if the player is viewable.
            // Otherwise, it should try to preload the first player on the page,
            // which is the player that has a uniqueId of 1
            function shouldPreload(model, viewable) {
                return model.get('playlistItem').preload !== 'none' &&
                    _preloaded === false &&
                    model.get('autostart') === false &&
                    (instances[0] === _api || viewable === 1);
            }

            this.triggerAfterReady = function(type, args) {
                _eventQueuedUntilReady.push({
                    type: type,
                    args: args
                });
            };

            function _loadProvidersForPlaylist(playlist) {
                const providersManager = _model.getProviders();
                const providersNeeded = providersManager.required(playlist);
                return providersManager.load(providersNeeded)
                    .then(function() {
                        if (!_this.getProvider()) {
                            _model.setProvider(_model.get('playlistItem'));
                            // provider is not available under "itemReady" event
                        }
                    });
            }

            function _load(item, feedData) {
                if (_model.get('state') === states.ERROR) {
                    _model.set('state', states.IDLE);
                }
                _model.set('preInstreamState', 'instream-idle');

                _this.trigger('destroyPlugin', {});
                _stop(true);

                _model.once('itemReady', _checkAutoStart);

                switch (typeof item) {
                    case 'string':
                        _loadPlaylist(item);
                        break;
                    case 'object': {
                        const success = _setPlaylist(item, feedData);
                        if (success) {
                            _setItem(0);
                        }
                        break;
                    }
                    case 'number':
                        _setItem(item);
                        break;
                    default:
                        break;
                }
            }

            function _loadPlaylist(toLoad) {
                const loader = new PlaylistLoader();
                loader.on(events.JWPLAYER_PLAYLIST_LOADED, function(data) {
                    _load(data.playlist, data);
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
                const adState = _getAdState();
                if (_.isString(adState)) {
                    return adState;
                }
                return _model.get('state');
            }

            function _play(meta = {}) {
                _model.set('playReason', meta.reason);

                if (_model.get('state') === states.ERROR) {
                    return;
                }

                const adState = _getAdState();
                if (_.isString(adState)) {
                    // this will resume the ad. _api.playAd would load a new ad
                    _api.pauseAd(false);
                    return;
                }

                if (_model.get('state') === states.COMPLETE) {
                    _stop(true);
                    _setItem(0);
                }

                if (!_preplay) {
                    _preplay = true;
                    _this.triggerAfterReady(events.JWPLAYER_MEDIA_BEFOREPLAY, { playReason: _model.get('playReason') });
                    _preplay = false;
                    if (_interruptPlay) {
                        _interruptPlay = false;
                        _actionOnAttach = null;
                        return;
                    }
                }

                // TODO: The state is idle while providers load
                let status;
                if (_isIdle()) {
                    if (_model.get('playlist').length === 0) {
                        return;
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
                }
            }

            function _autoStart() {
                const state = _model.get('state');
                if (state === states.IDLE || state === states.PAUSED) {
                    _play({ reason: 'autostart' });
                }
            }

            function _stop(internal) {
                // Reset the autostart play
                _model.off('itemReady', _checkAutoStart);

                const fromApi = !internal;

                _actionOnAttach = null;
                _preloaded = false;

                const status = utils.tryCatch(function() {
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

            function _pause(meta = {}) {
                _actionOnAttach = null;

                _model.set('pauseReason', meta.reason);
                // Stop autoplay behavior if the video is paused by the user or an api call
                if (meta.reason === 'interaction' || meta.reason === 'external') {
                    _model.set('playOnViewable', false);
                }

                const adState = _getAdState();
                if (_.isString(adState)) {
                    _api.pauseAd(true);
                    return;
                }

                switch (_model.get('state')) {
                    case states.ERROR:
                        return;
                    case states.PLAYING:
                    case states.BUFFERING: {

                        const status = utils.tryCatch(function() {
                            _video().pause();
                        }, this);

                        if (status instanceof utils.Error) {
                            _this.triggerError(status);
                            return;
                        }
                        break;
                    }
                    default:
                        if (_preplay) {
                            _interruptPlay = true;
                        }
                }
            }

            function _isIdle() {
                const state = _model.get('state');
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

            function _setPlaylist(array, feedData) {
                _model.set('feedData', feedData);

                let playlist = Playlist(array);
                playlist = Playlist.filterPlaylist(playlist, _model, feedData);

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
                _item(_model.get('item') - 1, meta);
            }

            function _next(meta) {
                _item(_model.get('item') + 1, meta);
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

                const idx = _model.get('item');
                if (idx === _model.get('playlist').length - 1) {
                    // If it's the last item in the playlist
                    if (_model.get('repeat')) {
                        _next({ reason: 'repeat' });
                    } else {
                        // Exit fullscreen on IOS so that our overlays show to the user
                        if (Browser.iOS) {
                            _setFullscreen(false);
                        }
                        // Autoplay/pause no longer needed since there's no more media to play
                        // This prevents media from replaying when a completed video scrolls into view
                        _model.set('playOnViewable', false);
                        _model.set('state', states.COMPLETE);
                        _this.trigger(events.JWPLAYER_PLAYLIST_COMPLETE, {});
                    }
                    return;
                }

                // It wasn't the last item in the playlist,
                //  so go to the next one
                _next({ reason: 'playlist' });
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
                return this._model ? this._model.getConfiguration() : undefined;
            }

            function _getVisualQuality() {
                if (this._model.mediaModel) {
                    return this._model.mediaModel.get('visualQuality');
                }
                // if quality is not implemented in the provider,
                // return quality info based on current level
                const qualityLevels = _getQualityLevels();
                if (qualityLevels) {
                    const levelIndex = _getCurrentQuality();
                    const level = qualityLevels[levelIndex];
                    if (level) {
                        return {
                            level: Object.assign({
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
                return _model.detachMedia();
            }

            function _attachMedia() {
                // Called after instream ends
                const status = utils.tryCatch(function() {
                    _model.attachMedia();
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
                const related = _api.getPlugin('related');
                if (related) {
                    const nextUp = _model.get('nextUp');
                    if (nextUp) {
                        _this.trigger('nextClick', {
                            mode: nextUp.mode,
                            ui: 'nextup',
                            target: nextUp,
                            itemsShown: [ nextUp ],
                            feedData: nextUp.feedData,
                        });
                    }
                    related.next();
                }
            }

            /** Controller API / public methods **/
            this.load = _load;
            this.play = _play;
            this.pause = _pause;
            this.seek = _seek;
            this.stop = _stop;
            this.playlistItem = _item;
            this.playlistNext = _next;
            this.playlistPrev = _prev;
            this.setCurrentCaptions = _setCurrentCaptions;
            this.setCurrentQuality = _setCurrentQuality;
            this.setFullscreen = _setFullscreen;
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
            this.next = _nextUp;
            this.setConfig = (newConfig) => setConfig(_this, newConfig);

            // Model passthroughs
            this.setVolume = _model.setVolume.bind(_model);
            this.setMute = _model.setMute.bind(_model);
            this.setPlaybackRate = _model.setPlaybackRate.bind(_model);
            this.getProvider = function() {
                return _model.get('provider');
            };
            this.getWidth = function() {
                return _model.get('containerWidth');
            };
            this.getHeight = function() {
                return _model.get('containerHeight');
            };
            this.getItemQoe = function() {
                return _model._qoeItem;
            };
            this.isBeforeComplete = function () {
                return _model.checkComplete();
            };
            this.addButton = function(img, tooltip, callback, id, btnClass) {
                const newButton = {
                    img: img,
                    tooltip: tooltip,
                    callback: callback,
                    id: id,
                    btnClass: btnClass
                };
                let replaced = false;
                const dock = _.map(_model.get('dock'), function(dockButton) {
                    const replaceButton =
                        dockButton !== newButton &&
                        dockButton.id === newButton.id;

                    // replace button if its of the same id/type,
                    // but has different values
                    if (replaceButton) {
                        replaced = true;
                        return newButton;
                    }
                    return dockButton;
                });

                // add button if it has not been replaced
                if (!replaced) {
                    dock.push(newButton);
                }

                _model.set('dock', dock);
            };
            this.removeButton = function(id) {
                let dock = _model.get('dock') || [];
                dock = _.reject(dock, _.matches({ id: id }));
                _model.set('dock', dock);
            };
            // Delegate trigger so we can run a middleware function before any event is bubbled through the API
            this.trigger = function (type, args) {
                const data = eventsMiddleware(_model, type, args);
                return Events.trigger.call(this, type, data);
            };

            // View passthroughs
            this.resize = _view.resize;
            this.getSafeRegion = _view.getSafeRegion;
            this.setCues = _view.addCues;
            this.setCaptions = _view.setCaptions;

            this.checkBeforePlay = function() {
                return _preplay;
            };

            this.setControls = function (mode) {
                if (!_.isBoolean(mode)) {
                    mode = !_model.get('controls');
                }
                _model.set('controls', mode);

                const provider = _model.getVideo();
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
                if (apiQueue) {
                    apiQueue.destroy();
                }
            };

            this.isBeforePlay = this.checkBeforePlay;

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

            // Setup ApiQueueDecorator after instance methods have been assigned
            const apiQueue = new ApiQueueDecorator(this, [
                'load',
                'play',
                'pause',
                'seek',
                'stop',
                'playlistItem',
                'playlistNext',
                'playlistPrev',
                'next',
                'setCurrentAudioTrack',
                'setCurrentCaptions',
                'setCurrentQuality',
                'setFullscreen',
            ], () => !_model.getVideo());
            // Add commands from CoreLoader to queue
            apiQueue.queue.push.apply(apiQueue.queue, commandQueue);

            _setup.start();
        },
        get(property) {
            return this._model.get(property);
        },
        getContainer() {
            return this.currentContainer || this.originalContainer;
        },
        getMute() {
            return this._model.getMute();
        },
        showView(viewElement) {
            if (!document.body.contains(this.currentContainer)) {
                // This implies the player was removed from the DOM before setup completed
                //   or a player has been "re" setup after being removed from the DOM
                const newContainer = document.getElementById(this._model.get('id'));
                if (newContainer) {
                    this.currentContainer = newContainer;
                }
            }

            if (this.currentContainer.parentElement) {
                this.currentContainer.parentElement.replaceChild(viewElement, this.currentContainer);
            }
            this.currentContainer = viewElement;
        },
        triggerError(evt) {
            this._model.set('errorEvent', evt);
            this._model.set('state', states.ERROR);
            this._model.once('change:state', function() {
                this._model.set('errorEvent', undefined);
            }, this);

            this.trigger(events.JWPLAYER_ERROR, evt);
        },
        setupError(evt) {
            const message = evt.message;
            const errorElement = utils.createElement(viewError(this._model.get('id'), message));

            const width = this._model.get('width');
            const height = this._model.get('height');

            utils.style(errorElement, {
                width: width.toString().indexOf('%') > 0 ? width : (width + 'px'),
                height: height.toString().indexOf('%') > 0 ? height : (height + 'px')
            });

            this.showView(errorElement);

            const _this = this;
            _.defer(function() {
                _this.trigger(events.JWPLAYER_SETUP_ERROR, {
                    message: message
                });
            });
        }
    });

    return Controller;
});
