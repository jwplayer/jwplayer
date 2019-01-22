import Events from 'utils/backbone.events';
import ariaLabel from 'utils/aria';
import { toggleClass } from 'utils/dom';
import svgParse from 'utils/svgParser';

export default class Tooltip {
    constructor(name, ariaText, elementShown, svgIcons) {
        Object.assign(this, Events);
        this.el = document.createElement('div');
        let className = 'jw-icon jw-icon-tooltip ' + name + ' jw-button-color jw-reset';
        if (!elementShown) {
            className += ' jw-hidden';
        }

        ariaLabel(this.el, ariaText);

        this.el.className = className;
        this.container = document.createElement('div');
        this.container.className = 'jw-overlay jw-reset';
        this.openClass = 'jw-open';
        this.componentType = 'tooltip';

        this.el.appendChild(this.container);
        if (svgIcons && svgIcons.length > 0) {
            Array.prototype.forEach.call(svgIcons, svgIcon => {
                if (typeof svgIcon === 'string') {
                    this.el.appendChild(svgParse(svgIcon));
                } else {
                    this.el.appendChild(svgIcon);
                }
            });
        }
    }

    addContent(elem) {
        if (this.content) {
            this.removeContent();
        }

        this.content = elem;
        this.container.appendChild(elem);
    }

    removeContent() {
        if (this.content) {
            this.container.removeChild(this.content);
            this.content = null;
        }
    }

    hasContent() {
        return !!this.content;
    }

    element() {
        return this.el;
    }

    openTooltip(evt) {
        if (!this.isOpen) {
            this.trigger('open-' + this.componentType, evt, { isOpen: true });
            this.isOpen = true;
            toggleClass(this.el, this.openClass, this.isOpen);
        }
    }

    closeTooltip(evt) {
        if (this.isOpen) {
            this.trigger('close-' + this.componentType, evt, { isOpen: false });
            this.isOpen = false;
            toggleClass(this.el, this.openClass, this.isOpen);
        }
    }

    toggleOpenState(evt) {
        if (this.isOpen) {
            this.closeTooltip(evt);
        } else {
            this.openTooltip(evt);
        }
    }
}
