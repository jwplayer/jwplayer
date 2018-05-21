import instances from 'api/players';
import { showView } from 'api/core-shim';
import setConfig from 'api/set-config';
import ApiQueueDecorator from 'api/api-queue';
import PlaylistLoader from 'playlist/loader';
import Playlist, { filterPlaylist, validatePlaylist, fixSources } from 'playlist/playlist';
import InstreamAdapter from 'controller/instream-adapter';
import Captions from 'controller/captions';
import Model from 'controller/model';
import View from 'view/view';
import ViewModel from 'view/view-model';
import changeStateEvent from 'events/change-state-event';
import eventsMiddleware from 'controller/events-middleware';
import Events from 'utils/backbone.events';
import { AUTOPLAY_DISABLED, AUTOPLAY_MUTED, canAutoplay, startPlayback } from 'utils/can-autoplay';
import { OS, Features } from 'environment/environment';
import { streamType } from 'providers/utils/stream-type';
import Promise, { resolved } from 'polyfills/promise';
import cancelable from 'utils/cancelable';
import { isString, isUndefined, isBoolean } from 'utils/underscore';
import { INITIAL_MEDIA_STATE } from 'model/player-model';
import { PLAYER_STATE, STATE_BUFFERING, STATE_IDLE, STATE_COMPLETE, STATE_PAUSED, STATE_PLAYING, STATE_ERROR, STATE_LOADING,
    STATE_STALLED, AUTOSTART_NOT_ALLOWED, MEDIA_BEFOREPLAY, PLAYLIST_LOADED, ERROR, PLAYLIST_COMPLETE, CAPTIONS_CHANGED, READY,
    MEDIA_ERROR, MEDIA_COMPLETE, CAST_SESSION, FULLSCREEN, PLAYLIST_ITEM, MEDIA_VOLUME, MEDIA_MUTE, PLAYBACK_RATE_CHANGED,
    CAPTIONS_LIST, RESIZE, MEDIA_VISUAL_QUALITY } from 'events/events';
import ProgramController from 'program/program-controller';
import initQoe from 'controller/qoe';
import { BACKGROUND_LOAD_OFFSET } from 'program/program-constants';
import Item from 'playlist/item';
import { PlayerError, ERROR_LOADING_PLAYLIST, ERROR_LOADING_PROVIDER, ERROR_LOADING_PLAYLIST_ITEM } from 'api/errors';

// The model stores a different state than the provider
function normalizeState(newstate) {
    if (newstate === STATE_LOADING || newstate === STATE_STALLED) {
        return STATE_BUFFERING;
    }
    return newstate;
}

const Controller = function() {};

