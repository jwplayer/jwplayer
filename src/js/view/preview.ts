import { style } from 'utils/css';
import type ViewModel from './view-model';

class Preview {
    model: ViewModel;
    image: HTMLImageElement | null;
    el?: HTMLElement;
    hasZoomThumbnail?: boolean;
    zoomOriginX?: string;
    zoomOriginY?: string;
    imageEl?: HTMLElement;
    zoomThumbnailTimeout?: number;
    playerAspectRatio?: number;

    constructor(_model: ViewModel) {
        this.model = _model;
        this.image = null;
    }
    setup(el: HTMLElement): void {
        this.el = el;
        this.hasZoomThumbnail = this.model.get('_abZoomThumbnail');

        if (this.hasZoomThumbnail) {
            this.zoomOriginX = Math.ceil(Math.random() * 100) + '%';
            this.zoomOriginY = Math.ceil(Math.random() * 100) + '%';

            this.model.on('change:viewable', this.pauseZoomThumbnail, this);
            this.model.on('change:isFloating', this.enableZoomThumbnail, this);
        }
    }
    setImage(img: HTMLImageElement): void {
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
            if (this.el) {
                this.el.appendChild(this.imageEl);
            }
            this.enableZoomThumbnail();
        } else {
            style(this.el, {
                backgroundImage: backgroundImage
            });
        }
    }
    enableZoomThumbnail(): void {
        if (!this.hasZoomThumbnail || this.model.get('isFloating')) {
            return;
        }

        clearTimeout(this.zoomThumbnailTimeout);
        this.zoomThumbnailTimeout = setTimeout(() => {
            if (this.imageEl) {
                this.imageEl.classList.add('jw-ab-zoom-thumbnail');
                this.imageEl.style.transformOrigin = this.zoomOriginX + ' ' + this.zoomOriginY;
            }
        }, 2000);
    }
    pauseZoomThumbnail(): void {
        clearTimeout(this.zoomThumbnailTimeout);
        if (this.imageEl) {
            this.imageEl.style.animationPlayState = this.model.get('viewable') ? 'running' : 'paused';
        }
    }
    removeZoomThumbnail(): void {
        clearTimeout(this.zoomThumbnailTimeout);
        if (this.imageEl) {
            this.imageEl.classList.remove('jw-ab-zoom-thumbnail');
        }
    }
    resize(width: number, height: number, stretching: string): void {
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
            let backgroundSize: string | null = null;
            if (image) {
                if (image.width === 0) {
                    image.onload = () => {
                        this.resize(width, height, stretching);
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
    }
    element(): HTMLElement | undefined {
        return this.el;
    }
    destroy(): void {
        if (this.hasZoomThumbnail) {
            this.removeZoomThumbnail();
            this.model.off(null, null, this);
        }
    }
}

function validState(state: string): boolean {
    return state === 'complete' || state === 'idle' || state === 'error' || state === 'buffering';
}

export default Preview;
