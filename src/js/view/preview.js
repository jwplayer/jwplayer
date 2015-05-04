define([
    'utils/underscore'

], function(_) {

    var Preview = function(_model) {
        this.model = _model;

        this.model.on('change:playlistItem', this.loadImage, this);
    };

    _.extend(Preview.prototype, {
        setup: function(parent) {
            this.el = document.createElement('div');
            this.el.className = 'jw-preview';

            this.loadImage(this.model, this.model.get('playlistItem'));

            parent.appendChild(this.el);
        },
        loadImage: function(model, playlistItem) {
            var img = playlistItem.image;

            if (_.isString(img)) {
                this.el.style['background-image'] = 'url(' + img + ')';
            } else {
                this.el.style['background-image'] = '';
            }
        },

        element : function() {
            return this.el;
        }
    });

    return Preview;
});
