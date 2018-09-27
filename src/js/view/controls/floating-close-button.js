import {
    createElement,
    removeClass
} from 'os/utils/dom';
import UI from 'os/utils/ui';
import floatingCloseButton from 'view/controls/templates/floating-close-button';
import { cloneIcon } from 'os/view/controls/icons';


const FloatingCloseButton = function(api, playerElement) {
    this.api = api;
    this.playerElement = playerElement;
};

Object.assign(FloatingCloseButton.prototype, {
    setup: function() {
        const controls = this.playerElement.querySelector('.jw-controls');
        this.element = createElement(floatingCloseButton());
        new UI(this.element).on('click tap enter', () => {
            removeClass(this.playerElement, 'jw-flag-floating');
        }, this);
        this.element.querySelector('.jw-icon').appendChild(cloneIcon('close'));
        controls.parentNode.appendChild(this.element);
    },

    destroy: function() {
        if (this.element) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
    }
});

export default FloatingCloseButton;
