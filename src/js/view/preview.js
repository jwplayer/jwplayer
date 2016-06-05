define([
    'utils/underscore',
    'utils/helpers'
], function(_, utils) {

    var Preview = function(_model) {
        this.model = _model;

        _model.on('change:playlistItem', onPlaylistItem, this);
        _model.on('change:mediaModel', onMediaModel, this);
    };

    function onMediaModel(model, mediaModel) {
        mediaModel.off('change:mediaType', null, this);
        mediaModel.on('change:mediaType', function(mediaModel, mediaType) {
            if (mediaType === 'audio') {
                this.setImage(model.get('playlistItem').image);
            }
        }, this);
    }

    function onPlaylistItem(model, playlistItem) {
        var delayPosterLoad = (model.get('autostart') && !utils.isMobile()) ||
            (model.get('item') > 0);

        if (delayPosterLoad) {
            this.setImage(null);
            model.off('change:state', null, this);
            model.on('change:state', function(model, state) {
                if (state === 'complete' || state === 'idle' || state === 'error') {
                    this.setImage(playlistItem.image);
                }
            }, this);
            return;
        }

        this.setImage(playlistItem.image);
    }

    _.extend(Preview.prototype, {
        setup: function(element) {
            this.el = element;
            var playlistItem = this.model.get('playlistItem');
            if (playlistItem) {
                this.setImage(playlistItem.image);
            }
        },
        setImage: function(img) {
            this.model.off('change:state', null, this);
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
