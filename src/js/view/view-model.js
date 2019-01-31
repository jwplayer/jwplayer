import SimpleModel from 'model/simplemodel';

const changeEventRegEx = /^change:(.+)$/;

function dispatchDiffChangeEvents(viewModel, newAttributes, oldAttributes) {
    Object.keys(newAttributes).forEach((attr) => {
        if (attr in newAttributes && newAttributes[attr] !== oldAttributes[attr]) {
            viewModel.trigger(`change:${attr}`, viewModel, newAttributes[attr], oldAttributes[attr]);
        }
    });
}

function removeListeners(instance, viewModel) {
    if (instance) {
        instance.off(null, null, viewModel);
    }
}

class PlayerViewModel extends SimpleModel {

    constructor(playerModel, eventFilter) {
        super();

        this._model = playerModel;
        this._mediaModel = null;

        Object.assign(playerModel.attributes, {
            altText: '',
            fullscreen: false,
            logoWidth: 0,
            scrubbing: false
        });

        playerModel.on('all', (type, objectOrEvent, value, previousValue) => {
            if (objectOrEvent === playerModel) {
                objectOrEvent = this;
            }
            if (!eventFilter || eventFilter(type, objectOrEvent, value, previousValue)) {
                this.trigger(type, objectOrEvent, value, previousValue);
            }
        }, this);

        playerModel.on('change:mediaModel', (model, mediaModel) => {
            this.mediaModel = mediaModel;
        }, this);
    }

    set mediaModel(mediaModel) {
        const previousMediaModel = this._mediaModel;
        removeListeners(previousMediaModel, this);

        this._mediaModel = mediaModel;

        mediaModel.on('all', (type, objectOrEvent, value, previousValue) => {
            if (objectOrEvent === mediaModel) {
                objectOrEvent = this;
            }
            this.trigger(type, objectOrEvent, value, previousValue);
        }, this);

        if (previousMediaModel) {
            dispatchDiffChangeEvents(this, mediaModel.attributes, previousMediaModel.attributes);
        }
    }

    get(attr) {
        const mediaModel = this._mediaModel;
        if (mediaModel && attr in mediaModel.attributes) {
            return mediaModel.get(attr);
        }
        return this._model.get(attr);
    }

    set(attr, val) {
        return this._model.set(attr, val);
    }

    getVideo() {
        return this._model.getVideo();
    }

    destroy() {
        removeListeners(this._model, this);
        removeListeners(this._mediaModel, this);
        this.off();
    }
}

export default class ViewModel extends PlayerViewModel {
    constructor(playerModel) {
        super(playerModel, (type) => {
            // Do not propagate attribute changes from the player model for attributes present in instream
            const instreamModel = this._instreamModel;
            if (instreamModel) {
                const match = changeEventRegEx.exec(type);
                if (match) {
                    const attr = match[1];
                    if (attr in instreamModel.attributes) {
                        return false;
                    }
                }
            }
            return true;
        });

        this._instreamModel = null;
        this._playerViewModel = new PlayerViewModel(this._model);

        playerModel.on('change:instream', (model, instream) => {
            this.instreamModel = instream ? instream.model : null;
        }, this);
    }

    get player() {
        return this._playerViewModel;
    }

    set instreamModel(instreamModel) {
        const previousInstream = this._instreamModel;
        removeListeners(previousInstream, this);

        this._model.off('change:mediaModel', null, this);

        this._instreamModel = instreamModel;

        this.trigger('instreamMode', !!instreamModel);

        if (instreamModel) {
            instreamModel.on('all', (type, objectOrEvent, value, previousValue) => {
                if (objectOrEvent === instreamModel) {
                    objectOrEvent = this;
                }
                this.trigger(type, objectOrEvent, value, previousValue);
            }, this);

            instreamModel.change('mediaModel', (model, mediaModel) => {
                this.mediaModel = mediaModel;
            }, this);

            dispatchDiffChangeEvents(this, instreamModel.attributes, this._model.attributes);
        } else if (previousInstream) {
            this._model.change('mediaModel', (model, mediaModel) => {
                this.mediaModel = mediaModel;
            }, this);

            const mergedAttributes = Object.assign({}, this._model.attributes, previousInstream.attributes);
            dispatchDiffChangeEvents(this, this._model.attributes, mergedAttributes);
        }
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

    getVideo() {
        const instreamModel = this._instreamModel;
        if (instreamModel && instreamModel.getVideo()) {
            return instreamModel.getVideo();
        }
        return super.getVideo();
    }

    destroy() {
        super.destroy();
        removeListeners(this._instreamModel, this);
    }
}
