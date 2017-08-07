import displayContainerTemplate from 'view/controls/templates/display-container';
import utils from 'utils/helpers';

export default class DisplayContainer {
    constructor() {
        this.el = utils.createElement(displayContainerTemplate());
        this.container = this.el.querySelector('.jw-display-controls');
    }

    addButton(button) {
        this.container.appendChild(button.el);
    }

    element() {
        return this.el;
    }
}
