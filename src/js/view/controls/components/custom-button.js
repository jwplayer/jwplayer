import buttonTemplate from 'view/controls/templates/custom-button';
import utils from 'utils/helpers';
import UI from 'utils/ui';

export default class CustomButton {

    constructor(img, ariaText, callback, id, btnClass) {
        const button = buttonTemplate(btnClass,
            id,
            img,
            ariaText
        );

        const buttonElement = utils.createElement(button);

        new UI(buttonElement).on('click tap', callback, this);

        this.id = id;
        this.buttonElement = buttonElement;
    }

    element() {
        return this.buttonElement;
    }

    toggle(show) {
        if (show) {
            this.show();
        } else {
            this.hide();
        }
    }

    show() {
        this.buttonElement.style.display = '';
    }
    hide() {
        this.buttonElement.style.display = 'none';
    }
}
