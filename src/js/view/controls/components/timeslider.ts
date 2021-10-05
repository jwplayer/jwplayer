import { throttle, each } from 'utils/underscore';
import { between } from 'utils/math';
import { style, transform } from 'utils/css';
import { timeFormat, timeFormatAria } from 'utils/parser';
import { addClass, removeClass, setAttribute, bounds } from 'utils/dom';
import { limit } from 'utils/function-wrappers';
import UI from 'utils/ui';
import Slider from 'view/controls/components/slider';
import TooltipIcon from 'view/controls/components/tooltipicon';
import ChaptersMixin, { ChaptersMixinInt, Cue } from 'view/controls/components/chapters.mixin';
import ThumbnailsMixin, { ThumbnailsMixinInt } from 'view/controls/components/thumbnails.mixin';
import type ViewModel from 'view/view-model';
import type { PlayerAPI, GenericObject, TextTrackLike } from 'types/generic.type';
import type Item from 'playlist/item';

export type TimeSliderWithMixins = TimeSlider & ChaptersMixinInt & ThumbnailsMixinInt;

const SEEK_EVENT_UPDATE_INTERVAL_MS = 400;

// Number of milliseconds minimum between aria updates
const ARIA_TEXT_UPDATE_INTERVAL_MS = 1000;

// Maximum number of times that the aria text is updated without
// an event (focus & seek) reseting the count
const ARIA_TEXT_UPDATE_TIMES = 4;

class TimeTipIcon extends TooltipIcon {
    textChapter?: HTMLElement;
    textTime?: HTMLElement;
    img?: HTMLElement;
    containerWidth?: number;
    container?: HTMLElement;
    textLength?: number;
    dragJustReleased?: boolean;

    setup(): void {
        this.textChapter = document.createElement('span');
        this.textChapter.className = 'jw-time-chapter jw-text jw-reset';
        this.textChapter.style.display = 'none';
        this.textTime = document.createElement('span');
        this.textTime.className = 'jw-time-time jw-text jw-reset';
        this.img = document.createElement('div');
        this.img.className = 'jw-time-thumb jw-reset';
        this.containerWidth = 0;
        this.textLength = 0;
        this.dragJustReleased = false;

        const wrapper = document.createElement('div');
        wrapper.className = 'jw-time-tip jw-reset';
        wrapper.appendChild(this.img);
        wrapper.appendChild(this.textChapter);
        wrapper.appendChild(this.textTime);

        this.addContent(wrapper);
    }

    image(styles: GenericObject): void {
        style(this.img, styles);
    }

    update(txtTime: string, txtChapter?: string): void {
        if (!this.textTime) {
            return;
        }
        this.textTime.textContent = txtTime;

        if (!txtChapter) {
            if (this.textChapter) {
                this.textChapter.style.display = 'none';
                this.textChapter.textContent = '';
            }

            return;
        }

        if (!this.textChapter) {
            return;
        }
        this.textChapter.textContent = txtChapter;
        this.textChapter.style.removeProperty('display');
    }

    getWidth(): number {
        if (!this.containerWidth) {
            this.setWidth();
        }

        return this.containerWidth as number;
    }

    setWidth(width?: number): void {
        const tolerance = 16; // add a little padding so the tooltip isn't flush against the edge

        if (width) {
            this.containerWidth = width + tolerance;
            return;
        }

        if (!this.tooltip) {
            return;
        }

        this.containerWidth = bounds(this.container).width + tolerance;
    }

    resetWidth(): void {
        this.containerWidth = 0;
    }
}

function reasonInteraction(): { reason: string } {
    return { reason: 'interaction' };
}

class TimeSlider extends Slider {
    _model: ViewModel;
    _api: PlayerAPI;
    _updateAriaTextLimitedThrottled: any;
    timeUpdateKeeper: HTMLElement;
    timeTip: TimeTipIcon;
    cues: Cue[];
    seekThrottled: Function;
    seekTo?: number;
    streamType?: string;
    activeCue?: Cue | null;
    textLength?: number;

