define([
    'utils/extendable',
    'utils/helpers'
], function(Extendable, utils) {

    var Tooltip = Extendable.extend({
        'constructor' : function(name, ariaText, ariaShown) {
            this.el = document.createElement('div');
            this.el.className = 'jw-icon jw-icon-tooltip ' + name + ' jw-button-color jw-reset jw-hidden';
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
        },

        addContent: function (elem) {
            if(this.content){
                this.removeContent();
            }

            this.content = elem;
            this.container.appendChild(elem);
        },
        removeContent: function(){
            if(this.content) {
                this.container.removeChild(this.content);
                this.content = null;
            }
        },
        hasContent: function(){
            return !!this.content;
        },
        element: function(){
            return this.el;
        },
        openTooltip: function(evt) {
            this.trigger('open-'+this.componentType, evt, {'isOpen': true});
            this.isOpen = true;
            utils.toggleClass(this.el, this.openClass, this.isOpen);
        },
        closeTooltip: function(evt) {
            this.trigger('close-'+this.componentType, evt, {'isOpen': false});
            this.isOpen = false;
            utils.toggleClass(this.el, this.openClass, this.isOpen);
        },
        toggleOpenState: function(evt){
            if(this.isOpen){
                this.closeTooltip(evt);
            } else {
                this.openTooltip(evt);
            }
        }
    });

    return Tooltip;
});