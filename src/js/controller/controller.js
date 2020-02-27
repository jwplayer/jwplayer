import instances from 'api/players';
import { showView } from 'api/core-shim';
import setConfig from 'api/set-config';
import ApiQueueDecorator from 'api/api-queue';
import PlaylistLoader from 'playlist/loader';
import Playlist, { filterPlaylist, validatePlaylist } from 'playlist/playlist';
import InstreamAdapter from 'controller/instream-adapter';
import Captions from 'controller/captions';
import Model from 'controller/model';
import View from 'view/view';
import ViewModel from 'view/view-model';
import changeStateEvent from 'events/change-state-event';
import eventsMiddleware from 'controller/events-middleware';
import Events from 'utils/backbone.events';
import { AUTOPLAY_DISABLED, AUTOPLAY_MUTED, canAutoplay, startPlayback } from 'utils/can-autoplay';
import { OS } from 'environment/environment';
import { streamType } from 'providers/utils/stream-type';
import cancelable from 'utils/cancelable';
import { inInteraction } from 'utils/in-interaction-event';
import { isUndefined, isBoolean } from 'utils/underscore';
import { INITIAL_MEDIA_STATE } from 'model/player-model';
import { PLAYER_STATE, STATE_BUFFERING, STATE_IDLE, STATE_COMPLETE, STATE_PAUSED, STATE_PLAYING, STATE_ERROR, STATE_LOADING,
    STATE_STALLED, AUTOSTART_NOT_ALLOWED, MEDIA_BEFOREPLAY, PLAYLIST_LOADED, ERROR, PLAYLIST_COMPLETE, CAPTIONS_CHANGED, READY,
    AD_PLAY, AD_PAUSE,
    MEDIA_ERROR, MEDIA_COMPLETE, CAST_SESSION, FULLSCREEN, PLAYLIST_ITEM, MEDIA_VOLUME, MEDIA_MUTE, PLAYBACK_RATE_CHANGED,
    CAPTIONS_LIST, RESIZE, MEDIA_VISUAL_QUALITY } from 'events/events';
import ProgramController from 'program/program-controller';
import initQoe from 'controller/qoe';
import { BACKGROUND_LOAD_OFFSET } from 'program/program-constants';
import { composePlayerError, convertToPlayerError, getPlayAttemptFailedErrorCode, MSG_CANT_PLAY_VIDEO, MSG_TECHNICAL_ERROR,
    ERROR_COMPLETING_SETUP, ERROR_LOADING_PLAYLIST, ERROR_LOADING_PROVIDER, ERROR_LOADING_PLAYLIST_ITEM } from 'api/errors';

// The model stores a different state than the provider
function normalizeState(newstate) {
    if (newstate === STATE_LOADING || newstate === STATE_STALLED) {
        return STATE_BUFFERING;
    }
    return newstate;
}

