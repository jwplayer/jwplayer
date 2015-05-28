define([
    'view/components/extendable',
    'utils/helpers'
], function(Extendable, utils) {

    var Tooltip = Extendable.extend({
        'constructor' : function(name) {
            this.el = document.createElement('span');
            this.el.className = 'jw-icon jw-icon-tooltip ' + name + ' jw-hidden';
            this.container = document.createElement('div');
            this.container.className ='jw-overlay';
            this.el.appendChild(this.container);
        },

        addContent: function (elem) {
            this.content = elem;
            this.container.appendChild(elem);
        },
        removeContent: function(){
            this.container.removeChild(this.content);
            this.content = null;
        },
        element: function(){
            return this.el;
        },
        toggleOpen: function(toOpen) {
            if( typeof toOpen === 'undefined') {
                utils.toggleClass(this.el, 'jw-open');
            } else {
                utils.toggleClass(this.el, 'jw-open', toOpen);
            }
        }
    });

    return Tooltip;
});