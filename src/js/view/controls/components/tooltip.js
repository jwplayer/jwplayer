define([
    'utils/backbone.events',
    'utils/aria',
    'utils/helpers',
    'utils/underscore',
], function(Events, ariaLabel, utils, _) {

    return class Tooltip {
        constructor(name, ariaText, elementShown) {
            _.extend(this, Events);
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
