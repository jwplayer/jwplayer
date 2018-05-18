import { cloneIcon } from 'view/controls/icons';
import button from 'view/controls/components/button';
import SettingsMenuTemplate from 'view/controls/templates/settings/menu';
import { createElement, emptyElement, prependChild } from 'utils/dom';

export function SettingsMenu(onVisibility, onSubmenuAdded, onMenuEmpty) {
    const documentClickHandler = (e) => {
        // Close if anything other than the settings menu has been clicked
        // Let the display (jw-video) handles closing itself (display clicks do not pause if the menu is open)
        // Don't close if the user has dismissed the nextup tooltip via it's close button (the tooltip overlays the menu)
        if (!/jw-(settings|video|nextup-close|sharing-link)/.test(e.target.className)) {
            instance.close();
        }
    };

    let visible;
    let active = null;
    const submenus = {};

    const settingsMenuElement = createElement(SettingsMenuTemplate());

    const handleKeyDown = function(evt) {
        if (evt) {
            const { keyCode, target } = evt;

            switch (keyCode) {
                case 37: // left-arrow
                    target.previousElementSibling.focus();
                    break;
                case 38: // up-arrow
                    instance.activateSubmenu(target.getAttribute('name'), true);
                    break;
                case 39: // right-arrow
                    target.nextElementSibling.focus();
                    break;
                case 40: // down-arrow
                    instance.activateSubmenu(target.getAttribute('name'));
                    break;
                default:
                    break;
            }

            if (/13|32|37|38|39|40/.test(keyCode)) {
                // Prevent keypresses from scrolling the screen
                evt.preventDefault();
                return false;
            }
        }
    };
    settingsMenuElement.addEventListener('keydown', handleKeyDown);

    const closeButton = button('jw-settings-close', () => {
        instance.close();
    }, 'Close Settings', [cloneIcon('close')]);

    const closeOnButton = function(evt) {
        // Close settings menu when enter is pressed on the close button
        // or when tab key is pressed since it is the last element in topbar
        if (evt.keyCode === 13 || evt.keyCode === 39 || (evt.keyCode === 9 && !evt.shiftKey)) {
            instance.close(evt);
        }
    };
    closeButton.show();
    closeButton.element().addEventListener('keydown', closeOnButton);

    const topbarElement = settingsMenuElement.querySelector('.jw-settings-topbar');
    topbarElement.appendChild(closeButton.element());

    const instance = {
        open(isDefault, event) {
            visible = true;
            onVisibility(visible, event);
            settingsMenuElement.setAttribute('aria-expanded', 'true');
            document.addEventListener('click', documentClickHandler);

            if (isDefault) {
                if (event && event.type === 'enter') {
                    active.categoryButtonElement.focus();
                }
            } else {
                active.element().firstChild.focus();
            }

        },
        close(event) {
            visible = false;
            onVisibility(visible, event);

            active = null;
            deactivateAllSubmenus(submenus);

            settingsMenuElement.setAttribute('aria-expanded', 'false');
            document.removeEventListener('click', documentClickHandler);
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
                submenu.categoryButtonElement.addEventListener('keydown', function(evt) {
                    // close settings menu if you shift-tab on the first category button element
                    if (evt.keyCode === 9 && evt.shiftKey) {
                        instance.close(evt);
                    }
                });
            } else {
                // sharing should always be the last submenu
                const sharingButton = topbarElement.querySelector('.jw-submenu-sharing');
                topbarElement.insertBefore(
                    submenu.categoryButtonElement,
                    sharingButton || closeButton.element()
                );
            }

            settingsMenuElement.appendChild(submenu.element());

            onSubmenuAdded();
        },
        getSubmenu(name) {
            return submenus[name];
        },
        removeSubmenu(name) {
            const submenu = submenus[name];
            if (!submenu || submenu.element().parentNode !== settingsMenuElement) {
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
        activateSubmenu(name, focusOnLast) {
            const submenu = submenus[name];
            if (!submenu || submenu.active) {
                return;
            }

            deactivateAllSubmenus(submenus);
            submenu.activate();
            active = submenu;

            if (!submenu.isDefault && !focusOnLast) {
                active.element().firstChild.focus();
            } else if (focusOnLast) {
                // focus on last element in submenu if up arrow was pressed
                active.element().lastChild.focus();
            }
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
            settingsMenuElement.removeEventListener('keydown', handleKeyDown);
            closeButton.element().removeEventListener('keydown', closeOnButton);
            emptyElement(settingsMenuElement);
        }
    };

    Object.defineProperties(instance, {
        visible: {
            enumerable: true,
            get: () => visible
        },
    });

    return instance;
}

const deactivateAllSubmenus = (submenus) => {
    Object.keys(submenus).forEach(name => {
        submenus[name].deactivate();
    });
};
