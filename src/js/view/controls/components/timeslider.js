import { dvrSeekLimit } from 'view/constants';
import _ from 'utils/underscore';
import utils from 'utils/helpers';
import UI, { getPointerType } from 'utils/ui';
import Slider from 'view/controls/components/slider';
import Tooltip from 'view/controls/components/tooltip';
import ChaptersMixin from 'view/controls/components/chapters.mixin';
import ThumbnailsMixin from 'view/controls/components/thumbnails.mixin';

class TimeTip extends Tooltip {

    setup() {
        this.text = document.createElement('span');
        this.text.className = 'jw-text jw-reset';
        this.img = document.createElement('div');
        this.img.className = 'jw-time-thumb jw-reset';
        this.containerWidth = 0;
        this.textLength = 0;
        this.dragJustReleased = false;

        var wrapper = document.createElement('div');
        wrapper.className = 'jw-time-tip jw-reset';
        wrapper.appendChild(this.img);
        wrapper.appendChild(this.text);

        this.addContent(wrapper);
    }

    image(style) {
        utils.style(this.img, style);
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

        if (!this.container) {
            return;
        }

        this.containerWidth = utils.bounds(this.container).width + tolerance;
    }

    resetWidth () {
        this.containerWidth = 0;
    }
}

function reasonInteraction() {
    return { reason: 'interaction' };
}

class TimeSlider extends Slider {
    constructor(_model, _api) {
        super('jw-slider-time', 'horizontal');

        this._model = _model;
        this._api = _api;

        this.timeTip = new TimeTip('jw-tooltip-time', null, true);
        this.timeTip.setup();

        this.cues = [];

        // Store the attempted seek, until the previous one completes
        this.seekThrottled = _.throttle(this.performSeek, 400);
        this.mobileHoverDistance = 5;

        this.setup();
    }

    // These overwrite Slider methods
    setup() {
        super.setup.apply(this, arguments);

        this._model
            .on('change:duration', this.onDuration, this)
            .on('change:cues', this.addCues, this)
            .change('playlistItem', this.onPlaylistItem, this)
            .change('position', this.onPosition, this)
            .change('buffer', this.onBuffer, this)
            .change('streamType', this.onStreamType, this);

        this.elementRail.appendChild(this.timeTip.element());

        // Show the tooltip on while dragging (touch) moving(mouse), or moving over(mouse)
        this.elementUI = new UI(this.el, { useHover: true, useMove: true })
            .on('drag move over', this.showTimeTooltip.bind(this), this)
            .on('dragEnd out', this.hideTimeTooltip.bind(this), this);
    }

    limit(percent) {
        if (this.activeCue && _.isNumber(this.activeCue.pct)) {
            return this.activeCue.pct;
        }
        var duration = this._model.get('duration');
        if (this.streamType === 'DVR') {
            var position = (1 - (percent / 100)) * duration;
            var currentPosition = this._model.get('position');
            var updatedPosition = Math.min(position, Math.max(dvrSeekLimit, currentPosition));
            var updatedPercent = updatedPosition * 100 / duration;
            return 100 - updatedPercent;
        }
        return percent;
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
        this.drawCues();
    }

    onStreamType(model, streamType) {
        this.streamType = streamType;
    }

    updateTime(position, duration) {
        var pct = 0;
        if (duration) {
            if (this.streamType === 'DVR') {
                pct = (duration - position) / duration * 100;
            } else if (this.streamType === 'VOD' || !this.streamType) {
                // Default to VOD behavior if streamType isn't set
                pct = position / duration * 100;
            }
        }
        this.render(pct);
    }

    onPlaylistItem(model, playlistItem) {
        if (!playlistItem) {
            return;
        }
        this.reset();
        this.addCues(model.get('cues'));

        var tracks = playlistItem.tracks;
        _.each(tracks, function (track) {
            if (track && track.kind && track.kind.toLowerCase() === 'thumbnails') {
                this.loadThumbnails(track.file);
            } else if (track && track.kind && track.kind.toLowerCase() === 'chapters') {
                this.loadChapters(track.file);
            }
        }, this);
    }

    performSeek() {
        var percent = this.seekTo;
        var duration = this._model.get('duration');
        var position;
        if (duration === 0) {
            this._api.play(reasonInteraction());
        } else if (this.streamType === 'DVR') {
            position = (100 - percent) / 100 * duration;
            this._api.seek(position, reasonInteraction());
        } else {
            position = percent / 100 * duration;
            this._api.seek(Math.min(position, duration - 0.25), reasonInteraction());
        }
    }

    showTimeTooltip(evt) {
        var duration = this._model.get('duration');
        if (duration === 0) {
            return;
        }

        var playerWidth = this._model.get('containerWidth');
        var railBounds = utils.bounds(this.elementRail);
        var position = (evt.pageX ? (evt.pageX - railBounds.left) : evt.x);
        position = utils.between(position, 0, railBounds.width);
        var pct = position / railBounds.width;
        var time = duration * pct;

        // For DVR we need to swap it around
        if (duration < 0) {
            time = duration - time;
        }

        var timetipText;

        // With touch events, we never will get the hover events on the cues that cause cues to be active.
        // Therefore use the info we about the scroll position to detect if there is a nearby cue to be active.
        if (getPointerType(evt.sourceEvent) === 'touch') {
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
            var allowNegativeTime = true;
            timetipText = utils.timeFormat(time, allowNegativeTime);

            // If DVR and within live buffer
            if (duration < 0 && time > dvrSeekLimit) {
                timetipText = 'Live';
            }
        }
        var timeTip = this.timeTip;

        timeTip.update(timetipText);
        if (this.textLength !== timetipText.length) {
            // An activeCue may cause the width of the timeTip container to change
            this.textLength = timetipText.length;
            timeTip.resetWidth();
        }
        this.showThumbnail(time);

        utils.addClass(timeTip.el, 'jw-open');

        var timeTipWidth = timeTip.getWidth();
        var widthPct = railBounds.width / 100;
        var tolerance = playerWidth - railBounds.width;
        var timeTipPct = 0;
        if (timeTipWidth > tolerance) {
            // timeTip may go outside the bounds of the player. Determine the % of tolerance needed
            timeTipPct = (timeTipWidth - tolerance) / (2 * 100 * widthPct);
        }
        var safePct = Math.min(1 - timeTipPct, Math.max(timeTipPct, pct)).toFixed(3) * 100;
        utils.style(timeTip.el, { left: safePct + '%' });
    }

    hideTimeTooltip() {
        utils.removeClass(this.timeTip.el, 'jw-open');
    }

    addCues(model, cues) {
        if (cues && cues.length) {
            cues.forEach((ele) => {
                this.addCue(ele);
            });
            this.drawCues();
        } else {
            this.resetChapters();
        }
    }

    reset() {
        this.resetThumbnails();
        this.timeTip.resetWidth();
        this.textLength = 0;
    }
}

Object.assign(TimeSlider.prototype, ChaptersMixin, ThumbnailsMixin);

export default TimeSlider;
