import displayContainerTemplate from 'view/controls/templates/display-container';
import RewindDisplayIcon from 'view/controls/rewind-display-icon';
import PlayDisplayIcon from 'view/controls/play-display-icon';
import NextDisplayIcon from 'view/controls/next-display-icon';
import utils from 'utils/helpers';

export default class DisplayContainer {
    constructor(model, api) {
        this.el = utils.createElement(displayContainerTemplate(model.get('localization')));

        const container = this.el.querySelector('.jw-display-controls');
        const buttons = {};

        addButton('rewind', RewindDisplayIcon, container, buttons, model, api);
        addButton('display', PlayDisplayIcon, container, buttons, model, api);
        addButton('next', NextDisplayIcon, container, buttons, model, api);

        this.container = container;
        this.buttons = buttons;
    }

    element() {
        return this.el;
    }
}

function addButton(name, ButtonClass, container, buttons, model, api) {
    const buttonElement = container.querySelector(`.jw-display-icon-${name}`);
    buttons[name] = new ButtonClass(model, api, buttonElement);
}
