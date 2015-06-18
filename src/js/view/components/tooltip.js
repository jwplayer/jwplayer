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
        element: function(){
            return this.el;
        },
        openTooltip: function() {
            this.isOpen = true;
            utils.toggleClass(this.el, 'jw-open', this.isOpen);
        },
        closeTooltip: function() {
            this.isOpen = false;
            utils.toggleClass(this.el, 'jw-open', this.isOpen);
        },
        toggleOpenState: function(){
            this.isOpen = !this.isOpen;
            utils.toggleClass(this.el, 'jw-open', this.isOpen);
        }
    });

    return Tooltip;
});