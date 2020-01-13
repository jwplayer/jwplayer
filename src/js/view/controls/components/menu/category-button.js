import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { SimpleTooltip } from 'view/controls/components/simple-tooltip';
import { createElement } from 'utils/dom';

const categoryButton = (menu) => {
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

    const menuCategoryButton = button(
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
