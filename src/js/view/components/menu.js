define([
    'view/components/tooltip',
    'utils/helpers',
    'utils/underscore',
    'events/events',
    'utils/ui',
    'handlebars-loader!templates/menu.html'
], function(Tooltip, utils, _, events, UI, menuTemplate) {
    var Menu = Tooltip.extend({
        setup : function (list, selectedIndex, options) {
            if(!this.iconUI){
                this.iconUI = new UI(this.el);

                this.toggleValueListener= this.toggleValue.bind(this);

                this.toggleOpenStateListener = this.toggleOpenState.bind(this);
                this.openTooltipListener = this.openTooltip.bind(this);
                this.closeTooltipListener = this.closeTooltip.bind(this);

                this.selectListener = this.select.bind(this);
            }

            this.reset();

            list = _.isArray(list) ? list : [];

            utils.toggleClass(this.el, 'jw-hidden', (list.length < 2));

            if (list.length > 2 || (list.length === 2 && options && options.toggle === false)) {
                utils.removeClass(this.el, 'jw-off');

                this.iconUI.on('tap', this.toggleOpenStateListener);

                this.el.addEventListener('mouseover', this.openTooltipListener);
                this.el.addEventListener('mouseout', this.closeTooltipListener);

                var innerHtml = menuTemplate(list);
                var elem = utils.createElement(innerHtml);
                this.addContent(elem);
                this.contentUI = new UI(this.content).on('click tap', this.selectListener);
            } else if (list.length === 2) {
                this.iconUI.on('click tap', this.toggleValueListener);
            }

            this.selectItem(selectedIndex);
        },
        toggleValue: function(){
            this.trigger('toggleValue');
        },
        select: function (evt) {
            if(evt.target.parentElement === this.content) {
                var classes = evt.target.classList;
                // find the class with a name of the form 'item-1'
                var item = _.find(classes, function(c) { return c.indexOf('item') === 0;});
                this.trigger('select', parseInt(item.split('-')[1]));
                this.closeTooltipListener();
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
        },
        reset : function() {
            utils.addClass(this.el, 'jw-off');
            this.iconUI.off();
            if(this.contentUI) {
                this.contentUI.off().destroy();
            }
            this.removeContent();

            this.el.removeEventListener('mouseover', this.openTooltipListener);
            this.el.removeEventListener('mouseout', this.closeTooltipListener);
        }
    });

    return Menu;
});
