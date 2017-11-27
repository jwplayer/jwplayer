import cancelable from 'utils/cancelable';
import { resolved } from 'polyfills/promise';
import { MediaModel } from 'controller/model';
import { seconds } from 'utils/strings';

import { MEDIA_PLAY_ATTEMPT, MEDIA_PLAY_ATTEMPT_FAILED, PLAYER_STATE,
    STATE_PAUSED, STATE_BUFFERING } from 'events/events';

export default class MediaController {
    constructor(provider, model) {
        this.attached = true;
        this.mediaModel = new MediaModel();
        this.model = model;
        this.provider = provider;
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
            playPromise = loadAndPlay(item, provider, model);
            if (!mediaModel.get('started')) {
                playAttempt(playPromise, model, playReason, provider);
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
        this.attached = true;
        model.set('attached', true);

        provider.off('all', model.videoEventHandler, model);
        provider.on('all', model.videoEventHandler, model);

        if (model.checkComplete()) {
            model.playbackComplete();
        }

        provider.attachMedia();

        // Restore the playback rate to the provider in case it changed while detached and we reused a video tag.
        model.setPlaybackRate(model.get('defaultPlaybackRate'));
    }

    detach() {
        const { model, provider } = this;
        this.attached = false;
        model.set('attached', false);

        model.setThenPlayPromise(cancelable(() => {}));
        provider.off('all', model.videoEventHandler, model);
        provider.detachMedia();
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

function loadAndPlay(item, provider, model) {
    // Calling load() on Shaka may return a player setup promise
    const providerSetupPromise = provider.load(item);
    if (providerSetupPromise) {
        const thenPlayPromise = cancelable(() => {
            return provider.play() || resolved;
        });
        model.setThenPlayPromise(thenPlayPromise);
        return providerSetupPromise.then(thenPlayPromise.async);
    }
    return provider.play() || resolved;
}

// Executes the playPromise
function playAttempt(playPromise, model, playReason, provider) {
    const mediaModelContext = model.mediaModel;
    const itemContext = model.get('playlistItem');

    model.mediaController.trigger(MEDIA_PLAY_ATTEMPT, {
        item: itemContext,
        playReason: playReason
    });

    // Immediately set player state to buffering if these conditions are met
    const videoTagUnpaused = provider && provider.video && !provider.video.paused;
    if (videoTagUnpaused) {
        model.set(PLAYER_STATE, STATE_BUFFERING);
    }

    playPromise.then(() => {
        if (!mediaModelContext.get('setup')) {
            // Exit if model state was reset
            return;
        }
        mediaModelContext.set('started', true);
        if (mediaModelContext === model.mediaModel) {
            syncPlayerWithMediaModel(mediaModelContext);
        }
    }).catch(error => {
        model.set('playRejected', true);
        const videoTagPaused = provider && provider.video && provider.video.paused;
        if (videoTagPaused) {
            mediaModelContext.set(PLAYER_STATE, STATE_PAUSED);
        }
        model.mediaController.trigger(MEDIA_PLAY_ATTEMPT_FAILED, {
            error: error,
            item: itemContext,
            playReason: playReason
        });
    });
}

function syncPlayerWithMediaModel(mediaModel) {
    // Sync player state with mediaModel state
    const mediaState = mediaModel.get('state');
    mediaModel.trigger('change:state', mediaModel, mediaState, mediaState);
}


