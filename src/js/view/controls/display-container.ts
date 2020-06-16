import displayContainerTemplate from 'view/controls/templates/display-container';
import RewindDisplayIcon from 'view/controls/rewind-display-icon';
import PlayDisplayIcon from 'view/controls/play-display-icon';
import NextDisplayIcon from 'view/controls/next-display-icon';
import { cloneIcons } from 'view/controls/icons';
import { createElement } from 'utils/dom';
import type { PlayerAPI } from 'types/generic.type';
import type ViewModel from 'view/view-model';

type ButtonHolder = { 
    rewind: RewindDisplayIcon;
    display: PlayDisplayIcon;
    next: NextDisplayIcon;
};

export default class DisplayContainer {
    el: HTMLElement;
    container: Element | null;
    buttons: ButtonHolder;

    constructor(model: ViewModel, api: PlayerAPI) {
        this.el = createElement(displayContainerTemplate(model.get('localization')));

        const container = this.el.querySelector('.jw-display-controls') as HTMLElement;
        addIconsToContainer('rewind', cloneIcons('rewind'), container);
        addIconsToContainer('display', cloneIcons('play,pause,buffer,replay'), container);
        addIconsToContainer('next', cloneIcons('next'), container);

        const buttons = {
            rewind: new RewindDisplayIcon(model, api, getButtonElement('rewind', container)),
            display: new PlayDisplayIcon(model, api, getButtonElement('display', container)),
            next: new NextDisplayIcon(model, api, getButtonElement('next', container))
        };

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

function addIconsToContainer(name: string, iconElements: Node[], container: HTMLElement): void {
    const iconContainer = container.querySelector(`.jw-icon-${name}`) as HTMLElement;
    iconElements.forEach(icon => {
        iconContainer.appendChild(icon);
    });
}

function getButtonElement(name: string, container: HTMLElement): HTMLElement {
    return container.querySelector(`.jw-display-icon-${name}`) as HTMLElement;
}
