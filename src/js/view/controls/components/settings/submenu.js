import SubmenuTemplate from 'view/controls/templates/settings/submenu';
import { createElement, emptyElement, toggleClass } from 'utils/dom';

export default function SettingsSubmenu(name) {
    const submenuElement = createElement(SubmenuTemplate(name));

    const instance = {
        addContent(items) {
            if (!items) {
                return;
            }
            items.forEach(item => {
                submenuElement.appendChild(item.element());
            });
        },
        replaceContent(items) {
            emptyElement(submenuElement);
            this.addContent(items);
        },
        removeContent() {
            emptyElement(submenuElement);
        },
        activate() {
            toggleClass(submenuElement, 'jw-settings-submenu-active', true);
        },
        deactivate() {
            toggleClass(submenuElement, 'jw-settings-submenu-active', false);
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
