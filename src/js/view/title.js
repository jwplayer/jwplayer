define([
    'utils/helpers',
    'utils/underscore'
], function(utils, _) {

    var Title = function(_model) {
        this.model = _model;
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

        setup : function(titleEl) {
            this.el = titleEl;

            // Perform the DOM search only once
            var arr = this.el.getElementsByTagName('div');
            this.title = arr[0];
            this.description = arr[1];

            this.model.on('change:playlistItem', this.updateText, this);
            this.updateText(this.model, this.model.get('playlistItem'));
        },

        updateText: function(model, playlistItem) {

            var title = playlistItem.title;
            var description = playlistItem.description || '';

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
