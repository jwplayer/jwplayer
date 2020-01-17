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
        this.hasZoomThumbnail = !this.model.get('autostart') && this.model.get('_abZoomThumbnail');
        
        if (this.hasZoomThumbnail) {
            this.enableZoom();
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
        style(this.el, {
            backgroundImage: backgroundImage
        });
    },
    enableZoom: function() {
        if (this.model.get('state' !== 'idle')) {
            return;
        }
        
        setTimeout(() => {
            const originX = Math.ceil(Math.random() * 100) + '%';
            const originY = Math.ceil(Math.random() * 100) + '%';
            
            this.el.classList.add('jw-ab-zoom-thumbnail');
            this.el.style.transformOrigin = originX + ' ' + originY;
        }, 2000);
        
        this.model.once('change:state', this.destroy, this);
        this.model.on('change:viewable', this.pauseZoom, this);
    },
    pauseZoom: function() {
        this.el.style.animationPlayState = this.model.get('viewable') ? 'running' : 'paused';
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
            this.el.classList.remove('jw-ab-zoom-thumbnail');
            this.model.off('change:state', this.destroy, this);
            this.model.off('change:viewable', this.pauseZoom, this);
        }
    }
});

export default Preview;
