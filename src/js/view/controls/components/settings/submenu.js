import SubmenuTemplate from 'view/controls/templates/settings/submenu';
import { createElement, emptyElement, toggleClass } from 'utils/dom';

export default function SettingsSubmenu(name) {
    let active;
    let contentItems = [];
    const submenuElement = createElement(SubmenuTemplate(name));

    const instance = {
        addContent(items) {
            if (!items) {
                return;
            }
            items.forEach(item => {
                submenuElement.appendChild(item.element());
            });
            contentItems = items;
        },
        replaceContent(items) {
            emptyElement(submenuElement);
            this.addContent(items);
        },
        removeContent() {
            emptyElement(submenuElement);
            contentItems = [];
        },
        activate() {
            toggleClass(submenuElement, 'jw-settings-submenu-active', true);
            active = true;
        },
        deactivate() {
            toggleClass(submenuElement, 'jw-settings-submenu-active', false);
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

    Object.defineProperty(instance, 'name', {
        enumerable: true,
        get: () => name
    });

    Object.defineProperty(instance, 'active', {
        enumerable: true,
        get: () => active
    });

    return instance;
}

const deactivateAllItems = (items) => {
    items.forEach(item => {
        item.deactivate();
    });
};
