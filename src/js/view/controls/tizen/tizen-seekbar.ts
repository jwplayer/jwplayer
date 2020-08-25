import { style } from 'utils/css';
import { addClass, removeClass, createElement } from 'utils/dom';
import { timeFormat } from 'utils/parser';
import ThumbnailSeekbarTemplate from 'view/controls/tizen/templates/thumbnail-seekbar';
import type TimeSlider from 'view/controls/components/timeslider';
import type { TimeSliderWithMixins } from 'view/controls/components/timeslider';
import type ViewModel from 'view/view-model';
import type { GenericObject, PlayerAPI } from 'types/generic.type';

type ThumbnailStyles = {
    margin: string;
    height: string;
    width: string;
    backgroundPosition: string;
    backgroundRepeat: string;
    backgroundSize: string;
    backgroundImage: string;
}

function getDimensionPct(imageDimension: number, thumbnailDimension: number, dimensionPx: string): number {
    if (thumbnailDimension === imageDimension) {
        return 0;
    }
    return (parseInt(dimensionPx) / (imageDimension - thumbnailDimension)) * 100;
}

export default class TizenSeekbar {
    _model: ViewModel;
    _api: PlayerAPI;
    _slider: TimeSliderWithMixins;
    el: HTMLElement;
    currentTime: number;
    thumbnailContainer: HTMLElement;
    imageWidth?: number;
    imageHeight?: number;

    constructor(model: ViewModel, api: PlayerAPI, slider: TimeSlider) {
        this._model = model;
        this._api = api;
        this._slider = slider as TimeSliderWithMixins;
        this.currentTime = 0;

        const el = document.createElement('div');
        el.className = 'jw-tizen-seekbar';
        this.el = el;

        const thumbnailContainer = this.thumbnailContainer = createElement(ThumbnailSeekbarTemplate());
        this.el.appendChild(thumbnailContainer);

        // Set the thumbnail image width and height in case of sprites (all thumbnails in one image)
        api.on('firstFrame', () => {
            if (this._slider.thumbnails && this._slider.thumbnails.length !== 0) {
                this._setImageDimensions();
            }
        });
    }

    _setImageDimensions(): void {
        const img = new Image();
        img.onload = () => {
            img.onload = null;
            this.imageWidth = img.width;
            this.imageHeight = img.height;
        };
        img.src = this._slider.chooseThumbnail(0);
    }

    show(): void {
        if (this._slider.thumbnails && this._slider.thumbnails.length !== 0) {
            addClass(this.thumbnailContainer, 'jw-open');
            this._updateThumbnails(this._model.get('position'), 10);
        } else {
            addClass(this._slider.timeTip.el, 'jw-open');
            this._updateTimeTip(this._model.get('position'));
        }
    }

    update(increment: number): void {
        const currentTime = this.currentTime;
        const duration = this._model.get('duration');
        
        let position = currentTime + increment;
        position = position < 0 ? 0 : position;
        position = position > duration ? duration : position;

        if (position !== currentTime) { 
            if (this._slider.thumbnails && this._slider.thumbnails.length !== 0) {
                this._updateThumbnails(position, increment);
            } else {
                this._updateTimeTip(position);
            }
        }
    }

    _updateTimeTip(position: number): void {
        const timeTip = this._slider.timeTip;
        const pct = this._getProgressPercent(position);

        style(timeTip.el, { left: pct + '%' });
        timeTip.update(timeFormat(Math.round(position)));

        this._updateProgressBar(position);
        this.currentTime = Math.round(position);
    }

    _updateThumbnails(position: number, increment: number): void {
        const thumbnails = this.thumbnailContainer.children;
        const duration = this._model.get('duration');
        const positions = [
            position - (2 * increment),
            position - increment,
            position,
            position + increment,
            position + (2 * increment)
        ];

        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const thumbnail = thumbnails[i];
            let thumbnailStyles: GenericObject | undefined;

            if (pos >= 0 && pos <= duration) {
                thumbnailStyles = this._slider.loadThumbnail(pos) as GenericObject;
            }

            const styles = this._getThumbnailStyles(thumbnailStyles);
            style(thumbnail, styles);
        }

        const elapsed = document.getElementsByClassName('jw-text-elapsed')[0];
        elapsed.textContent = timeFormat(Math.round(position));

        this._updateProgressBar(position);
        this.currentTime = Math.round(position);
    }

    hide(): void {
        // Set elements to the model's position
        const position = this._model.get('position');
        const elapsed = document.getElementsByClassName('jw-text-elapsed')[0];

        elapsed.textContent = timeFormat(Math.round(position));
        this._updateProgressBar(position);

        removeClass(this._slider.timeTip.el, 'jw-open');
        removeClass(this.thumbnailContainer, 'jw-open');

        this._resetThumbnails();
    }

    seek(): void {
        this._api.seek(this.currentTime, { reason: 'interaction' });
    }

    element(): HTMLElement {
        return this.el;
    }

    // Helper Functions
    _resetThumbnails(): void {
        for (let i = 0; i < this.thumbnailContainer.children.length; i++) {
            style(this.thumbnailContainer.children[i], { backgroundImage: '' });
        }
    }

    _getProgressPercent(position: number): number {
        const duration = this._model.get('duration');
        return parseFloat((position / duration).toFixed(3)) * 100;
    }

    _updateProgressBar(position: number): void {
        const pct = this._getProgressPercent(position);
        const progressBar = this._slider.el.querySelector('.jw-progress');
        style(progressBar, { width: pct + '%' });
    }

    _getThumbnailStyles(thumbnailStyles?: GenericObject): ThumbnailStyles {
        const styles = {
            margin: '5px',
            height: '215px',
            width: '375px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundImage: ''
        };

        if (thumbnailStyles) {
            styles.backgroundImage = thumbnailStyles.backgroundImage;

            // Styling for sprite images
            if (thumbnailStyles.width && thumbnailStyles.height && this.imageWidth && this.imageHeight) {
                /* 
                -Sprite scaling for background-size-
                background-size = # of images in a row * 100% (by) # of images in a column * 100%
                e.g. If the sprite has 4 images in each row and 20 images in each column,
                the background-size would be 400% 2000%
                https://stackoverflow.com/questions/45595520/css-sprite-background-sizecover
                */
                const sizeWidth = this.imageWidth / thumbnailStyles.width * 100; 
                const sizeHeight = this.imageHeight / thumbnailStyles.height * 100;
                styles.backgroundSize = sizeWidth + '% ' + sizeHeight + '%';

                /*
                Because the background-size changes, the background-position for the thumbnail must be updated
                background-position is converted from pixels (px) to pct (%) with the following formula:
                background-position = X px / (spriteWidth - imageWidth) * 100% (by) Y px / (spriteHeight - imageHeight) * 100%
                */
                const positionPixels = thumbnailStyles.backgroundPosition.match(/\d+/g);
                const positionX = getDimensionPct(this.imageWidth, thumbnailStyles.width, positionPixels[0]);
                const positionY = getDimensionPct(this.imageHeight, thumbnailStyles.height, positionPixels[1]);
                styles.backgroundPosition = positionX + '% ' + positionY + '%';
            }
        }

        return styles;
    }
}
