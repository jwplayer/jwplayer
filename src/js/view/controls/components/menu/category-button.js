import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { SimpleTooltip } from 'view/controls/components/simple-tooltip';
import { createElement } from 'utils/dom';

const categoryButton = (menu, localizedName) => {
    const name = menu.name;
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
        name, 
        [(menu.icon && createElement(menu.icon)) || cloneIcon(icon)]
    );

    const buttonElement = menuCategoryButton.element();
    buttonElement.setAttribute('role', 'menuitemradio');
    buttonElement.setAttribute('aria-checked', 'false');
    buttonElement.setAttribute('aria-label', localizedName);
    if (!('ontouchstart' in window)) {
        menuCategoryButton.tooltip = SimpleTooltip(buttonElement, name, localizedName);
    }
    return menuCategoryButton;
};

export default categoryButton;
