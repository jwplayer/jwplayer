define([
    'utils/helpers',
    'utils/underscore',
    'view/components/tooltip',
    'events/events',
    'utils/ui',
    'handlebars-loader!templates/playlist.html'
], function(utils, _, Tooltip, events, UI, PlaylistTemplate) {

    var Playlist = Tooltip.extend({
        'constructor' : function(name) {
            Tooltip.call(this, name);
            this.toggleOpenListener = this.toggleOpen.bind(this);
            this.iconUI = new UI(this.el).on(events.touchEvents.TAP, this.toggleOpenListener);

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

            utils.toggleClass(this.el, 'jw-hidden', (list.length < 2));

            if (list.length >= 2) {
                utils.removeClass(this.el, 'jw-off');

                var innerHtml = this.menuTemplate(list, selectedIndex);
                var elem = utils.createElement(innerHtml);
                this.addContent(elem);
                this.contentUI = new UI(this.content);

                this.selectListener = this.onSelect.bind(this);
                this.contentUI.on(events.touchEvents.CLICK, this.selectListener)
                    .on(events.touchEvents.TAP, this.selectListener);
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

        toggle: function(){
            this.trigger('toggle');
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

            this.toggleOpen(false);
        },

        selectItem : function(item) {
            this.setup(this.originalList, item);
        }
    });

    return Playlist;
});
