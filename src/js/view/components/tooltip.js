define([
    'utils/extendable',
    'utils/helpers'
], function(Extendable, utils) {

    var Tooltip = Extendable.extend({
        'constructor' : function(name) {
            this.el = document.createElement('div');
            this.el.className = 'jw-icon jw-icon-tooltip ' + name + ' jw-button-color jw-reset jw-hidden';
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