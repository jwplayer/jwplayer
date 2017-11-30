import SimpleModel from 'model/simplemodel';
import { PLAYER_STATE } from 'events/events';

class SimpleModelExtendable {}
SimpleModelExtendable.prototype = Object.assign({}, SimpleModel);

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
            if (objectOrEvent === playerModel) {
                objectOrEvent = this;
            }
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
        removeListeners(previousMediaModel, this);

        this._mediaModel = mediaModel;

        mediaModel.on('all', (type, objectOrEvent, value, previousValue) => {
            if (type === `change:${PLAYER_STATE}`) {
                return;
            }
            if (objectOrEvent === mediaModel) {
                objectOrEvent = this;
            }
            this.trigger(type, objectOrEvent, value, previousValue);
        }, this);

        dispatchDiffChangeEvents(this, mediaModel.attributes, previousMediaModel ? previousMediaModel.attributes : {});
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
        } else {
            this._model.change('mediaModel', (model, mediaModel) => {
                this.mediaModel = mediaModel;
            }, this);
            
            const mergedAttributes = Object.assign({}, previousInstream ? previousInstream.attributes : {}, this._model.attributes);
            dispatchDiffChangeEvents(this, this._model.attributes, mergedAttributes);
        }
    }

    get(attr) {
        const mediaModel = this._mediaModel;
        if (attr !== PLAYER_STATE && mediaModel && attr in mediaModel.attributes) {
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
        removeListeners(this._model, this);
        removeListeners(this._mediaModel, this);
        removeListeners(this._instreamModel, this);
        this.off();
    }
}
