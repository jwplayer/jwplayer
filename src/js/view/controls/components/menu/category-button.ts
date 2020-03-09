import button, { Button } from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { SimpleTooltip } from 'view/controls/components/simple-tooltip';
import { createElement } from 'utils/dom';
import { Tooltip, Menu } from 'types/generic.type';

type CategoryButton = Button & {
    tooltip?: Tooltip;
};

const categoryButton: (menu: Menu) => CategoryButton | undefined = (menu) => {
    const { name, title } = menu;
    const icons = {
        captions: 'cc-off',
        audioTracks: 'audio-tracks',
        quality: 'quality-100',
        playbackRates: 'playback-rate',
    };

    let icon = icons[name];
    if (!icon && !menu.icon) {
        return;
    }

    const menuCategoryButton: CategoryButton = button(
        `jw-settings-${name} jw-submenu-${name}`, 
        (event) => {
            menu.open(event);
        }, 
        title, 
        [(menu.icon && createElement(menu.icon)) || cloneIcon(icon)]
    );

    const buttonElement = menuCategoryButton.element();
    buttonElement.setAttribute('name', name);
    buttonElement.setAttribute('role', 'menuitemradio');
    buttonElement.setAttribute('aria-expanded', 'false');
    buttonElement.setAttribute('aria-haspopup', 'true');
    buttonElement.setAttribute('aria-controls', menu.el.id);

    if (!('ontouchstart' in window)) {
        menuCategoryButton.tooltip = SimpleTooltip(buttonElement, name, title);
    }

    menuCategoryButton.ui.directSelect = true;
    return menuCategoryButton;
};

export default categoryButton;
