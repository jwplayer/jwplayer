import { sortedIndex, property, bind } from 'utils/underscore';
import { ajax } from 'utils/ajax';
import srt from 'parsers/captions/srt';
import type { GenericObject } from 'types/generic.type';
import type { TimeSliderWithMixins } from './timeslider';

interface ThumbnailInt {
    begin: number;
    end: number;
    img: string;
}

type LoadedThumbnailObj = {
    begin: number;
    end: number;
    text: string;
};

function Thumbnail(this: ThumbnailInt, obj: LoadedThumbnailObj): void {
    this.begin = obj.begin;
    this.end = obj.end;
    this.img = obj.text;
}

export interface ThumbnailsMixinInt {
    vttPath?: string;
    thumbnails?: ThumbnailInt[];
    individualImage?: HTMLImageElement | null;
    loadThumbnails: (file: string) => void;
    thumbnailsLoaded: (evt: XMLHttpRequest) => void;
    thumbnailsFailed: () => void;
    chooseThumbnail: (seconds: number) => string;
    loadThumbnail: (seconds: number) => GenericObject | undefined;
    showThumbnail: (seconds: number) => void;
    resetThumbnails: () => void;
}

const ThumbnailsMixin: ThumbnailsMixinInt = {
    loadThumbnails: function (file: string): void {
        if (!file) {
            return;
        }
        this.vttPath = file.split('?')[0].split('/').slice(0, -1).join('/');
        // Only load the first individual image file so we can get its dimensions. All others are loaded when
        // they're set as background-images.
        this.individualImage = null;
        ajax(file, this.thumbnailsLoaded.bind(this), this.thumbnailsFailed.bind(this), {
            plainText: true
        });
    },

    thumbnailsLoaded: function (this: TimeSliderWithMixins, evt: XMLHttpRequest): void {
        const data = srt(evt.responseText);
        if (Array.isArray(data)) {
            data.forEach(function(this: ThumbnailsMixinInt, obj: LoadedThumbnailObj): void {
                const thumbs = this.thumbnails as ThumbnailInt[];
                thumbs.push(new Thumbnail(obj));
            }, this);
            this.drawCues();
        }
    },

    thumbnailsFailed: function (): void { /* no-op */ },

    chooseThumbnail: function(seconds: number): string {
        const thumbs = this.thumbnails as ThumbnailInt[];
        let idx = sortedIndex(thumbs, { end: seconds }, property('end'));
        if (idx >= thumbs.length) {
            idx = thumbs.length - 1;
        }
        let url = thumbs[idx].img;
        if (url.indexOf('://') < 0) {
            url = this.vttPath ? this.vttPath + '/' + url : url;
        }

        return url;
    },

    loadThumbnail: function(this: TimeSliderWithMixins, seconds: number): GenericObject | undefined {
        let url = this.chooseThumbnail(seconds);
        const style: GenericObject = {
            margin: '0 auto',
            backgroundPosition: '0 0'
        };

        const hashIndex = url.indexOf('#xywh');
        if (hashIndex > 0) {
            try {
                const matched = (/(.+)#xywh=(\d+),(\d+),(\d+),(\d+)/).exec(url);
                if (!matched) {
                    throw new Error('No match for expected thumbnail pattern');
                }
                url = matched[1];
                const xVal: number = parseInt(matched[2]);
                const yVAl: number = parseInt(matched[3]);
                style.backgroundPosition = (xVal * -1) + 'px ' + (yVAl * -1) + 'px';
                style.width = matched[4];
                this.timeTip.setWidth(+style.width);
                style.height = matched[5];
            } catch (e) {
                // this.vttFailed('Could not parse thumbnail');
                return;
            }
        } else if (!this.individualImage) {
            const indImg = this.individualImage = new Image();
            indImg.onload = bind(function (this: TimeSliderWithMixins): void {
                indImg.onload = null;
                this.timeTip.image({ width: indImg.width, height: indImg.height });
                this.timeTip.setWidth(indImg.width);
            }, this);
            indImg.src = url;
        }

        style.backgroundImage = 'url("' + url + '")';

        return style;
    },

    showThumbnail: function(this: TimeSliderWithMixins, seconds: number): void {
        // Don't attempt to set thumbnail for small players or when a thumbnail doesn't exist
        if (this._model.get('containerWidth') <= 420 || (!this.thumbnails || this.thumbnails.length < 1)) {
            return;
        }
        this.timeTip.image(this.loadThumbnail(seconds) as GenericObject);
    },

    resetThumbnails: function(this: TimeSliderWithMixins): void {
        this.timeTip.image({
            backgroundImage: '',
            width: 0,
            height: 0
        });
        this.thumbnails = [];
    }
};

export default ThumbnailsMixin;
