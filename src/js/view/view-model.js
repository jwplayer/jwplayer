import SimpleModel from 'model/simplemodel';

function ViewModel(playerModel) {
    this._model = playerModel;
    this._instreamModel = null;
    this._mediaModel = null;

    playerModel.on('all', (type, objectOrEvent, value, previousValue) => {
        this.trigger(type, objectOrEvent, value, previousValue);
    }, this);

    playerModel.on('change:mediaModel', (changedPlayerModel, mediaModel, previousMediaModel) => {
        if (previousMediaModel) {
            previousMediaModel.off(null, null, this);
        }
        this._mediaModel = mediaModel;
        mediaModel.on('all', (type, objectOrEvent, value, previousValue) => {
            this.trigger(type, objectOrEvent, value, previousValue);
        }, this);
    }, this);

    // TODO: insteam-model / remove insteam-model from view.js
}

Object.assign(ViewModel.prototype, SimpleModel, {
    get(attr) {
        const mediaModel = this._mediaModel;
        if (mediaModel && attr in mediaModel.attributes) {
            return mediaModel.get(attr);
        }
        return this._model.get(attr);
    },
    set(attr, val) {
        return this._model.set(attr, val);
    },
    getVideo() {
        console.error('called model.getVideo()!');
        return this._model.getVideo();
    },
    destroy() {
        this._model.off(null, null, this);
        this._mediaModel.off(null, null, this);
        this.off();
    }
});


Object.defineProperties(ViewModel.prototype, {
    mediaController: {
        enumerable: true,
        get: function() {
            console.error('getting model.mediaController');
            return this._model.mediaController;
        }
    }
});

export default ViewModel;
