import { createElement } from 'utils/dom';
import UI from 'utils/ui';
import floatingCloseButton from 'templates/floating-close-button';
import { cloneIcon } from 'view/controls/icons';


const FloatingCloseButton = function(playerElement) {
    this.playerElement = playerElement;
};

Object.assign(FloatingCloseButton.prototype, {
    setup: function(callback) {
        this.element = createElement(floatingCloseButton());

        const icon = this.element.querySelector('.jw-icon');
        icon.appendChild(cloneIcon('close'));
        this.ui = new UI(icon).on('click tap enter', callback, this);

        this.playerElement.appendChild(this.element);
    },

    destroy: function() {
        if (this.element) {
            this.ui.destroy();
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
    }
});

export default FloatingCloseButton;
