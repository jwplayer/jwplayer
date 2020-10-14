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
                this.setImageDimensions();
            }
        }, this);
    }

    private setImageDimensions(): void {
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
            this.updateThumbnails(this._model.get('position'), 10);
        } else {
            addClass(this._slider.timeTip.el, 'jw-open');
            this.updateTimeTip(this._model.get('position'));
        }
    }

    update(increment: number): void {
        const currentTime = this.currentTime;
        const duration = this._model.get('duration');
        
        let time = currentTime + increment;
        time = time < 0 ? 0 : time;
        time = time > duration ? duration : time;

        if (time !== currentTime) { 
            if (this._slider.thumbnails && this._slider.thumbnails.length !== 0) {
                this.updateThumbnails(time, Math.abs(increment));
            } else {
                this.updateTimeTip(time);
            }
        }
    }

    private updateTimeTip(time: number): void {
        const timeTip = this._slider.timeTip;
        const pct = this.getProgressPercent(time);

        style(timeTip.el, { left: pct + '%' });
        timeTip.update(timeFormat(Math.round(time)));

        this.updateProgressBar(time);
        this.currentTime = Math.round(time);
    }

    private updateThumbnails(time: number, increment: number): void {
        const thumbnails = this.thumbnailContainer.children;
        const duration = this._model.get('duration');
        const thumbnailTimes = [
            time - (2 * increment),
            time - increment,
            time,
            time + increment,
            time + (2 * increment)
        ];

        for (let i = 0; i < thumbnailTimes.length; i++) {
            const thumbTime = thumbnailTimes[i];
            const thumb = thumbnails[i];
            let thumbnailStyles: GenericObject | undefined;

            if (thumbTime >= 0 && thumbTime <= duration) {
                thumbnailStyles = this._slider.loadThumbnail(thumbTime) as GenericObject;
            }

            const styles = this.getThumbnailStyles(thumbnailStyles);
            style(thumb, styles);
        }

        const elapsedEl = document.getElementsByClassName('jw-text-elapsed')[0];
        elapsedEl.textContent = timeFormat(Math.round(time));

        this.updateProgressBar(time);
        this.currentTime = Math.round(time);
    }

    hide(): void {
        // Set time elements to the model's position
        const time = this._model.get('position');
        const elapsedEl = document.getElementsByClassName('jw-text-elapsed')[0];

        elapsedEl.textContent = timeFormat(Math.round(time));
        this.updateProgressBar(time);

        removeClass(this._slider.timeTip.el, 'jw-open');
        removeClass(this.thumbnailContainer, 'jw-open');

        this.resetThumbnails();
    }

    seek(): void {
        this._api.seek(this.currentTime, { reason: 'interaction' });
    }

    element(): HTMLElement {
        return this.el;
    }

    destroy(): void {
        this._api.off(null, null, this);
    }

    // Helper Functions
    private resetThumbnails(): void {
        for (let i = 0; i < this.thumbnailContainer.children.length; i++) {
            style(this.thumbnailContainer.children[i], { backgroundImage: '' });
        }
    }

    private getProgressPercent(time: number): number {
        const duration = this._model.get('duration');
        return parseFloat((time / duration).toFixed(3)) * 100;
    }

    private updateProgressBar(time: number): void {
        const pct = this.getProgressPercent(time);
        const progressBar = this._slider.el.querySelector('.jw-progress');
        style(progressBar, { width: pct + '%' });
    }

    private getThumbnailStyles(thumbnailStyles?: GenericObject): ThumbnailStyles {
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
