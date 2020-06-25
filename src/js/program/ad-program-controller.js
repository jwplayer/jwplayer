import { ERROR, FULLSCREEN, NATIVE_FULLSCREEN, MEDIA_COMPLETE, PLAYER_STATE, STATE_PLAYING, STATE_PAUSED } from 'events/events';
import ProgramController from 'program/program-controller';
import Model from 'controller/model';
import changeStateEvent from 'events/change-state-event';
import SharedMediaPool from 'program/shared-media-pool';

export default class AdProgramController extends ProgramController {
    constructor(model, mediaPool) {
        super(model, mediaPool);
        const adModel = this.model = new Model();
        this.playerModel = model;
        this.provider = null;
        this.backgroundLoading = model.get('backgroundLoading');

        adModel.mediaModel.attributes.mediaType = 'video';

        if (!__HEADLESS__) {
            // Ad plugins must use only one element, and must use the same element during playback of an item
            // (i.e. prerolls, midrolls, and postrolls must use the same tag)
            let mediaElement;
            if (this.backgroundLoading) {
                mediaElement = mediaPool.getAdElement();
            } else {
                // Take the tag that we're using to play the current item. The tag has been freed before reaching this point
                mediaElement = model.get('mediaElement');

                adModel.attributes.mediaElement = mediaElement;
                adModel.attributes.mediaSrc = mediaElement.src;

                // Listen to media element for events that indicate src was reset or load() was called
                const srcResetListener = this.srcResetListener = () => {
                    this.srcReset();
                };
                mediaElement.addEventListener('emptied', srcResetListener);
                mediaElement.playbackRate = mediaElement.defaultPlaybackRate = 1;
            }

            this.mediaPool = SharedMediaPool(mediaElement, mediaPool);
        }
    }

    setup() {
        const { model, playerModel, primedElement } = this;
        const playerAttributes = playerModel.attributes;
        const mediaModelContext = playerModel.mediaModel;
        model.setup({
            id: playerAttributes.id,
            volume: playerAttributes.volume,
            instreamMode: true,
            edition: playerAttributes.edition,
            mediaContext: mediaModelContext,
            mute: playerAttributes.mute,
            streamType: 'VOD',
            autostartMuted: playerAttributes.autostartMuted,
            autostart: playerAttributes.autostart,
            advertising: playerAttributes.advertising,
            sdkplatform: playerAttributes.sdkplatform,
            skipButton: false
        });

        model.on('change:state', changeStateEvent, this);
        model.on(ERROR, function(data) {
            this.trigger(ERROR, data);
        }, this);

        if (!__HEADLESS__) {
            if (!primedElement.paused) {
                primedElement.pause();
            }
        }
    }

    setActiveItem(index) {
        this.stopVideo();
        this.provider = null;
        return super.setActiveItem(index)
            .then((mediaController) => {
                this._setProvider(mediaController.provider);
                return this.playVideo();
            });
    }

    usePsuedoProvider(provider) {
        if (!provider) {
            return;
        }
        this._setProvider(provider);

        // Match the main player's controls state
        provider.off(ERROR);
        provider.on(ERROR, function(data) {
            this.trigger(ERROR, data);
        }, this);
    }

    _setProvider(provider) {
        // Clear current provider when applyProviderListeners(null) is called
        if (!provider || !this.mediaPool) {
            return;
        }
        this.provider = provider;
        const { model, playerModel } = this;
        const isVpaidProvider = provider.type === 'vpaid';

        provider.off();
        provider.on('all', function(type, data) {
            if (isVpaidProvider && (type === MEDIA_COMPLETE)) {
                return;
            }
            this.trigger(type, Object.assign({}, data, { type: type }));
        }, this);

        const adMediaModelContext = model.mediaModel;
        provider.on(PLAYER_STATE, (event) => {
            event.oldstate = event.oldstate || model.get(PLAYER_STATE);
            adMediaModelContext.set('mediaState', event.newstate);
        });
        provider.on(NATIVE_FULLSCREEN, this._nativeFullscreenHandler, this);
        adMediaModelContext.on('change:mediaState', (changeAdModel, state) => {
            this._stateHandler(state);
        });
        provider.attachMedia();
        if (__HEADLESS__) {
            const mediaContainer = playerModel.get('mediaContainer');
            provider.setContainer(mediaContainer);
        }
        provider.volume(playerModel.get('volume'));
        provider.mute(playerModel.getMute());
        if (provider.setPlaybackRate) {
            provider.setPlaybackRate(1);
        }
        playerModel.on('change:volume', function(data, value) {
            this.volume = value;
        }, this);
        playerModel.on('change:mute', function(data, mute) {
            this.mute = mute;
            if (!mute) {
                this.volume = playerModel.get('volume');
            }
        }, this);
        playerModel.on('change:autostartMuted', function(data, value) {
            if (!value) {
                model.set('autostartMuted', value);
                this.mute = playerModel.get('mute');
            }
        }, this);
    }

    destroy() {
        const { mediaController, model, mediaPool, playerModel } = this;
        model.off();

        if (__HEADLESS__) {
            if (this.provider) {
                this.provider.remove();
                this.provider = null;
                mediaController.destroy();
            }
            return;
        }

        // Do not destroy or remove provider event listeners since non-linear ads may continue to run after this point
        this.provider = null;

        // We only use one media element from ads; getPrimedElement will return it
        const mediaElement = mediaPool.getPrimedElement();
        if (!this.backgroundLoading) {
            if (mediaElement) {
                mediaElement.removeEventListener('emptied', this.srcResetListener);
                // Reset the player media model if the src was changed externally
                if (mediaElement.src !== model.get('mediaSrc')) {
                    this.srcReset();
                }
            }
        } else {
            mediaPool.clean();
            const mediaContainer = playerModel.get('mediaContainer');
            if (mediaElement.parentNode === mediaContainer) {
                mediaContainer.removeChild(mediaElement);
            }
        }
    }

    srcReset() {
        const { playerModel } = this;
        const mediaModel = playerModel.get('mediaModel');
        const provider = playerModel.getVideo();

        mediaModel.srcReset();

        // Set hlsjs.src to null so that it reloads it's item source
        if (provider) {
            provider.src = null;
        }
    }

    _nativeFullscreenHandler(evt) {
        this.model.trigger(NATIVE_FULLSCREEN, evt);
        this.trigger(FULLSCREEN, {
            fullscreen: evt.jwstate
        });
    }

    _stateHandler(state) {
        const { model } = this;
        switch (state) {
            case STATE_PLAYING:
            case STATE_PAUSED:
                model.set(PLAYER_STATE, state);
                break;
            default:
                break;
        }
    }

    set mute(mute) {
        const { mediaController, model, provider } = this;
        model.set('mute', mute);
        super.setMute(mute);
        if (!mediaController) {
            provider.mute(mute);
        }
    }

    set volume(volume) {
        const { mediaController, model, provider } = this;
        model.set('volume', volume);
        super.setVolume(volume);
        if (!mediaController) {
            provider.volume(volume);
        }
    }
}
