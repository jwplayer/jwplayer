import { cloneIcon } from 'view/controls/icons';
import button from 'view/controls/components/button';
import SettingsMenuTemplate from 'view/controls/templates/settings/menu';
import { createElement, emptyElement, prependChild, nextSibling, previousSibling } from 'utils/dom';

function focusSettingsElement(direction) {
    const settingsIcon = document.getElementsByClassName('jw-icon-settings')[0];

    if (settingsIcon) {
        const element = direction === 'Right' ? nextSibling(settingsIcon) : previousSibling(settingsIcon);

        if (element) {
            element.focus();
        }
    }
}

export function SettingsMenu(onVisibility, onSubmenuAdded, onMenuEmpty, localzation) {
    const documentClickHandler = (e) => {
        // Close if anything other than the settings menu has been clicked
        // Let the display (jw-video) handles closing itself (display clicks do not pause if the menu is open)
        // Don't close if the user has dismissed the nextup tooltip via it's close button (the tooltip overlays the menu)
        if (!/jw-(settings|video|nextup-close|sharing-link|share-item)/.test(e.target.className)) {
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
        const key = evt.key.replace(/(Arrow|ape)/, '');

        switch (key) {
            case 'Esc':
                instance.close();
                break;
            case 'Left':
                if (prev) {
                    prev.focus();
                } else {
                    instance.close();
                    focusSettingsElement(evt.key);
                }
                break;
            case 'Right':
                if (next && closeButton.element() && target !== closeButton.element()) {
                    next.focus();
                }
                break;
            case 'Up':
            case 'Down':
                instance.activateSubmenu(target.getAttribute('name'), key === 'Up');
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
    }, localzation.close, [cloneIcon('close')]);

    const closeOnButton = function(evt) {
        const key = evt.key.replace(/(Arrow|ape)/, '');
        // Close settings menu when enter is pressed on the close button
        // or when tab or right arrow key is pressed since it is the last element in topbar
        if (key === 'Enter' || key === 'Right' || (key === 'Tab' && !evt.shiftKey)) {
            instance.close(evt);
        }

        if (key === 'Right') {
            focusSettingsElement(evt.key);
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

            // menu icon should be in focus on enter, but we should focus on the first item within the menu if the interaction is with the up/down arrow
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
            if (submenu) {
                if (!submenu.active) {
                    deactivateAllSubmenus(submenus);
                    submenu.activate();
                    active = submenu;
                }

                if (focusOnLast) {
                    submenu.element().lastChild.focus();
                } else {
                    submenu.element().firstChild.focus();
                }
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
