import { requestAnimationFrame, cancelAnimationFrame } from 'utils/request-animation-frame';
import { style } from 'utils/css';

const Preview = function(_model) {
    this.model = _model;
    this.raf = -1;
    this.image = null;
};

function onMediaModel(model, mediaModel) {
    mediaModel.off('change:mediaType', null, this);
    mediaModel.on('change:mediaType', function(mediaTypeChangeModel, mediaType) {
        if (mediaType === 'audio') {
            this.setImage(model.get('playlistItem').image);
        }
    }, this);
}

function onPlaylistItem(model, playlistItem) {
    if (this.image) {
        this.setImage(null);
    }
    model.off('change:state', null, this);
    model.change('state', function(stateChangeModel, state) {
        if (validState(state)) {
            cancelAnimationFrame(this.raf);
            this.raf = requestAnimationFrame(() => {
                this.setImage(playlistItem.image);
                this.resize(null, null, stateChangeModel.get('stretching'));
            });
        }
    }, this);
}

function validState(state) {
    return state === 'complete' || state === 'idle' || state === 'error';
}

Object.assign(Preview.prototype, {
    setup: function(element) {
        this.el = element;
        this.model.on('change:mediaModel', onMediaModel, this);
        this.model.on('change:playlistItem', onPlaylistItem, this);
    },
    setImage: function(img) {
        // Remove onload function from previous image
        var image = this.image;
        if (image) {
            image.onload = null;
        }
        this.image = null;
        if (!validState(this.model.get('state'))) {
            return;
        }
        this.model.off('change:state', null, this);
        var backgroundImage = '';
        if (typeof img === 'string') {
            backgroundImage = 'url("' + img + '")';
            image = this.image = new Image();
            image.src = img;
        }
        style(this.el, {
            backgroundImage: backgroundImage
        });
    },
    resize: function(width, height, stretching) {
        if (stretching === 'uniform') {
            if (width) {
                this.playerAspectRatio = width / height;
            }
            if (!this.playerAspectRatio ||
                !this.image ||
                !validState(this.model.get('state'))) {
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
            style(this.el, {
                backgroundSize: backgroundSize
            });
        }
    },
    element: function() {
        return this.el;
    }
});

export default Preview;
