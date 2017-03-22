define([
    'utils/backbone.events',
    'utils/helpers',
    'utils/underscore',
], function(Events, utils, _) {

    return class Tooltip {
        
        constructor(name, ariaText, ariaShown, elementShown) {
            _.extend(this, Events);
            this.el = document.createElement('div');
            let className = 'jw-icon jw-icon-tooltip ' + name + ' jw-button-color jw-reset';
            if (!elementShown) {
                className += ' jw-hidden';
            }
            this.el.className = className;
            if (ariaText) {
                this.el.setAttribute('tabindex', '0');
                this.el.setAttribute('role', 'button');
                this.el.setAttribute('aria-label', ariaText);
            }
            if (ariaShown === true) {
                // Avoiding to hide the tooltip if requested
                // e.g. The volume tooltip overlay don't work
                // with the keyboard but can still mute/unmute
                this.el.setAttribute('aria-hidden', 'false');
            } else {
                // Tooltip only works on :hover :^(
                // It is not working using the keyboard
                // Hiding it for ARIA while not supported
                this.el.setAttribute('aria-hidden', 'true');
            }
            this.container = document.createElement('div');
            this.container.className = 'jw-overlay jw-reset';
            this.openClass = 'jw-open';
            this.componentType = 'tooltip';

            this.el.appendChild(this.container);
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
            this.trigger('open-' + this.componentType, evt, { isOpen: true });
            this.isOpen = true;
            utils.toggleClass(this.el, this.openClass, this.isOpen);
        }

        closeTooltip(evt) {
            this.trigger('close-' + this.componentType, evt, { isOpen: false });
            this.isOpen = false;
            utils.toggleClass(this.el, this.openClass, this.isOpen);
        }

        toggleOpenState(evt) {
            if (this.isOpen) {
                this.closeTooltip(evt);
            } else {
                this.openTooltip(evt);
            }
        }
    };
});
