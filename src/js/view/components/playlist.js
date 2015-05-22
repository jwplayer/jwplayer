define([
    'utils/helpers',
    'utils/underscore',
    'view/components/tooltip',
    'handlebars-loader!templates/playlist.html'
], function(utils, _, Tooltip, PlaylistTemplate) {

    var Playlist = Tooltip.extend({
        getList : function() {
            return this.content.getElementsByClassName('jw-playlist')[0].children;
        },

        setup : function (list, selectedIndex) {
            if(this.content){
                this.content.removeEventListener('click', this.selectListener);
                this.removeContent();
            }

            list = _.isArray(list) ? list : [];

            this.el.removeEventListener('click', this.toggleListener);

            utils.toggleClass(this.el, 'jw-hidden', (list.length < 2));

            if (list.length > 2) {
                utils.removeClass(this.el, 'jw-off');

                var innerHtml = this.menuTemplate(list, selectedIndex);
                var elem = utils.createElement(innerHtml);
                this.addContent(elem);

                this.selectListener = this.onSelect.bind(this);
                this.content.addEventListener('click', this.selectListener);
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
        },

        selectItem : function(item) {
            this.setup(this.originalList, item);
        }
        /*
        selectItem : function(selectedIndex) {
            if(this.content){
                var list = this.getList();
                for(var i=0; i<list.length; i++ ){
                    utils.toggleClass(list[i], 'jw-active-option', (selectedIndex === i));
                }
            } else {
                utils.toggleClass(this.el, 'jw-off', (selectedIndex === 0));
            }
        }
        */
    });

    return Playlist;
});
