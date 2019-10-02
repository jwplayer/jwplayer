import { createElement } from 'utils/dom';
import floatingCloseButton from 'templates/floating-close-button';
import { cloneIcon } from 'view/controls/icons';
import Events from 'utils/backbone.events';
import { USER_ACTION } from 'events/events';

export default class FloatingCloseButton extends Events {
    constructor(container, ariaLabel) {
        super();
        this.element = createElement(floatingCloseButton(ariaLabel));

        this.element.appendChild(cloneIcon('close'));

        this.interactionHandler = this.userActionHandler.bind(this);
        this.element.addEventListener('click', this.interactionHandler);
        this.element.addEventListener('tap', this.interactionHandler);
        this.element.addEventListener('enter', this.interactionHandler);

        container.appendChild(this.element);
    }

    userActionHandler() {
        this.trigger(USER_ACTION);
    }

    destroy() {
        if (this.element) {
            this.element.removeEventListener('click', this.interactionHandler);
            this.element.removeEventListener('tap', this.interactionHandler);
            this.element.removeEventListener('enter', this.interactionHandler);
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
    }
}
