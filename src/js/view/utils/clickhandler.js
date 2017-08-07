import { CLICK } from 'events/events';
import UI from 'utils/ui';
import Events from 'utils/backbone.events';

export default class ClickHandler {
    constructor(model, element, options) {
        Object.assign(this, Events);

        this.revertAlternateClickHandlers();
        this.domElement = element;
        this.model = model;

        const defaultOptions = { enableDoubleTap: true, useMove: true };
        this.ui = new UI(element, Object.assign(defaultOptions, options)).on({
            'click tap': this.clickHandler,
            'doubleClick doubleTap': function() {
                if (this.alternateDoubleClickHandler) {
                    this.alternateDoubleClickHandler();
                    return;
                }
                this.trigger('doubleClick');
            },
            move: function() {
                this.trigger('move');
            },
            over: function() {
                this.trigger('over');
            },
            out: function() {
                this.trigger('out');
            }
        }, this);
    }

    destroy() {
        if (this.ui) {
            this.ui.destroy();
            this.ui = this.domElement = this.model = null;
            this.revertAlternateClickHandlers();
        }
    }

    clickHandler(evt) {
        if (this.model.get('flashBlocked')) {
            return;
        }
        if (this.alternateClickHandler) {
            this.alternateClickHandler(evt);
            return;
        }
        this.trigger((evt.type === CLICK) ? 'click' : 'tap');
    }

    element() {
        return this.domElement;
    }

    setAlternateClickHandlers(clickHandler, doubleClickHandler) {
        this.alternateClickHandler = clickHandler;
        this.alternateDoubleClickHandler = doubleClickHandler || null;
    }

    revertAlternateClickHandlers() {
        this.alternateClickHandler = null;
        this.alternateDoubleClickHandler = null;
    }
}
