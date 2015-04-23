define([
    'utils/backbone.events',
    'utils/underscore'
], function(Events, _) {
    function Tooltip (name) {
        this.el = document.createElement('span');
        this.el.className = name + ' jw-icon-tooltip';
        this.container = document.createElement('div');
        this.container.className ='jw-overlay';
        this.el.appendChild(this.container);
    }

    Tooltip.prototype = {
        addContent: function (elem) {
            this.content = elem;
            this.container.appendChild(elem);
        },
        extend: function (newStuff) {
            var tt = Tooltip;

            if(newStuff){
                tt = newStuff.prototype = Tooltip.prototype;
            }

            return tt;
        },
        element: function(){
            return this.el;
        }
    };

    _.extend(Tooltip.prototype, Events);

    return Tooltip;
});