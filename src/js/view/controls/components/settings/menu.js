import { cloneIcon } from 'view/controls/icons';
import button from 'view/controls/components/button';
import SettingsMenuTemplate from 'view/controls/templates/settings/menu';
import { createElement, emptyElement, prependChild, nextSibling, previousSibling } from 'utils/dom';

function focusSettingsElement(keyCode) {
    const settingsIcon = document.getElementsByClassName('jw-icon-settings')[0];

    if (settingsIcon) {
        const element = keyCode === 39 ? nextSibling(settingsIcon) : previousSibling(settingsIcon);
        if (element) {
            element.focus();
        }
    }
}

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
        const { target } = evt;
        const next = nextSibling(target);
        const prev = previousSibling(target);

        switch (evt.keyCode) {
            case 27: // Esc
                instance.close();
                break;
            case 37: // left-arrow
                if (prev) {
                    prev.focus();
                } else {
                    instance.close();
                    focusSettingsElement(evt.keyCode);
                }
                break;
            case 39: // right-arrow
                if (next && closeButton.element() && target !== closeButton.element()) {
                    next.focus();
                }
                break;
            case 38: // up-arrow
            case 40: // down-arrow
                instance.activateSubmenu(target.getAttribute('name'), evt.keyCode === 38);
                break;
            default:
                break;
        }
        evt.stopPropagation();
        if (/13|32|37|38|39|40/.test(evt.keyCode)) {
            // Prevent keypresses from scrolling the screen
            evt.preventDefault();
            return false;
        }
    };
    settingsMenuElement.addEventListener('keydown', handleKeyDown);

    const closeButton = button('jw-settings-close', () => {
        instance.close();
    }, 'Close Settings', [cloneIcon('close')]);

    const closeOnButton = function(evt) {
        const { keyCode } = evt;
        // Close settings menu when enter is pressed on the close button
        // or when tab or right arrow key is pressed since it is the last element in topbar
        if (keyCode === 13 || keyCode === 39 || (keyCode === 9 && !evt.shiftKey)) {
            instance.close(evt);
        }

        if (keyCode === 39) {
            focusSettingsElement(keyCode);
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

            if (isDefault && event && event.type === 'enter') {
                active.categoryButtonElement.focus();
                return;
            }

            active.element().firstChild.focus();
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
