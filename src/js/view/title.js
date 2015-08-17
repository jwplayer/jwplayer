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
                this.updateText(model, item);
            } else {
                this.hide();
            }
        },

        updateText: function(model, playlistItem) {
            this.title.innerHTML = (playlistItem.title && model.get('displaytitle')) ?
                playlistItem.title : '';
            this.description.innerHTML = (playlistItem.description && model.get('displaydescription')) ?
                playlistItem.description : '';

            if(this.title.firstChild || this.description.firstChild){
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
