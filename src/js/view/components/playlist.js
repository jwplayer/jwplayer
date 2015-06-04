define([
    'utils/helpers',
    'utils/underscore',
    'view/components/tooltip',
    'utils/ui',
    'handlebars-loader!templates/playlist.html'
], function(utils, _, Tooltip, UI, PlaylistTemplate) {

    var Playlist = Tooltip.extend({
        setup : function (list, selectedIndex) {
            if(!this.iconUI){
                this.iconUI = new UI(this.el);

                this.toggleOpenStateListener = this.toggleOpenState.bind(this);
                this.openTooltipListener = this.openTooltip.bind(this);
                this.closeTooltipListener = this.closeTooltip.bind(this);

                this.selectListener = this.onSelect.bind(this);
            }

            this.reset();

            list = _.isArray(list) ? list : [];

            utils.toggleClass(this.el, 'jw-hidden', (list.length < 2));

            if (list.length >= 2) {
                utils.removeClass(this.el, 'jw-off');

                this.iconUI = new UI(this.el).on('tap', this.toggleOpenStateListener);

                this.el.addEventListener('mouseover', this.openTooltipListener);
                this.el.addEventListener('mouseout', this.closeTooltipListener);

                var innerHtml = this.menuTemplate(list, selectedIndex);
                var elem = utils.createElement(innerHtml);
                this.addContent(elem);
                this.contentUI = new UI(this.content);

                this.contentUI.on('click tap', this.selectListener);
            }

            this.originalList = list;
        },

        menuTemplate : function(list, selectedIndex) {
            var newList = _.map(list, function(item, idx) {
                return {
                    active : (idx === selectedIndex),
                    label : (idx+1)+ '.',
                    title : item.title
                };
            });
            return PlaylistTemplate(newList);
        },

        onSelect: function(evt) {
            var elem = evt.target;
            if(elem.tagName !== 'UL') {
                // some menus have an extra level of nesting, this normalizes that
                elem = elem.parentElement;
            }

            var classes = elem.classList;
            // find the class with a name of the form 'item-1'
            var item = _.find(classes, function(c) { return c.indexOf('item') === 0;});
            if (item) {
                this.trigger('select', parseInt(item.split('-')[1]));
            }

            this.closeTooltip();
        },

        selectItem : function(item) {
            this.setup(this.originalList, item);
        },

        reset : function() {
            this.iconUI.off();
            if(this.contentUI){
                this.contentUI.off().destroy();
            }
            this.el.removeEventListener('mouseover', this.openTooltipListener);
            this.el.removeEventListener('mouseout', this.closeTooltipListener);
            this.removeContent();
        }
    });

    return Playlist;
});
