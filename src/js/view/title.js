define([
    'utils/helpers',
    'handlebars-loader!templates/title.html',
    'underscore'
], function(utils, titleTemplate, _) {

    var Title = function(_model) {
        this.model = _model;

        this.el = utils.createElement(titleTemplate());

        // Perform the DOM search only once
        var arr = this.el.getElementsByTagName('div');
        this.title = arr[0];
        this.description = arr[1];

        this.model.on('change:item', this.updateText, this);
        this.updateText(this.model, 0);
    };

    _.extend(Title.prototype, {
        // This is normally shown/hidden by states
        //   these are only used for when no title exists
        hide : function() {
            this.el.style.display = 'none';
        },
        show : function() {
            this.el.style.display = '';
        },

        updateText: function(model, index) {
            var item = model.get('playlist')[index];

            var title = item.title;
            var description = item.description || '';

            if (title) {
                this.show();
                this.title.innerHTML = title;
                this.description.innerHTML = description;
            } else {
                this.hide();
            }
        },

        element: function(){
            return this.el;
        }
    });

    return Title;
});
