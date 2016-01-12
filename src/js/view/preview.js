define([
    'utils/underscore',
    'utils/helpers'
], function(_, util) {

    var Preview = function(_model) {
        this.model = _model;

        this.model.on('change:playlistItem', this.loadImage, this);
    };

    _.extend(Preview.prototype, {
        setup: function(element) {
            this.el = element;

            if (this.model.get('playlistItem')) {
                this.loadImage(this.model, this.model.get('playlistItem'));
            }
        },
        loadImage: function(model, playlistItem) {
            var img = playlistItem.image;

            // hide the preview in idle state if autostart is true and not mobile to prevent preview flashing
            var hidePreview = model.get('autostart') && !util.isMobile();
            util.toggleClass(this.el, 'jw-autostart', hidePreview);

            if (_.isString(img)) {
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
