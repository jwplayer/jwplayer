define([
    'view/components/tooltip',
    'utils/helpers',
    'handlebars-loader!templates/menu.html'
], function(Tooltip, utils, menuTemplate) {

    var Menu = Tooltip.extend({
        setup : function (list) {
            if(this.content){
                this.content.removeEventListener('click');
                this.container.removeChild(this.content);
            }

            var innerHtml = menuTemplate(list);

            var elem = utils.createElement(innerHtml);

            elem.addEventListener('click', function (evt) {
                //var whichChild = '';
                if(evt.target.parentElement === this.content) {
                    this.trigger('select', parseInt(evt.target.classList[1].split('-')[1]));
                }
            }.bind(this));

            this.addContent(elem);
        }
    });

    return Menu;
});