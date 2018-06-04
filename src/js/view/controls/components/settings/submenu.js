import SubmenuTemplate from 'view/controls/templates/settings/submenu';
import { createElement, emptyElement, toggleClass, nextSibling, previousSibling } from 'utils/dom';

export default function SettingsSubmenu(name, categoryButton, isDefault) {

    let active;
    let contentItems = [];
    const submenuElement = createElement(SubmenuTemplate(name));
    const categoryButtonElement = categoryButton.element();

    categoryButtonElement.setAttribute('name', name);
    categoryButtonElement.className += ' jw-submenu-' + name;
    categoryButton.show();

    // focus on next or previous element if it exists
    // if not, focus on last or first element in content items based on index given
    const focusElement = function(ele, index) {
        if (ele) {
            ele.focus();
        } else if (index !== undefined) {
            contentItems[index].element().focus();
        }
    };

    const onFocus = function(evt) {
        const nextItem = nextSibling(categoryButtonElement);
        const prevItem = previousSibling(categoryButtonElement);
        const nextSubItem = nextSibling(evt.target);
        const prevSubItem = previousSibling(evt.target);
        const key = evt.key.replace(/(Arrow|ape)/, '');

        switch (key) {
            case 'Tab':
                focusElement(evt.shiftKey ? prevItem : nextItem);
                break;
            case 'Left':
                focusElement(prevItem || previousSibling(document.getElementsByClassName('jw-icon-settings')[0]));
                break;
            case 'Up':
                focusElement(prevSubItem, contentItems.length - 1);
                break;
            case 'Right':
                focusElement(nextItem);
                break;
            case 'Down':
                focusElement(nextSubItem, 0);
                break;
            default:
                break;
        }
        evt.preventDefault();
        if (key !== 'Esc') {
            // only bubble event if esc key was pressed
            evt.stopPropagation();
        }
        
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
        activateItem(itemOrdinal) {
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
