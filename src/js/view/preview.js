define([
    'utils/underscore',
    'utils/helpers'
], function(_, utils) {

    var Preview = function(_model) {
        this.model = _model;

        this.model.on('change:playlistItem', onPlaylistItem, this);
        this.model.on('change:mediaModel', onMediaModel, this);
        this.model.on('change:state', onChangeState, this);
    };

    function onChangeState(model, state) {
        var endOfPlaylist = (this.model.get('item') === (this.model.get('playlist').length - 1));
        if ((state === 'complete') && (!model.get('repeat')) && endOfPlaylist) {
            this.loadImage(model, model.get('playlistItem').image);
        }
    }

    function onMediaModel() {
        this.model.mediaModel.off('change:mediaType', onMediaType);
        this.model.mediaModel.on('change:mediaType', onMediaType, this);
    }

    function onMediaType(mediaModel, mediaType) {
        if (mediaType === 'audio') {
            this.loadImage(this.model, this.model.get('playlistItem').image);
        }
    }

    function onPlaylistItem(model, playlistItem) {
        var loadImage = (this.model.get('state') === 'idle') && (this.model.get('item') === 0) &&
            (!this.model.get('autostart') || utils.isMobile());

        if (loadImage) {
            this.loadImage(model, playlistItem.image);
        } else {
            this.loadImage(model, null);
        }
    }

    _.extend(Preview.prototype, {
        setup: function(element) {
            this.el = element;

            if (this.model.get('playlistItem')) {
                this.loadImage(this.model, this.model.get('playlistItem'));
            }
        },
        loadImage: function(model, img) {
            var backgroundImage = '';
            if (_.isString(img)) {
                backgroundImage = 'url("' + img + '")';
            }
            utils.style(this.el, {
                backgroundImage: backgroundImage
            });
        },
        element : function() {
            return this.el;
        }
    });

    return Preview;
});
