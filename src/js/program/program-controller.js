import ProviderController from 'providers/provider-controller';
import MediaController from 'program/media-controller';
import { resolved } from 'polyfills/promise';
import cancelable from 'utils/cancelable';
import { MediaControllerListener } from 'program/program-listeners';
import Eventable from 'utils/eventable';

import { ERROR, PLAYER_STATE, STATE_BUFFERING } from 'events/events';
import { Features } from '../environment/environment';

export default class ProgramController extends Eventable {
    constructor(model, mediaPool) {
        super();

        this.backgroundMedia = null;
        this.mediaPool = mediaPool;
        this.mediaController = null;
        this.model = model;
        this.providerController = ProviderController(model.getConfiguration());
        this.providerPromise = resolved;

        const modelForward = MediaControllerListener(model);
        this.mediaControllerListener = (type, data) => {
            modelForward(type, data);
            this.trigger(type, data);
        };
    }

    setActiveItem(item, index) {
        const { mediaController, model } = this;

        model.setActiveItem(item, index);
        this._destroyBackgroundMedia();
        const source = getSource(item);
        if (!source) {
            return Promise.reject('No media');
        }

        if (mediaController) {
            // Buffer between item switches, but remain in the initial state (IDLE) while loading the first provider
            model.set(PLAYER_STATE, STATE_BUFFERING);
            if (!this.providerController.canPlay(mediaController.provider, source)) {
                // If we can't play the source with the current provider, reset the current one and
                // prime the next tag within the gesture
                this._destroyActiveMedia();
            } else {
                // We can reuse the current mediaController and do so synchronously
                // Initialize the provider and mediaModel, sync it with the Model
                // This sets up the mediaController and allows playback to begin
                mediaController.activeItem = item;
                this._setActiveMedia(mediaController);
                this.providerPromise = Promise.resolve(mediaController);
                return this.providerPromise;
            }
        }

        const mediaModelContext = model.mediaModel;
        this.providerPromise = this._loadProviderConstructor(source)
            .then((ProviderConstructor) => {
                // Don't do anything if we've tried to load another provider while this promise was resolving
                if (mediaModelContext === model.mediaModel) {
                    const nextProvider = new ProviderConstructor(model.get('id'), model.getConfiguration(), this.primedElement);
                    const nextMediaController = new MediaController(nextProvider, model);
                    nextMediaController.activeItem = item;
                    this._setActiveMedia(nextMediaController);
                    return nextMediaController;
                }
            });
        return this.providerPromise;
    }

    playVideo(playReason) {
        const { mediaController, model } = this;
        const item = model.get('playlistItem');
        let playPromise;

        if (!item) {
            return;
        }

        if (!playReason) {
            playReason = model.get('playReason');
        }

        // Start playback immediately if we have already loaded a mediaController
        if (mediaController) {
            playPromise = mediaController.play(playReason);
        } else {
            // Wait for the provider to load before starting initial playback
            // Make the subsequent promise cancelable so that we can avoid playback when no longer wanted
            const thenPlayPromise = cancelable((nextMediaController) => {
                // Ensure that we haven't switched items while waiting for the provider to load
                if (this.mediaController && this.mediaController.mediaModel === nextMediaController.mediaModel) {
                    return nextMediaController.play(playReason);
                }
                throw new Error('Playback cancelled.');
            });

            playPromise = this.providerPromise
                .catch(error => {
                    thenPlayPromise.cancel();
                    // Required provider was not loaded
                    model.trigger(ERROR, {
                        message: `Could not play video: ${error.message}`,
                        error: error
                    });
                    // Fail the playPromise to trigger "playAttemptFailed"
                    throw error;
                })
                .then(thenPlayPromise.async);
        }

        return playPromise;
    }

    stopVideo() {
        const { mediaController, model } = this;

        const item = model.get('playlist')[model.get('item')];
        model.attributes.playlistItem = item;
        model.resetItem(item);

        if (mediaController) {
            mediaController.stop();
        }
    }

    preloadVideo() {
        const { backgroundMedia, mediaController, model } = this;
        if (!mediaController && !backgroundMedia) {
            return;
        }

        const item = model.get('playlistItem');
        if (!item || (item && item.preload === 'none')) {
            return;
        }

        // Only attempt to preload if media hasn't been loaded and we haven't started, and it's attached
        let media = mediaController || backgroundMedia;
        if (model.get('state') === 'idle'
            && model.get('autostart') === false
            && media.attached
            && !media.setup
            && !media.preloaded) {
            media.preload(item);
        }
    }

    pause() {
        const { mediaController } = this;
        if (!mediaController) {
            return;
        }

        mediaController.pause();
    }

    castVideo(castProvider, item) {
        const { model } = this;

        const castMediaController = new MediaController(castProvider, model);
        castMediaController.activeItem = item;
        this._setActiveMedia(castMediaController);
    }

    stopCast() {
        this.stopVideo();
        this.mediaController = null;
    }

    backgroundActiveMedia() {
        const { backgroundMedia, mediaController } = this;
        if (!mediaController) {
            return;
        }

        if (backgroundMedia) {
            this._destroyBackgroundMedia();
        }

        removeEventForwarding(this, mediaController);
        mediaController.background = true;
        this.backgroundMedia = mediaController;
        this.mediaController = null;
    }

