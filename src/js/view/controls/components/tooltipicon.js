import Events from 'utils/backbone.events';
import ariaLabel from 'utils/aria';
import { toggleClass } from 'utils/dom';
import svgParse from 'utils/svgParser';

export default class TooltipIcon {
    constructor(name, ariaText, elementShown, svgIcons, container) {
        Object.assign(this, Events);
        this.el = document.createElement('div');
        let className = 'jw-icon jw-icon-tooltip ' + name + ' jw-button-color jw-reset';
        if (!elementShown) {
            className += ' jw-hidden';
        }

        ariaLabel(this.el, ariaText);

        this.el.className = className;
        this.openClass = 'jw-open';
        this.componentType = 'tooltip';

        if (!container) {
            container = document.createElement('div');
            container.className = 'jw-overlay jw-reset';
            this.el.appendChild(container);
        }
        this.tooltip = container;
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
        this.tooltip.appendChild(elem);
    }

    removeContent() {
        if (this.content) {
            this.tooltip.removeChild(this.content);
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
            toggleClass(this.tooltip, this.openClass, this.isOpen);
        }
    }

    closeTooltip(evt) {
        if (this.isOpen) {
            this.trigger('close-' + this.componentType, evt, { isOpen: false });
            this.isOpen = false;
            toggleClass(this.el, this.openClass, this.isOpen);
            toggleClass(this.tooltip, this.openClass, this.isOpen);
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
