import SubmenuTemplate from 'view/controls/templates/settings/submenu';
import { createElement, emptyElement, toggleClass } from 'utils/dom';

export default function SettingsSubmenu(name, categoryButton, isDefault) {

    let active;
    let contentItems = [];
    const submenuElement = createElement(SubmenuTemplate(name));
    const categoryButtonElement = categoryButton.element();

    categoryButtonElement.setAttribute('name', name);
    categoryButtonElement.className += ' jw-submenu-' + name;
    categoryButton.show();

    // return focus to topbar element when tabbing after the first or last item
    const onFocus = function(evt) {
        switch (evt.keyCode) {
            case 9: // tab
                if (evt.shiftKey) {
                    categoryButtonElement.previousElementSibling.focus();
                } else {
                    categoryButtonElement.nextElementSibling.focus();
                }
                break;
            default:
                break;
        }
        evt.stopPropagation();
    };

    const instance = {
        addContent(items) {
            if (!items) {
                return;
            }
            items.forEach(item => {
                submenuElement.appendChild(item.element());
                item.element().setAttribute('tabindex', '-1');
                item.element().addEventListener('keydown', onFocus);
            });

            contentItems = items;
        },
        replaceContent(items) {
            instance.removeContent();
            this.addContent(items);
        },
        removeContent() {
            contentItems.forEach(item => {
                item.element().removeEventListener('keydown', onFocus);
            });
            emptyElement(submenuElement);
            contentItems = [];
        },
        getItems() {
            return contentItems;
        },
        activate() {
            toggleClass(submenuElement, 'jw-settings-submenu-active', true);
            submenuElement.setAttribute('aria-expanded', 'true');
            categoryButtonElement.setAttribute('aria-checked', 'true');
            active = true;
        },
        deactivate() {
            toggleClass(submenuElement, 'jw-settings-submenu-active', false);
            submenuElement.setAttribute('aria-expanded', 'false');
            categoryButtonElement.setAttribute('aria-checked', 'false');
            active = false;
        },
        activateItem(itemOrdinal = 0) {
            const item = contentItems[itemOrdinal];
            if (!item || item.active) {
                return;
            }
            deactivateAllItems(contentItems);
            item.activate();
        },
        element() {
            return submenuElement;
        },
        destroy() {
            if (!contentItems) {
                return;
            }
            contentItems.forEach(item => {
                item.destroy();
            });
            this.removeContent();
        }
    };

    Object.defineProperties(instance,
        {
            name: {
                enumerable: true,
                get: () => name
            },
            active: {
                enumerable: true,
                get: () => active
            },
            categoryButtonElement: {
                enumerable: true,
                get: () => categoryButtonElement
            },
            isDefault: {
                enumerable: true,
                get: () => isDefault
            }
        }
    );

    return instance;
}

const deactivateAllItems = (items) => {
    items.forEach(item => {
        item.deactivate();
    });
};