    restoreBackgroundMedia() {
        const { backgroundMedia, mediaController } = this;
        if (mediaController) {
            this._destroyBackgroundMedia();
            return;
        }
        if (backgroundMedia) {
            this._setActiveMedia(backgroundMedia);
            backgroundMedia.background = false;
            this.backgroundMedia = null;
        }
    }

    primeMediaElements() {
        if (!Features.backgroundLoading) {
            const { model } = this;
            const mediaElement = model.get('mediaElement');
            if (mediaElement) {
                mediaElement.load();
            }
        }
        this.mediaPool.prime();
    }

    _setActiveMedia(mediaController) {
        const { model } = this;
        const { mediaModel, provider } = mediaController;

        assignMediaContainer(model, mediaController);
        this.mediaController = mediaController;

        model.setProvider(provider);
        model.setMediaModel(mediaModel);
        model.set('mediaElement', mediaController.mediaElement);

        forwardEvents(this, mediaController);
    }

    _destroyActiveMedia() {
        const { mediaPool, mediaController, model } = this;
        if (!mediaController) {
            return;
        }

        mediaController.detach();
        mediaPool.recycle(mediaController.mediaElement);
        mediaController.destroy();

        removeEventForwarding(this, mediaController);

        model.resetProvider();
        this.mediaController = null;
    }

    _destroyBackgroundMedia() {
        const { backgroundMedia, mediaPool } = this;
        if (!backgroundMedia) {
            return;
        }
        mediaPool.recycle(backgroundMedia.mediaElement);
        backgroundMedia.destroy();
        this.backgroundMedia = null;
    }

    _loadProviderConstructor(source) {
        const { model, mediaController, providerController } = this;

        let ProviderConstructor = providerController.choose(source);
        if (ProviderConstructor) {
            return Promise.resolve(ProviderConstructor);
        }

        return providerController.loadProviders(model.get('playlist'))
            .then(() => {
                ProviderConstructor = providerController.choose(source);
                // The provider we need couldn't be loaded
                if (!ProviderConstructor) {
                    if (mediaController) {
                        mediaController.destroy();
                        model.resetProvider();
                        this.mediaController = null;
                    }
                    throw Error(`Failed to load media`);
                }
                return ProviderConstructor;
            });
    }

    get activeProvider() {
        const { mediaController, backgroundMedia } = this;
        if (!mediaController && !backgroundMedia) {
            return null;
        }

        return mediaController ? mediaController.provider : backgroundMedia.provider;
    }

    get audioTrack() {
        const { mediaController } = this;
        if (!mediaController) {
            return -1;
        }

        return mediaController.audioTrack;
    }

    get audioTracks() {
        const { mediaController } = this;
        if (!mediaController) {
            return;
        }

        return mediaController.audioTracks;
    }

    get beforeComplete() {
        const { mediaController, backgroundMedia } = this;
        if (!mediaController && !backgroundMedia) {
            return;
        }

        return mediaController ? mediaController.beforeComplete : backgroundMedia.beforeComplete;
    }

    get primedElement() {
        return this.mediaPool.getPrimedElement();
    }

    get quality() {
        if (!this.mediaController) {
            return -1;
        }

        return this.mediaController.quality;
    }

    get qualities() {
        const { mediaController } = this;
        if (!mediaController) {
            return null;
        }

        return mediaController.qualities;
    }

    set attached(shouldAttach) {
        const { mediaController } = this;

        if (!mediaController) {
            return;
        }

        if (shouldAttach) {
            mediaController.attach();
        } else {
            mediaController.detach();
        }
    }

    set audioTrack(index) {
        const { mediaController } = this;
        if (!mediaController) {
            return;
        }

        mediaController.audioTrack = parseInt(index, 10) || 0;
    }

    set controls(mode) {
        const { mediaController } = this;
        if (!mediaController) {
            return;
        }

        mediaController.controls = mode;
    }

    set mute(mute) {
        const { backgroundMedia, mediaController, mediaPool } = this;

        if (mediaController) {
            mediaController.mute = mute;
        }
        if (backgroundMedia) {
            backgroundMedia.mute = mute;
        }

        mediaPool.syncMute(mute);
    }

    set position(pos) {
        const { mediaController } = this;
        if (!mediaController) {
            return;
        }

        if (mediaController.attached) {
            mediaController.position = pos;
        } else {
            mediaController.item.starttime = pos;
        }
    }

    set quality(index) {
        const { mediaController } = this;
        if (!mediaController) {
            return;
        }

        mediaController.quality = parseInt(index, 10) || 0;
    }

    set subtitles(index) {
        const { mediaController } = this;
        if (!mediaController) {
            return;
        }

        mediaController.subtitles = index;
    }

    set volume(volume) {
        const { backgroundMedia, mediaController, mediaPool } = this;

        if (mediaController) {
            mediaController.volume = volume;
        }
        if (backgroundMedia) {
            backgroundMedia.volume = volume;
        }

        mediaPool.syncVolume(volume);
    }
}

function assignMediaContainer(model, mediaController) {
    const container = model.get('mediaContainer');
    if (container) {
        mediaController.container = container;
    } else {
        model.once('change:mediaContainer', (changedModel, changedContainer) => {
            mediaController.container = changedContainer;
        });
    }
}

function removeEventForwarding(programController, mediaController) {
    mediaController.off('all', programController.mediaControllerListener, programController);
}

function forwardEvents(programController, mediaController) {
    mediaController.off('all', programController.mediaControllerListener, programController);
    mediaController.on('all', programController.mediaControllerListener, programController);
}

function getSource(item) {
    return item && item.sources && item.sources[0];
}