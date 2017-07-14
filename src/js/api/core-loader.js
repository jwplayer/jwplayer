import ApiQueueDecorator from './api-queue';
import Config from './config';
import Storage from '../model/storage';
import SimpleModel from '../model/simplemodel';
import Timer from 'api/timer';
import Events from 'utils/backbone.events';

let controllerPromise = null;

function loadController() {
    if (!controllerPromise) {
        controllerPromise = new Promise(function (resolve) {
            require.ensure(['controller/controller'], function (require) {
                const CoreMixin = require('controller/controller');
                resolve(CoreMixin);
            }, 'jwplayer.core');
        });
    }
    return controllerPromise;
}

const CoreModel = function() {};
Object.assign(CoreModel.prototype, SimpleModel);

const CoreLoader = function CoreSetup(originalContainer) {
    loadController();
    this._events = {};
    this.controller = null;
    this.model = new CoreModel();
    this.model._qoeItem = new Timer();
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

        // These commands require the view instance to be available
        'resize',
        'setCaptions',
        'setControls',
        'setCues',
    ], () => true);
};

/* eslint no-unused-vars: 0 */

Object.assign(CoreLoader.prototype, {
    on: Events.on,
    once: Events.once,
    off: Events.off,
    trigger: Events.trigger,
    init(options, api) {

        const storage = new Storage('jwplayer', [
            'volume',
            'mute',
            'captionLabel',
            'qualityLabel'
        ]);
        const persisted = storage && storage.getAllItems();
        this.model.attributes = this.model.attributes || {};
        Object.assign(this.model.attributes, new Config(options, persisted));

        loadController().then(CoreMixin => {
            if (!this.apiQueue) {
                // Exit if `playerDestroy` was called on CoreLoader clearing the config
                return;
            }
            const config = this.model.clone();
            // copy queued commands
            const commandQueue = this.apiQueue.queue.slice(0);
            this.apiQueue.destroy();
            // Assign CoreMixin.prototype (formerly controller) properties to this instance making api.core the controller
            Object.assign(this, CoreMixin.prototype);
            this.setup(config, api, this.originalContainer, this._events, commandQueue);
            storage.track(this._model);
        });
    },
    playerDestroy() {
        // TODO: cancel async setup
        if (this.apiQueue) {
            this.apiQueue.destroy();
        }
        this._events =
            this.apiQueue =
            this.originalContainer =
            this.model =
            this.controller = null;
    },
    getContainer() {
        return this.originalContainer;
    },

    // These methods read from the model
    get(property) {
        return this.model.get(property);
    },
    getItemQoe() {
        return this.model._qoeItem;
    },
    getConfig() {
        // TODO: include normalized config from setup
        return Object.assign({}, this.model.attributes);
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
        // instream.model.state || model.state
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
    getSafeRegion(excludeControlbar) {
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

export default CoreLoader;
