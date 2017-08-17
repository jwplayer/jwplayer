import CLOSE_ICON from 'assets/SVG/close.svg';
import button from 'view/controls/components/button';
import SettingsMenuTemplate from 'view/controls/templates/settings/menu';
import { createElement } from 'utils/dom';

export function SettingsMenu(visibilityChangeHandler) {
    const documentClickHandler = (e) => {
        // Close if anything other than the settings menu has been clicked
        // Let the display (jw-video) handles closing itself (display clicks do not pause if the menu is open)
        // Don't close if the user has dismissed the nextup tooltip via it's close button (the tooltip overlays the menu)
        const targetClass = e.target.className;
        if (!targetClass.match(/jw-(settings|video|nextup-close)/)) {
            instance.close();
        }
    };

    let visible;
    const submenus = {};
    const closeButton = createCloseButton();
    const settingsMenuElement = createElement(SettingsMenuTemplate());
    settingsMenuElement.querySelector('.jw-settings-topbar').appendChild(closeButton.element());

    const instance = {
        open() {
            visible = true;
            visibilityChangeHandler(visible);
            addDocumentListeners(documentClickHandler);
        },
        close() {
            visible = false;
            visibilityChangeHandler(visible);
            removeDocumentListeners(documentClickHandler);
        },
        toggle() {
            if (visible) {
                this.close();
            } else {
                this.open();
            }
        },
        addSubmenu(icon, submenu) {
            if (!submenu) {
                return;
            }

            const name = submenu.name;
            submenus[name] = submenu;
            const categoryButton = button(`jw-settings-${name}`, () => {
                deactivateAllSubmenus(submenus);
                submenu.activate();
            }, name, [icon]);
            categoryButton.show();

            settingsMenuElement
                .querySelector('.jw-settings-topbar')
                .insertBefore(categoryButton.element(), closeButton.element());
            settingsMenuElement.appendChild(submenu.element());
        },
        getSubmenu(name) {
            return submenus[name];
        },
        removeSubmenu(name) {
            submenus[name] = null;
        },
        element() {
            return settingsMenuElement;
        }
    };

    Object.defineProperty(instance, 'visible', {
        enumerable: true,
        get: () => visible
    });

    return instance;
}

const addDocumentListeners = (handler) => {
    document.addEventListener('mousedown', handler);
    document.addEventListener('pointerdown', handler);
    document.addEventListener('touchstart', handler);
};

const removeDocumentListeners = (handler) => {
    document.removeEventListener('mousedown', handler);
    document.removeEventListener('pointerdown', handler);
    document.removeEventListener('touchstart', handler);
};

const deactivateAllSubmenus = (submenus) => {
    Object.keys(submenus).forEach(name => {
        submenus[name].deactivate();
    });
};

const createCloseButton = () => {
    const closeButton = this.closeButton = button('jw-settings-close', () => {
        this.close();
    }, 'Close Settings', [CLOSE_ICON]);
    closeButton.show();

    return closeButton;
};
