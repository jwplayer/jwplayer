import displayContainerTemplate from 'view/controls/templates/display-container';
import RewindDisplayIcon from 'view/controls/rewind-display-icon';
import PlayDisplayIcon from 'view/controls/play-display-icon';
import NextDisplayIcon from 'view/controls/next-display-icon';
import { cloneIcons } from 'view/controls/icons';
import { createElement } from 'utils/dom';

export default class DisplayContainer {
    constructor(model, api) {
        this.el = createElement(displayContainerTemplate(model.get('localization')));

        const container = this.el.querySelector('.jw-display-controls');
        const buttons = {};

        addButton('rewind', cloneIcons('rewind'), RewindDisplayIcon, container, buttons, model, api);
        addButton('display', cloneIcons('play,pause,buffer,replay'), PlayDisplayIcon, container, buttons, model, api);
        addButton('next', cloneIcons('next'), NextDisplayIcon, container, buttons, model, api);

        this.container = container;
        this.buttons = buttons;
    }

    element() {
        return this.el;
    }
}

function addButton(name, iconElements, ButtonClass, container, buttons, model, api) {
    const buttonElement = container.querySelector(`.jw-display-icon-${name}`);
    const iconContainer = container.querySelector(`.jw-icon-${name}`);
    iconElements.forEach(icon => {
        iconContainer.appendChild(icon); 
    });
    buttons[name] = new ButtonClass(model, api, buttonElement);
}