Object.assign(Controller.prototype, {
    setup(config, _api, originalContainer, eventListeners, commandQueue, mediaPool) {
        const _this = this;
        const _model = _this._model = new Model();

        let _view;
        let _captions;
        let _beforePlay = false;
        let _actionOnAttach;
        let _stopPlaylist = false;
        let _interruptPlay;
        let checkAutoStartCancelable = cancelable(_checkAutoStart);
        let updatePlaylistCancelable = cancelable(function() {});
        let primeBeforePlay = true;

        _this.originalContainer = _this.currentContainer = originalContainer;
        _this._events = eventListeners;

        // Delegate trigger so we can run a middleware function before any event is bubbled through the API
        _this.trigger = function (type, args) {
            const data = eventsMiddleware(_model, type, args);
            return Events.trigger.call(this, type, data);
        };

        let eventsReadyQueue = new ApiQueueDecorator(_this, [
            'trigger',
        ], () => true);

        const _trigger = (type, event) => {
            _this.trigger(type, event);
        };

        _model.setup(config);

        const viewModel = new ViewModel(_model);

        _view = this._view = new View(_api, viewModel);
        _view.on('all', _trigger, _this);

        const _programController = new ProgramController(_model, mediaPool);
        updateProgramSoundSettings();
        addProgramControllerListeners();
        initQoe(_model, _programController);

        _model.on(ERROR, _this.triggerError, _this);

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
                this.trigger(ERROR, errorEvent);
            }
            this._model.set('errorEvent', errorEvent);
        }, this);

        _model.on('change:state', changeStateEvent, this);

        _model.on('change:castState', function(model, evt) {
            _this.trigger(CAST_SESSION, evt);
        });

        _model.on('change:fullscreen', function(model, bool) {
            _this.trigger(FULLSCREEN, {
                fullscreen: bool
            });
            if (bool) {
                // Stop autoplay behavior when the player enters fullscreen
                model.set('playOnViewable', false);
            }
        });

        _model.on('change:volume', function(model, vol) {
            _this.trigger(MEDIA_VOLUME, {
                volume: vol
            });
        });

        _model.on('change:mute', function(model) {
            _this.trigger(MEDIA_MUTE, {
                mute: model.getMute()
            });
        });

        _model.on('change:playbackRate', function(model, rate) {
            _this.trigger(PLAYBACK_RATE_CHANGED, {
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
            _this.trigger(CAPTIONS_LIST, {
                tracks: captionsList,
                track: _model.get('captionsIndex') || 0
            });
        });

        _model.on('change:mediaModel', function(model, mediaModel) {
            model.set('errorEvent', undefined);
            mediaModel.change('mediaState', function (changedMediaModel, state) {
                if (!model.get('errorEvent')) {
                    model.set(PLAYER_STATE, normalizeState(state));
                }
            }, this);
            mediaModel.change('duration', function (changedMediaModel, duration) {
                if (duration === 0) {
                    return;
                }
                const minDvrWindow = model.get('minDvrWindow');
                const type = streamType(duration, minDvrWindow);
                model.setStreamType(type);
            }, this);

            const index = model.get('item') + 1;
            const recsAuto = (model.get('related') || {}).oncomplete === 'autoplay';
            let item = model.get('playlist')[index];
            if ((item || recsAuto) && Features.backgroundLoading) {
                const onPosition = (changedMediaModel, position) => {
                    // Do not background load DAI items because that item will be dynamically replaced before play
                    const allowPreload = (item && !item.daiSetting);
                    const duration = mediaModel.get('duration');
                    if (allowPreload && position && duration > 0 && position >= duration - BACKGROUND_LOAD_OFFSET) {
                        mediaModel.off('change:position', onPosition, this);
                        _programController.backgroundLoad(item);
                    } else if (recsAuto) {
                        item = _model.get('nextUp');
                    }
                };
                mediaModel.on('change:position', onPosition, this);
            }
        });

        // Ensure captionsList event is raised after playlistItem
        _captions = new Captions(_model);
        _captions.on('all', _trigger, _this);

        viewModel.on('viewSetup', (viewElement) => {
            showView(this, viewElement);
        });

        this.playerReady = function() {
            const related = _api.getPlugin('related');
            if (related) {
                related.on('nextUp', (nextUp) => {
                    let item = null;
                    if (nextUp === Object(nextUp)) {
                        // Format the item from the nextUp feed into a valid PlaylistItem
                        item = Item(nextUp);
                        item.sources = fixSources(item, _model);
                    }
                    _model.set('nextUp', item);
                });
            }

            // Fire 'ready' once the view has resized so that player width and height are available
            // (requires the container to be in the DOM)
            _view.once(RESIZE, _playerReadyNotify);

            _view.init();
        };

        function _playerReadyNotify() {
            _model.change('visibility', _updateViewable);
            eventsReadyQueue.off();

            // Tell the api that we are loaded
            _this.trigger(READY, {
                // this will be updated by Api
                setupTime: 0
            });

            _model.change('playlist', function(model, playlist) {
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
                    _this.trigger(PLAYLIST_LOADED, eventData);
                }
            });

            _model.change('playlistItem', function(model, playlistItem) {
                if (playlistItem) {
                    const { title, image } = playlistItem;
                    if ('mediaSession' in navigator && window.MediaMetadata && (title || image)) {
                        try {
                            navigator.mediaSession.metadata = new window.MediaMetadata({
                                title,
                                artist: window.location.hostname,
                                artwork: [
                                    { src: image || '' }
                                ]
                            });
                        } catch (error) {
                            // catch error that occurs when mediaSession fails to setup
                        }
                    }
                    _this.trigger(PLAYLIST_ITEM, {
                        index: _model.get('item'),
                        item: playlistItem
                    });
                }
            });

            eventsReadyQueue.flush();
            eventsReadyQueue.destroy();
            eventsReadyQueue = null;

            _model.change('viewable', viewableChange);
            _model.change('viewable', _checkPlayOnViewable);
            _model.once('change:autostartFailed change:mute', function(model) {
                model.off('change:viewable', _checkPlayOnViewable);
            });

            // Run _checkAutoStart() last
            // 'viewable' changes can result in preload() being called on the initial provider instance
            _checkAutoStart();
        }

        function _updateViewable(model, visibility) {
            if (!isUndefined(visibility)) {
                _model.set('viewable', Math.round(visibility));
            }
        }

        function _checkAutoStart() {
            if (!apiQueue) {
                // this player has been destroyed
                return;
            }

            // Autostart immediately if we're not waiting for the player to become viewable first.
            if (_model.get('autostart') === true && !_model.get('playOnViewable')) {
                _autoStart();
            }
            apiQueue.flush();
        }

        function viewableChange(model, viewable) {
            _this.trigger('viewable', {
                viewable: viewable
            });

            // Only attempt to preload if this is the first player on the page or viewable
            if (instances[0] !== _api && viewable !== 1) {
                return;
            }
            if (_model.get('state') === 'idle' && _model.get('autostart') === false) {
                // If video has not been primed on Android, test that video will play before preloading
                // This ensures we always prime the tag on play when necessary
                if (primeBeforePlay && OS.android) {
                    const video = mediaPool.getTestElement();
                    const muted = _this.getMute();
                    startPlayback(video, { muted }).then(() => {
                        if (_model.get('state') === 'idle') {
                            _programController.preloadVideo();
                        }
                    }).catch(() => {});
                } else {
                    _programController.preloadVideo();
                }
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

        function _load(item, feedData) {

            const instream = _this._instreamAdapter;
            if (instream) {
                instream.noResume = true;
            }
            _this.trigger('destroyPlugin', {});
            _stop(true);

            checkAutoStartCancelable.cancel();
            checkAutoStartCancelable = cancelable(_checkAutoStart);
            updatePlaylistCancelable.cancel();

            if (_inInteraction(window.event)) {
                _programController.primeMediaElements();
            }

            let loadPromise;

            switch (typeof item) {
                case 'string': {
                    _model.attributes.item = 0;
                    _model.attributes.itemReady = false;
                    updatePlaylistCancelable = cancelable((data) => {
                        if (data) {
                            return _this.updatePlaylist(Playlist(data.playlist), data);
                        }
                    });
                    loadPromise = _loadPlaylist(item).then(updatePlaylistCancelable.async);
                    break;
                }
                case 'object':
                    _model.attributes.item = 0;
                    loadPromise = _this.updatePlaylist(Playlist(item), feedData || {});
                    break;
                case 'number':
                    loadPromise = _setItem(item);
                    break;
                default:
                    return;
            }
            loadPromise.catch(e => {
                if (e.code >= 151 && e.code <= 162) {
                    e.code = PlayerError.compose(e.code, ERROR_LOADING_PROVIDER);
                } else {
                    e.message = `Playlist e: ${e.message}`;
                    e.code = PlayerError.compose(e.code, ERROR_LOADING_PLAYLIST);
                }
                _this.triggerError(e);
            });

            loadPromise.then(checkAutoStartCancelable.async).catch(function() {});
        }

        function _loadPlaylist(toLoad) {
            return new Promise((resolve, reject) => {
                const loader = new PlaylistLoader();
                loader.on(PLAYLIST_LOADED, function(data) {
                    resolve(data);
                });
                loader.on(ERROR, function(error) {
                    error.code = PlayerError.compose(error.code, ERROR_LOADING_PROVIDER);
                    reject(error);
                }, this);
                loader.load(toLoad);
            });
        }

        function _getAdState() {
            return _this._instreamAdapter && _this._instreamAdapter.getState();
        }

        function _getState() {
            const adState = _getAdState();
            if (isString(adState)) {
                return adState;
            }
            return _model.get('state');
        }

        function _play(meta) {
            checkAutoStartCancelable.cancel();

            if (_model.get('state') === STATE_ERROR) {
                return resolved;
            }

            const playReason = _getReason(meta);
            const startTime = meta ? meta.startTime : null;
            _model.set('playReason', playReason);
            // Stop autoplay behavior if the video is started by the user or an api call
            if (playReason === 'interaction' || playReason === 'external') {
                _model.set('playOnViewable', false);
            }

            const adState = _getAdState();
            if (isString(adState)) {
                // this will resume the ad. _api.playAd would load a new ad
                _api.pauseAd(false);
                return resolved;
            }

            if (_model.get('state') === STATE_COMPLETE) {
                _stop(true);
                _setItem(0);
            }

            if (!_beforePlay) {
                _beforePlay = true;
                _this.trigger(MEDIA_BEFOREPLAY, {
                    playReason,
                    startTime
                });
                _beforePlay = false;

                if (_inInteraction(window.event) && primeBeforePlay) {
                    _programController.primeMediaElements();
                    primeBeforePlay = false;
                }

                if (_interruptPlay) {
                    // Force tags to prime if we're about to play an ad
                    // Resetting the source in order to prime is OK since we'll be switching it anyway
                    if (_inInteraction(window.event) && !Features.backgroundLoading) {
                        _model.get('mediaElement').load();
                    }
                    _interruptPlay = false;
                    _actionOnAttach = null;
                    return resolved;
                }
            }

            return _programController.playVideo(playReason)
                .then(() => {
                    // If playback succeeded that means we captured a gesture (and used it to prime the pool)
                    // Avoid priming again in beforePlay because it could cause BGL'd media to be source reset
                    primeBeforePlay = false;
                });
        }

        function _getReason(meta) {
            if (meta && meta.reason) {
                return meta.reason;
            }
            if (_inInteraction(window.event)) {
                return 'interaction';
            }
            return 'external';
        }

        function _autoStart() {
            const state = _model.get('state');
            if (state !== STATE_IDLE && state !== STATE_PAUSED) {
                return;
            }

            // Reset cancelable for new autoplay test below.
            checkAutoStartCancelable = cancelable(_checkAutoStart);

            // Detect and store browser autoplay setting in the model.
            const adConfig = _model.get('advertising');
            canAutoplay(mediaPool, {
                cancelable: checkAutoStartCancelable,
                muted: _this.getMute(),
                allowMuted: adConfig ? adConfig.autoplayadsmuted : true
            }).then(result => {
                _model.set('canAutoplay', result);

                // Only apply autostartMuted on un-muted autostart attempt.
                if (result === AUTOPLAY_MUTED && !_this.getMute()) {
                    _model.set('autostartMuted', true);
                    updateProgramSoundSettings();

                    _model.once('change:autostartMuted', function(model) {
                        model.off('change:viewable', _checkPlayOnViewable);
                        _this.trigger(MEDIA_MUTE, { mute: _model.getMute() });
                    });
                }

                return _play({ reason: 'autostart' }).catch(() => {
                    if (!_this._instreamAdapter) {
                        _model.set('autostartFailed', true);
                    }
                    _actionOnAttach = null;
                });
            }).catch(error => {
                _model.set('canAutoplay', AUTOPLAY_DISABLED);
                _model.set('autostart', false);

                // Emit event unless test was explicitly canceled.
                if (!checkAutoStartCancelable.cancelled()) {
                    const { reason } = error;
                    _this.trigger(AUTOSTART_NOT_ALLOWED, {
                        reason,
                        error
                    });
                }
            });
        }

        function _stop(internal) {
            checkAutoStartCancelable.cancel();
            apiQueue.empty();

            const adState = _getAdState();
            if (isString(adState)) {
                return;
            }

            const fromApi = !internal;

            _actionOnAttach = null;

            if (fromApi) {
                _stopPlaylist = true;
            }

            if (_beforePlay) {
                _interruptPlay = true;
            }

            _model.set('errorEvent', undefined);
            _programController.stopVideo();
        }

        function _pause(meta) {
            _actionOnAttach = null;
            checkAutoStartCancelable.cancel();

            const pauseReason = _getReason(meta);
            _model.set('pauseReason', pauseReason);
            // Stop autoplay behavior if the video is paused by the user or an api call
            if (pauseReason === 'interaction' || pauseReason === 'external') {
                _model.set('playOnViewable', false);
            }

            const adState = _getAdState();
            if (isString(adState)) {
                _api.pauseAd(true);
                return;
            }

            switch (_model.get('state')) {
                case STATE_ERROR:
                    return;
                case STATE_PLAYING:
                case STATE_BUFFERING: {
                    _programController.pause();
                    break;
                }
                default:
                    if (_beforePlay) {
                        _interruptPlay = true;
                    }
            }
        }

        function _isIdle() {
            const state = _model.get('state');
            return (state === STATE_IDLE || state === STATE_COMPLETE || state === STATE_ERROR);
        }

        function _seek(pos, meta) {
            if (_model.get('state') === STATE_ERROR) {
                return;
            }
            _programController.position = pos;
            if (!_model.get('scrubbing') && _model.get('state') !== STATE_PLAYING) {
                meta = meta || {};
                meta.startTime = pos;
                this.play(meta);
            }
        }

        function _item(index, meta) {
            _stop(true);
            _setItem(index)
                .catch(e => {
                    e.code = PlayerError.compose(e.code, ERROR_LOADING_PLAYLIST_ITEM);
                    throw e;
                });
            _play(meta).catch(() => {
                // Suppress "Uncaught (in promise) Error"
            });
        }

        function _setItem(index) {
            _programController.stopVideo();

            const playlist = _model.get('playlist');
            const length = playlist.length;

            // If looping past the end, or before the beginning
            index = (parseInt(index, 10) || 0) % length;
            if (index < 0) {
                index += length;
            }

            return _programController.setActiveItem(index);
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
                    if (OS.iOS) {
                        _setFullscreen(false);
                    }
                    // Autoplay/pause no longer needed since there's no more media to play
                    // This prevents media from replaying when a completed video scrolls into view
                    _model.set('playOnViewable', false);
                    _model.set('state', STATE_COMPLETE);
                    _this.trigger(PLAYLIST_COMPLETE, {});
                }
                return;
            }

            // It wasn't the last item in the playlist,
            //  so go to the next one and trigger an autoadvance event
            const related = _api.getPlugin('related');
            triggerAdvanceEvent(related, 'nextAutoAdvance');
            _next({ reason: 'playlist' });
        }

        function _setCurrentQuality(index) {
            _programController.quality = index;
        }

        function _getCurrentQuality() {
            return _programController.quality;
        }

        function _getConfig() {
            return this._model ? this._model.getConfiguration() : undefined;
        }

        function _getVisualQuality() {
            const mediaModel = this._model.get('mediaModel');
            if (mediaModel) {
                return mediaModel.get(MEDIA_VISUAL_QUALITY);
            }
            return null;
        }

        function _getQualityLevels() {
            return _programController.qualities;
        }

        function _setCurrentAudioTrack(index) {
            _programController.audioTrack = index;
        }

        function _getCurrentAudioTrack() {
            return _programController.audioTrack;
        }

        function _getAudioTracks() {
            return _programController.audioTracks;
        }

        function _setCurrentCaptions(index) {
            index = parseInt(index, 10) || 0;

            _model.persistVideoSubtitleTrack(index);
            _programController.subtitles = index;

            _this.trigger(CAPTIONS_CHANGED, {
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

        /* Used for the InStream API */
        function _detachMedia() {
            if (_beforePlay) {
                _interruptPlay = true;
            }

            if (Features.backgroundLoading) {
                _programController.backgroundActiveMedia();
            } else {
                _programController.attached = false;
            }
        }

        function _attachMedia() {
            // Called after instream ends

            if (Features.backgroundLoading) {
                _programController.restoreBackgroundMedia();
            } else {
                _programController.attached = true;
            }

            if (typeof _actionOnAttach === 'function') {
                _actionOnAttach();
            }
        }

        function _setFullscreen(state) {
            if (!isBoolean(state)) {
                state = !_model.get('fullscreen');
            }

            _model.set('fullscreen', state);
            if (_this._instreamAdapter && _this._instreamAdapter._adModel) {
                _this._instreamAdapter._adModel.set('fullscreen', state);
            }
        }

        function _nextUp() {
            const related = _api.getPlugin('related');
            triggerAdvanceEvent(related, 'nextClick', () => related.next());
        }

        function triggerAdvanceEvent(related, evt, cb) {
            if (!related) {
                return;
            }
            const nextUp = _model.get('nextUp');
            if (nextUp) {
                _this.trigger(evt, {
                    mode: nextUp.mode,
                    ui: 'nextup',
                    target: nextUp,
                    itemsShown: [ nextUp ],
                    feedData: nextUp.feedData,
                });
            }
            if (typeof cb === 'function') {
                cb();
            }
        }

        function addProgramControllerListeners() {
            _programController
                .on('all', _trigger, _this)
                .on('subtitlesTracks', (e) => {
                    _captions.setSubtitlesTracks(e.tracks);
                    const defaultCaptionsIndex = _captions.getCurrentIndex();

                    // set the current captions if the default index isn't 0 or "Off"
                    if (defaultCaptionsIndex > 0) {
                        _setCurrentCaptions(defaultCaptionsIndex);
                    }
                }, _this)
                .on(MEDIA_COMPLETE, () => {
                    // Insert a small delay here so that other complete handlers can execute
                    resolved.then(_completeHandler);
                }, _this)
                .on(MEDIA_ERROR, _this.triggerError, _this);
        }

        function updateProgramSoundSettings() {
            _programController.mute = _model.getMute();
            _programController.volume = _model.get('volume');
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
        this.setConfig = (newConfig) => {
            setConfig(_this, newConfig);
        };
        this.setItemIndex = _setItem;

        // Program Controller passthroughs
        this.playVideo = (playReason) => _programController.playVideo(playReason);
        this.stopVideo = () => _programController.stopVideo();
        this.castVideo = (castProvider, item) => _programController.castVideo(castProvider, item);
        this.stopCast = () => _programController.stopCast();
        this.backgroundActiveMedia = () => _programController.backgroundActiveMedia();
        this.restoreBackgroundMedia = () => _programController.restoreBackgroundMedia();
        this.preloadNextItem = () => {
            if (_programController.backgroundMedia) {
                // Instruct the background media to preload if it's already been loaded
                _programController.preloadVideo();
            }
        };
        this.isBeforeComplete = () => _programController.beforeComplete;

        // Model passthroughs
        this.setVolume = (volume) => {
            _model.setVolume(volume);
            updateProgramSoundSettings();
        };
        this.setMute = (mute) => {
            _model.setMute(mute);
            updateProgramSoundSettings();
        };
        this.setPlaybackRate = (playbackRate) => {
            _model.setPlaybackRate(playbackRate);
        };
        this.getProvider = () => _model.get('provider');
        this.getWidth = () => _model.get('containerWidth');
        this.getHeight = () => _model.get('containerHeight');
        this.getItemQoe = () => _model._qoeItem;
        this.addButton = function(img, tooltip, callback, id, btnClass) {
            let customButtons = _model.get('customButtons') || [];
            let replaced = false;
            const newButton = {
                img: img,
                tooltip: tooltip,
                callback: callback,
                id: id,
                btnClass: btnClass
            };

            customButtons = customButtons.reduce((buttons, button) => {
                if (button.id === id) {
                    replaced = true;
                    buttons.push(newButton);
                } else {
                    buttons.push(button);
                }
                return buttons;
            }, []);

            if (!replaced) {
                customButtons.unshift(newButton);
            }

            _model.set('customButtons', customButtons);
        };
        this.removeButton = function(id) {
            let customButtons = _model.get('customButtons') || [];

            customButtons = customButtons.filter(
                (button) => button.id !== id
            );

            _model.set('customButtons', customButtons);
        };

        // View passthroughs
        this.resize = _view.resize;
        this.getSafeRegion = _view.getSafeRegion;
        this.setCaptions = _view.setCaptions;

        this.checkBeforePlay = function() {
            return _beforePlay;
        };

        this.setControls = function (mode) {
            if (!isBoolean(mode)) {
                mode = !_model.get('controls');
            }
            _model.set('controls', mode);
            _programController.controls = mode;
        };

        this.setCues = function (cues) {
            _model.set('cues', cues);
        };

        this.updatePlaylist = function(playlist, feedData) {
            try {
                const filteredPlaylist = filterPlaylist(playlist, _model, feedData);

                // Throw exception if playlist is empty
                validatePlaylist(filteredPlaylist);

                _model.set('feedData', feedData);
                _model.set('playlist', filteredPlaylist);
            } catch (error) {
                return Promise.reject(error);
            }
            return _setItem(_model.get('item'));
        };

        this.playerDestroy = function () {
            this.trigger('destroyPlugin', {});
            this.off();
            this.stop();
            showView(this, this.originalContainer);
            if (_view) {
                _view.destroy();
            }
            if (_model) {
                _model.destroy();
            }
            if (apiQueue) {
                apiQueue.destroy();
            }
            if (_captions) {
                _captions.destroy();
            }
            if (_programController) {
                _programController.destroy();
            }
            this.instreamDestroy();
        };

        this.isBeforePlay = this.checkBeforePlay;

        this.createInstream = function() {
            this.instreamDestroy();
            this._instreamAdapter = new InstreamAdapter(this, _model, _view, mediaPool);
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
                _this._instreamAdapter = null;
            }
        };

        // Setup ApiQueueDecorator after instance methods have been assigned
        const apiQueue = new ApiQueueDecorator(this, [
            'play',
            'pause',
            'setCurrentAudioTrack',
            'setCurrentCaptions',
            'setCurrentQuality',
            'setFullscreen',
        ], () => !this._model.get('itemReady') || eventsReadyQueue);
        // Add commands from CoreLoader to queue
        apiQueue.queue.push.apply(apiQueue.queue, commandQueue);

        _view.setup();
    },
    get(property) {
        if (property in INITIAL_MEDIA_STATE) {
            const mediaModel = this._model.get('mediaModel');
            if (mediaModel) {
                return mediaModel.get(property);
            }
            return INITIAL_MEDIA_STATE[property];
        }
        return this._model.get(property);
    },
    getContainer() {
        return this.currentContainer || this.originalContainer;
    },
    getMute() {
        return this._model.getMute();
    },
    triggerError(evt) {
        this._model.set('errorEvent', evt);
        this._model.set('state', STATE_ERROR);
        this._model.once('change:state', function() {
            this._model.set('errorEvent', undefined);
        }, this);

        this.trigger(ERROR, evt);
    }
});


function _inInteraction(event) {
    return event && /^(?:mouse|pointer|touch|gesture|click|key)/.test(event.type);
}

export default Controller;
