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
            var audio = (this.model.mediaModel.get('mediaType') === 'audio');
            var idleManualStart = (this.model.get('state') === 'idle') && (!this.model.get('autostart'));
            var idleMobile = (this.model.get('state') === 'idle') && (util.isMobile());
            var endOfPlaylist = (this.model.get('item') === (this.model.get('playlist').length - 1));

            this.model.off('change:state');
            if (_.isString(img) && (audio || idleManualStart || idleMobile)) {
                // load image if audio mode, or mobile/non-autostart with on idle state
                this.el.style.backgroundImage = 'url("' + img + '")';
            } else {
                this.el.style.backgroundImage = '';
                if (endOfPlaylist && _.isString(img)) {
                    // if the last playlist item, load image on complete
                    this.model.on('change:state', function() {
                        if (this.model.get('state') === 'complete') {
                            this.el.style.backgroundImage = 'url("' + img + '")';
                        }
                    }, this);
                }
            }
        },
        element : function() {
            return this.el;
        }
    });

    return Preview;
});
