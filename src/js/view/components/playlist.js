define([
    'utils/helpers',
    'utils/underscore',
    'view/components/tooltip',
    'utils/ui',
    'templates/playlist.html'
], function(utils, _, Tooltip, UI, PlaylistTemplate) {

    var Playlist = Tooltip.extend({
        setup : function (list, selectedIndex) {
            if(!this.iconUI){
                this.iconUI = new UI(this.el, {'useHover': true});

                this.toggleOpenStateListener = this.toggleOpenState.bind(this);
                this.openTooltipListener = this.openTooltip.bind(this);
                this.closeTooltipListener = this.closeTooltip.bind(this);

                this.selectListener = this.onSelect.bind(this);
            }

            this.reset();

            list = _.isArray(list) ? list : [];

            utils.toggleClass(this.el, 'jw-hidden', (list.length < 2));

            if (list.length >= 2) {
                this.iconUI = new UI(this.el, {'useHover': true})
                    .on('tap', this.toggleOpenStateListener)
                    .on('over', this.openTooltipListener)
                    .on('out', this.closeTooltipListener);

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
                var title = item.title ? utils.createElement(item.title).textContent : '';
                return {
                    active : (idx === selectedIndex),
                    label : (idx+1)+ '.',
                    title : title
                };
            });
            return PlaylistTemplate(newList);
        },

        onSelect: function(evt) {
            var elem = evt.target;
            if(elem.tagName === 'UL'){
                // skip if the target is not a menu option
                return;
            } else if(elem.tagName !== 'LI') {
                // some menus have an extra level of nesting, this normalizes that
                elem = elem.parentElement;
            }

            var classes = utils.classList(elem);
            // find the class with a name of the form 'jw-item-1'
            var item = _.find(classes, function(c) { return c.indexOf('jw-item') === 0;});
            if (item) {
                this.trigger('select', parseInt(item.split('-')[2]));
                // Only close the tooltip if we are selecting an options
                this.closeTooltip();
            }
        },

        selectItem : function(item) {
            this.setup(this.originalList, item);
        },

        reset : function() {
            this.iconUI.off();
            if(this.contentUI){
                this.contentUI.off().destroy();
            }
            this.removeContent();
        }
    });

    return Playlist;
});
