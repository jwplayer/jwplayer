import ContentItemTemplate from 'view/controls/templates/settings/content-item';
import { createElement, toggleClass } from 'utils/dom';
import UI from 'utils/ui';

export default function SettingsContentItem(name, content, action) {
    let active;
    const contentItemElement = createElement(ContentItemTemplate(content));
    const contentItemUI = new UI(contentItemElement);
    contentItemUI.on('click tap', () => {
        action();
        instance.activate();
    });

    const instance = {
        activate() {
            toggleClass(contentItemElement, 'jw-settings-item-active', true);
            active = true;
        },
        deactivate() {
            toggleClass(contentItemElement, 'jw-settings-item-active', false);
            active = false;
        },
        element() {
            return contentItemElement;
        },
        destroy() {
            contentItemUI.destroy();
        }
    };

    Object.defineProperty(instance, 'active', {
        enumerable: true,
        get: () => active
    });

    return instance;
}
