import ContentItemTemplate from 'view/controls/templates/settings/content-item';
import { createElement, toggleClass } from 'utils/dom';
import UI from 'utils/ui';

export default function SettingsContentItem(name, content, action) {
    let active;
    const contentItemElement = createElement(ContentItemTemplate(content));
    const contentItemUI = new UI(contentItemElement).on('click tap enter', (evt) => {
        action(evt);
    });

    const instance = {
        activate() {
            toggleClass(contentItemElement, 'jw-settings-item-active', true);
            contentItemElement.setAttribute('aria-checked', 'true');
            active = true;
        },
        deactivate() {
            toggleClass(contentItemElement, 'jw-settings-item-active', false);
            contentItemElement.setAttribute('aria-checked', 'false');
            active = false;
        },
        element() {
            return contentItemElement;
        },
        uiElement() {
            return contentItemUI;
        },
        destroy() {
            this.deactivate();
            contentItemUI.destroy();
        }
    };

    Object.defineProperty(instance, 'active', {
        enumerable: true,
        get: () => active
    });

    return instance;
}
