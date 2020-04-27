import displayContainerTemplate from 'view/controls/templates/display-container';
import RewindDisplayIcon from 'view/controls/rewind-display-icon';
import PlayDisplayIcon from 'view/controls/play-display-icon';
import NextDisplayIcon from 'view/controls/next-display-icon';
import { cloneIcons } from 'view/controls/icons';
import { createElement } from 'utils/dom';
import type { PlayerAPI } from 'types/generic.type';
import type { Button } from './components/button';
import type ViewModel from 'view/view-model';

type Constructor<T extends {}> = new (...args: any[]) => T;
type ButtonHolder = { [key: string]: Button | NextDisplayIcon };

export default class DisplayContainer {
    el: HTMLElement;
    container: Element | null;
    buttons: ButtonHolder;

    constructor(model: ViewModel, api: PlayerAPI) {
        this.el = createElement(displayContainerTemplate(model.get('localization')));

        const container = this.el.querySelector('.jw-display-controls') as HTMLElement;
        const buttons = {};

        addButton('rewind', cloneIcons('rewind'), RewindDisplayIcon, container, buttons, model, api);
        addButton('display', cloneIcons('play,pause,buffer,replay'), PlayDisplayIcon, container, buttons, model, api);
        addButton('next', cloneIcons('next'), NextDisplayIcon, container, buttons, model, api);

        this.container = container;
        this.buttons = buttons;
    }

    element(): HTMLElement {
        return this.el;
    }

    destroy(): void {
        const buttons = this.buttons;
        Object.keys(buttons).forEach(name => {
            if (buttons[name].ui) {
                buttons[name].ui.destroy();
            }
        });
    }
}

function addButton(
    name: string,
    iconElements: Node[],
    ButtonClass: Constructor<Button> | Constructor<NextDisplayIcon>,
    container: HTMLElement,
    buttons: ButtonHolder,
    model: ViewModel,
    api: PlayerAPI
): void {
    const buttonElement = container.querySelector(`.jw-display-icon-${name}`);
    const iconContainer = container.querySelector(`.jw-icon-${name}`) as HTMLElement;
    iconElements.forEach(icon => {
        iconContainer.appendChild(icon);
    });
    buttons[name] = new ButtonClass(model, api, buttonElement);
}
