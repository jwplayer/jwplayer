import SubmenuTemplate from 'view/controls/templates/settings/submenu';
import { createElement, emptyElement, toggleClass } from 'utils/dom';

export default function SettingsSubmenu(name) {
    const submenuElement = createElement(SubmenuTemplate(name));
    let contentItems = [];

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
        },
        deactivate() {
            toggleClass(submenuElement, 'jw-settings-submenu-active', false);
        },
        activateItem(itemOrdinal) {
            const item = contentItems[itemOrdinal];
            deactivateAllItems(contentItems);
            item.activate();
        },
        element() {
            return submenuElement;
        }
    };

    Object.defineProperty(instance, 'name', {
        enumerable: true,
        get: () => name
    });

    return instance;
}

const deactivateAllItems = (items) => {
    items.forEach(item => {
        item.deactivate();
    });
};
