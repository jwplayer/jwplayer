import cancelable from 'utils/cancelable';
import Eventable from 'utils/eventable';
import ApiQueueDecorator from 'api/api-queue';
import { ProviderListener } from 'program/program-listeners';
import { resolved } from 'polyfills/promise';
import { MediaModel } from 'controller/model';
import { seconds } from 'utils/strings';
import {
    MEDIA_PLAY_ATTEMPT, MEDIA_PLAY_ATTEMPT_FAILED, MEDIA_COMPLETE,
    PLAYER_STATE, STATE_PAUSED, STATE_BUFFERING, STATE_COMPLETE,
    MEDIA_VISUAL_QUALITY
} from 'events/events';

export default class MediaController extends Eventable {
    constructor(provider, model) {
        super();
        this.attached = true;
        this.beforeComplete = false;
        this.item = null;
        this.mediaModel = new MediaModel();
        this.model = model;
        this.provider = provider;
        this.providerListener = new ProviderListener(this);
        this.thenPlayPromise = cancelable(() => {});
        addProviderListeners(this);
        this.eventQueue = new ApiQueueDecorator(this, ['trigger'],
            () => !this.attached || this.background);
    }

    play(playReason) {
        const { item, model, mediaModel, provider } = this;

        if (!playReason) {
            playReason = model.get('playReason');
        }

        model.set('playRejected', false);
        let playPromise = resolved;
        if (mediaModel.get('setup')) {
            playPromise = provider.play() || resolved;
        } else {
            mediaModel.set('setup', true);
            playPromise = this._loadAndPlay(item, provider);
            if (!mediaModel.get('started')) {
                this._playAttempt(playPromise, playReason);
            }
        }
        return playPromise;
    }

    stop() {
        const { provider } = this;
        this.beforeComplete = false;
        provider.stop();
    }

    pause() {
        const { provider } = this;
        provider.pause();
    }

    preload() {
        const { item, mediaModel, provider } = this;
        if (!item || (item && item.preload === 'none')) {
            return;
        }
        // The provider has a video tag, but has not started nor preloaded
        if (this.attached && !this.setup && !this.preloaded) {
            mediaModel.set('preloaded', true);
            provider.preload(item);
        }
    }

    destroy() {
        const { provider, mediaModel } = this;
        this.off();
        mediaModel.off();
        provider.off();
        this.eventQueue.destroy();
        this.detach();
        if (provider.getContainer()) {
            provider.remove();
        }
        delete provider.instreamMode;
        this.provider = null;
        this.item = null;
    }

    attach() {
        const { model, provider } = this;

        // Restore the playback rate to the provider in case it changed while detached and we reused a video tag.
        model.setPlaybackRate(model.get('defaultPlaybackRate'));
        provider.attachMedia();
        this.attached = true;
        this.eventQueue.flush();

        if (this.beforeComplete) {
            this._playbackComplete();
        }
    }

    detach() {
        const { item, mediaModel, provider } = this;
        this.thenPlayPromise.cancel();
        provider.detachMedia();
        this.attached = false;

        // If detaching to play a midroll (pos > 0), ensure that the player resumes at the detached time by setting starttime
        // We don't need to do this for prerolls because the player re-attaches at time 0 by default
        const pos = mediaModel.get('position');
        if (pos) {
            item.starttime = pos;
        }
    }

    // Executes the playPromise
    _playAttempt(playPromise, playReason) {
        const { item, mediaModel, model, provider } = this;

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
                // Start firing visualQuality once playback has started
                mediaModel.off(MEDIA_VISUAL_QUALITY, null, this);
                mediaModel.change(MEDIA_VISUAL_QUALITY, (changedMediaModel, eventData) => {
                    if (!eventData) {
                        return;
                    }
                    this.trigger(MEDIA_VISUAL_QUALITY, eventData);
                }, this);
                syncPlayerWithMediaModel(mediaModel);
            }
        }).catch(error => {
            if (this.item && mediaModel === model.mediaModel) {
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
            }
        });
    }

    _playbackComplete() {
        const { item, provider } = this;
        if (item) {
            delete item.starttime;
        }
        this.beforeComplete = false;
        provider.setState(STATE_COMPLETE);
        this.trigger(MEDIA_COMPLETE, {});
    }

    _loadAndPlay() {
        const { item, provider } = this;
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

    get background() {
        const { container, provider } = this;
        // A backgrounded provider is attached to a video tag
        if (!this.attached) {
            return false;
        }
        // A provider without a video tag cannot be backgrounded
        if (!provider.video) {
            return false;
        }
        // A backgrounded provider does not have a parent container, or has one, but without the media tag as a child
        return !container || (container && !container.contains(provider.video));
    }

    get container() {
        return this.provider.getContainer();
    }

    get mediaElement() {
        return this.provider.video;
    }

    get preloaded() {
        return this.mediaModel.get('preloaded');
    }

    get qualities() {
        return this.provider.getQualityLevels();
    }

    get setup() {
        return this.mediaModel.get('setup');
    }

    get started() {
        return this.mediaModel.get('started');
    }

    set activeItem(item) {
        const mediaModel = this.mediaModel = new MediaModel();
        const position = item ? seconds(item.starttime) : 0;
        const duration = item ? seconds(item.duration) : 0;
        const mediaModelState = mediaModel.attributes;
        mediaModel.srcReset();
        mediaModelState.position = position;
        mediaModelState.duration = duration;

        this.item = item;
        this.provider.init(item);
    }

    set audioTrack(index) {
        this.provider.setCurrentAudioTrack(index);
    }

    set background(shouldBackground) {
        const { container, provider } = this;
        // A provider without a video tag must use attach and detach
        if (!provider.video) {
            if (shouldBackground) {
                this.detach();
            } else {
                this.attach();
            }
            return;
        }
        if (!container) {
            return;
        }

        if (shouldBackground) {
            if (!this.background) {
                this.thenPlayPromise.cancel();
                this.pause();
                container.removeChild(provider.video);
                this.container = null;
            }
        } else {
            this.eventQueue.flush();
            if (this.beforeComplete) {
                this._playbackComplete();
            }
        }
    }

    set container(element) {
        const { provider } = this;
        provider.setContainer(element);
    }

    set controls(mode) {
        this.provider.setControls(mode);
    }

    set mute(mute) {
        this.provider.mute(mute);
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

    set volume(volume) {
        this.provider.volume(volume);
    }
}

function syncPlayerWithMediaModel(mediaModel) {
    // Sync player state with mediaModel state
    const mediaState = mediaModel.get('mediaState');
    mediaModel.trigger('change:mediaState', mediaModel, mediaState, mediaState);
}

function addProviderListeners(mediaController) {
    mediaController.provider.on('all', mediaController.providerListener, mediaController);
}
