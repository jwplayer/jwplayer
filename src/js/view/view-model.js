import SimpleModel from 'model/simplemodel';

class SimpleModelExtendable {}
SimpleModelExtendable.prototype = Object.assign({}, SimpleModel);

function dispatchDiffChangeEvents(viewModel, newAttributes, oldAttributes) {
    Object.keys(newAttributes).forEach((attr) => {
        if (!newAttributes[attr] !== oldAttributes[attr]) {
            viewModel.trigger(`change:${attr}`, viewModel, newAttributes[attr], oldAttributes[attr]);
        }
    });
}

export default class ViewModel extends SimpleModelExtendable {

    constructor(playerModel) {
        super();

        this._model = playerModel;
        this._instreamModel = null;
        this._mediaModel = null;

        Object.assign(playerModel.attributes, {
            altText: '',
            fullscreen: false,
            logoWidth: 0,
            scrubbing: false
        });

        playerModel.on('all', (type, objectOrEvent, value, previousValue) => {
            this.trigger(type, objectOrEvent, value, previousValue);
        }, this);

        playerModel.on('change:mediaModel', (model, mediaModel) => {
            this.mediaModel = mediaModel;
        }, this);

        playerModel.on('change:instream', (model, instream) => {
            this.instreamModel = instream ? instream._adModel : null;
        });
    }

    set mediaModel(mediaModel) {
        const previousMediaModel = this._mediaModel;
        if (previousMediaModel) {
            previousMediaModel.off(null, null, this);
        }

        this._mediaModel = mediaModel;

        mediaModel.on('all', (type, objectOrEvent, value, previousValue) => {
            this.trigger(type, objectOrEvent, value, previousValue);
        }, this);

        dispatchDiffChangeEvents(this, mediaModel.attributes, previousMediaModel ? previousMediaModel.attributes : {});
    }

    set instreamModel(instreamModel) {
        const previousInstream = this._instreamModel;
        if (previousInstream) {
            previousInstream.off(null, null, this);
        }

        this._instreamModel = instreamModel;

        if (instreamModel) {
            instreamModel.on('all', (type, objectOrEvent, value, previousValue) => {
                this.trigger(type, objectOrEvent, value, previousValue);
            }, this);

            instreamModel.change('mediaModel', (model, mediaModel, previousMediaModel) => {
                if (previousMediaModel) {
                    previousMediaModel.off(null, null, this);
                }
                this.mediaModel = mediaModel;
            }, this);
        } else {
            this.mediaModel = this._model.get('mediaModel');
        }

        dispatchDiffChangeEvents(this, instreamModel ? instreamModel.attributes : {}, this._model.attributes);
    }

    get(attr) {
        const mediaModel = this._mediaModel;
        if (mediaModel && attr in mediaModel.attributes) {
            return mediaModel.get(attr);
        }
        const instreamModel = this._instreamModel;
        if (instreamModel && attr in instreamModel.attributes) {
            return instreamModel.get(attr);
        }
        return this._model.get(attr);
    }

    set(attr, val) {
        return this._model.set(attr, val);
    }

    getVideo() {
        const instreamModel = this._instreamModel;
        if (instreamModel && instreamModel.getVideo()) {
            return instreamModel.getVideo();
        }
        return this._model.getVideo();
    }

    destroy() {
        this._model.off(null, null, this);
        if (this._mediaModel) {
            this._mediaModel.off(null, null, this);
        }
        if (this._instreamModel) {
            this._instreamModel.off(null, null, this);
        }
        this.off();
    }
}
