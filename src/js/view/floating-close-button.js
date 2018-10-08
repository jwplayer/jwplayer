import { createElement } from 'utils/dom';
import UI from 'utils/ui';
import floatingCloseButton from 'templates/floating-close-button';
import { cloneIcon } from 'view/controls/icons';


const FloatingCloseButton = function(wrapperElement) {
    this.wrapperElement = wrapperElement;
};

Object.assign(FloatingCloseButton.prototype, {
    setup: function(callback, ariaLabel) {
        this.element = createElement(floatingCloseButton(ariaLabel));

        this.element.appendChild(cloneIcon('close'));
        this.ui = new UI(this.element).on('click tap enter', callback, this);

        this.wrapperElement.appendChild(this.element);
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
