import ApiQueueDecorator from './api-queue';
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
    this.apiQueue = new ApiQueueDecorator(this, () => true);
};

/* eslint no-unused-vars: 0 */

Object.assign(CoreLoader.prototype, {
    on: Events.on,
    once: Events.once,
    off: Events.off,
    trigger: Events.trigger,
    init(options, api) {
        loadController().then(CoreMixin => {
            if (!this.apiQueue) {
                // Exit if `playerDestroy` was called on CoreLoader clearing the config
                return;
            }
            // copy queued commands
            const commandQueue = this.apiQueue.queue.slice(0);
            this.apiQueue.destroy();
            // Assign CoreMixin.prototype (formerly controller) properties to this instance making api.core the controller
            Object.assign(this, CoreMixin.prototype);
            this.setup(api, options, this.originalContainer, this._events, commandQueue);
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
    setMute(toggle) {
        this.model.set('mute', toggle);
    },
    setVolume(value) {
        this.model.set('volume', value);
    },
    setPlaybackRate(value) {
        this.model.set('defaultPlaybackRate', value);
    },
    getProvider() {
        return this.get('provider');
    },
    getState() {
        // instream.model.state || model.state
        return this.get('state');
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
    castToggle() {},

    // Queue these
    setConfig(newConfig) {},
    setControls(toggle) {},
    setCurrentCaptions(index) {},
    setFullscreen(toggle) {},
    setCurrentQuality(index) {},
    setCurrentAudioTrack(index) {},
    load(item, feedData) {

    },
    play(meta = {}) {

    },
    pause(meta = {}) {

    },
    seek(pos, meta) {

    },
    stop(internal) {

    },
    playlistItem(index, meta) {

    },
    playlistNext(meta) {

    },
    playlistPrev(meta) {

    },
    next() {
        // nextUp or related.next();
    },

    addButton(img, tooltip, callback, id, btnClass) {},
    removeButton(id) {},

    // These are pass-throughs to the view
    setCaptions(captionsStyle) {
        // queue this for the view _captionsRenderer
    },
    resize(playerWidth, playerHeight) {
        // queue this for the view OR update model/config
    },
    setCues(cues) {
        // queue this for the view.addCues(cues) OR _model.set('cues', cues);
    },
    getSafeRegion(excludeControlbar) {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
    }
});

export default CoreLoader;