    constructor(_model: ViewModel, _api: PlayerAPI, _timeUpdateKeeper: HTMLElement) {
        super('jw-slider-time', 'horizontal');

        this._model = _model;
        this._api = _api;

        this.timeUpdateKeeper = _timeUpdateKeeper;

        this.timeTip = new TimeTipIcon('jw-tooltip-time', null, true);
        this.timeTip.setup();

        this.cues = [];

        // Store the attempted seek, until the previous one completes
        this.seekThrottled = throttle(this.performSeek, SEEK_EVENT_UPDATE_INTERVAL_MS);
        this._updateAriaTextLimitedThrottled = limit(
            throttle(
                this.updateAriaText,
                ARIA_TEXT_UPDATE_INTERVAL_MS),
            ARIA_TEXT_UPDATE_TIMES);

        this.setup();
    }

    // These overwrite Slider methods
    setup(): void {
        super.setup.call(this);

        this._model
            .on('change:duration', this.onDuration, this)
            .on('change:cues', this.updateCues, this)
            .on('seeked', () => {
                if (!this._model.get('scrubbing')) {
                    this._updateAriaTextLimitedThrottled.reset();
                    this._updateAriaTextLimitedThrottled();
                }
            });
        this._model.change('position', this.onPosition, this)
            .change('buffer', this.onBuffer, this)
            .change('streamType', this.onStreamType, this);

        // Clear cues on player model's playlistItem change event
        this._model.player.change('playlistItem', this.onPlaylistItem, this);

        const sliderElement = this.el;
        setAttribute(sliderElement, 'tabindex', '0');
        setAttribute(sliderElement, 'role', 'slider');
        setAttribute(sliderElement, 'aria-label', this._model.get('localization').slider);
        sliderElement.removeAttribute('aria-hidden');
        this.elementRail.appendChild(this.timeTip.element());

        // Show the tooltip on while dragging (touch) moving(mouse), or moving over(mouse)
        this.ui = (this.ui || new UI(sliderElement))
            .on('move drag', this.showTimeTooltip, this)
            .on('dragEnd out', this.hideTimeTooltip, this)
            .on('click', () => sliderElement.focus())
            .on('focus', () => this._updateAriaTextLimitedThrottled.reset())
            .on('blur', () => this._updateAriaTextLimitedThrottled.shush());

    }

    update(percent: number): void {
        this.seekTo = percent;
        this.seekThrottled();
        super.update.apply(this, [percent]);
    }

    dragStart(): void {
        this._model.set('scrubbing', true);
        super.dragStart.call(this);
    }

    dragEnd(evt: Event): void {
        super.dragEnd.apply(this, [evt]);
        this._model.set('scrubbing', false);
    }

    onBuffer(model: ViewModel, pct: number): void {
        this.updateBuffer(pct);
    }

    onPosition(model: ViewModel, position: number): void {
        this.updateTime(position, model.get('duration'));
    }

    onDuration(this: TimeSliderWithMixins, model: ViewModel, duration: number): void {
        this.updateTime(model.get('position'), duration);
        setAttribute(this.el, 'aria-valuemin', 0);
        setAttribute(this.el, 'aria-valuemax', Math.abs(duration));
        this.drawCues();
    }

    onStreamType(model: ViewModel, streamType: string): void {
        this.streamType = streamType;
    }

    updateTime(position: number, duration: number): void {
        let pct = 0;
        if (duration) {
            if (this.streamType === 'DVR') {
                const dvrSeekLimit = this._model.get('dvrSeekLimit');
                const diff = duration + dvrSeekLimit;
                const pos = position + dvrSeekLimit;
                pct = (diff - pos) / diff * 100;
            } else if (this.streamType === 'VOD' || !this.streamType) {
                // Default to VOD behavior if streamType isn't set
                pct = position / duration * 100;
            }
        }
        this._updateAriaTextLimitedThrottled();
        this.render(pct);
    }

    onPlaylistItem(this: TimeSliderWithMixins, model: ViewModel, playlistItem: Item): void {
        this.reset();

        //  If cues have been cleared from slider but exist on model, update cues.
        const cues = model.get('cues');
        if (!this.cues.length && cues.length) {
            this.updateCues(null, cues);
        }

        const tracks: TextTrackList = playlistItem.tracks;
        each(tracks, function (this: TimeSliderWithMixins, track: TextTrackLike): void {
            if (track && track.kind && track.kind.toLowerCase() === 'thumbnails') {
                this.loadThumbnails(track.file as string);
            } else if (track && track.kind && track.kind.toLowerCase() === 'chapters') {
                this.loadChapters(track.file as string);
            }
        }, this);
    }

