import instances from 'api/players';
import { showView } from 'api/core-shim';
import setConfig from 'api/set-config';
import ApiQueueDecorator from 'api/api-queue';
import PlaylistLoader from 'playlist/loader';
import Playlist, { filterPlaylist, validatePlaylist, normalizePlaylistItem } from 'playlist/playlist';
import Item from 'playlist/item';
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
import Promise, { resolved } from 'polyfills/promise';
import cancelable from 'utils/cancelable';
import { isUndefined, isBoolean } from 'utils/underscore';
import { INITIAL_MEDIA_STATE } from 'model/player-model';
import { PLAYER_STATE, STATE_BUFFERING, STATE_IDLE, STATE_COMPLETE, STATE_PAUSED, STATE_PLAYING, STATE_ERROR, STATE_LOADING,
    STATE_STALLED, AUTOSTART_NOT_ALLOWED, MEDIA_BEFOREPLAY, PLAYLIST_LOADED, ERROR, PLAYLIST_COMPLETE, CAPTIONS_CHANGED, READY,
    MEDIA_ERROR, MEDIA_COMPLETE, CAST_SESSION, FULLSCREEN, PLAYLIST_ITEM, MEDIA_VOLUME, MEDIA_MUTE, PLAYBACK_RATE_CHANGED,
    CAPTIONS_LIST, RESIZE, MEDIA_VISUAL_QUALITY } from 'events/events';
import ProgramController from 'program/program-controller';
import initQoe from 'controller/qoe';
import { BACKGROUND_LOAD_OFFSET } from 'program/program-constants';
import { composePlayerError, convertToPlayerError, MSG_CANT_PLAY_VIDEO, MSG_TECHNICAL_ERROR,
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
        _view.on('all', _trigger, _this);

        const _programController = new ProgramController(_model, mediaPool);
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
            if ((item || recsAuto) && _backgroundLoading) {
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
                    resolved.then(() => startPlayback(video, { muted })).then(() => {
                        if (_model.get('state') === 'idle') {
                            _programController.preloadVideo();
                        }
                    }).catch(noop);
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
                    loadPromise = _setItem(item);
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
            if (adState) {
                // this will resume the ad. _api.playAd would load a new ad
                _api.pauseAd(false, meta);
                return resolved;
            }

            if (_model.get('outstream')) {
                _stop(true);
            } else if (_model.get('state') === STATE_COMPLETE) {
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

                if (_inInteraction(window.event) && !mediaPool.primed()) {
                    mediaPool.prime();
                }

                if (_interruptPlay) {
                    // Force tags to prime if we're about to play an ad
                    // Resetting the source in order to prime is OK since we'll be switching it anyway
                    if (_inInteraction(window.event) && !_backgroundLoading) {
                        _model.get('mediaElement').load();
                    }
                    _interruptPlay = false;
                    _actionOnAttach = null;
                    return resolved;
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
            if (adState) {
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
            if (adState) {
                _api.pauseAd(true, meta);
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
            _setItem(index);
            // Suppress "Uncaught (in promise) Error"
            _play(meta).catch(noop);
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

            return _programController.setActiveItem(index).catch(error => {
                if (error.code >= 151 && error.code <= 162) {
                    error = composePlayerError(error, ERROR_LOADING_PROVIDER);
                }
                _this.triggerError(convertToPlayerError(MSG_CANT_PLAY_VIDEO, ERROR_LOADING_PLAYLIST_ITEM, error));
            });
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

            if (_backgroundLoading) {
                _programController.backgroundActiveMedia();
            } else {
                _programController.attached = false;
            }
        }

        function _attachMedia() {
            // Called after instream ends

            if (_backgroundLoading) {
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

        this.preload = preload;

        /** Controller API / public methods **/
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
        this.nextItem = () => {
            _next({ reason: 'playlist' });
        };
        this.setConfig = (newConfig) => {
            setConfig(_this, newConfig);
        };
        this.setItemIndex = _setItem;
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

        this.setPlaylistItem = function (index, item) {
            item = normalizePlaylistItem(_model, new Item(item), item.feedData || {});

            if (item) {
                const playlist = _model.get('playlist');
                playlist[index] = item;

                if (index === _model.get('item') && _model.get('state') === 'idle') {
                    _setItem(index);
                }
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


function _inInteraction(event) {
    return event && /^(?:mouse|pointer|touch|gesture|click|key)/.test(event.type);
}

export default Controller;
