define([
    'view/components/tooltip',
    'utils/helpers',
    'handlebars-loader!templates/menu.html'
], function(Tooltip, utils, menuTemplate) {

    var Menu = Tooltip.extend({
        setup : function (list, selectedIndex) {
            if(this.content){
                this.content.removeEventListener('click', this.selectListener);
                this.removeContent();
            }

            this.el.removeEventListener('click', this.toggleListener);

            utils.toggleClass(this.el, 'jw-hidden', (list.length < 2));

            if (list.length === 2) {
                this.toggleListener = this.toggle.bind(this);
                this.el.addEventListener('click', this.toggleListener);
            } else if (list.length > 2) {
                utils.removeClass(this.el, 'jw-off');

                var innerHtml = menuTemplate(list);
                var elem = utils.createElement(innerHtml);
                this.addContent(elem);

                this.selectListener = this.select.bind(this);
                this.content.addEventListener('click', this.selectListener);
            }

            this.selectItem(selectedIndex);
        },
        toggle: function(){
            this.trigger('toggle');
        },
        select: function (evt) {
            if(evt.target.parentElement === this.content) {
                this.trigger('select', parseInt(evt.target.classList[1].split('-')[1]));
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