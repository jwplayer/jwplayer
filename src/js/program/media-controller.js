import cancelable from 'utils/cancelable';
import Events from 'utils/backbone.events';
import ApiQueueDecorator from 'api/api-queue';
import { PlayerError, getPlayAttemptFailedErrorCode } from 'api/errors';
import { ProviderListener } from 'program/program-listeners';
import { MediaModel } from 'controller/model';
import { seconds } from 'utils/strings';
import {
    MEDIA_PLAY_ATTEMPT, MEDIA_PLAY_ATTEMPT_FAILED, MEDIA_COMPLETE,
    PLAYER_STATE, STATE_PAUSED, STATE_PLAYING, STATE_BUFFERING, STATE_COMPLETE
} from 'events/events';

export default class MediaController extends Events {
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
        provider.off();
        provider.on('all', this.providerListener, this);
        this.eventQueue = new ApiQueueDecorator(this, ['trigger'],
            () => !this.attached || this.background);
    }

    play(playReason) {
        const { item, model, mediaModel, provider } = this;

        if (!playReason) {
            playReason = model.get('playReason');
        }

        model.set('playRejected', false);

        // If play has already been called, then only return provider.play
        if (mediaModel.get('setup')) {
            return provider.play() || Promise.resolve();
        }
        mediaModel.set('setup', true);

        // If this is the first call to play, load the media and play
        const playPromise = this._loadAndPlay(item, provider);

        // Trigger "playAttempt" if playback has not yet started
        if (mediaModel.get('started')) {
            return playPromise;
        }
        return this._playAttempt(playPromise, playReason);
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
        const { provider } = this;
        this.thenPlayPromise.cancel();
        const result = provider.detachMedia();
        this.attached = false;
        return result;
    }

    // Extends the playPromise
    _playAttempt(playPromise, playReason) {
        const { item, mediaModel, model, provider } = this;
        const video = provider ? provider.video : null;

        this.trigger(MEDIA_PLAY_ATTEMPT, {
            item,
            playReason
        });
        // Immediately set player state to buffering if these conditions are met
        if (video ? !video.paused : model.get(PLAYER_STATE) === STATE_PLAYING) {
            model.set(PLAYER_STATE, STATE_BUFFERING);
        }

        return playPromise.then(() => {
            if (!mediaModel.get('setup')) {
                // Exit if model state was reset
                return;
            }
            mediaModel.set('started', true);
            if (mediaModel === model.mediaModel) {
                syncPlayerWithMediaModel(mediaModel);
            }
        }).catch(error => {
            if (this.item && mediaModel === model.mediaModel) {
                model.set('playRejected', true);
                const videoTagPaused = video && video.paused;
                if (videoTagPaused) {
                    // Check if the video.src was set to empty, resolving to location.href and loaded.
                    // This can be caused by 3rd party ads libraries after an ad break.
                    if (video.src === location.href) {
                        // Attempt to reload the video once within the play promise chain.
                        return this._loadAndPlay(item, provider);
                    }
                    mediaModel.set('mediaState', STATE_PAUSED);
                }

                const playerError = Object.assign(new PlayerError(null, getPlayAttemptFailedErrorCode(error), error), {
                    error,
                    item,
                    playReason
                });
                delete playerError.key;
                this.trigger(MEDIA_PLAY_ATTEMPT_FAILED, playerError);
                throw error;
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
                return provider.play() || Promise.resolve();
            });
            this.thenPlayPromise = thenPlayPromise;
            return providerSetupPromise.then(thenPlayPromise.async);
        }
        return provider.play() || Promise.resolve();
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
        // A backgrounded provider is attached to a video tag
        if (!this.attached) {
            return false;
        }
        const provider = this.provider;
        if (__HEADLESS__) {
            // A headless provider that does not return a container is backgrounded
            return !provider.getContainer();
        }
        if (!provider.video) {
            // A provider without a video tag cannot be backgrounded
            return false;
        }
        // A backgrounded provider does not have a parent container, or has one, but without the media tag as a child
        const container = provider.getContainer();
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
        const provider = this.provider;
        // A provider without a video tag must use attach and detach
        if (!provider.video && !__HEADLESS__) {
            if (shouldBackground) {
                this.detach();
            } else {
                this.attach();
            }
            return;
        }
        const container = provider.getContainer();
        if (!container) {
            return;
        }

        if (shouldBackground) {
            if (!this.background) {
                this.thenPlayPromise.cancel();
                this.pause();
                if (provider.removeFromContainer) {
                    provider.removeFromContainer();
                } else {
                    container.removeChild(provider.video);
                }
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
        const { provider } = this;
        if (this.model.get('scrubbing') && provider.fastSeek) {
            provider.fastSeek(pos);
        } else {
            provider.seek(pos);
        }
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
