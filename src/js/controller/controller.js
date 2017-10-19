import setConfig from 'api/set-config';

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
    'view/error',
    'controller/events-middleware'
], function(Config, InstreamAdapter, _, Setup, Captions, Model, Storage,
            Playlist, PlaylistLoader, utils, View, Events, changeStateEvent, states, events, error, eventsMiddleware) {

    function _queueCommand(command) {
        return function() {
            var args = Array.prototype.slice.call(arguments, 0);

            if (!this._model.getVideo()) {
                this.eventsQueue.push([command, args]);
            } else {
                this['_' + command].apply(this, args);
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
        play: _queueCommand('play'),
        pause: _queueCommand('pause'),
        seek: _queueCommand('seek'),
        stop: _queueCommand('stop'),
        load: _queueCommand('load'),
        playlistNext: _queueCommand('next'),
        playlistPrev: _queueCommand('prev'),
        playlistItem: _queueCommand('item'),
        setCurrentCaptions: _queueCommand('setCurrentCaptions'),
        setCurrentQuality: _queueCommand('setCurrentQuality'),
        setFullscreen: _queueCommand('setFullscreen'),
        setup: function(options, _api) {
            var _model = this._model;
            var _view;
            var _captions;
            var _setup;
            var _preplay = false;
            var _actionOnAttach;
            var _stopPlaylist = false;
            var _interruptPlay;
            var _this = this;
            var checkAutoStartLastContext = {};

            var _video = function () {
                return _model.getVideo();
            };

            var storage = new Storage();
            storage.track(_model);
            var config = new Config(options, storage);

            var _eventQueuedUntilReady = [];

            _model.setup(config, storage);
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
                var throttled = !!model.get('flashThrottle');
                var errorEvent = {
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
                var minDvrWindow = model.get('minDvrWindow');
                var streamType = utils.streamType(duration, minDvrWindow);
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
                    var eventData = {
                        playlist: playlist
                    };
                    var feedData = _model.get('feedData');
                    if (feedData) {
                        var eventFeedData = _.extend({}, feedData);
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
                for (var i = 0; i < _eventQueuedUntilReady.length; i++) {
                    var event = _eventQueuedUntilReady[i];
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
                if (!utils.isMobile() && _model.get('autostart') === true) {
                    // Autostart immediately if we're not mobile and not waiting for the player to become viewable first
                    _autoStart();
                }
            }

            function autostartFallbackOnItemReady() {
                cancelAutostartFallbackOnItemReady();
                checkAutoStartLastContext = { bail: false };
                _model.once('itemReady', checkAutoStartLast, checkAutoStartLastContext);
            }

            function cancelAutostartFallbackOnItemReady() {
                checkAutoStartLastContext.bail = true;
                _model.off('itemReady', checkAutoStartLast);
            }

            function checkAutoStartLast() {
                // Use promise as setImmediate() to allow synchonous calls to load() and play() set the playReason
                Promise.resolve().then(() => {
                    const context = this;
                    if (context.bail) {
                        return;
                    }
                    _checkAutoStart();
                });
            }

            function viewableChange(model, viewable) {
                _this.trigger('viewable', {
                    viewable: viewable
                });
            }

            function _checkPlayOnViewable(model, viewable) {
                if (_model.get('playOnViewable')) {
                    if (viewable) {
                        _autoStart();
                    } else if (utils.isMobile()) {
                        _this.pause({ reason: 'autostart' });
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
                    _this['_' + method].apply(_this, args);
                }
            }

            function _load(item, feedData) {
                if (_model.get('state') === states.ERROR) {
                    _model.set('state', states.IDLE);
                }
                _model.set('preInstreamState', 'instream-idle');

                _this.trigger('destroyPlugin', {});
                _stop(true);

                autostartFallbackOnItemReady();

                _primeMediaElementForPlayback();

                switch (typeof item) {
                    case 'string':
                        _loadPlaylist(item);
                        break;
                    case 'object':
                        var success = _setPlaylist(item, feedData);
                        if (success) {
                            _setItem(0);
                        }
                        break;
                    case 'number':
                        _setItem(item);
                        break;
                    default:
                        break;
                }
            }

            function _loadPlaylist(toLoad) {
                var loader = new PlaylistLoader();
                loader.on(events.JWPLAYER_PLAYLIST_LOADED, function(data) {
                    _load(data.playlist, data);
                });
                loader.on(events.JWPLAYER_ERROR, function(evt) {
                    evt.message = 'Error loading playlist: ' + evt.message;
                    _this.triggerError(evt);
                }, _this);
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

            function _play(meta = {}) {
                cancelAutostartFallbackOnItemReady();
                _model.set('playReason', meta.reason);

                if (_model.get('state') === states.ERROR) {
                    return;
                }

                var adState = _getAdState();
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
                var status;
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

            function _inInteraction(event) {
                return event && /^(?:mouse|pointer|touch|gesture|click|key)/.test(event.type);
            }

            function _primeMediaElementForPlayback() {
                // If we're in a user-gesture event call load() on video to allow async playback
                if (_inInteraction(window.event)) {
                    const mediaElement = _this.currentContainer.querySelector('video, audio');
                    if (mediaElement && _isIdle()) {
                        mediaElement.load();
                    }
                }
            }

            function _autoStart() {
                var state = _model.get('state');

                if (state === states.IDLE || state === states.PAUSED) {
                    _play({ reason: 'autostart' });
                }
            }

            function _stop(internal) {
                cancelAutostartFallbackOnItemReady();

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

            function _pause(meta = {}) {
                _actionOnAttach = null;

                _model.set('pauseReason', meta.reason);
                // Stop autoplay behavior if the video is paused by the user or an api call
                if (meta.reason === 'interaction' || meta.reason === 'external') {
                    _model.set('playOnViewable', false);
                }

                var adState = _getAdState();
                if (_.isString(adState)) {
                    _api.pauseAd(true);
                    return;
                }

                switch (_model.get('state')) {
                    case states.ERROR:
                        return;
                    case states.PLAYING:
                    case states.BUFFERING:
                        var status = utils.tryCatch(function() {
                            _video().pause();
                        }, this);

                        if (status instanceof utils.Error) {
                            _this.triggerError(status);
                            return;
                        }
                        break;
                    default:
                        if (_preplay) {
                            _interruptPlay = true;
                        }
                }
                return;
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

            function _setPlaylist(array, feedData) {
                _model.set('feedData', feedData);

                var playlist = Playlist(array);
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

                var idx = _model.get('item');
                if (idx === _model.get('playlist').length - 1) {
                    // If it's the last item in the playlist
                    if (_model.get('repeat')) {
                        _next({ reason: 'repeat' });
                    } else {
                        // Exit fullscreen on IOS so that our overlays show to the user
                        if (utils.isIOS()) {
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
                return _model.detachMedia();
            }

            function _attachMedia() {
                // Called after instream ends
                var status = utils.tryCatch(function() {
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

            // View passthroughs
            this.getContainer = function() {
                return this.currentContainer;
            };
            this.resize = _view.resize;
            this.getSafeRegion = _view.getSafeRegion;
            this.setCues = _view.addCues;
            this.setCaptions = _view.setCaptions;
            this.next = _nextUp;
            this.setConfig = (newConfig) => setConfig(_this, newConfig);
            this.addButton = function(img, tooltip, callback, id, btnClass) {
                var newButton = {
                    img: img,
                    tooltip: tooltip,
                    callback: callback,
                    id: id,
                    btnClass: btnClass
                };
                var replaced = false;
                var dock = _.map(_model.get('dock'), function(dockButton) {
                    var replaceButton =
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
                var dock = _model.get('dock') || [];
                dock = _.reject(dock, _.matches({ id: id }));
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
                    mode = !_model.get('controls');
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
                return _model.checkComplete();
            };

            this.createInstream = function() {
                this.instreamDestroy();
                _primeMediaElementForPlayback();
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

            // Delegate trigger so we can run a middleware function before any event is bubbled through the API
            this.trigger = function (type, args) {
                var data = eventsMiddleware(_model, type, args);
                return Events.trigger.call(this, type, data);
            };

            _setup.start();
        },

        showView: function(viewElement) {
            if (!document.body.contains(this.currentContainer)) {
                // This implies the player was removed from the DOM before setup completed
                //   or a player has been "re" setup after being removed from the DOM
                var newContainer = document.getElementById(this._model.get('id'));
                if (newContainer) {
                    this.currentContainer = newContainer;
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

            var width = this._model.get('width');
            var height = this._model.get('height');

            utils.style(errorElement, {
                width: width.toString().indexOf('%') > 0 ? width : (width + 'px'),
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
