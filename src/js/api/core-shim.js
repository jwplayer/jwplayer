import ApiQueueDecorator from 'api/api-queue';
import Config from 'api/config';
import Setup from 'api/Setup';
import Providers from 'providers/providers';
import Timer from 'api/timer';
import Storage from 'model/storage';
import SimpleModel from 'model/simplemodel';
import { INITIAL_PLAYER_STATE, INITIAL_MEDIA_STATE } from 'model/player-model';
import { SETUP_ERROR, STATE_ERROR } from 'events/events';
import Events from 'utils/backbone.events';
import { resolved } from 'polyfills/promise';
import ErrorContainer from 'view/error-container';
import MediaElementPool from 'program/media-element-pool';
import SharedMediaPool from 'program/shared-media-pool';
import UI, { getElementWindow } from 'utils/ui';
import { PlayerError, composePlayerError, convertToPlayerError,
    SETUP_ERROR_LOADING_PLAYLIST, SETUP_ERROR_UNKNOWN, MSG_TECHNICAL_ERROR } from 'api/errors';

const ModelShim = function() {};
Object.assign(ModelShim.prototype, SimpleModel);

const CoreShim = function(originalContainer) {
    this._events = {};
    this.modelShim = new ModelShim();
    this.modelShim._qoeItem = new Timer();
    this.mediaShim = {};
    this.setup = new Setup(this.modelShim);
    this.currentContainer =
        this.originalContainer = originalContainer;
    this.apiQueue = new ApiQueueDecorator(this, [
        // These commands require a provider instance to be available
        'load',
        'play',
        'pause',
        'seek',
        'stop',
        'playlistItem',
        'playlistNext',
        'playlistPrev',
        'next',
        'preload',

        // These should just update state that could be acted on later, but need to be queued given v7 model
        'setConfig',
        'setCurrentAudioTrack',
        'setCurrentCaptions',
        'setCurrentQuality',
        'setFullscreen',
        'addButton',
        'removeButton',
        'castToggle',
        'setMute',
        'setVolume',
        'setPlaybackRate',
        'setCues',
        'setPlaylistItem',

        // These commands require the view instance to be available
        'resize',
        'setCaptions',
        'setControls',
    ], () => true);
};

