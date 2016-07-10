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
                    this.resize(null, null, model.get('stretching'));
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
            var image = this.image;
            if (image) {
                image.onload = null;
                this.image = null;
            }
            this.model.off('change:state', null, this);
            var backgroundImage = '';
            if (_.isString(img)) {
                backgroundImage = 'url("' + img + '")';
                image = this.image = new Image();
                image.src = img;
            }
            utils.style(this.el, {
                backgroundImage: backgroundImage
            });
        },
        resize: function(width, height, stretching) {
            if (stretching === 'uniform') {
                if (width) {
                    this.playerAspectRatio = width / height;
                }
                if (!this.playerAspectRatio) {
                    return;
                }
                // snap image to edges when the difference in aspect ratio is less than 9%
                var image = this.image;
                var backgroundSize = null;
                if (image) {
                    if (image.width === 0) {
                        var _this = this;
                        image.onload = function() {
                            _this.resize(width, height, stretching);
                        };
                        return;
                    }
                    var imageAspectRatio = image.width / image.height;
                    if (Math.abs(this.playerAspectRatio - imageAspectRatio) < 0.09) {
                        backgroundSize = 'cover';
                    }
                }
                utils.style(this.el, {
                    backgroundSize: backgroundSize
                });
            }
        },
        element: function() {
            return this.el;
        }
    });

    return Preview;
});
