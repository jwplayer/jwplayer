define([
    'utils/underscore'
], function(_) {

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

            this.model.on('change:playlistItem', this.playlistItem, this);
            this.playlistItem(this.model, this.model.get('playlistItem'));
        },

        playlistItem : function(model, item) {
            if (model.get('displaytitle') || model.get('displaydescription')) {
                var title = '';
                var description = '';

                if (item.title && model.get('displaytitle')) {
                    title = item.title;
                }
                if (item.description && model.get('displaydescription')) {
                    description = item.description;
                }

                this.updateText(title, description);
            } else {
                this.hide();
            }
        },

        updateText: function(title, description) {
            this.title.innerHTML = title;
            this.description.innerHTML = description;

            if (this.title.firstChild || this.description.firstChild) {
                this.show();
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
