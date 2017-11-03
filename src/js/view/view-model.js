import SimpleModel from 'model/simplemodel';

const INITIAL_VIEW_STATE = {
    viewSetup: false,
    containerWidth: null,
    containerHeight: null,
    mediaContainer: null,
    altText: '',
    cues: null,
    scrubbing: false,
    inDom: false,
    audioMode: false,
    touchMode: null,
    playOnViewable: null,
    autostartMuted: null,
    autostartFailed: null,
    hideAdsControls: null,
    fullscreen: false,
    iFrame: null,
    activeTab: null,
    intersectionRatio: null,
    visibility: null,
    viewable: null,
    castClicked: false,
};

function ViewModel(playerModel) {
    this.attributes = Object.assign({}, INITIAL_VIEW_STATE);
    this.playerModel = playerModel;


    playerModel.on('all', (type, objectOrEvent, value, previousValue) => {
        console.warn('model "all"', type, objectOrEvent, value, previousValue);
        this.trigger(type, objectOrEvent, value, previousValue);
    }, this);

    playerModel.on('change:mediaModel', (changedPlayerModel, mediaModel, previousMediaModel) => {
        if (previousMediaModel) {
            previousMediaModel.off(null, null, this);
        }
        mediaModel.on('all', (type, objectOrEvent, value, previousValue) => {
            console.warn('mediaModel "all"', type, objectOrEvent, value, previousValue);
            this.trigger(type, objectOrEvent, value, previousValue);
        }, this);
    }, this);
}

Object.assign(ViewModel.prototype, SimpleModel, {
    get(attr) {
        // console.warn(`model.get(${attr})`);
        if (attr === 'mediaModel') {
            console.error(`getting mediaModel model.get(${attr})!`);
        }
        if (attr in this.attributes && attr in this.playerModel.attributes) {
            console.error(`Attribute "${attr}" is defined in model and view.`);
        }
        if (attr in this.attributes) {
            return this.attributes[attr];
        }
        return this.playerModel.get(attr);
    },
    change(attr, callback, context) {
        if (attr in this.attributes && attr in this.playerModel.attributes) {
            console.error(`Change attribute "${attr}" is defined in model and view.`);
        }

        if (attr in this.attributes) {
            console.warn(`viewModel.change(${attr}, ...)`);
            return this.playerModel.change(attr, callback, context);
        }
        console.warn(`viewModel.change(${attr}, ...)`);
        return SimpleModel.change.call(this, attr, callback, context);
    },
    getVideo() {
        console.error('called model.getVideo()!');
        return this.playerModel.getVideo();
    },
    setPlaybackRate(rate) {
        console.error(`called model.setPlaybackRate(${rate})!`);
        return this.playerModel.setPlaybackRate(rate);
    },
    // Just for testing:
    set(attr, val) {
        if (attr in this.playerModel.attributes) {
            console.error(`Setting attribute "${attr}" defined in model.`);
        } else if (!(attr in this.attributes)) {
            console.error(`Setting attribute "${attr}" not yet defined on view model.`);
        }
        return SimpleModel.set.call(this, attr, val);
    },
    // on(name, callback, context) {
    //     console.warn(`model.on(${name}, ...)`);
    //     return SimpleModel.on.call(this, name, callback, context);
    // },
    // once(name, callback, context) {
    //     console.warn(`model.on(${name}, ...)`);
    //     return SimpleModel.once.call(this, name, callback, context);
    // },
    destroy() {
        this.off();
    }
});


Object.defineProperties(ViewModel.prototype, {
    mediaController: {
        enumerable: true,
        get: function() {
            console.error('getting model.mediaController');
            return this.playerModel.mediaController;
        }
    }
});

export default ViewModel;
