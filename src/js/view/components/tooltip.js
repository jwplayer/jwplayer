define([
    'view/components/extendable',
    'utils/underscore'
], function(Extendable, _) {

    var Tooltip = Extendable.extend({
        'constructor' : function(name) {
            this.el = document.createElement('span');
            this.el.className = name + ' jw-icon-tooltip';
            this.container = document.createElement('div');
            this.container.className ='jw-overlay';
            this.el.appendChild(this.container);
        },
        addContent: function (elem) {
            this.content = elem;
            this.container.appendChild(elem);
        },

        element: function(){
            return this.el;
        }
    });

    return Tooltip;
});