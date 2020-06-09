import { CLICK } from 'events/events';
import UI from 'utils/ui';
import Events from 'utils/backbone.events';
import type Model from 'controller/model';
import type { GenericObject } from 'types/generic.type';

export default class ClickHandler extends Events {
    domElement: HTMLElement | null;
    model: Model | null;
    ui: UI;
    alternateClickHandler?: Function | null;
    alternateDoubleClickHandler?: Function | null;

    constructor(model: Model, element: HTMLElement) {
        super();
        this.revertAlternateClickHandlers();
        this.domElement = element;
        this.model = model;

        this.ui = new UI(element).on('click tap', this.clickHandler, this)
            .on('doubleClick doubleTap', function(this: ClickHandler): void {
                if (this.alternateDoubleClickHandler) {
                    this.alternateDoubleClickHandler();
                    return;
                }
                this.trigger('doubleClick');
            }, this);
    }

    destroy(): void {
        if (this.ui) {
            this.ui.destroy();
            this.ui = null;
            this.domElement = null;
            this.model = null;
            this.revertAlternateClickHandlers();
        }
    }

    clickHandler(evt: GenericObject): void {
        if (!this.model) {
            return;
        }

        if (this.model.get('flashBlocked')) {
            return;
        }
        if (this.alternateClickHandler) {
            this.alternateClickHandler(evt);
            return;
        }
        this.trigger((evt.type === CLICK) ? 'click' : 'tap');
    }

    element(): HTMLElement | null {
        return this.domElement;
    }

    setAlternateClickHandlers(clickHandler: Function, doubleClickHandler?: Function): void {
        this.alternateClickHandler = clickHandler;
        this.alternateDoubleClickHandler = doubleClickHandler || null;
    }

    revertAlternateClickHandlers(): void {
        this.alternateClickHandler = null;
        this.alternateDoubleClickHandler = null;
    }
}
