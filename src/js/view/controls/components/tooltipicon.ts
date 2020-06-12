import Events from 'utils/backbone.events';
import ariaLabel from 'utils/aria';
import { toggleClass } from 'utils/dom';
import svgParse from 'utils/svgParser';

export default class TooltipIcon extends Events {
    el: HTMLElement;
    tooltip: HTMLElement;
    openClass: string;
    componentType: string;
    isOpen?: boolean;
    content?: HTMLElement | null;

    constructor(name: string, ariaText: string | null, elementShown: boolean, svgIcons?: Node[]) {
        super();
        this.el = document.createElement('div');
        let className = 'jw-icon jw-icon-tooltip ' + name + ' jw-button-color jw-reset';
        if (!elementShown) {
            className += ' jw-hidden';
        }

        if (ariaText) {
            ariaLabel(this.el, ariaText);
        }

        this.el.className = className;
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'jw-overlay jw-reset';
        this.openClass = 'jw-open';
        this.componentType = 'tooltip';

        this.el.appendChild(this.tooltip);
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

    addContent(elem: HTMLElement): void {
        if (this.content) {
            this.removeContent();
        }

        this.content = elem;
        this.tooltip.appendChild(elem);
    }

    removeContent(): void {
        if (this.content) {
            this.tooltip.removeChild(this.content);
            this.content = null;
        }
    }

    hasContent(): boolean {
        return !!this.content;
    }

    element(): HTMLElement {
        return this.el;
    }

    openTooltip(evt: Event): void {
        if (!this.isOpen) {
            this.trigger('open-' + this.componentType, evt, { isOpen: true });
            this.isOpen = true;
            toggleClass(this.el, this.openClass, this.isOpen);
        }
    }

    closeTooltip(evt: Event): void {
        if (this.isOpen) {
            this.trigger('close-' + this.componentType, evt, { isOpen: false });
            this.isOpen = false;
            toggleClass(this.el, this.openClass, this.isOpen);
        }
    }

    toggleOpenState(evt: Event): void {
        if (this.isOpen) {
            this.closeTooltip(evt);
        } else {
            this.openTooltip(evt);
        }
    }
}
