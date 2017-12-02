import cancelable from 'utils/cancelable';
import Eventable from 'utils/eventable';
import ProviderListener from 'program/provider-listener';
import { resolved } from 'polyfills/promise';
import { MediaModel } from 'controller/model';
import { seconds } from 'utils/strings';
import {
    MEDIA_PLAY_ATTEMPT, MEDIA_PLAY_ATTEMPT_FAILED, PLAYER_STATE,
    STATE_PAUSED, STATE_BUFFERING, MEDIA_COMPLETE, STATE_COMPLETE
} from 'events/events';

export default class MediaController extends Eventable {
    constructor(provider, model) {
        super();
        this.attached = true;
        this.beforeComplete = false;
        this.mediaModel = new MediaModel();
        this.model = model;
        this.provider = provider;
        this.providerListener = new ProviderListener(this);
        this.thenPlayPromise = cancelable(() => {});
        addProviderListeners(this);
    }

    init(item) {
        const { model, provider } = this;
        const mediaModel = this.mediaModel = new MediaModel();
        const position = item ? seconds(item.starttime) : 0;
        const duration = item ? seconds(item.duration) : 0;
        const mediaModelState = mediaModel.attributes;
        mediaModel.srcReset();
        mediaModelState.position = position;
        mediaModelState.duration = duration;
        model.setProvider(provider);
        model.setMediaModel(mediaModel);
        // Initialize the provider last so it's setting properties on the (newly) active media model
        provider.init(item);
    }

    play(item, playReason) {
        const { model, mediaModel, provider } = this;

        if (!playReason) {
            playReason = model.get('playReason');
        }

        model.set('playRejected', false);
        let playPromise = resolved;
        if (mediaModel.get('setup')) {
            playPromise = provider.play();
        } else {
            mediaModel.set('setup', true);
            playPromise = this._loadAndPlay(item, provider);
            if (!mediaModel.get('started')) {
                this._playAttempt(playPromise, playReason, item);
            }
        }
        return playPromise;
    }

    stop() {
        const { provider } = this;
        provider.stop();
    }

    pause() {
        const { provider } = this;
        provider.pause();
    }

    preload(item) {
        const { mediaModel, provider } = this;
        mediaModel.set('preloaded', true);
        provider.preload(item);
    }

    destroy() {
        const { provider, model } = this;

        provider.off(null, null, model);
        if (provider.getContainer()) {
            provider.remove();
        }
        delete provider.instreamMode;
        this.provider = null;
    }

    attach() {
        const { model, provider } = this;

        if (this.beforeComplete) {
            this._playbackComplete();
        }

        // Restore the playback rate to the provider in case it changed while detached and we reused a video tag.
        model.setPlaybackRate(model.get('defaultPlaybackRate'));

        addProviderListeners(this);
        provider.attachMedia();
        this.attached = true;
        model.set('attached', true);
    }

    detach() {
        const { model, provider } = this;
        this.thenPlayPromise.cancel();
        removeProviderListeners(this);
        provider.detachMedia();
        this.attached = false;
        model.set('attached', false);
    }

    // Executes the playPromise
    _playAttempt(playPromise, playReason, item) {
        const { mediaModel, model, provider } = this;

        this.trigger(MEDIA_PLAY_ATTEMPT, {
            item,
            playReason
        });
        // Immediately set player state to buffering if these conditions are met
        if (provider && provider.video && !provider.video.paused) {
            model.set(PLAYER_STATE, STATE_BUFFERING);
        }

        playPromise.then(() => {
            if (!mediaModel.get('setup')) {
                // Exit if model state was reset
                return;
            }
            mediaModel.set('started', true);
            if (mediaModel === model.mediaModel) {
                syncPlayerWithMediaModel(mediaModel);
            }
        }).catch(error => {
            model.set('playRejected', true);
            const videoTagPaused = provider && provider.video && provider.video.paused;
            if (videoTagPaused) {
                mediaModel.set('mediaState', STATE_PAUSED);
            }
            this.trigger(MEDIA_PLAY_ATTEMPT_FAILED, {
                error,
                item,
                playReason
            });
        });
    }

    _playbackComplete() {
        const { provider } = this;
        this.beforeComplete = false;
        provider.setState(STATE_COMPLETE);
        this.trigger(MEDIA_COMPLETE, {});
    }

    _loadAndPlay(item) {
        const { provider } = this;
        // Calling load() on Shaka may return a player setup promise
        const providerSetupPromise = provider.load(item);
        if (providerSetupPromise) {
            const thenPlayPromise = cancelable(() => {
                return provider.play() || resolved;
            });
            this.thenPlayPromise = thenPlayPromise;
            return providerSetupPromise.then(thenPlayPromise.async);
        }
        return provider.play() || resolved;
    }

    get audioTrack() {
        return this.provider.getCurrentAudioTrack();
    }

    get quality() {
        return this.provider.getCurrentQuality();
    }

    get audioTracks() {
        return this.provider.getAudioTracks();
    }

    get preloaded() {
        return this.mediaModel.get('preloaded');
    }

    get qualities() {
        return this.provider.getQualityLevels();
    }

    get setup() {
        return this.mediaModel && this.mediaModel.get('setup');
    }

    set audioTrack(index) {
        this.provider.setCurrentAudioTrack(index);
    }

    set controls(mode) {
        this.provider.setControls(mode);
    }

    set position(pos) {
        this.provider.seek(pos);
    }

    set quality(index) {
        this.provider.setCurrentQuality(index);
    }

    set subtitles(index) {
        if (this.provider.setSubtitlesTrack) {
            this.provider.setSubtitlesTrack(index);
        }
    }
}

function syncPlayerWithMediaModel(mediaModel) {
    // Sync player state with mediaModel state
    const mediaState = mediaModel.get('mediaState');
    mediaModel.trigger('change:mediaState', mediaModel, mediaState, mediaState);
}

function addProviderListeners(mediaController) {
    removeProviderListeners(mediaController);
    mediaController.provider.on('all', mediaController.providerListener, mediaController);
}

function removeProviderListeners(mediaController) {
    mediaController.provider.off('all', mediaController.providerListener, mediaController);
}
