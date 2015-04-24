define([
    'utils/underscore',
    'view/components/slider',
    'utils/helpers',
    'view/components/tooltip',
    'view/components/chapters.mixin',
    'view/components/thumbnails.mixin'
], function(_, Slider, utils, Tooltip, ChaptersMixin, ThumbnailsMixin) {

    var TimeTip = Tooltip.extend({
        setup : function() {
            var wrapper = document.createElement('div');
            wrapper.className = 'jw-time-tip';

            this.text = document.createElement('span');

            this.img = document.createElement('span');

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

    var TimeSlider = Slider.extend({
        constructor : function(_model, _api) {
            this._model = _model;
            this._api = _api;

            this.timeTip = new TimeTip();
            this.timeTip.setup();



            // Store the attempted seek, until the previous one completes
            this.seekThrottled = _.throttle(this.performSeek, 400);

            this.onPlaylistItem(this._model, this._model.get('playlistItem'));

            this._model
                .on('change:playlistItem', this.onPlaylistItem, this)
                .on('change:position', this.onPosition, this)
                .on('change:buffer', this.onBuffer, this);

            _api.on('seeked', this.onSeeked, this);

            Slider.call(this, 'jw-time', 'horizontal');
        },

        // These overwrite Slider methods
        setup : function() {
            Slider.prototype.setup.apply(this, arguments);

            this.elementRail.appendChild(this.timeTip.element());
            this.elementRail.addEventListener('mousemove', this.showTimeTooltip.bind(this), false);
            this.elementRail.addEventListener('mouseout', this.hideTimeTooltip.bind(this), false);
        },
        update: function(pct) {
            if (this.activeCue) {
                this.seekTo = this.activeCue.pct;
            } else {
                this.seekTo = pct;
            }
            this.seekThrottled();
            Slider.prototype.update.apply(this, arguments);
        },
        dragStart : function() {
            this._model.set('scrubbing', true);
            Slider.prototype.dragStart.apply(this, arguments);
        },
        dragEnd : function() {
            this._model.set('scrubbing', false);
            Slider.prototype.dragEnd.apply(this, arguments);
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
        onPosition : function(model, pos) {
            var pct = pos / this._api.getDuration() * 100;
            this.render(pct);
        },
        onPlaylistItem : function (model, playlistItem) {
            this.reset();
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

        // These are new methods
        performSeek : function () {
            var duration = this._model.get('duration');
            if (duration <= 0) {
                this._api.play();
            } else {
                var position = this.seekTo / 100 * this._api.getDuration();
                this._api.seek(position);
            }
        },
        showTimeTooltip: function(evt) {
            var duration = this._model.get('duration');
            if (duration <= 0) {
                return;
            }

            var _railBounds = utils.bounds(this.elementRail);
            var position = (evt.pageX ? (evt.pageX - _railBounds.left) : evt.x);
            position = utils.between(position, 0, _railBounds.width);
            var pct = position / _railBounds.width;
            var time = duration * pct;

            var timetipText;
            if (this.activeCue) {
                timetipText = this.activeCue.text;
            } else {
                timetipText = utils.timeFormat(time);
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
