import { style } from 'utils/css';

const Preview = function(_model) {
    this.model = _model;
    this.image = null;
};

function validState(state) {
    return state === 'complete' || state === 'idle' || state === 'error' || state === 'buffering';
}

Object.assign(Preview.prototype, {
    setup: function(element) {
        this.el = element;
    },
    setImage: function(img) {
        // Remove onload function from previous image
        var image = this.image;
        if (image) {
            image.onload = null;
        }
        this.image = null;
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
