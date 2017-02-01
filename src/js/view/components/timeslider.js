define([
    'utils/underscore',
    'utils/helpers',
    'utils/constants',
    'view/components/slider',
    'view/components/tooltip',
    'view/components/chapters.mixin',
    'view/components/thumbnails.mixin'
], function(_, utils, Constants, Slider, Tooltip, ChaptersMixin, ThumbnailsMixin) {

    var TimeTip = Tooltip.extend({
        setup : function() {

            this.text = document.createElement('span');
            this.text.className = 'jw-text jw-reset';
            this.img  = document.createElement('div');
            this.img.className = 'jw-reset';

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

            // mousemove/mouseout because this currently mouse specific functionality.
            this.el.addEventListener('mousemove', this.showTimeTooltip.bind(this), false);
            this.el.addEventListener('mouseout', this.hideTimeTooltip.bind(this), false);
        },
        limit: function(percent) {
            if (this.activeCue && _.isNumber(this.activeCue.pct)) {
                return this.activeCue.pct;
            }
            if (this._model.get('streamType') === 'DVR') {
                // When in DVR mode, only allow seeking up to the live edge - 25s
                // dvrSeekLimit is negative
                var seekableRange = this._model.get('seekableRange');
                var maxSeekPercentage = ((seekableRange + Constants.dvrSeekLimit) / seekableRange) * 100;
                percent = Math.min(maxSeekPercentage, percent);
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
            this.updateTime(position, model.get('duration'), model.get('seekableRange'));
        },
        onDuration : function(model, duration) {
            this.updateTime(model.get('position'), duration, model.get('seekableRange'));
        },
        updateTime : function(position, duration, seekableRange) {
            var streamType = this._model.get('streamType');
            if (!duration || streamType ===  'LIVE') {
                return;
            }

            var range = streamType === 'DVR' ? seekableRange : duration;
            this.render(position / range * 100);
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
            var seekableRange = this._model.get('seekableRange');
            var streamType = this._model.get('streamType');
            var position;
            if (duration === 0) {
                this._api.play(reasonInteraction());
            } else if (streamType === 'DVR') {
                position = (100 - percent) / 100 * seekableRange;
                this._api.seek(position, reasonInteraction());
            } else {
                position = percent / 100 * duration;
                this._api.seek(Math.min(position, duration - 0.25), reasonInteraction());
            }
        },
        showTimeTooltip: function(evt) {
            var  duration = this._model.get('duration');

            if (duration === 0) {
                return;
            }

            if (this._model.get('streamType') === 'DVR') {
                duration = -this._model.get('seekableRange');
            }

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
            this.timeTip.update(timetipText);
            this.showThumbnail(time);

            utils.addClass(this.timeTip.el, 'jw-open');
            this.timeTip.el.style.left = (pct*100) + '%';
        },

        hideTimeTooltip: function() {
            utils.removeClass(this.timeTip.el, 'jw-open');
        },

        reset : function() {
            this.resetChapters();
            this.resetThumbnails();
        }
    });

    _.extend(TimeSlider.prototype, ChaptersMixin, ThumbnailsMixin);

    return TimeSlider;
});
