import SubmenuTemplate from 'view/controls/templates/settings/submenu';
import { emptyElement, toggleClass } from 'utils/dom';

export default function SettingsSubmenu(name, categoryButton, isDefault) {

    let active;
    let contentItems = [];
    const submenuElement = SubmenuTemplate();
    const categoryButtonElement = categoryButton.element();

    categoryButtonElement.setAttribute('name', name);
    categoryButtonElement.className += ' jw-submenu-' + name;
    categoryButton.show();

    // return focus to topbar element when tabbing after the first or last item
    const onFocus = function(evt) {
        const focus =
            categoryButtonElement &&
            evt.keyCode === 9 && (
                evt.srcElement === contentItems[0].element() && evt.shiftKey ||
                evt.srcElement === contentItems[contentItems.length - 1].element() && !evt.shiftKey
            );

        if (focus) {
            categoryButtonElement.focus();
        }
    };

    const instance = {
        addContent(items) {
            if (!items) {
                return;
            }
            items.forEach(item => {
                submenuElement.appendChild(item.element());
            });

            contentItems = items;

            contentItems[0].element().addEventListener('keydown', onFocus);
            contentItems[contentItems.length - 1].element().addEventListener('keydown', onFocus);
        },
        replaceContent(items) {
            instance.removeContent();
            this.addContent(items);
        },
        removeContent() {
            if (contentItems.length) {
                contentItems[0].element().removeEventListener('keydown', onFocus);
                contentItems[contentItems.length - 1].element().removeEventListener('keydown', onFocus);

                emptyElement(submenuElement);
                contentItems.length = 0;
            }
        },
        activate() {
            if (contentItems.length === 0) {
                contentItems = this.contentItemsFactory();
                this.addContent(contentItems);
            }
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
