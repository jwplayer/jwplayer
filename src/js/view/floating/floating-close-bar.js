import { createElement } from 'utils/dom';
import floatingCloseBar from 'templates/floating-close-bar';
import { cloneIcon } from 'view/controls/icons';
import Events from 'utils/backbone.events';
import { USER_ACTION } from 'events/events';
import { addClickAction } from 'view/utils/add-click-action';

export default class FloatingCloseBar extends Events {
    constructor(container, ariaLabel, title) {
        super();
        this.element = createElement(floatingCloseBar(ariaLabel, title));
        const iconEl = this.element.querySelector('.jw-float-bar-icon');
        iconEl.appendChild(cloneIcon('floating-close'));
        this.ui = addClickAction(iconEl, () => {
            this.trigger(USER_ACTION);
        });
        this.title = this.element.querySelector('.jw-float-bar-title');
        container.appendChild(this.element);
    }

    destroy() {
        if (this.element) {
            this.ui.destroy();
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
        this.off();
    }

    setTitle(title) {
        if (title) {
            this.title.innerText = title;
            this.title.setAttribute('aria-label', title);
        } else {
            // We set it to a space to stop the DIV from collapsing
            this.title.innerHTML = '&nbsp;';
            this.title.setAttribute('aria-label', '');
        }
    }
}
