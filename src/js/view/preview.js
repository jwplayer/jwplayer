import { style } from 'utils/css';
import { createElement } from 'utils/dom';
import motionThumbnailTemplate from '../view/motion-thumbnail';

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
        this.hasPlayedPreview = false;
    },
    setImage: function(img) {
        // Remove onload function from previous image
        let image = this.image;
        if (image) {
            image.onload = null;
        }
        this.image = null;
        let backgroundImage = '';
        if (typeof img === 'string') {
            backgroundImage = 'url("' + img + '")';
            image = this.image = new Image();
            image.src = img;
        }
        style(this.el, {
            backgroundImage: backgroundImage
        });
    },
    setupMotionPreview: function(container, img) {
        const onMotionThumbnail = () => {
            let motionThumbnail = container.querySelector('.jw-motion-thumbnail');
            if (!motionThumbnail) {
                motionThumbnail = createElement(motionThumbnailTemplate(img));
                container.append(motionThumbnail);
            }
            motionThumbnail.src = img;
            motionThumbnail.style = 'opacity: 1';
        };
        onMotionThumbnail();
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
            const image = this.image;
            let backgroundSize = null;
            if (image) {
                if (image.width === 0) {
                    const _this = this;
                    image.onload = function() {
                        _this.resize(width, height, stretching);
                    };
                    return;
                }
                const imageAspectRatio = image.width / image.height;
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
