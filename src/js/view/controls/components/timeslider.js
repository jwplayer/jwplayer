import { throttle, each } from 'utils/underscore';
import { between } from 'utils/math';
import { style } from 'utils/css';
import { timeFormat } from 'utils/parser';
import { addClass, removeClass, setAttribute, bounds } from 'utils/dom';
import UI from 'utils/ui';
import Slider from 'view/controls/components/slider';
import TooltipIcon from 'view/controls/components/tooltipicon';
import ChaptersMixin from 'view/controls/components/chapters.mixin';
import ThumbnailsMixin from 'view/controls/components/thumbnails.mixin';

class TimeTipIcon extends TooltipIcon {

    setup() {
        this.text = document.createElement('span');
        this.text.className = 'jw-text jw-reset';
        this.img = document.createElement('div');
        this.img.className = 'jw-time-thumb jw-reset';
        this.containerWidth = 0;
        this.textLength = 0;
        this.dragJustReleased = false;

        const wrapper = document.createElement('div');
        wrapper.className = 'jw-time-tip jw-reset';
        wrapper.appendChild(this.img);
        wrapper.appendChild(this.text);

        this.addContent(wrapper);
    }

    image(styles) {
        style(this.img, styles);
    }

    update(txt) {
        this.text.textContent = txt;
    }

    getWidth () {
        if (!this.containerWidth) {
            this.setWidth();
        }

        return this.containerWidth;
    }

    setWidth (width) {
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

    resetWidth () {
        this.containerWidth = 0;
    }
}

function reasonInteraction() {
    return { reason: 'interaction' };
}

class TimeSlider extends Slider {
    constructor(_model, _api, _timeUpdateKeeper) {
        super('jw-slider-time', 'horizontal');

        this._model = _model;
        this._api = _api;

        this.timeUpdateKeeper = _timeUpdateKeeper;

        this.timeTip = new TimeTipIcon('jw-tooltip-time', null, true);
        this.timeTip.setup();

        this.cues = [];

        // Store the attempted seek, until the previous one completes
        this.seekThrottled = throttle(this.performSeek, 400);
        this.mobileHoverDistance = 5;

        this.setup();
    }

    // These overwrite Slider methods
    setup() {
        super.setup.apply(this, arguments);

        this._model
            .on('change:duration', this.onDuration, this)
            .on('change:cues', this.updateCues, this)
            .on('seeked', () => {
                if (!this._model.get('scrubbing')) {
                    this.updateAriaText();
                }
            })
            .change('position', this.onPosition, this)
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
            .on('focus', this.updateAriaText, this);
    }

    update(percent) {
        this.seekTo = percent;
        this.seekThrottled();
        super.update.apply(this, arguments);
    }

    dragStart() {
        this._model.set('scrubbing', true);
        super.dragStart.apply(this, arguments);
    }

    dragEnd() {
        super.dragEnd.apply(this, arguments);
        this._model.set('scrubbing', false);
    }

    onBuffer(model, pct) {
        this.updateBuffer(pct);
    }

    onPosition(model, position) {
        this.updateTime(position, model.get('duration'));
    }

    onDuration(model, duration) {
        this.updateTime(model.get('position'), duration);
        setAttribute(this.el, 'aria-valuemin', 0);
        setAttribute(this.el, 'aria-valuemax', duration);
        this.drawCues();
    }

    onStreamType(model, streamType) {
        this.streamType = streamType;
    }

    updateTime(position, duration) {
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
        this.render(pct);
    }

    onPlaylistItem(model, playlistItem) {
        this.reset();

        //  If cues have been cleared from slider but exist on model, update cues.
        const cues = model.get('cues');
        if (!this.cues.length && cues.length) {
            this.updateCues(null, cues);
        }

        const tracks = playlistItem.tracks;
        each(tracks, function (track) {
            if (track && track.kind && track.kind.toLowerCase() === 'thumbnails') {
                this.loadThumbnails(track.file);
            } else if (track && track.kind && track.kind.toLowerCase() === 'chapters') {
                this.loadChapters(track.file);
            }
        }, this);
    }

    performSeek() {
        const percent = this.seekTo;
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

    showTimeTooltip(evt) {
        let duration = this._model.get('duration');
        if (duration === 0) {
            return;
        }

        const playerWidth = this._model.get('containerWidth');
        const railBounds = bounds(this.elementRail);
        let position = (evt.pageX ? (evt.pageX - railBounds.left) : evt.x);
        position = between(position, 0, railBounds.width);
        const pct = position / railBounds.width;
        let time = duration * pct;

        // For DVR we need to swap it around
        if (duration < 0) {
            const dvrSeekLimit = this._model.get('dvrSeekLimit');
            duration += dvrSeekLimit;
            time = (duration * pct);
            time = duration - time;
        }

        let timetipText;

        // With touch events, we never will get the hover events on the cues that cause cues to be active.
        // Therefore use the info we about the scroll position to detect if there is a nearby cue to be active.
        if (evt.pointerType === 'touch') {
            this.activeCue = this.cues.reduce((closeCue, cue) => {
                if (Math.abs(position - (parseInt(cue.pct) / 100 * railBounds.width)) < this.mobileHoverDistance) {
                    return cue;
                }
                return closeCue;
            }, undefined);
        }

        if (this.activeCue) {
            timetipText = this.activeCue.text;
        } else {
            const allowNegativeTime = true;
            timetipText = timeFormat(time, allowNegativeTime);

            // If DVR and within live buffer
            if (duration < 0 && time > -1) {
                timetipText = 'Live';
            }
        }
        const timeTip = this.timeTip;

        timeTip.update(timetipText);
        if (this.textLength !== timetipText.length) {
            // An activeCue may cause the width of the timeTip container to change
            this.textLength = timetipText.length;
            timeTip.resetWidth();
        }
        this.showThumbnail(time);

        addClass(timeTip.el, 'jw-open');

        const timeTipWidth = timeTip.getWidth();
        const widthPct = railBounds.width / 100;
        const tolerance = playerWidth - railBounds.width;
        let timeTipPct = 0;
        if (timeTipWidth > tolerance) {
            // timeTip may go outside the bounds of the player. Determine the % of tolerance needed
            timeTipPct = (timeTipWidth - tolerance) / (2 * 100 * widthPct);
        }
        const safePct = Math.min(1 - timeTipPct, Math.max(timeTipPct, pct)).toFixed(3) * 100;
        style(timeTip.el, { left: safePct + '%' });
    }

    hideTimeTooltip() {
        removeClass(this.timeTip.el, 'jw-open');
    }

    updateCues(model, cues) {
        this.resetCues();
        if (cues && cues.length) {
            cues.forEach((ele) => {
                this.addCue(ele);
            });
            this.drawCues();
        }
    }

    updateAriaText() {
        const model = this._model;
        if (model.get('seeking')) {
            return;
        }
        const position = model.get('position');
        const duration = model.get('duration');

        let ariaText = timeFormat(position);
        if (this.streamType !== 'DVR') {
            ariaText += ` of ${timeFormat(duration)}`;
        }

        const sliderElement = this.el;
        if (document.activeElement !== sliderElement) {
            this.timeUpdateKeeper.textContent = ariaText;
        }
        setAttribute(sliderElement, 'aria-valuenow', position);
        setAttribute(sliderElement, 'aria-valuetext', ariaText);
    }

    reset() {
        this.resetThumbnails();
        this.timeTip.resetWidth();
        this.textLength = 0;
    }
}

Object.assign(TimeSlider.prototype, ChaptersMixin, ThumbnailsMixin);

export default TimeSlider;
