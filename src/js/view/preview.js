define([
    'utils/underscore',
    'utils/helpers'
], function(_, utils) {

    var Preview = function(_model) {
        this.model = _model;

        this.model.on('change:playlistItem', onPlaylistItem, this);
        this.model.on('change:mediaModel', onMediaModel, this);
    };

    function onChangeState(model, state) {
        if (state === 'complete') {
            this.loadImage(model, model.get('playlistItem'));
        }
    }

    function onMediaModel() {
        this.model.mediaModel.off('change:mediaType', onMediaType);
        this.model.mediaModel.on('change:mediaType', onMediaType, this);
    }

    function onMediaType(mediaModel) {
        var audio = (mediaModel.get('mediaType') === 'audio');
        if (audio) {
            this.loadImage(this.model, this.model.get('playlistItem'));
        }
    }

    function onPlaylistItem(model, playlistItem) {
        var loadImage = (this.model.get('state') === 'idle') && (this.model.get('item') === 0) &&
            (!this.model.get('autostart') || utils.isMobile());
        var endOfPlaylist = (this.model.get('item') === (this.model.get('playlist').length - 1));

        this.model.off('change:state', onChangeState);
        if (loadImage) {
            // load image if mobile/non-autostart with on idle state, when the current item is the first playlist item
            this.loadImage(model, playlistItem);
        } else {
            utils.style(this.el, {
                backgroundImage: ''
            });
            if (endOfPlaylist) {
                // if the last playlist item, load image on complete
                this.model.on('change:state', onChangeState, this);
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
                utils.style(this.el, {
                    backgroundImage: 'url("' + img + '")'
                });
            } else {
                utils.style(this.el, {
                    backgroundImage: ''
                });
            }
        },
        element : function() {
            return this.el;
        }
    });

    return Preview;
});
