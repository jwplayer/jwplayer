import { createElement } from 'utils/dom';
import UI from 'utils/ui';
import floatingCloseButton from 'templates/floating-close-button';
import { cloneIcon } from 'view/controls/icons';
import Events from 'utils/backbone.events';
import { USER_ACTION } from 'events/events';

export default class FloatingCloseButton extends Events {
    constructor(container, ariaLabel) {
        super();
        this.element = createElement(floatingCloseButton(ariaLabel));

        this.element.appendChild(cloneIcon('close'));
        this.ui = new UI(this.element, { directSelect: true }).on('click tap enter', () => {
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