    performSeek(): void {
        const percent = this.seekTo as number;
        const duration = this._model.get('duration');
        let position;
        if (duration === 0) {
            this._api.play(reasonInteraction());
        } else if (this.streamType === 'DVR') {
            const seekRange = this._model.get('seekRange') || { start: 0 };
            const dvrSeekLimit = this._model.get('dvrSeekLimit');
            position = seekRange.start + (-duration - dvrSeekLimit) * percent / 100;
            this._api.seek(position, reasonInteraction());
        } else {
            position = percent / 100 * duration;
            this._api.seek(Math.min(position, duration - 0.25), reasonInteraction());
        }
    }

    showTimeTooltip(this: TimeSliderWithMixins, evt: GenericObject): void {
        let duration = this._model.get('duration');
        if (duration === 0) {
            return;
        }

        const playerWidth = this._model.get('containerWidth');
        const railBounds = bounds(this.elementRail);
        let position = (evt.pageX ? (evt.pageX - railBounds.left) : evt.x);
        position = between(position, 0, railBounds.width);
        const pct: number = position / railBounds.width;
        let time = duration * pct;

        // For DVR we need to swap it around
        if (duration < 0) {
            const dvrSeekLimit = this._model.get('dvrSeekLimit');
            duration += dvrSeekLimit;
            time = (duration * pct);
            time = duration - time;
        }

        let timetipTextLength;
        const timeText = timeFormat(time, true);
        const timeTip = this.timeTip;

        this.setActiveCue(time);

        if (this.activeCue) {
            timeTip.update(timeText, this.activeCue.text);
            timetipTextLength = this.activeCue.text.length + timeText.length;
        } else {
            let timetipText = timeText;

            // If DVR and within live buffer
            if (duration < 0 && time > -1) {
                timetipText = 'Live';
            }
            timeTip.update(timetipText);
            timetipTextLength = timetipText.length;
        }

        if (this.textLength !== timetipTextLength) {
            // An activeCue may cause the width of the timeTip container to change
            this.textLength = timetipTextLength;
            timeTip.resetWidth();
        }
        this.showThumbnail(time);

        addClass(timeTip.el, 'jw-open');

        const timeTipWidth = timeTip.getWidth();
        const tolerance = playerWidth - railBounds.width;
        let timeTipPixels = 0;
        if (timeTipWidth > tolerance) {
            // timeTip may go outside the bounds of the player. Determine the amount of tolerance needed in pixels.
            timeTipPixels = (timeTipWidth - tolerance) / 2;
        }
        const safePixels: number = Math.round(Math.min(railBounds.width - timeTipPixels,
            Math.max(timeTipPixels, position)) * 4) / 4;
        transform(timeTip.el, `translateX(${safePixels}px)`);
    }

    hideTimeTooltip(): void {
        removeClass(this.timeTip.el, 'jw-open');
    }

    updateCues(this: TimeSliderWithMixins, model: ViewModel | null, cues: Cue[]): void {
        this.resetCues();
        if (cues && cues.length) {
            cues.forEach((ele) => {
                this.addCue(ele);
            });
            this.drawCues();
        }
    }

    updateAriaText(): void {
        const model = this._model;
        const sliderElement = this.el;
        let position = model.get('position');
        let duration = model.get('duration');

        if (this.streamType === 'DVR') {
            duration = Math.abs(duration);
            position = duration + position;
        }

        const ariaPositionText = timeFormatAria(position);
        const ariaDurationText = timeFormatAria(duration);
        const ariaString = `${ariaPositionText} of ${ariaDurationText}`;

        this.timeUpdateKeeper.textContent = ariaString;

        setAttribute(sliderElement, 'aria-valuetext', ariaString);
        setAttribute(sliderElement, 'aria-valuenow', position);
    }

    reset(this: TimeSliderWithMixins): void {
        this.resetThumbnails();
        this.timeTip.resetWidth();
        this.textLength = 0;
        this._updateAriaTextLimitedThrottled.reset();
    }
}

Object.assign(TimeSlider.prototype, ChaptersMixin, ThumbnailsMixin);

export default TimeSlider;