const Controller = function() {};
const noop = function() {};

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
        let _resumeAfterScrubbing = null;
        let checkAutoStartCancelable = cancelable(_checkAutoStart);
        let updatePlaylistCancelable = cancelable(noop);

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

        const _backgroundLoading = _model.get('backgroundLoading');

        const viewModel = new ViewModel(_model);

        _view = this._view = new View(_api, viewModel);
        _view.on('all', (type, event) => {
            if (event && event.doNotForward) {
                return;
            }
            _trigger(type, event);
        }, _this);

        const _programController = this._programController = new ProgramController(_model, mediaPool, _api._publicApi);
        updateProgramSoundSettings();
        addProgramControllerListeners();
        initQoe(_model, _programController);

        _model.on(ERROR, _this.triggerError, _this);

        _model.on('change:state', (model, newstate, oldstate) => {
            const adState = _getAdState();
            if (!adState) {
                changeStateEvent.call(this, model, newstate, oldstate);
            }
        }, this);

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

        const changeReason = function(model, reason) {
            // Stop autoplay behavior if the video is started by the user or an api call
            if (reason === 'clickthrough' || reason === 'interaction' || reason === 'external') {
                _model.set('playOnViewable', false);
                _model.off('change:playReason change:pauseReason', changeReason);
            }
        };
        _model.on('change:playReason change:pauseReason', changeReason);

        // Listen for play and pause reasons from instream.
        _this.on(AD_PLAY, event => changeReason(null, event.playReason));
        _this.on(AD_PAUSE, event => changeReason(null, event.pauseReason));

        _model.on('change:scrubbing', function(model, state) {
            if (state) {
                _resumeAfterScrubbing = _model.get('state') !== STATE_PAUSED;
                _pause();
            } else if (_resumeAfterScrubbing) {
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

            const recsAuto = (model.get('related') || {}).oncomplete === 'autoplay';
            let index = model.get('item') + 1;
            let item = model.get('playlist')[index];
            if ((item || recsAuto)) {
                const onPosition = (changedMediaModel, position) => {
                    if (recsAuto && !item) {
                        index = -1;
                        item = _model.get('nextUp');
                    }
                    // Do not background load DAI items because that item will be dynamically replaced before play
                    const allowPreload = (item && !item.daiSetting);
                    if (!allowPreload) {
                        return;
                    }
                    const duration = mediaModel.get('duration');
                    if (position && duration > 0 && position >= duration - BACKGROUND_LOAD_OFFSET) {
                        mediaModel.off('change:position', onPosition, this);
                        if (_backgroundLoading) {
                            _programController.backgroundLoad(item, index);
                        } else {
                            _programController.getAsyncItem(index).run();
                        }

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

            // Fire 'ready' once the view has resized so that player width and height are available
            // (requires the container to be in the DOM)
            _view.once(RESIZE, () => {
                try {
                    playerReadyNotify();
                } catch (error) {
                    _this.triggerError(convertToPlayerError(MSG_TECHNICAL_ERROR, ERROR_COMPLETING_SETUP, error));
                }
            });

            _view.init();
        };

        function playerReadyNotify() {
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
                        eventData.feedData = Object.assign({}, feedData);
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
                    model.set('cues', []);
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

            if (_model.get('autoPause').viewability) {
                _model.change('viewable', _checkPauseOnViewable);
            } else {
                _model.once('change:autostartFailed change:mute', function(model) {
                    model.off('change:viewable', _checkPlayOnViewable);
                });
            }

            // Run _checkAutoStart() last
            // 'viewable' changes can result in preload() being called on the initial provider instance
            _checkAutoStart();

            _model.on('change:itemReady', (changeModel, itemReady) => {
                if (itemReady) {
                    apiQueue.flush();
                }
            });
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
                _autoStart('autostart');
            }
            apiQueue.flush();
        }

        function viewableChange(model, viewable) {
            _this.trigger('viewable', {
                viewable: viewable
            });

            preload();
        }

        function preload() {
            // Only attempt to preload if this is the first player on the page or viewable
            if (instances[0] !== _api && _model.get('viewable') !== 1) {
                return;
            }
            if (_model.get('state') === 'idle' && _model.get('autostart') === false) {
                // If video has not been primed on Android, test that video will play before preloading
                // This ensures we always prime the tag on play when necessary
                if (!mediaPool.primed() && OS.android) {
                    const video = mediaPool.getTestElement();
                    const muted = _this.getMute();
                    Promise.resolve().then(() => startPlayback(video, { muted })).then(() => {
                        if (_model.get('state') === 'idle') {
                            _programController.preloadVideo();
                        }
                    }).catch(noop);
                } else {
                    _programController.preloadVideo();
                }
            }
        }

        function _pauseAfterAd(viewable) {
            _this._instreamAdapter.noResume = !viewable;
            if (!viewable) {
                _updatePauseReason({ reason: 'viewable' });
            }
        }

        function _pauseWhenNotViewable(viewable) {
            if (!viewable) {
                _this.pause({ reason: 'viewable' });
                _model.set('playOnViewable', !viewable);
            }
        }

        function _checkPlayOnViewable(model, viewable) {
            const adState = _getAdState();
            if (model.get('playOnViewable')) {
                if (viewable) {
                    const reason = 'viewable';
                    const autoPauseAds = model.get('autoPause').pauseAds;
                    const pauseReason = model.get('pauseReason');
                    if (_getState() === STATE_IDLE) {
                        _autoStart(reason);
                    } else if ((!adState || autoPauseAds) && pauseReason !== 'interaction') {
                        // resume normal playback or ads if pauseAds is true
                        _play({ reason });
                    }
                } else if (OS.mobile && !adState) {
                    _this.pause({ reason: 'autostart' });
                    _model.set('playOnViewable', true);
                }

                if (OS.mobile && adState) {
                    // If during an ad on mobile, we should always be paused after the ad,
                    // if not viewable, regardless of autoPause setting.
                    _pauseAfterAd(viewable);
                }
            }
        }

        function _checkPauseOnViewable(model, viewable) {
            const playerState = model.get('state');
            const adState = _getAdState();
            const playReason = model.get('playReason');

            if (adState) {
                if (model.get('autoPause').pauseAds) {
                    _pauseWhenNotViewable(viewable);
                } else {
                    _pauseAfterAd(viewable);
                }
            } else if (playerState === STATE_PLAYING || playerState === STATE_BUFFERING) {
                _pauseWhenNotViewable(viewable);
            } else if (playerState === STATE_IDLE && playReason === 'playlist') {
                // After VAST ads, instream is destroyed and player state is 'idle'
                model.once('change:state', () => {
                    _pauseWhenNotViewable(viewable);
                });
            }
        }

        function _load(item, feedData) {
            const instream = _this._instreamAdapter;
            if (instream) {
                instream.noResume = true;
            }
            _this.trigger('destroyPlugin', {});
            _stop(true);
            _programController.clearItemPromises();
            checkAutoStartCancelable.cancel();
            checkAutoStartCancelable = cancelable(_checkAutoStart);
            updatePlaylistCancelable.cancel();

            if (inInteraction()) {
                mediaPool.prime();
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
                    loadPromise = _this.setItemIndex(item);
                    break;
                default:
                    return;
            }
            // Catch playlist exceptions. Item exceptions are caught first from setActiveItem.
            loadPromise.catch(error => {
                _this.triggerError(composePlayerError(error, ERROR_LOADING_PLAYLIST));
            });

            loadPromise.then(checkAutoStartCancelable.async).catch(noop);
        }

        function _loadPlaylist(toLoad) {
            return new Promise((resolve, reject) => {
                const loader = new PlaylistLoader();
                loader.on(PLAYLIST_LOADED, function(data) {
                    resolve(data);
                });
                loader.on(ERROR, reject, this);
                loader.load(toLoad);
            });
        }

        function _getAdState() {
            const instream = _this._instreamAdapter;
            if (instream) {
                return instream.getState();
            }
            return false;
        }

        function _getState() {
            const adState = _getAdState();
            if (adState) {
                return adState;
            }
            return _model.get('state');
        }

        function _play(meta) {
            checkAutoStartCancelable.cancel();
            _stopPlaylist = false;

            if (_model.get('state') === STATE_ERROR) {
                return Promise.resolve();
            }

            const playReason = _getReason(meta);
            _model.set('playReason', playReason);

            const adState = _getAdState();

            if (adState) {
                // this will resume the ad. _api.playAd would load a new ad
                _api.pauseAd(false, meta);
                return Promise.resolve();
            }

            if (_model.get('state') === STATE_COMPLETE) {
                _stop(true);
                return _this.setItemIndex(0).then(() => {
                    return _playAttempt(meta, playReason);
                });
            }

            return _playAttempt(meta, playReason);
        }

        function _playAttempt(meta, playReason) {
            if (!_beforePlay) {
                _beforePlay = true;
                _this.trigger(MEDIA_BEFOREPLAY, {
                    playReason,
                    startTime: meta && meta.startTime ? meta.startTime : _model.get('playlistItem').starttime
                });
                _beforePlay = false;

                if (inInteraction() && !mediaPool.primed()) {
                    mediaPool.prime();
                }

                if (playReason === 'playlist' && _model.get('autoPause').viewability) {
                    _checkPauseOnViewable(_model, _model.get('viewable'));
                }

                if (_interruptPlay) {
                    // Force tags to prime if we're about to play an ad
                    // Resetting the source in order to prime is OK since we'll be switching it anyway
                    if (inInteraction() && !_backgroundLoading) {
                        _model.get('mediaElement').load();
                    }
                    _interruptPlay = false;
                    _actionOnAttach = null;
                    return Promise.resolve();
                }
            }

            return _programController.playVideo(playReason)
                // If playback succeeded that means we captured a gesture (and used it to prime the pool)
                // Avoid priming again in beforePlay because it could cause BGL'd media to be source reset
                .then(mediaPool.played);
        }

        function _getReason(meta) {
            if (meta && meta.reason) {
                return meta.reason;
            }
            return 'unknown';
        }

        function _autoStart(reason) {
            const state = _getState();
            if (state !== STATE_IDLE) {
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

                if (_this.getMute() && _model.get('enableDefaultCaptions')) {
                    _captions.selectDefaultIndex(1);
                }

                return _play({ reason }).catch(() => {
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
                    const code = getPlayAttemptFailedErrorCode(error);
                    _this.trigger(AUTOSTART_NOT_ALLOWED, {
                        reason: error.reason,
                        code,
                        error
                    });
                }
            });
        }

        function _stop(internal) {
            checkAutoStartCancelable.cancel();
            apiQueue.empty();

            const adState = _getAdState();
            if (adState) {
                const instream = _this._instreamAdapter;
                if (instream) {
                    instream.noResume = true;
                }
                _actionOnAttach = () => _programController.stopVideo();
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

        function _updatePauseReason(meta) {
            const pauseReason = _getReason(meta);
            _model.set('pauseReason', pauseReason);
            _model.set('playOnViewable', (pauseReason === 'viewable'));
        }

        function _pause(meta) {
            _actionOnAttach = null;
            checkAutoStartCancelable.cancel();

            const adState = _getAdState();
            if (adState && adState !== STATE_PAUSED) {
                _updatePauseReason(meta);
                _api.pauseAd(true, meta);
                return;
            }

            switch (_model.get('state')) {
                case STATE_ERROR:
                    return;
                case STATE_PLAYING:
                case STATE_BUFFERING: {
                    _updatePauseReason(meta);
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
            const state = _model.get('state');
            if (state === STATE_ERROR) {
                return;
            }
            _programController.position = pos;
            const isIdle = state === STATE_IDLE;
            if (!_model.get('scrubbing') && (isIdle || state === STATE_COMPLETE)) {
                if (isIdle) {
                    meta = meta || {};
                    meta.startTime = pos;
                }
                this.play(meta);
            }
        }

        function _item(index, meta) {
            _this.instreamDestroy();
            _stop(true);
            _this.setItemIndex(index);
            // Use this.play() so that command is queued until after "playlistItem" event
            _this.play(meta);
        }

        function _prev(meta) {
            _item(_model.get('item') - 1, meta);
        }

        function _next(meta) {
            _item(_model.get('item') + 1, meta);
        }

        function _completeCancelled() {
            if (!_isIdle()) {
                // Something has made an API call before the complete handler has fired.
                return true;
            } else if (_stopPlaylist) {
                // Stop called in onComplete event listener
                _stopPlaylist = false;
                return true;
            }

            return false;
        }

        function _shouldAutoAdvance() {
            // If it's the last item in the playlist
            const idx = _model.get('item');
            return idx !== _model.get('playlist').length - 1;
        }
        function _completeHandler() {
            if (_this.completeCancelled()) {
                return;
            }

            _actionOnAttach = _this.completeHandler;

            if (!_this.shouldAutoAdvance()) {
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

            _this.nextItem();
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

        function _setCurrentCaptions(index, tracks) {
            index = parseInt(index, 10) || 0;

            _model.persistVideoSubtitleTrack(index, tracks);
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

            if (_model.get('autoPause').viewability) {
                _checkPauseOnViewable(_model, _model.get('viewable'));
            }

            if (_backgroundLoading) {
                _programController.backgroundActiveMedia();
            } else {
                return _programController.setAttached(false);
            }
        }

        function _attachMedia() {
            // Called after instream ends

            if (_backgroundLoading) {
                _programController.restoreBackgroundMedia();
            } else {
                _programController.setAttached(true);
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

        function addProgramControllerListeners() {
            _programController
                .on('all', _trigger, _this)
                .on('subtitlesTracks', (e) => {
                    _captions.setSubtitlesTracks(e.tracks);
                    const defaultCaptionsIndex = _captions.getCurrentIndex();

                    // set the current captions if the default index isn't 0 or "Off"
                    if (defaultCaptionsIndex > 0) {
                        _setCurrentCaptions(defaultCaptionsIndex, e.tracks);
                    }
                }, _this)
                .on(MEDIA_COMPLETE, () => {
                    // Insert a small delay here so that other complete handlers can execute
                    Promise.resolve().then(_completeHandler);
                }, _this)
                .on(MEDIA_ERROR, _this.triggerError, _this);
        }

        function updateProgramSoundSettings() {
            _programController.setMute(_model.getMute());
            _programController.setVolume(_model.get('volume'));
        }

        this.preload = preload;

        /* Controller API / public methods */
        this.load = _load;
        this.play = (meta) => _play(meta).catch(noop);
        this.pause = _pause;
        this.seek = _seek;
        this.stop = _stop;
        this.playlistItem = _item;
        this.playlistNext = _next;
        this.playlistPrev = _prev;
        this.setCurrentCaptions = _setCurrentCaptions;
        this.setCurrentQuality = _setCurrentQuality;
        this.setFullscreen = _setFullscreen;
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
        this.next = noop;
        this.completeHandler = _completeHandler;
        this.completeCancelled = _completeCancelled;
        this.shouldAutoAdvance = _shouldAutoAdvance;
        this.nextItem = () => {
            _next({ reason: 'playlist' });
        };
        this.setConfig = (newConfig) => {
            setConfig(_this, newConfig);
        };
        this.setItemIndex = (index) => {
            _programController.stopVideo();

            const playlist = _model.get('playlist');
            const length = playlist.length;

            // If looping past the end, or before the beginning
            index = (parseInt(index, 10) || 0) % length;
            if (index < 0) {
                index += length;
            }

            return _programController.setActiveItem(index).catch(error => {
                if (error.code >= 151 && error.code <= 162) {
                    error = composePlayerError(error, ERROR_LOADING_PROVIDER);
                }
                this.triggerError(convertToPlayerError(MSG_CANT_PLAY_VIDEO, ERROR_LOADING_PLAYLIST_ITEM, error));
            });
        };
        this.detachMedia = _detachMedia;
        this.attachMedia = _attachMedia;

        // Program Controller passthroughs
        this.routeEvents = (target) => _programController.routeEvents(target);
        this.forwardEvents = () => _programController.forwardEvents();
        this.playVideo = (playReason) => _programController.playVideo(playReason);
        this.stopVideo = () => _programController.stopVideo();
        this.castVideo = (castProvider, item) => _programController.castVideo(castProvider, item);
        this.stopCast = () => _programController.stopCast();
        this.backgroundActiveMedia = () => _programController.backgroundActiveMedia();
        this.restoreBackgroundMedia = () => _programController.restoreBackgroundMedia();
        this.preloadNextItem = () => {
            if (_programController.background.currentMedia) {
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

        this.setItemCallback = function (callback) {
            _programController.itemCallback = callback;
        };
        this.getItemPromise = function (index) {
            const playlist = _model.get('playlist');
            if (index < -1 || index > playlist.length - 1 || isNaN(index)) {
                return null;
            }
            const asyncItem = _programController.getAsyncItem(index);
            if (!asyncItem) {
                return null;
            }
            return asyncItem.promise;
        };

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

        this.addCues = function (cues) {
            this.setCues(_model.get('cues').concat(cues));
        };

        this.setCues = function (cues) {
            _model.set('cues', cues);
        };

        this.updatePlaylist = function(playlist, feedData) {
            try {
                const filteredPlaylist = filterPlaylist(playlist, _model, feedData);

                // Throw exception if playlist is empty
                validatePlaylist(filteredPlaylist);

                const sanitizedFeedData = Object.assign({}, feedData);
                delete sanitizedFeedData.playlist;

                _model.set('feedData', sanitizedFeedData);
                _model.set('playlist', filteredPlaylist);
            } catch (error) {
                return Promise.reject(error);
            }
            return this.setItemIndex(_model.get('item'));
        };

        this.setPlaylistItem = function (index, item) {
            const asyncItemController = _programController.getAsyncItem(index);
            const newItem = asyncItemController.replace(item);
            if (!newItem) {
                return;
            }
            const playlist = _model.get('playlist');
            const playlistItem = playlist[index];
            if (item && item !== playlistItem) {
                _programController.asyncItems[index] = null;
                asyncItemController.reject(new Error('Item replaced'));
            }
            // If the current item was replaced, and the player is idle, reload it
            if (index === _model.get('item') && _model.get('state') === 'idle') {
                this.setItemIndex(index);
            }
        };

        this.playerDestroy = function () {
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
        const model = this._model;
        evt.message = model.get('localization').errors[evt.key];
        delete evt.key;
        model.set('errorEvent', evt);
        model.set('state', STATE_ERROR);
        model.once('change:state', function() {
            this.set('errorEvent', undefined);
        }, model);

        this.trigger(ERROR, evt);
    }
});

export default Controller;
