define([
    'utils/underscore',
    'utils/helpers'
], function(_, utils) {
    var Preview = function(_model) {
        this.model = _model;
        this.aspectRatioPromise = Promise.resolve(0);

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
            // Remove onload function from previous image
            if (this.image) {
                this.image.onload = null;
            }
            this.model.off('change:state', null, this);
            var backgroundImage = '';
            if (_.isString(img)) {
                backgroundImage = 'url("' + img + '")';

                // Save the background image's width and height for resize check in view.js
                this.image = new Image();
                this.aspectRatioPromise = new Promise(function(resolve) {
                    this.image.onload = function() {
                        resolve(this.width / this.height);
                    };
                    this.image.src = img;
                }.bind(this));
            } else {
                this.aspectRatioPromise = Promise.resolve(0);
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