Object.assign(CoreShim.prototype, {
    on: Events.on,
    once: Events.once,
    off: Events.off,
    trigger: Events.trigger,
    init(options, api) {
        const model = this.modelShim;
        const storage = new Storage('jwplayer', [
            'volume',
            'mute',
            'captionLabel',
            'bandwidthEstimate',
            'bitrateSelection',
            'qualityLabel'
        ]);
        const persisted = storage && storage.getAllItems();
        model.attributes = model.attributes || {};

        Object.assign(this.mediaShim, INITIAL_MEDIA_STATE);

        // Assigning config properties to the model needs to be synchronous for chained get API methods
        const setupConfig = options;
        const configuration = Config(Object.assign({}, options), persisted);
        configuration.id = api.id;
        configuration.setupConfig = setupConfig;
        Object.assign(model.attributes, configuration, INITIAL_PLAYER_STATE);
        model.getProviders = function() {
            return new Providers(configuration);
        };
        model.setProvider = function() {};

        // Create/get click-to-play media element, and call .load() to unblock user-gesture to play requirement
        let mediaPool = MediaElementPool();
        if (!model.get('backgroundLoading')) {
            mediaPool = SharedMediaPool(mediaPool.getPrimedElement(), mediaPool);
        }

        const primeUi = new UI(getElementWindow(this.originalContainer)).once('gesture', () => {
            mediaPool.prime();
            this.preload();
            primeUi.destroy();
        });

        model.on('change:errorEvent', logError);

        return this.setup.start(api).then(allPromises => {
            const CoreMixin = allPromises[0];
            if (!this.setup) {
                // Exit if `playerDestroy` was called on CoreLoader clearing the config
                return;
            }
            const config = this.modelShim.clone();
            // Exit if embed config encountered an error
            if (config.error) {
                throw config.error;
            }
            // copy queued commands
            const commandQueue = this.apiQueue.queue.slice(0);
            this.apiQueue.destroy();

            // Assign CoreMixin.prototype (formerly controller) properties to this instance making api.core the controller
            Object.assign(this, CoreMixin.prototype);
            this.setup(config, api, this.originalContainer, this._events, commandQueue, mediaPool);

            const coreModel = this._model;
            // Switch the error log handlers after the real model has been set
            model.off('change:errorEvent', logError);
            coreModel.on('change:errorEvent', logError);
            storage.track(coreModel);

            // Set the active playlist item after plugins are loaded and the view is setup
            return this.updatePlaylist(coreModel.get('playlist'), coreModel.get('feedData'))
                .catch(error => {
                    throw composePlayerError(error, SETUP_ERROR_LOADING_PLAYLIST);
                });
        }).then(() => {
            if (!this.setup) {
                return;
            }
            this.playerReady();
        }).catch((error) => {
            if (!this.setup) {
                return;
            }
            setupError(this, error);
        });
    },
    playerDestroy() {
        if (this.apiQueue) {
            this.apiQueue.destroy();
        }

        if (this.setup) {
            this.setup.destroy();
        }
        this.off();
        this._events =
            this._model =
            this.modelShim =
            this.originalContainer =
            this.apiQueue =
            this.setup = null;
    },
    getContainer() {
        return this.currentContainer;
    },

    // These methods read from the model
    get(property) {
        if (!this.modelShim) {
            return;
        }
        if (property in this.mediaShim) {
            return this.mediaShim[property];
        }
        return this.modelShim.get(property);
    },
    getItemQoe() {
        return this.modelShim._qoeItem;
    },
    getConfig() {
        return Object.assign({}, this.modelShim.attributes, this.mediaShim);
    },
    getCurrentCaptions() {
        return this.get('captionsIndex');
    },
    getWidth() {
        return this.get('containerWidth');
    },
    getHeight() {
        return this.get('containerHeight');
    },
    getMute() {
        return this.get('mute');
    },
    getProvider() {
        return this.get('provider');
    },
    getState() {
        return this.get('state');
    },

    // These methods require a provider
    getAudioTracks() {
        return null;
    },
    getCaptionsList() {
        return null;
    },
    getQualityLevels() {
        return null;
    },
    getVisualQuality() {
        return null;
    },
    getCurrentQuality() {
        return -1;
    },
    getCurrentAudioTrack() {
        return -1;
    },

    // These methods require the view
    getSafeRegion(/* excludeControlbar */) {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
    },

    // Ads specific
    isBeforeComplete() {
        return false;
    },
    isBeforePlay() {
        return false;
    },
    createInstream() {
        return null;
    },
    skipAd() {},
    attachMedia() {},
    detachMedia() {
        return null; // video tag;
    }
});

function setupError(core, error) {
    resolved.then(() => {
        const playerError = convertToPlayerError(MSG_TECHNICAL_ERROR, SETUP_ERROR_UNKNOWN, error);
        const model = core._model || core.modelShim;

        // The message may have already been created (eg. multiple players on a page where a plugin fails to load)
        playerError.message = playerError.message || model.get('localization').errors[playerError.key];
        delete playerError.key;

        const errorContainer = ErrorContainer(core, playerError);
        if (ErrorContainer.cloneIcon) {
            errorContainer.querySelector('.jw-icon').appendChild(ErrorContainer.cloneIcon('error'));
        }
        showView(core, errorContainer);

        model.set('errorEvent', playerError);
        model.set('state', STATE_ERROR);

        core.trigger(SETUP_ERROR, playerError);
    });
}

function logError(model, error) {
    if (!error || !error.code) {
        return;
    }
    if (error.sourceError) {
        console.error(error.sourceError);
    }
    console.error(PlayerError.logMessage(error.code));
}

export function showView(core, viewElement) {
    if (!document.body.contains(core.currentContainer)) {
        // This implies the player was removed from the DOM before setup completed
        //   or a player has been "re" setup after being removed from the DOM
        const newContainer = document.getElementById(core.get('id'));
        if (newContainer) {
            core.currentContainer = newContainer;
        }
    }

    if (core.currentContainer.parentElement) {
        core.currentContainer.parentElement.replaceChild(viewElement, core.currentContainer);
    }
    core.currentContainer = viewElement;
}

export default CoreShim;
