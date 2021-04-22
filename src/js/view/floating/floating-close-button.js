import { createElement } from 'utils/dom';
import floatingCloseButton from 'templates/floating-close-button';
import { cloneIcon } from 'view/controls/icons';
import Events from 'utils/backbone.events';
import { USER_ACTION } from 'events/events';
import { addClickAction } from 'view/utils/add-click-action';

export default class FloatingCloseButton extends Events {
    constructor(container, ariaLabel) {
        super();
        this.element = createElement(floatingCloseButton(ariaLabel));

        this.element.appendChild(cloneIcon('close'));
        this.ui = addClickAction(this.element, () => {
            this.trigger(USER_ACTION);
        });

        container.appendChild(this.element);
    }

    destroy() {
        if (this.element) {
            this.ui.destroy();
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
    }
}
