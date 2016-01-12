define([
    'utils/underscore',
    'utils/helpers'
], function(_, util) {

    var Preview = function(_model) {
        this.model = _model;

        this.model.on('change:playlistItem', onPlaylistItem, this);
    };

    function loadOnComplete() {
        if (this.model.get('state') === 'complete') {
            this.loadImage(this.model, this.model.get('playlistItem'));
        }
    }

    function onPlaylistItem(model, playlistItem) {
        var audio = (this.model.mediaModel.get('mediaType') === 'audio');
        var idleManualStart = (this.model.get('state') === 'idle') && (!this.model.get('autostart'));
        var idleMobile = (this.model.get('state') === 'idle') && (util.isMobile());
        var endOfPlaylist = (this.model.get('item') === (this.model.get('playlist').length - 1));

        this.model.off('change:state', loadOnComplete);
        if (audio || idleManualStart || idleMobile) {
            // load image if audio mode, or mobile/non-autostart with on idle state
            this.loadImage(model, playlistItem);
        } else {
            this.el.style.backgroundImage = '';
            if (endOfPlaylist) {
                // if the last playlist item, load image on complete
                this.model.on('change:state', loadOnComplete, this);
            }
        }
    }

    _.extend(Preview.prototype, {
        setup: function(element) {
            this.el = element;

            if (this.model.get('playlistItem')) {
                this.loadImage(this.model, this.model.get('playlistItem'));
            }
        },
        loadImage: function(model, playlistItem) {
            var img = playlistItem.image;

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
