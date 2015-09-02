define([
    'utils/underscore'
], function(_) {

    var Preview = function(_model) {
        this.model = _model;

        this.model.on('change:playlistItem', this.loadImage, this);
    };

    _.extend(Preview.prototype, {
        setup: function(element) {
            this.el = element;

            this.loadImage(this.model, this.model.get('playlistItem'));
        },
        loadImage: function(model, playlistItem) {
            var img = playlistItem.image;

            if (_.isString(img)) {
                // encode special characters into URL
                img = encodeURI(img);
                this.el.style.backgroundImage = 'url("' + img + '")';
            } else {
                this.el.style.backgroundImage = '';
            }
        },
        element : function() {
            return this.el;
        }
    });

    return Preview;
});
