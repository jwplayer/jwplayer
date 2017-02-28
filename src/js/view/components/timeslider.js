define([
    'utils/underscore',
    'utils/helpers',
    'utils/constants',
    'utils/ui',
    'view/components/slider',
    'view/components/tooltip',
    'view/components/chapters.mixin',
    'view/components/thumbnails.mixin'
], function(_, utils, Constants, UI, Slider, Tooltip, ChaptersMixin, ThumbnailsMixin) {

    var TimeTip = Tooltip.extend({
        setup : function() {

            this.text = document.createElement('span');
            this.text.className = 'jw-text jw-reset';
            this.img  = document.createElement('div');
            this.img.className = 'jw-reset';
            this.resetWidth();
            this.textLength = 0;
            this.dragJustReleased = false;

            var wrapper = document.createElement('div');
            wrapper.className = 'jw-time-tip jw-background-color jw-reset';
            wrapper.appendChild(this.img);
            wrapper.appendChild(this.text);

            utils.removeClass(this.el, 'jw-hidden');

            this.addContent(wrapper);
        },

        image : function(style) {
            utils.style(this.img, style);
        },

        update : function(txt) {
            this.text.innerHTML = txt;
        },
        getWidth : function () {
            if (!this.containerWidth) {
                this.setWidth();
            }

            return this.containerWidth;
        },
        setWidth : function (width) {
            if (width) {
                this.containerWidth = width + 16; // add a little padding so the image isn't flush against the edge
                return;
            }

            if (!this.container) {
                return;
            }

            this.containerWidth = utils.bounds(this.container).width;
        },
        resetWidth : function () {
            this.containerWidth = 0;
        }
    });

    function reasonInteraction() {
        return {reason: 'interaction'};
    }

    var TimeSlider = Slider.extend({
        constructor : function(_model, _api) {
            this._model = _model;
            this._api = _api;

            this.timeTip = new TimeTip('jw-tooltip-time');
            this.timeTip.setup();

            this.cues = [];

            // Store the attempted seek, until the previous one completes
            this.seekThrottled = _.throttle(this.performSeek, 400);
            this.mobileHoverDistance = 5;

            this._model
                .on('change:playlistItem', this.onPlaylistItem, this)
                .on('change:position', this.onPosition, this)
                .on('change:duration', this.onDuration, this)
                .on('change:buffer', this.onBuffer, this);

            Slider.call(this, 'jw-slider-time', 'horizontal');
        },

        // These overwrite Slider methods
        setup : function() {
            Slider.prototype.setup.apply(this, arguments);

            if (this._model.get('playlistItem')) {
                this.onPlaylistItem(this._model, this._model.get('playlistItem'));
            }

            this.elementRail.appendChild(this.timeTip.element());

            // Show the tooltip on while dragging (touch) moving(mouse), or moving over(mouse)
            this.elementUI = new UI(this.el, {'useHover': true, 'useMove': true})
                .on('drag move over', this.showTimeTooltip.bind(this), this)
                .on('dragEnd out', this.hideTimeTooltip.bind(this), this);
        },
        limit: function(percent) {
            if (this.activeCue && _.isNumber(this.activeCue.pct)) {
                return this.activeCue.pct;
            }
            var duration = this._model.get('duration');
            var streamType = this._model.get('streamType');
            if (streamType === 'DVR') {
                var position = (1 - (percent / 100)) * duration;
                var currentPosition = this._model.get('position');
                var updatedPosition = Math.min(position, Math.max(Constants.dvrSeekLimit, currentPosition));
                var updatedPercent = updatedPosition * 100 / duration;
                return 100 - updatedPercent;
            }
            return percent;
        },
        update: function(percent) {
            this.seekTo = percent;
            this.seekThrottled();
            Slider.prototype.update.apply(this, arguments);
        },
        dragStart : function() {
            this._model.set('scrubbing', true);
            Slider.prototype.dragStart.apply(this, arguments);
        },
        dragEnd : function() {
            Slider.prototype.dragEnd.apply(this, arguments);
            this._model.set('scrubbing', false);
            this.dragJustReleased = true;
        },


        // Event Listeners
        onSeeked : function () {
            // When we are done scrubbing there will be a final seeked event
            if (this._model.get('scrubbing')) {
                this.performSeek();
            }
        },
        onBuffer : function (model, pct) {
            this.updateBuffer(pct);
        },
        onPosition : function(model, position) {
            if(this.dragJustReleased) {
                //prevents firing an outdated position and causing the timeslider to jump back and forth
                this.dragJustReleased = false;
                return;
            }
            this.updateTime(position, model.get('duration'));
        },
        onDuration : function(model, duration) {
            this.updateTime(model.get('position'), duration);
        },
        updateTime : function(position, duration) {
            var pct = 0;
            if (duration) {
                var streamType = this._model.get('streamType');
                if (streamType === 'DVR') {
                    pct = (duration - position) / duration * 100;
                } else if (streamType === 'VOD') {
                    pct = position / duration * 100;
                }
            }
            this.render(pct);
        },
        onPlaylistItem : function (model, playlistItem) {
            this.reset();

            model.mediaModel.on('seeked', this.onSeeked, this);

            var tracks = playlistItem.tracks;
            _.each(tracks, function (track) {
                if (track && track.kind && track.kind.toLowerCase() === 'thumbnails') {
                    this.loadThumbnails(track.file);
                }
                else if (track && track.kind && track.kind.toLowerCase() === 'chapters') {
                    this.loadChapters(track.file);
                }
            }, this);
        },

        performSeek : function() {
            var percent = this.seekTo;
            var duration = this._model.get('duration');
            var streamType = this._model.get('streamType');
            var position;
            if (duration === 0) {
                this._api.play(reasonInteraction());
            } else if (streamType === 'DVR') {
                position = (100 - percent) / 100 * duration;
                this._api.seek(position, reasonInteraction());
            } else {
                position = percent / 100 * duration;
                this._api.seek(Math.min(position, duration - 0.25), reasonInteraction());
            }
        },
        showTimeTooltip: function(evt) {
            var duration = this._model.get('duration');
            if (duration === 0) {
                return;
            }

            var playerWidth = this._model.get('containerWidth');
            var _railBounds = utils.bounds(this.elementRail);
            var position = (evt.pageX ? (evt.pageX - _railBounds.left) : evt.x);
            position = utils.between(position, 0, _railBounds.width);
            var pct = position / _railBounds.width;
            var time = duration * pct;

            // For DVR we need to swap it around
            if (duration < 0) {
                time = duration - time;
            }

            var timetipText;

            // With touch events, we never will get the hover events on the cues that cause cues to be active.
            // Therefore use the info we about the scroll position to detect if there is a nearby cue to be active.
            if (UI.getPointerType(evt.sourceEvent) === 'touch') {
                this.activeCue = _.reduce(this.cues, function(closeCue, cue) {
                    if (Math.abs(position - (parseInt(cue.pct) / 100 * _railBounds.width)) < this.mobileHoverDistance) {
                        return cue;
                    }
                    return closeCue;
                }.bind(this), undefined);
            }

            if (this.activeCue) {
                timetipText = this.activeCue.text;
            } else {
                var allowNegativeTime = true;
                timetipText = utils.timeFormat(time, allowNegativeTime);

                // If DVR and within live buffer
                if (duration < 0 && time > Constants.dvrSeekLimit) {
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
            var widthPct = _railBounds.width / 100;
            var tolerance = playerWidth - _railBounds.width;
            var timeTipPct = 0;
            if (timeTipWidth > tolerance) {
                // timeTip may go outside the bounds of the player. Determine the % of tolerance needed
                timeTipPct = (timeTipWidth - tolerance) / (2 * 100 * widthPct);
            }
            var safePct = Math.min(1 - timeTipPct, Math.max(timeTipPct, pct)).toFixed(3) * 100;
            utils.style(timeTip.el, {'left': safePct + '%'});
        },

        hideTimeTooltip: function() {
            utils.removeClass(this.timeTip.el, 'jw-open');
        },

        reset : function() {
            this.resetChapters();
            this.resetThumbnails();
            this.timeTip.resetWidth();
            this.textLength = 0;
        }
    });

    _.extend(TimeSlider.prototype, ChaptersMixin, ThumbnailsMixin);

    return TimeSlider;
});
