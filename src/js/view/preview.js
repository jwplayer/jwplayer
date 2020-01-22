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
        this.hasZoomThumbnail = this.model.get('_abZoomThumbnail');

        if (this.hasZoomThumbnail) {
            this.zoomOriginX = Math.ceil(Math.random() * 100) + '%';
            this.zoomOriginY = Math.ceil(Math.random() * 100) + '%';

            this.model.on('change:viewable', this.pauseZoomThumbnail, this);
            this.model.on('change:isFloating', this.enableZoomThumbnail, this);
        }
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
       
        if (this.hasZoomThumbnail) {
            this.imageEl = document.createElement('div');
            style(this.imageEl, {
                backgroundImage: backgroundImage
            });
            this.el.appendChild(this.imageEl);
            this.enableZoomThumbnail();     
        } else {
            style(this.el, {
                backgroundImage: backgroundImage
            });
        }
    },
    enableZoomThumbnail: function() {
        if (!this.hasZoomThumbnail || this.model.get('isFloating')) {
            return;
        }
        
        clearTimeout(this.zoomThumbnailTimeout);
        this.zoomThumbnailTimeout = setTimeout(() => {
            this.imageEl.classList.add('jw-ab-zoom-thumbnail');
            this.imageEl.style.transformOrigin = this.zoomOriginX + ' ' + this.zoomOriginY;
        }, 2000);
    },
    pauseZoomThumbnail: function() {
        clearTimeout(this.zoomThumbnailTimeout);
        if (this.imageEl) {
            this.imageEl.style.animationPlayState = this.model.get('viewable') ? 'running' : 'paused';
        }
    },
    removeZoomThumbnail: function() {
        clearTimeout(this.zoomThumbnailTimeout);
        if (this.imageEl) {
            this.imageEl.classList.remove('jw-ab-zoom-thumbnail');
        }
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
    },
    destroy: function() {
        if (this.hasZoomThumbnail) {
            this.removeZoomThumbnail();
            this.model.off(null, null, this);
        }
    }
});

export default Preview;
