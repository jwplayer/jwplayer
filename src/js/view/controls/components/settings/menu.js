import CLOSE_ICON from 'assets/SVG/close.svg';
import button from 'view/controls/components/button';
import SettingsMenuTemplate from 'view/controls/templates/settings/menu';
import { createElement, emptyElement, prependChild } from 'utils/dom';

export function SettingsMenu(onVisibility, onSubmenuAdded, onMenuEmpty) {
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
    const settingsMenuElement = createElement(SettingsMenuTemplate());
    const topbarElement = settingsMenuElement.querySelector('.jw-settings-topbar');

    const closeButton = button('jw-settings-close', () => {
        instance.close();
    }, 'Close Settings', [CLOSE_ICON]);
    closeButton.show();
    topbarElement.appendChild(closeButton.element());

    const instance = {
        open() {
            visible = true;
            onVisibility(visible);
            settingsMenuElement.setAttribute('aria-expanded', 'true');
            addDocumentListeners(documentClickHandler);
        },
        close() {
            visible = false;
            onVisibility(visible);
            deactivateAllSubmenus(submenus);
            settingsMenuElement.setAttribute('aria-expanded', 'false');
            removeDocumentListeners(documentClickHandler);
        },
        toggle() {
            if (visible) {
                this.close();
            } else {
                this.open();
            }
        },
        addSubmenu(submenu) {
            if (!submenu) {
                return;
            }
            const name = submenu.name;
            submenus[name] = submenu;

            if (submenu.isDefault) {
                prependChild(topbarElement, submenu.categoryButtonElement);
            } else {
                topbarElement.insertBefore(submenu.categoryButtonElement, closeButton.element());
            }

            settingsMenuElement.appendChild(submenu.element());
            onSubmenuAdded();
        },
        getSubmenu(name) {
            return submenus[name];
        },
        removeSubmenu(name) {
            const submenu = submenus[name];
            if (!submenu) {
                return;
            }
            settingsMenuElement.removeChild(submenu.element());
            topbarElement.removeChild(submenu.categoryButtonElement);
            submenu.destroy();
            delete submenus[name];

            if (!Object.keys(submenus).length) {
                this.close();
                onMenuEmpty();
            }
        },
        activateSubmenu(name) {
            const submenu = submenus[name];
            if (!submenu || submenu.active) {
                return;
            }
            deactivateAllSubmenus(submenus);
            submenu.activate();
        },
        activateFirstSubmenu() {
            const firstSubmenuName = Object.keys(submenus)[0];
            this.activateSubmenu(firstSubmenuName);
        },
        element() {
            return settingsMenuElement;
        },
        destroy() {
            this.close();
            emptyElement(settingsMenuElement);
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
