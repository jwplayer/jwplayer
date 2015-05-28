define([
    'view/components/tooltip',
    'utils/helpers',
    'utils/underscore',
    'events/events',
    'utils/ui',
    'handlebars-loader!templates/menu.html'
], function(Tooltip, utils, _, events, UI, menuTemplate) {

    var Menu = Tooltip.extend({
        'constructor' : function(name) {
            Tooltip.call(this, name);
            this.iconUI = new UI(this.el).on(events.touchEvents.TAP, utils.noop);
            this.toggleListener = this.toggle.bind(this);
            this.toggleOpenListener = this.toggleOpen.bind(this);

            this.el.addEventListener('mouseover', this.toggleOpen.bind(this, true));
            this.el.addEventListener('mouseout', this.toggleOpen.bind(this, false));
        },
        setup : function (list, selectedIndex) {
            if(this.content){
                this.contentUI.off(events.touchEvents.CLICK)
                    .off(events.touchEvents.TAP);
                this.removeContent();
            }

            list = _.isArray(list) ? list : [];

            this.iconUI.off(events.touchEvents.CLICK)
                .off(events.touchEvents.TAP);

            utils.toggleClass(this.el, 'jw-hidden', (list.length < 2));

            if (list.length === 2) {
                this.iconUI.on(events.touchEvents.CLICK, this.toggleListener)
                    .on(events.touchEvents.TAP, this.toggleListener);
            } else if (list.length > 2) {
                utils.removeClass(this.el, 'jw-off');

                this.iconUI.on(events.touchEvents.TAP, this.toggleOpenListener);

                var innerHtml = menuTemplate(list);
                var elem = utils.createElement(innerHtml);
                this.addContent(elem);
                this.contentUI = new UI(this.content);

                this.selectListener = this.select.bind(this);
                this.contentUI.on(events.touchEvents.CLICK, this.selectListener)
                    .on(events.touchEvents.TAP, this.selectListener);
            }

            this.selectItem(selectedIndex);
        },
        toggle: function(){
            this.trigger('toggle');
        },
        select: function (evt) {
            if(evt.target.parentElement === this.content) {
                var classes = evt.target.classList;
                // find the class with a name of the form 'item-1'
                var item = _.find(classes, function(c) { return c.indexOf('item') === 0;});
                this.trigger('select', parseInt(item.split('-')[1]));
                this.toggleOpen(false);
            }
        },
        selectItem : function(selectedIndex) {
            if(this.content){
                for(var i=0; i<this.content.children.length; i++ ){
                    utils.toggleClass(this.content.children[i], 'jw-active-option', (selectedIndex === i));
                }
            } else {
                utils.toggleClass(this.el, 'jw-off', (selectedIndex === 0));
            }
        }
    });

    return Menu;
});