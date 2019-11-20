import UI from 'utils/ui';
import { toggleClass, createElement } from 'utils/dom';
import { itemRadioButtonTemplate } from 'view/controls/templates/menu/menu-item';

export class MenuItem {
    constructor(_content, _action, _template = itemRadioButtonTemplate) {
        this.el = createElement(_template(_content));
        this.onClick = this.onClick.bind(this);
        this.ui = new UI(this.el).on('click tap enter', (evt) => {
            this.onClick(evt, _action);
        });
    }
    onClick(evt, action) {
        action(evt);
    }
    destroy() {
        this.deactivate();
        this.ui.destroy();
    }
}

export class RadioMenuItem extends MenuItem {
    activate() {
        toggleClass(this.el, 'jw-settings-item-active', true);
        this.el.setAttribute('aria-checked', 'true');
        this.active = true;
    }
    deactivate() {
        toggleClass(this.el, 'jw-settings-item-active', false);
        this.el.setAttribute('aria-checked', 'false');
        this.active = false;
    }
}