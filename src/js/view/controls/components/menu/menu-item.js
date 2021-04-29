import UI from 'utils/ui';
import { toggleClass, createElement } from 'utils/dom';
import { itemRadioButtonTemplate, itemTemplate } from 'view/controls/templates/menu/menu-item';

export class MenuItem {
    constructor(_content, _action, _template = itemTemplate) {
        this.el = createElement(_template(_content));
        this.ui = new UI(this.el).on('click tap enter', _action, this);
    }
    destroy() {
        if (this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
        this.ui.destroy();
    }
}

export class RadioMenuItem extends MenuItem {
    constructor(_content, _action, _template = itemRadioButtonTemplate) {
        super(_content, _action, _template);
    }
    activate() {
        if (this.active) {
            return;
        }
        toggleClass(this.el, 'jw-settings-item-active', true);
        this.el.setAttribute('aria-checked', 'true');
        this.active = true;
    }
    deactivate() {
        if (!this.active) {
            return;
        }
        toggleClass(this.el, 'jw-settings-item-active', false);
        this.el.setAttribute('aria-checked', 'false');
        this.active = false;
    }
}
